import Link from "next/link";
import { getAllTags } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Concepts" };

/** LW wikitags/all-style alphabetical concepts listing, from document tags. */
export default function ConceptsPage() {
  const tags = getAllTags();

  const groups = new Map<string, { tag: string; count: number }[]>();
  for (const t of tags) {
    const letter = /^[a-z]/i.test(t.tag) ? t.tag[0].toUpperCase() : "#";
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push(t);
  }

  return (
    <div>
      <div className="section-title">
        <h1>Concepts</h1>
      </div>
      <p className="mb-4 max-w-[600px] text-[14.3px] text-text-dim3">
        Tags across all indexed posts (the <code className="rounded bg-grey-100 px-1 text-[12px]">tags</code>{" "}
        field of <code className="rounded bg-grey-100 px-1 text-[12px]">pub.leaflet.document</code> records).
      </p>

      {tags.length === 0 ? (
        <div className="bg-paper px-6 py-10 text-center" style={{ borderBottom: "2px solid var(--lw-item-separator)" }}>
          <p className="post-body">No tagged posts have been indexed yet.</p>
        </div>
      ) : (
        <div className="bg-paper px-6 py-4" style={{ borderBottom: "2px solid var(--lw-item-separator)" }}>
          <div className="columns-2 gap-8 sm:columns-3">
            {[...groups.entries()].map(([letter, items]) => (
              <div key={letter} className="break-inside-avoid">
                <div className="concept-letter">{letter}</div>
                {items.map(({ tag, count }) => (
                  <div key={tag}>
                    <Link href={`/concepts/${encodeURIComponent(tag)}`} className="concept-item">
                      {tag}
                      <span className="count">{count}</span>
                    </Link>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
