"use client";

import Link from "next/link";
import { useState } from "react";
import type { CommentNode } from "@/lib/queries";
import { RichText } from "@/lib/leaflet/richtext";
import type { Facet } from "@/lib/leaflet/types";
import { timeAgo, fullDateTime, authorName } from "@/lib/format";
import { Vote } from "./Vote";
import { Tooltip } from "./Tooltip";
import { CommentForm } from "./CommentForm";
import { reactionsByLabel } from "@/lib/reactions";
import { ReactionIcon } from "./ReactionsPalette";

/**
 * Port of ForumMagnum's CommentsNode / CommentsItem: bordered comment frames
 * (1px rgba(72,94,144,.16)), nested children indented 8px with the right
 * border removed, meta row with collapse [-], username (600), date + karma.
 */
export function CommentItem({
  node,
  subject,
  loggedIn,
  myVotes,
  depth = 0,
}: {
  node: CommentNode;
  subject: string;
  loggedIn: boolean;
  myVotes: string[];
  depth?: number;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);

  return (
    <div className="comment-node">
      <div className="comment-inner">
        <div className="comment-meta">
          <span
            onClick={() => setCollapsed(!collapsed)}
            className="cursor-pointer font-mono text-[11px] opacity-80 hover:opacity-100"
          >
            [{collapsed ? "+" : "–"}]
          </span>
          <Link
            href={`/users/${node.author?.handle ?? node.did}`}
            className="comment-username no-underline"
          >
            {authorName(node.author, node.did)}
          </Link>
          <Tooltip title={fullDateTime(node.createdAt)} placement="bottom">
            <span className="cursor-default">{timeAgo(node.createdAt)}</span>
          </Tooltip>
          <Vote
            subject={node.uri}
            karma={node.karma}
            voted={myVotes.includes(node.uri)}
            loggedIn={loggedIn}
            size="small"
          />
        </div>

        {!collapsed && (
          <>
            {node.quotedText && (
              <div className="comment-quote" title="Quoted from the post">
                {node.quotedText.length > 240
                  ? node.quotedText.slice(0, 240) + "\u2026"
                  : node.quotedText}
              </div>
            )}
            {(() => {
              // quote-anchored comment whose text is a react label → render as a react chip
              const react = node.quotedText
                ? reactionsByLabel.get(node.plaintext.trim().toLowerCase())
                : undefined;
              if (react) {
                return (
                  <div className="pb-1">
                    <span className="reaction-chip" title={react.description}>
                      <ReactionIcon reaction={react} size={16} />
                      {react.label}
                    </span>
                  </div>
                );
              }
              return (
                <div className="comment-body">
                  <p>
                    <RichText text={node.plaintext} facets={node.facets as Facet[] | null} />
                  </p>
                </div>
              );
            })()}
            <div className="pt-1.5 pb-1">
              <span className="comment-reply-link" onClick={() => setReplying(!replying)}>
                Reply
              </span>
            </div>
          </>
        )}
      </div>

      {replying && !collapsed && (
        <div className="px-3 pb-2">
          <CommentForm
            subject={subject}
            parent={node.uri}
            loggedIn={loggedIn}
            autoFocus
            onDone={() => setReplying(false)}
          />
        </div>
      )}

      {!collapsed &&
        node.children.map((child) => (
          <CommentItem
            key={child.uri}
            node={child}
            subject={subject}
            loggedIn={loggedIn}
            myVotes={myVotes}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}
