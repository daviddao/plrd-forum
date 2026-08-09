import React from "react";
import type {
  LeafletDocument,
  LinearDocumentBlock,
  LeafletBlock,
  TextBlock,
  HeaderBlock,
  ImageBlock,
  ListItem,
} from "./types";
import { RichText } from "./richtext";
import { blobUrl } from "@/lib/atproto/resolve";

type Ctx = { did: string; pds: string | null };

/**
 * Renders a pub.leaflet.document's linearDocument pages as LessWrong-style
 * post body HTML. Styling comes from the `.post-body` class in globals.css.
 */
export function DocumentBody({ doc, did, pds }: { doc: LeafletDocument; did: string; pds: string | null }) {
  const ctx: Ctx = { did, pds };
  return (
    <div className="post-body">
      {(doc.pages ?? []).map((page, i) => (
        <React.Fragment key={page.id ?? i}>
          {(page.blocks ?? []).map((b, j) => (
            <div key={j} data-block-idx={j} data-page-idx={i}>
              <Block entry={b} ctx={ctx} />
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

function alignmentClass(alignment?: string): string | undefined {
  switch (alignment) {
    case "pub.leaflet.pages.linearDocument#textAlignCenter":
    case "#textAlignCenter":
      return "text-center";
    case "pub.leaflet.pages.linearDocument#textAlignRight":
    case "#textAlignRight":
      return "text-right";
    case "pub.leaflet.pages.linearDocument#textAlignJustify":
    case "#textAlignJustify":
      return "text-justify";
    default:
      return undefined;
  }
}

function Block({ entry, ctx }: { entry: LinearDocumentBlock; ctx: Ctx }) {
  const block = entry.block as LeafletBlock & { plaintext?: string; facets?: TextBlock["facets"] };
  const cls = alignmentClass(entry.alignment);

  switch (block.$type) {
    case "pub.leaflet.blocks.text":
      return (
        <p className={cls}>
          <RichText text={block.plaintext ?? ""} facets={block.facets} />
        </p>
      );
    case "pub.leaflet.blocks.header": {
      const h = block as HeaderBlock;
      const level = Math.min(Math.max(h.level ?? 1, 1), 6);
      const Tag = (`h${level}`) as "h1";
      return (
        <Tag className={cls}>
          <RichText text={h.plaintext} facets={h.facets} />
        </Tag>
      );
    }
    case "pub.leaflet.blocks.blockquote":
      return (
        <blockquote className={cls}>
          <p>
            <RichText text={block.plaintext ?? ""} facets={block.facets} />
          </p>
        </blockquote>
      );
    case "pub.leaflet.blocks.code": {
      const c = block as { plaintext: string; language?: string };
      return (
        <pre>
          <code data-language={c.language}>{c.plaintext}</code>
        </pre>
      );
    }
    case "pub.leaflet.blocks.math": {
      const m = block as { tex: string };
      return <pre className="math-block">{m.tex}</pre>;
    }
    case "pub.leaflet.blocks.horizontalRule":
      return <hr />;
    case "pub.leaflet.blocks.image": {
      const img = block as ImageBlock;
      const cid = img.image?.ref?.$link;
      if (!cid) return null;
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={blobUrl(ctx.pds, ctx.did, cid)}
          alt={img.alt ?? ""}
          width={img.aspectRatio?.width}
          height={img.aspectRatio?.height}
        />
      );
    }
    case "pub.leaflet.blocks.unorderedList":
      return <ListBlock items={(block as { children: ListItem[] }).children} ordered={false} ctx={ctx} />;
    case "pub.leaflet.blocks.orderedList":
      return <ListBlock items={(block as { children: ListItem[] }).children} ordered={true} ctx={ctx} />;
    case "pub.leaflet.blocks.website": {
      const w = block as { src: string; title?: string; description?: string };
      return (
        <p className={cls}>
          <a href={w.src} target="_blank" rel="noopener noreferrer">
            {w.title || w.src}
          </a>
        </p>
      );
    }
    default:
      // Unknown block types (iframe/html/bskyPost/...) — render plaintext if available
      if (typeof block.plaintext === "string") {
        return (
          <p className={cls}>
            <RichText text={block.plaintext} facets={block.facets} />
          </p>
        );
      }
      return null;
  }
}

function ListBlock({ items, ordered, ctx }: { items: ListItem[]; ordered: boolean; ctx: Ctx }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag>
      {(items ?? []).map((item, i) => {
        const content = item.content as TextBlock | HeaderBlock;
        return (
          <li key={i}>
            {typeof item.checked === "boolean" && (
              <input type="checkbox" checked={item.checked} readOnly className="mr-1.5 align-middle" />
            )}
            <RichText text={content?.plaintext ?? ""} facets={content?.facets} />
            {item.children && item.children.length > 0 && (
              <ListBlock items={item.children} ordered={false} ctx={ctx} />
            )}
          </li>
        );
      })}
    </Tag>
  );
}
