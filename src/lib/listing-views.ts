import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEDUPE_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

// Increments Listing.viewCount at most once per viewer per dedupe window —
// signed-in viewers are deduped by user id, anonymous ones by a hash of
// ip+user-agent — and never counts the listing's own seller viewing their
// own page. Returns 1 if a new view was recorded, 0 otherwise, so callers
// can reflect the up-to-date count without a second read.
export async function trackListingView(listingId: string, sellerId: string): Promise<0 | 1> {
  const session = await auth();
  const viewerId = session?.user?.id;
  if (viewerId === sellerId) return 0;

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = headerList.get("user-agent") ?? "unknown";
  const viewerKey = viewerId ?? createHash("sha256").update(`${ip}:${userAgent}`).digest("hex");

  const recentView = await prisma.listingView.findFirst({
    where: {
      listingId,
      viewerKey,
      createdAt: { gte: new Date(Date.now() - DEDUPE_WINDOW_MS) },
    },
    select: { id: true },
  });
  if (recentView) return 0;

  await prisma.$transaction([
    prisma.listingView.create({ data: { listingId, viewerKey } }),
    prisma.listing.update({ where: { id: listingId }, data: { viewCount: { increment: 1 } } }),
  ]);

  return 1;
}
