import { db, tables } from "@/lib/db";
import { getFrontpagePosts, getPost, getPostsByTag } from "@/lib/queries";
import type { LeafletDocument } from "@/lib/leaflet/types";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.PUBLIC_URL?.startsWith("https") ? process.env.PUBLIC_URL : undefined) ??
  "https://plrd-forum.vercel.app";

function abs(path: string) {
  return `${SITE_URL}${path}`;
}

export function postHref(did: string, rkey: string) {
  return `/posts/${did}/${rkey}`;
}

/** Render a leaflet document's blocks as plain markdown text. */
export function documentToMarkdown(doc: LeafletDocument): string {
  const out: string[] = [];
  for (const page of doc.pages ?? []) {
    for (const b of page.blocks ?? []) {
      const block = b.block as {
        $type?: string;
        plaintext?: string;
        level?: number;
        language?: string;
        tex?: string;
      };
      if (!block) continue;
      switch (block.$type) {
        case "pub.leaflet.blocks.header": {
          const level = Math.min(Math.max(block.level ?? 1, 1), 6);
          out.push(`${"#".repeat(level)} ${block.plaintext ?? ""}`);
          break;
        }
        case "pub.leaflet.blocks.blockquote":
          for (const line of (block.plaintext ?? "").split("\n"))
            out.push(`> ${line}`);
          break;
        case "pub.leaflet.blocks.code":
          out.push("```" + (block.language ?? ""), block.plaintext ?? "", "```");
          break;
        case "pub.leaflet.blocks.math":
          out.push(`$$\n${block.tex ?? ""}\n$$`);
          break;
        case "pub.leaflet.blocks.text":
          if (block.plaintext?.trim()) out.push(block.plaintext);
          break;
        default:
          if (typeof block.plaintext === "string" && block.plaintext.trim())
            out.push(block.plaintext);
      }
    }
  }
  return out.join("\n\n");
}

async function frontpageMarkdown(): Promise<string> {
  const posts = await getFrontpagePosts(50);
  const lines = [
    `# PLRD Forum`,
    "",
    "A LessWrong-style discussion forum built on ATProto. Every post, comment,",
    "vote, and reaction is a record in the author's own data repository (PDS),",
    "published with the open site.standard.* lexicons.",
    "",
    `## Latest Posts (${posts.length})`,
    "",
  ];
  for (const p of posts) {
    const date = p.publishedAt ? new Date(p.publishedAt).toISOString().slice(0, 10) : "";
    lines.push(
      `- [${p.title || "(untitled)"}](${abs(postHref(p.did, p.rkey))}) — karma ${p.karma} · ${p.commentCount} comments · by ${p.author?.displayName || p.author?.handle || p.did}${date ? ` · ${date}` : ""}`,
    );
    if (p.excerpt) lines.push(`  > ${p.excerpt.slice(0, 200).replace(/\n/g, " ")}`);
  }
  lines.push(
    "",
    "## Site map",
    "",
    `- [All Posts](${abs("/allPosts")}) — everything chronologically`,
    `- [Concepts](${abs("/concepts")}) — posts grouped by tag`,
    `- [Library](${abs("/library")}) — publications (blogs)`,
    `- [About](${abs("/about")}) · [Contact](${abs("/contact")}) · [Privacy](${abs("/privacy")})`,
    `- [Developer docs](${abs("/docs")}) — API, OpenAPI spec, MCP server`,
    "",
    "Any page on this site can be fetched as markdown by sending",
    "`Accept: text/markdown`. An MCP server is available at `/.well-known/mcp`.",
  );
  return lines.join("\n");
}

async function allPostsMarkdown(): Promise<string> {
  const posts = await getFrontpagePosts(500);
  const sorted = [...posts].sort(
    (a, b) =>
      new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime(),
  );
  const lines = ["# All Posts — PLRD Forum", "", `${sorted.length} indexed posts:`, ""];
  for (const p of sorted) {
    lines.push(
      `- [${p.title || "(untitled)"}](${abs(postHref(p.did, p.rkey))}) — ${p.author?.handle || p.did} · ${p.karma} karma`,
    );
  }
  return lines.join("\n");
}

async function conceptsMarkdown(): Promise<string> {
  const counts = new Map<string, number>();
  for (const r of db.select({ record: tables.posts.record }).from(tables.posts).all()) {
    try {
      const doc = JSON.parse(r.record as string) as LeafletDocument;
      for (const tag of doc.tags ?? []) {
        const t = tag.trim();
        if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    } catch {
      // skip unparseable records
    }
  }
  const lines = [
    "# Concepts — PLRD Forum",
    "",
    "Tags used across posts:",
    "",
  ];
  for (const [tag, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`- [${tag}](${abs(`/concepts/${encodeURIComponent(tag)}`)}) — ${n} posts`);
  }
  if (lines.length === 4) lines.push("(No tagged posts indexed yet.)");
  return lines.join("\n");
}

async function tagMarkdown(tag: string): Promise<string> {
  const posts = await getPostsByTag(tag);
  const lines = [`# #${tag} — PLRD Forum`, "", `${posts.length} posts:`, ""];
  for (const p of posts) {
    lines.push(
      `- [${p.title || "(untitled)"}](${abs(postHref(p.did, p.rkey))}) — ${p.author?.handle || p.did}`,
    );
  }
  return lines.join("\n");
}

async function postMarkdown(did: string, rkey: string): Promise<string | null> {
  const post = await getPost(did, rkey);
  if (!post) return null;
  const doc = post.record as LeafletDocument;
  const author = post.author?.displayName || post.author?.handle || did;
  return [
    `# ${post.title || "(untitled)"}`,
    "",
    `By ${author} · [profile](${abs(`/users/${did}`)}) · karma ${post.karma}`,
    "",
    "---",
    "",
    documentToMarkdown(doc),
    "",
    "---",
    "",
    `Read on the web: ${abs(postHref(did, rkey))}`,
  ].join("\n");
}

/** Render a site page as markdown. Returns null when the path has no content. */
export async function pageToMarkdown(pathname: string): Promise<string | null> {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/" ) return frontpageMarkdown();
  if (path === "/allPosts") return allPostsMarkdown();
  if (path === "/concepts") return conceptsMarkdown();
  const tagMatch = path.match(/^\/concepts\/([^/]+)$/);
  if (tagMatch) return tagMarkdown(decodeURIComponent(tagMatch[1]));
  const postMatch = path.match(/^\/posts\/([^/]+)\/([^/]+)$/);
  if (postMatch) return postMarkdown(postMatch[1], postMatch[2]);
  if (path === "/about")
    return (
      "# About PLRD Forum\n\nPLRD Forum is a reading and discussion community in the style of LessWrong, built on the AT Protocol. Every post, comment, vote, and reaction is a record in the author's own data repository (PDS), published with the open site.standard.* lexicons. Sign in with a Bluesky handle to write; reading needs no account.\n"
    );
  if (path === "/contact")
    return "# Contact\n\nPLRD Forum is maintained by Polaris Labs R&D. Email research@protocol.ai for questions, moderation concerns, or data requests.\n";
  if (path === "/privacy")
    return "# Privacy\n\nPLRD Forum is an index, not a host: your records live in your own PDS. We store only public records needed to render pages, set one session cookie holding your DID, and run no trackers. Email research@protocol.ai to be excluded from the index.\n";
  if (path === "/docs")
    return "# Developer & agent resources\n\n- Markdown content negotiation: send `Accept: text/markdown` to any page.\n- OpenAPI description: /openapi.json\n- Agent instructions: /llms.txt\n- MCP server: /.well-known/mcp (Streamable HTTP JSON-RPC; tools: get_frontpage, get_post, list_concepts)\n- Sitemap: /sitemap.xml\n";
  return null;
}
