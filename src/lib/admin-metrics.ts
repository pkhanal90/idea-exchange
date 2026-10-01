import { prisma } from "@/lib/prisma";
import type { DealStage, ListingStatus, UserRole } from "@prisma/client";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Platform-wide counts span every user/listing/deal, not one account's own
// rows (contrast with the seller/buyer dashboards, which filter to the
// signed-in user and then .filter().length in memory) — so these use
// DB-side count/groupBy/aggregate rather than fetching full rows.
export async function getAdminOverviewMetrics() {
  const weekAgo = new Date(Date.now() - WEEK_MS);

  const [
    totalUsers,
    usersByRole,
    newSignups,
    totalListings,
    listingsByStatus,
    oldestPending,
    pendingModeration,
    suspendedOrBanned,
    dealsByStage,
    completedDeals,
    pendingPayoutDeals,
    recentAccreditations,
    recentAuditEntries,
    platformSettings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.listing.count(),
    prisma.listing.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.listing.findFirst({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    prisma.listing.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.user.count({ where: { status: { not: "ACTIVE" } } }),
    prisma.deal.groupBy({ by: ["stage"], _count: { _all: true } }),
    prisma.deal.aggregate({
      where: { stage: "COMPLETE" },
      _sum: { finalAmount: true },
      _count: { _all: true },
    }),
    prisma.deal.aggregate({
      where: { stage: { in: ["ESCROW_HELD", "IP_ASSIGNMENT_PENDING"] } },
      _sum: { finalAmount: true },
      _count: { _all: true },
    }),
    prisma.user.count({
      where: {
        role: "INVESTOR",
        accreditationStatus: "SELF_ATTESTED",
        accreditationAttestedAt: { gte: weekAgo },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { actor: { select: { name: true, email: true } } },
    }),
    prisma.platformSettings.findUnique({ where: { id: "default" } }),
  ]);

  const commissionPercent = Number(platformSettings?.commissionPercent ?? 10);
  const totalVolume = Number(completedDeals._sum.finalAmount ?? 0);
  const commissionEarned = totalVolume * (commissionPercent / 100);
  const pendingPayoutAmount = Number(pendingPayoutDeals._sum.finalAmount ?? 0);

  const dealsByStageMap = Object.fromEntries(
    dealsByStage.map((d) => [d.stage, d._count._all]),
  ) as Partial<Record<DealStage, number>>;
  const disputedDeals = dealsByStageMap.DISPUTED ?? 0;
  const activeDeals = dealsByStage
    .filter((d) => d.stage !== "COMPLETE" && d.stage !== "CANCELLED")
    .reduce((sum, d) => sum + d._count._all, 0);

  return {
    totalUsers,
    usersByRole: Object.fromEntries(usersByRole.map((r) => [r.role, r._count._all])) as Partial<
      Record<UserRole, number>
    >,
    newSignups,
    totalListings,
    listingsByStatus: Object.fromEntries(
      listingsByStatus.map((s) => [s.status, s._count._all]),
    ) as Partial<Record<ListingStatus, number>>,
    pendingModeration,
    oldestPendingAt: oldestPending?.createdAt ?? null,
    suspendedOrBanned,
    disputedDeals,
    activeDeals,
    dealsByStageMap,
    totalVolume,
    commissionEarned,
    completedDealsCount: completedDeals._count._all,
    pendingPayoutAmount,
    pendingPayoutCount: pendingPayoutDeals._count._all,
    recentAccreditations,
    recentAuditEntries,
  };
}

export type AdminOverviewMetrics = Awaited<ReturnType<typeof getAdminOverviewMetrics>>;
