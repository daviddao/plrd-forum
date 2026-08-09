import { NextRequest, NextResponse } from "next/server";
import { findPostForLink } from "@/lib/queries";
import { fetchWebsitePreview } from "@/lib/og";

/**
 * Resolve a hovered link for the hover-preview card:
 *  - links to indexed posts (internal /posts/… or standard.site
 *    publication permalinks) → {kind:"post", …PostListItem} for the
 *    LWPostsPreviewTooltip card, with ephemeral-index PDS fallbacks
 *  - any other http(s) page → {kind:"website", …} with Open Graph
 *    title/description/image for a website preview card
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url || url.length > 2000) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  const post = await findPostForLink(url);
  if (post) {
    return NextResponse.json(
      { kind: "post", ...post, href: `/posts/${post.did}/${post.rkey}` },
      { headers: { "Cache-Control": "public, max-age=300" } },
    );
  }

  const site = await fetchWebsitePreview(url);
  if (site) {
    return NextResponse.json(site, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  }

  return NextResponse.json({ error: "no preview" }, { status: 404 });
}
