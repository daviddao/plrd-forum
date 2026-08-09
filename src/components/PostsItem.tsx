"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PostListItem } from "@/lib/queries";
import { timeAgo, fullDateTime, authorName, readingTime } from "@/lib/format";
import { Tooltip } from "./Tooltip";
import { UserTooltip } from "./UserTooltip";
import { PostPreview } from "./PostPreview";

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
          <UserTooltip did={post.did} name={authorName(post.author, post.did)}>
            <Link
              href={userHref}
              className="posts-item-meta mr-3 max-w-[180px]"
              onClick={(e) => e.stopPropagation()}
            >
              {authorName(post.author, post.did)}
            </Link>
          </UserTooltip>
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


