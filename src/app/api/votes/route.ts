import { NextRequest, NextResponse } from "next/server";
import { getSessionAgent } from "@/lib/auth/session";
import { db, tables } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { indexRecord, deleteRecord } from "@/lib/ingest";
import { RECOMMEND_NSID, type LeafletRecommend } from "@/lib/leaflet/types";

/** Toggle a pub.leaflet.interactions.recommend (upvote) on a subject. */
export async function POST(req: NextRequest) {
  const auth = await getSessionAgent();
  if (!auth) return NextResponse.json({ error: "not logged in" }, { status: 401 });

  const body = (await req.json()) as { subject?: string };
  const subject = body.subject?.trim();
  if (!subject) return NextResponse.json({ error: "subject required" }, { status: 400 });

  const existing = db
    .select()
    .from(tables.votes)
    .where(and(eq(tables.votes.did, auth.did), eq(tables.votes.subject, subject)))
    .get();

  if (existing) {
    // retract vote
    const rkey = existing.uri.split("/").pop()!;
    await auth.agent.com.atproto.repo.deleteRecord({
      repo: auth.did,
      collection: RECOMMEND_NSID,
      rkey,
    });
    deleteRecord(auth.did, RECOMMEND_NSID, rkey);
    return NextResponse.json({ voted: false });
  }

  const record: LeafletRecommend = {
    $type: RECOMMEND_NSID,
    subject,
    createdAt: new Date().toISOString(),
  };
  const res = await auth.agent.com.atproto.repo.createRecord({
    repo: auth.did,
    collection: RECOMMEND_NSID,
    record,
  });
  const rkey = res.data.uri.split("/").pop()!;
  indexRecord(auth.did, RECOMMEND_NSID, rkey, record);

  return NextResponse.json({ voted: true });
}
