import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient, fixAuthorizeUrl } from "@/lib/auth/client";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const method = form.get("method");

  if (method === "email") {
    const email = String(form.get("email") ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.redirect(new URL("/login?error=email", req.url), { status: 303 });
    }
    const epdsUrl = process.env.EPDS_URL;
    if (!epdsUrl) {
      return NextResponse.redirect(new URL("/login?error=unavailable", req.url), { status: 303 });
    }
    try {
      // Same SDK + callback as handle login. Ported from simocracy-v2's
      // app/api/oauth/login/route.ts; email hints belong on the redirect URL.
      const url = fixAuthorizeUrl(await getOAuthClient().authorize(epdsUrl));
      url.searchParams.set("login_hint", email);
      // Avoid reusing a different account's existing ePDS browser session.
      url.searchParams.set("prompt", "login");
      return NextResponse.redirect(url, { status: 303 });
    } catch {
      // Do not log the email or an authorization URL containing it.
      console.error("ePDS authorization failed");
      return NextResponse.redirect(new URL("/login?error=unavailable", req.url), { status: 303 });
    }
  }

  // No method preserves existing clients that post only a handle.
  const handle = String(form.get("handle") ?? "").trim().replace(/^@/, "");
  if (!handle) {
    return NextResponse.redirect(new URL("/login?error=missing", req.url), { status: 303 });
  }
  try {
    const url = await getOAuthClient().authorize(handle);
    // 303 forces the browser to follow with GET — a 307 would re-POST the
    // login form to the PDS authorize endpoint (breaking CSRF checks there).
    return NextResponse.redirect(fixAuthorizeUrl(url), { status: 303 });
  } catch (err) {
    console.error("oauth authorize failed", err);
    return NextResponse.redirect(new URL("/login?error=resolve", req.url), { status: 303 });
  }
}
