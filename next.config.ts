import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevents webpack from bundling better-sqlite3's native .node binary.
  // Use serverExternalPackages (Next.js 15+) — the key was renamed at Next.js 15.0.0.
  serverExternalPackages: ["better-sqlite3"],

  // Ensures data/cities.db is included in output file tracing for Railway.
  outputFileTracingIncludes: {
    "/*": ["./data/cities.db"],
  },
};

export default nextConfig;
