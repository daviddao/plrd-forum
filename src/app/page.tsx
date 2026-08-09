import Link from "next/link";
import { getFrontpagePosts } from "@/lib/queries";
import { PostsItem } from "@/components/PostsItem";
import { WalkingSims } from "@/components/WalkingSims";
import { authorName } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await getFrontpagePosts(50);

  // unique authors walk along the bottom of the page as pixel sims
  const walkers = [...new Set(posts.map((p) => authorName(p.author, p.did)))];

  return (
    <div>
      <WalkingSims names={walkers} />
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
    </div>
  );
}
