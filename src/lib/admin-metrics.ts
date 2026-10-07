import { prisma } from "@/lib/prisma";
import { DEFAULT_COMMISSION_PERCENT } from "@/lib/commission";
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
    prisma.platformSettings.findUnique({ where: { id: "default" } }),
  ]);

  const commissionPercent = Number(platformSettings?.commissionPercent ?? DEFAULT_COMMISSION_PERCENT);
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
  };
}

export type AdminOverviewMetrics = Awaited<ReturnType<typeof getAdminOverviewMetrics>>;

// Per-category commission needs each deal's listing category, so unlike the
// Overview's single aggregate this reads full rows for completed deals
// rather than an aggregate sum — the table below needs the breakdown, not
// just the total.
export async function getFinancialsBreakdown() {
  const [settings, overrides, completedDeals, pendingPayoutDeals] = await Promise.all([
    prisma.platformSettings.findUnique({ where: { id: "default" } }),
    prisma.categoryCommissionOverride.findMany(),
    prisma.deal.findMany({
      where: { stage: "COMPLETE" },
      select: { finalAmount: true, listing: { select: { category: true } } },
    }),
    prisma.deal.findMany({
      where: { stage: { in: ["ESCROW_HELD", "IP_ASSIGNMENT_PENDING"] } },
      select: {
        id: true,
        finalAmount: true,
        escrowFundedAt: true,
        listing: { select: { title: true } },
        seller: { select: { name: true, email: true } },
      },
      orderBy: { escrowFundedAt: "asc" },
    }),
  ]);

  const defaultRate = Number(settings?.commissionPercent ?? DEFAULT_COMMISSION_PERCENT);
  const overrideMap = new Map(overrides.map((o) => [o.category, Number(o.commissionPercent)]));

  const byCategory = new Map<
    string,
    { count: number; volume: number; rate: number; commission: number }
  >();
  let totalVolume = 0;
  let totalCommission = 0;

  for (const deal of completedDeals) {
    const amount = Number(deal.finalAmount ?? 0);
    if (amount <= 0) continue;
    const category = deal.listing.category;
    const rate = overrideMap.get(category) ?? defaultRate;
    const commission = amount * (rate / 100);
    totalVolume += amount;
    totalCommission += commission;
    const entry = byCategory.get(category) ?? { count: 0, volume: 0, rate, commission: 0 };
    entry.count += 1;
    entry.volume += amount;
    entry.commission += commission;
    byCategory.set(category, entry);
  }

  const pendingPayoutAmount = pendingPayoutDeals.reduce(
    (sum, d) => sum + Number(d.finalAmount ?? 0),
    0,
  );

  return {
    defaultRate,
    totalVolume,
    totalCommission,
    completedCount: completedDeals.length,
    byCategory: [...byCategory.entries()]
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.volume - a.volume),
    pendingPayouts: pendingPayoutDeals.map((d) => ({
      id: d.id,
      title: d.listing.title,
      amount: Number(d.finalAmount ?? 0),
      seller: d.seller.name ?? d.seller.email ?? "Unknown",
      fundedAt: d.escrowFundedAt,
    })),
    pendingPayoutAmount,
    pendingPayoutCount: pendingPayoutDeals.length,
  };
}

export type FinancialsBreakdown = Awaited<ReturnType<typeof getFinancialsBreakdown>>;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Buckets each item into the day it falls on, counting back from today —
// index 0 is the oldest day, the last index is today. Items outside the
// window are dropped.
function bucketByDay(items: { date: Date; value: number }[], days: number): number[] {
  const buckets = new Array(days).fill(0);
  const today = startOfDay(new Date()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  for (const item of items) {
    const dayIndexFromToday = Math.floor((today - startOfDay(item.date).getTime()) / dayMs);
    const idx = days - 1 - dayIndexFromToday;
    if (idx >= 0 && idx < days) buckets[idx] += item.value;
  }
  return buckets;
}

function bucketByMonth(items: { date: Date; value: number }[]): number[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + item.value);
  }
  return [...map.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([, value]) => value);
}

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

// Powers the Overview page's volume chart (7d/30d/all-time toggle) and the
// small per-metric sparklines. Completed deals are fetched in full and
// bucketed in JS (same convention as getFinancialsBreakdown) rather than via
// a DB-side time-bucket aggregate, since Prisma has no portable equivalent
// and the completed-deal count here is small enough that this is cheap at
// this business's current scale.
export async function getOverviewChartData() {
  const [completedAll, signupRows, listingRows, dealRows, settings] = await Promise.all([
    prisma.deal.findMany({
      where: { stage: "COMPLETE", completedAt: { not: null } },
      select: { completedAt: true, finalAmount: true },
    }),
    prisma.user.findMany({ where: { createdAt: { gte: daysAgo(7) } }, select: { createdAt: true } }),
    prisma.listing.findMany({ where: { createdAt: { gte: daysAgo(7) } }, select: { createdAt: true } }),
    prisma.deal.findMany({ where: { createdAt: { gte: daysAgo(7) } }, select: { createdAt: true } }),
    prisma.platformSettings.findUnique({ where: { id: "default" } }),
  ]);

  const commissionPercent = Number(settings?.commissionPercent ?? DEFAULT_COMMISSION_PERCENT);
  const dealPoints = completedAll.map((d) => ({
    date: d.completedAt as Date,
    value: Number(d.finalAmount ?? 0),
  }));

  const volume60dDaily = bucketByDay(dealPoints, 60);
  const volume30dDaily = volume60dDaily.slice(-30);
  const volume7dDaily = volume60dDaily.slice(-7);
  const prior7dDaily = volume60dDaily.slice(-14, -7);
  const prior30dDaily = volume60dDaily.slice(-60, -30);
  const volumeAllMonthly = bucketByMonth(dealPoints);
  const totalVolumeAllTime = sum(dealPoints.map((p) => p.value));

  const pctChange = (current: number, prior: number) =>
    prior > 0 ? Math.round(((current - prior) / prior) * 100) : null;

  const commissionDaily7d = volume7dDaily.map((v) => v * (commissionPercent / 100));

  return {
    volume: {
      "7d": volume7dDaily,
      "30d": volume30dDaily,
      all: volumeAllMonthly,
    },
    volumeTotals: {
      "7d": sum(volume7dDaily),
      "30d": sum(volume30dDaily),
      all: totalVolumeAllTime,
    },
    volumeDeltaPct: {
      "7d": pctChange(sum(volume7dDaily), sum(prior7dDaily)),
      "30d": pctChange(sum(volume30dDaily), sum(prior30dDaily)),
      all: null,
    },
    signupsDaily7d: bucketByDay(
      signupRows.map((u) => ({ date: u.createdAt, value: 1 })),
      7,
    ),
    listingsDaily7d: bucketByDay(
      listingRows.map((l) => ({ date: l.createdAt, value: 1 })),
      7,
    ),
    dealsOpenedDaily7d: bucketByDay(
      dealRows.map((d) => ({ date: d.createdAt, value: 1 })),
      7,
    ),
    commissionDaily7d,
  };
}

export type OverviewChartData = Awaited<ReturnType<typeof getOverviewChartData>>;
