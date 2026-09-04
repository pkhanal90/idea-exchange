"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, stripeEnabled, platformFeeCents } from "@/lib/stripe";

async function loadDealForParty(dealId: string) {
  const session = await auth();
  if (!session?.user) redirect(`/auth/signin?callbackUrl=/deals/${dealId}`);

  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id: dealId },
    include: { listing: true, seller: true, buyer: true },
  });

  const isParty = session.user.id === deal.sellerId || session.user.id === deal.buyerId;
  if (!isParty && session.user.role !== "ADMIN") throw new Error("Forbidden");

  return { session, deal };
}

export async function proceedToEscrowAction(dealId: string) {
  const { deal } = await loadDealForParty(dealId);
  if (deal.stage !== "AGREEMENT_PENDING") return;

  const hasCash = Boolean(deal.finalAmount && Number(deal.finalAmount) > 0);

  await prisma.deal.update({
    where: { id: dealId },
    data: hasCash
      ? { stage: "ESCROW_PENDING" }
      : { stage: "ESCROW_HELD", escrowFundedAt: new Date() }, // nothing to fund on a pure equity/royalty deal
  });

  revalidatePath(`/deals/${dealId}`);
}

export async function createEscrowCheckoutAction(dealId: string) {
  const { session, deal } = await loadDealForParty(dealId);

  if (session.user.id !== deal.buyerId) throw new Error("Only the buyer can fund escrow.");
  if (deal.stage !== "ESCROW_PENDING") return;
  if (!stripeEnabled) throw new Error("Stripe is not configured.");
  if (!deal.seller.stripeConnectAccountId || !deal.seller.stripeConnectOnboarded) {
    throw new Error("The seller hasn't finished connecting their payout account yet.");
  }
  if (!deal.finalAmount) throw new Error("This deal has no cash amount to escrow.");

  const origin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const amountCents = Math.round(Number(deal.finalAmount) * 100);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: deal.buyer.email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: {
            name: `Escrow — ${deal.listing.title}`,
            description: "Held until both parties confirm the IP assignment. Test mode.",
          },
        },
      },
    ],
    payment_intent_data: {
      capture_method: "manual", // escrow-style hold, not instant capture
      application_fee_amount: platformFeeCents(amountCents),
      transfer_data: { destination: deal.seller.stripeConnectAccountId },
    },
    metadata: { dealId },
    success_url: `${origin}/deals/${dealId}?checkout=success`,
    cancel_url: `${origin}/deals/${dealId}?checkout=cancelled`,
  });

  await prisma.deal.update({
    where: { id: dealId },
    data: { stripeCheckoutSessionId: checkoutSession.id },
  });

  redirect(checkoutSession.url!);
}

export async function generateIpAssignmentAction(dealId: string) {
  const { deal } = await loadDealForParty(dealId);
  if (deal.stage !== "ESCROW_HELD") return;

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      stage: "IP_ASSIGNMENT_PENDING",
      ipAssignmentDocUrl: `/deals/${dealId}/ip-assignment`,
      ipAssignmentGeneratedAt: new Date(),
    },
  });

  revalidatePath(`/deals/${dealId}`);
}

export async function completeDealAction(dealId: string) {
  const { deal } = await loadDealForParty(dealId);
  if (deal.stage !== "IP_ASSIGNMENT_PENDING") return;

  if (deal.stripePaymentIntentId) {
    if (!stripeEnabled) throw new Error("Stripe is not configured.");
    await stripe.paymentIntents.capture(deal.stripePaymentIntentId);
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.deal.update({
      where: { id: dealId },
      data: {
        stage: "COMPLETE",
        ipAssignmentSignedAt: now,
        escrowReleasedAt: deal.stripePaymentIntentId ? now : deal.escrowReleasedAt,
        completedAt: now,
      },
    }),
    prisma.listing.update({
      where: { id: deal.listingId },
      data: { status: "SOLD", soldAt: now },
    }),
  ]);

  revalidatePath(`/deals/${dealId}`);
  revalidatePath(`/listings/${deal.listingId}`);
}

export async function submitRatingAction(dealId: string, formData: FormData) {
  const { session, deal } = await loadDealForParty(dealId);
  if (deal.stage !== "COMPLETE") throw new Error("This deal isn't complete yet.");

  const rateeId = session.user.id === deal.sellerId ? deal.buyerId : deal.sellerId;
  const score = Number(formData.get("score"));
  const comment = String(formData.get("comment") ?? "").trim();
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error("Rating must be between 1 and 5.");
  }

  await prisma.rating.upsert({
    where: { dealId_raterId: { dealId, raterId: session.user.id } },
    update: { score, comment: comment || null },
    create: { dealId, raterId: session.user.id, rateeId, score, comment: comment || null },
  });

  revalidatePath(`/deals/${dealId}`);
}

export async function cancelDealAction(dealId: string, formData: FormData) {
  const { deal } = await loadDealForParty(dealId);
  if (deal.stage === "COMPLETE" || deal.stage === "CANCELLED") return;

  if (deal.stripePaymentIntentId && !deal.escrowReleasedAt && stripeEnabled) {
    await stripe.paymentIntents.cancel(deal.stripePaymentIntentId).catch(() => {
      // Already captured or canceled upstream — nothing more to do.
    });
  }

  const reason = String(formData.get("reason") ?? "").trim();

  await prisma.$transaction([
    prisma.deal.update({
      where: { id: dealId },
      data: {
        stage: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: reason || "Cancelled by a party to the deal.",
      },
    }),
    prisma.listing.updateMany({
      where: { id: deal.listingId, status: "UNDER_OFFER" },
      data: { status: "PUBLISHED" },
    }),
  ]);

  revalidatePath(`/deals/${dealId}`);
  revalidatePath(`/listings/${deal.listingId}`);
}
