import Link from "next/link";

export const metadata = {
  title: "Docs",
  description:
    "Developer and agent resources for PLRD Forum: markdown content negotiation, HTTP API, OpenAPI spec, MCP server, llms.txt.",
};

const endpoints: { method: string; path: string; desc: string }[] = [
  {
    method: "GET",
    path: "/api/posts?limit=25",
    desc: "Public JSON list of indexed posts with karma and comment counts.",
  },
  {
    method: "GET",
    path: "/api/markdown?path=/…",
    desc: "Markdown variant of any site page (same as Accept: text/markdown).",
  },
  {
    method: "POST",
    path: "/api/backfill",
    desc: 'Index an actor\'s ATProto records. Body: {"actor": "handle-or-did"}.',
  },
  {
    method: "POST",
    path: "/api/posts",
    desc: "Create a post (OAuth session; writes site.standard.document to your PDS).",
  },
  {
    method: "POST",
    path: "/api/comments",
    desc: "Create a comment or named reaction (OAuth session).",
  },
  {
    method: "POST",
    path: "/api/votes",
    desc: "Recommend a post — karma equals recommend count (OAuth session).",
  },
  {
    method: "POST",
    path: "/api/subscriptions",
    desc: "Follow an author/publication (OAuth session).",
  },
];

export default function DocsPage() {
  return (
    <div className="lw-card mt-8 px-8 py-10">
      <h1 className="serif-title pb-1 text-[26px]">PLRD Forum developer docs</h1>
      <div className="post-body">
        <p>
          PLRD Forum is built on ATProto and the open{" "}
          <code>site.standard.*</code> lexicons, so most of it is already
          machine-readable. Everything below requires no API key.
        </p>

        <h2 className="serif-title mt-8 text-[20px]">For agents</h2>
        <ul className="list-disc pl-6 leading-[1.9]">
          <li>
            Send <code>Accept: text/markdown</code> with any page request to get
            the markdown variant (responses carry{" "}
            <code>Vary: Accept, Accept-Encoding</code>).
          </li>
          <li>
            Agent instructions / when-to-use:{" "}
            <Link href="/llms.txt" className="text-link">/llms.txt</Link>
          </li>
          <li>
            MCP server (Streamable HTTP JSON-RPC):{" "}
            <code>/.well-known/mcp</code> — tools{" "}
            <code>get_frontpage</code>, <code>get_post</code>,{" "}
            <code>list_concepts</code>.
          </li>
        </ul>

        <h2 className="serif-title mt-8 text-[20px]">HTTP API</h2>
        <p>
          Full machine-readable description in the{" "}
          <Link href="/openapi.json" className="text-link">OpenAPI spec (/openapi.json)</Link>.
        </p>
        <table className="mt-3 w-full text-[14px]">
          <tbody>
            {endpoints.map((e) => (
              <tr key={e.path} style={{ borderBottom: "2px solid var(--lw-item-separator)" }}>
                <td className="py-2 pr-3 align-top font-mono text-[12.5px] font-semibold whitespace-nowrap">
                  {e.method}
                </td>
                <td className="py-2 pr-4 align-top font-mono text-[12.5px] whitespace-nowrap">
                  {e.path}
                </td>
                <td className="py-2 align-top text-text-dim2">{e.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="serif-title mt-8 text-[20px]">Other resources</h2>
        <ul className="list-disc pl-6 leading-[1.9]">
          <li><Link href="/sitemap.xml" className="text-link">/sitemap.xml</Link> — all indexable URLs</li>
          <li>
            Lexicons: <code>site.standard.document</code>,{" "}
            <code>site.standard.publication</code>,{" "}
            <code>site.standard.graph.recommend</code>,{" "}
            <code>site.standard.graph.subscription</code>{" "}
            (published by leaflet.pub; legacy <code>pub.leaflet.*</code> still indexed)
          </li>
          <li>Source &amp; issues: the forum is a Next.js app porting LessWrong's design</li>
        </ul>
      </div>
    </div>
  );
}
