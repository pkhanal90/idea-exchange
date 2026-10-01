import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { getAdminNavItems } from "@/lib/admin-nav";
import { getUnreadMessageCount } from "@/lib/messages";

export default async function AdminSponsoredPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin/sponsored");
  const unreadMessages = await getUnreadMessageCount(session.user.id);

  return (
    <DashboardShell
      navItems={getAdminNavItems(unreadMessages, session.user.adminRole)}
      activeHref="/admin/sponsored"
      eyebrow="Admin"
      tone="ADMIN"
    >
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
