import { resolvePds } from "@/lib/atproto/resolve";
import { indexRecord } from "./index";
import {
  DOCUMENT_NSID,
  COMMENT_NSID,
  RECOMMEND_NSID,
  PUBLICATION_NSID,
  SITE_DOCUMENT_NSID,
  SITE_PUBLICATION_NSID,
} from "@/lib/leaflet/types";

// legacy collections first so the site.standard pass supersedes migrated rkeys
const COLLECTIONS = [
  DOCUMENT_NSID,
  COMMENT_NSID,
  RECOMMEND_NSID,
  PUBLICATION_NSID,
  SITE_DOCUMENT_NSID,
  SITE_PUBLICATION_NSID,
];

/** Fetch and index all pub.leaflet.* records from an actor's PDS. */
export async function backfillActor(did: string): Promise<number> {
  const pds = await resolvePds(did);
  if (!pds) return 0;
  let count = 0;

  for (const collection of COLLECTIONS) {
    let cursor: string | undefined;
    do {
      const url = new URL(`${pds}/xrpc/com.atproto.repo.listRecords`);
      url.searchParams.set("repo", did);
      url.searchParams.set("collection", collection);
      url.searchParams.set("limit", "100");
      if (cursor) url.searchParams.set("cursor", cursor);

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) break;
      const data = (await res.json()) as {
        cursor?: string;
        records: { uri: string; value: unknown }[];
      };
      for (const rec of data.records ?? []) {
        const m = rec.uri.match(/^at:\/\/([^/]+)\/([^/]+)\/([^/]+)$/);
        if (!m) continue;
        if (indexRecord(m[1], m[2], m[3], rec.value)) count++;
      }
      cursor = data.cursor;
    } while (cursor);
  }
  return count;
}

const BACKFILL_TTL_MS = 15 * 60 * 1000;
const recentBackfills = new Map<string, number>();

/**
 * Backfill an actor at most once per TTL window per process. Unlike the old
 * "only when the index is empty" check, this also repairs partial indexes
 * (e.g. one record arrived via Jetstream but the rest of the repo was never
 * pulled, or a new collection was added — like the site.standard migration).
 */
export async function backfillActorOnce(did: string): Promise<void> {
  const last = recentBackfills.get(did);
  if (last && Date.now() - last < BACKFILL_TTL_MS) return;
  recentBackfills.set(did, Date.now());
  await backfillActor(did).catch(() => {});
}
