import type { LeafletDocument, HeaderBlock } from "./types";

/**
 * Table-of-contents extraction for the FixedPositionToC port. Anchor ids
 * follow LessWrong's scheme: heading text with runs of non-alphanumerics
 * collapsed to single underscores, case preserved (e.g.
 * "The Pentagon tries to intimidate Anthropic" →
 * "The_Pentagon_tries_to_intimidate_Anthropic").
 */
export type ToCSection = {
  anchor: string;
  title: string;
  /** 1..3 — indent level (leaflet header level, clamped like FM maxHeadingDepth) */
  level: number;
};

export function headingAnchor(text: string, seen: Set<string>): string {
  const base =
    text
      .trim()
      .replace(/[^A-Za-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "section";
  let anchor = base;
  let n = 1;
  while (seen.has(anchor)) anchor = `${base}_${++n}`;
  seen.add(anchor);
  return anchor;
}

/** Walk the document's pages and collect heading sections (depth ≤ 3). */
export function extractToC(doc: LeafletDocument): ToCSection[] {
  const seen = new Set<string>();
  const sections: ToCSection[] = [];
  for (const page of doc.pages ?? []) {
    for (const b of page.blocks ?? []) {
      const block = b.block as HeaderBlock;
      if (block?.$type !== "pub.leaflet.blocks.header") continue;
      const title = (block.plaintext ?? "").trim();
      if (!title) continue;
      const level = Math.min(Math.max(block.level ?? 1, 1), 3);
      sections.push({ anchor: headingAnchor(title, seen), title, level });
    }
  }
  return sections;
}
