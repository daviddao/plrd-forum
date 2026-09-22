"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { domToPage } from "@/lib/leaflet/serialize";
import { Tooltip } from "./Tooltip";

/**
 * WYSIWYG post editor — port of LessWrong's logged-in /editPost experience:
 * white editing sheet, ETBook "Untitled Draft"-scale title, byline row,
 * contenteditable body with the CKEditor balloon toolbar on selection
 * (Paragraph ▾ | B I S | link | lists | code | divider), '/' slash-command
 * menu, and the floating right-rail with the green publish button.
 * Serializes the DOM to pub.leaflet linearDocument blocks on publish.
 */

const SLASH_ITEMS: { label: string; hint: string; action: string }[] = [
  { label: "Heading 1", hint: "Big section heading", action: "h1" },
  { label: "Heading 2", hint: "Medium section heading", action: "h2" },
  { label: "Heading 3", hint: "Small section heading", action: "h3" },
  { label: "Bulleted List", hint: "Create a simple list", action: "ul" },
  { label: "Numbered List", hint: "Create an ordered list", action: "ol" },
  { label: "Blockquote", hint: "Capture a quote", action: "quote" },
  { label: "Code Block", hint: "Monospaced block", action: "code" },
  { label: "Divider", hint: "Dotted section break", action: "hr" },
];

export function PostEditor({ authorName, loggedIn }: { authorName: string | null; loggedIn: boolean }) {
  const router = useRouter();
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLTextAreaElement | null>(null);
  const [title, setTitle] = useState("");
  const [empty, setEmpty] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // balloon toolbar state
  const [balloon, setBalloon] = useState<{ top: number; left: number } | null>(null);
  // slash menu state
  const [slash, setSlash] = useState<{ top: number; left: number; index: number } | null>(null);
  const slashRef = useRef<typeof slash>(null);
  useEffect(() => {
    slashRef.current = slash;
  }, [slash]);

  useEffect(() => {
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
      document.execCommand("styleWithCSS", false, "false");
    } catch {
      /* older browsers */
    }
    // seed an empty paragraph so typing always lands inside a <p>
    const el = bodyRef.current;
    if (el && !el.innerHTML.trim()) {
      el.innerHTML = "<p><br></p>";
    }
  }, []);

  const ensureParagraph = useCallback(() => {
    const el = bodyRef.current;
    if (el && !el.textContent?.trim() && !el.querySelector("p, h1, h2, h3, blockquote, pre, ul, ol")) {
      el.innerHTML = "<p><br></p>";
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el.firstChild as Node);
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, []);

  const refreshEmpty = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    setEmpty(!el.textContent?.trim());
  }, []);

  // ---- balloon toolbar ----
  const updateBalloon = useCallback(() => {
    const el = bodyRef.current;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setBalloon(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) {
      setBalloon(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    setBalloon({
      top: rect.top - 48,
      left: Math.max(8, rect.left + rect.width / 2 - 190),
    });
  }, []);

  useEffect(() => {
    const onSelChange = () => updateBalloon();
    document.addEventListener("selectionchange", onSelChange);
    const onScroll = () => {
      setBalloon(null);
      setSlash(null);
    };
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("selectionchange", onSelChange);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [updateBalloon]);

  const exec = useCallback(
    (command: string, value?: string) => {
      bodyRef.current?.focus();
      document.execCommand(command, false, value);
      refreshEmpty();
      updateBalloon();
    },
    [refreshEmpty, updateBalloon],
  );

  const applyBlock = useCallback(
    (action: string) => {
      switch (action) {
        case "p": exec("formatBlock", "<p>"); break;
        case "h1": exec("formatBlock", "<h1>"); break;
        case "h2": exec("formatBlock", "<h2>"); break;
        case "h3": exec("formatBlock", "<h3>"); break;
        case "quote": exec("formatBlock", "<blockquote>"); break;
        case "code": exec("formatBlock", "<pre>"); break;
        case "ul": exec("insertUnorderedList"); break;
        case "ol": exec("insertOrderedList"); break;
        case "hr": exec("insertHorizontalRule"); break;
      }
    },
    [exec],
  );

  const insertLink = useCallback(() => {
    const url = window.prompt("Link URL:", "https://");
    if (url && url !== "https://") exec("createLink", url);
  }, [exec]);

  /** block element containing the caret */
  const caretBlock = (): HTMLElement | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node !== bodyRef.current) {
      if (
        node instanceof HTMLElement &&
        /^(P|DIV|H1|H2|H3|H4|H5|H6|BLOCKQUOTE|PRE|LI)$/.test(node.tagName)
      ) {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  };

  // ---- slash commands ----
  const onKeyDown = (e: React.KeyboardEvent) => {
    const menu = slashRef.current;
    if (menu) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setSlash({
          ...menu,
          index:
            (menu.index + (e.key === "ArrowDown" ? 1 : SLASH_ITEMS.length - 1)) % SLASH_ITEMS.length,
        });
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        runSlash(SLASH_ITEMS[menu.index].action);
        return;
      }
      if (e.key === "Escape" || e.key === " ") {
        setSlash(null);
        return;
      }
    }
  };

  const onInput = () => {
    refreshEmpty();
    // open slash menu when a block's content is exactly "/"
    const block = caretBlock();
    if (block && block.textContent === "/") {
      const rect = block.getBoundingClientRect();
      setSlash({ top: rect.bottom + 4, left: rect.left, index: 0 });
    } else if (slashRef.current) {
      setSlash(null);
    }
  };

  const runSlash = (action: string) => {
    const block = caretBlock();
    if (block && block.textContent === "/") {
      // keep a <br> so the block stays selectable, then anchor the caret in it
      block.innerHTML = "<br>";
      const sel = window.getSelection();
      const range = document.createRange();
      range.setStart(block, 0);
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    setSlash(null);
    // next tick so the selection settles before formatBlock runs
    requestAnimationFrame(() => applyBlock(action));
  };

  // ---- publish ----
  const publish = async () => {
    if (busy) return;
    const el = bodyRef.current;
    if (!title.trim() || !el) return;
    const page = domToPage(el);
    if (page.blocks.length === 0) {
      setError("Write something first.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        page,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.status === 401 ? "You need to log in before posting." : "Failed to publish.");
      return;
    }
    const data = (await res.json()) as { did: string; rkey: string };
    router.push(`/posts/${encodeURIComponent(data.did)}/${data.rkey}`);
  };

  if (!loggedIn) {
    return (
      <div className="mx-auto max-w-[682px] pt-24 text-center">
        <p className="post-body">
          <a href="/login" className="text-link">Sign in</a> to write a post.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="editor-sheet" aria-hidden="true" />

      {/* right rail — LW's floating round actions */}
      <div className="editor-rail">
        <Tooltip title={title.trim() ? "Publish post" : "Add a title first"} placement="bottom">
          <button
            className="editor-rail-button publish"
            onClick={publish}
            disabled={busy || !title.trim()}
            aria-label="Publish"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </Tooltip>
        <Tooltip title="Post settings (tags)" placement="bottom">
          <button
            className="editor-rail-button"
            onClick={() => setSettingsOpen((o) => !o)}
            aria-label="Post settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
          </button>
        </Tooltip>
        <Tooltip title="Discard" placement="bottom">
          <button className="editor-rail-button" onClick={() => router.back()} aria-label="Discard">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </Tooltip>
        {settingsOpen && (
          <div className="editor-settings-popover lw-popper-card">
            <label className="mb-1 block text-[12px] font-semibold tracking-wide text-text-dim3 uppercase">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="rationality, ai, world modeling"
              className="w-full border border-grey-300 bg-transparent px-2 py-1.5 text-[13.5px] outline-none focus:border-primary"
            />
            <p className="mt-1.5 text-[11.5px] text-text-dim4">
              Comma-separated — stored on the pub.leaflet.document record.
            </p>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-[682px]">
        {/* title */}
        <textarea
          ref={titleRef}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value.replace(/\n/g, ""));
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          placeholder="Untitled Draft"
          rows={1}
          className="edit-title"
          style={{ marginTop: 90, marginBottom: 6 }}
          autoFocus
        />

        {/* byline row */}
        <div className="editor-byline">
          by <span className="author">{authorName ?? "you"}</span>
          <span className="sep" />
          <span>Draft</span>
          <span className="sep" />
          <button className="linkish" onClick={() => setSettingsOpen(true)}>
            + Tags
          </button>
        </div>

        {/* body */}
        <div
          ref={bodyRef}
          className="post-body edit-surface"
          contentEditable
          suppressContentEditableWarning
          data-empty={empty || undefined}
          onInput={onInput}
          onKeyDown={onKeyDown}
          onFocus={ensureParagraph}
          onBlur={refreshEmpty}
          style={{ marginTop: 70 }}
        />
      </div>

      {error && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-sm bg-error px-4 py-2 text-[14px] text-white shadow-lg">
          {error}
        </div>
      )}

      {/* balloon toolbar */}
      {balloon && (
        <div
          className="balloon-toolbar"
          style={{ position: "fixed", top: balloon.top, left: balloon.left, zIndex: 1250 }}
          onMouseDown={(e) => {
            if ((e.target as Element).tagName !== "SELECT") e.preventDefault();
          }}
        >
          <select
            className="balloon-select"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) applyBlock(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="" disabled>
              Paragraph
            </option>
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="quote">Blockquote</option>
            <option value="code">Code Block</option>
          </select>
          <span className="divider" />
          <button onClick={() => exec("bold")} style={{ fontWeight: 700 }} title="Bold">
            B
          </button>
          <button onClick={() => exec("italic")} style={{ fontStyle: "italic" }} title="Italic">
            I
          </button>
          <button onClick={() => exec("strikeThrough")} style={{ textDecoration: "line-through" }} title="Strikethrough">
            S
          </button>
          <span className="divider" />
          <button onClick={insertLink} title="Link">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
            </svg>
          </button>
          <span className="divider" />
          <button onClick={() => exec("insertUnorderedList")} title="Bulleted list">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
            </svg>
          </button>
          <button onClick={() => exec("insertOrderedList")} title="Numbered list">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
            </svg>
          </button>
          <span className="divider" />
          <button
            onClick={() => exec("formatBlock", "<pre>")}
            title="Code block"
            style={{ fontFamily: "var(--lw-f-mono)", fontSize: 11 }}
          >
            {"</>"}
          </button>
          <button onClick={() => exec("insertHorizontalRule")} title="Divider">
            —
          </button>
        </div>
      )}

      {/* slash command menu */}
      {slash && (
        <div
          className="slash-menu"
          style={{ position: "fixed", top: slash.top, left: slash.left, zIndex: 1250 }}
        >
          {SLASH_ITEMS.map((item, i) => (
            <button
              key={item.action}
              className={`slash-item ${i === slash.index ? "active" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                runSlash(item.action);
              }}
              onMouseEnter={() => setSlash({ ...slash, index: i })}
            >
              <span className="label">{item.label}</span>
              <span className="hint">{item.hint}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
