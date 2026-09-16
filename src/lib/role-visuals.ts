import type { UserRole } from "@prisma/client";

// Single source of truth for how each account type looks across the app —
// navbar avatar ring, the onboarding cards, and each dashboard's accent.
// Colors deliberately avoid the app's existing semantic scale (success=green,
// warning=amber-ish, danger=red) even where a hue is close, so a role's color
// never reads as a status.
export const ROLE_VISUALS: Record<
  UserRole,
  {
    label: string;
    dashboardHref: string;
    gradient: string; // nav active-state / avatar ring background
    ring: string; // avatar ring color
    chipBg: string;
    chipText: string;
    pageBg: string; // dashboard page background wash
    glowA: string; // primary blurred background glow
    glowB: string; // secondary blurred background glow
  }
> = {
  SELLER: {
    label: "Seller",
    dashboardHref: "/dashboard/seller",
    gradient: "from-accent-500 to-accent-700",
    ring: "ring-accent-400",
    chipBg: "bg-accent-50",
    chipText: "text-accent-700",
    pageBg: "bg-accent-50/60",
    glowA: "bg-accent-400/25",
    glowB: "bg-accent-600/15",
  },
  BUYER: {
    label: "Buyer",
    dashboardHref: "/dashboard/buyer",
    gradient: "from-sky-500 to-sky-700",
    ring: "ring-sky-400",
    chipBg: "bg-sky-50",
    chipText: "text-sky-700",
    pageBg: "bg-sky-50/60",
    glowA: "bg-sky-400/25",
    glowB: "bg-sky-600/15",
  },
  INVESTOR: {
    label: "Investor",
    dashboardHref: "/dashboard/investor",
    gradient: "from-amber-500 to-amber-700",
    ring: "ring-amber-400",
    chipBg: "bg-amber-50",
    chipText: "text-amber-700",
    pageBg: "bg-amber-50/60",
    glowA: "bg-amber-400/25",
    glowB: "bg-amber-600/15",
  },
  ADMIN: {
    label: "Admin",
    dashboardHref: "/admin",
    gradient: "from-ink-700 to-ink-900",
    ring: "ring-ink-400",
    chipBg: "bg-ink-900",
    chipText: "text-white",
    pageBg: "bg-ink-100/50",
    glowA: "bg-ink-400/15",
    glowB: "bg-ink-600/10",
  },
};
