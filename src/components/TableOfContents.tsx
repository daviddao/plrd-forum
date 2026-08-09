"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ToCSection } from "@/lib/leaflet/toc";

/**
 * Port of ForumMagnum's FixedPositionToC (+ TableOfContentsRow +
 * MultiToCLayout hover mechanics): the full-height table of contents that
 * lives in the post page's left column.
 *
 *  - Collapsed state shows only 9px dots and a 1px reading-progress bar;
 *    row labels + the small-caps title fade in when the rail is hovered
 *    (FM: HOVER_CLASSNAME + `&:has($toc:hover)` → opacity 1, .25s).
 *  - Each row's flex-grow is proportional to its section's share of the
 *    post height (FM normalizeToCScale, incl. the title-gap spacer).
 *  - The progress bar fills with --scrollAmount and carries a darker
 *    "window" segment sized to the viewport (FM usePostReadProgress).
 *  - The section whose center has crossed the viewport center is
 *    highlighted (FM useScrollHighlight, position: "centerOfElement").
 */

type SectionWithScale = ToCSection & {
  offset: number;
  scale: number;
  spacer?: boolean;
};

export function TableOfContents({
  sections,
  title,
}: {
  sections: ToCSection[];
  title: string;
}) {
  const [normalized, setNormalized] = useState<SectionWithScale[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // ── measure section offsets → flex scales (FM getSectionsWithOffsets) ──
  const measure = useCallback(() => {
    const body = document.getElementById("postBody");
    if (!body) return;
    const containerTop = body.getBoundingClientRect().top + window.scrollY;
    const containerBottom = containerTop + body.offsetHeight;
    const total = containerBottom - containerTop;
    if (total <= 0) return;

    const withOffsets = sections
      .map((s) => {
        const el = document.getElementById(s.anchor);
        if (!el) return null;
        return { ...s, offset: el.getBoundingClientRect().top + window.scrollY };
      })
      .filter((s): s is ToCSection & { offset: number } => s !== null);
    if (withOffsets.length === 0) {
      setNormalized([]);
      return;
    }

    // FM normalizeToCScale: scale ∝ distance to the next positioned section
    const gapToFirst = withOffsets[0].offset - containerTop;
    const scaled: SectionWithScale[] = withOffsets.map((s, i) => {
      const next = i + 1 < withOffsets.length ? withOffsets[i + 1].offset : containerBottom;
      return { ...s, scale: ((next - s.offset) / total) * 100 };
    });
    if (gapToFirst > 50) {
      scaled.unshift({
        anchor: "spacer",
        title: "",
        level: 0,
        offset: containerTop,
        scale: (gapToFirst / total) * 100,
        spacer: true,
      });
    }
    setNormalized(scaled);
  }, [sections]);

  useEffect(() => {
    measure();
    // re-measure once images settle (FM waits for post images to load)
    const t = setTimeout(measure, 1500);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  // ── scroll: progress bar + section highlight ──
  useEffect(() => {
    const onScroll = () => {
      const body = document.getElementById("postBody");
      const bar = progressRef.current;
      if (body && bar) {
        const rect = body.getBoundingClientRect();
        const bodyTop = rect.top + window.scrollY;
        const bodyHeight = body.offsetHeight;
        // FM usePostReadProgress: % of the post scrolled past the viewport bottom
        const scrolled = window.scrollY + window.innerHeight - bodyTop;
        const pct = Math.min(100, Math.max(0, (scrolled / bodyHeight) * 100));
        bar.style.setProperty("--scrollAmount", `${pct}%`);
        const windowPx = Math.min(
          bar.offsetHeight,
          (window.innerHeight / bodyHeight) * bar.offsetHeight,
        );
        bar.style.setProperty("--windowHeight", `${windowPx}px`);
      }

      // FM useScrollHighlight (centerOfElement): last section whose center
      // is above the viewport center
      const viewportCenter = window.scrollY + window.innerHeight / 2;
      let active: string | null = null;
      for (const s of sections) {
        const el = document.getElementById(s.anchor);
        if (!el) continue;
        const center =
          el.getBoundingClientRect().top + window.scrollY + el.offsetHeight / 2;
        if (center <= viewportCenter) active = s.anchor;
      }
      setCurrent(active);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections]);

  const jumpTo = (anchor: string | null) => (ev: React.MouseEvent) => {
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
    ev.preventDefault();
    if (!anchor) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      history.replaceState(null, "", location.pathname);
      return;
    }
    const el = document.getElementById(anchor);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.2;
    window.scrollTo({ top: y, behavior: "smooth" });
    history.replaceState(null, "", `#${anchor}`);
  };

  if (sections.length === 0) return null;

  return (
    <div className="fixed-toc" aria-label="Table of contents">
      <div className="fixed-toc-wrapper">
        <div className="fixed-toc-progress" ref={progressRef}>
          <div className="fixed-toc-progress-fill" />
          <div className="fixed-toc-progress-rest" />
        </div>
        <div className="fixed-toc-rows">
          {/* title row — FM titleRow: small-caps postStyle, no dot */}
          <div className="toc-rowWrapper">
            <div className="toc-rowDotContainer">
              <span className="toc-rowOpacity toc-titleWrapper">
                <a
                  href="#"
                  onClick={jumpTo(null)}
                  className={`toc-link toc-title${current === null ? " highlighted" : ""}`}
                >
                  {title.trim()}
                </a>
              </span>
            </div>
          </div>
          {normalized.map((s) =>
            s.spacer ? (
              <div key={s.anchor} className="toc-rowWrapper" style={{ flex: s.scale }} />
            ) : (
              <div key={s.anchor} className="toc-rowWrapper" style={{ flex: s.scale }}>
                <div className="toc-rowDotContainer">
                  <div className="toc-rowDot">•</div>
                  <span className="toc-rowOpacity">
                    <a
                      href={`#${s.anchor}`}
                      onClick={jumpTo(s.anchor)}
                      className={`toc-link toc-level${s.level}${
                        s.anchor === current ? " highlighted" : ""
                      }`}
                    >
                      {s.title}
                    </a>
                  </span>
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
