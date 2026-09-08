import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-nav";

export default function AdminListingsPage() {
  return (
    <DashboardShell navItems={ADMIN_NAV_ITEMS} activeHref="/admin/listings" eyebrow="Admin">
      <h1 className="text-xl font-semibold text-ink-900">Listings</h1>
      <p className="mt-1 text-sm text-ink-500">
        Every listing regardless of status, with edit/feature/remove controls.
      </p>
      <div className="mt-6">
        <ComingSoon
          title="Full listing management is next"
          body="The moderation queue already covers approve/reject. This view will add browsing every listing (including drafts and sold), editing, removing, and pinning a listing as featured for its category."
        />
      </div>
    </DashboardShell>
  );
}
