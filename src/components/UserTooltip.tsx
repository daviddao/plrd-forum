"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Tooltip } from "./Tooltip";

/**
 * Port of ForumMagnum's UsersNameDisplay hover behaviour: wrapping an
 * author name in a PopperCard that shows LWUserTooltipContent — name,
 * UserMetaInfo row (★ karma, post count, comment count), bio and the
 * author's three most recent posts. Data loads on first open via
 * /api/author-card, mirroring LW's useQuery-on-hover.
 */

type CardData = {
  displayName: string | null;
  handle: string | null;
  bio: string | null;
  karma: number;
  postCount: number;
  commentCount: number;
  recentPosts: { title: string; href: string }[];
};

const cardCache = new Map<string, CardData>();

function CardContent({ did, fallbackName }: { did: string; fallbackName: string }) {
  const [data, setData] = useState<CardData | null>(cardCache.get(did) ?? null);

  useEffect(() => {
    if (data) return;
    let cancelled = false;
    fetch(`/api/author-card?did=${encodeURIComponent(did)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: CardData | null) => {
        if (d && !cancelled) {
          cardCache.set(did, d);
          setData(d);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [did, data]);

  if (!data) return <div className="user-tooltip-loading">Loading…</div>;

  return (
    <div className="user-tooltip">
      <div className="user-tooltip-name">{data.displayName || data.handle || fallbackName}</div>
      <div className="user-tooltip-meta">
        {/* UserMetaInfo: ★ karma */}
        <span className="user-tooltip-meta-item" title={`${data.karma} karma`}>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
          {data.karma}
        </span>
        {data.postCount > 0 && (
          <span className="user-tooltip-meta-item" title={`${data.postCount} posts`}>
            {/* DescriptionIcon */}
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
            {data.postCount}
          </span>
        )}
        {data.commentCount > 0 && (
          <span className="user-tooltip-meta-item" title={`${data.commentCount} comments`}>
            {/* MessageIcon */}
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            </svg>
            {data.commentCount}
          </span>
        )}
        {data.handle && <span className="user-tooltip-meta-item">@{data.handle}</span>}
      </div>
      {data.bio && <div className="user-tooltip-bio">{data.bio}</div>}
      {data.recentPosts.length > 0 && (
        <div className="user-tooltip-posts">
          {data.recentPosts.map((p) => (
            <a key={p.href} href={p.href} className="user-tooltip-post">
              {p.title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function UserTooltip({
  did,
  name,
  children,
}: {
  did: string;
  name: string;
  children: ReactNode;
}) {
  return (
    <Tooltip
      title={<CardContent did={did} fallbackName={name} />}
      variant="card"
      placement="bottom-start"
      delay={300}
    >
      {children}
    </Tooltip>
  );
}
