import {
  NodeOAuthClient,
  type NodeSavedSession,
  type NodeSavedSessionStore,
  type NodeSavedState,
  type NodeSavedStateStore,
} from "@atproto/oauth-client-node";
import { db, tables } from "@/lib/db";
import { eq } from "drizzle-orm";

export const SCOPE = "atproto transition:generic";

export function publicUrl(): string {
  return process.env.PUBLIC_URL ?? "http://127.0.0.1:3000";
}

function isLoopback(url: string) {
  return url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost") || url.startsWith("http://[::1]");
}

const stateStore: NodeSavedStateStore = {
  async set(key, state) {
    db.insert(tables.authState)
      .values({ key, data: JSON.stringify(state) })
      .onConflictDoUpdate({ target: tables.authState.key, set: { data: JSON.stringify(state) } })
      .run();
  },
  async get(key) {
    const row = db.select().from(tables.authState).where(eq(tables.authState.key, key)).get();
    return row ? (JSON.parse(row.data) as NodeSavedState) : undefined;
  },
  async del(key) {
    db.delete(tables.authState).where(eq(tables.authState.key, key)).run();
  },
};

const sessionStore: NodeSavedSessionStore = {
  async set(key, session) {
    db.insert(tables.authSession)
      .values({ key, data: JSON.stringify(session) })
      .onConflictDoUpdate({ target: tables.authSession.key, set: { data: JSON.stringify(session) } })
      .run();
  },
  async get(key) {
    const row = db.select().from(tables.authSession).where(eq(tables.authSession.key, key)).get();
    return row ? (JSON.parse(row.data) as NodeSavedSession) : undefined;
  },
  async del(key) {
    db.delete(tables.authSession).where(eq(tables.authSession.key, key)).run();
  },
};

const globalForOauth = globalThis as unknown as { __oauthClient?: NodeOAuthClient };

export function getOAuthClient(): NodeOAuthClient {
  if (globalForOauth.__oauthClient) return globalForOauth.__oauthClient;

  const base = publicUrl();
  const redirectUri = `${base}/oauth/callback`;

  const clientMetadata = isLoopback(base)
    ? {
        // Loopback client (dev): client_id is a crafted http://localhost URL
        client_id: `http://localhost?redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(SCOPE)}`,
        redirect_uris: [redirectUri] as [string],
        scope: SCOPE,
        client_name: "PLRD Forum (dev)",
        token_endpoint_auth_method: "none" as const,
        response_types: ["code"] as ["code"],
        grant_types: ["authorization_code", "refresh_token"] as ["authorization_code", "refresh_token"],
        application_type: "web" as const,
        dpop_bound_access_tokens: true,
      }
    : {
        client_id: `${base}/client-metadata.json`,
        redirect_uris: [redirectUri] as [string],
        scope: SCOPE,
        client_name: "PLRD Forum",
        client_uri: base,
        token_endpoint_auth_method: "none" as const,
        response_types: ["code"] as ["code"],
        grant_types: ["authorization_code", "refresh_token"] as ["authorization_code", "refresh_token"],
        application_type: "web" as const,
        dpop_bound_access_tokens: true,
      };

  const client = new NodeOAuthClient({ clientMetadata, stateStore, sessionStore });
  globalForOauth.__oauthClient = client;
  return client;
}
