"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function submitListingForReviewAction(listingId: string) {
  const session = await auth();
  if (!session?.user) return;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.sellerId !== session.user.id || listing.status !== "DRAFT") return;

  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "PENDING_REVIEW" },
  });

  revalidatePath("/dashboard/seller");
}
