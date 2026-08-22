import { NextRequest, NextResponse } from "next/server";

/**
 * Content negotiation (acceptmarkdown.com):
 * - `Accept: text/markdown` → serve the markdown variant of the page.
 * - HTML responses advertise `Vary: Accept` so caches never mix variants.
 */
export function middleware(req: NextRequest) {
  const accept = req.headers.get("accept") ?? "";

  if (accept.includes("text/markdown")) {
    const url = req.nextUrl.clone();
    url.pathname = "/api/markdown";
    url.search = `?path=${encodeURIComponent(req.nextUrl.pathname)}`;
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
    // pages only — skip APIs, Next internals, and any file with an extension
    "/((?!api/|_next/|favicon\\.ico|.*\\.[^./]+$).*)",
  ],
};
