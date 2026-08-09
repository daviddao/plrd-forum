"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Tooltip } from "./Tooltip";
import { PostPreview } from "./PostPreview";
import type { PostListItem } from "@/lib/queries";

/**
 * Port of ForumMagnum's link hover previews (HoverPreviewLink /
 * PostLinkPreview / DefaultPreview):
 *  - links that resolve to an indexed post — internal /posts/… links and
 *    standard.site publication permalinks like
 *    https://dholms.leaflet.pub/3mqtqvjidqs2p — get the full
 *    LWPostsPreviewTooltip card (same card as the posts-list hover)
 *  - every other link gets LW's DefaultPreview: the plain URL in the
 *    dark MuiTooltip bubble, so you always know where a link goes
 *
 * Post data loads lazily when the card first opens, via /api/link-preview.
 */

type PreviewState = PostListItem | "loading" | "none";

const previewCache = new Map<string, PostListItem | null>();

/** Cheap syntactic check: could this link possibly be a post? */
function isPostLinkCandidate(href: string): boolean {
  if (/^\/posts\//.test(href)) return true;
  try {
    const u = new URL(href, "https://x.invalid");
    if (/^\/posts\//.test(u.pathname)) return true;
    // bare-TID path on some host — standard.site publication permalink shape
    if (/^\/[a-z2-7]{13}\/?$/.test(u.pathname)) return true;
  } catch {
    // not a URL — plain fragment etc.
  }
  return false;
}

function PostCard({ href }: { href: string }) {
  const cached = previewCache.get(href);
  const [state, setState] = useState<PreviewState>(
    cached ? cached : cached === null ? "none" : "loading",
  );

  useEffect(() => {
    if (state !== "loading") return;
    let cancelled = false;
    fetch(`/api/link-preview?url=${encodeURIComponent(href)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: PostListItem | null) => {
        if (cancelled) return;
        previewCache.set(href, d);
        setState(d ?? "none");
      })
      .catch(() => {
        if (!cancelled) setState("none");
      });
    return () => {
      cancelled = true;
    };
  }, [href, state]);

  if (state === "loading")
    return <div className="user-tooltip-loading">Loading…</div>;
  if (state === "none")
    return <div className="user-tooltip-loading">{href}</div>;
  return <PostPreview post={state} />;
}

export function LinkPreview({
  href,
  external,
  children,
}: {
  href: string;
  external: boolean;
  children: ReactNode;
}) {
  const anchorProps = external
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};

  if (isPostLinkCandidate(href)) {
    return (
      <Tooltip title={<PostCard href={href} />} variant="card" delay={400} placement="bottom-start">
        <a href={href} {...anchorProps}>
          {children}
        </a>
      </Tooltip>
    );
  }

  // DefaultPreview: the URL in the standard dark tooltip
  return (
    <Tooltip title={href} placement="bottom-start" delay={400}>
      <a href={href} {...anchorProps}>
        {children}
      </a>
    </Tooltip>
  );
}
