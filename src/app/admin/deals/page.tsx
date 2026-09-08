import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-nav";

export default function AdminDealsPage() {
  return (
    <DashboardShell navItems={ADMIN_NAV_ITEMS} activeHref="/admin/deals" eyebrow="Admin">
      <h1 className="text-xl font-semibold text-ink-900">Deals</h1>
      <p className="mt-1 text-sm text-ink-500">
        Oversight across every deal — cancel, refund via Stripe, or mark disputed.
      </p>
      <div className="mt-6">
        <ComingSoon
          title="Deal oversight is next"
          body="This will list every deal with its current stage, let you cancel or refund one through Stripe, mark it disputed, and view the messages tied to it — schema support (DealStage.DISPUTED, refund fields) is already in place."
        />
      </div>
    </DashboardShell>
  );
}
