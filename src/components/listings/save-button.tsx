"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleSavedListingAction } from "@/app/listings/actions";
import { cn } from "@/lib/utils";

export function SaveButton({
  listingId,
  initialSaved,
  className,
}: {
  listingId: string;
  initialSaved: boolean;
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from saved" : "Save this listing"}
      aria-pressed={saved}
      disabled={isPending}
      onClick={(e) => {
        // Cards wrap this button in a <Link> — stop the click from also
        // navigating to the listing.
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
          const result = await toggleSavedListingAction(listingId);
          setSaved(result.saved);
        });
      }}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-500 shadow-sm backdrop-blur-sm transition-colors hover:text-danger-500 disabled:opacity-60",
        saved && "text-danger-500",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-current")} />
    </button>
  );
}
