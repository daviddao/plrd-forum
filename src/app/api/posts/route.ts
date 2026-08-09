import { NextRequest, NextResponse } from "next/server";
import { getSessionAgent } from "@/lib/auth/session";
import { markdownToPage } from "@/lib/leaflet/markdown";
import { indexRecord } from "@/lib/ingest";
import {
  DOCUMENT_NSID,
  firstParagraph,
  type LeafletDocument,
  type LinearDocumentPage,
} from "@/lib/leaflet/types";

export async function POST(req: NextRequest) {
  const auth = await getSessionAgent();
  if (!auth) return NextResponse.json({ error: "not logged in" }, { status: 401 });

  const body = (await req.json()) as {
    title?: string;
    markdown?: string;
    page?: LinearDocumentPage;
    tags?: string[];
  };
  const title = body.title?.trim();
  const markdown = body.markdown?.trim();
  if (!title || (!markdown && !body.page)) {
    return NextResponse.json({ error: "title and content required" }, { status: 400 });
  }

  // WYSIWYG editors send pre-serialized linearDocument pages; the markdown
  // path remains for API clients.
  const page =
    body.page && Array.isArray(body.page.blocks) && body.page.blocks.length > 0
      ? body.page
      : markdownToPage(markdown ?? "");
  if (page.blocks.length === 0) {
    return NextResponse.json({ error: "empty post" }, { status: 400 });
  }

  const tags = (body.tags ?? [])
    .map((t) => String(t).trim())
    .filter(Boolean)
    .slice(0, 20);

  const record: LeafletDocument = {
    $type: DOCUMENT_NSID,
    title,
    author: auth.did,
    publishedAt: new Date().toISOString(),
    pages: [page],
    ...(tags.length ? { tags } : {}),
  };
  const description = firstParagraph(record).slice(0, 280);
  if (description) record.description = description;

  const res = await auth.agent.com.atproto.repo.createRecord({
    repo: auth.did,
    collection: DOCUMENT_NSID,
    record,
  });

  const rkey = res.data.uri.split("/").pop()!;
  indexRecord(auth.did, DOCUMENT_NSID, rkey, record);

  return NextResponse.json({ uri: res.data.uri, did: auth.did, rkey });
}
