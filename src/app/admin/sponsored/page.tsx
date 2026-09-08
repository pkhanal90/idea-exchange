import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-nav";

export default function AdminSponsoredPage() {
  return (
    <DashboardShell navItems={ADMIN_NAV_ITEMS} activeHref="/admin/sponsored" eyebrow="Admin">
      <h1 className="text-xl font-semibold text-ink-900">Sponsored Placements</h1>
      <p className="mt-1 text-sm text-ink-500">
        Manage ad units shown on the homepage and category pages.
      </p>
      <div className="mt-6">
        <ComingSoon
          title="Sponsored placement management is next"
          body="Create/edit a placement (image, text, link, active date range), see impressions and clicks per placement, and control the featured-listing purchase price and duration — the SponsoredPlacement and FeaturedListing tables are already in the schema."
        />
      </div>
    </DashboardShell>
  );
}
