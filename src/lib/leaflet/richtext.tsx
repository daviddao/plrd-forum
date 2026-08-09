import React from "react";
import type { Facet, FacetFeature } from "./types";
import { UserTooltip } from "@/components/UserTooltip";
import { LinkPreview } from "@/components/LinkPreview";

/**
 * Render leaflet plaintext + facets (byte-indexed, like app.bsky richtext)
 * into React nodes. Facets use UTF-8 byte offsets.
 */
export function RichText({ text, facets }: { text: string; facets?: Facet[] | null }) {
  if (!facets || facets.length === 0) return <>{text}</>;

  const bytes = new TextEncoder().encode(text);
  const decoder = new TextDecoder();
  const sorted = [...facets]
    .filter((f) => f?.index && f.index.byteStart < f.index.byteEnd)
    .sort((a, b) => a.index.byteStart - b.index.byteStart);

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  const slice = (start: number, end: number) => decoder.decode(bytes.subarray(start, end));

  for (const facet of sorted) {
    const { byteStart, byteEnd } = facet.index;
    if (byteStart < cursor) continue; // skip overlapping facets
    if (byteStart > cursor) nodes.push(<React.Fragment key={key++}>{slice(cursor, byteStart)}</React.Fragment>);
    nodes.push(
      <FacetSpan key={key++} features={facet.features ?? []}>
        {slice(byteStart, Math.min(byteEnd, bytes.length))}
      </FacetSpan>,
    );
    cursor = Math.min(byteEnd, bytes.length);
  }
  if (cursor < bytes.length) nodes.push(<React.Fragment key={key++}>{slice(cursor, bytes.length)}</React.Fragment>);

  return <>{nodes}</>;
}

function FacetSpan({ features, children }: { features: FacetFeature[]; children: React.ReactNode }) {
  let node = children;
  let href: string | null = null;
  let mentionDid: string | null = null;

  for (const f of features) {
    const t = f.$type;
    if (t === "pub.leaflet.richtext.facet#link" && "uri" in f) href = String(f.uri);
    else if (t === "pub.leaflet.richtext.facet#didMention" && "did" in f)
      mentionDid = String(f.did);
    else if (t === "pub.leaflet.richtext.facet#bold") node = <strong>{node}</strong>;
    else if (t === "pub.leaflet.richtext.facet#italic") node = <em>{node}</em>;
    else if (t === "pub.leaflet.richtext.facet#code") node = <code>{node}</code>;
    else if (t === "pub.leaflet.richtext.facet#strikethrough") node = <s>{node}</s>;
    else if (t === "pub.leaflet.richtext.facet#underline") node = <u>{node}</u>;
    else if (t === "pub.leaflet.richtext.facet#highlight") node = <mark>{node}</mark>;
  }

  // user mention (e.g. "@flo-bit.dev") — leaflet's didMention facet. Link to
  // the forum profile and give it the same hover card as author names.
  if (mentionDid) {
    const label = typeof children === "string" ? children : String(children ?? "");
    return (
      <UserTooltip did={mentionDid} name={label}>
        <a href={`/users/${mentionDid}`} className="facet-mention">
          {node}
        </a>
      </UserTooltip>
    );
  }

  if (href) {
    // LW-style hover previews: post links get the preview card, everything
    // else gets the URL in the dark tooltip (FM HoverPreviewLink)
    const external = /^https?:\/\//.test(href);
    return (
      <LinkPreview href={href} external={external}>
        {node}
      </LinkPreview>
    );
  }
  return <>{node}</>;
}
