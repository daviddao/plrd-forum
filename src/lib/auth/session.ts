import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { Agent } from "@atproto/api";
import { getOAuthClient } from "./client";

export type SessionData = { did?: string };

const sessionOptions: SessionOptions = {
  cookieName: "plrd_forum_sid",
  password:
    process.env.SESSION_SECRET ?? "complex_password_at_least_32_characters_long_dev_only",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/** DID of the logged-in user, or null. */
export async function getSessionDid(): Promise<string | null> {
  const session = await getSession();
  return session.did ?? null;
}

/** Restore an authenticated Agent for the logged-in user, or null. */
export async function getSessionAgent(): Promise<{ agent: Agent; did: string } | null> {
  const session = await getSession();
  if (!session.did) return null;
  try {
    const oauthSession = await getOAuthClient().restore(session.did);
    return { agent: new Agent(oauthSession), did: session.did };
  } catch {
    session.destroy();
    return null;
  }
}
