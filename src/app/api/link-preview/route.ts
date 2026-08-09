import { NextRequest, NextResponse } from "next/server";
import { findPostForLink } from "@/lib/queries";

/**
 * Resolve a hovered link to an indexed post for the LW-style hover
 * preview card (LWPostsPreviewTooltip). Returns 404 for links that
 * don't correspond to a post we know about — the client then falls
 * back to the plain URL tooltip.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || url.length > 2000) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }
  const post = await findPostForLink(url);
  if (!post) return NextResponse.json({ error: "not a post" }, { status: 404 });
  return NextResponse.json(
    {
      ...post,
      href: `/posts/${post.did}/${post.rkey}`,
    },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
