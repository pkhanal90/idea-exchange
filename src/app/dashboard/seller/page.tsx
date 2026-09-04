import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonLink, Button } from "@/components/ui/button";
import { ListingStatusBadge, ListingTypeBadge } from "@/components/listings/badges";
import { CategoryIcon } from "@/components/listings/category-icon";
import { formatCurrency, formatDate } from "@/lib/utils";
import { submitListingForReviewAction } from "@/app/dashboard/seller/actions";
import {
  Bookmark,
  CreditCard,
  DollarSign,
  Eye,
  Handshake,
  LayoutGrid,
  MessageSquare,
  Plus,
  Star,
} from "lucide-react";

const navItems = [
  { href: "/dashboard/seller", label: "My Listings", icon: LayoutGrid },
  { href: "/dashboard/seller/offers", label: "Offers", icon: Handshake },
  { href: "/dashboard/seller/payouts", label: "Payouts", icon: CreditCard },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/seller/ratings", label: "Ratings", icon: Star },
];

export default async function SellerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/dashboard/seller");

  const listings = await prisma.listing.findMany({
    where: { sellerId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  const stats = {
    total: listings.length,
    published: listings.filter((l) => l.status === "PUBLISHED").length,
    underOffer: listings.filter((l) => l.status === "UNDER_OFFER").length,
    sold: listings.filter((l) => l.status === "SOLD").length,
  };

  return (
    <DashboardShell navItems={navItems} activeHref="/dashboard/seller" eyebrow="Seller">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">My Listings</h1>
          <p className="mt-1 text-sm text-ink-500">
            Track review status, views, and offers across everything you&apos;ve listed.
          </p>
        </div>
        <ButtonLink href="/listings/create" size="sm">
          <Plus className="h-4 w-4" />
          New listing
        </ButtonLink>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total listings" value={stats.total} icon={LayoutGrid} tone="ink" />
        <StatCard label="Published" value={stats.published} icon={Eye} tone="success" />
        <StatCard label="Under offer" value={stats.underOffer} icon={Handshake} tone="warning" />
        <StatCard label="Sold" value={stats.sold} icon={DollarSign} tone="accent" />
      </div>

      <div className="mt-8 space-y-3">
        {listings.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-sm font-medium text-ink-700">You haven&apos;t listed an idea yet</p>
              <p className="mt-1 text-sm text-ink-400">
                Structured briefs go through a quick moderation review before going live.
              </p>
              <ButtonLink href="/listings/create" className="mt-5">
                List your first idea
              </ButtonLink>
            </CardContent>
          </Card>
        ) : (
          listings.map((listing) => (
            <Card key={listing.id}>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <CategoryIcon category={listing.category} size="sm" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/listings/${listing.id}`}
                        className="truncate text-sm font-semibold text-ink-900 hover:text-accent-700"
                      >
                        {listing.title}
                      </Link>
                      <ListingStatusBadge status={listing.status} />
                      <ListingTypeBadge type={listing.listingType} />
                    </div>
                    <p className="mt-1 text-xs text-ink-400">
                      Updated {formatDate(listing.updatedAt)} · {listing.viewCount} view
                      {listing.viewCount === 1 ? "" : "s"}
                      {listing.askingPrice ? ` · ${formatCurrency(listing.askingPrice as never)}` : ""}
                    </p>
                    {listing.status === "REJECTED" && listing.rejectionNote && (
                      <p className="mt-1.5 text-xs text-danger-500">{listing.rejectionNote}</p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {listing.status === "DRAFT" && (
                    <form action={submitListingForReviewAction.bind(null, listing.id)}>
                      <Button type="submit" size="sm" variant="secondary">
                        Submit for review
                      </Button>
                    </form>
                  )}
                  <ButtonLink href={`/listings/${listing.id}`} size="sm" variant="outline">
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </ButtonLink>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardShell>
  );
}
