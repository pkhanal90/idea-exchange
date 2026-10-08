// Shared by the visit beacon (/api/analytics/visit), onboarding, and the admin
// Acquisition report. No third-party analytics: everything is first-party,
// anonymous (no IP or visitor ID stored), and honors Do Not Track.

export const ATTRIBUTION_COOKIE = "ix_attr";
export const ATTRIBUTION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export const HEARD_ABOUT_OPTIONS = [
  { key: "tiktok", label: "TikTok" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "reddit", label: "Reddit" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "x", label: "X (Twitter)" },
  { key: "search", label: "Google or other search" },
  { key: "friend", label: "A friend or colleague" },
  { key: "newsletter", label: "Newsletter or podcast" },
  { key: "community", label: "Product Hunt, Hacker News or Indie Hackers" },
  { key: "other", label: "Other" },
] as const;

export const HEARD_ABOUT_LABELS: Record<string, string> = Object.fromEntries(
  HEARD_ABOUT_OPTIONS.map((o) => [o.key, o.label]),
);

export function isHeardAboutKey(value: string): boolean {
  return value in HEARD_ABOUT_LABELS;
}

export type Touch = {
  source: string;
  medium: string;
  campaign: string | null;
  referrer: string | null;
  landing: string;
};

// Client-supplied values are untrusted: lowercase, strip to a safe charset,
// and cap length so nothing weird lands in the database or the admin table.
function clean(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  const v = value.toLowerCase().replace(/[^a-z0-9._\-+ ]/g, "").trim().slice(0, max);
  return v || null;
}

const SOCIAL = new Set(["tiktok", "instagram", "facebook", "x", "linkedin", "reddit", "youtube"]);
const SEARCH = new Set(["google", "bing", "duckduckgo", "yahoo"]);

// Referrer hostname → a short, stable source name. Anything unrecognised
// keeps its own hostname, so new referrers still show up in the report.
function sourceFromHost(host: string): string {
  const h = host.replace(/^www\./, "");
  if (/(^|\.)tiktok\.com$/.test(h)) return "tiktok";
  if (/(^|\.)instagram\.com$/.test(h)) return "instagram";
  if (/(^|\.)(facebook|fb)\.com$/.test(h) || h === "fb.me") return "facebook";
  if (h === "t.co" || /(^|\.)(twitter|x)\.com$/.test(h)) return "x";
  if (/(^|\.)linkedin\.com$/.test(h) || h === "lnkd.in") return "linkedin";
  if (/(^|\.)reddit\.com$/.test(h)) return "reddit";
  if (/(^|\.)youtube\.com$/.test(h) || h === "youtu.be") return "youtube";
  if (/(^|\.)google\.[a-z.]+$/.test(h)) return "google";
  if (/(^|\.)bing\.com$/.test(h)) return "bing";
  if (/(^|\.)duckduckgo\.com$/.test(h)) return "duckduckgo";
  if (/(^|\.)yahoo\.com$/.test(h)) return "yahoo";
  if (h === "news.ycombinator.com") return "hackernews";
  if (/(^|\.)producthunt\.com$/.test(h)) return "producthunt";
  if (/(^|\.)indiehackers\.com$/.test(h)) return "indiehackers";
  return h.slice(0, 60);
}

function mediumForSource(source: string): string {
  if (SOCIAL.has(source)) return "social";
  if (SEARCH.has(source)) return "organic";
  return "referral";
}

export function parseTouch({
  path,
  search,
  referrer,
  ownHost,
}: {
  path: string;
  search: string;
  referrer: string;
  ownHost: string;
}): Touch {
  const params = new URLSearchParams(search);
  const utmSource = clean(params.get("utm_source"), 40);
  const utmMedium = clean(params.get("utm_medium"), 40);
  const campaign = clean(params.get("utm_campaign"), 60);

  let referrerHost: string | null = null;
  try {
    const host = referrer ? new URL(referrer).hostname : "";
    // Same-site referrers are internal navigation, not an acquisition source.
    if (host && host.replace(/^www\./, "") !== ownHost.replace(/^www\./, "")) {
      referrerHost = host.slice(0, 80);
    }
  } catch {
    // Malformed referrer — treat as none.
  }

  let source = "direct";
  let medium = "direct";
  if (utmSource) {
    source = utmSource;
    medium = utmMedium ?? mediumForSource(utmSource);
  } else if (referrerHost) {
    source = sourceFromHost(referrerHost);
    medium = mediumForSource(source);
  }

  const landing = path.startsWith("/") ? path.split("?")[0].slice(0, 200) : "/";
  return { source, medium, campaign, referrer: referrerHost, landing };
}

// Compact cookie payload (first-touch attribution carried to sign-up).
export function encodeAttribution(t: Touch): string {
  return encodeURIComponent(
    JSON.stringify({ s: t.source, m: t.medium, c: t.campaign, r: t.referrer, l: t.landing }),
  );
}

export function decodeAttribution(raw: string | undefined): Touch | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(decodeURIComponent(raw));
    if (typeof o?.s !== "string" || typeof o?.m !== "string") return null;
    return {
      source: clean(o.s, 60) ?? "direct",
      medium: clean(o.m, 40) ?? "direct",
      campaign: clean(o.c, 60),
      referrer: typeof o.r === "string" ? o.r.slice(0, 80) : null,
      landing: typeof o.l === "string" ? o.l.slice(0, 200) : "/",
    };
  } catch {
    return null;
  }
}

// Platforms offered in the admin link builder. `medium` follows the same
// classification parseTouch uses so builder links and referrer-detected visits
// land in the same report rows.
export const LINK_BUILDER_SOURCES = [
  { source: "tiktok", medium: "social", label: "TikTok" },
  { source: "instagram", medium: "social", label: "Instagram" },
  { source: "facebook", medium: "social", label: "Facebook" },
  { source: "reddit", medium: "social", label: "Reddit" },
  { source: "linkedin", medium: "social", label: "LinkedIn" },
  { source: "x", medium: "social", label: "X (Twitter)" },
  { source: "youtube", medium: "social", label: "YouTube" },
  { source: "newsletter", medium: "email", label: "Newsletter" },
  { source: "email", medium: "email", label: "Personal email / DM outreach" },
  { source: "producthunt", medium: "referral", label: "Product Hunt" },
  { source: "hackernews", medium: "referral", label: "Hacker News" },
  { source: "indiehackers", medium: "referral", label: "Indie Hackers" },
  { source: "partner", medium: "referral", label: "Partner / club / studio" },
] as const;
