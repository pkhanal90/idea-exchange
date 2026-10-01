import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { ExportCsvLink } from "@/components/admin/export-csv-link";
import { getAdminNavItems } from "@/lib/admin-nav";
import { getUnreadMessageCount } from "@/lib/messages";
import { getFinancialsBreakdown } from "@/lib/admin-metrics";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, Handshake, Percent, Wallet } from "lucide-react";
import type { IndustryCategory } from "@prisma/client";

export default async function AdminFinancialsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin/financials");

  const [data, unreadMessages] = await Promise.all([
    getFinancialsBreakdown(),
    getUnreadMessageCount(session.user.id),
  ]);

  return (
    <DashboardShell
      navItems={getAdminNavItems(unreadMessages, session.user.adminRole)}
      activeHref="/admin/financials"
      eyebrow="Admin"
      tone="ADMIN"
    >
      <h1 className="text-xl font-semibold text-ink-900">Financials</h1>
      <p className="mt-1 text-sm text-ink-500">
        Transaction volume, commission earned, and payout status — all-time.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total volume" value={formatCurrency(data.totalVolume)} icon={DollarSign} tone="accent" />
        <StatCard
          label="Commission earned"
          value={formatCurrency(data.totalCommission)}
          icon={Wallet}
          tone="ink"
        />
        <StatCard label="Completed deals" value={data.completedCount} icon={Handshake} tone="success" />
        <StatCard label="Default rate" value={`${data.defaultRate}%`} icon={Percent} tone="warning" />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-900">By category</h2>
          <ExportCsvLink href="/admin/financials/export?type=categories" />
        </div>
        {data.byCategory.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-ink-400">
              No completed deals yet.
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-left text-xs font-medium uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Deals</th>
                  <th className="px-4 py-2.5">Volume</th>
                  <th className="px-4 py-2.5">Rate</th>
                  <th className="px-4 py-2.5">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.byCategory.map((row) => (
                  <tr key={row.category}>
                    <td className="px-4 py-2.5 font-medium text-ink-800">
                      {CATEGORY_LABELS[row.category as IndustryCategory]}
                    </td>
                    <td className="px-4 py-2.5 text-ink-600">{row.count}</td>
                    <td className="px-4 py-2.5 font-mono-nums text-ink-800">
                      {formatCurrency(row.volume)}
                    </td>
                    <td className="px-4 py-2.5 text-ink-600">{row.rate}%</td>
                    <td className="px-4 py-2.5 font-mono-nums text-ink-800">
                      {formatCurrency(row.commission)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink-900">
            Pending payouts ({data.pendingPayoutCount})
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-500">
              {formatCurrency(data.pendingPayoutAmount)} held in escrow
            </span>
            <ExportCsvLink href="/admin/financials/export?type=payouts" />
          </div>
        </div>
        {data.pendingPayouts.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-ink-400">
              Nothing currently held in escrow.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {data.pendingPayouts.map((payout) => (
              <Card key={payout.id}>
                <CardContent className="flex items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">{payout.title}</p>
                    <p className="text-xs text-ink-400">
                      Seller: {payout.seller}
                      {payout.fundedAt && ` · Funded ${formatDate(payout.fundedAt)}`}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono-nums text-sm font-semibold text-ink-900">
                    {formatCurrency(payout.amount)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
