import WebSocket from "ws";
import { db, tables } from "@/lib/db";
import { eq } from "drizzle-orm";
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
 * The site.standard.* firehose is dominated by RSS-bridge services
 * (news mirrors, image boards, *.web.brid.gy) that mass-publish
 * site.standard.document records. Gate those collections to actors the
 * index already knows — anyone who has posted/commented/voted via the
 * quiet pub.leaflet.* lexicons or was explicitly backfilled (profile
 * visit, post visit, /api/backfill). The backfill paths call
 * indexRecord directly, so new genuine authors still get in.
 */
const GATED_COLLECTIONS = new Set([SITE_DOCUMENT_NSID, SITE_PUBLICATION_NSID]);

function isKnownActor(did: string): boolean {
  return !!(
    db.select({ did: tables.posts.did }).from(tables.posts).where(eq(tables.posts.did, did)).get() ??
    db.select({ did: tables.comments.did }).from(tables.comments).where(eq(tables.comments.did, did)).get() ??
    db.select({ did: tables.votes.did }).from(tables.votes).where(eq(tables.votes.did, did)).get() ??
    db.select({ did: tables.publications.did }).from(tables.publications).where(eq(tables.publications.did, did)).get()
  );
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
        if (GATED_COLLECTIONS.has(collection) && !isKnownActor(evt.did)) return;
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
