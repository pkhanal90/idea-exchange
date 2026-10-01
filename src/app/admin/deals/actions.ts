"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireVerifiedAdmin } from "@/lib/rbac";
import { recordAuditLog } from "@/lib/audit-log";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { sendDealCancelledEmail } from "@/lib/notifications/deal-emails";

export async function adminCancelDealAction(dealId: string, formData: FormData) {
  const session = await requireVerifiedAdmin();
  const reason = String(formData.get("reason") ?? "").trim() || "Cancelled by admin.";

  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id: dealId },
    include: { listing: true, seller: true, buyer: true },
  });
  if (deal.stage === "COMPLETE" || deal.stage === "CANCELLED") return;

  // Same pattern as the party-facing cancelDealAction: an uncaptured intent
  // is cancelled, not refunded — it was never actually charged.
  if (deal.stripePaymentIntentId && !deal.escrowReleasedAt && stripeEnabled) {
    await stripe.paymentIntents.cancel(deal.stripePaymentIntentId).catch(() => {
      // Already captured or canceled upstream — nothing more to do.
    });
  }

  await prisma.$transaction([
    prisma.deal.update({
      where: { id: dealId },
      data: { stage: "CANCELLED", cancelledAt: new Date(), cancelReason: reason },
    }),
    prisma.listing.updateMany({
      where: { id: deal.listingId, status: "UNDER_OFFER" },
      data: { status: "PUBLISHED" },
    }),
  ]);

  await recordAuditLog({
    actorId: session.user.id,
    action: "DEAL_CANCELLED",
    targetType: "Deal",
    targetId: dealId,
    beforeState: { stage: deal.stage },
    afterState: { stage: "CANCELLED", reason },
  });

  await Promise.all([
    sendDealCancelledEmail(deal.seller, deal.listing, dealId, reason),
    sendDealCancelledEmail(deal.buyer, deal.listing, dealId, reason),
  ]);

  revalidatePath("/admin/deals");
  revalidatePath(`/deals/${dealId}`);
}

export async function adminMarkDisputedAction(dealId: string, formData: FormData) {
  const session = await requireVerifiedAdmin();
  const reason = String(formData.get("reason") ?? "").trim() || "Flagged for manual review.";

  const deal = await prisma.deal.findUniqueOrThrow({ where: { id: dealId }, select: { stage: true } });
  if (deal.stage === "COMPLETE" || deal.stage === "CANCELLED" || deal.stage === "DISPUTED") return;

  await prisma.deal.update({
    where: { id: dealId },
    data: { stage: "DISPUTED", disputedAt: new Date(), disputeReason: reason },
  });

  await recordAuditLog({
    actorId: session.user.id,
    action: "DEAL_MARKED_DISPUTED",
    targetType: "Deal",
    targetId: dealId,
    beforeState: { stage: deal.stage },
    afterState: { stage: "DISPUTED", reason },
  });

  revalidatePath("/admin/deals");
  revalidatePath(`/deals/${dealId}`);
}

// Only a COMPLETE deal has an actually-captured payment intent (capture
// happens exactly at that transition in completeDealAction) — anything
// earlier is an authorization hold, which adminCancelDealAction releases
// instead via paymentIntents.cancel.
export async function adminRefundDealAction(dealId: string, formData: FormData) {
  const session = await requireVerifiedAdmin();
  const reason = String(formData.get("reason") ?? "").trim();

  const deal = await prisma.deal.findUniqueOrThrow({ where: { id: dealId } });
  if (deal.stage !== "COMPLETE") throw new Error("Only a completed deal can be refunded.");
  if (!deal.stripePaymentIntentId) throw new Error("This deal has no captured payment to refund.");
  if (deal.refundedAt) throw new Error("This deal has already been refunded.");

  let refundId: string | null = null;
  if (stripeEnabled) {
    const refund = await stripe.refunds.create({ payment_intent: deal.stripePaymentIntentId });
    refundId = refund.id;
  }

  await prisma.deal.update({
    where: { id: dealId },
    data: { refundedAt: new Date(), stripeRefundId: refundId },
  });

  await recordAuditLog({
    actorId: session.user.id,
    action: "DEAL_REFUNDED",
    targetType: "Deal",
    targetId: dealId,
    beforeState: { refundedAt: null },
    afterState: {
      refundedAt: new Date().toISOString(),
      stripeRefundId: refundId,
      reason: reason || undefined,
    },
  });

  revalidatePath("/admin/deals");
  revalidatePath(`/deals/${dealId}`);
}
