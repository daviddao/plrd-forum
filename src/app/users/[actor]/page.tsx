import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { resolveHandleToDid, getProfile, parseAtUri } from "@/lib/atproto/resolve";
import { getUserContent } from "@/lib/queries";
import { PostsItem } from "@/components/PostsItem";
import { LibraryCard } from "@/components/LibraryCard";
import { Tooltip } from "@/components/Tooltip";
import { timeAgo, authorName } from "@/lib/format";
import { RichText } from "@/lib/leaflet/richtext";
import type { Facet } from "@/lib/leaflet/types";

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

/**
 * Port of ForumMagnum's UsersProfile (e.g. lesswrong.com/users/raemon):
 * display3 username title, bullet-separated lwTertiary meta row with
 * icon stats (karma ★, posts, comments, edits ✎), bio, then sections:
 * Sequences (→ publications), Posts, Comments.
 */
export default async function UserPage({ params }: { params: Promise<Params> }) {
  const { actor: rawActor } = await params;
  const actor = decodeURIComponent(rawActor);
  const did = await resolveHandleToDid(actor);
  if (!did) notFound();
  const profile = await getProfile(did);
  const { posts, comments, publications, karma, tagCount } = await getUserContent(did);

  const name = authorName(profile, did);

  return (
    <div className="pt-6">
      {/* ── Bio section ── */}
      <section className="mb-8">
        <h1 className="profile-username">{name}</h1>

        <div className="profile-userinfo">
          <span className="profile-meta">
            <Tooltip title={`${karma} karma`} placement="bottom">
              <span className="profile-meta-item">
                <StarIcon />
                {karma}
              </span>
            </Tooltip>
            <Tooltip title={`${posts.length} posts`} placement="bottom">
              <span className="profile-meta-item">
                <DescriptionIcon />
                {posts.length}
              </span>
            </Tooltip>
            <Tooltip title={`${comments.length} comments`} placement="bottom">
              <span className="profile-meta-item">
                <MessageIcon />
                {comments.length}
              </span>
            </Tooltip>
            <Tooltip title={`${tagCount} tag${tagCount === 1 ? "" : "s"}`} placement="bottom">
              <span className="profile-meta-item">
                <PencilIcon />
                {tagCount}
              </span>
            </Tooltip>
          </span>
          {profile?.handle && (
            <a
              href={`https://bsky.app/profile/${profile.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline"
              style={{ color: "inherit" }}
            >
              @{profile.handle}
            </a>
          )}
          {profile?.did && (
            <a
              href={`https://pdsls.dev/at/${profile.did}`}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline"
              style={{ color: "inherit" }}
            >
              PDS
            </a>
          )}
        </div>

        {profile?.description && (
          <div className="post-body mt-6 max-w-[620px] whitespace-pre-line text-[16.5px]">
            {profile.description}
          </div>
        )}
      </section>

      {/* ── Sequences section (publications) ── */}
      {publications.length > 0 && (
        <section className="mb-8">
          <div className="section-title">
            <h2>Sequences</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {publications.map((pub) => (
              <LibraryCard key={pub.uri} pub={pub} />
            ))}
          </div>
        </section>
      )}

      {/* ── Posts section ── */}
      <section className="mb-8">
        <div className="section-title">
          <h2>Posts</h2>
          <span className="text-[14.3px] text-text-dim3">
            Sorted by <span className="font-semibold">New</span>
          </span>
        </div>
        {posts.length === 0 ? (
          <p className="text-[14.3px] text-text-dim3">No posts to display.</p>
        ) : (
          <div>
            {posts.map((post) => (
              <PostsItem key={post.uri} post={{ ...post, author: profile }} showAuthor={false} />
            ))}
          </div>
        )}
      </section>

      {/* ── Comments section ── */}
      <section>
        <div className="section-title">
          <h2>Comments</h2>
        </div>
        {comments.length === 0 ? (
          <p className="text-[14.3px] text-text-dim3">No comments to display.</p>
        ) : (
          comments.map((c) => {
            const target = parseAtUri(c.subject);
            const href = target ? `/posts/${target.did}/${target.rkey}` : "#";
            return (
              <div key={c.uri} className="comment-node">
                <div className="comment-inner">
                  <div className="comment-meta">
                    <Link href={href} className="font-semibold text-text-dim no-underline hover:text-text">
                      {c.postTitle ?? "a post"}
                    </Link>
                    <Tooltip title={c.createdAt} placement="bottom">
                      <span className="cursor-default">{timeAgo(c.createdAt)}</span>
                    </Tooltip>
                    <span title={`${c.karma} recommends`}>{c.karma} karma</span>
                  </div>
                  {c.quotedText && (
                    <div className="comment-quote">
                      {c.quotedText.length > 200 ? c.quotedText.slice(0, 200) + "…" : c.quotedText}
                    </div>
                  )}
                  <div className="comment-body pb-2">
                    <p>
                      <RichText
                        text={c.plaintext}
                        facets={c.facets ? (JSON.parse(c.facets as string) as Facet[]) : null}
                      />
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

/* MUI icons used by UsersProfile's meta row */
function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}
function DescriptionIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    </svg>
  );
}
function MessageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}
