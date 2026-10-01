"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import {
  featureListingAction,
  unfeatureListingAction,
  removeListingAction,
} from "@/app/admin/listings/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/form";
import { CategoryIcon } from "@/components/listings/category-icon";
import { ListingStatusBadge, ListingTypeBadge } from "@/components/listings/badges";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Star, StarOff, Trash2 } from "lucide-react";
import type { Listing } from "@prisma/client";

export function ListingRow({
  listing,
}: {
  listing: Listing & { seller: { name: string | null; email: string | null } };
}) {
  const [removing, setRemoving] = useState(false);
  const featureAction = featureListingAction.bind(null, listing.id);
  const unfeatureAction = unfeatureListingAction.bind(null, listing.id);
  const removeAction = removeListingAction.bind(null, listing.id);

  const price =
    listing.listingType === "FIXED_PRICE"
      ? formatCurrency(listing.askingPrice as never)
      : listing.listingType === "AUCTION"
        ? formatCurrency(listing.startingBid as never)
        : "Equity / royalty";

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <CategoryIcon category={listing.category} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/listings/${listing.id}`}
                  target="_blank"
                  className="text-sm font-semibold text-ink-900 hover:text-accent-700"
                >
                  {listing.title}
                </Link>
                <ListingStatusBadge status={listing.status} />
                <ListingTypeBadge type={listing.listingType} />
                {listing.isFeatured && <Badge tone="warning">Featured</Badge>}
              </div>
              <p className="mt-1.5 text-xs text-ink-400">
                {CATEGORY_LABELS[listing.category]} · {listing.seller.name ?? listing.seller.email} ·{" "}
                {price} · {listing.viewCount} view{listing.viewCount === 1 ? "" : "s"} · Listed{" "}
                {formatDate(listing.createdAt)}
              </p>
              {listing.isFeatured && listing.featuredUntil && (
                <p className="mt-1 text-xs text-warning-700">
                  Featured until {formatDate(listing.featuredUntil)}
                </p>
              )}
            </div>
          </div>

          {!removing && (
            <div className="flex shrink-0 flex-wrap gap-2">
              <form action={listing.isFeatured ? unfeatureAction : featureAction}>
                <FeatureButton isFeatured={listing.isFeatured} />
              </form>
              {listing.status !== "ARCHIVED" && (
                <Button type="button" variant="outline" size="sm" onClick={() => setRemoving(true)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </Button>
              )}
            </div>
          )}
        </div>

        {removing && (
          <form action={removeAction} className="mt-4 space-y-2 border-t border-border pt-4">
            <Textarea name="reason" placeholder="Reason for removal (internal, for the audit log)" rows={2} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setRemoving(false)}>
                Cancel
              </Button>
              <RemoveButton />
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function FeatureButton({ isFeatured }: { isFeatured: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="sm" disabled={pending}>
      {isFeatured ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
      {pending ? "Saving…" : isFeatured ? "Unfeature" : "Feature"}
    </Button>
  );
}

function RemoveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" size="sm" disabled={pending}>
      {pending ? "Removing…" : "Confirm removal"}
    </Button>
  );
}
