import { getSessionDid } from "@/lib/auth/session";
import { getProfile } from "@/lib/atproto/resolve";
import { authorName } from "@/lib/format";
import { PostEditor } from "@/components/PostEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Post" };

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const did = await getSessionDid();
  const profile = did ? await getProfile(did) : null;
  const { preview } = await searchParams;

  return (
    <PostEditor
      loggedIn={!!did || preview === "1"}
      authorName={did ? authorName(profile, did) : null}
    />
  );
}
