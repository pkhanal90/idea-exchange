import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLatestOfferPerChain } from "@/lib/offers";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";
import { OfferChainRow } from "@/components/offers/offer-chain-row";
import { getAccountNavItems } from "@/lib/account-nav";
import { getUnreadMessageCount } from "@/lib/messages";

export default async function SellerOffersPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin?callbackUrl=/dashboard/seller/offers");

  const [offerChains, unreadMessages] = await Promise.all([
    getLatestOfferPerChain({ listing: { sellerId: session.user.id } }),
    getUnreadMessageCount(session.user.id),
  ]);

  return (
    <DashboardShell
      navItems={getAccountNavItems(unreadMessages)}
      activeHref="/dashboard/seller/offers"
      eyebrow="Seller"
      tone="SELLER"
    >
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
