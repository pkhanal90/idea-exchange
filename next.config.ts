import type { NextConfig } from "next";

// 'unsafe-inline' on script-src/style-src is a deliberate tradeoff, not an
// oversight: Next.js App Router hydration and this app's own inline style
// attributes (e.g. src/components/marketing/hero-showcase.tsx) need it, and
// a nonce-based policy is real extra engineering with real risk of silently
// breaking pages if the nonce plumbing is wrong. This app has zero
// dangerouslySetInnerHTML/raw-HTML sinks (audited), so this CSP's actual job
// is blocking third-party script/resource loading and clickjacking — not
// standing in for an XSS defense the app doesn't otherwise need.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions default to a 1MB body limit — raise it so the pitch
    // deck upload in the create-listing form (capped at 10MB in code) works.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [{ source: "/(.*)", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
