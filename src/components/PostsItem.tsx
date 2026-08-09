"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PostListItem } from "@/lib/queries";
import { timeAgo, fullDateTime, authorName, readingTime } from "@/lib/format";
import { Tooltip } from "./Tooltip";

/**
 * Port of ForumMagnum's LWPostsItem: continuous white rows with 2px hairline
 * separators, karma | title (warnock 16.9px) | author | date | comments bubble,
 * plus the LW hover-preview card and meta tooltips.
 */
export function PostsItem({ post, showAuthor = true }: { post: PostListItem; showAuthor?: boolean }) {
  const router = useRouter();
  const href = `/posts/${post.did}/${post.rkey}`;
  const userHref = `/users/${post.author?.handle ?? post.did}`;

  return (
    <Tooltip
      As="div"
      variant="card"
      delay={400}
      placement="bottom-end"
      title={<PostPreview post={post} />}
    >
      <div className="posts-item">
        <Tooltip title={`${post.karma} ${post.karma === 1 ? "recommend" : "recommends"}`} placement="bottom">
          <span className="posts-item-karma">{post.karma}</span>
        </Tooltip>

        <Link href={href} className="posts-item-title">
          {post.title}
        </Link>

        <span className="posts-item-spacer" />

        {showAuthor && (
          <Link
            href={userHref}
            className="posts-item-meta mr-3 max-w-[180px]"
            onClick={(e) => e.stopPropagation()}
          >
            {authorName(post.author, post.did)}
          </Link>
        )}

        <Tooltip title={fullDateTime(post.publishedAt)} placement="bottom">
          <span className="posts-item-meta mr-3 w-[44px] text-right">
            {timeAgo(post.publishedAt)}
          </span>
        </Tooltip>

        <div
          className="posts-item-comments"
          onClick={() => router.push(`${href}#comments`)}
          title={`${post.commentCount} comments`}
        >
          <svg viewBox="0 0 24 24">
            <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
          </svg>
          <div className="count">{post.commentCount}</div>
        </div>
      </div>
    </Tooltip>
  );
}

/** LWPostsPreviewTooltip: title + italic meta + serif excerpt with fade. */
function PostPreview({ post }: { post: PostListItem }) {
  return (
    <div className="px-3 pt-3">
      <div className="preview-title">{post.title}</div>
      <div className="preview-meta mt-1">
        <span className="truncate">{authorName(post.author, post.did)}</span>
        <span>{post.karma} karma</span>
        {post.wordCount > 0 && <span>{readingTime(post.wordCount)}</span>}
        <span>
          {post.commentCount} comment{post.commentCount === 1 ? "" : "s"}
        </span>
      </div>
      {post.excerpt && (
        <div className="preview-excerpt">
          {post.excerpt.split("\n\n").map((p, i) => (
            <p key={i} className={i > 0 ? "mt-2" : undefined}>
              {p}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
