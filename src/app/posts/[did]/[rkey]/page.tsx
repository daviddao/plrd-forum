import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPost, getCommentTree, getMyVotes } from "@/lib/queries";
import { getSessionDid } from "@/lib/auth/session";
import { DocumentBody } from "@/lib/leaflet/render";
import { Vote } from "@/components/Vote";
import { CommentItem } from "@/components/CommentItem";
import { CommentForm } from "@/components/CommentForm";
import { fullDate, readingTime, authorName } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { did: string; rkey: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { did, rkey } = await params;
  const post = await getPost(decodeURIComponent(did), rkey);
  if (!post) return {};
  return { title: post.title, description: post.description ?? undefined };
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { did: rawDid, rkey } = await params;
  const did = decodeURIComponent(rawDid);
  const post = await getPost(did, rkey);
  if (!post) notFound();

  const sessionDid = await getSessionDid();
  const comments = await getCommentTree(post.uri);

  const allCommentUris: string[] = [];
  const walk = (nodes: typeof comments) => {
    for (const n of nodes) {
      allCommentUris.push(n.uri);
      walk(n.children);
    }
  };
  walk(comments);
  const myVotes = getMyVotes(sessionDid, [post.uri, ...allCommentUris]);
  const commentCount = allCommentUris.length;

  return (
    <div className="mx-auto max-w-[682px] pt-8">
      <article>
        {/* Title — LWPostsPageHeader: ETBook serif */}
        <h1 className="post-page-title">{post.title}</h1>

        {/* byline */}
        <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-[14.3px] text-text-dim3">
          <Link
            href={`/users/${post.author?.handle ?? did}`}
            className="font-medium text-text-dim3 no-underline hover:text-text"
          >
            {authorName(post.author, did)}
          </Link>
          <span title={post.publishedAt ?? ""}>{fullDate(post.publishedAt)}</span>
          <span>{readingTime(post.wordCount)}</span>
          <Vote
            subject={post.uri}
            karma={post.karma}
            voted={myVotes.has(post.uri)}
            loggedIn={!!sessionDid}
            size="small"
          />
        </div>

        <DocumentBody doc={post.record} did={did} pds={post.author?.pds ?? null} />

        {/* bottom vote, centered like LW */}
        <div className="mt-12 flex items-center justify-center border-t border-(--lw-border-faint) pt-6">
          <Vote
            subject={post.uri}
            karma={post.karma}
            voted={myVotes.has(post.uri)}
            loggedIn={!!sessionDid}
            size="large"
          />
        </div>
      </article>

      {/* comments */}
      <section id="comments" className="mt-10">
        <div className="mb-3 border-b border-(--lw-border-faint) pb-2 text-[15.08px] font-semibold text-text-dim">
          {commentCount} {commentCount === 1 ? "comment" : "comments"}
        </div>
        <div className="mb-6">
          <CommentForm subject={post.uri} loggedIn={!!sessionDid} />
        </div>
        {comments.map((node) => (
          <CommentItem
            key={node.uri}
            node={node}
            subject={post.uri}
            loggedIn={!!sessionDid}
            myVotes={[...myVotes]}
          />
        ))}
      </section>
    </div>
  );
}
