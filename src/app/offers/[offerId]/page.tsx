import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { OfferTermsSummary } from "@/components/offers/offer-terms-summary";
import { CategoryIcon } from "@/components/listings/category-icon";
import {
  OfferResponseActions,
  WithdrawOfferButton,
} from "@/components/offers/offer-response-actions";
import { formatDate } from "@/lib/utils";
import type { OfferStatus } from "@prisma/client";
import { ArrowLeft } from "lucide-react";

interface OfferDetailPageProps {
  params: Promise<{ offerId: string }>;
}

const statusTone: Record<OfferStatus, "neutral" | "success" | "danger" | "warning"> = {
  PENDING: "warning",
  COUNTERED: "neutral",
  ACCEPTED: "success",
  DECLINED: "danger",
  WITHDRAWN: "danger",
  EXPIRED: "danger",
};

export default async function OfferDetailPage({ params }: OfferDetailPageProps) {
  const { offerId } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/auth/signin?callbackUrl=/offers/${offerId}`);

  const anchor = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { listing: { select: { id: true, title: true, sellerId: true, category: true } } },
  });
  if (!anchor) notFound();

  const userId = session.user.id;
  const isSeller = userId === anchor.listing.sellerId;
  const isBuyer = userId === anchor.buyerId;
  if (!isSeller && !isBuyer && session.user.role !== "ADMIN") notFound();

  const chain = await prisma.offer.findMany({
    where: { listingId: anchor.listingId, buyerId: anchor.buyerId },
    orderBy: { createdAt: "asc" },
    include: { buyer: { select: { name: true, email: true } } },
  });

  const latest = chain[chain.length - 1];
  const deal = latest.status === "ACCEPTED" ? await prisma.deal.findUnique({ where: { offerId: latest.id } }) : null;

  const currentUserParty = isSeller ? "SELLER" : "BUYER";
  const isResponder = latest.status === "PENDING" && currentUserParty !== latest.proposedBy;
  const isWaiting = latest.status === "PENDING" && currentUserParty === latest.proposedBy;

  return (
    <Container className="max-w-2xl py-10">
      <Link
        href={`/listings/${anchor.listingId}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {anchor.listing.title}
      </Link>

      <div className="flex items-center gap-3">
        <CategoryIcon category={anchor.listing.category} size="sm" />
        <h1 className="text-xl font-semibold text-ink-900">
          Negotiation with {isSeller ? (latest.buyer.name ?? latest.buyer.email) : "seller"}
        </h1>
      </div>

      <div className="mt-6 space-y-3">
        {chain.map((offer) => (
          <Card key={offer.id} className={offer.id === latest.id ? "border-ink-300" : undefined}>
            <CardContent className="flex items-start justify-between gap-4 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                  {offer.proposedBy === "BUYER" ? "Buyer proposed" : "Seller countered"} ·{" "}
                  {formatDate(offer.createdAt)}
                </p>
                <div className="mt-1">
                  <OfferTermsSummary
                    amount={offer.amount}
                    equityPercent={offer.equityPercent}
                    royaltyPercent={offer.royaltyPercent}
                    royaltyTermMonths={offer.royaltyTermMonths}
                    size="sm"
                  />
                </div>
                {offer.message && <p className="mt-1.5 text-sm text-ink-500">{offer.message}</p>}
              </div>
              <Badge tone={statusTone[offer.status]}>{offer.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {latest.status === "ACCEPTED" && deal && (
        <Card className="mt-6 border-success-500/30 bg-success-50">
          <CardContent className="flex items-center justify-between">
            <p className="text-sm font-medium text-success-700">
              Offer accepted — the deal is now in progress.
            </p>
            <ButtonLink href={`/deals/${deal.id}`} size="sm">
              Go to deal room
            </ButtonLink>
          </CardContent>
        </Card>
      )}

      {isResponder && <OfferResponseActions offerId={latest.id} />}

      {isWaiting && (
        <div className="mt-4">
          <p className="text-sm text-ink-500">
            Waiting on {currentUserParty === "BUYER" ? "the seller" : "the buyer"} to respond.
          </p>
          {currentUserParty === "BUYER" && latest.proposedBy === "BUYER" && (
            <WithdrawOfferButton offerId={latest.id} />
          )}
        </div>
      )}
    </Container>
  );
}
