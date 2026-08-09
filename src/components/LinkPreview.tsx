"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Tooltip } from "./Tooltip";
import { PostPreview } from "./PostPreview";
import type { PostListItem } from "@/lib/queries";

/**
 * Link hover previews for post/comment bodies:
 *  - links resolving to an indexed post (internal /posts/… or
 *    standard.site publication permalinks like
 *    https://dholms.leaflet.pub/3mnkrxp7rt22i) → the LWPostsPreviewTooltip
 *    card, same as the posts-list hover
 *  - any other http(s) link → a website preview card built from the
 *    page's Open Graph metadata (image, title, description, domain)
 *  - non-http links (mailto:, #fragment) → the URL in the dark tooltip
 *
 * All data loads lazily on first hover via /api/link-preview.
 */

type PostData = PostListItem & { kind: "post"; href: string };
type WebsiteData = {
  kind: "website";
  url: string;
  domain: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};
type PreviewData = PostData | WebsiteData;
type PreviewState = PreviewData | "loading" | "none";

const previewCache = new Map<string, PreviewData | null>();

function WebsitePreview({ site }: { site: WebsiteData }) {
  return (
    <div className="website-preview">
      {site.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={site.image} alt="" className="website-preview-image" />
      )}
      <div className="website-preview-body">
        <div className="website-preview-domain">{site.siteName ?? site.domain}</div>
        {site.title && <div className="website-preview-title">{site.title}</div>}
        {site.description && (
          <div className="website-preview-desc">{site.description}</div>
        )}
      </div>
    </div>
  );
}

function PreviewCard({ href }: { href: string }) {
  const cached = previewCache.get(href);
  const [state, setState] = useState<PreviewState>(
    cached ? cached : cached === null ? "none" : "loading",
  );

  useEffect(() => {
    if (state !== "loading") return;
    let cancelled = false;
    fetch(`/api/link-preview?url=${encodeURIComponent(href)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: PreviewData | null) => {
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

  if (state === "loading") return <div className="user-tooltip-loading">Loading…</div>;
  if (state === "none") return <div className="user-tooltip-loading">{href}</div>;
  if (state.kind === "post") return <PostPreview post={state} />;
  return <WebsitePreview site={state} />;
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

  const previewable = external || href.startsWith("/");
  if (!previewable) {
    return (
      <Tooltip title={href} placement="bottom-start" delay={400}>
        <a href={href}>{children}</a>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      title={<PreviewCard href={href} />}
      variant="card"
      delay={400}
      placement="bottom-start"
    >
      <a href={href} {...anchorProps}>
        {children}
      </a>
    </Tooltip>
  );
}
