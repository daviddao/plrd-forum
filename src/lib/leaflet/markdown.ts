import type {
  Facet,
  LinearDocumentBlock,
  LinearDocumentPage,
  ListItem,
} from "./types";

/**
 * Minimal markdown → pub.leaflet.pages.linearDocument converter for the
 * in-app editor. Supports: #/##/### headers, paragraphs, > blockquotes,
 * ``` code fences, -/* unordered lists, 1. ordered lists, --- rules,
 * and inline **bold**, *italic*, `code`, [links](url).
 */
export function markdownToPage(markdown: string): LinearDocumentPage {
  const blocks: LinearDocumentBlock[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let i = 0;

  const flushParagraph = (buf: string[]) => {
    const text = buf.join(" ").trim();
    if (!text) return;
    const { plaintext, facets } = parseInline(text);
    blocks.push({
      block: { $type: "pub.leaflet.blocks.text", plaintext, ...(facets.length ? { facets } : {}) },
    });
  };

  let para: string[] = [];

  while (i < lines.length) {
    const line = lines[i];

    // code fence
    if (/^```/.test(line)) {
      flushParagraph(para);
      para = [];
      const language = line.slice(3).trim() || undefined;
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      i++; // closing fence
      blocks.push({
        block: {
          $type: "pub.leaflet.blocks.code",
          plaintext: code.join("\n"),
          ...(language ? { language } : {}),
        },
      });
      continue;
    }

    // header
    const header = line.match(/^(#{1,6})\s+(.*)$/);
    if (header) {
      flushParagraph(para);
      para = [];
      const { plaintext, facets } = parseInline(header[2]);
      blocks.push({
        block: {
          $type: "pub.leaflet.blocks.header",
          level: header[1].length,
          plaintext,
          ...(facets.length ? { facets } : {}),
        },
      });
      i++;
      continue;
    }

    // horizontal rule
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      flushParagraph(para);
      para = [];
      blocks.push({ block: { $type: "pub.leaflet.blocks.horizontalRule" } });
      i++;
      continue;
    }

    // blockquote (consume consecutive)
    if (/^>\s?/.test(line)) {
      flushParagraph(para);
      para = [];
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      const { plaintext, facets } = parseInline(quote.join(" ").trim());
      blocks.push({
        block: {
          $type: "pub.leaflet.blocks.blockquote",
          plaintext,
          ...(facets.length ? { facets } : {}),
        },
      });
      continue;
    }

    // unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      flushParagraph(para);
      para = [];
      const items: ListItem[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        const { plaintext, facets } = parseInline(lines[i].replace(/^\s*[-*]\s+/, ""));
        items.push({
          content: {
            $type: "pub.leaflet.blocks.text",
            plaintext,
            ...(facets.length ? { facets } : {}),
          },
        });
        i++;
      }
      blocks.push({ block: { $type: "pub.leaflet.blocks.unorderedList", children: items } });
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      flushParagraph(para);
      para = [];
      const items: ListItem[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const { plaintext, facets } = parseInline(lines[i].replace(/^\s*\d+\.\s+/, ""));
        items.push({
          content: {
            $type: "pub.leaflet.blocks.text",
            plaintext,
            ...(facets.length ? { facets } : {}),
          },
        });
        i++;
      }
      blocks.push({ block: { $type: "pub.leaflet.blocks.orderedList", children: items } });
      continue;
    }

    // blank line → paragraph break
    if (line.trim() === "") {
      flushParagraph(para);
      para = [];
      i++;
      continue;
    }

    para.push(line);
    i++;
  }
  flushParagraph(para);

  return { $type: "pub.leaflet.pages.linearDocument", blocks };
}

/** Parse inline markdown into plaintext + byte-indexed facets. */
export function parseInline(src: string): { plaintext: string; facets: Facet[] } {
  type Span = { text: string; features: { $type: string; uri?: string }[] };
  const spans: Span[] = [];

  const pattern =
    /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(src))) {
    if (m.index > last) spans.push({ text: src.slice(last, m.index), features: [] });
    if (m[1]) spans.push({ text: m[2], features: [{ $type: "pub.leaflet.richtext.facet#bold" }] });
    else if (m[3]) spans.push({ text: m[4], features: [{ $type: "pub.leaflet.richtext.facet#italic" }] });
    else if (m[5]) spans.push({ text: m[6], features: [{ $type: "pub.leaflet.richtext.facet#italic" }] });
    else if (m[7]) spans.push({ text: m[8], features: [{ $type: "pub.leaflet.richtext.facet#code" }] });
    else if (m[9])
      spans.push({
        text: m[10],
        features: [{ $type: "pub.leaflet.richtext.facet#link", uri: m[11] }],
      });
    last = m.index + m[0].length;
  }
  if (last < src.length) spans.push({ text: src.slice(last), features: [] });

  const encoder = new TextEncoder();
  let plaintext = "";
  let byteOffset = 0;
  const facets: Facet[] = [];

  for (const span of spans) {
    const byteLen = encoder.encode(span.text).length;
    if (span.features.length > 0) {
      facets.push({
        index: { byteStart: byteOffset, byteEnd: byteOffset + byteLen },
        features: span.features as Facet["features"],
      });
    }
    plaintext += span.text;
    byteOffset += byteLen;
  }

  return { plaintext, facets };
}
