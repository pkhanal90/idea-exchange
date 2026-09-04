"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { acceptOfferAndCreateDeal } from "@/lib/offers";
import { bidSchema, type BidActionState } from "@/lib/validation/bid";

export async function acceptNdaAction(listingId: string) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=/listings/${listingId}`);
  }

  const headerList = await headers();
  const ipAddress = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();

  await prisma.ndaAcceptance.upsert({
    where: { listingId_userId: { listingId, userId: session.user.id } },
    create: { listingId, userId: session.user.id, ipAddress },
    update: {},
  });

  revalidatePath(`/listings/${listingId}`);
}

export async function placeBidAction(
  listingId: string,
  _prevState: BidActionState,
  formData: FormData,
): Promise<BidActionState> {
  const session = await auth();
  if (!session?.user) redirect(`/auth/signin?callbackUrl=/listings/${listingId}`);

  const parsed = bidSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid bid" };

  const listing = await prisma.listing.findUniqueOrThrow({ where: { id: listingId } });
  if (listing.sellerId === session.user.id) return { error: "You can't bid on your own listing." };
  if (listing.listingType !== "AUCTION" || listing.status !== "PUBLISHED") {
    return { error: "This auction isn't accepting bids right now." };
  }
  if (listing.auctionEndsAt && listing.auctionEndsAt.getTime() <= Date.now()) {
    return { error: "This auction has ended." };
  }

  const topBid = await prisma.bid.findFirst({
    where: { listingId },
    orderBy: { amount: "desc" },
  });
  const floor = Math.max(Number(topBid?.amount ?? 0), Number(listing.startingBid ?? 0));
  if (parsed.data.amount <= floor) {
    return { error: `Your bid must be higher than ${floor.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}` };
  }

  await prisma.bid.create({
    data: { listingId, bidderId: session.user.id, amount: parsed.data.amount },
  });

  revalidatePath(`/listings/${listingId}`);
  return {};
}

export async function acceptHighestBidAction(listingId: string) {
  const session = await auth();
  if (!session?.user) redirect(`/auth/signin?callbackUrl=/listings/${listingId}`);

  const listing = await prisma.listing.findUniqueOrThrow({ where: { id: listingId } });
  if (listing.sellerId !== session.user.id) throw new Error("Forbidden");
  if (listing.listingType !== "AUCTION" || listing.status !== "PUBLISHED") return;

  const topBid = await prisma.bid.findFirst({
    where: { listingId },
    orderBy: { amount: "desc" },
  });
  if (!topBid) throw new Error("No bids to accept yet.");

  const offer = await prisma.offer.create({
    data: {
      listingId,
      buyerId: topBid.bidderId,
      offerType: "AUCTION_BID",
      proposedBy: "BUYER",
      status: "ACCEPTED",
      amount: topBid.amount,
      respondedAt: new Date(),
    },
  });

  const deal = await acceptOfferAndCreateDeal(offer.id);
  redirect(`/deals/${deal.id}`);
}
