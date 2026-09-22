import { NextRequest } from "next/server";
import { pageToMarkdown } from "@/lib/markdown";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Markdown variant of any site page, reached via middleware when the client
 * sends `Accept: text/markdown` (acceptmarkdown.com content negotiation).
 */
export async function GET(req: NextRequest) {
  const pathname = req.nextUrl.searchParams.get("path") ?? "/";
  const md = (await pageToMarkdown(pathname)) ??
    `# ${SITE_NAME}\n\nNo markdown view for ${pathname}. Start at:\n\n- /: frontpage\n- /allPosts: all posts\n- /concepts: tags\n- /docs: developer and agent resources\n`;

  return new Response(md, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // CDNs must not mix the HTML and markdown variants
      Vary: "Accept, Accept-Encoding",
      "Cache-Control": "no-store",
    },
  });
}
