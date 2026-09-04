"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
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

  let pitchDeckUrl: string | undefined;
  const pitchDeck = formData.get("pitchDeck");
  if (pitchDeck instanceof File && pitchDeck.size > 0) {
    if (!ALLOWED_PITCH_DECK_TYPES.has(pitchDeck.type)) {
      return { message: "Pitch deck must be a PDF file." };
    }
    if (pitchDeck.size > MAX_PITCH_DECK_BYTES) {
      return { message: "Pitch deck must be smaller than 10MB." };
    }
    const dir = path.join(process.cwd(), "public", "uploads", "pitch-decks");
    await mkdir(dir, { recursive: true });
    const filename = `${randomUUID()}.pdf`;
    await writeFile(path.join(dir, filename), Buffer.from(await pitchDeck.arrayBuffer()));
    pitchDeckUrl = `/uploads/pitch-decks/${filename}`;
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
      pitchDeckUrl,
      status: intent === "submit" ? "PENDING_REVIEW" : "DRAFT",
    },
  });

  redirect(`/listings/${listing.id}`);
}
