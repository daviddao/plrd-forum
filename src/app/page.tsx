import Link from "next/link";
import { getFrontpagePosts } from "@/lib/queries";
import { getLandingSims } from "@/lib/sims";
import { PostsItem } from "@/components/PostsItem";
import { WalkingSims } from "@/components/WalkingSims";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [posts, sims] = await Promise.all([
    getFrontpagePosts(50),
    getLandingSims(7),
  ]);

  return (
    <div>
      <WalkingSims sims={sims} />
      <div className="section-title relative z-10">
        <h1>Latest Posts</h1>
        <Link
          href="/new-post"
          className="text-[13px] font-medium uppercase tracking-wide text-text-dim3 no-underline hover:opacity-60"
        >
          + New Post
        </Link>
      </div>

      <div className="relative z-10">
      {posts.length === 0 ? (
        <div className="bg-paper px-6 py-10 text-center" style={{ borderBottom: "2px solid var(--lw-item-separator)" }}>
          <p className="post-body mb-2">No posts have been indexed yet.</p>
          <p className="text-[14.3px] text-text-dim3">
            Log in and write the first post — or index an existing leaflet
            author via <code className="rounded bg-grey-100 px-1">POST /api/backfill</code>{" "}
            with <code className="rounded bg-grey-100 px-1">{"{ \"actor\": \"handle.bsky.social\" }"}</code>.
          </p>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostsItem key={post.uri} post={post} />
          ))}
        </div>
      )}
      </div>

      <section
        className="relative z-10 mt-12 border-t-2 px-1 pt-8"
        style={{ borderColor: "var(--lw-item-separator)" }}
      >
        <h2 className="serif-title text-[22px]">About PLRD Forum</h2>
        <p className="post-body mt-3">
          PLRD Forum is a reading and discussion community in the style of
          LessWrong, built on the AT Protocol. Instead of locking content into a
          private database, every post, comment, vote, and reaction here is a
          record in the author's own data repository (PDS), published with the
          open <code className="rounded bg-grey-100 px-1 text-[13px]">site.standard.*</code>{" "}
          lexicons. Sign in with your Bluesky handle and you can write posts,
          comment, and vote — the records stay yours, portable to any other
          ATProto app.
        </p>
        <h3 className="serif-title mt-6 text-[17px]">Browsing without an account</h3>
        <p className="text-[15.08px] leading-[1.55] text-text-dim2">
          No login is needed to read. The frontpage ranks recent posts by karma;
          <Link href="/allPosts" className="text-link"> All Posts</Link> browses everything
          chronologically; <Link href="/concepts" className="text-link">Concepts</Link> groups
          posts by tag; and the <Link href="/library" className="text-link">Library</Link> lists
          publications (blogs) with their theme colors. Karma is positive-only and
          equals the number of recommend records on a post. Comments thread through
          parent links, and reactions are short-form comments with named labels like
          "Agreed" or "Insightful", in the LessWrong tradition.
        </p>
        <h3 className="serif-title mt-6 text-[17px]">For agents and developers</h3>
        <p className="text-[15.08px] leading-[1.55] text-text-dim2">
          PLRD Forum is deliberately machine-readable. Every page can be fetched as
          markdown by sending an <code className="rounded bg-grey-100 px-1 text-[13px]">Accept: text/markdown</code>{" "}
          header; there is a public JSON API under <Link href="/docs" className="text-link">/docs</Link>,
          an OpenAPI description at <code className="rounded bg-grey-100 px-1 text-[13px]">/openapi.json</code>,
          agent instructions at <code className="rounded bg-grey-100 px-1 text-[13px]">/llms.txt</code>,
          and a read-only MCP server at{" "}
          <code className="rounded bg-grey-100 px-1 text-[13px]">/.well-known/mcp</code> with tools
          for listing posts, reading a full post, and listing concepts.
        </p>
      </section>
    </div>
  );
}
