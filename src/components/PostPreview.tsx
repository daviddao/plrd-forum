import type { PostListItem } from "@/lib/queries";
import { authorName, readingTime } from "@/lib/format";

/** LWPostsPreviewTooltip: title + italic meta + serif excerpt with fade. */
export function PostPreview({ post }: { post: PostListItem }) {
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
