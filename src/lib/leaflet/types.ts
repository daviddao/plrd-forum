/** Minimal TS types for the pub.leaflet.* lexicons we consume/produce. */

export type BlobRef = {
  $type: "blob";
  ref: { $link: string };
  mimeType: string;
  size: number;
};

export type ByteSlice = { byteStart: number; byteEnd: number };

export type FacetFeature =
  | { $type: "pub.leaflet.richtext.facet#link"; uri: string }
  | { $type: "pub.leaflet.richtext.facet#bold" }
  | { $type: "pub.leaflet.richtext.facet#italic" }
  | { $type: "pub.leaflet.richtext.facet#code" }
  | { $type: "pub.leaflet.richtext.facet#strikethrough" }
  | { $type: "pub.leaflet.richtext.facet#underline" }
  | { $type: "pub.leaflet.richtext.facet#highlight" }
  | { $type: "pub.leaflet.richtext.facet#id"; id?: string }
  | { $type: string; [k: string]: unknown };

export type Facet = { index: ByteSlice; features: FacetFeature[] };

export type TextBlock = {
  $type: "pub.leaflet.blocks.text";
  plaintext: string;
  facets?: Facet[];
};

export type HeaderBlock = {
  $type: "pub.leaflet.blocks.header";
  level?: number;
  plaintext: string;
  facets?: Facet[];
};

export type BlockquoteBlock = {
  $type: "pub.leaflet.blocks.blockquote";
  plaintext: string;
  facets?: Facet[];
};

export type CodeBlock = {
  $type: "pub.leaflet.blocks.code";
  plaintext: string;
  language?: string;
};

export type MathBlock = { $type: "pub.leaflet.blocks.math"; tex: string };

export type ImageBlock = {
  $type: "pub.leaflet.blocks.image";
  image: BlobRef;
  alt?: string;
  aspectRatio: { width: number; height: number };
};

export type ListItem = {
  content: TextBlock | HeaderBlock | ImageBlock;
  children?: ListItem[];
  checked?: boolean;
};

export type UnorderedListBlock = {
  $type: "pub.leaflet.blocks.unorderedList";
  children: ListItem[];
};

export type OrderedListBlock = {
  $type: "pub.leaflet.blocks.orderedList";
  children: ListItem[];
};

export type HorizontalRuleBlock = { $type: "pub.leaflet.blocks.horizontalRule" };

export type WebsiteBlock = {
  $type: "pub.leaflet.blocks.website";
  src: string;
  title?: string;
  description?: string;
};

export type LeafletBlock =
  | TextBlock
  | HeaderBlock
  | BlockquoteBlock
  | CodeBlock
  | MathBlock
  | ImageBlock
  | UnorderedListBlock
  | OrderedListBlock
  | HorizontalRuleBlock
  | WebsiteBlock
  | { $type: string; [k: string]: unknown };

export type LinearDocumentBlock = {
  block: LeafletBlock;
  alignment?: string;
};

export type LinearDocumentPage = {
  $type: "pub.leaflet.pages.linearDocument";
  id?: string;
  blocks: LinearDocumentBlock[];
};

export type LeafletDocument = {
  $type: string; // "pub.leaflet.document" or "site.standard.document" (normalized)
  title: string;
  description?: string;
  author?: string;
  publishedAt?: string;
  publication?: string;
  tags?: string[];
  coverImage?: BlobRef;
  pages: LinearDocumentPage[];
  /** strongRef to the Bluesky announcement post (site.standard.document) —
   *  source of leaflet's likes/mentions counts */
  bskyPostRef?: { uri: string; cid: string };
};

/** site.standard.document — leaflet's successor lexicon. `content` wraps the
 * same linearDocument pages; `site` replaces `publication`. */
export type StandardDocument = {
  $type: "site.standard.document";
  title: string;
  site: string; // at-uri of a site.standard.publication
  publishedAt: string;
  description?: string;
  path?: string;
  tags?: string[];
  coverImage?: BlobRef;
  content?: { $type: "pub.leaflet.content"; pages: LinearDocumentPage[] };
  textContent?: string;
  bskyPostRef?: { uri: string; cid: string };
};

export type QuotePosition = { block: number[]; offset: number };

export type LinearDocumentQuote = {
  $type: "pub.leaflet.comment#linearDocumentQuote";
  document: string;
  quote: { start: QuotePosition; end: QuotePosition };
};

export type LeafletComment = {
  $type: "pub.leaflet.comment";
  subject: string;
  plaintext: string;
  createdAt: string;
  facets?: Facet[];
  reply?: { parent: string };
  attachment?: LinearDocumentQuote;
};

export type LeafletRecommend = {
  $type: "pub.leaflet.interactions.recommend";
  subject: string;
  createdAt: string;
};

/** site.standard.graph.recommend — the standard.site successor to
 * pub.leaflet.interactions.recommend; the subject field is `document`. */
export type StandardRecommend = {
  $type: "site.standard.graph.recommend";
  document: string; // at-uri of the recommended document
  createdAt: string;
};

/** site.standard.graph.subscription — follow a publication. */
export type StandardSubscription = {
  $type: "site.standard.graph.subscription";
  publication: string; // at-uri of the subscribed publication
  createdAt?: string;
};

export type ThemeColor = { $type?: string; hex?: string; [k: string]: unknown };

export type LeafletPublication = {
  $type: string; // "pub.leaflet.publication" or "site.standard.publication" (normalized)
  name: string;
  description?: string;
  base_path?: string;
  icon?: BlobRef;
  theme?: {
    backgroundColor?: ThemeColor;
    primary?: ThemeColor;
    accentBackground?: ThemeColor;
    accentText?: ThemeColor;
    showPageBackground?: boolean;
    [k: string]: unknown;
  };
};

export type StandardPublication = {
  $type: "site.standard.publication";
  name: string;
  url?: string;
  description?: string;
  icon?: BlobRef;
  theme?: LeafletPublication["theme"];
  basicTheme?: {
    accent?: ThemeColor;
    background?: ThemeColor;
    foreground?: ThemeColor;
    accentForeground?: ThemeColor;
  };
};

export const DOCUMENT_NSID = "pub.leaflet.document";
export const COMMENT_NSID = "pub.leaflet.comment";
export const RECOMMEND_NSID = "pub.leaflet.interactions.recommend";
export const PUBLICATION_NSID = "pub.leaflet.publication";
// leaflet migrated to the site.standard.* lexicons (same block model, new envelope)
export const SITE_DOCUMENT_NSID = "site.standard.document";
export const SITE_PUBLICATION_NSID = "site.standard.publication";
export const SITE_RECOMMEND_NSID = "site.standard.graph.recommend";
export const SITE_SUBSCRIPTION_NSID = "site.standard.graph.subscription";

/** Normalize either document lexicon into the internal LeafletDocument shape
 * the rest of the app consumes (render, excerpts, word counts, quotes). */
export function normalizeDocument(record: unknown): LeafletDocument | null {
  const r = record as { $type?: string; title?: unknown } | null;
  if (!r || typeof r.title !== "string") return null;
  if (r.$type === SITE_DOCUMENT_NSID) {
    const std = r as StandardDocument;
    return {
      $type: SITE_DOCUMENT_NSID,
      title: std.title,
      description: std.description,
      publishedAt: std.publishedAt,
      publication: std.site,
      tags: std.tags,
      coverImage: std.coverImage,
      pages: std.content?.pages ?? [],
      bskyPostRef: std.bskyPostRef,
    };
  }
  const doc = r as LeafletDocument;
  if (!Array.isArray(doc.pages)) return null;
  return doc;
}

/** Normalize either publication lexicon into the LeafletPublication shape.
 * site.standard.publication carries `url` instead of `base_path` and may only
 * have a `basicTheme` — map it onto the legacy theme keys LibraryCard reads. */
export function normalizePublication(record: unknown): LeafletPublication | null {
  const r = record as { $type?: string; name?: unknown } | null;
  if (!r || typeof r.name !== "string") return null;
  if (r.$type === SITE_PUBLICATION_NSID) {
    const std = r as StandardPublication;
    return {
      $type: SITE_PUBLICATION_NSID,
      name: std.name,
      description: std.description,
      base_path: std.url?.replace(/^https?:\/\//, ""),
      icon: std.icon,
      theme:
        std.theme ??
        (std.basicTheme
          ? {
              backgroundColor: std.basicTheme.background,
              primary: std.basicTheme.foreground,
              accentBackground: std.basicTheme.accent,
              accentText: std.basicTheme.accentForeground,
            }
          : undefined),
    };
  }
  return r as LeafletPublication;
}

/** Rough word count across a document's text blocks. */
export function documentWordCount(doc: LeafletDocument): number {
  let words = 0;
  for (const page of doc.pages ?? []) {
    for (const b of page.blocks ?? []) {
      const block = b.block as { plaintext?: string };
      if (typeof block?.plaintext === "string") {
        words += block.plaintext.split(/\s+/).filter(Boolean).length;
      }
    }
  }
  return words;
}

export function firstParagraph(doc: LeafletDocument): string {
  if (doc.description) return doc.description;
  for (const page of doc.pages ?? []) {
    for (const b of page.blocks ?? []) {
      const block = b.block as { $type?: string; plaintext?: string };
      if (block?.$type === "pub.leaflet.blocks.text" && block.plaintext) {
        return block.plaintext;
      }
    }
  }
  return "";
}
