import WebSocket from "ws";
import { db, tables } from "@/lib/db";
import { indexRecord, deleteRecord } from "./index";
import {
  DOCUMENT_NSID,
  COMMENT_NSID,
  RECOMMEND_NSID,
  PUBLICATION_NSID,
  SITE_DOCUMENT_NSID,
  SITE_PUBLICATION_NSID,
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
];

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
