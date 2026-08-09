import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

/** Indexed pub.leaflet.document records */
export const posts = sqliteTable(
  "posts",
  {
    uri: text("uri").primaryKey(), // at://did/pub.leaflet.document/rkey
    did: text("did").notNull(),
    rkey: text("rkey").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    publication: text("publication"),
    publishedAt: text("published_at"),
    indexedAt: text("indexed_at").notNull(),
    coverImageCid: text("cover_image_cid"),
    record: text("record", { mode: "json" }).notNull(), // full record JSON
    wordCount: integer("word_count").notNull().default(0),
  },
  (t) => [index("posts_published_idx").on(t.publishedAt), index("posts_did_idx").on(t.did)],
);

/** Indexed pub.leaflet.comment records */
export const comments = sqliteTable(
  "comments",
  {
    uri: text("uri").primaryKey(),
    did: text("did").notNull(),
    rkey: text("rkey").notNull(),
    subject: text("subject").notNull(), // post at-uri
    parent: text("parent"), // parent comment at-uri (null = top level)
    plaintext: text("plaintext").notNull(),
    facets: text("facets", { mode: "json" }),
    createdAt: text("created_at").notNull(),
    indexedAt: text("indexed_at").notNull(),
  },
  (t) => [index("comments_subject_idx").on(t.subject), index("comments_did_idx").on(t.did)],
);

/** Indexed pub.leaflet.interactions.recommend records — used as upvotes */
export const votes = sqliteTable(
  "votes",
  {
    uri: text("uri").primaryKey(),
    did: text("did").notNull(),
    subject: text("subject").notNull(), // post or comment at-uri
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("votes_subject_idx").on(t.subject), index("votes_did_idx").on(t.did)],
);

/** Indexed pub.leaflet.publication records */
export const publications = sqliteTable(
  "publications",
  {
    uri: text("uri").primaryKey(),
    did: text("did").notNull(),
    rkey: text("rkey").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    record: text("record", { mode: "json" }).notNull(),
    indexedAt: text("indexed_at").notNull(),
  },
  (t) => [index("publications_did_idx").on(t.did)],
);

/** Cached actor profiles + PDS endpoints */
export const profiles = sqliteTable("profiles", {
  did: text("did").primaryKey(),
  handle: text("handle"),
  displayName: text("display_name"),
  avatar: text("avatar"),
  pds: text("pds"),
  fetchedAt: text("fetched_at"),
});

/** OAuth client state + session stores */
export const authState = sqliteTable("auth_state", {
  key: text("key").primaryKey(),
  data: text("data").notNull(),
});

export const authSession = sqliteTable("auth_session", {
  key: text("key").primaryKey(),
  data: text("data").notNull(),
});

/** Jetstream cursor */
export const ingestCursor = sqliteTable("ingest_cursor", {
  id: integer("id").primaryKey(),
  timeUs: integer("time_us").notNull(),
});
