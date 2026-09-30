"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { acceptOfferAndCreateDeal } from "@/lib/offers";
import { offerTermsSchema, type OfferFieldErrors } from "@/lib/validation/offer";
import {
  sendNewOfferEmail,
  sendOfferCounteredEmail,
  sendOfferDeclinedEmail,
  sendOfferWithdrawnEmail,
} from "@/lib/notifications/offer-emails";
import type { OfferParty } from "@prisma/client";

export interface OfferActionState {
  errors?: OfferFieldErrors;
  message?: string;
}

function parseTerms(formData: FormData): { errors?: OfferFieldErrors; data?: ReturnType<typeof offerTermsSchema.parse> } {
  const parsed = offerTermsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const errors: OfferFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !(key in errors)) {
        errors[key as keyof OfferFieldErrors] = issue.message;
      }
    }
    return { errors };
  }
  return { data: parsed.data };
}

export async function createOfferAction(
  listingId: string,
  _prevState: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  const session = await auth();
  if (!session?.user) redirect(`/auth/signin?callbackUrl=/listings/${listingId}`);

  const listing = await prisma.listing.findUniqueOrThrow({
    where: { id: listingId },
    include: { seller: { select: { name: true, email: true } } },
  });
  if (listing.sellerId === session.user.id) {
    return { message: "You can't make an offer on your own listing." };
  }
  if (listing.status !== "PUBLISHED") {
    return { message: "This listing isn't accepting new offers right now." };
  }
  if (listing.listingType === "AUCTION") {
    return { message: "This is an auction — place a bid instead of a fixed offer." };
  }

  // Applies to every role that can make an offer (Buyer, Investor) — seeing
  // full diligence materials before proposing terms isn't optional.
  const hasNda = await prisma.ndaAcceptance.findUnique({
    where: { listingId_userId: { listingId, userId: session.user.id } },
  });
  if (!hasNda) {
    return { message: "Accept this listing's NDA before making an offer." };
  }

  // A fresh (non-counter) offer from this buyer while one is already active
  // would silently fork the "chain" the rest of the app assumes is unique
  // per (listing, buyer) — send them to the existing one instead.
  const activeOffer = await prisma.offer.findFirst({
    where: { listingId, buyerId: session.user.id, status: { in: ["PENDING", "COUNTERED"] } },
  });
  if (activeOffer) redirect(`/offers/${activeOffer.id}`);

  const { errors, data } = parseTerms(formData);
  if (!data) return { errors, message: "Please fix the highlighted fields." };

  const offer = await prisma.offer.create({
    data: {
      listingId,
      buyerId: session.user.id,
      offerType: listing.listingType === "EQUITY_ROYALTY" ? "EQUITY_ROYALTY" : "BUY_IT_NOW",
      proposedBy: "BUYER",
      amount: data.amount,
      equityPercent: data.equityPercent,
      royaltyPercent: data.royaltyPercent,
      royaltyTermMonths: data.royaltyTermMonths,
      message: data.message,
    },
  });

  await sendNewOfferEmail(listing.seller, listing, offer, offer.id);

  redirect(`/offers/${offer.id}`);
}

async function loadOfferForResponse(offerId: string) {
  const session = await auth();
  if (!session?.user) redirect(`/auth/signin?callbackUrl=/offers/${offerId}`);

  const offer = await prisma.offer.findUniqueOrThrow({
    where: { id: offerId },
    include: {
      listing: { include: { seller: { select: { id: true, name: true, email: true } } } },
      buyer: { select: { id: true, name: true, email: true } },
    },
  });

  const respondingParty: OfferParty = offer.proposedBy === "BUYER" ? "SELLER" : "BUYER";
  const currentUserParty: OfferParty | null =
    session.user.id === offer.listing.sellerId
      ? "SELLER"
      : session.user.id === offer.buyerId
        ? "BUYER"
        : null;

  if (currentUserParty !== respondingParty || offer.status !== "PENDING") {
    throw new Error("You can't respond to this offer right now.");
  }

  // Whoever proposed the offer being responded to — the party that should
  // hear about what happens to it next (countered, declined, accepted).
  const proposer = offer.proposedBy === "BUYER" ? offer.buyer : offer.listing.seller;

  return { session, offer, proposer };
}

export async function acceptOfferAction(offerId: string) {
  await loadOfferForResponse(offerId); // auth + "is this offer actionable" check
  const deal = await acceptOfferAndCreateDeal(offerId);
  redirect(`/deals/${deal.id}`);
}

export async function declineOfferAction(offerId: string) {
  const { offer, proposer } = await loadOfferForResponse(offerId);
  await prisma.offer.update({
    where: { id: offer.id },
    data: { status: "DECLINED", respondedAt: new Date() },
  });
  await sendOfferDeclinedEmail(proposer, offer.listing);
  revalidatePath(`/offers/${offerId}`);
}

export async function withdrawOfferAction(offerId: string) {
  const session = await auth();
  if (!session?.user) redirect(`/auth/signin?callbackUrl=/offers/${offerId}`);

  const offer = await prisma.offer.findUniqueOrThrow({
    where: { id: offerId },
    include: { listing: { include: { seller: { select: { name: true, email: true } } } } },
  });
  if (offer.buyerId !== session.user.id || offer.status !== "PENDING" || offer.proposedBy !== "BUYER") {
    throw new Error("This offer can't be withdrawn.");
  }

  await prisma.offer.update({
    where: { id: offerId },
    data: { status: "WITHDRAWN", respondedAt: new Date() },
  });
  await sendOfferWithdrawnEmail(offer.listing.seller, offer.listing);
  revalidatePath(`/offers/${offerId}`);
}

export async function counterOfferAction(
  offerId: string,
  _prevState: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  const { offer, proposer } = await loadOfferForResponse(offerId);

  const { errors, data } = parseTerms(formData);
  if (!data) return { errors, message: "Please fix the highlighted fields." };

  const counterParty: OfferParty = offer.proposedBy === "BUYER" ? "SELLER" : "BUYER";

  const newOffer = await prisma.$transaction(async (tx) => {
    await tx.offer.update({
      where: { id: offer.id },
      data: { status: "COUNTERED", respondedAt: new Date() },
    });

    return tx.offer.create({
      data: {
        listingId: offer.listingId,
        buyerId: offer.buyerId,
        offerType: offer.offerType,
        proposedBy: counterParty,
        parentOfferId: offer.id,
        amount: data.amount,
        equityPercent: data.equityPercent,
        royaltyPercent: data.royaltyPercent,
        royaltyTermMonths: data.royaltyTermMonths,
        message: data.message,
      },
    });
  });

  await sendOfferCounteredEmail(proposer, offer.listing, newOffer, newOffer.id);

  redirect(`/offers/${newOffer.id}`);
}
