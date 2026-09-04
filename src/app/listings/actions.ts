"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function toggleSavedListingAction(listingId: string): Promise<{ saved: boolean }> {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/listings");

  const existing = await prisma.savedListing.findUnique({
    where: { userId_listingId: { userId: session.user.id, listingId } },
  });

  if (existing) {
    await prisma.savedListing.delete({ where: { id: existing.id } });
    return { saved: false };
  }

  await prisma.savedListing.create({
    data: { userId: session.user.id, listingId },
  });
  return { saved: true };
}
