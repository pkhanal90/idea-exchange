import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { getAdminNavItems } from "@/lib/admin-nav";
import { getUnreadMessageCount } from "@/lib/messages";

export default async function AdminFinancialsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin/financials");
  const unreadMessages = await getUnreadMessageCount(session.user.id);

  return (
    <DashboardShell
      navItems={getAdminNavItems(unreadMessages)}
      activeHref="/admin/financials"
      eyebrow="Admin"
      tone="ADMIN"
    >
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
