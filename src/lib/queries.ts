import { db, tables } from "@/lib/db";
import { desc, eq, sql, inArray } from "drizzle-orm";
import { getProfiles, type ActorProfile } from "@/lib/atproto/resolve";
import {
  DOCUMENT_NSID,
  PUBLICATION_NSID,
  SITE_DOCUMENT_NSID,
  SITE_PUBLICATION_NSID,
  type LeafletDocument,
  type LeafletPublication,
} from "@/lib/leaflet/types";

export type PostListItem = {
  uri: string;
  did: string;
  rkey: string;
  title: string;
  publishedAt: string | null;
  wordCount: number;
  karma: number;
  commentCount: number;
  author: ActorProfile | null;
  excerpt: string;
};

/** Plaintext excerpt from a document record's first text blocks. */
function recordExcerpt(recordJson: unknown, maxLen = 600): string {
  try {
    const doc = (typeof recordJson === "string" ? JSON.parse(recordJson) : recordJson) as LeafletDocument;
    const parts: string[] = [];
    let len = 0;
    for (const page of doc.pages ?? []) {
      for (const b of page.blocks ?? []) {
        const block = b.block as { $type?: string; plaintext?: string };
        if (typeof block?.plaintext === "string" && block.plaintext.trim()) {
          parts.push(block.plaintext.trim());
          len += block.plaintext.length;
          if (len > maxLen) return parts.join("\n\n").slice(0, maxLen);
        }
      }
    }
    return parts.join("\n\n").slice(0, maxLen) || (doc.description ?? "");
  } catch {
    return "";
  }
}

export type CommentNode = {
  uri: string;
  did: string;
  plaintext: string;
  facets: unknown;
  quotedText: string | null;
  createdAt: string;
  karma: number;
  author: ActorProfile | null;
  children: CommentNode[];
};

const voteCount = (subject: typeof tables.posts.uri) =>
  sql<number>`(SELECT COUNT(*) FROM votes v WHERE v.subject = ${subject})`;

export async function getFrontpagePosts(limit = 30): Promise<PostListItem[]> {
  const rows = db
    .select({
      uri: tables.posts.uri,
      did: tables.posts.did,
      rkey: tables.posts.rkey,
      title: tables.posts.title,
      publishedAt: tables.posts.publishedAt,
      wordCount: tables.posts.wordCount,
      record: tables.posts.record,
      karma: sql<number>`(SELECT COUNT(*) FROM votes v WHERE v.subject = posts.uri)`,
      commentCount: sql<number>`(SELECT COUNT(*) FROM comments c WHERE c.subject = posts.uri)`,
    })
    .from(tables.posts)
    .orderBy(desc(tables.posts.publishedAt))
    .limit(limit)
    .all();

  const profiles = await getProfiles(rows.map((r) => r.did));
  return rows.map(({ record, ...r }) => ({
    ...r,
    author: profiles.get(r.did) ?? null,
    excerpt: recordExcerpt(record),
  }));
}

export async function getPost(did: string, rkey: string) {
  // a /posts/[did]/[rkey] URL doesn't carry the collection — the post may be
  // a legacy pub.leaflet.document or a migrated site.standard.document
  const candidateUris = [SITE_DOCUMENT_NSID, DOCUMENT_NSID].map(
    (c) => `at://${did}/${c}/${rkey}`,
  );
  const lookup = () =>
    db.select().from(tables.posts).where(inArray(tables.posts.uri, candidateUris)).get();
  let row = lookup();

  if (!row) {
    // Ephemeral-index miss (fresh serverless instance): fetch the record
    // straight from the author's PDS, index it, and backfill the rest of
    // their repo in the background.
    const { resolvePds } = await import("@/lib/atproto/resolve");
    const { indexRecord } = await import("@/lib/ingest");
    const { backfillActor } = await import("@/lib/ingest/backfill");
    const pds = await resolvePds(did);
    if (!pds) return null;
    for (const collection of [SITE_DOCUMENT_NSID, DOCUMENT_NSID]) {
      try {
        const res = await fetch(
          `${pds}/xrpc/com.atproto.repo.getRecord?repo=${encodeURIComponent(did)}&collection=${collection}&rkey=${encodeURIComponent(rkey)}`,
          { cache: "no-store" },
        );
        if (!res.ok) continue;
        const data = (await res.json()) as { value: unknown };
        indexRecord(did, collection, rkey, data.value);
        void backfillActor(did).catch(() => {});
        row = lookup();
        if (row) break;
      } catch {
        // try the next collection
      }
    }
  }
  if (!row) return null;
  const karma = db
    .select({ n: sql<number>`COUNT(*)` })
    .from(tables.votes)
    .where(eq(tables.votes.subject, row.uri))
    .get();
  const profiles = await getProfiles([did]);
  return {
    ...row,
    record: JSON.parse(row.record as string) as LeafletDocument,
    karma: karma?.n ?? 0,
    author: profiles.get(did) ?? null,
  };
}

/** Resolve a linearDocumentQuote attachment to its quoted text via the post record. */
function quoteTextFromAttachment(
  attachment: unknown,
  doc: LeafletDocument | null,
): string | null {
  if (!doc || !attachment || typeof attachment !== "object") return null;
  const quote = (attachment as { quote?: { start?: { block?: number[]; offset?: number }; end?: { block?: number[]; offset?: number } } }).quote;
  const start = quote?.start;
  const end = quote?.end;
  if (!start?.block || !end?.block) return null;
  const blocks = doc.pages?.[0]?.blocks ?? [];
  const text = (i: number) =>
    ((blocks[i]?.block as { plaintext?: string })?.plaintext ?? "");
  const s = start.block[0] ?? 0;
  const e = end.block[0] ?? s;
  try {
    if (s === e) return text(s).slice(start.offset ?? 0, end.offset ?? undefined) || null;
    const parts = [text(s).slice(start.offset ?? 0)];
    for (let i = s + 1; i < e; i++) parts.push(text(i));
    parts.push(text(e).slice(0, end.offset ?? undefined));
    return parts.join(" … ") || null;
  } catch {
    return null;
  }
}

export async function getCommentTree(subjectUri: string): Promise<CommentNode[]> {
  const rows = db
    .select()
    .from(tables.comments)
    .where(eq(tables.comments.subject, subjectUri))
    .orderBy(tables.comments.createdAt)
    .all();
  if (rows.length === 0) return [];

  // derive missing quoted text (hydrated records only carry positions)
  const needsQuote = rows.filter((r) => r.attachment && !r.quotedText);
  if (needsQuote.length > 0) {
    const postRow = db
      .select({ record: tables.posts.record })
      .from(tables.posts)
      .where(eq(tables.posts.uri, subjectUri))
      .get();
    const doc = postRow ? (JSON.parse(postRow.record as string) as LeafletDocument) : null;
    for (const r of needsQuote) {
      const derived = quoteTextFromAttachment(
        typeof r.attachment === "string" ? JSON.parse(r.attachment) : r.attachment,
        doc,
      );
      if (derived) {
        r.quotedText = derived.slice(0, 1000);
        db.update(tables.comments)
          .set({ quotedText: r.quotedText })
          .where(eq(tables.comments.uri, r.uri))
          .run();
      }
    }
  }

  const uris = rows.map((r) => r.uri);
  const voteRows = db
    .select({ subject: tables.votes.subject, n: sql<number>`COUNT(*)` })
    .from(tables.votes)
    .where(inArray(tables.votes.subject, uris))
    .groupBy(tables.votes.subject)
    .all();
  const votesBySubject = new Map(voteRows.map((v) => [v.subject, v.n]));
  const profiles = await getProfiles(rows.map((r) => r.did));

  const nodes = new Map<string, CommentNode>();
  for (const r of rows) {
    nodes.set(r.uri, {
      uri: r.uri,
      did: r.did,
      plaintext: r.plaintext,
      facets: r.facets ? JSON.parse(r.facets as string) : null,
      quotedText: r.quotedText ?? null,
      createdAt: r.createdAt,
      karma: votesBySubject.get(r.uri) ?? 0,
      author: profiles.get(r.did) ?? null,
      children: [],
    });
  }

  const roots: CommentNode[] = [];
  for (const r of rows) {
    const node = nodes.get(r.uri)!;
    const parent = r.parent ? nodes.get(r.parent) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  return roots;
}

/** URIs the given user has recommended, among the provided subjects. */
export function getMyVotes(did: string | null, subjects: string[]): Set<string> {
  if (!did || subjects.length === 0) return new Set();
  const rows = db
    .select({ subject: tables.votes.subject })
    .from(tables.votes)
    .where(sql`${tables.votes.did} = ${did} AND ${inArray(tables.votes.subject, subjects)}`)
    .all();
  return new Set(rows.map((r) => r.subject));
}

/** All tags across indexed posts, with counts. */
export function getAllTags(): { tag: string; count: number }[] {
  const rows = db.select({ record: tables.posts.record }).from(tables.posts).all();
  const counts = new Map<string, number>();
  for (const row of rows) {
    try {
      const doc = JSON.parse(row.record as string) as LeafletDocument;
      for (const raw of doc.tags ?? []) {
        const tag = raw.trim();
        if (!tag) continue;
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    } catch {
      // ignore
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

export async function getPostsByTag(tag: string): Promise<PostListItem[]> {
  const all = await getFrontpagePosts(1000);
  const target = tag.toLowerCase();
  const uris = new Set(
    db
      .select({ uri: tables.posts.uri, record: tables.posts.record })
      .from(tables.posts)
      .all()
      .filter((r) => {
        try {
          const doc = JSON.parse(r.record as string) as LeafletDocument;
          return (doc.tags ?? []).some((t) => t.trim().toLowerCase() === target);
        } catch {
          return false;
        }
      })
      .map((r) => r.uri),
  );
  return all.filter((p) => uris.has(p.uri));
}

export type PublicationListItem = {
  uri: string;
  did: string;
  rkey: string;
  name: string;
  description: string | null;
  postCount: number;
  author: ActorProfile | null;
  record: LeafletPublication;
};

/** Publications with post counts, for the Library page. */
export async function getPublications(): Promise<PublicationListItem[]> {
  const rows = db
    .select({
      uri: tables.publications.uri,
      did: tables.publications.did,
      rkey: tables.publications.rkey,
      name: tables.publications.name,
      description: tables.publications.description,
      record: tables.publications.record,
      postCount: sql<number>`(SELECT COUNT(*) FROM posts p WHERE p.publication = publications.uri)`,
    })
    .from(tables.publications)
    .orderBy(desc(sql`(SELECT COUNT(*) FROM posts p WHERE p.publication = publications.uri)`))
    .all();

  const profiles = await getProfiles(rows.map((r) => r.did));
  return rows.map((r) => ({
    ...r,
    record: JSON.parse(r.record as string) as LeafletPublication,
    author: profiles.get(r.did) ?? null,
  }));
}

export async function getPublication(did: string, rkey: string) {
  const candidateUris = [SITE_PUBLICATION_NSID, PUBLICATION_NSID].map(
    (c) => `at://${did}/${c}/${rkey}`,
  );
  const row = db
    .select()
    .from(tables.publications)
    .where(inArray(tables.publications.uri, candidateUris))
    .get();
  if (!row) return null;

  const memberUris = new Set(
    db
      .select({ uri: tables.posts.uri })
      .from(tables.posts)
      .where(eq(tables.posts.publication, row.uri))
      .all()
      .map((r) => r.uri),
  );
  const all = await getFrontpagePosts(1000);
  const posts = all.filter((p) => memberUris.has(p.uri));

  const profiles = await getProfiles([did]);
  return {
    ...row,
    record: JSON.parse(row.record as string) as LeafletPublication,
    author: profiles.get(did) ?? null,
    posts,
  };
}

/**
 * Resolve a link target to an indexed post, for LW-style link hover
 * previews. Handles:
 *  - internal links: /posts/<did>/<rkey> (relative or absolute)
 *  - standard.site publication links: https://<base_path>/<rkey>
 *    (e.g. https://dholms.leaflet.pub/3mqtqvjidqs2p)
 */
export async function findPostForLink(rawUrl: string): Promise<PostListItem | null> {
  let didAndRkey: { did: string; rkey: string } | null = null;
  let pubHostRkey: { host: string; rkey: string } | null = null;

  const internalMatch = rawUrl.match(/^\/posts\/([^/]+)\/([^/?#]+)/);
  if (internalMatch) {
    didAndRkey = { did: decodeURIComponent(internalMatch[1]), rkey: internalMatch[2] };
  } else {
    try {
      const u = new URL(rawUrl);
      const postsMatch = u.pathname.match(/^\/posts\/([^/]+)\/([^/?#]+)/);
      const rkeyMatch = u.pathname.match(/^\/([a-z2-7]{13})\/?$/); // bare TID path
      if (postsMatch) {
        didAndRkey = { did: decodeURIComponent(postsMatch[1]), rkey: postsMatch[2] };
      } else if (rkeyMatch) {
        pubHostRkey = { host: u.hostname, rkey: rkeyMatch[1] };
      }
    } catch {
      return null;
    }
  }

  let row:
    | { uri: string; did: string; rkey: string; title: string; publishedAt: string | null; wordCount: number; record: unknown }
    | undefined;

  if (didAndRkey) {
    row = db
      .select({
        uri: tables.posts.uri,
        did: tables.posts.did,
        rkey: tables.posts.rkey,
        title: tables.posts.title,
        publishedAt: tables.posts.publishedAt,
        wordCount: tables.posts.wordCount,
        record: tables.posts.record,
      })
      .from(tables.posts)
      .where(
        sql`${tables.posts.did} = ${didAndRkey.did} AND ${tables.posts.rkey} = ${didAndRkey.rkey}`,
      )
      .get();
  } else if (pubHostRkey) {
    // publication whose base_path (stored in the record JSON) is this host.
    // The table is small — parse in JS rather than LIKE-matching the
    // (escape-sensitive) serialized JSON.
    const pub = db
      .select({ uri: tables.publications.uri, record: tables.publications.record })
      .from(tables.publications)
      .all()
      .find((r) => {
        try {
          const p = JSON.parse(r.record as string) as LeafletPublication;
          return p.base_path === pubHostRkey.host;
        } catch {
          return false;
        }
      });
    if (!pub) return null;
    row = db
      .select({
        uri: tables.posts.uri,
        did: tables.posts.did,
        rkey: tables.posts.rkey,
        title: tables.posts.title,
        publishedAt: tables.posts.publishedAt,
        wordCount: tables.posts.wordCount,
        record: tables.posts.record,
      })
      .from(tables.posts)
      .where(
        sql`${tables.posts.publication} = ${pub.uri} AND ${tables.posts.rkey} = ${pubHostRkey.rkey}`,
      )
      .get();
  }
  if (!row) return null;

  const karma = getVoteCount(row.uri);
  const commentCount =
    db
      .select({ n: sql<number>`COUNT(*)` })
      .from(tables.comments)
      .where(eq(tables.comments.subject, row.uri))
      .get()?.n ?? 0;
  const profiles = await getProfiles([row.did]);
  const { record, ...rest } = row;
  return {
    ...rest,
    karma,
    commentCount,
    author: profiles.get(row.did) ?? null,
    excerpt: recordExcerpt(record),
  };
}

/** Live vote count for a subject — used to recompute karma after
 * Constellation hydration (getPost's count predates hydration). */
export function getVoteCount(subjectUri: string): number {
  const row = db
    .select({ n: sql<number>`COUNT(*)` })
    .from(tables.votes)
    .where(eq(tables.votes.subject, subjectUri))
    .get();
  return row?.n ?? 0;
}

/** Subscriber counts for publications + which ones the viewer follows. */
export function getSubscriptionInfo(
  publicationUris: string[],
  viewerDid: string | null,
): { counts: Map<string, number>; mine: Set<string> } {
  const counts = new Map<string, number>();
  const mine = new Set<string>();
  if (publicationUris.length === 0) return { counts, mine };
  const rows = db
    .select({ publication: tables.subscriptions.publication, n: sql<number>`COUNT(*)` })
    .from(tables.subscriptions)
    .where(inArray(tables.subscriptions.publication, publicationUris))
    .groupBy(tables.subscriptions.publication)
    .all();
  for (const r of rows) counts.set(r.publication, r.n);
  if (viewerDid) {
    const mineRows = db
      .select({ publication: tables.subscriptions.publication })
      .from(tables.subscriptions)
      .where(
        sql`${tables.subscriptions.did} = ${viewerDid} AND ${inArray(tables.subscriptions.publication, publicationUris)}`,
      )
      .all();
    for (const r of mineRows) mine.add(r.publication);
  }
  return { counts, mine };
}

export type AuthorCard = {
  did: string;
  karma: number;
  postCount: number;
  commentCount: number;
  recentPosts: { uri: string; did: string; rkey: string; title: string; karma: number }[];
};

/**
 * Per-author stats for the LW-style user hover card (LWUserTooltipContent):
 * karma (votes received on their posts+comments), post/comment counts and
 * their 3 most recent posts. Batched — one query set for a whole posts list.
 */
export function getAuthorCards(dids: string[]): Map<string, AuthorCard> {
  const out = new Map<string, AuthorCard>();
  if (dids.length === 0) return out;
  const unique = [...new Set(dids)];
  for (const did of unique) {
    out.set(did, { did, karma: 0, postCount: 0, commentCount: 0, recentPosts: [] });
  }

  const postCounts = db
    .select({ did: tables.posts.did, n: sql<number>`COUNT(*)` })
    .from(tables.posts)
    .where(inArray(tables.posts.did, unique))
    .groupBy(tables.posts.did)
    .all();
  for (const r of postCounts) out.get(r.did)!.postCount = r.n;

  const commentCounts = db
    .select({ did: tables.comments.did, n: sql<number>`COUNT(*)` })
    .from(tables.comments)
    .where(inArray(tables.comments.did, unique))
    .groupBy(tables.comments.did)
    .all();
  for (const r of commentCounts) out.get(r.did)!.commentCount = r.n;

  for (const did of unique) {
    const karmaRow = db.get<{ n: number }>(sql`
      SELECT COUNT(*) as n FROM votes v
      WHERE v.subject IN (SELECT uri FROM posts WHERE did = ${did})
         OR v.subject IN (SELECT uri FROM comments WHERE did = ${did})
    `);
    out.get(did)!.karma = karmaRow?.n ?? 0;
    out.get(did)!.recentPosts = db
      .select({
        uri: tables.posts.uri,
        did: tables.posts.did,
        rkey: tables.posts.rkey,
        title: tables.posts.title,
        karma: sql<number>`(SELECT COUNT(*) FROM votes v WHERE v.subject = posts.uri)`,
      })
      .from(tables.posts)
      .where(eq(tables.posts.did, did))
      .orderBy(desc(tables.posts.publishedAt))
      .limit(3)
      .all();
  }
  return out;
}

export async function getUserContent(did: string) {
  const posts = db
    .select({
      uri: tables.posts.uri,
      did: tables.posts.did,
      rkey: tables.posts.rkey,
      title: tables.posts.title,
      publishedAt: tables.posts.publishedAt,
      wordCount: tables.posts.wordCount,
      coverImageCid: tables.posts.coverImageCid,
      record: tables.posts.record,
      karma: sql<number>`(SELECT COUNT(*) FROM votes v WHERE v.subject = posts.uri)`,
      commentCount: sql<number>`(SELECT COUNT(*) FROM comments c WHERE c.subject = posts.uri)`,
    })
    .from(tables.posts)
    .where(eq(tables.posts.did, did))
    .orderBy(desc(tables.posts.publishedAt))
    .all()
    .map(({ record, ...r }) => ({ ...r, excerpt: recordExcerpt(record) }));

  // recent comments with their post titles + karma, LW RecentComments-style
  const comments = db
    .select({
      uri: tables.comments.uri,
      did: tables.comments.did,
      subject: tables.comments.subject,
      plaintext: tables.comments.plaintext,
      facets: tables.comments.facets,
      quotedText: tables.comments.quotedText,
      createdAt: tables.comments.createdAt,
      karma: sql<number>`(SELECT COUNT(*) FROM votes v WHERE v.subject = comments.uri)`,
      postTitle: sql<string | null>`(SELECT title FROM posts p WHERE p.uri = comments.subject)`,
    })
    .from(tables.comments)
    .where(eq(tables.comments.did, did))
    .orderBy(desc(tables.comments.createdAt))
    .limit(20)
    .all();

  // publications by this user (→ LW "Sequences" section)
  const pubRows = db
    .select({
      uri: tables.publications.uri,
      did: tables.publications.did,
      rkey: tables.publications.rkey,
      name: tables.publications.name,
      description: tables.publications.description,
      record: tables.publications.record,
      postCount: sql<number>`(SELECT COUNT(*) FROM posts p WHERE p.publication = publications.uri)`,
    })
    .from(tables.publications)
    .where(eq(tables.publications.did, did))
    .all();
  const profiles = await getProfiles([did]);
  const publications: PublicationListItem[] = pubRows.map((r) => ({
    ...r,
    record: JSON.parse(r.record as string) as LeafletPublication,
    author: profiles.get(did) ?? null,
  }));

  const karmaRow = db.get<{ n: number }>(sql`
    SELECT COUNT(*) as n FROM votes v
    WHERE v.subject IN (SELECT uri FROM posts WHERE did = ${did})
       OR v.subject IN (SELECT uri FROM comments WHERE did = ${did})
  `);

  // distinct tags across their posts (→ LW's wikitag-edits pencil stat)
  const tagSet = new Set<string>();
  for (const row of db
    .select({ record: tables.posts.record })
    .from(tables.posts)
    .where(eq(tables.posts.did, did))
    .all()) {
    try {
      const doc = JSON.parse(row.record as string) as LeafletDocument;
      for (const t of doc.tags ?? []) if (t.trim()) tagSet.add(t.trim());
    } catch {
      // ignore
    }
  }

  return { posts, comments, publications, karma: karmaRow?.n ?? 0, tagCount: tagSet.size };
}
