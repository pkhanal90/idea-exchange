"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";
import { recordAuditLog } from "@/lib/audit-log";

export async function approveListingAction(listingId: string) {
  const session = await requireAdmin();
  const before = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { status: true, rejectionNote: true },
  });

  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "PUBLISHED", publishedAt: new Date(), rejectionNote: null },
  });

  await recordAuditLog({
    actorId: session.user.id,
    action: "LISTING_APPROVED",
    targetType: "Listing",
    targetId: listingId,
    beforeState: before ?? undefined,
    afterState: { status: "PUBLISHED" },
  });

  revalidatePath("/admin");
}

export async function rejectListingAction(listingId: string, formData: FormData) {
  const session = await requireAdmin();
  const note = String(formData.get("note") ?? "").trim();
  const before = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { status: true, rejectionNote: true },
  });

  const rejectionNote = note || "Does not meet listing guidelines.";
  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "REJECTED", rejectionNote },
  });

  await recordAuditLog({
    actorId: session.user.id,
    action: "LISTING_REJECTED",
    targetType: "Listing",
    targetId: listingId,
    beforeState: before ?? undefined,
    afterState: { status: "REJECTED", rejectionNote },
  });

  revalidatePath("/admin");
}
