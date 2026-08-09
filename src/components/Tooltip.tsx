"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type Placement = "bottom-start" | "bottom-end" | "bottom" | "top" | "right-start";

/**
 * Port of ForumMagnum's LWTooltip / LWPopper.
 * variant="tooltip" → dark MuiTooltip-style bubble (fontSize 13, padding 9.1px)
 * variant="card"    → white PopperCard with lwCard shadow (hover previews)
 */
export function Tooltip({
  title,
  children,
  placement = "bottom-start",
  variant = "tooltip",
  delay = 0,
  As = "span",
  className,
  disabled,
}: {
  title: ReactNode;
  children: ReactNode;
  placement?: Placement;
  variant?: "tooltip" | "card";
  delay?: number;
  As?: "span" | "div";
  className?: string;
  disabled?: boolean;
}) {
  const anchorRef = useRef<HTMLElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const reposition = useCallback(() => {
    const anchor = anchorRef.current;
    const pop = popRef.current;
    if (!anchor || !pop) return;
    const a = anchor.getBoundingClientRect();
    const p = pop.getBoundingClientRect();
    const margin = 8;
    let top: number;
    let left: number;

    switch (placement) {
      case "bottom-end":
        top = a.bottom + 4;
        left = a.right - p.width;
        break;
      case "bottom":
        top = a.bottom + 4;
        left = a.left + a.width / 2 - p.width / 2;
        break;
      case "top":
        top = a.top - p.height - 4;
        left = a.left + a.width / 2 - p.width / 2;
        break;
      case "right-start":
        top = a.top;
        left = a.right + 6;
        break;
      default: // bottom-start
        top = a.bottom + 4;
        left = a.left;
    }

    // clamp to viewport
    left = Math.min(Math.max(left, margin), window.innerWidth - p.width - margin);
    if (top + p.height > window.innerHeight - margin) {
      top = Math.max(a.top - p.height - 4, margin);
    }
    setPos({ top, left });
  }, [placement]);

  useEffect(() => {
    if (!open) return;
    reposition();
    const onScroll = () => setOpen(false);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, reposition]);

  const show = () => {
    if (disabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const Tag = As;

  return (
    <Tag
      ref={(el: HTMLElement | null) => { anchorRef.current = el; }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onMouseDown={variant === "tooltip" ? hide : undefined}
      className={className}
      style={{ display: As === "span" ? "inline-block" : undefined }}
    >
      {children}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={(el) => {
              popRef.current = el;
              if (el) reposition();
            }}
            className={variant === "card" ? "lw-popper-card" : "lw-tooltip"}
            style={{
              position: "fixed",
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              zIndex: 10000,
              visibility: pos ? "visible" : "hidden",
            }}
          >
            {title}
          </div>,
          document.body,
        )}
    </Tag>
  );
}
