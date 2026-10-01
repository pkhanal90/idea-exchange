import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { VolumeTrendCard } from "@/components/admin/volume-trend-card";
import { Sparkline } from "@/components/admin/sparkline";
import { getAdminNavItems } from "@/lib/admin-nav";
import { getUnreadMessageCount } from "@/lib/messages";
import { getAdminOverviewMetrics, getOverviewChartData } from "@/lib/admin-metrics";
import { formatCurrency, cn } from "@/lib/utils";
import { LISTING_STATUS_LABELS } from "@/lib/constants";
import type { UserRole, ListingStatus } from "@prisma/client";

const ROLE_TONE: Record<UserRole, "ink" | "accent" | "warning" | "success"> = {
  SELLER: "ink",
  BUYER: "accent",
  INVESTOR: "warning",
  ADMIN: "success",
};

export default async function AdminOverviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin");

  const [metrics, chart, unreadMessages, recentSignups, recentListings] = await Promise.all([
    getAdminOverviewMetrics(),
    getOverviewChartData(),
    getUnreadMessageCount(session.user.id),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, name: true, email: true, role: true },
    }),
    prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, title: true, status: true, seller: { select: { name: true, email: true } } },
    }),
  ]);

  const oldestPendingAge = metrics.oldestPendingAt
    ? Math.floor((Date.now() - metrics.oldestPendingAt.getTime()) / (24 * 60 * 60 * 1000))
    : null;

  const actionItems: { text: string; href: string; cta: string }[] = [];
  if (metrics.pendingModeration > 0) {
    actionItems.push({
      text: `${metrics.pendingModeration} listing${metrics.pendingModeration === 1 ? "" : "s"} pending moderation${
        oldestPendingAge !== null ? ` · oldest ${oldestPendingAge}d` : ""
      }`,
      href: "/admin/moderation",
      cta: "Review",
    });
  }
  if (metrics.pendingPayoutCount > 0) {
    actionItems.push({
      text: `${formatCurrency(metrics.pendingPayoutAmount)} held in escrow, not yet released`,
      href: "/admin/financials",
      cta: "View",
    });
  }
  if (metrics.suspendedOrBanned > 0) {
    actionItems.push({
      text: `${metrics.suspendedOrBanned} suspended or banned account${metrics.suspendedOrBanned === 1 ? "" : "s"}`,
      href: "/admin/users?status=SUSPENDED",
      cta: "View",
    });
  }
  if (metrics.disputedDeals > 0) {
    actionItems.push({
      text: `${metrics.disputedDeals} disputed deal${metrics.disputedDeals === 1 ? "" : "s"}`,
      href: "/admin/deals?stage=DISPUTED",
      cta: "Review",
    });
  }

  return (
    <DashboardShell
      navItems={getAdminNavItems(unreadMessages, session.user.adminRole)}
      activeHref="/admin"
      eyebrow="Admin"
      tone="ADMIN"
    >
      <VolumeTrendCard
        volume={chart.volume}
        volumeTotals={chart.volumeTotals}
        volumeDeltaPct={chart.volumeDeltaPct}
      />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-white p-3.5">
          <p className="text-xs text-ink-500">New signups (7d)</p>
          <p className="mt-1 text-lg font-semibold text-ink-900">{metrics.newSignups}</p>
          <Sparkline points={chart.signupsDaily7d} color="#10b981" />
        </div>
        <div className="rounded-lg border border-border bg-white p-3.5">
          <p className="text-xs text-ink-500">Listings</p>
          <p className="mt-1 text-lg font-semibold text-ink-900">{metrics.totalListings}</p>
          <Sparkline points={chart.listingsDaily7d} color="#525aec" />
        </div>
        <div className="rounded-lg border border-border bg-white p-3.5">
          <p className="text-xs text-ink-500">Active deals</p>
          <p className="mt-1 text-lg font-semibold text-ink-900">{metrics.activeDeals}</p>
          <Sparkline points={chart.dealsOpenedDaily7d} color="#525aec" />
        </div>
        <div className="rounded-lg border border-border bg-white p-3.5">
          <p className="text-xs text-ink-500">Commission earned</p>
          <p className="mt-1 text-lg font-semibold text-ink-900">{formatCurrency(metrics.commissionEarned)}</p>
          <Sparkline points={chart.commissionDaily7d} color="#10b981" />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-white p-4">
        <p className="text-sm font-semibold text-ink-900">Needs attention</p>
        {actionItems.length === 0 ? (
          <p className="mt-2 text-sm text-success-700">Nothing needs your attention right now.</p>
        ) : (
          <div className="mt-2">
            {actionItems.map((item, i) => (
              <div
                key={item.href + i}
                className={cn(
                  "flex items-center justify-between gap-3 py-2 first:pt-1 last:pb-0",
                  i > 0 && "border-t border-ink-50",
                )}
              >
                <span className="flex items-center gap-2 text-sm text-ink-900">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning-500" />
                  {item.text}
                </span>
                <Link href={item.href} className="shrink-0 text-xs font-medium text-accent-700 hover:text-accent-800">
                  {item.cta}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-900">New signups</p>
            <Link href="/admin/users" className="text-xs font-medium text-accent-700 hover:text-accent-800">
              View all
            </Link>
          </div>
          {recentSignups.map((u, i) => (
            <div
              key={u.id}
              className={cn(
                "flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0",
                i > 0 && "border-t border-ink-50",
              )}
            >
              <Link
                href={`/admin/users/${u.id}`}
                className="truncate text-sm text-ink-900 hover:text-accent-700"
              >
                {u.name ?? u.email}
              </Link>
              <Badge tone={ROLE_TONE[u.role]}>{u.role}</Badge>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-900">New listings</p>
            <Link href="/admin/listings" className="text-xs font-medium text-accent-700 hover:text-accent-800">
              View all
            </Link>
          </div>
          {recentListings.map((l, i) => (
            <div
              key={l.id}
              className={cn("py-2 first:pt-0 last:pb-0", i > 0 && "border-t border-ink-50")}
            >
              <Link
                href={`/listings/${l.id}`}
                target="_blank"
                className="block truncate text-sm text-ink-900 hover:text-accent-700"
              >
                {l.title}
              </Link>
              <p className="truncate text-xs text-ink-400">
                {l.seller.name ?? l.seller.email} · {LISTING_STATUS_LABELS[l.status as ListingStatus]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
