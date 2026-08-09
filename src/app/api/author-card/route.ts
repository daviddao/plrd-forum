import { NextRequest, NextResponse } from "next/server";
import { getAuthorCards } from "@/lib/queries";
import { getProfiles } from "@/lib/atproto/resolve";

/**
 * Data for the LW-style user hover card (LWUserTooltipContent). Fetched
 * lazily when a tooltip first opens — same pattern as LW's useQuery-on-
 * hover — so lists don't pay for cards nobody looks at.
 */
export async function GET(req: NextRequest) {
  const did = req.nextUrl.searchParams.get("did");
  if (!did || !did.startsWith("did:")) {
    return NextResponse.json({ error: "did required" }, { status: 400 });
  }
  const [card, profiles] = await Promise.all([
    Promise.resolve(getAuthorCards([did]).get(did)),
    getProfiles([did]),
  ]);
  const profile = profiles.get(did) ?? null;
  return NextResponse.json(
    {
      did,
      displayName: profile?.displayName ?? null,
      handle: profile?.handle ?? null,
      bio: profile?.description ?? null,
      karma: card?.karma ?? 0,
      postCount: card?.postCount ?? 0,
      commentCount: card?.commentCount ?? 0,
      recentPosts: (card?.recentPosts ?? []).map((p) => ({
        title: p.title,
        href: `/posts/${p.did}/${p.rkey}`,
      })),
    },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
