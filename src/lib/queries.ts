import { db, tables } from "@/lib/db";
import { desc, eq, sql, inArray } from "drizzle-orm";
import { getProfiles, type ActorProfile } from "@/lib/atproto/resolve";
import type { LeafletDocument, LeafletPublication } from "@/lib/leaflet/types";

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
  const uri = `at://${did}/pub.leaflet.document/${rkey}`;
  let row = db.select().from(tables.posts).where(eq(tables.posts.uri, uri)).get();

  if (!row) {
    // Ephemeral-index miss (fresh serverless instance): fetch the record
    // straight from the author's PDS, index it, and backfill the rest of
    // their repo in the background.
    const { resolvePds } = await import("@/lib/atproto/resolve");
    const { indexRecord } = await import("@/lib/ingest");
    const { backfillActor } = await import("@/lib/ingest/backfill");
    const pds = await resolvePds(did);
    if (!pds) return null;
    try {
      const res = await fetch(
        `${pds}/xrpc/com.atproto.repo.getRecord?repo=${encodeURIComponent(did)}&collection=pub.leaflet.document&rkey=${encodeURIComponent(rkey)}`,
        { cache: "no-store" },
      );
      if (!res.ok) return null;
      const data = (await res.json()) as { value: unknown };
      indexRecord(did, "pub.leaflet.document", rkey, data.value);
      void backfillActor(did).catch(() => {});
      row = db.select().from(tables.posts).where(eq(tables.posts.uri, uri)).get();
    } catch {
      return null;
    }
  }
  if (!row) return null;
  const karma = db
    .select({ n: sql<number>`COUNT(*)` })
    .from(tables.votes)
    .where(eq(tables.votes.subject, uri))
    .get();
  const profiles = await getProfiles([did]);
  return {
    ...row,
    record: JSON.parse(row.record as string) as LeafletDocument,
    karma: karma?.n ?? 0,
    author: profiles.get(did) ?? null,
  };
}

export async function getCommentTree(subjectUri: string): Promise<CommentNode[]> {
  const rows = db
    .select()
    .from(tables.comments)
    .where(eq(tables.comments.subject, subjectUri))
    .orderBy(tables.comments.createdAt)
    .all();
  if (rows.length === 0) return [];

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
  const uri = `at://${did}/pub.leaflet.publication/${rkey}`;
  const row = db
    .select()
    .from(tables.publications)
    .where(eq(tables.publications.uri, uri))
    .get();
  if (!row) return null;

  const memberUris = new Set(
    db
      .select({ uri: tables.posts.uri })
      .from(tables.posts)
      .where(eq(tables.posts.publication, uri))
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
