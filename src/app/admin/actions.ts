"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");
  return session;
}

export async function approveListingAction(listingId: string) {
  await requireAdmin();
  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "PUBLISHED", publishedAt: new Date(), rejectionNote: null },
  });
  revalidatePath("/admin");
}

export async function rejectListingAction(listingId: string, formData: FormData) {
  await requireAdmin();
  const note = String(formData.get("note") ?? "").trim();
  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "REJECTED", rejectionNote: note || "Does not meet listing guidelines." },
  });
  revalidatePath("/admin");
}
