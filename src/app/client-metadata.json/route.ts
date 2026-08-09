import { NextResponse } from "next/server";
import { getOAuthClient } from "@/lib/auth/client";

export async function GET() {
  return NextResponse.json(getOAuthClient().clientMetadata);
}
