"use client";

/**
 * FloatingEinstein — a pixel-art Einstein who lives in the bottom-right
 * corner as the forum's feedback agent. Lean port of simocracy-v2's
 * components/feedback/floating-einstein.tsx, restyled with the LW palette:
 *  - Sits fixed bottom-right, gently bobbing; waves when the panel opens.
 *  - Sprite: the bundled codex-pet sheet (8 cols x 9 rows of 192x208 cells,
 *    per-frame durations from the hatch-pet contract) with a static PNG
 *    poster behind the canvas covering the sheet's load window.
 *  - Click toggles a small speech-bubble panel with a feedback form that
 *    POSTs to /api/feedback (works for guests; DID attached when logged in).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const SPRITE_W = 64;
const SPRITE_H = 69; // 192x208 cell → 12:13 footprint
const SHEET_URL = "/codex-pets/Einstein-sheet.webp";
const POSTER_URL = "/codex-pets/Einstein.png";
const OPEN_WAVE_MS = 1600;

// codex-pet rows we use (subset of the full contract)
const ROWS = {
  idle: { row: 0, durations: [280, 110, 110, 140, 140, 320] },
  waving: { row: 3, durations: [140, 140, 140, 280] },
} as const;
type EinsteinState = keyof typeof ROWS;
const CELL_W = 192;
const CELL_H = 208;

function useSheetAnimation(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  state: EinsteinState,
  onFirstFrame: () => void,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let stopped = false;
    let rafId = 0;
    let sheet: HTMLImageElement | null = null;
    let frameIndex = 0;
    let frameStart = 0;
    let painted = false;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx || !sheet) return;
      const { row, durations } = ROWS[state];
      const col = frameIndex % durations.length;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        sheet,
        col * CELL_W, row * CELL_H, CELL_W, CELL_H,
        0, 0, canvas.width, canvas.height,
      );
      if (!painted) {
        painted = true;
        onFirstFrame();
      }
    };

    const img = new Image();
    img.onload = () => {
      if (stopped) return;
      sheet = img;
      frameStart = performance.now();
      draw();
    };
    img.src = SHEET_URL;

    const tick = (now: number) => {
      if (stopped) return;
      rafId = requestAnimationFrame(tick);
      if (!sheet) return;
      const { durations } = ROWS[state];
      if (now - frameStart >= durations[frameIndex % durations.length]) {
        frameIndex = (frameIndex + 1) % durations.length;
        frameStart = now;
        draw();
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      stopped = true;
      cancelAnimationFrame(rafId);
    };
  }, [canvasRef, state, onFirstFrame]);
}

export function FloatingEinstein() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [waving, setWaving] = useState(false);
  const [firstFramePainted, setFirstFramePainted] = useState(false);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const markPainted = useCallback(() => setFirstFramePainted(true), []);
  useSheetAnimation(canvasRef, waving ? "waving" : "idle", markPainted);

  // wave briefly when the panel opens, then settle back into idle
  useEffect(() => {
    if (!waving) return;
    const t = setTimeout(() => setWaving(false), OPEN_WAVE_MS);
    return () => clearTimeout(t);
  }, [waving]);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => textareaRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const toggle = () => {
    setIsOpen((v) => {
      const next = !v;
      if (next) {
        setWaving(true);
        setStatus("idle");
      }
      return next;
    });
  };

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || status === "sending") return;
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, path: pathname ?? undefined }),
      });
      if (!res.ok) throw new Error();
      setText("");
      setStatus("sent");
      setWaving(true);
    } catch {
      setStatus("error");
    }
  };

  return (
    <>
      {/* sprite */}
      <button
        type="button"
        onClick={toggle}
        aria-label={isOpen ? "Close feedback" : "Give feedback to Einstein"}
        title="Feedback? Tell Einstein."
        className="einstein-button"
      >
        <div className={`einstein-sprite ${isOpen ? "" : "einstein-bob"}`}>
          {/* poster fallback behind the canvas while the sheet streams in */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={POSTER_URL}
            alt=""
            aria-hidden
            draggable={false}
            style={{ opacity: firstFramePainted ? 0 : 1 }}
          />
          <canvas ref={canvasRef} width={CELL_W} height={CELL_H} />
        </div>
        {!isOpen && <span className="einstein-tag">Feedback</span>}
      </button>

      {/* speech-bubble panel */}
      {isOpen && (
        <div role="dialog" aria-label="Feedback for the forum" className="einstein-panel">
          <div className="einstein-panel-header">
            <span className="einstein-panel-name">Einstein</span>
            <span className="einstein-panel-sub">· Feedback</span>
            <button
              type="button"
              className="einstein-panel-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {status === "sent" ? (
            <div className="einstein-panel-body">
              <p className="einstein-greeting">
                Danke schön! Your note is filed. The forum gets a little less
                relatively wrong every day.
              </p>
              <button
                type="button"
                className="einstein-again"
                onClick={() => setStatus("idle")}
              >
                Send another
              </button>
            </div>
          ) : (
            <div className="einstein-panel-body">
              <p className="einstein-greeting">
                Hello — bugs, ideas, confusing bits, praise: all welcome. What
                should we improve?
              </p>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Tell Einstein about the forum…"
                rows={4}
                className="einstein-input"
              />
              {status === "error" && (
                <p className="einstein-error">
                  Couldn&apos;t send — try again in a moment.
                </p>
              )}
              <button
                type="button"
                className="einstein-send"
                onClick={send}
                disabled={!text.trim() || status === "sending"}
              >
                {status === "sending" ? "Sending…" : "Send feedback"}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
