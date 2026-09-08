import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ADMIN_NAV_ITEMS } from "@/lib/admin-nav";
import { UserRow } from "@/components/admin/user-row";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, DollarSign, Handshake, LayoutGrid, MessageSquare, ScrollText } from "lucide-react";

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: AdminUserDetailPageProps) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      statusReason: true,
      accreditationStatus: true,
      createdAt: true,
    },
  });
  if (!user) notFound();

  const [listingCount, offerCount, dealCount, messageThreadCount, auditEntries] = await Promise.all([
    prisma.listing.count({ where: { sellerId: id } }),
    prisma.offer.count({ where: { buyerId: id } }),
    prisma.deal.count({ where: { OR: [{ sellerId: id }, { buyerId: id }] } }),
    prisma.messageThread.count({ where: { OR: [{ sellerId: id }, { buyerId: id }] } }),
    prisma.auditLog.findMany({
      where: { targetType: "User", targetId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { actor: { select: { name: true, email: true } } },
    }),
  ]);

  return (
    <DashboardShell navItems={ADMIN_NAV_ITEMS} activeHref="/admin/users" eyebrow="Admin">
      <Link
        href="/admin/users"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All users
      </Link>

      <UserRow user={user} />

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Listings" value={listingCount} icon={LayoutGrid} tone="ink" />
        <StatCard label="Offers made" value={offerCount} icon={DollarSign} tone="accent" />
        <StatCard label="Deals" value={dealCount} icon={Handshake} tone="success" />
        <StatCard label="Message threads" value={messageThreadCount} icon={MessageSquare} tone="warning" />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-ink-400" />
          <h2 className="text-sm font-semibold text-ink-900">
            Admin actions on this account ({auditEntries.length})
          </h2>
        </div>
        {auditEntries.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-ink-400">
              No admin actions recorded for this user yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {auditEntries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="py-3">
                  <p className="text-sm text-ink-700">
                    <span className="font-medium text-ink-900">
                      {entry.actor.name ?? entry.actor.email}
                    </span>{" "}
                    — {entry.action.replaceAll("_", " ").toLowerCase()}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {formatDate(entry.createdAt)}
                    {entry.ipAddress && ` · ${entry.ipAddress}`}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
