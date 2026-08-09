import Link from "next/link";
import type { PublicationListItem } from "@/lib/queries";
import { authorName } from "@/lib/format";

/** Sequence-grid style card for a leaflet publication (LW Library look). */
export function LibraryCard({ pub }: { pub: PublicationListItem }) {
  const theme = pub.record.theme;
  const bg = colorFrom(theme?.backgroundColor) ?? colorFrom(theme?.accentBackground);
  const darkText = bg ? isLight(bg) : false;
  const fg = darkText ? "rgba(0,0,0,.87)" : "#fff";
  const fgDim = darkText ? "rgba(0,0,0,.6)" : "rgba(255,255,255,.85)";
  const shadow = darkText ? "none" : undefined;

  return (
    <Link
      href={`/library/${pub.did}/${pub.rkey}`}
      className="library-card no-underline"
      style={bg ? { background: bg } : undefined}
    >
      <div className="squiggle" />
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="library-card-title" style={{ color: fg, textShadow: shadow }}>
          {pub.name}
        </div>
        <div className="library-card-meta" style={{ color: fgDim, textShadow: shadow }}>
          {authorName(pub.author, pub.did)} · {pub.postCount}{" "}
          {pub.postCount === 1 ? "post" : "posts"}
        </div>
      </div>
    </Link>
  );
}

/** leaflet theme colors are {hex} objects or rgb/rgba unions. */
export function colorFrom(c: unknown): string | null {
  if (!c || typeof c !== "object") return null;
  const o = c as { hex?: string; r?: number; g?: number; b?: number; a?: number };
  if (typeof o.hex === "string") return o.hex.startsWith("#") ? o.hex : `#${o.hex}`;
  if (typeof o.r === "number" && typeof o.g === "number" && typeof o.b === "number") {
    return `rgba(${o.r},${o.g},${o.b},${typeof o.a === "number" ? o.a / 100 : 1})`;
  }
  return null;
}

/** Relative luminance check for contrast-aware text color. */
export function isLight(color: string): boolean {
  let r = 0, g = 0, b = 0;
  const hex = color.match(/^#([0-9a-f]{6})$/i)?.[1];
  const rgb = color.match(/rgba?\(([\d.]+),([\d.]+),([\d.]+)/);
  if (hex) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else if (rgb) {
    r = parseFloat(rgb[1]);
    g = parseFloat(rgb[2]);
    b = parseFloat(rgb[3]);
  } else {
    return false;
  }
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}
