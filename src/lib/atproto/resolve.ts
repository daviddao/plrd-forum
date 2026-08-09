import { db, tables } from "@/lib/db";
import { eq } from "drizzle-orm";

const PLC_DIRECTORY = "https://plc.directory";
const PUBLIC_API = "https://public.api.bsky.app";
const PROFILE_TTL_MS = 1000 * 60 * 60 * 6; // 6h

export type ActorProfile = {
  did: string;
  handle: string | null;
  displayName: string | null;
  avatar: string | null;
  description: string | null;
  pds: string | null;
};

export async function resolveHandleToDid(handle: string): Promise<string | null> {
  if (handle.startsWith("did:")) return handle;
  const cached = db
    .select()
    .from(tables.profiles)
    .where(eq(tables.profiles.handle, handle.toLowerCase()))
    .get();
  if (cached) return cached.did;
  try {
    const res = await fetch(
      `${PUBLIC_API}/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { did: string };
    return data.did;
  } catch {
    return null;
  }
}

export async function resolvePds(did: string): Promise<string | null> {
  const profile = await getProfile(did);
  return profile?.pds ?? null;
}

async function fetchDidDoc(did: string): Promise<{ pds: string | null; handle: string | null }> {
  try {
    const url = did.startsWith("did:plc:")
      ? `${PLC_DIRECTORY}/${did}`
      : did.startsWith("did:web:")
        ? `https://${did.slice("did:web:".length)}/.well-known/did.json`
        : null;
    if (!url) return { pds: null, handle: null };
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return { pds: null, handle: null };
    const doc = (await res.json()) as {
      alsoKnownAs?: string[];
      service?: { id: string; type: string; serviceEndpoint: string }[];
    };
    const pds =
      doc.service?.find((s) => s.type === "AtprotoPersonalDataServer")?.serviceEndpoint ?? null;
    const handle =
      doc.alsoKnownAs?.find((a) => a.startsWith("at://"))?.slice("at://".length) ?? null;
    return { pds, handle };
  } catch {
    return { pds: null, handle: null };
  }
}

/** Get profile (cached in sqlite): handle, displayName, avatar, pds. */
export async function getProfile(did: string): Promise<ActorProfile | null> {
  const cached = db.select().from(tables.profiles).where(eq(tables.profiles.did, did)).get();
  if (cached?.fetchedAt && Date.now() - Date.parse(cached.fetchedAt) < PROFILE_TTL_MS && cached.pds) {
    return cached;
  }

  const [didDoc, bsky] = await Promise.all([
    fetchDidDoc(did),
    fetch(`${PUBLIC_API}/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(did)}`, {
      next: { revalidate: 300 },
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null) as Promise<{ handle?: string; displayName?: string; avatar?: string; description?: string } | null>,
  ]);

  const profile: ActorProfile = {
    did,
    handle: (bsky?.handle ?? didDoc.handle)?.toLowerCase() ?? null,
    displayName: bsky?.displayName ?? null,
    avatar: bsky?.avatar ?? null,
    description: bsky?.description ?? null,
    pds: didDoc.pds,
  };

  db.insert(tables.profiles)
    .values({ ...profile, fetchedAt: new Date().toISOString() })
    .onConflictDoUpdate({
      target: tables.profiles.did,
      set: { ...profile, fetchedAt: new Date().toISOString() },
    })
    .run();

  return profile;
}

export async function getProfiles(dids: string[]): Promise<Map<string, ActorProfile>> {
  const unique = [...new Set(dids)];
  const entries = await Promise.all(
    unique.map(async (did) => [did, await getProfile(did)] as const),
  );
  const map = new Map<string, ActorProfile>();
  for (const [did, p] of entries) if (p) map.set(did, p);
  return map;
}

/** Direct blob URL on the owner's PDS. */
export function blobUrl(pds: string | null, did: string, cid: string): string {
  const host = pds ?? "https://bsky.social";
  return `${host}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(cid)}`;
}

export function parseAtUri(uri: string): { did: string; collection: string; rkey: string } | null {
  const m = uri.match(/^at:\/\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (!m) return null;
  return { did: m[1], collection: m[2], rkey: m[3] };
}
