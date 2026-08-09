import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient, fixAuthorizeUrl } from "@/lib/auth/client";

export async function POST(req: NextRequest) {
  const form = await req.formData();
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
