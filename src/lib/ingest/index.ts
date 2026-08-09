import { db, tables } from "@/lib/db";
import { eq } from "drizzle-orm";
import {
  DOCUMENT_NSID,
  COMMENT_NSID,
  RECOMMEND_NSID,
  PUBLICATION_NSID,
  documentWordCount,
  type LeafletDocument,
  type LeafletComment,
  type LeafletRecommend,
  type LeafletPublication,
} from "@/lib/leaflet/types";

/** Upsert a leaflet record into the index. Returns true if indexed. */
export function indexRecord(
  did: string,
  collection: string,
  rkey: string,
  record: unknown,
): boolean {
  const uri = `at://${did}/${collection}/${rkey}`;
  const now = new Date().toISOString();

  if (collection === DOCUMENT_NSID) {
    const doc = record as LeafletDocument;
    if (!doc?.title || !Array.isArray(doc.pages)) return false;
    db.insert(tables.posts)
      .values({
        uri,
        did,
        rkey,
        title: doc.title,
        description: doc.description ?? null,
        publication: doc.publication ?? null,
        publishedAt: doc.publishedAt ?? now,
        indexedAt: now,
        coverImageCid: doc.coverImage?.ref?.$link ?? null,
        record: JSON.stringify(doc),
        wordCount: documentWordCount(doc),
      })
      .onConflictDoUpdate({
        target: tables.posts.uri,
        set: {
          title: doc.title,
          description: doc.description ?? null,
          publication: doc.publication ?? null,
          record: JSON.stringify(doc),
          wordCount: documentWordCount(doc),
          indexedAt: now,
        },
      })
      .run();
    return true;
  }

  if (collection === COMMENT_NSID) {
    const c = record as LeafletComment;
    if (!c?.subject || typeof c.plaintext !== "string") return false;
    db.insert(tables.comments)
      .values({
        uri,
        did,
        rkey,
        subject: c.subject,
        parent: c.reply?.parent ?? null,
        plaintext: c.plaintext,
        facets: c.facets ? JSON.stringify(c.facets) : null,
        attachment: c.attachment ? JSON.stringify(c.attachment) : null,
        createdAt: c.createdAt ?? now,
        indexedAt: now,
      })
      .onConflictDoUpdate({
        target: tables.comments.uri,
        set: {
          plaintext: c.plaintext,
          facets: c.facets ? JSON.stringify(c.facets) : null,
          attachment: c.attachment ? JSON.stringify(c.attachment) : null,
          indexedAt: now,
        },
      })
      .run();
    return true;
  }

  if (collection === RECOMMEND_NSID) {
    const v = record as LeafletRecommend;
    if (!v?.subject) return false;
    db.insert(tables.votes)
      .values({ uri, did, subject: v.subject, createdAt: v.createdAt ?? now })
      .onConflictDoNothing()
      .run();
    return true;
  }

  if (collection === PUBLICATION_NSID) {
    const p = record as LeafletPublication;
    if (!p?.name) return false;
    db.insert(tables.publications)
      .values({
        uri,
        did,
        rkey,
        name: p.name,
        description: p.description ?? null,
        record: JSON.stringify(p),
        indexedAt: now,
      })
      .onConflictDoUpdate({
        target: tables.publications.uri,
        set: {
          name: p.name,
          description: p.description ?? null,
          record: JSON.stringify(p),
          indexedAt: now,
        },
      })
      .run();
    return true;
  }

  return false;
}

export function deleteRecord(did: string, collection: string, rkey: string) {
  const uri = `at://${did}/${collection}/${rkey}`;
  if (collection === DOCUMENT_NSID) {
    db.delete(tables.posts).where(eq(tables.posts.uri, uri)).run();
  } else if (collection === COMMENT_NSID) {
    db.delete(tables.comments).where(eq(tables.comments.uri, uri)).run();
  } else if (collection === RECOMMEND_NSID) {
    db.delete(tables.votes).where(eq(tables.votes.uri, uri)).run();
  } else if (collection === PUBLICATION_NSID) {
    db.delete(tables.publications).where(eq(tables.publications.uri, uri)).run();
  }
}
