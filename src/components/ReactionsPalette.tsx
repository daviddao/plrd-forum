"use client";

import React, { useMemo, useState } from "react";
import {
  reactions,
  paletteSections,
  getReaction,
  type ReactionType,
} from "@/lib/reactions";
import { Tooltip } from "./Tooltip";

/** Reaction icon with the react's ForumMagnum display filter applied. */
export function ReactionIcon({ reaction, size = 22 }: { reaction: ReactionType; size?: number }) {
  const f = reaction.filter ?? {};
  const pad = f.padding ? Math.max(0, f.padding) : 0;
  const transforms: string[] = [];
  if (f.scale) transforms.push(`scale(${f.scale})`);
  if (f.translateX) transforms.push(`translateX(${f.translateX}px)`);
  if (f.translateY) transforms.push(`translateY(${f.translateY}px)`);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={reaction.svg}
      alt={reaction.label}
      width={size}
      height={size}
      className="reaction-img"
      style={{
        padding: pad,
        filter: `opacity(${f.opacity ?? 1}) saturate(${f.saturate ?? 1})`,
        transform: transforms.length ? transforms.join(" ") : undefined,
      }}
      draggable={false}
    />
  );
}

/**
 * Port of ForumMagnum's ReactionsPalette: search box + curated icon grid
 * (primary row, emotions, argument/quality sections, likelihoods).
 */
export function ReactionsPalette({ onPick }: { onPick: (reaction: ReactionType) => void }) {
  const [search, setSearch] = useState("");

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return reactions.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q) ||
        r.searchTerms.some((t) => t.toLowerCase().includes(q)),
    );
  }, [search]);

  return (
    <div className="reactions-palette">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search reactions…"
        className="reactions-palette-search"
        autoFocus
      />

      {matches ? (
        <div className="reactions-palette-grid">
          {matches.map((r) => (
            <ReactButton key={r.name} reaction={r} onPick={onPick} />
          ))}
          {matches.length === 0 && (
            <span className="px-1 py-2 text-[13px] text-text-dim4">No matching reactions</span>
          )}
        </div>
      ) : (
        paletteSections.map((section, i) => (
          <div key={i}>
            {section.title && <div className="reactions-palette-section">{section.title}</div>}
            <div className="reactions-palette-grid">
              {section.names.map((name) => {
                const r = getReaction(name);
                return r ? <ReactButton key={name} reaction={r} onPick={onPick} /> : null;
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ReactButton({
  reaction,
  onPick,
}: {
  reaction: ReactionType;
  onPick: (reaction: ReactionType) => void;
}) {
  return (
    <Tooltip
      title={
        <span>
          <b>{reaction.label}</b>
          {reaction.description && reaction.description !== reaction.label && (
            <>
              <br />
              {reaction.description}
            </>
          )}
        </span>
      }
      placement="bottom"
    >
      <button className="reactions-palette-button" onClick={() => onPick(reaction)}>
        <ReactionIcon reaction={reaction} size={22} />
      </button>
    </Tooltip>
  );
}
