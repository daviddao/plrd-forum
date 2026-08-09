import { NextRequest, NextResponse } from "next/server";
import { getSessionAgent } from "@/lib/auth/session";
import { indexRecord } from "@/lib/ingest";
import { parseInline } from "@/lib/leaflet/markdown";
import { COMMENT_NSID, type LeafletComment } from "@/lib/leaflet/types";

export async function POST(req: NextRequest) {
  const auth = await getSessionAgent();
  if (!auth) return NextResponse.json({ error: "not logged in" }, { status: 401 });

  const body = (await req.json()) as { subject?: string; parent?: string; text?: string };
  const subject = body.subject?.trim();
  const text = body.text?.trim();
  if (!subject || !text) {
    return NextResponse.json({ error: "subject and text required" }, { status: 400 });
  }

  const { plaintext, facets } = parseInline(text);
  const record: LeafletComment = {
    $type: COMMENT_NSID,
    subject,
    plaintext,
    createdAt: new Date().toISOString(),
    ...(facets.length ? { facets } : {}),
    ...(body.parent ? { reply: { parent: body.parent } } : {}),
  };

  const res = await auth.agent.com.atproto.repo.createRecord({
    repo: auth.did,
    collection: COMMENT_NSID,
    record,
  });

  const rkey = res.data.uri.split("/").pop()!;
  indexRecord(auth.did, COMMENT_NSID, rkey, record);

  return NextResponse.json({ uri: res.data.uri });
}
