import { cookies } from "next/headers";
import { sealData, unsealData } from "iron-session";
import { getSessionSecret } from "./secret";
import type {
  NodeSavedSession,
  NodeSavedSessionStore,
  NodeSavedState,
  NodeSavedStateStore,
} from "@atproto/oauth-client-node";

/**
 * OAuth state + session stores backed by encrypted (iron-session sealed)
 * cookies instead of SQLite. On serverless hosts every lambda has its own
 * ephemeral /tmp, so a DB-backed token store written by the /oauth/callback
 * lambda is invisible to the /api/* lambdas — cookies travel with the user
 * instead. Values are chunked across cookies to stay under the 4KB limit.
 *
 * Note: cookie writes are only possible in Route Handlers / Server Actions.
 * Token-refresh writes triggered from RSC renders are swallowed (the refresh
 * still succeeds in-memory; the next API request persists it).
 */

const CHUNK = 3500;
const MAX_CHUNKS = 4;

async function writeChunked(prefix: string, value: string, maxAge: number) {
  const store = await cookies();
  const chunks: string[] = [];
  for (let i = 0; i < value.length; i += CHUNK) chunks.push(value.slice(i, i + CHUNK));
  for (let i = 0; i < MAX_CHUNKS; i++) {
    const name = `${prefix}.${i}`;
    if (i < chunks.length) {
      store.set(name, chunks[i], {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge,
      });
    } else if (store.get(name)) {
      store.delete(name);
    }
  }
}

async function readChunked(prefix: string): Promise<string | null> {
  const store = await cookies();
  let out = "";
  for (let i = 0; i < MAX_CHUNKS; i++) {
    const c = store.get(`${prefix}.${i}`);
    if (!c) break;
    out += c.value;
  }
  return out || null;
}

async function deleteChunked(prefix: string) {
  const store = await cookies();
  for (let i = 0; i < MAX_CHUNKS; i++) {
    if (store.get(`${prefix}.${i}`)) store.delete(`${prefix}.${i}`);
  }
}

/** Short-lived PAR/authorize state (one active login flow per browser). */
export const cookieStateStore: NodeSavedStateStore = {
  async set(_key, state) {
    const sealed = await sealData({ key: _key, state }, { password: getSessionSecret(), ttl: 3600 });
    await writeChunked("plrd_oauth_state", sealed, 3600);
  },
  async get(key) {
    const raw = await readChunked("plrd_oauth_state");
    if (!raw) return undefined;
    try {
      const data = await unsealData<{ key: string; state: NodeSavedState }>(raw, {
        password: getSessionSecret(),
      });
      return data.key === key ? data.state : undefined;
    } catch {
      return undefined;
    }
  },
  async del() {
    try {
      await deleteChunked("plrd_oauth_state");
    } catch {
      // read-only context (RSC) — ignore
    }
  },
};

/** OAuth token set + DPoP key for the logged-in DID. */
export const cookieSessionStore: NodeSavedSessionStore = {
  async set(key, session) {
    const password = getSessionSecret();
    try {
      const sealed = await sealData(
        { key, session },
        { password, ttl: 60 * 60 * 24 * 60 },
      );
      await writeChunked("plrd_oauth_sess", sealed, 60 * 60 * 24 * 60);
    } catch {
      // cookie writes are unavailable during RSC render (token refresh) —
      // the refreshed tokens still live in memory for this request.
    }
  },
  async get(key) {
    const raw = await readChunked("plrd_oauth_sess");
    if (!raw) return undefined;
    try {
      const data = await unsealData<{ key: string; session: NodeSavedSession }>(raw, {
        password: getSessionSecret(),
      });
      return data.key === key ? data.session : undefined;
    } catch {
      return undefined;
    }
  },
  async del() {
    try {
      await deleteChunked("plrd_oauth_sess");
    } catch {
      // ignore in read-only contexts
    }
  },
};
