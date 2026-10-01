import {
  BarChart3,
  Gauge,
  Handshake,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { NavItem } from "@/components/dashboard/dashboard-shell";

// Admins don't normally buy/sell, but an admin account can end up on either
// side of a message thread (e.g. it also owns a listing), so the nav still
// needs a way to surface that rather than leaving it undiscoverable.
export function getAdminNavItems(unreadMessages = 0): NavItem[] {
  return [
    { href: "/admin", label: "Overview", icon: Gauge },
    { href: "/admin/moderation", label: "Moderation", icon: ShieldCheck },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/listings", label: "Listings", icon: LayoutGrid },
    { href: "/admin/deals", label: "Deals", icon: Handshake },
    { href: "/admin/financials", label: "Financials", icon: BarChart3 },
    { href: "/admin/sponsored", label: "Sponsored", icon: Megaphone },
    { href: "/messages", label: "Messages", icon: MessageSquare, badge: unreadMessages || undefined },
    { href: "/admin/settings", label: "Settings", icon: Settings },
    { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
  ];
}
