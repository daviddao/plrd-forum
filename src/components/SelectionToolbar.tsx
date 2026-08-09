"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { QuotePosition } from "@/lib/leaflet/types";

export type QuoteSelection = {
  text: string;
  start: QuotePosition;
  end: QuotePosition;
};

const REACTIONS = ["👍", "❤️", "💡", "🎯", "❓"];

/**
 * LW-style selection popup: highlight text in the post body and get a
 * "Comment" (quote-in-comment) action plus inline reactions. Quotes are
 * anchored with pub.leaflet.comment#linearDocumentQuote positions
 * (block index path + character offset), the leaflet-native equivalent
 * of LessWrong side-comments.
 */
export function SelectionToolbar({
  subject,
  loggedIn,
  children,
}: {
  subject: string;
  loggedIn: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<{
    quote: QuoteSelection;
    top: number;
    left: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const readSelection = useCallback(() => {
    const container = containerRef.current;
    const sel = window.getSelection();
    if (!container || !sel || sel.rangeCount === 0 || sel.isCollapsed) {
      setState(null);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) {
      setState(null);
      return;
    }
    const text = range.toString().trim();
    if (!text) {
      setState(null);
      return;
    }

    const start = positionFor(range.startContainer, range.startOffset);
    const end = positionFor(range.endContainer, range.endOffset);
    if (!start || !end) {
      setState(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    setState({
      quote: { text: text.slice(0, 1000), start, end },
      top: rect.top - 44,
      left: Math.max(8, rect.left + rect.width / 2 - 90),
    });
  }, []);

  useEffect(() => {
    const onMouseUp = () => setTimeout(readSelection, 10);
    const onSelectionChange = () => {
      if (window.getSelection()?.isCollapsed) setState(null);
    };
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("selectionchange", onSelectionChange);
    const onScroll = () => setState(null);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("selectionchange", onSelectionChange);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [readSelection]);

  const quoteInComment = () => {
    if (!state) return;
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    window.dispatchEvent(new CustomEvent("plrd-quote", { detail: state.quote }));
    setState(null);
    window.getSelection()?.removeAllRanges();
    document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" });
  };

  const react = async (emoji: string) => {
    if (!state || busy) return;
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    setBusy(true);
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, text: emoji, quote: state.quote }),
    });
    setBusy(false);
    setState(null);
    window.getSelection()?.removeAllRanges();
    router.refresh();
  };

  return (
    <div ref={containerRef} className="relative">
      {children}
      {state && (
        <div
          className="selection-toolbar"
          style={{ position: "fixed", top: state.top, left: state.left, zIndex: 1200 }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button className="selection-toolbar-button" onClick={quoteInComment} title="Quote in a new comment">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z" />
            </svg>
            Comment
          </button>
          <span className="selection-toolbar-divider" />
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              className="selection-toolbar-react"
              onClick={() => react(emoji)}
              disabled={busy}
              title={`React with ${emoji} (posts a quote-anchored comment)`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Map a DOM position to a linearDocument quote position:
 * block = [pageIdx-relative block index], offset = char offset into the
 * block's visible text.
 */
function positionFor(node: Node, offset: number): QuotePosition | null {
  const el = node instanceof Element ? node : node.parentElement;
  const blockEl = el?.closest("[data-block-idx]");
  if (!blockEl) return null;
  const blockIdx = Number(blockEl.getAttribute("data-block-idx"));
  if (Number.isNaN(blockIdx)) return null;

  // char offset: walk text nodes inside the block until we reach `node`
  let chars = 0;
  const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT);
  let current: Node | null = walker.nextNode();
  while (current) {
    if (current === node) {
      return { block: [blockIdx], offset: chars + offset };
    }
    chars += current.textContent?.length ?? 0;
    current = walker.nextNode();
  }
  // selection anchored on an element node
  return { block: [blockIdx], offset: chars };
}
