import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient, fixAuthorizeUrl } from "@/lib/auth/client";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const handle = String(form.get("handle") ?? "").trim().replace(/^@/, "");
  if (!handle) {
    return NextResponse.redirect(new URL("/login?error=missing", req.url));
  }
  try {
    const url = await getOAuthClient().authorize(handle);
    return NextResponse.redirect(fixAuthorizeUrl(url));
  } catch (err) {
    console.error("oauth authorize failed", err);
    return NextResponse.redirect(new URL("/login?error=resolve", req.url));
  }
}
