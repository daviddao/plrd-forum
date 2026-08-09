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
  $type: "pub.leaflet.document";
  title: string;
  description?: string;
  author: string;
  publishedAt?: string;
  publication?: string;
  tags?: string[];
  coverImage?: BlobRef;
  pages: LinearDocumentPage[];
};

export type LeafletComment = {
  $type: "pub.leaflet.comment";
  subject: string;
  plaintext: string;
  createdAt: string;
  facets?: Facet[];
  reply?: { parent: string };
};

export type LeafletRecommend = {
  $type: "pub.leaflet.interactions.recommend";
  subject: string;
  createdAt: string;
};

export type LeafletPublication = {
  $type: "pub.leaflet.publication";
  name: string;
  description?: string;
  base_path?: string;
  icon?: BlobRef;
  theme?: {
    backgroundColor?: { $type?: string; hex?: string; [k: string]: unknown };
    primary?: { $type?: string; hex?: string; [k: string]: unknown };
    accentBackground?: { $type?: string; hex?: string; [k: string]: unknown };
    accentText?: { $type?: string; hex?: string; [k: string]: unknown };
    showPageBackground?: boolean;
    [k: string]: unknown;
  };
};

export const DOCUMENT_NSID = "pub.leaflet.document";
export const COMMENT_NSID = "pub.leaflet.comment";
export const RECOMMEND_NSID = "pub.leaflet.interactions.recommend";
export const PUBLICATION_NSID = "pub.leaflet.publication";

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
