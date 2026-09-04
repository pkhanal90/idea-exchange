import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OfferTermsSummary } from "@/components/offers/offer-terms-summary";
import { CategoryIcon } from "@/components/listings/category-icon";
import { timeAgo } from "@/lib/utils";
import type { IndustryCategory, OfferStatus } from "@prisma/client";

const statusTone: Record<OfferStatus, "neutral" | "success" | "danger" | "warning"> = {
  PENDING: "warning",
  COUNTERED: "neutral",
  ACCEPTED: "success",
  DECLINED: "danger",
  WITHDRAWN: "danger",
  EXPIRED: "danger",
};

export function OfferChainRow({
  offer,
  otherPartyLabel,
}: {
  offer: {
    id: string;
    status: OfferStatus;
    amount: unknown;
    equityPercent: unknown;
    royaltyPercent: unknown;
    royaltyTermMonths: number | null;
    updatedAt: Date;
    listing: { id: string; title: string; category: IndustryCategory };
  };
  otherPartyLabel: string;
}) {
  return (
    <Link href={`/offers/${offer.id}`}>
      <Card className="transition-colors hover:bg-ink-50">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <CategoryIcon category={offer.listing.category} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">{offer.listing.title}</p>
              <p className="mt-0.5 text-xs text-ink-400">
                {otherPartyLabel} · {timeAgo(offer.updatedAt)}
              </p>
              <div className="mt-1.5">
                <OfferTermsSummary
                  amount={offer.amount}
                  equityPercent={offer.equityPercent}
                  royaltyPercent={offer.royaltyPercent}
                  royaltyTermMonths={offer.royaltyTermMonths}
                  size="sm"
                />
              </div>
            </div>
          </div>
          <Badge tone={statusTone[offer.status]}>{offer.status}</Badge>
        </CardContent>
      </Card>
    </Link>
  );
}
