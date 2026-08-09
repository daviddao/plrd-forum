import { NextRequest, NextResponse } from "next/server";
import { getSessionAgent } from "@/lib/auth/session";
import { db, tables } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { indexRecord, deleteRecord } from "@/lib/ingest";
import {
  RECOMMEND_NSID,
  SITE_RECOMMEND_NSID,
  type LeafletRecommend,
  type StandardRecommend,
} from "@/lib/leaflet/types";

/**
 * Toggle an upvote on a subject. Documents get the standard.site lexicon
 * (site.standard.graph.recommend, subject field `document`) so votes cast
 * here count on leaflet.pub and every other standard.site reader; comments
 * keep the legacy pub.leaflet.interactions.recommend (standard.site has no
 * comment-recommend shape yet).
 */
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
    // retract vote — the stored uri says which lexicon the record used
    const m = existing.uri.match(/^at:\/\/[^/]+\/([^/]+)\/([^/]+)$/);
    if (!m) return NextResponse.json({ error: "bad vote uri" }, { status: 500 });
    const [, collection, rkey] = m;
    await auth.agent.com.atproto.repo.deleteRecord({
      repo: auth.did,
      collection,
      rkey,
    });
    deleteRecord(auth.did, collection, rkey);
    return NextResponse.json({ voted: false });
  }

  const isDocument = /\/(site\.standard|pub\.leaflet)\.document\//.test(subject);
  let collection: string;
  let record: StandardRecommend | LeafletRecommend;
  if (isDocument) {
    collection = SITE_RECOMMEND_NSID;
    record = {
      $type: SITE_RECOMMEND_NSID,
      document: subject,
      createdAt: new Date().toISOString(),
    };
  } else {
    collection = RECOMMEND_NSID;
    record = {
      $type: RECOMMEND_NSID,
      subject,
      createdAt: new Date().toISOString(),
    };
  }
  const res = await auth.agent.com.atproto.repo.createRecord({
    repo: auth.did,
    collection,
    record,
  });
  const rkey = res.data.uri.split("/").pop()!;
  indexRecord(auth.did, collection, rkey, record);

  return NextResponse.json({ voted: true });
}
