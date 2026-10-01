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
  UserCog,
  Users,
} from "lucide-react";
import { canAccessSection, type AdminSection } from "@/lib/admin-permissions";
import type { NavItem } from "@/components/dashboard/dashboard-shell";
import type { AdminRole } from "@prisma/client";

// Admins don't normally buy/sell, but an admin account can end up on either
// side of a message thread (e.g. it also owns a listing), so the nav still
// needs a way to surface that rather than leaving it undiscoverable.
export function getAdminNavItems(
  unreadMessages: number,
  adminRole: AdminRole | null,
): NavItem[] {
  const allItems: (NavItem & { section: AdminSection })[] = [
    { href: "/admin", label: "Overview", icon: Gauge, section: "overview" },
    { href: "/admin/moderation", label: "Moderation", icon: ShieldCheck, section: "moderation" },
    { href: "/admin/users", label: "Users", icon: Users, section: "users" },
    { href: "/admin/listings", label: "Listings", icon: LayoutGrid, section: "listings" },
    { href: "/admin/deals", label: "Deals", icon: Handshake, section: "deals" },
    { href: "/admin/financials", label: "Financials", icon: BarChart3, section: "financials" },
    { href: "/admin/sponsored", label: "Sponsored", icon: Megaphone, section: "sponsored" },
    {
      href: "/messages",
      label: "Messages",
      icon: MessageSquare,
      badge: unreadMessages || undefined,
      section: "messages",
    },
    { href: "/admin/staff", label: "Staff", icon: UserCog, section: "staff" },
    { href: "/admin/settings", label: "Settings", icon: Settings, section: "settings" },
    { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText, section: "audit-log" },
  ];

  return allItems
    .filter((item) => canAccessSection(adminRole, item.section))
    .map(({ section: _section, ...item }) => item);
}
