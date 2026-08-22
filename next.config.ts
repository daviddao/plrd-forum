import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async rewrites() {
    return [
      // MCP server published at the well-known location (handler: /api/mcp)
      { source: "/.well-known/mcp", destination: "/api/mcp" },
      // RFC 9727-style API catalog
      { source: "/.well-known/api-catalog", destination: "/.well-known/api-catalog.json" },
      // Versioned public API surface — /api/v1/* is the stable contract;
      // unversioned /api/* paths remain as aliases during the deprecation window.
      { source: "/api/v1/:path*", destination: "/api/:path*" },
      // Pipoya sprite layers are served from simocracy.org (full set: all
      // character sets × 12 animation frames × all part folders, ~60MB)
      // instead of vendoring them into this repo.
      {
        source: "/pipoya-sprites/:path*",
        destination: "https://www.simocracy.org/pipoya-sprites/:path*",
      },
    ];
  },
};

export default nextConfig;
