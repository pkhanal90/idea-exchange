"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { approveListingAction, rejectListingAction } from "@/app/admin/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { StageBadge, ListingTypeBadge } from "@/components/listings/badges";
import { CategoryIcon } from "@/components/listings/category-icon";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { Check, X } from "lucide-react";
import type { Listing } from "@prisma/client";

export function ModerationRow({
  listing,
}: {
  listing: Listing & { seller: { name: string | null; email: string | null } };
}) {
  const [rejecting, setRejecting] = useState(false);
  const approveAction = approveListingAction.bind(null, listing.id);
  const rejectAction = rejectListingAction.bind(null, listing.id);

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
                <StageBadge stage={listing.stage} />
                <ListingTypeBadge type={listing.listingType} />
              </div>
              <p className="mt-1.5 text-sm text-ink-500">{listing.teaserSummary}</p>
              <p className="mt-1.5 text-xs text-ink-400">
                {CATEGORY_LABELS[listing.category]} · Submitted by{" "}
                {listing.seller.name ?? listing.seller.email} · {formatDate(listing.createdAt)}
              </p>
            </div>
          </div>

          {!rejecting && (
            <div className="flex shrink-0 gap-2">
              <form action={approveAction}>
                <ApproveButton />
              </form>
              <Button type="button" variant="outline" size="sm" onClick={() => setRejecting(true)}>
                <X className="h-3.5 w-3.5" />
                Reject
              </Button>
            </div>
          )}
        </div>

        {rejecting && (
          <form action={rejectAction} className="mt-4 space-y-2 border-t border-border pt-4">
            <Textarea
              name="note"
              placeholder="Reason for rejection (shown to the seller)"
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setRejecting(false)}>
                Cancel
              </Button>
              <RejectButton />
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function ApproveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      <Check className="h-3.5 w-3.5" />
      {pending ? "Approving…" : "Approve"}
    </Button>
  );
}

function RejectButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" size="sm" disabled={pending}>
      {pending ? "Rejecting…" : "Confirm rejection"}
    </Button>
  );
}
