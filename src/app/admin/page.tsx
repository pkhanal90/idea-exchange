import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { ModerationRow } from "@/components/admin/moderation-row";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-nav";

export default async function AdminModerationPage() {
  const pending = await prisma.listing.findMany({
    where: { status: "PENDING_REVIEW" },
    include: { seller: { select: { name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DashboardShell navItems={ADMIN_NAV_ITEMS} activeHref="/admin" eyebrow="Admin">
      <h1 className="text-xl font-semibold text-ink-900">Moderation Queue</h1>
      <p className="mt-1 text-sm text-ink-500">
        Review structured briefs before they become publicly searchable. Approving
        publishes the listing immediately; rejecting sends the seller a reason.
      </p>

      <div className="mt-6 space-y-3">
        {pending.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-sm text-ink-400">
              Nothing pending review.
            </CardContent>
          </Card>
        ) : (
          pending.map((listing) => <ModerationRow key={listing.id} listing={listing} />)
        )}
      </div>
    </DashboardShell>
  );
}
