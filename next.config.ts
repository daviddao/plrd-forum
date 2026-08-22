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
