import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { STEP_UP_COOKIE, isStepUpValid } from "@/lib/totp-session";
import { canAccessSection, type AdminSection } from "@/lib/admin-permissions";
import type { UserRole } from "@prisma/client";

export class ForbiddenError extends Error {}

// Server-side role gate for use inside server actions and route handlers —
// the proxy.ts middleware keeps unauthorized users off protected pages, but
// a server action is reachable by its POST endpoint regardless of which page
// rendered the form, so every admin-only action re-checks role and account
// status here too (defense in depth, not just UI-level hiding).
export async function requireRole(allowed: UserRole[]) {
  const session = await auth();
  if (!session?.user) throw new ForbiddenError("Not signed in");
  if (session.user.status !== "ACTIVE") {
    throw new ForbiddenError("Account is not active");
  }
  if (!allowed.includes(session.user.role)) {
    throw new ForbiddenError(`Requires one of: ${allowed.join(", ")}`);
  }
  return session;
}

export function requireAdmin() {
  return requireRole(["ADMIN"]);
}

// requireAdmin() only re-checks role/status — enough for the setup/verify
// actions themselves, since satisfying the TOTP step-up is what they're for.
// Every *other* admin mutation should call this instead: it additionally
// requires a fresh step-up cookie, closing the same server-action bypass
// that requireAdmin() closes for role (proxy.ts can't be trusted alone here
// since a server action is reachable by its own endpoint regardless of which
// page's middleware gate would normally apply to that path).
export async function requireVerifiedAdmin() {
  const session = await requireAdmin();
  const stepUpCookie = (await cookies()).get(STEP_UP_COOKIE)?.value;
  if (!(await isStepUpValid(stepUpCookie, session.user.id))) {
    throw new ForbiddenError("Two-factor verification required");
  }
  return session;
}

// Every admin mutation should use this (not requireVerifiedAdmin() alone)
// once it belongs to a specific dashboard section — proxy.ts enforces the
// same section/role mapping at the edge for page views, but a server action
// is reachable by its own endpoint regardless of which page's middleware
// gate would normally apply, so the check is repeated here too.
export async function requireAdminSection(section: AdminSection) {
  const session = await requireVerifiedAdmin();
  if (!canAccessSection(session.user.adminRole, section)) {
    throw new ForbiddenError(`Your admin role doesn't have access to ${section}.`);
  }
  return session;
}
