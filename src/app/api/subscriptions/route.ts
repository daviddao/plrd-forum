import { NextRequest, NextResponse } from "next/server";
import { getSessionAgent } from "@/lib/auth/session";
import { db, tables } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { indexRecord, deleteRecord } from "@/lib/ingest";
import { SITE_SUBSCRIPTION_NSID, type StandardSubscription } from "@/lib/leaflet/types";

/** Toggle a site.standard.graph.subscription (follow) on a publication. */
export async function POST(req: NextRequest) {
  const auth = await getSessionAgent();
  if (!auth) return NextResponse.json({ error: "not logged in" }, { status: 401 });

  const body = (await req.json()) as { publication?: string };
  const publication = body.publication?.trim();
  if (!publication || !/^at:\/\/[^/]+\/[^/]+\/[^/]+$/.test(publication)) {
    return NextResponse.json({ error: "publication at-uri required" }, { status: 400 });
  }

  const existing = db
    .select()
    .from(tables.subscriptions)
    .where(
      and(
        eq(tables.subscriptions.did, auth.did),
        eq(tables.subscriptions.publication, publication),
      ),
    )
    .get();

  if (existing) {
    const rkey = existing.uri.split("/").pop()!;
    await auth.agent.com.atproto.repo.deleteRecord({
      repo: auth.did,
      collection: SITE_SUBSCRIPTION_NSID,
      rkey,
    });
    deleteRecord(auth.did, SITE_SUBSCRIPTION_NSID, rkey);
    return NextResponse.json({ subscribed: false });
  }

  const record: StandardSubscription = {
    $type: SITE_SUBSCRIPTION_NSID,
    publication,
    createdAt: new Date().toISOString(),
  };
  const res = await auth.agent.com.atproto.repo.createRecord({
    repo: auth.did,
    collection: SITE_SUBSCRIPTION_NSID,
    record,
  });
  const rkey = res.data.uri.split("/").pop()!;
  indexRecord(auth.did, SITE_SUBSCRIPTION_NSID, rkey, record);

  return NextResponse.json({ subscribed: true });
}
