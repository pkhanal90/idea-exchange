import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/listings/create",
  "/messages",
  "/offers",
  "/deals",
  "/saved",
];

// Site-wide password gate for a private pre-launch preview. No-op when
// SITE_PASSWORD isn't set (e.g. local dev), so this never affects developing
// the app itself — only a real deployment where the env var is configured.
function hasValidSitePassword(req: Request): boolean {
  const sitePassword = process.env.SITE_PASSWORD;
  if (!sitePassword) return true;

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) return false;

  const [, password] = Buffer.from(authHeader.slice(6), "base64").toString("utf-8").split(":");
  return password === sitePassword;
}

function requireSitePassword() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Idea Exchange Preview"' },
  });
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Stripe can't provide the site password, so its webhook stays reachable.
  if (!pathname.startsWith("/api/webhooks") && !hasValidSitePassword(req)) {
    return requireSitePassword();
  }

  const isProtected =
    PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    (pathname.startsWith("/listings/") && pathname.endsWith("/offer"));

  if (!isProtected) return NextResponse.next();

  if (!req.auth?.user) {
    const signInUrl = new URL("/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // A suspended/banned account is blocked here even mid-session — the jwt
  // callback re-reads status from the DB on every request, so this reflects
  // an admin action taken seconds ago, not just whatever was true at login.
  if (req.auth.user.status !== "ACTIVE" && pathname !== "/account/suspended") {
    return NextResponse.redirect(new URL("/account/suspended", req.nextUrl.origin));
  }

  if (pathname.startsWith("/admin") && req.auth.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
