import {
  BarChart3,
  Handshake,
  LayoutGrid,
  Megaphone,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

export const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Moderation", icon: ShieldCheck },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/listings", label: "Listings", icon: LayoutGrid },
  { href: "/admin/deals", label: "Deals", icon: Handshake },
  { href: "/admin/financials", label: "Financials", icon: BarChart3 },
  { href: "/admin/sponsored", label: "Sponsored", icon: Megaphone },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
];
