import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// An offer "chain" is every counter-offer exchanged between one buyer and one
// listing. Only the latest row in a chain is actionable — this collapses a
// flat Offer query down to one representative (the latest) row per chain.
export async function getLatestOfferPerChain(where: Prisma.OfferWhereInput) {
  const offers = await prisma.offer.findMany({
    where,
    orderBy: { createdAt: "asc" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          sellerId: true,
          status: true,
          category: true,
          seller: { select: { name: true, email: true } },
        },
      },
      buyer: { select: { id: true, name: true, email: true } },
    },
  });

  const latestByChain = new Map<string, (typeof offers)[number]>();
  for (const offer of offers) {
    latestByChain.set(`${offer.listingId}:${offer.buyerId}`, offer);
  }

  return Array.from(latestByChain.values()).sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
}

// Shared by the negotiated-offer accept flow and the auction "accept highest
// bid" flow — both end the same way: mark the offer accepted, decline every
// other pending offer on the listing, and open a Deal.
export async function acceptOfferAndCreateDeal(offerId: string) {
  return prisma.$transaction(async (tx) => {
    const offer = await tx.offer.update({
      where: { id: offerId },
      data: { status: "ACCEPTED", respondedAt: new Date() },
      include: { listing: true },
    });

    await tx.offer.updateMany({
      where: { listingId: offer.listingId, status: "PENDING", id: { not: offerId } },
      data: { status: "DECLINED", respondedAt: new Date() },
    });

    const deal = await tx.deal.create({
      data: {
        listingId: offer.listingId,
        offerId: offer.id,
        sellerId: offer.listing.sellerId,
        buyerId: offer.buyerId,
        finalAmount: offer.amount,
        finalEquityPercent: offer.equityPercent,
        finalRoyaltyPercent: offer.royaltyPercent,
      },
    });

    await tx.listing.update({
      where: { id: offer.listingId },
      data: { status: "UNDER_OFFER" },
    });

    return deal;
  });
}
