import { NextRequest } from "next/server";
import { getFrontpagePosts, getPost } from "@/lib/queries";
import { db, tables } from "@/lib/db";
import { documentToMarkdown, postHref } from "@/lib/markdown";
import type { LeafletDocument } from "@/lib/leaflet/types";
import { SITE_NAME, SITE_SLUG, SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Read-only MCP (Model Context Protocol) server over Streamable HTTP,
 * published at /.well-known/mcp. Stateless JSON-RPC: each POST is handled
 * independently, no session is issued.
 */

const PROTOCOL_VERSION = "2025-06-18";

const SERVER_INFO = {
  name: SITE_SLUG,
  title: SITE_NAME,
  version: "1.0.0",
};

const INSTRUCTIONS =
  `Read-only MCP server for ${SITE_NAME}, a LessWrong-style ATProto forum. ` +
  "Use get_frontpage to list recent posts with karma and URLs, get_post to " +
  "read a full post as markdown (did + rkey come from /posts/<did>/<rkey> " +
  "URLs), and list_concepts to enumerate tags.";

const TOOLS = [
  {
    name: "get_frontpage",
    description:
      `List the latest posts on ${SITE_NAME} (a LessWrong-style ATProto forum), ranked by recency with karma and comment counts.`,
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of posts to return (default 25, max 100).",
        },
      },
    },
  },
  {
    name: "get_post",
    description:
      `Fetch a single ${SITE_NAME} post's full text as markdown, given the author DID and record key (from a /posts/<did>/<rkey> URL).`,
    inputSchema: {
      type: "object",
      properties: {
        did: { type: "string", description: "Author DID, e.g. did:plc:…" },
        rkey: { type: "string", description: "Record key of the post." },
      },
      required: ["did", "rkey"],
    },
  },
  {
    name: "list_concepts",
    description: `List the tags (concepts) used across ${SITE_NAME} posts with post counts.`,
    inputSchema: { type: "object", properties: {} },
  },
] as const;

async function callTool(name: string, args: Record<string, unknown>) {
  if (name === "get_frontpage") {
    const limit = Math.min(Math.max(Number(args.limit) || 25, 1), 100);
    const posts = await getFrontpagePosts(limit);
    return {
      content: [
        {
          type: "text",
          text: posts
            .map(
              (p) =>
                `- ${p.title || "(untitled)"}\n  url: ${SITE_URL}${postHref(p.did, p.rkey)}\n  author: ${p.author?.handle || p.did} · karma ${p.karma} · ${p.commentCount} comments`,
            )
            .join("\n") || "(no posts indexed)",
        },
      ],
    };
  }
  if (name === "get_post") {
    const post = await getPost(String(args.did), String(args.rkey));
    if (!post)
      return {
        content: [{ type: "text", text: "Post not found in the index." }],
        isError: true,
      };
    return {
      content: [
        {
          type: "text",
          text: `# ${post.title || "(untitled)"}\nBy ${post.author?.displayName || post.author?.handle || String(args.did)} · karma ${post.karma}\n\n${documentToMarkdown(post.record as LeafletDocument)}`,
        },
      ],
    };
  }
  if (name === "list_concepts") {
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
    return {
      content: [
        {
          type: "text",
          text:
            [...counts.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([tag, n]) => `${tag}: ${n} posts`)
              .join("\n") || "(no tagged posts indexed)",
        },
      ],
    };
  }
  return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
}

function jsonRpcResult(id: unknown, result: unknown, status = 200) {
  return Response.json({ jsonrpc: "2.0", id, result }, { status });
}

function jsonRpcError(id: unknown, code: number, message: string, status = 200) {
  return Response.json(
    { jsonrpc: "2.0", id, error: { code, message } },
    { status },
  );
}

export async function POST(req: NextRequest) {
  let body: {
    jsonrpc?: string;
    id?: unknown;
    method?: string;
    params?: {
      name?: string;
      arguments?: Record<string, unknown>;
      protocolVersion?: string;
    };
  };
  try {
    body = await req.json();
  } catch {
    return jsonRpcError(null, -32700, "Parse error", 400);
  }

  const { id, method, params } = body;

  switch (method) {
    case "initialize":
      return jsonRpcResult(id, {
        // this server is protocol-version agnostic — echo the client's request
        protocolVersion:
          typeof params?.protocolVersion === "string"
            ? params.protocolVersion
            : PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    case "notifications/initialized":
      return new Response(null, { status: 202 });
    case "ping":
      return jsonRpcResult(id, {});
    case "tools/list":
      return jsonRpcResult(id, { tools: TOOLS });
    case "tools/call": {
      const name = params?.name ?? "";
      try {
        const result = await callTool(name, params?.arguments ?? {});
        return jsonRpcResult(id, result);
      } catch (e) {
        return jsonRpcError(id, -32603, `Tool execution failed: ${e}`);
      }
    }
    default:
      return method?.startsWith("notifications/")
        ? new Response(null, { status: 202 })
        : jsonRpcError(id, -32601, `Method not supported: ${method}`);
  }
}

// Streamable HTTP GET (server-initiated SSE) is not offered by this stateless server.
export async function GET() {
  return Response.json(
    {
      jsonrpc: "2.0",
      error: { code: -32000, message: "SSE streaming not supported" },
      id: null,
    },
    { status: 405, headers: { Allow: "POST" } },
  );
}

export async function DELETE() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}
