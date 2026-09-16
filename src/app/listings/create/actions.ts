"use server";

import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listingSchema, type ListingFieldErrors } from "@/lib/validation/listing";

export interface CreateListingState {
  errors?: ListingFieldErrors;
  message?: string;
}

const MAX_PITCH_DECK_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_PITCH_DECK_TYPES = new Set(["application/pdf"]);
const PDF_MAGIC_BYTES = Buffer.from("%PDF-", "ascii");

export async function createListingAction(
  _prevState: CreateListingState,
  formData: FormData,
): Promise<CreateListingState> {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/listings/create");
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = listingSchema.safeParse(raw);

  if (!parsed.success) {
    const errors: ListingFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !(key in errors)) {
        errors[key as keyof ListingFieldErrors] = issue.message;
      }
    }
    return { errors, message: "Please fix the highlighted fields." };
  }

  const data = parsed.data;
  const intent = formData.get("intent") === "submit" ? "submit" : "draft";

  let pitchDeckKey: string | undefined;
  const pitchDeck = formData.get("pitchDeck");
  if (pitchDeck instanceof File && pitchDeck.size > 0) {
    if (!ALLOWED_PITCH_DECK_TYPES.has(pitchDeck.type)) {
      return { message: "Pitch deck must be a PDF file." };
    }
    if (pitchDeck.size > MAX_PITCH_DECK_BYTES) {
      return { message: "Pitch deck must be smaller than 10MB." };
    }
    const bytes = Buffer.from(await pitchDeck.arrayBuffer());
    // The browser-supplied MIME type above is just metadata the client
    // attached — verify the file actually starts with a PDF header rather
    // than trusting it.
    if (!bytes.subarray(0, PDF_MAGIC_BYTES.length).equals(PDF_MAGIC_BYTES)) {
      return { message: "That file doesn't look like a valid PDF." };
    }
    // Stored in a private Blob store and served only through
    // /api/listings/[id]/pitch-deck, which re-checks NDA acceptance on every
    // request — the key here is never exposed to the client directly, so a
    // leaked link can't be used to read the deck, and access can be revoked
    // by revoking the NDA record.
    const blob = await put(`pitch-decks/${randomUUID()}.pdf`, bytes, {
      access: "private",
      contentType: "application/pdf",
      addRandomSuffix: false,
    });
    pitchDeckKey = blob.pathname;
  }

  const listing = await prisma.listing.create({
    data: {
      sellerId: session.user.id,
      title: data.title,
      teaserSummary: data.teaserSummary,
      problemStatement: data.problemStatement,
      proposedSolution: data.proposedSolution,
      targetMarket: data.targetMarket,
      tamEstimate: data.tamEstimate,
      monetizationPlan: data.monetizationPlan,
      stage: data.stage,
      category: data.category,
      listingType: data.listingType,
      askingPrice: data.listingType === "FIXED_PRICE" ? data.askingPrice : undefined,
      reservePrice: data.listingType === "AUCTION" ? data.reservePrice : undefined,
      startingBid: data.listingType === "AUCTION" ? data.startingBid : undefined,
      auctionEndsAt:
        data.listingType === "AUCTION" && data.auctionEndsAt
          ? new Date(data.auctionEndsAt)
          : undefined,
      openToEquity: data.listingType === "EQUITY_ROYALTY" ? true : Boolean(data.openToEquity),
      pitchDeckKey,
      status: intent === "submit" ? "PENDING_REVIEW" : "DRAFT",
    },
  });

  redirect(`/listings/${listing.id}`);
}
