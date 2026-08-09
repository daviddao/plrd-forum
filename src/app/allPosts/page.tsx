import { getFrontpagePosts, type PostListItem } from "@/lib/queries";
import { PostsItem } from "@/components/PostsItem";

export const dynamic = "force-dynamic";
export const metadata = { title: "All Posts" };

/**
 * Port of ForumMagnum's AllPostsPage with daily PostsTimeBlocks:
 * serif sticky date titles ("Fri, Aug 8th 2025"), post rows grouped
 * per day, dim "No posts" for gap days is skipped (hideIfEmpty).
 */
export default async function AllPostsPage() {
  const posts = await getFrontpagePosts(1000);

  // group by calendar day, newest first
  const groups = new Map<string, PostListItem[]>();
  for (const post of posts) {
    const d = post.publishedAt ? new Date(post.publishedAt) : null;
    const key =
      d && !Number.isNaN(d.getTime())
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        : "unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(post);
  }
  const sortedKeys = [...groups.keys()].sort().reverse();

  return (
    <div>
      <div className="section-title">
        <h1>All Posts</h1>
      </div>

      {sortedKeys.map((key) => (
        <section key={key} className="mb-8">
          <h2 className="time-block-title">{dayTitle(key)}</h2>
          <div style={{ boxShadow: "0 1px 5px rgba(0,0,0,.025)" }}>
            {groups.get(key)!.map((post) => (
              <PostsItem key={post.uri} post={post} />
            ))}
          </div>
        </section>
      ))}

      {posts.length === 0 && (
        <p className="ml-6 text-[15px] text-text-dim">No posts have been indexed yet.</p>
      )}
    </div>
  );
}

/** LW daily timeBlock title format: "Fri, Aug 8th 2025" */
function dayTitle(key: string): string {
  if (key === "unknown") return "Undated";
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${weekday}, ${month} ${ordinal(d)} ${y}`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
