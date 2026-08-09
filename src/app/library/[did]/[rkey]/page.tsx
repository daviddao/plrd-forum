import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublication } from "@/lib/queries";
import { PostsItem } from "@/components/PostsItem";
import { authorName } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { did: string; rkey: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { did, rkey } = await params;
  const pub = await getPublication(decodeURIComponent(did), rkey);
  if (!pub) return {};
  return { title: pub.name, description: pub.description ?? undefined };
}

export default async function PublicationPage({ params }: { params: Promise<Params> }) {
  const { did: rawDid, rkey } = await params;
  const did = decodeURIComponent(rawDid);
  const pub = await getPublication(did, rkey);
  if (!pub) notFound();

  return (
    <div>
      <div className="section-title">
        <h1>{pub.name}</h1>
      </div>
      <div className="mb-1 text-[14.3px] text-text-dim3">
        A publication by{" "}
        <Link
          href={`/users/${pub.author?.handle ?? did}`}
          className="text-text-dim3 underline hover:text-text"
        >
          {authorName(pub.author, did)}
        </Link>
      </div>
      {pub.description && (
        <p className="post-body mb-6 max-w-[620px] text-[16px]">{pub.description}</p>
      )}

      <div className="mt-4">
        {pub.posts.length === 0 ? (
          <p className="text-[14.3px] text-text-dim3">No posts in this publication have been indexed.</p>
        ) : (
          pub.posts.map((post) => <PostsItem key={post.uri} post={post} showAuthor={false} />)
        )}
      </div>
    </div>
  );
}
