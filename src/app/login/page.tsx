import { Suspense } from "react";

export const metadata = { title: "Log In" };

function LoginForm({ error }: { error?: string }) {
  return (
    <div className="mx-auto mt-12 max-w-[400px]">
      <div className="lw-card px-8 py-10">
        <h1 className="serif-title pb-1 text-[26px]">Log In</h1>
        <p className="pb-6 text-[14px] text-text-dim3">
          Sign in with your ATProto account (e.g. a Bluesky handle). Your posts
          and comments are stored in <em>your</em> repo as{" "}
          <code className="rounded bg-grey-100 px-1 text-[12px]">pub.leaflet.*</code>{" "}
          records.
        </p>
        {error && (
          <p className="pb-4 text-[13.5px] text-error">
            {error === "resolve"
              ? "Couldn't resolve that handle. Check the spelling and try again."
              : error === "callback"
                ? "Authorization failed. Please try again."
                : "Please enter your handle."}
          </p>
        )}
        <form action="/oauth/login" method="post" className="flex flex-col gap-3">
          <input
            type="text"
            name="handle"
            placeholder="you.bsky.social"
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            className="rounded-sm border border-grey-300 bg-transparent px-3 py-2 text-[15px] outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-sm bg-primary px-4 py-2 text-[13.5px] font-semibold uppercase tracking-wide text-white hover:opacity-90"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <Suspense>
      <LoginForm error={error} />
    </Suspense>
  );
}
