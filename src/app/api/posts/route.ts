import { NextRequest, NextResponse } from "next/server";
import { getSessionAgent } from "@/lib/auth/session";
import { db, tables } from "@/lib/db";
import { eq, and, like } from "drizzle-orm";
import { markdownToPage } from "@/lib/leaflet/markdown";
import { indexRecord } from "@/lib/ingest";
import { getFrontpagePosts } from "@/lib/queries";
import { getProfile } from "@/lib/atproto/resolve";
import {
  SITE_DOCUMENT_NSID,
  SITE_PUBLICATION_NSID,
  firstParagraph,
  normalizeDocument,
  type StandardDocument,
  type LinearDocumentPage,
} from "@/lib/leaflet/types";

/**
 * Find (or create) the author's site.standard.publication — every
 * standard.site document must reference its parent `site`. Mirrors
 * leaflet.pub, which creates a default publication on first publish.
 */
async function ensurePublication(
  auth: NonNullable<Awaited<ReturnType<typeof getSessionAgent>>>,
): Promise<string> {
  const existing = db
    .select({ uri: tables.publications.uri })
    .from(tables.publications)
    .where(
      and(
        eq(tables.publications.did, auth.did),
        like(tables.publications.uri, `%/${SITE_PUBLICATION_NSID}/%`),
      ),
    )
    .get();
  if (existing) return existing.uri;

  // not in the local index — check the repo directly (ephemeral index)
  try {
    const res = await auth.agent.com.atproto.repo.listRecords({
      repo: auth.did,
      collection: SITE_PUBLICATION_NSID,
      limit: 1,
    });
    const rec = res.data.records[0];
    if (rec) {
      const rkey = rec.uri.split("/").pop()!;
      indexRecord(auth.did, SITE_PUBLICATION_NSID, rkey, rec.value);
      return rec.uri;
    }
  } catch {
    // fall through to create
  }

  const profile = await getProfile(auth.did).catch(() => null);
  const name = profile?.displayName || profile?.handle || "Posts";
  const record = {
    $type: SITE_PUBLICATION_NSID,
    name: `${name}'s Posts`,
    preferences: { showComments: true, showInDiscover: true },
  };
  const res = await auth.agent.com.atproto.repo.createRecord({
    repo: auth.did,
    collection: SITE_PUBLICATION_NSID,
    record,
  });
  const rkey = res.data.uri.split("/").pop()!;
  indexRecord(auth.did, SITE_PUBLICATION_NSID, rkey, record);
  return res.data.uri;
}

/** GET /api/posts?limit=25 — public JSON list of indexed posts. */
export async function GET(req: NextRequest) {
  const limit = Math.min(
    Math.max(Number(req.nextUrl.searchParams.get("limit")) || 25, 1),
    100,
  );
  const posts = await getFrontpagePosts(limit);
  return NextResponse.json({
    posts: posts.map((p) => ({
      title: p.title,
      url: `/posts/${p.did}/${p.rkey}`,
      author: p.author?.handle ?? p.did,
      karma: p.karma,
      commentCount: p.commentCount,
      publishedAt: p.publishedAt,
      excerpt: p.excerpt,
    })),
  });
}

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

  const site = await ensurePublication(auth);

  const record: StandardDocument = {
    $type: SITE_DOCUMENT_NSID,
    title,
    site,
    publishedAt: new Date().toISOString(),
    content: { $type: "pub.leaflet.content", pages: [page] },
    ...(tags.length ? { tags } : {}),
  };
  const description = firstParagraph(normalizeDocument(record)!).slice(0, 280);
  if (description) record.description = description;

  const res = await auth.agent.com.atproto.repo.createRecord({
    repo: auth.did,
    collection: SITE_DOCUMENT_NSID,
    record,
  });

  const rkey = res.data.uri.split("/").pop()!;
  indexRecord(auth.did, SITE_DOCUMENT_NSID, rkey, record);

  return NextResponse.json({ uri: res.data.uri, did: auth.did, rkey });
}
