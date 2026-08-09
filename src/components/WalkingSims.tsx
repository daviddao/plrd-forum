"use client";

import React, { useEffect, useRef } from "react";

/**
 * Randomly composed pixel sims (Pipoya sprites from simocracy-v2) walking
 * along the bottom of the frontpage — replaces the static background art.
 * Each sim's look is seeded from its name (forum authors), so the same
 * author always walks by with the same face.
 *
 * Ported/simplified from simocracy-v2's components/landing/hero.tsx
 * useWalkingSims hook, compositing layer PNGs directly:
 *   /pipoya-sprites/adult/{frame}/{partFolder}/{id}.png
 */

const AVATAR_SIZE = 32;
const DRAW_SCALE = 1.6;
const LOGICAL_HEIGHT = 72;
const FRAME_DELAY_MS = 180; // ~5.5 fps walk cycle
const UPDATE_DELAY_MS = 80; // position update rate
const SPEED = 0.5; // px per update tick

// direction → [walk frames] (frame = sprite directory number)
const FRAMES_RIGHT = [3, 7, 11, 7];
const FRAMES_LEFT = [2, 6, 10, 6];

// emotes atlas (simocracy-v2 emotes-atlas.png): 179 emotes, 3 frames each
const EMOTE_COUNT = 179;
const EMOTE_FRAME_SIZE = 32;
const EMOTE_FRAMES_PER = 3;
const EMOTE_COLS = 10;
const EMOTE_SHOW_DURATION = 2500;
const EMOTE_MIN_INTERVAL = 9000;
const EMOTE_MAX_INTERVAL = 22000;
const EMOTE_DRAW_SIZE = 22;

// available sprite variants (from simocracy-v2's CHARACTER_SET_SPRITE_IDS.adult)
const SKIN_IDS = range(1, 33);
const CLOTHES_IDS = [...range(1, 9), ...range(13, 24), ...range(32, 61), 69, 70];
const EYE_IDS = range(1, 35);
const HAIR_IDS = range(1, 68);
const HAT_IDS = range(1, 26);
const GLASSES_IDS = range(1, 10);
const BEARD_IDS = range(1, 8);

function range(a: number, b: number): number[] {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

/** deterministic PRNG seeded from a string (author name) */
function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), h | 1);
    h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
    return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
  };
}

type SimLook = {
  // layer id per part, null = not worn; drawn in this order
  hairBehind: number | null; // 03Hair$ (behind body), same id as hair when present
  skin: number;
  eyes: number;
  clothes: number;
  beard: number | null;
  glasses: number | null;
  hair: number;
  hat: number | null;
};

function randomLook(rand: () => number): SimLook {
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const hair = pick(HAIR_IDS);
  return {
    hairBehind: hair,
    skin: pick(SKIN_IDS),
    eyes: pick(EYE_IDS),
    clothes: pick(CLOTHES_IDS),
    beard: rand() < 0.18 ? pick(BEARD_IDS) : null,
    glasses: rand() < 0.22 ? pick(GLASSES_IDS) : null,
    hair,
    hat: rand() < 0.3 ? pick(HAT_IDS) : null,
  };
}

/** layer → (folder, id) pairs in draw order for a given look */
function layersFor(look: SimLook): { folder: string; id: number }[] {
  const layers: { folder: string; id: number }[] = [];
  if (look.hairBehind !== null) layers.push({ folder: "03Hair$", id: look.hairBehind });
  layers.push({ folder: "00Skin", id: look.skin });
  layers.push({ folder: "02Eye", id: look.eyes });
  layers.push({ folder: "01Costume", id: look.clothes });
  if (look.beard !== null) layers.push({ folder: "09Beard", id: look.beard });
  if (look.glasses !== null) layers.push({ folder: "06Glasses", id: look.glasses });
  layers.push({ folder: "03Hair", id: look.hair });
  if (look.hat !== null) layers.push({ folder: "05Hat", id: look.hat });
  return layers;
}

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

async function renderSimFrame(
  canvas: HTMLCanvasElement,
  look: SimLook,
  frame: number,
): Promise<void> {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const images = await Promise.all(
    layersFor(look).map(({ folder, id }) =>
      loadImage(`/pipoya-sprites/adult/${frame}/${folder}/${id}.png`),
    ),
  );
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const img of images) {
    if (img) ctx.drawImage(img, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  }
}

type SimState = {
  name: string;
  look: SimLook;
  x: number;
  direction: 0 | 2; // 0=right, 2=left
  offscreen: HTMLCanvasElement;
  rendered: boolean;
  lastFrame: number;
  emoteId: number | null;
  emoteStartTime: number;
  nextEmoteTime: number;
};

export function WalkingSims({ names }: { names: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;

    let widthRef = 800;
    const applySize = (w: number) => {
      widthRef = w;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = LOGICAL_HEIGHT * dpr;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    applySize(container.getBoundingClientRect().width || 800);
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0]?.contentRect.width ?? 0);
      if (w > 0) applySize(w);
    });
    ro.observe(container);

    let emotesAtlas: HTMLImageElement | null = null;
    loadImage("/emotes-atlas.png").then((img) => (emotesAtlas = img));

    const simNames = names.length > 0 ? names.slice(0, 7) : ["wanderer"];
    const sims: SimState[] = simNames.map((name, i) => {
      const rand = seededRandom(name);
      const offscreen = document.createElement("canvas");
      offscreen.width = AVATAR_SIZE;
      offscreen.height = AVATAR_SIZE;
      const direction = (rand() < 0.5 ? 0 : 2) as 0 | 2;
      const state: SimState = {
        name,
        look: randomLook(rand),
        x: ((i + 0.5 + rand() * 0.6) / simNames.length) * widthRef,
        direction,
        offscreen,
        rendered: false,
        lastFrame: -1,
        emoteId: null,
        emoteStartTime: 0,
        nextEmoteTime: Date.now() + 4000 + i * 3500 + rand() * 4000,
      };
      const initialFrame = (direction === 0 ? FRAMES_RIGHT : FRAMES_LEFT)[0];
      renderSimFrame(offscreen, state.look, initialFrame).then(() => {
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
      const drawSize = AVATAR_SIZE * DRAW_SCALE;
      const pad = drawSize / 2 + 4;

      if (now - lastUpdateTime >= UPDATE_DELAY_MS) {
        const nowMs = Date.now();
        for (const sim of sims) {
          sim.x += sim.direction === 0 ? SPEED : -SPEED;
          if (sim.x > widthRef - pad) {
            sim.x = widthRef - pad;
            sim.direction = 2;
          } else if (sim.x < pad) {
            sim.x = pad;
            sim.direction = 0;
          }
          if (sim.emoteId !== null) {
            if (nowMs - sim.emoteStartTime > EMOTE_SHOW_DURATION) {
              sim.emoteId = null;
              sim.nextEmoteTime =
                nowMs + EMOTE_MIN_INTERVAL + Math.random() * (EMOTE_MAX_INTERVAL - EMOTE_MIN_INTERVAL);
            }
          } else if (nowMs > sim.nextEmoteTime) {
            sim.emoteId = Math.floor(Math.random() * EMOTE_COUNT);
            sim.emoteStartTime = nowMs;
          }
        }
        lastUpdateTime = now;
      }

      if (now - lastFrameTime >= FRAME_DELAY_MS) {
        sharedFrameIndex = (sharedFrameIndex + 1) % 4;
        ctx.clearRect(0, 0, widthRef, LOGICAL_HEIGHT);
        ctx.imageSmoothingEnabled = false;

        for (const sim of sims) {
          const frames = sim.direction === 0 ? FRAMES_RIGHT : FRAMES_LEFT;
          const frame = frames[sharedFrameIndex];
          if (frame !== sim.lastFrame) {
            sim.lastFrame = frame;
            renderSimFrame(sim.offscreen, sim.look, frame).then(() => {
              sim.rendered = true;
            });
          }
          if (!sim.rendered) continue;

          const y = LOGICAL_HEIGHT - drawSize / 2 - 14;
          ctx.drawImage(sim.offscreen, sim.x - drawSize / 2, y - drawSize / 2, drawSize, drawSize);

          // emote bubble
          if (sim.emoteId !== null && emotesAtlas) {
            const elapsed = now - sim.emoteStartTime;
            const emoteFrame =
              elapsed < EMOTE_SHOW_DURATION * 0.2 ? 0 : elapsed < EMOTE_SHOW_DURATION * 0.8 ? 1 : 2;
            const srcX =
              (sim.emoteId % EMOTE_COLS) * (EMOTE_FRAME_SIZE * EMOTE_FRAMES_PER) +
              emoteFrame * EMOTE_FRAME_SIZE;
            const srcY = Math.floor(sim.emoteId / EMOTE_COLS) * EMOTE_FRAME_SIZE;
            ctx.drawImage(
              emotesAtlas,
              srcX, srcY, EMOTE_FRAME_SIZE, EMOTE_FRAME_SIZE,
              sim.x - EMOTE_DRAW_SIZE / 2,
              y - drawSize / 2 - EMOTE_DRAW_SIZE - 2,
              EMOTE_DRAW_SIZE, EMOTE_DRAW_SIZE,
            );
          }

          // name label
          ctx.imageSmoothingEnabled = true;
          ctx.save();
          ctx.font = "9px Calibri, 'Gill Sans', Tahoma, sans-serif";
          ctx.textAlign = "center";
          const labelY = y + drawSize / 2 + 2;
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          const labelW = ctx.measureText(sim.name).width + 8;
          ctx.fillRect(sim.x - labelW / 2, labelY, labelW, 12);
          ctx.fillStyle = "#fff";
          ctx.fillText(sim.name, sim.x, labelY + 9);
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
  }, [names]);

  return (
    <div className="pointer-events-none fixed right-0 bottom-0 left-0 z-0" aria-hidden="true">
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: `${LOGICAL_HEIGHT}px`,
          imageRendering: "pixelated",
          display: "block",
        }}
      />
    </div>
  );
}
