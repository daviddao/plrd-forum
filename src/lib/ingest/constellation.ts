import { db, tables } from "@/lib/db";
import { inArray } from "drizzle-orm";
import { resolvePds } from "@/lib/atproto/resolve";
import { indexRecord } from "./index";
import { COMMENT_NSID, RECOMMEND_NSID } from "@/lib/leaflet/types";

const CONSTELLATION = "https://constellation.microcosm.blue";

type LinkingRecord = { did: string; collection: string; rkey: string };

/**
 * Hydrate the local (possibly ephemeral) index with every comment and
 * recommend referencing a subject, discovered via Constellation's global
 * backlink index. This keeps serverless instances consistent: writes land
 * on whichever lambda handled them, but reads can always reconstruct the
 * full reply/vote graph from the network.
 */
export async function hydrateSubject(subjectUri: string): Promise<void> {
  const lookups: [string, string][] = [
    [COMMENT_NSID, ".subject"],
    [RECOMMEND_NSID, ".subject"],
  ];

  const found: LinkingRecord[] = [];
  await Promise.all(
    lookups.map(async ([collection, path]) => {
      try {
        let cursor: string | null = null;
        for (let page = 0; page < 5; page++) {
          const url = new URL(`${CONSTELLATION}/links`);
          url.searchParams.set("target", subjectUri);
          url.searchParams.set("collection", collection);
          url.searchParams.set("path", path);
          if (cursor) url.searchParams.set("cursor", cursor);
          const res = await fetch(url, { next: { revalidate: 15 } });
          if (!res.ok) return;
          const data = (await res.json()) as {
            linking_records?: LinkingRecord[];
            cursor?: string | null;
          };
          found.push(...(data.linking_records ?? []));
          cursor = data.cursor ?? null;
          if (!cursor) break;
        }
      } catch {
        // constellation unavailable — local index only
      }
    }),
  );
  if (found.length === 0) return;

  // which of these are already indexed locally?
  const uris = found.map((r) => `at://${r.did}/${r.collection}/${r.rkey}`);
  const haveComments = new Set(
    db
      .select({ uri: tables.comments.uri })
      .from(tables.comments)
      .where(inArray(tables.comments.uri, uris))
      .all()
      .map((r) => r.uri),
  );
  const haveVotes = new Set(
    db
      .select({ uri: tables.votes.uri })
      .from(tables.votes)
      .where(inArray(tables.votes.uri, uris))
      .all()
      .map((r) => r.uri),
  );

  const missing = found.filter((r) => {
    const uri = `at://${r.did}/${r.collection}/${r.rkey}`;
    return !(haveComments.has(uri) || haveVotes.has(uri));
  });
  if (missing.length === 0) return;

  // fetch missing records from their PDSes (bounded parallelism)
  const pdsCache = new Map<string, string | null>();
  await Promise.all(
    missing.slice(0, 100).map(async (r) => {
      try {
        let pds = pdsCache.get(r.did);
        if (pds === undefined) {
          pds = await resolvePds(r.did);
          pdsCache.set(r.did, pds);
        }
        if (!pds) return;
        const res = await fetch(
          `${pds}/xrpc/com.atproto.repo.getRecord?repo=${encodeURIComponent(r.did)}&collection=${r.collection}&rkey=${encodeURIComponent(r.rkey)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { value: unknown };
        indexRecord(r.did, r.collection, r.rkey, data.value);
      } catch {
        // skip unreachable records
      }
    }),
  );
}
