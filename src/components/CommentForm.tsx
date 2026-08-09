"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CommentForm({
  subject,
  parent,
  loggedIn,
  onDone,
  autoFocus,
}: {
  subject: string;
  parent?: string;
  loggedIn: boolean;
  onDone?: () => void;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, parent, text }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.status === 401 ? "You need to log in to comment." : "Failed to post comment.");
      return;
    }
    setText("");
    onDone?.();
    router.refresh();
  };

  if (!loggedIn) {
    return (
      <div className="comment-body py-2 text-text-dim3">
        <a href="/login" className="text-link">Log in</a> to comment.
      </div>
    );
  }

  return (
    <div className="border border-(--lw-border-std) bg-paper p-2.5">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus={autoFocus}
        placeholder="Write a comment… (**bold**, *italic*, `code`, [links](url))"
        rows={4}
        className="comment-body w-full resize-y border-none bg-transparent outline-none placeholder:text-text-dim4"
      />
      <div className="flex items-center justify-end gap-3 pt-1">
        {error && <span className="text-[13px] text-error">{error}</span>}
        <button
          onClick={submit}
          disabled={busy || !text.trim()}
          className="cursor-pointer rounded-sm bg-primary px-4 py-1.5 text-[13px] font-semibold uppercase tracking-wide text-white disabled:opacity-40"
        >
          {busy ? "Submitting…" : "Submit"}
        </button>
      </div>
    </div>
  );
}
