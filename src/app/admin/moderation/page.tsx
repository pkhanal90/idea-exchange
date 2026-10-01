import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { ModerationRow } from "@/components/admin/moderation-row";
import { getAdminNavItems } from "@/lib/admin-nav";
import { getUnreadMessageCount } from "@/lib/messages";

export default async function AdminModerationPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin/moderation");

  const [pending, unreadMessages] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "PENDING_REVIEW" },
      include: { seller: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    getUnreadMessageCount(session.user.id),
  ]);

  return (
    <DashboardShell
      navItems={getAdminNavItems(unreadMessages)}
      activeHref="/admin/moderation"
      eyebrow="Admin"
      tone="ADMIN"
    >
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
