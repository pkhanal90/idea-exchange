import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminNavItems } from "@/lib/admin-nav";
import { getUnreadMessageCount } from "@/lib/messages";
import { getAdminOverviewMetrics } from "@/lib/admin-metrics";
import { formatCurrency, timeAgo } from "@/lib/utils";
import {
  AlertTriangle,
  BadgeCheck,
  Clock,
  DollarSign,
  Handshake,
  LayoutGrid,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  SELLER: "Sellers",
  BUYER: "Buyers",
  INVESTOR: "Investors",
  ADMIN: "Admins",
};

export default async function AdminOverviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin");

  const [metrics, unreadMessages] = await Promise.all([
    getAdminOverviewMetrics(),
    getUnreadMessageCount(session.user.id),
  ]);

  const oldestPendingAge = metrics.oldestPendingAt
    ? Math.floor((Date.now() - metrics.oldestPendingAt.getTime()) / (24 * 60 * 60 * 1000))
    : null;

  return (
    <DashboardShell
      navItems={getAdminNavItems(unreadMessages)}
      activeHref="/admin"
      eyebrow="Admin"
      tone="ADMIN"
    >
      <h1 className="text-xl font-semibold text-ink-900">Overview</h1>
      <p className="mt-1 text-sm text-ink-500">
        Everything that needs your attention, at a glance.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-ink-900">Needing action</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Link href="/admin/moderation">
            <StatCard
              label="Pending moderation"
              value={metrics.pendingModeration}
              icon={ShieldCheck}
              tone={metrics.pendingModeration > 0 ? "warning" : "success"}
            />
          </Link>
          <Link href="/messages">
            <StatCard
              label="Unread messages"
              value={unreadMessages}
              icon={ScrollText}
              tone={unreadMessages > 0 ? "warning" : "success"}
            />
          </Link>
          <Link href="/admin/users?status=SUSPENDED">
            <StatCard
              label="Suspended / banned"
              value={metrics.suspendedOrBanned}
              icon={ShieldAlert}
              tone={metrics.suspendedOrBanned > 0 ? "warning" : "success"}
            />
          </Link>
          <Link href="/admin/deals">
            <StatCard
              label="Disputed deals"
              value={metrics.disputedDeals}
              icon={AlertTriangle}
              tone={metrics.disputedDeals > 0 ? "warning" : "success"}
            />
          </Link>
        </div>
        {oldestPendingAge !== null && oldestPendingAge >= 2 && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-warning-700">
            <Clock className="h-3.5 w-3.5" />
            Oldest pending submission is {oldestPendingAge} day{oldestPendingAge === 1 ? "" : "s"}{" "}
            old.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-ink-900">Growth &amp; activity</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total users" value={metrics.totalUsers} icon={Users} tone="ink" />
          <StatCard
            label="New signups (7d)"
            value={metrics.newSignups}
            icon={UserPlus}
            tone="accent"
          />
          <StatCard
            label="Total listings"
            value={metrics.totalListings}
            icon={LayoutGrid}
            tone="ink"
          />
          <StatCard
            label="Published"
            value={metrics.listingsByStatus.PUBLISHED ?? 0}
            icon={LayoutGrid}
            tone="success"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(metrics.usersByRole).map(([role, count]) => (
            <Badge key={role} tone="neutral">
              {ROLE_LABELS[role] ?? role}: {count}
            </Badge>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-ink-900">Deal &amp; revenue health</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            label="Active deals"
            value={metrics.activeDeals}
            icon={Handshake}
            tone="warning"
          />
          <StatCard
            label="Completed deals"
            value={metrics.completedDealsCount}
            icon={Handshake}
            tone="success"
          />
          <StatCard
            label="Total volume"
            value={formatCurrency(metrics.totalVolume)}
            icon={DollarSign}
            tone="accent"
          />
          <StatCard
            label="Commission earned"
            value={formatCurrency(metrics.commissionEarned)}
            icon={Wallet}
            tone="ink"
          />
        </div>
        {metrics.pendingPayoutCount > 0 && (
          <p className="mt-2 text-xs text-ink-500">
            {metrics.pendingPayoutCount} deal{metrics.pendingPayoutCount === 1 ? "" : "s"} holding{" "}
            {formatCurrency(metrics.pendingPayoutAmount)} in escrow, not yet released.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-ink-900">Trust &amp; safety</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-2">
          <StatCard
            label="New accreditations (7d)"
            value={metrics.recentAccreditations}
            icon={BadgeCheck}
            tone="success"
          />
          <StatCard
            label="Suspended / banned accounts"
            value={metrics.suspendedOrBanned}
            icon={ShieldAlert}
            tone={metrics.suspendedOrBanned > 0 ? "warning" : "success"}
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-ink-900">Recent admin activity</h2>
        {metrics.recentAuditEntries.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-ink-400">
              No admin actions recorded yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {metrics.recentAuditEntries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="flex items-center justify-between gap-2 py-3">
                  <p className="text-sm text-ink-700">
                    <span className="font-medium text-ink-900">
                      {entry.actor.name ?? entry.actor.email}
                    </span>{" "}
                    <Badge tone="accent">{entry.action.replaceAll("_", " ")}</Badge>
                  </p>
                  <span className="shrink-0 text-xs text-ink-400">
                    {timeAgo(entry.createdAt)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <Link
          href="/admin/audit-log"
          className="mt-2 inline-block text-xs font-medium text-accent-700 hover:text-accent-800"
        >
          View full audit log →
        </Link>
      </section>
    </DashboardShell>
  );
}
