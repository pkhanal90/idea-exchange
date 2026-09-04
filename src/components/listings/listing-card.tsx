import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StageBadge } from "@/components/listings/badges";
import { SaveButton } from "@/components/listings/save-button";
import { CATEGORY_LABELS } from "@/lib/constants";
import { CATEGORY_VISUALS } from "@/lib/category-visuals";
import { cn, formatCompactCurrency, timeAgo } from "@/lib/utils";
import { Clock, Gauge } from "lucide-react";
import type { IndustryCategory, ListingStage, ListingType } from "@prisma/client";

export interface ListingCardData {
  id: string;
  title: string;
  teaserSummary: string;
  category: IndustryCategory;
  stage: ListingStage;
  listingType: ListingType;
  askingPrice: unknown;
  reservePrice: unknown;
  startingBid: unknown;
  auctionEndsAt: Date | string | null;
  openToEquity: boolean;
  createdAt: Date | string;
}

export function ListingCard({
  listing,
  isSaved = false,
}: {
  listing: ListingCardData;
  isSaved?: boolean;
}) {
  const priceLabel =
    listing.listingType === "FIXED_PRICE"
      ? formatCompactCurrency(listing.askingPrice as never)
      : listing.listingType === "AUCTION"
        ? `From ${formatCompactCurrency(listing.startingBid as never)}`
        : "Equity / Royalty";

  const { icon: CategoryIcon, gradient, chip } = CATEGORY_VISUALS[listing.category];

  return (
    <div className="group relative h-full">
      <SaveButton listingId={listing.id} initialSaved={isSaved} className="absolute right-3 top-3 z-10" />

      <Link href={`/listings/${listing.id}`} className="block h-full">
        <Card className="flex h-full flex-col overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-ink-900/10">
          <div
            className={cn(
              "relative flex h-28 shrink-0 items-center justify-center bg-gradient-to-br",
              gradient,
            )}
          >
            <CategoryIcon className="h-9 w-9 text-white/90" strokeWidth={1.5} />
            <span className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", chip)}>
                {CATEGORY_LABELS[listing.category]}
              </span>
              <StageBadge stage={listing.stage} />
            </span>
          </div>

          <div className="flex-1 p-5 pb-3">
            <h3 className="text-base font-semibold text-ink-900 group-hover:text-accent-700">
              {listing.title}
            </h3>
            <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-ink-500">
              {listing.teaserSummary}
            </p>
            {listing.openToEquity && (
              <Badge tone="accent" className="mt-3">
                Open to equity
              </Badge>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-border px-5 py-3.5">
            <span className="font-mono-nums text-sm font-semibold text-ink-900">
              {priceLabel}
            </span>
            <span className="flex items-center gap-1 text-xs text-ink-400">
              {listing.listingType === "AUCTION" && listing.auctionEndsAt ? (
                <>
                  <Clock className="h-3.5 w-3.5" />
                  Ends soon
                </>
              ) : (
                <>
                  <Gauge className="h-3.5 w-3.5" />
                  Listed {timeAgo(listing.createdAt)}
                </>
              )}
            </span>
          </div>
        </Card>
      </Link>
    </div>
  );
}
