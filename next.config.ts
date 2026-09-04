import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions default to a 1MB body limit — raise it so the pitch
    // deck upload in the create-listing form (capped at 10MB in code) works.
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
