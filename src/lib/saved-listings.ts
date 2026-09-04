import { prisma } from "@/lib/prisma";

// Used to know which of a batch of listings the current viewer has already
// saved, so ListingCard can render its heart button in the right state.
export async function getSavedListingIdSet(userId: string | undefined, listingIds: string[]) {
  if (!userId || listingIds.length === 0) return new Set<string>();
  const rows = await prisma.savedListing.findMany({
    where: { userId, listingId: { in: listingIds } },
    select: { listingId: true },
  });
  return new Set(rows.map((r) => r.listingId));
}
