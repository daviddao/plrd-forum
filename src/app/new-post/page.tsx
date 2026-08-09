"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim() || !markdown.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, markdown }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(
        res.status === 401
          ? "You need to log in before posting."
          : "Failed to publish the post. Please try again.",
      );
      return;
    }
    const data = (await res.json()) as { did: string; rkey: string };
    router.push(`/posts/${encodeURIComponent(data.did)}/${data.rkey}`);
  };

  return (
    <div className="mx-auto max-w-[682px]">
      <div className="lw-card px-5 py-8 sm:px-12 sm:py-10">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          className="serif-title mb-6 w-full border-none bg-transparent text-[32px] leading-[1.15] text-text outline-none placeholder:text-text-dim4"
        />
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder={
            "Write your post in markdown…\n\n# Headers, **bold**, *italic*, `code`, [links](https://…)\n> blockquotes, - lists, ``` code fences, --- rules"
          }
          rows={20}
          className="post-body w-full resize-y border-none bg-transparent outline-none placeholder:text-text-dim4"
        />
        <div className="flex items-center justify-between border-t border-(--lw-border-faint) pt-4">
          <span className="text-[13px] text-text-dim4">
            Published to your PDS as a{" "}
            <code className="rounded bg-grey-100 px-1 text-[11.5px]">pub.leaflet.document</code>
          </span>
          <div className="flex items-center gap-3">
            {error && <span className="text-[13px] text-error">{error}</span>}
            <button
              onClick={submit}
              disabled={busy || !title.trim() || !markdown.trim()}
              className="cursor-pointer rounded-sm bg-primary px-5 py-2 text-[13.5px] font-semibold uppercase tracking-wide text-white disabled:opacity-40"
            >
              {busy ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
