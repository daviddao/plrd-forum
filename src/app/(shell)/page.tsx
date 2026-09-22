import Link from "next/link";
import { getFrontpagePosts } from "@/lib/queries";
import { PostsItem } from "@/components/PostsItem";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await getFrontpagePosts(50);

  return (
    <div>
      <div className="section-title relative z-10">
        <h1>Latest Posts</h1>
        <Link href="/new-post" className="section-action no-underline">
          + New post
        </Link>
      </div>

      <div className="relative z-10">
      {posts.length === 0 ? (
        <div className="bg-paper px-6 py-10 text-center" style={{ borderBottom: "2px solid var(--lw-item-separator)" }}>
          <p className="post-body mb-2">No posts have been indexed yet.</p>
          <p className="text-[14.3px] text-text-dim3">
            Sign in and write the first post, or index an existing author via{" "}
            <code className="rounded bg-grey-100 px-1">POST /api/backfill</code>{" "}
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
        <h2 className="serif-title text-[22px]">About {SITE_NAME}</h2>
        <p className="post-body mt-3">
          {SITE_NAME} is a reading and discussion community for PL R&D and its
          collaborators, built on the AT Protocol. Instead of locking content into a
          private database, every post, comment, vote, and reaction here is a
          record in the author’s own data repository (PDS), published with the
          open <code className="rounded bg-grey-100 px-1 text-[13px]">site.standard.*</code>{" "}
          lexicons. Sign in with your email or Bluesky handle and you can write posts,
          comment, and vote. The records stay yours, portable to any other
          ATProto app.
        </p>
        <p className="post-body mt-3">
          The site itself is only an index over the ATProto network. It watches
          the firehose and aggregates public records from authors who post here
          or who have been backfilled by an administrator. Delete a record at
          the source PDS and it disappears from this index too; your identity
          is your decentralized identifier (DID), so there is no separate
          forum password to manage.
        </p>
        <h2 className="serif-title mt-8 text-[22px]">How the forum works</h2>
        <p className="post-body mt-3">
          Karma is positive-only and equals the number of recommend records on
          a post. There is no downvoting, in keeping with the LessWrong
          tradition of rewarding good-faith writing. Comments thread through
          parent links, and reactions are short-form comments with named
          labels like “Agreed”, “Insightful”, or “Confusing”, rendered with
          LessWrong’s reaction icons.
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
          “Agreed” or “Insightful”, in the LessWrong tradition.
        </p>
        <h3 className="serif-title mt-6 text-[17px]">For agents and developers</h3>
        <p className="text-[15.08px] leading-[1.55] text-text-dim2">
          {SITE_NAME} is deliberately machine-readable. Every page can be fetched as
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
