import { NextRequest, NextResponse } from "next/server";
import { db, tables } from "@/lib/db";
import { getSessionDid } from "@/lib/auth/session";

/**
 * Feedback drop-box for the floating Einstein widget. Rows land in the local
 * SQLite index (demo-grade on Vercel, like the rest of the index — see
 * AGENTS.md). Works for guests; the DID is attached when logged in.
 */
export async function POST(req: NextRequest) {
  let body: { text?: unknown; path?: unknown };
  try {
    body = (await req.json()) as { text?: unknown; path?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });
  if (text.length > 5000) {
    return NextResponse.json({ error: "too long" }, { status: 400 });
  }

  const did = await getSessionDid().catch(() => null);
  db.insert(tables.feedback)
    .values({
      did,
      text: text.slice(0, 5000),
      path: typeof body.path === "string" ? body.path.slice(0, 500) : null,
      createdAt: new Date().toISOString(),
    })
    .run();
  console.log(`[feedback] ${did ?? "guest"}: ${text.slice(0, 200)}`);
  return NextResponse.json({ ok: true });
}
