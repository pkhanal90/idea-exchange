import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getAdminNavItems } from "@/lib/admin-nav";
import { getUnreadMessageCount } from "@/lib/messages";
import { ListingRow } from "@/components/admin/listing-row";
import { Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CATEGORY_LABELS, LISTING_STATUS_LABELS } from "@/lib/constants";
import type { IndustryCategory, ListingStatus, Prisma } from "@prisma/client";

interface AdminListingsPageProps {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>;
}

export default async function AdminListingsPage({ searchParams }: AdminListingsPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/admin/listings");

  const { q, status, category } = await searchParams;

  const where: Prisma.ListingWhereInput = {
    ...(q && { title: { contains: q, mode: "insensitive" } }),
    ...(status && { status: status as ListingStatus }),
    ...(category && { category: category as IndustryCategory }),
  };

  const [listings, unreadMessages] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: { seller: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    getUnreadMessageCount(session.user.id),
  ]);

  return (
    <DashboardShell
      navItems={getAdminNavItems(unreadMessages, session.user.adminRole)}
      activeHref="/admin/listings"
      eyebrow="Admin"
      tone="ADMIN"
    >
      <h1 className="text-xl font-semibold text-ink-900">Listings</h1>
      <p className="mt-1 text-sm text-ink-500">
        Every listing regardless of status — feature, unfeature, or remove from the marketplace.
      </p>

      <form className="mt-6 flex flex-wrap gap-3">
        <Input name="q" defaultValue={q} placeholder="Search by title" className="max-w-xs" />
        <Select name="status" defaultValue={status ?? ""} className="max-w-48">
          <option value="">All statuses</option>
          {Object.entries(LISTING_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select name="category" defaultValue={category ?? ""} className="max-w-48">
          <option value="">All categories</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
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
        {listings.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-sm text-ink-400">
              No listings match those filters.
            </CardContent>
          </Card>
        ) : (
          listings.map((listing) => <ListingRow key={listing.id} listing={listing} />)
        )}
      </div>
    </DashboardShell>
  );
}
