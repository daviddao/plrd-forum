import { NodeOAuthClient } from "@atproto/oauth-client-node";
import { cookieStateStore, cookieSessionStore } from "./cookie-stores";

export const SCOPE = "atproto transition:generic";

export function publicUrl(): string {
  return process.env.PUBLIC_URL ?? "http://127.0.0.1:3000";
}

function isLoopback(url: string) {
  return url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost") || url.startsWith("http://[::1]");
}

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

  const client = new NodeOAuthClient({
    clientMetadata,
    stateStore: cookieStateStore,
    sessionStore: cookieSessionStore,
  });
  globalForOauth.__oauthClient = client;
  return client;
}

/**
 * Some PDS deployments publish an authorization_endpoint on a host with a
 * broken cookie/CSRF configuration (e.g. climateai.org advertises
 * auth.climateai.org, whose authorize page always fails CSRF while the
 * same backend works on the apex). Rewrite known-bad authorize hosts.
 */
const AUTHORIZE_HOST_REWRITES: Record<string, string> = {
  "auth.climateai.org": "climateai.org",
  ...(process.env.OAUTH_AUTHORIZE_REWRITES
    ? (JSON.parse(process.env.OAUTH_AUTHORIZE_REWRITES) as Record<string, string>)
    : {}),
};

export function fixAuthorizeUrl(url: URL): URL {
  const replacement = AUTHORIZE_HOST_REWRITES[url.host];
  if (replacement) {
    const fixed = new URL(url.toString());
    fixed.host = replacement;
    return fixed;
  }
  return url;
}
