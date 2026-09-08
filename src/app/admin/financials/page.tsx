import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-nav";

export default function AdminFinancialsPage() {
  return (
    <DashboardShell navItems={ADMIN_NAV_ITEMS} activeHref="/admin/financials" eyebrow="Admin">
      <h1 className="text-xl font-semibold text-ink-900">Financials</h1>
      <p className="mt-1 text-sm text-ink-500">
        Transaction volume, commission earned, and payout status.
      </p>
      <div className="mt-6">
        <ComingSoon
          title="The financial dashboard is next"
          body="Total volume and commission by day/week/month, plus pending vs. completed payouts, computed from completed deals and PlatformSettings.commissionPercent (with per-category overrides)."
        />
      </div>
    </DashboardShell>
  );
}
