import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getBuyerSideDashboardData } from "@/lib/offers";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { ListingCard } from "@/components/listings/listing-card";
import { OfferChainRow } from "@/components/offers/offer-chain-row";
import { Bookmark, Handshake, LayoutGrid, MessageSquare, Unlock } from "lucide-react";

const navItems = [
  { href: "/dashboard/buyer", label: "My Offers", icon: LayoutGrid },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

export default async function BuyerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/dashboard/buyer");

  const { ndaAcceptances, savedListings, offerChains } = await getBuyerSideDashboardData(
    session.user.id,
  );
  const savedIds = new Set(savedListings.map((s) => s.listingId));

  return (
    <DashboardShell navItems={navItems} activeHref="/dashboard/buyer" eyebrow="Buyer" tone="BUYER">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">My Offers</h1>
        <p className="mt-1 text-sm text-ink-500">
          Listings you&apos;ve unlocked or saved, and every offer you&apos;ve made.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <StatCard label="Unlocked" value={ndaAcceptances.length} icon={Unlock} tone="accent" />
        <StatCard label="Offers" value={offerChains.length} icon={Handshake} tone="warning" />
        <StatCard label="Saved" value={savedListings.length} icon={Bookmark} tone="ink" />
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-center gap-2">
          <Unlock className="h-4 w-4 text-ink-400" />
          <h2 className="text-sm font-semibold text-ink-900">
            Unlocked listings ({ndaAcceptances.length})
          </h2>
        </div>
        {ndaAcceptances.length === 0 ? (
          <ComingSoon
            title="Nothing unlocked yet"
            body="Accept a listing's NDA from its detail page to see full diligence materials here."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ndaAcceptances.map(({ listing }) => (
              <ListingCard key={listing.id} listing={listing} isSaved={savedIds.has(listing.id)} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-center gap-2">
          <Handshake className="h-4 w-4 text-ink-400" />
          <h2 className="text-sm font-semibold text-ink-900">Offers ({offerChains.length})</h2>
        </div>
        {offerChains.length === 0 ? (
          <ComingSoon
            title="No offers yet"
            body="Make an offer from any listing's detail page — cash, equity, royalty, or a mix."
          />
        ) : (
          <div className="space-y-2">
            {offerChains.map((offer) => (
              <OfferChainRow
                key={offer.id}
                offer={offer}
                otherPartyLabel={`Seller: ${offer.listing.seller.name ?? offer.listing.seller.email}`}
              />
            ))}
          </div>
        )}
      </section>

      {savedListings.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Saved ({savedListings.length})</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {savedListings.map(({ listing }) => (
              <ListingCard key={listing.id} listing={listing} isSaved />
            ))}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}
