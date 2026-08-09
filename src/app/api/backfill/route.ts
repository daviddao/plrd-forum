import { NextRequest, NextResponse } from "next/server";
import { resolveHandleToDid } from "@/lib/atproto/resolve";
import { backfillActor } from "@/lib/ingest/backfill";

/** POST /api/backfill { actor: "handle-or-did" } — index an actor's leaflet records. */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { actor?: string };
  const actor = body.actor?.trim().replace(/^@/, "");
  if (!actor) return NextResponse.json({ error: "actor required" }, { status: 400 });

  const did = await resolveHandleToDid(actor);
  if (!did) return NextResponse.json({ error: "could not resolve actor" }, { status: 404 });

  const count = await backfillActor(did);
  return NextResponse.json({ did, indexed: count });
}
