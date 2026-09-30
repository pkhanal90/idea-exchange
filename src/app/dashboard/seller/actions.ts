"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sendListingSubmittedEmail,
  sendNewSubmissionAdminAlert,
} from "@/lib/notifications/listing-emails";

export async function submitListingForReviewAction(listingId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== session.user.id || listing.status !== "DRAFT") return;

  const ndaAcknowledged = formData.get("ndaAcknowledged") === "true";
  if (!ndaAcknowledged) {
    throw new Error("Review and accept the NDA that will protect your listing before submitting.");
  }

  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "PENDING_REVIEW", sellerNdaAcknowledgedAt: new Date() },
  });

  const seller = { name: session.user.name ?? null, email: session.user.email ?? null };
  await sendListingSubmittedEmail(seller, listing);
  await sendNewSubmissionAdminAlert(listing, seller);

  revalidatePath("/dashboard/seller");
}
