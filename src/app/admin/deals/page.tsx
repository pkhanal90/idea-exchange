import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getAdminNavItems } from "@/lib/admin-nav";
import { getUnreadMessageCount } from "@/lib/messages";
import { DealRow } from "@/components/admin/deal-row";
import { ExportCsvLink } from "@/components/admin/export-csv-link";
import { Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DEAL_STAGE_LABELS } from "@/lib/constants";
import type { DealStage, Prisma } from "@prisma/client";

interface AdminDealsPageProps {
  searchParams: Promise<{ stage?: string }>;
}

export default async function AdminDealsPage({ searchParams }: AdminDealsPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin/deals");

  const { stage } = await searchParams;

  const where: Prisma.DealWhereInput = {
    ...(stage && { stage: stage as DealStage }),
  };

  const [deals, unreadMessages] = await Promise.all([
    prisma.deal.findMany({
      where,
      include: {
        listing: { select: { id: true, title: true } },
        seller: { select: { name: true, email: true } },
        buyer: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    getUnreadMessageCount(session.user.id),
  ]);

  const exportParams = new URLSearchParams({
    ...(stage && { stage }),
  }).toString();

  return (
    <DashboardShell
      navItems={getAdminNavItems(unreadMessages, session.user.adminRole)}
      activeHref="/admin/deals"
      eyebrow="Admin"
      tone="ADMIN"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Deals</h1>
          <p className="mt-1 text-sm text-ink-500">
            Oversight across every deal — cancel, refund via Stripe, or flag one as disputed.
          </p>
        </div>
        <ExportCsvLink href={`/admin/deals/export${exportParams ? `?${exportParams}` : ""}`} />
      </div>

      <form className="mt-6 flex flex-wrap gap-3">
        <Select name="stage" defaultValue={stage ?? ""} className="max-w-52">
          <option value="">All stages</option>
          {Object.entries(DEAL_STAGE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <div className="mt-6 space-y-3">
        {deals.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-sm text-ink-400">
              No deals match that filter.
            </CardContent>
          </Card>
        ) : (
          deals.map((deal) => <DealRow key={deal.id} deal={deal} />)
        )}
      </div>
    </DashboardShell>
  );
}
