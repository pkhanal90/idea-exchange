import { Bookmark, CreditCard, Handshake, LayoutGrid, MessageSquare, ShoppingBag, Star } from "lucide-react";
import type { NavItem } from "@/components/dashboard/dashboard-shell";

// Shared by Seller and Buyer dashboards: both account types can both list
// ideas for sale and buy from other listings, so both sides of the nav are
// always present regardless of which one the account started as. Investor
// accounts stay on their own, buy-only nav (see dashboard/investor/page.tsx).
export function getAccountNavItems(unreadMessages = 0): NavItem[] {
  return [
    { href: "/dashboard/seller", label: "My Listings", icon: LayoutGrid },
    { href: "/dashboard/seller/offers", label: "Offers Received", icon: Handshake },
    { href: "/dashboard/buyer", label: "My Purchases", icon: ShoppingBag },
    { href: "/dashboard/seller/payouts", label: "Payouts", icon: CreditCard },
    { href: "/saved", label: "Saved", icon: Bookmark },
    { href: "/messages", label: "Messages", icon: MessageSquare, badge: unreadMessages || undefined },
    { href: "/dashboard/seller/ratings", label: "Ratings", icon: Star },
  ];
}
