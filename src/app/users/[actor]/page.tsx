import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveHandleToDid, getProfile, parseAtUri } from "@/lib/atproto/resolve";
import { getUserContent } from "@/lib/queries";
import { PostsItem } from "@/components/PostsItem";
import { timeAgo, authorName } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { actor: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { actor } = await params;
  return { title: decodeURIComponent(actor) };
}

export default async function UserPage({ params }: { params: Promise<Params> }) {
  const { actor: rawActor } = await params;
  const actor = decodeURIComponent(rawActor);
  const did = await resolveHandleToDid(actor);
  if (!did) notFound();
  const profile = await getProfile(did);
  const { posts, comments, karma } = await getUserContent(did);

  const name = authorName(profile, did);

  return (
    <div className="mx-auto max-w-[720px]">
      {/* user header, LW-style */}
      <div className="pb-6">
        <div className="flex items-center gap-4">
          {profile?.avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar} alt="" className="h-14 w-14 rounded-full" />
          )}
          <div>
            <h1 className="serif-title text-[30px] leading-tight">{name}</h1>
            <div className="flex items-center gap-3 text-[13.5px] text-text-dim3">
              {profile?.handle && (
                <a
                  href={`https://bsky.app/profile/${profile.handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-text"
                >
                  @{profile.handle}
                </a>
              )}
              <span title="Total recommends across posts and comments">{karma} karma</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="section-title pb-3 text-[20px]">Posts</h2>
      {posts.length === 0 ? (
        <p className="pb-6 text-[14px] text-text-dim3">No posts indexed.</p>
      ) : (
        <div className="pb-8">
          {posts.map((post) => (
            <PostsItem key={post.uri} post={{ ...post, author: profile }} />
          ))}
        </div>
      )}

      <h2 className="section-title pb-3 text-[20px]">Recent Comments</h2>
      {comments.length === 0 ? (
        <p className="text-[14px] text-text-dim3">No comments indexed.</p>
      ) : (
        <div>
          {comments.map((c) => {
            const target = parseAtUri(c.subject);
            const href = target ? `/posts/${target.did}/${target.rkey}` : "#";
            return (
              <div key={c.uri} className="lw-card mb-0.5 px-3 py-2">
                <div className="pb-1 text-[12.5px] text-text-dim4">
                  <Link href={href} className="hover:text-text">
                    on a post
                  </Link>{" "}
                  · <span title={c.createdAt}>{timeAgo(c.createdAt)}</span>
                </div>
                <div className="comment-body line-clamp-3">{c.plaintext}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
