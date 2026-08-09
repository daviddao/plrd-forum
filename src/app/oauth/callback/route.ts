import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/auth/client";
import { getSession } from "@/lib/auth/session";
import { backfillActor } from "@/lib/ingest/backfill";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const { session: oauthSession } = await getOAuthClient().callback(params);
    const session = await getSession();
    session.did = oauthSession.did;
    await session.save();
    // index any existing leaflet records from this user (fire and forget)
    backfillActor(oauthSession.did).catch(() => {});
    return NextResponse.redirect(new URL("/", req.url));
  } catch (err) {
    console.error("oauth callback failed", err);
    return NextResponse.redirect(new URL("/login?error=callback", req.url));
  }
}
