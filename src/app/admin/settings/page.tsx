import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-nav";

export default function AdminSettingsPage() {
  return (
    <DashboardShell navItems={ADMIN_NAV_ITEMS} activeHref="/admin/settings" eyebrow="Admin">
      <h1 className="text-xl font-semibold text-ink-900">Platform Settings</h1>
      <p className="mt-1 text-sm text-ink-500">
        Commission rate, per-category overrides, featured-listing pricing, and categories —
        editable without a code deploy.
      </p>
      <div className="mt-6">
        <ComingSoon
          title="The settings panel is next"
          body="Reads and writes the singleton PlatformSettings row (plus CategoryCommissionOverride) already added to the schema, so every value here takes effect immediately across the app."
        />
      </div>
    </DashboardShell>
  );
}
