"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Tooltip } from "./Tooltip";

/**
 * Port of ForumMagnum's OverallVoteAxis: hollow arrow icons (the exact
 * KeyboardArrowUp path LW uses) either side of the score. Backed by
 * pub.leaflet.interactions.recommend (positive-only), so the down arrow
 * retracts your recommend.
 */
export function Vote({
  subject,
  karma,
  voted,
  loggedIn,
  size = "small",
}: {
  subject: string;
  karma: number;
  voted: boolean;
  loggedIn: boolean;
  size?: "large" | "small";
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<{ karma: number; voted: boolean } | null>(null);

  const state = optimistic ?? { karma, voted };

  const toggle = async (dir: "up" | "down") => {
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    if (dir === "up" && state.voted) return;
    if (dir === "down" && !state.voted) return;

    setOptimistic({ karma: state.karma + (state.voted ? -1 : 1), voted: !state.voted });
    await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject }),
    });
    startTransition(() => router.refresh());
  };

  const arrowSize = size === "large" ? 28 : 18;
  const scoreSize = size === "large" ? 20.15 : 14.3;

  return (
    <span className="inline-flex select-none items-center">
      <Tooltip title={state.voted ? "Retract recommend" : "You can only retract your own recommend"} placement="bottom">
        <button
          onClick={() => toggle("down")}
          disabled={!state.voted}
          className="vote-button vote-down"
          style={{ fontSize: arrowSize }}
        >
          <ArrowIcon down />
        </button>
      </Tooltip>
      <Tooltip
        title={`This ${/\/(pub\.leaflet|site\.standard)\.document\//.test(subject) ? "post" : "comment"} has ${state.karma} ${state.karma === 1 ? "recommend" : "recommends"}`}
        placement="bottom"
      >
        <span
          className={`text-center font-medium ${state.voted ? "text-primary" : "text-text-dim"}`}
          style={{ fontSize: scoreSize, minWidth: size === "large" ? 28 : 20, fontFamily: "var(--lw-f-sans)" }}
        >
          {state.karma}
        </span>
      </Tooltip>
      <Tooltip title={state.voted ? "You recommended this" : "Recommend"} placement="bottom">
        <button
          onClick={() => toggle("up")}
          className={`vote-button ${state.voted ? "voted" : ""}`}
          style={{ fontSize: arrowSize }}
        >
          <ArrowIcon />
        </button>
      </Tooltip>
    </span>
  );
}

/** The exact arrow SVG from ForumMagnum's VoteArrowIconHollow. */
function ArrowIcon({ down }: { down?: boolean }) {
  return (
    <svg viewBox="6 6 12 12" style={down ? { transform: "rotate(180deg)" } : undefined}>
      <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
      <path fill="none" d="M0 0h24v24H0z" />
    </svg>
  );
}
