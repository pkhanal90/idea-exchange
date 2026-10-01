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

  if (session.user.role === "INVESTOR") return;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== session.user.id || listing.status !== "DRAFT") return;

  const consentAccepted = formData.get("consentAccepted") === "true";
  const signedName = String(formData.get("signedName") ?? "").trim();
  if (!consentAccepted || !signedName) {
    throw new Error("Confirm ownership and sign the consent before submitting.");
  }

  await prisma.listing.update({
    where: { id: listingId },
    data: {
      status: "PENDING_REVIEW",
      sellerConsentAcceptedAt: new Date(),
      sellerConsentSignedName: signedName,
    },
  });

  const seller = { name: session.user.name ?? null, email: session.user.email ?? null };
  await sendListingSubmittedEmail(seller, listing);
  await sendNewSubmissionAdminAlert(listing, seller);

  revalidatePath("/dashboard/seller");
}
