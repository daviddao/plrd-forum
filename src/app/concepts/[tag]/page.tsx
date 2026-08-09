import { getPostsByTag } from "@/lib/queries";
import { PostsItem } from "@/components/PostsItem";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Params = { tag: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { tag } = await params;
  return { title: decodeURIComponent(tag) };
}

export default async function ConceptPage({ params }: { params: Promise<Params> }) {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag);
  const posts = await getPostsByTag(tag);

  return (
    <div>
      <div className="section-title">
        <h1>{tag}</h1>
      </div>
      <p className="mb-4 text-[14.3px] text-text-dim3">
        {posts.length} {posts.length === 1 ? "post" : "posts"} tagged{" "}
        <em>{tag}</em>
      </p>
      <div>
        {posts.map((post) => (
          <PostsItem key={post.uri} post={post} />
        ))}
      </div>
    </div>
  );
}
