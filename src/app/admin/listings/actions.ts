"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSection } from "@/lib/rbac";
import { recordAuditLog } from "@/lib/audit-log";

export async function featureListingAction(listingId: string) {
  const session = await requireAdminSection("listings");

  const [before, settings] = await Promise.all([
    prisma.listing.findUnique({
      where: { id: listingId },
      select: { isFeatured: true, featuredUntil: true },
    }),
    prisma.platformSettings.findUnique({ where: { id: "default" } }),
  ]);

  const durationDays = settings?.featuredListingDurationDays ?? 14;
  const featuredUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  await prisma.listing.update({
    where: { id: listingId },
    data: { isFeatured: true, featuredUntil },
  });

  await recordAuditLog({
    actorId: session.user.id,
    action: "LISTING_FEATURED",
    targetType: "Listing",
    targetId: listingId,
    beforeState: before
      ? { isFeatured: before.isFeatured, featuredUntil: before.featuredUntil?.toISOString() ?? null }
      : undefined,
    afterState: { isFeatured: true, featuredUntil: featuredUntil.toISOString() },
  });

  revalidatePath("/admin/listings");
}

export async function unfeatureListingAction(listingId: string) {
  const session = await requireAdminSection("listings");

  const before = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { isFeatured: true, featuredUntil: true },
  });

  await prisma.listing.update({
    where: { id: listingId },
    data: { isFeatured: false, featuredUntil: null },
  });

  await recordAuditLog({
    actorId: session.user.id,
    action: "LISTING_UNFEATURED",
    targetType: "Listing",
    targetId: listingId,
    beforeState: before
      ? { isFeatured: before.isFeatured, featuredUntil: before.featuredUntil?.toISOString() ?? null }
      : undefined,
    afterState: { isFeatured: false, featuredUntil: null },
  });

  revalidatePath("/admin/listings");
}

// There's no ListingStatus.REMOVED — ARCHIVED is the closest existing state
// (hides it from the marketplace without deleting the row or colliding with
// the seller-facing DRAFT/REJECTED states). The reason goes into the audit
// log rather than a new column, same as every other admin action here.
export async function removeListingAction(listingId: string, formData: FormData) {
  const session = await requireAdminSection("listings");
  const reason = String(formData.get("reason") ?? "").trim() || "Removed by admin.";

  const before = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { status: true },
  });

  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "ARCHIVED" },
  });

  await recordAuditLog({
    actorId: session.user.id,
    action: "LISTING_REMOVED",
    targetType: "Listing",
    targetId: listingId,
    beforeState: before ? { status: before.status } : undefined,
    afterState: { status: "ARCHIVED", reason },
  });

  revalidatePath("/admin/listings");
}
