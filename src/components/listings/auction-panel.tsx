"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { placeBidAction, acceptHighestBidAction } from "@/app/listings/[id]/actions";
import { Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

export function AuctionPanel({
  listingId,
  startingBid,
  reservePrice,
  highestBid,
  bidCount,
  auctionEndsAt,
  hasEnded,
  isOwner,
  canBid,
}: {
  listingId: string;
  startingBid: unknown;
  reservePrice: unknown;
  highestBid: unknown;
  bidCount: number;
  auctionEndsAt: string | null;
  hasEnded: boolean;
  isOwner: boolean;
  canBid: boolean;
}) {
  const [state, formAction] = useActionState(placeBidAction.bind(null, listingId), {});

  const currentFloor = highestBid ?? startingBid;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-ink-50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-ink-400">
            {highestBid ? "Current bid" : "Starting bid"}
          </p>
          <p className="font-mono-nums text-xl font-semibold text-ink-900">
            {formatCurrency(currentFloor as never)}
          </p>
        </div>
        <p className="text-right text-xs text-ink-400">
          {bidCount} bid{bidCount === 1 ? "" : "s"}
          {auctionEndsAt && (
            <>
              <br />
              {hasEnded ? "Ended" : "Ends"} {formatDate(auctionEndsAt)}
            </>
          )}
        </p>
      </div>

      {reservePrice ? (
        <p className="text-xs text-ink-400">Reserve price set by seller (not disclosed).</p>
      ) : null}

      {isOwner ? (
        Boolean(highestBid) && (
          <form action={acceptHighestBidAction.bind(null, listingId)}>
            <AcceptBidButton amount={highestBid} />
          </form>
        )
      ) : canBid && !hasEnded ? (
        <form action={formAction} className="flex items-start gap-2">
          <div className="flex-1">
            <Input name="amount" type="number" min={0} step={1} placeholder="Your bid (USD)" />
            {state.error && <p className="mt-1 text-xs text-danger-500">{state.error}</p>}
          </div>
          <PlaceBidButton />
        </form>
      ) : hasEnded ? (
        <p className="text-sm text-ink-500">This auction has ended.</p>
      ) : null}
    </div>
  );
}

function PlaceBidButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" disabled={pending}>
      {pending ? "Placing…" : "Place bid"}
    </Button>
  );
}

function AcceptBidButton({ amount }: { amount: unknown }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending} className="w-full">
      {pending ? "Accepting…" : `Accept highest bid — ${formatCurrency(amount as never)}`}
    </Button>
  );
}
