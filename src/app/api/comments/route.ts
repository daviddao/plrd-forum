import { NextRequest, NextResponse } from "next/server";
import { getSessionAgent } from "@/lib/auth/session";
import { indexRecord } from "@/lib/ingest";
import { db, tables } from "@/lib/db";
import { eq } from "drizzle-orm";
import { parseInline } from "@/lib/leaflet/markdown";
import { COMMENT_NSID, type LeafletComment, type QuotePosition } from "@/lib/leaflet/types";

type QuotePayload = {
  text: string;
  start: QuotePosition;
  end: QuotePosition;
};

export async function POST(req: NextRequest) {
  const auth = await getSessionAgent();
  if (!auth) return NextResponse.json({ error: "not logged in" }, { status: 401 });

  const body = (await req.json()) as {
    subject?: string;
    parent?: string;
    text?: string;
    quote?: QuotePayload;
  };
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
    ...(body.quote
      ? {
          attachment: {
            $type: "pub.leaflet.comment#linearDocumentQuote" as const,
            document: subject,
            quote: { start: body.quote.start, end: body.quote.end },
          },
        }
      : {}),
  };

  const res = await auth.agent.com.atproto.repo.createRecord({
    repo: auth.did,
    collection: COMMENT_NSID,
    record,
  });

  const rkey = res.data.uri.split("/").pop()!;
  indexRecord(auth.did, COMMENT_NSID, rkey, record);

  // sidecar: remember the quoted text for display (positions alone aren't renderable)
  if (body.quote?.text) {
    db.update(tables.comments)
      .set({ quotedText: body.quote.text.slice(0, 1000) })
      .where(eq(tables.comments.uri, res.data.uri))
      .run();
  }

  return NextResponse.json({ uri: res.data.uri });
}
