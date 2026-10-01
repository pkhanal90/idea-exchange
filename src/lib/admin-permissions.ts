import type { AdminRole } from "@prisma/client";

// "messages" isn't an admin-exclusive route (every account type uses
// /messages) — it's included here only to decide whether the admin nav
// shows a shortcut to it, not to gate the route itself.
export type AdminSection =
  | "overview"
  | "moderation"
  | "users"
  | "listings"
  | "deals"
  | "financials"
  | "sponsored"
  | "settings"
  | "audit-log"
  | "staff"
  | "messages";

export const ADMIN_SECTION_ACCESS: Record<AdminRole, AdminSection[]> = {
  SUPER_ADMIN: [
    "overview",
    "moderation",
    "users",
    "listings",
    "deals",
    "financials",
    "sponsored",
    "settings",
    "audit-log",
    "staff",
    "messages",
  ],
  MODERATOR: ["overview", "moderation", "listings", "messages"],
  SUPPORT: ["overview", "users", "messages"],
  FINANCE: ["overview", "deals", "financials"],
};

// A staff account somehow missing its adminRole (shouldn't happen once the
// backfill has run, but a safe default matters more than a hard crash) falls
// back to the least-privileged view rather than full access.
export function canAccessSection(adminRole: AdminRole | null | undefined, section: AdminSection) {
  const role = adminRole ?? "SUPPORT";
  return ADMIN_SECTION_ACCESS[role].includes(section);
}

// Maps an /admin/* pathname to the section that gates it, for proxy.ts's
// edge-level redirect. Keep in sync with the actual route tree.
export function sectionForAdminPath(pathname: string): AdminSection | null {
  if (pathname === "/admin") return "overview";
  if (pathname.startsWith("/admin/moderation")) return "moderation";
  if (pathname.startsWith("/admin/users")) return "users";
  if (pathname.startsWith("/admin/listings")) return "listings";
  if (pathname.startsWith("/admin/deals")) return "deals";
  if (pathname.startsWith("/admin/financials")) return "financials";
  if (pathname.startsWith("/admin/sponsored")) return "sponsored";
  if (pathname.startsWith("/admin/settings")) return "settings";
  if (pathname.startsWith("/admin/audit-log")) return "audit-log";
  if (pathname.startsWith("/admin/staff")) return "staff";
  // /admin/setup-2fa, /admin/verify-2fa, and the one-off
  // /admin/notify-pending-sellers tool are intentionally not section-gated.
  return null;
}
