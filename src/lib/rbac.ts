import { auth } from "@/lib/auth";
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
