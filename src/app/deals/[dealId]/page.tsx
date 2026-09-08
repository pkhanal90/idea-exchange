import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OfferTermsSummary } from "@/components/offers/offer-terms-summary";
import { CategoryIcon } from "@/components/listings/category-icon";
import { DealActionForm, CancelDealControl } from "@/components/deals/deal-actions";
import { RatingForm } from "@/components/deals/rating-form";
import {
  proceedToEscrowAction,
  createEscrowCheckoutAction,
  generateIpAssignmentAction,
  completeDealAction,
  cancelDealAction,
  submitRatingAction,
} from "@/app/deals/[dealId]/actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, FileText, Lock, XCircle } from "lucide-react";
import type { DealStage } from "@prisma/client";

interface DealPageProps {
  params: Promise<{ dealId: string }>;
  searchParams: Promise<{ checkout?: string }>;
}

const STAGE_STEPS: { stage: DealStage; label: string }[] = [
  { stage: "AGREEMENT_PENDING", label: "Agreement" },
  { stage: "ESCROW_PENDING", label: "Escrow" },
  { stage: "IP_ASSIGNMENT_PENDING", label: "IP Assignment" },
  { stage: "COMPLETE", label: "Complete" },
];

export default async function DealRoomPage({ params, searchParams }: DealPageProps) {
  const { dealId } = await params;
  const { checkout } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect(`/auth/signin?callbackUrl=/deals/${dealId}`);

  let deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: { listing: true, seller: true, buyer: true },
  });
  if (!deal) notFound();

  const userId = session.user.id;
  const isSeller = userId === deal.sellerId;
  const isBuyer = userId === deal.buyerId;
  if (!isSeller && !isBuyer && session.user.role !== "ADMIN") notFound();

  // Local dev usually has no Stripe webhook forwarded — reconcile escrow
  // funding live from Stripe whenever we're still waiting on it.
  if (stripeEnabled && deal.stage === "ESCROW_PENDING" && deal.stripeCheckoutSessionId) {
    const checkoutSession = await stripe.checkout.sessions.retrieve(deal.stripeCheckoutSessionId, {
      expand: ["payment_intent"],
    });
    const paymentIntent =
      typeof checkoutSession.payment_intent === "object" ? checkoutSession.payment_intent : null;
    if (paymentIntent && ["requires_capture", "succeeded"].includes(paymentIntent.status)) {
      deal = await prisma.deal.update({
        where: { id: dealId, stage: "ESCROW_PENDING" },
        data: {
          stripePaymentIntentId: paymentIntent.id,
          escrowFundedAt: new Date(),
          stage: "ESCROW_HELD",
        },
        include: { listing: true, seller: true, buyer: true },
      }).catch(() => deal!);
    }
  }

  const otherParty = isSeller ? deal.buyer : deal.seller;
  const hasCash = Boolean(deal.finalAmount && Number(deal.finalAmount) > 0);
  const myRating = await prisma.rating.findUnique({
    where: { dealId_raterId: { dealId, raterId: userId } },
  });

  const proceedAction = proceedToEscrowAction.bind(null, dealId);
  const checkoutAction = createEscrowCheckoutAction.bind(null, dealId);
  const generateDocAction = generateIpAssignmentAction.bind(null, dealId);
  const completeAction = completeDealAction.bind(null, dealId);
  const cancelAction = cancelDealAction.bind(null, dealId);
  const rateAction = submitRatingAction.bind(null, dealId);

  return (
    <Container className="max-w-2xl py-10">
      <Link
        href={`/listings/${deal.listingId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {deal.listing.title}
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CategoryIcon category={deal.listing.category} size="sm" />
          <h1 className="text-xl font-semibold text-ink-900">Deal room</h1>
        </div>
        {deal.stage !== "CANCELLED" && <StageBadge stage={deal.stage} />}
      </div>
      <p className="mt-1 text-sm text-ink-500">
        With {otherParty.name ?? otherParty.email} · {isSeller ? "you're the seller" : "you're the buyer"}
      </p>

      {deal.stage !== "CANCELLED" && (
        <div className="mt-6 flex items-center gap-2">
          {STAGE_STEPS.map((step, i) => {
            const currentIndex = STAGE_STEPS.findIndex((s) => s.stage === deal!.stage);
            const done = i < currentIndex || deal!.stage === "COMPLETE";
            const active = step.stage === deal!.stage;
            return (
              <div key={step.stage} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    done || active
                      ? "bg-gradient-to-br from-accent-500 to-accent-700 text-white shadow-sm"
                      : "bg-ink-100 text-ink-400"
                  }`}
                >
                  {done && !active ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={`text-xs ${active ? "font-semibold text-ink-900" : "text-ink-400"}`}>
                  {step.label}
                </span>
                {i < STAGE_STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
              </div>
            );
          })}
        </div>
      )}

      <Card className="mt-6">
        <CardContent>
          <p className="text-xs font-medium text-ink-400">Agreed terms</p>
          <div className="mt-1">
            <OfferTermsSummary
              amount={deal.finalAmount}
              equityPercent={deal.finalEquityPercent}
              royaltyPercent={deal.finalRoyaltyPercent}
              royaltyTermMonths={null}
            />
          </div>
        </CardContent>
      </Card>

      {checkout === "cancelled" && (
        <p className="mt-4 rounded-lg border border-warning-500/30 bg-warning-50 px-3.5 py-2.5 text-sm text-warning-700">
          Checkout was cancelled — you can try funding escrow again below.
        </p>
      )}

      <div className="mt-6">
        {deal.stage === "AGREEMENT_PENDING" && (
          <Card>
            <CardContent className="space-y-3">
              <p className="text-sm text-ink-600">
                Terms are agreed. {hasCash ? "Next, the buyer funds escrow." : "This deal has no cash component, so escrow is skipped."}
              </p>
              <DealActionForm
                action={proceedAction}
                label={hasCash ? "Proceed to escrow" : "Proceed to IP assignment"}
                pendingLabel="Proceeding…"
              />
            </CardContent>
          </Card>
        )}

        {deal.stage === "ESCROW_PENDING" && (
          <Card>
            <CardContent className="space-y-3">
              {!stripeEnabled ? (
                <p className="text-sm text-warning-700">
                  Stripe isn&apos;t configured in this environment — escrow funding is unavailable.
                </p>
              ) : !deal.seller.stripeConnectOnboarded ? (
                <p className="text-sm text-ink-500">
                  Waiting for the seller to finish connecting their Stripe payout account.
                </p>
              ) : isBuyer ? (
                <>
                  <p className="text-sm text-ink-600">
                    Fund escrow for {formatCurrency(deal.finalAmount as never)}. Stripe holds the
                    payment (test mode, manual capture) until the IP assignment is confirmed.
                  </p>
                  <DealActionForm
                    action={checkoutAction}
                    label={`Fund escrow — ${formatCurrency(deal.finalAmount as never)}`}
                    pendingLabel="Redirecting to Stripe…"
                  />
                </>
              ) : (
                <p className="text-sm text-ink-500">Waiting for the buyer to fund escrow.</p>
              )}
            </CardContent>
          </Card>
        )}

        {deal.stage === "ESCROW_HELD" && (
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-success-700">
                <Lock className="h-4 w-4" />
                {hasCash
                  ? `Escrow funded — ${formatCurrency(deal.finalAmount as never)} held since ${formatDate(deal.escrowFundedAt)}`
                  : "Terms confirmed — no cash held in escrow"}
              </div>
              <p className="text-sm text-ink-600">
                Either party can generate the IP assignment document to move this deal forward.
              </p>
              <DealActionForm
                action={generateDocAction}
                label="Generate IP assignment document"
                pendingLabel="Generating…"
              />
            </CardContent>
          </Card>
        )}

        {deal.stage === "IP_ASSIGNMENT_PENDING" && (
          <Card>
            <CardContent className="space-y-3">
              <a
                href={`/deals/${dealId}/ip-assignment`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium text-ink-700 hover:bg-ink-50"
              >
                <FileText className="h-4 w-4" />
                View IP assignment document
              </a>
              <p className="text-sm text-ink-500">
                Confirming below represents both parties signing this document (mocked — no real
                e-signature vendor is involved in this prototype) and releases escrow to the
                seller.
              </p>
              <DealActionForm
                action={completeAction}
                label="Confirm & complete deal"
                pendingLabel="Completing…"
              />
            </CardContent>
          </Card>
        )}

        {deal.stage === "COMPLETE" && (
          <div className="space-y-4">
            <Card className="border-success-500/30 bg-success-50">
              <CardContent className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success-700" />
                <p className="text-sm font-medium text-success-700">
                  Deal completed {formatDate(deal.completedAt)} — ownership transferred.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                {myRating ? (
                  <p className="text-sm text-ink-500">
                    You rated {otherParty.name ?? "the other party"} {myRating.score}/5.
                    {myRating.comment && <> &ldquo;{myRating.comment}&rdquo;</>}
                  </p>
                ) : (
                  <RatingForm
                    action={rateAction}
                    rateeLabel={otherParty.name ?? otherParty.email ?? "the other party"}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {deal.stage === "CANCELLED" && (
          <Card className="border-danger-500/30 bg-danger-50">
            <CardContent className="flex items-start gap-2">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-700" />
              <div>
                <p className="text-sm font-medium text-danger-700">Deal cancelled</p>
                {deal.cancelReason && <p className="mt-1 text-sm text-danger-700/80">{deal.cancelReason}</p>}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {deal.stage !== "COMPLETE" && deal.stage !== "CANCELLED" && (
        <div className="mt-4">
          <CancelDealControl action={cancelAction} />
        </div>
      )}
    </Container>
  );
}

function StageBadge({ stage }: { stage: DealStage }) {
  const label = STAGE_STEPS.find((s) => s.stage === stage)?.label ?? stage;
  return <Badge tone={stage === "COMPLETE" ? "success" : "accent"}>{label}</Badge>;
}
