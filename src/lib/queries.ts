import { db, tables } from "@/lib/db";
import { desc, eq, sql, inArray } from "drizzle-orm";
import { getProfiles, type ActorProfile } from "@/lib/atproto/resolve";
import type { LeafletDocument } from "@/lib/leaflet/types";

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
  const row = db.select().from(tables.posts).where(eq(tables.posts.uri, uri)).get();
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

export async function getUserContent(did: string) {
  const posts = db
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
    .where(eq(tables.posts.did, did))
    .orderBy(desc(tables.posts.publishedAt))
    .all()
    .map(({ record, ...r }) => ({ ...r, excerpt: recordExcerpt(record) }));

  const comments = db
    .select()
    .from(tables.comments)
    .where(eq(tables.comments.did, did))
    .orderBy(desc(tables.comments.createdAt))
    .limit(50)
    .all();

  const karmaRow = db.get<{ n: number }>(sql`
    SELECT COUNT(*) as n FROM votes v
    WHERE v.subject IN (SELECT uri FROM posts WHERE did = ${did})
       OR v.subject IN (SELECT uri FROM comments WHERE did = ${did})
  `);

  return { posts, comments, karma: karmaRow?.n ?? 0 };
}
