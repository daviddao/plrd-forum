import { NextRequest, NextResponse } from "next/server";

/**
 * - API requests get RFC-correct rate-limit headers (fixed 120 req/min window,
 *   Retry-After on 429) so agents can self-throttle.
 * - Page requests support markdown content negotiation (acceptmarkdown.com):
 *   `Accept: text/markdown` serves the markdown variant, and HTML responses
 *   advertise `Vary: Accept` so caches never mix variants.
 */

const LIMIT = 120;
const WINDOW_MS = 60_000;

// per-isolate fixed window; instances are small and the limit is generous
const hits = new Map<string, { count: number; windowStart: number }>();

function rateLimit(req: NextRequest): { headers: Record<string, string>; limited: boolean } {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  let entry = hits.get(ip);
  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    entry = { count: 0, windowStart: now };
    hits.set(ip, entry);
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (now - v.windowStart >= WINDOW_MS) hits.delete(k);
    }
  }
  entry.count += 1;
  const reset = Math.ceil((entry.windowStart + WINDOW_MS) / 1000);
  const headers: Record<string, string> = {
    "RateLimit-Limit": String(LIMIT),
    "RateLimit-Remaining": String(Math.max(LIMIT - entry.count, 0)),
    "RateLimit-Reset": String(reset),
    "RateLimit-Policy": `${LIMIT};w=${WINDOW_MS / 1000}`,
  };
  return { headers, limited: entry.count > LIMIT };
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api")) {
    const { headers, limited } = rateLimit(req);
    // unversioned aliases are deprecated in favor of /api/v1/* (RFC 9745)
    if (!pathname.startsWith("/api/v1") && !pathname.startsWith("/.well-known")) {
      headers["Deprecation"] = "@1767225600"; // 2026-01-01
      headers["Link"] = '</api/v1/posts>; rel="successor-version"';
      headers["Sunset"] = "Sat, 01 Jan 2027 00:00:00 GMT";
    }
    if (limited) {
      return new Response(null, {
        status: 429,
        headers: { ...headers, "Retry-After": "60", "Content-Type": "application/problem+json" },
      });
    }
    const res = NextResponse.next();
    for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
    return res;
  }

  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("text/markdown")) {
    const url = req.nextUrl.clone();
    url.pathname = "/api/markdown";
    url.search = `?path=${encodeURIComponent(pathname)}`;
    return NextResponse.rewrite(url);
  }

  const res = NextResponse.next();
  const vary = res.headers.get("Vary");
  if (!vary?.includes("Accept")) {
    res.headers.set("Vary", vary ? `${vary}, Accept` : "Accept");
  }
  return res;
}

export const config = {
  matcher: [
    // everything except Next internals and static assets (files with extensions)
    "/((?!_next/|favicon\\.ico|.*\\.[^./]+$).*)",
  ],
};
