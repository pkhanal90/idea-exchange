import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLatestOfferPerChain } from "@/lib/offers";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { OfferChainRow } from "@/components/offers/offer-chain-row";
import { Bookmark, CreditCard, Handshake, LayoutGrid, MessageSquare, Star } from "lucide-react";

const navItems = [
  { href: "/dashboard/seller", label: "My Listings", icon: LayoutGrid },
  { href: "/dashboard/seller/offers", label: "Offers", icon: Handshake },
  { href: "/dashboard/seller/payouts", label: "Payouts", icon: CreditCard },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/seller/ratings", label: "Ratings", icon: Star },
];

export default async function SellerOffersPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/dashboard/seller/offers");

  const offerChains = await getLatestOfferPerChain({ listing: { sellerId: session.user.id } });

  return (
    <DashboardShell navItems={navItems} activeHref="/dashboard/seller/offers" eyebrow="Seller">
      <h1 className="text-xl font-semibold text-ink-900">Offers</h1>
      <p className="mt-1 text-sm text-ink-500">
        Every negotiation across your listings — accept, counter, or decline from each thread.
      </p>

      <div className="mt-6">
        {offerChains.length === 0 ? (
          <ComingSoon
            title="No offers yet"
            body="Offers made on your published listings will show up here."
          />
        ) : (
          <div className="space-y-2">
            {offerChains.map((offer) => (
              <OfferChainRow
                key={offer.id}
                offer={offer}
                otherPartyLabel={`Buyer: ${offer.buyer.name ?? offer.buyer.email}`}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
