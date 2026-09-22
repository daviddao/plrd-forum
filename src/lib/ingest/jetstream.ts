import WebSocket from "ws";
import { db, tables } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { indexRecord, deleteRecord } from "./index";
import {
  DOCUMENT_NSID,
  COMMENT_NSID,
  RECOMMEND_NSID,
  PUBLICATION_NSID,
  SITE_DOCUMENT_NSID,
  SITE_PUBLICATION_NSID,
  SITE_RECOMMEND_NSID,
  SITE_SUBSCRIPTION_NSID,
} from "@/lib/leaflet/types";

const JETSTREAM_URL =
  process.env.JETSTREAM_URL ?? "wss://jetstream2.us-east.bsky.network/subscribe";

const COLLECTIONS = [
  DOCUMENT_NSID,
  COMMENT_NSID,
  RECOMMEND_NSID,
  PUBLICATION_NSID,
  SITE_DOCUMENT_NSID,
  SITE_PUBLICATION_NSID,
  SITE_RECOMMEND_NSID,
  SITE_SUBSCRIPTION_NSID,
];

/**
 * Firehose admission policy. The public firehose for both the site.standard.*
 * and pub.leaflet.* collections is dominated by RSS bridges, SEO spam, and
 * test posts, so live events only grow the index outward from what it
 * already knows:
 *
 * - documents and publications are accepted from known actors only
 *   (anyone with an indexed post, comment, vote, or publication);
 * - comments and recommends are accepted only when their subject post is
 *   already indexed, which is also how a new actor becomes known;
 * - subscriptions are accepted only for indexed publications.
 *
 * Explicit entry paths (SEED_ACTORS, /api/backfill, profile and post visits,
 * and the authoring endpoints) call indexRecord directly and bypass this
 * gate, so genuine new authors still get in.
 */
const ACTOR_GATED = new Set([
  DOCUMENT_NSID,
  PUBLICATION_NSID,
  SITE_DOCUMENT_NSID,
  SITE_PUBLICATION_NSID,
]);
const SUBJECT_GATED = new Set([COMMENT_NSID, RECOMMEND_NSID, SITE_RECOMMEND_NSID]);

function isKnownActor(did: string): boolean {
  return !!(
    db.select({ did: tables.posts.did }).from(tables.posts).where(eq(tables.posts.did, did)).get() ??
    db.select({ did: tables.comments.did }).from(tables.comments).where(eq(tables.comments.did, did)).get() ??
    db.select({ did: tables.votes.did }).from(tables.votes).where(eq(tables.votes.did, did)).get() ??
    db.select({ did: tables.publications.did }).from(tables.publications).where(eq(tables.publications.did, did)).get()
  );
}

function parseAtUri(uri: unknown): { did: string; rkey: string } | null {
  if (typeof uri !== "string") return null;
  const m = /^at:\/\/([^/]+)\/[^/]+\/([^/]+)$/.exec(uri);
  return m ? { did: m[1], rkey: m[2] } : null;
}

/** Post lookup by DID + rkey so legacy and standard.site URIs both match. */
function isIndexedPost(uri: unknown): boolean {
  const ref = parseAtUri(uri);
  if (!ref) return false;
  return !!db
    .select({ uri: tables.posts.uri })
    .from(tables.posts)
    .where(and(eq(tables.posts.did, ref.did), eq(tables.posts.rkey, ref.rkey)))
    .get();
}

function isIndexedPublication(uri: unknown): boolean {
  const ref = parseAtUri(uri);
  if (!ref) return false;
  return !!db
    .select({ uri: tables.publications.uri })
    .from(tables.publications)
    .where(and(eq(tables.publications.did, ref.did), eq(tables.publications.rkey, ref.rkey)))
    .get();
}

function admit(did: string, collection: string, record: unknown): boolean {
  if (ACTOR_GATED.has(collection)) return isKnownActor(did);
  const r = record as { subject?: unknown; document?: unknown; publication?: unknown } | null;
  if (SUBJECT_GATED.has(collection)) return isIndexedPost(r?.subject ?? r?.document);
  if (collection === SITE_SUBSCRIPTION_NSID) return isIndexedPublication(r?.publication);
  return true;
}

type JetstreamEvent = {
  did: string;
  time_us: number;
  kind: string;
  commit?: {
    rev: string;
    operation: "create" | "update" | "delete";
    collection: string;
    rkey: string;
    record?: unknown;
  };
};

const globalForJetstream = globalThis as unknown as { __jetstreamStarted?: boolean };

export function startJetstream() {
  if (globalForJetstream.__jetstreamStarted) return;
  globalForJetstream.__jetstreamStarted = true;
  connect();
}

function getCursor(): number | null {
  const row = db.select().from(tables.ingestCursor).get();
  return row?.timeUs ?? null;
}

function saveCursor(timeUs: number) {
  db.insert(tables.ingestCursor)
    .values({ id: 1, timeUs })
    .onConflictDoUpdate({ target: tables.ingestCursor.id, set: { timeUs } })
    .run();
}

let lastSaved = 0;

function connect() {
  const url = new URL(JETSTREAM_URL);
  for (const c of COLLECTIONS) url.searchParams.append("wantedCollections", c);
  const cursor = getCursor();
  if (cursor) url.searchParams.set("cursor", String(cursor - 5_000_000)); // rewind 5s

  const ws = new WebSocket(url);

  ws.on("open", () => console.log("[jetstream] connected"));

  ws.on("message", (data) => {
    try {
      const evt = JSON.parse(data.toString()) as JetstreamEvent;
      if (evt.kind !== "commit" || !evt.commit) return;
      const { operation, collection, rkey, record } = evt.commit;
      if (!COLLECTIONS.includes(collection)) return;

      if (operation === "delete") {
        deleteRecord(evt.did, collection, rkey);
      } else {
        if (!admit(evt.did, collection, record)) return;
        indexRecord(evt.did, collection, rkey, record);
      }

      if (evt.time_us - lastSaved > 10_000_000) {
        saveCursor(evt.time_us);
        lastSaved = evt.time_us;
      }
    } catch {
      // ignore malformed events
    }
  });

  ws.on("close", () => {
    console.log("[jetstream] disconnected, reconnecting in 5s");
    setTimeout(connect, 5000);
  });

  ws.on("error", (err) => {
    console.error("[jetstream] error", err.message);
    ws.close();
  });
}
