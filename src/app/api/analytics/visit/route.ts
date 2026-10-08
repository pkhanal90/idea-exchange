import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_COOKIE_MAX_AGE,
  decodeAttribution,
  encodeAttribution,
  parseTouch,
} from "@/lib/acquisition";

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|curl|wget/i;
const IGNORED_PREFIXES = ["/admin", "/api", "/auth", "/_next"];

// Records one anonymous visit per browsing session (the client beacon sends
// at most once per session) and stores first-touch attribution in a cookie so
// onboarding can attach it to the new account.
export async function POST(req: NextRequest) {
  const ok = new NextResponse(null, { status: 204 });

  if (BOT_UA.test(req.headers.get("user-agent") ?? "")) return ok;

  let body: { path?: unknown; search?: unknown; referrer?: unknown };
  try {
    body = await req.json();
  } catch {
    return ok;
  }

  const path = typeof body.path === "string" ? body.path : "/";
  const search = typeof body.search === "string" ? body.search.slice(0, 500) : "";
  const referrer = typeof body.referrer === "string" ? body.referrer.slice(0, 500) : "";
  if (!path.startsWith("/") || IGNORED_PREFIXES.some((p) => path.startsWith(p))) return ok;

  // Staff browsing their own site shouldn't pollute the numbers.
  const session = await auth();
  if (session?.user?.role === "ADMIN") return ok;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await checkRateLimit({
    identifier: `ip:${ip}`,
    action: "TRACK_VISIT",
    limit: 30,
    windowSeconds: 600,
  });
  if (!limit.allowed) return ok;

  const touch = parseTouch({ path, search, referrer, ownHost: req.nextUrl.hostname });

  await prisma.siteVisit.create({
    data: {
      source: touch.source,
      medium: touch.medium,
      campaign: touch.campaign,
      referrer: touch.referrer,
      landing: touch.landing,
    },
  });

  // First touch wins, except a real source replaces an earlier "direct" one
  // (someone who typed the URL once, then later arrived from a TikTok link).
  const existing = decodeAttribution(req.cookies.get(ATTRIBUTION_COOKIE)?.value);
  if (!existing || (existing.source === "direct" && touch.source !== "direct")) {
    ok.cookies.set(ATTRIBUTION_COOKIE, encodeAttribution(touch), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ATTRIBUTION_COOKIE_MAX_AGE,
    });
  }

  return ok;
}
