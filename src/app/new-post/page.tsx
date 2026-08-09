"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

/**
 * Port of LessWrong's /editPost form: display3 ETBook title textarea
 * ("Post title" placeholder, LW_POST_TITLE_FONT_SIZE), airy 110/96 margins,
 * serif body with a CKEditor-style formatting toolbar, and the PostSubmit
 * row (grey CANCEL + green PUBLISH text buttons, right-aligned).
 */
export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const titleRef = useRef<HTMLTextAreaElement | null>(null);

  const autogrow = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  /** wrap the current selection (or insert at cursor) with markdown markers */
  const applyFormat = useCallback(
    (kind: "bold" | "italic" | "link" | "h1" | "h2" | "quote" | "code" | "ul" | "ol" | "hr") => {
      const el = bodyRef.current;
      if (!el) return;
      const { selectionStart: start, selectionEnd: end, value } = el;
      const selected = value.slice(start, end);
      let insert = "";
      let cursorOffset = 0;

      const linePrefix = (prefix: string) => {
        const lineStart = value.lastIndexOf("\n", start - 1) + 1;
        const before = value.slice(0, lineStart);
        const after = value.slice(lineStart);
        return { next: before + prefix + after, pos: end + prefix.length };
      };

      switch (kind) {
        case "bold":
          insert = `**${selected || "bold text"}**`;
          cursorOffset = selected ? insert.length : 2;
          break;
        case "italic":
          insert = `*${selected || "italic text"}*`;
          cursorOffset = selected ? insert.length : 1;
          break;
        case "code":
          insert = selected.includes("\n")
            ? `\`\`\`\n${selected || "code"}\n\`\`\``
            : `\`${selected || "code"}\``;
          cursorOffset = insert.length;
          break;
        case "link":
          insert = `[${selected || "link text"}](https://)`;
          cursorOffset = insert.length - 1;
          break;
        case "hr":
          insert = `\n\n---\n\n`;
          cursorOffset = insert.length;
          break;
        case "h1": {
          const { next, pos } = linePrefix("# ");
          setMarkdown(next);
          requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(pos, pos);
            autogrow(el);
          });
          return;
        }
        case "h2": {
          const { next, pos } = linePrefix("## ");
          setMarkdown(next);
          requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(pos, pos);
            autogrow(el);
          });
          return;
        }
        case "quote": {
          const { next, pos } = linePrefix("> ");
          setMarkdown(next);
          requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(pos, pos);
            autogrow(el);
          });
          return;
        }
        case "ul": {
          const { next, pos } = linePrefix("- ");
          setMarkdown(next);
          requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(pos, pos);
            autogrow(el);
          });
          return;
        }
        case "ol": {
          const { next, pos } = linePrefix("1. ");
          setMarkdown(next);
          requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(pos, pos);
            autogrow(el);
          });
          return;
        }
      }

      const next = value.slice(0, start) + insert + value.slice(end);
      setMarkdown(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + cursorOffset;
        el.setSelectionRange(pos, pos);
        autogrow(el);
      });
    },
    [],
  );

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
      {/* Title — EditTitle: marginTop 110, marginBottom 96 */}
      <textarea
        ref={titleRef}
        value={title}
        onChange={(e) => {
          setTitle(e.target.value.replace(/\n/g, ""));
          autogrow(e.target);
        }}
        placeholder="Post title"
        rows={1}
        className="edit-title"
        style={{ marginTop: 110, marginBottom: 96 }}
        autoFocus
      />

      {/* CKEditor-style toolbar */}
      <div className="mb-6">
        <div className="editor-toolbar">
          <button onClick={() => applyFormat("bold")} title="Bold" style={{ fontWeight: 700 }}>
            B
          </button>
          <button onClick={() => applyFormat("italic")} title="Italic" style={{ fontStyle: "italic" }}>
            I
          </button>
          <span className="divider" />
          <button onClick={() => applyFormat("link")} title="Link">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
            </svg>
          </button>
          <span className="divider" />
          <button onClick={() => applyFormat("h1")} title="Heading 1" style={{ fontSize: 14, fontWeight: 600 }}>
            H1
          </button>
          <button onClick={() => applyFormat("h2")} title="Heading 2" style={{ fontSize: 12.5, fontWeight: 600 }}>
            H2
          </button>
          <span className="divider" />
          <button onClick={() => applyFormat("quote")} title="Blockquote" style={{ fontSize: 19 }}>
            &ldquo;
          </button>
          <button onClick={() => applyFormat("code")} title="Code" style={{ fontFamily: "var(--lw-f-mono)", fontSize: 12 }}>
            {"</>"}
          </button>
          <span className="divider" />
          <button onClick={() => applyFormat("ul")} title="Bulleted list">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
            </svg>
          </button>
          <button onClick={() => applyFormat("ol")} title="Numbered list">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
            </svg>
          </button>
          <button onClick={() => applyFormat("hr")} title="Horizontal rule">
            —
          </button>
        </div>
      </div>

      {/* Body */}
      <textarea
        ref={bodyRef}
        value={markdown}
        onChange={(e) => {
          setMarkdown(e.target.value);
          autogrow(e.target);
        }}
        placeholder="Start writing — or paste markdown. Published to your PDS as a pub.leaflet.document."
        className="edit-body"
      />

      {/* PostSubmit row */}
      <div className="editor-submit-row">
        {error && <span className="text-[14px] text-error">{error}</span>}
        <div className="editor-submit-buttons">
          <button className="editor-button secondary" onClick={() => router.back()}>
            Cancel
          </button>
          <button
            className="editor-button submit"
            onClick={submit}
            disabled={busy || !title.trim() || !markdown.trim()}
          >
            {busy ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
