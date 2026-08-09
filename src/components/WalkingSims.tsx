"use client";

import React, { useEffect, useRef } from "react";
import type { LandingSim } from "@/lib/sims";

/**
 * Real Simocracy sims walking along the bottom of the frontpage — randomly
 * picked from the Simocracy network, exactly like simocracy-v2's landing
 * page walkers. Rendering is a faithful port of simocracy-v2's
 * lib/sprites/avatar-renderer.ts (layer DRAW_ORDER, behind-body "$"
 * derivations, hair→hairhat auto-switch, color tinting), minus the atlas
 * fast path — layers load as individual PNGs proxied from simocracy.org.
 */

const AVATAR_SIZE = 32; // drawn 1:1, same as the simocracy landing page
const LOGICAL_HEIGHT = 64;
const FRAME_DELAY_MS = 180; // ~5.5 fps walk cycle
const UPDATE_DELAY_MS = 80;
const SPEED = 0.5;

// direction → walk frame directories (DIRECTION_FRAME_SETS from simocracy)
const FRAMES_RIGHT = [3, 7, 11, 7];
const FRAMES_LEFT = [2, 6, 10, 6];

// emotes atlas: 179 emotes, 3 frames each
const EMOTE_COUNT = 179;
const EMOTE_FRAME_SIZE = 32;
const EMOTE_FRAMES_PER = 3;
const EMOTE_COLS = 10;
const EMOTE_SHOW_DURATION = 2500;
const EMOTE_MIN_INTERVAL = 10000;
const EMOTE_MAX_INTERVAL = 25000;
const EMOTE_DRAW_SIZE = 20;

// ---- ports of simocracy-v2 lib/sprites/types.ts ----------------------------

const PART_FOLDER: Record<string, string> = {
  skin: "00Skin",
  clothes: "01Costume",
  eyes: "02Eye",
  hair: "03Hair",
  "hair$": "03Hair$",
  "hairhat$": "03HairHat$",
  hairadd: "04HairAdd",
  "hairadd$": "04HairAdd$",
  hat: "05Hat",
  "hat$": "05Hat$",
  glasses: "06Glasses",
  cloak: "07Cloak",
  "cloak$": "07Cloak$",
  makeup: "08Makeup",
  beard: "09Beard",
  ear: "10Ear",
  "ear$": "10Ear$",
  tail: "11Tail",
  "tail$": "11Tail$",
  item: "12Item",
  "item$": "12Item$",
};
const HAIRHAT_FOLDER = "03HairHat";
const BEHIND_BODY_PARTS = ["hair$", "hairhat$", "hairadd$", "hat$", "cloak$", "ear$", "tail$", "item$"];
const DRAW_ORDER = [
  "item$", "hat$", "hairadd$", "ear$", "hairhat$", "hair$", "cloak$", "tail$",
  "skin",
  "makeup", "eyes", "clothes", "tail", "cloak", "beard", "glasses", "hair", "ear", "hairadd", "hat", "item",
];
const PART_COLOR_OPACITY: Record<string, number> = {
  skin: 0.1, clothes: 0.4, eyes: 0.2, hair: 0.7, hairadd: 0.7, hat: 0.3,
  glasses: 0.5, cloak: 0.4, makeup: 0.3, beard: 0.7, ear: 0.3, tail: 0.4, item: 0.3,
};

// ---- image loading with negative caching -----------------------------------

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();

function loadImage(src: string): Promise<HTMLImageElement | null> {
  let cached = imageCache.get(src);
  if (!cached) {
    cached = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
    imageCache.set(src, cached);
  }
  return cached;
}

/** swap the frame directory in a pipoya path (avatar-renderer's getFramePath) */
function getFramePath(basePath: string, frame: number): string {
  return basePath.replace(/\/pipoya-sprites\/([^/]+)\/\d+\//, `/pipoya-sprites/$1/${frame}/`);
}

/** faithful mini-port of renderAvatar (no atlas path) */
async function renderSim(
  canvas: HTMLCanvasElement,
  sim: LandingSim,
  frame: number,
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { selectedOptions, partColorSettings } = sim.settings;
  const hatSelected = !!selectedOptions["hat"];
  const w = canvas.width;
  const h = canvas.height;

  // resolve layer paths in draw order
  const layers: { path: string; colorPart: string }[] = [];
  for (const part of DRAW_ORDER) {
    const isBehind = BEHIND_BODY_PARTS.includes(part);
    let basePath: string | undefined;
    let colorPart = part;

    if (isBehind) {
      const behindFolder = PART_FOLDER[part];
      if (part === "hairhat$") {
        const hatPath = selectedOptions["hat"];
        if (!hatPath) continue;
        basePath = hatPath.replace(`/${PART_FOLDER.hat}/`, `/${behindFolder}/`);
        colorPart = "hair";
      } else {
        const frontPart = part.slice(0, -1);
        const frontPath = selectedOptions[frontPart];
        if (!frontPath) continue;
        basePath = frontPath.replace(`/${PART_FOLDER[frontPart]}/`, `/${behindFolder}/`);
        colorPart = frontPart;
      }
    } else {
      const rawPath = selectedOptions[part];
      if (!rawPath) continue;
      basePath =
        part === "hair" && hatSelected
          ? rawPath.replace(`/${PART_FOLDER.hair}/`, `/${HAIRHAT_FOLDER}/`)
          : rawPath;
    }
    layers.push({ path: getFramePath(basePath, frame), colorPart });
  }

  const images = await Promise.all(layers.map((l) => loadImage(l.path)));

  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = false;
  for (let i = 0; i < layers.length; i++) {
    const img = images[i];
    if (!img) continue; // missing behind-body variants etc. — same as FM's existence map
    const { colorPart } = layers[i];
    const color = partColorSettings?.[colorPart];
    const needsTint = !!(color && color.alpha > 0);

    if (!needsTint) {
      ctx.drawImage(img, 0, 0, w, h);
      continue;
    }
    // tint on an isolated canvas (applyColorFilter port), then composite
    const tint = document.createElement("canvas");
    tint.width = w;
    tint.height = h;
    const tctx = tint.getContext("2d");
    if (!tctx) continue;
    tctx.imageSmoothingEnabled = false;
    tctx.drawImage(img, 0, 0, w, h);
    const opacity = color.alpha * (PART_COLOR_OPACITY[colorPart] ?? 0.5);
    if (opacity > 0) {
      tctx.globalCompositeOperation = "source-atop";
      tctx.fillStyle = `rgba(${color.red}, ${color.green}, ${color.blue}, ${opacity})`;
      tctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(tint, 0, 0);
  }
}

// ---- wandering loop — sims roam the top-right region (where the hero art
// used to be), walking in all four directions with LW-art-style placement ----

// DIRECTION_FRAME_SETS from simocracy types: 0=right, 1=back/up, 2=left, 3=front/down
const DIRECTION_FRAMES: number[][] = [
  [3, 7, 11, 7], // right
  [4, 8, 12, 8], // up (back)
  [2, 6, 10, 6], // left
  [1, 5, 9, 5], // down (front)
];
const DIRECTION_VECTORS: [number, number][] = [
  [1, 0],
  [0, -1],
  [-1, 0],
  [0, 1],
];

type SimState = {
  sim: LandingSim;
  x: number;
  y: number;
  direction: 0 | 1 | 2 | 3;
  paused: boolean;
  nextTurnTime: number;
  offscreen: HTMLCanvasElement;
  rendered: boolean;
  lastFrame: number;
  emoteId: number | null;
  emoteStartTime: number;
  nextEmoteTime: number;
};

function pickTurn(nowMs: number): number {
  return nowMs + 1500 + Math.random() * 3500;
}

export function WalkingSims({ sims }: { sims: LandingSim[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (sims.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;

    let W = 480;
    let H = 420;
    const applySize = () => {
      const rect = container.getBoundingClientRect();
      W = Math.max(200, Math.round(rect.width));
      H = Math.max(200, Math.round(rect.height));
      const dpr = window.devicePixelRatio || 1;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    applySize();
    const ro = new ResizeObserver(() => applySize());
    ro.observe(container);

    let emotesAtlas: HTMLImageElement | null = null;
    loadImage("/emotes-atlas.png").then((img) => (emotesAtlas = img));

    const pad = AVATAR_SIZE / 2 + 6;
    const states: SimState[] = sims.map((sim, i) => {
      const offscreen = document.createElement("canvas");
      offscreen.width = AVATAR_SIZE;
      offscreen.height = AVATAR_SIZE;
      const direction = Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3;
      const state: SimState = {
        sim,
        x: pad + Math.random() * (W - pad * 2),
        y: pad + 20 + Math.random() * (H - pad * 2 - 40),
        direction,
        paused: Math.random() < 0.3,
        nextTurnTime: Date.now() + 1000 + Math.random() * 3000,
        offscreen,
        rendered: false,
        lastFrame: -1,
        emoteId: null,
        emoteStartTime: 0,
        nextEmoteTime: Date.now() + EMOTE_MIN_INTERVAL + i * 4000 + Math.random() * 3000,
      };
      const initialFrame = DIRECTION_FRAMES[direction][0];
      renderSim(offscreen, sim, initialFrame).then(() => {
        state.rendered = true;
        state.lastFrame = initialFrame;
      });
      return state;
    });

    let mounted = true;
    let rafId = 0;
    let lastFrameTime = 0;
    let lastUpdateTime = 0;
    let sharedFrameIndex = 0;

    const animate = (now: number) => {
      if (!mounted) return;
      rafId = requestAnimationFrame(animate);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (now - lastUpdateTime >= UPDATE_DELAY_MS) {
        const nowMs = Date.now();
        for (const s of states) {
          // occasionally turn to a random direction or pause
          if (nowMs > s.nextTurnTime) {
            s.paused = Math.random() < 0.25;
            s.direction = Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3;
            s.nextTurnTime = pickTurn(nowMs);
          }

          if (!s.paused) {
            const [dx, dy] = DIRECTION_VECTORS[s.direction];
            s.x += dx * SPEED;
            s.y += dy * SPEED;

            // bounce at region edges: reverse direction
            if (s.x > W - pad) {
              s.x = W - pad;
              s.direction = 2;
              s.nextTurnTime = pickTurn(nowMs);
            } else if (s.x < pad) {
              s.x = pad;
              s.direction = 0;
              s.nextTurnTime = pickTurn(nowMs);
            }
            if (s.y > H - pad - 16) {
              s.y = H - pad - 16;
              s.direction = 1;
              s.nextTurnTime = pickTurn(nowMs);
            } else if (s.y < pad + EMOTE_DRAW_SIZE) {
              s.y = pad + EMOTE_DRAW_SIZE;
              s.direction = 3;
              s.nextTurnTime = pickTurn(nowMs);
            }
          }

          // emotes
          if (s.emoteId !== null) {
            if (nowMs - s.emoteStartTime > EMOTE_SHOW_DURATION) {
              s.emoteId = null;
              s.nextEmoteTime =
                nowMs + EMOTE_MIN_INTERVAL + Math.random() * (EMOTE_MAX_INTERVAL - EMOTE_MIN_INTERVAL);
            }
          } else if (nowMs > s.nextEmoteTime) {
            s.emoteId = Math.floor(Math.random() * EMOTE_COUNT);
            s.emoteStartTime = nowMs;
          }
        }
        lastUpdateTime = now;
      }

      if (now - lastFrameTime >= FRAME_DELAY_MS) {
        sharedFrameIndex = (sharedFrameIndex + 1) % 4;
        ctx.clearRect(0, 0, W, H);
        ctx.imageSmoothingEnabled = false;

        // y-sort so lower sims draw in front
        const ordered = [...states].sort((a, b) => a.y - b.y);
        for (const s of ordered) {
          const frames = DIRECTION_FRAMES[s.direction];
          // paused sims hold the standing frame (index 1 of the set)
          const frame = s.paused ? frames[1] : frames[sharedFrameIndex];
          if (frame !== s.lastFrame) {
            s.lastFrame = frame;
            renderSim(s.offscreen, s.sim, frame).then(() => {
              s.rendered = true;
            });
          }
          if (!s.rendered) continue;

          ctx.drawImage(
            s.offscreen,
            s.x - AVATAR_SIZE / 2,
            s.y - AVATAR_SIZE / 2,
            AVATAR_SIZE,
            AVATAR_SIZE,
          );

          if (s.emoteId !== null && emotesAtlas) {
            const elapsed = now - s.emoteStartTime;
            const emoteFrame =
              elapsed < EMOTE_SHOW_DURATION * 0.2 ? 0 : elapsed < EMOTE_SHOW_DURATION * 0.8 ? 1 : 2;
            const srcX =
              (s.emoteId % EMOTE_COLS) * (EMOTE_FRAME_SIZE * EMOTE_FRAMES_PER) +
              emoteFrame * EMOTE_FRAME_SIZE;
            const srcY = Math.floor(s.emoteId / EMOTE_COLS) * EMOTE_FRAME_SIZE;
            ctx.drawImage(
              emotesAtlas,
              srcX, srcY, EMOTE_FRAME_SIZE, EMOTE_FRAME_SIZE,
              s.x - EMOTE_DRAW_SIZE / 2,
              s.y - AVATAR_SIZE / 2 - EMOTE_DRAW_SIZE - 2,
              EMOTE_DRAW_SIZE, EMOTE_DRAW_SIZE,
            );
          }

          // name label (simocracy hero style)
          ctx.imageSmoothingEnabled = true;
          ctx.save();
          ctx.font = "bold 9px sans-serif";
          ctx.textAlign = "center";
          const label = s.sim.name;
          const labelW = ctx.measureText(label).width + 8;
          const labelY = s.y + AVATAR_SIZE / 2 + 2;
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.fillRect(s.x - labelW / 2, labelY, labelW, 13);
          ctx.fillStyle = "#fff";
          ctx.fillText(label, s.x, labelY + 10);
          ctx.restore();
          ctx.imageSmoothingEnabled = false;
        }
        lastFrameTime = now;
      }
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [sims]);

  if (sims.length === 0) return null;

  return (
    // top-right region where the hero artwork used to live; wide screens only
    <div
      className="pointer-events-none fixed z-0 hidden lg:block"
      aria-hidden="true"
      style={{
        top: 96,
        right: 24,
        width: "min(34vw, 520px)",
        height: "min(60vh, 460px)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          imageRendering: "pixelated",
          display: "block",
        }}
      />
    </div>
  );
}
