/**
 * Serialize a contenteditable DOM tree into pub.leaflet.pages.linearDocument
 * blocks with byte-indexed richtext facets — the WYSIWYG counterpart of
 * markdown.ts. Runs client-side.
 */

import type {
  Facet,
  FacetFeature,
  LinearDocumentBlock,
  LinearDocumentPage,
  ListItem,
} from "./types";

type InlineState = {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  strike?: boolean;
  underline?: boolean;
  link?: string;
};

/** Extract plaintext + facets from an element's inline content. */
export function inlineContent(el: Node): { plaintext: string; facets: Facet[] } {
  const encoder = new TextEncoder();
  let text = "";
  let bytes = 0;
  const facets: Facet[] = [];

  const walk = (node: Node, state: InlineState) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent ?? "";
      if (!t) return;
      const start = bytes;
      text += t;
      bytes += encoder.encode(t).length;
      const features: FacetFeature[] = [];
      if (state.bold) features.push({ $type: "pub.leaflet.richtext.facet#bold" });
      if (state.italic) features.push({ $type: "pub.leaflet.richtext.facet#italic" });
      if (state.code) features.push({ $type: "pub.leaflet.richtext.facet#code" });
      if (state.strike) features.push({ $type: "pub.leaflet.richtext.facet#strikethrough" });
      if (state.underline) features.push({ $type: "pub.leaflet.richtext.facet#underline" });
      if (state.link) features.push({ $type: "pub.leaflet.richtext.facet#link", uri: state.link });
      if (features.length) {
        facets.push({ index: { byteStart: start, byteEnd: bytes }, features });
      }
      return;
    }
    if (!(node instanceof Element)) return;
    const tag = node.tagName;
    if (tag === "BR") {
      text += "\n";
      bytes += 1;
      return;
    }
    const next: InlineState = { ...state };
    if (tag === "B" || tag === "STRONG") next.bold = true;
    if (tag === "I" || tag === "EM") next.italic = true;
    if (tag === "CODE") next.code = true;
    if (tag === "S" || tag === "STRIKE" || tag === "DEL") next.strike = true;
    if (tag === "U") next.underline = true;
    if (tag === "A") next.link = (node as HTMLAnchorElement).getAttribute("href") ?? undefined;
    // inline style fallbacks (execCommand sometimes emits spans)
    if (node instanceof HTMLElement) {
      const st = node.style;
      if (st.fontWeight === "bold" || parseInt(st.fontWeight) >= 600) next.bold = true;
      if (st.fontStyle === "italic") next.italic = true;
      if (st.textDecoration.includes("line-through")) next.strike = true;
    }
    node.childNodes.forEach((c) => walk(c, next));
  };

  walk(el, {});
  return { plaintext: text, facets };
}

function textBlock(el: Node): LinearDocumentBlock | null {
  const { plaintext, facets } = inlineContent(el);
  if (!plaintext.trim()) return null;
  return {
    block: {
      $type: "pub.leaflet.blocks.text",
      plaintext,
      ...(facets.length ? { facets } : {}),
    },
  };
}

function listItems(listEl: Element): ListItem[] {
  const items: ListItem[] = [];
  for (const li of Array.from(listEl.children)) {
    if (li.tagName !== "LI") continue;
    // separate nested lists from inline content
    const clone = li.cloneNode(true) as Element;
    const nested = clone.querySelectorAll(":scope > ul, :scope > ol");
    nested.forEach((n) => n.remove());
    const { plaintext, facets } = inlineContent(clone);
    const item: ListItem = {
      content: {
        $type: "pub.leaflet.blocks.text",
        plaintext,
        ...(facets.length ? { facets } : {}),
      },
    };
    const nestedList = li.querySelector(":scope > ul, :scope > ol");
    if (nestedList) item.children = listItems(nestedList);
    items.push(item);
  }
  return items;
}

const BLOCK_TAGS = new Set([
  "H1", "H2", "H3", "H4", "H5", "H6",
  "BLOCKQUOTE", "PRE", "UL", "OL", "HR", "P", "DIV",
]);

/** Convert the editor's DOM into a linearDocument page. */
export function domToPage(root: HTMLElement): LinearDocumentPage {
  const blocks: LinearDocumentBlock[] = [];
  // consecutive bare inline nodes at block level get grouped into one paragraph
  let pendingInline: Node[] = [];

  const flushInline = () => {
    if (pendingInline.length === 0) return;
    const wrapper = document.createElement("div");
    for (const n of pendingInline) wrapper.appendChild(n.cloneNode(true));
    pendingInline = [];
    const b = textBlock(wrapper);
    if (b) blocks.push(b);
  };

  const pushNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent?.trim()) pendingInline.push(node);
      return;
    }
    if (!(node instanceof Element)) return;
    const tag = node.tagName;
    if (!BLOCK_TAGS.has(tag)) {
      // inline element at block level (bare <b>, <a>, <span>, <br>…)
      if (tag === "BR") {
        flushInline();
        return;
      }
      if (node.textContent?.trim()) pendingInline.push(node);
      return;
    }
    flushInline();

    switch (tag) {
      case "H1":
      case "H2":
      case "H3":
      case "H4":
      case "H5":
      case "H6": {
        const { plaintext, facets } = inlineContent(node);
        if (!plaintext.trim()) return;
        blocks.push({
          block: {
            $type: "pub.leaflet.blocks.header",
            level: Number(tag[1]),
            plaintext,
            ...(facets.length ? { facets } : {}),
          },
        });
        return;
      }
      case "BLOCKQUOTE": {
        const { plaintext, facets } = inlineContent(node);
        if (!plaintext.trim()) return;
        blocks.push({
          block: {
            $type: "pub.leaflet.blocks.blockquote",
            plaintext,
            ...(facets.length ? { facets } : {}),
          },
        });
        return;
      }
      case "PRE": {
        const plaintext = node.textContent ?? "";
        if (!plaintext.trim()) return;
        blocks.push({ block: { $type: "pub.leaflet.blocks.code", plaintext } });
        return;
      }
      case "UL":
        blocks.push({
          block: { $type: "pub.leaflet.blocks.unorderedList", children: listItems(node) },
        });
        return;
      case "OL":
        blocks.push({
          block: { $type: "pub.leaflet.blocks.orderedList", children: listItems(node) },
        });
        return;
      case "HR":
        blocks.push({ block: { $type: "pub.leaflet.blocks.horizontalRule" } });
        return;
      case "P":
      case "DIV": {
        // a div/p that only wraps block children — recurse
        const hasBlockChildren = Array.from(node.children).some((c) =>
          ["H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "PRE", "UL", "OL", "HR", "P", "DIV"].includes(c.tagName),
        );
        if (hasBlockChildren) {
          node.childNodes.forEach(pushNode);
        } else {
          const b = textBlock(node);
          if (b) blocks.push(b);
        }
        return;
      }
      default: {
        const b = textBlock(node);
        if (b) blocks.push(b);
      }
    }
  };

  root.childNodes.forEach(pushNode);
  flushInline();
  return { $type: "pub.leaflet.pages.linearDocument", blocks };
}
