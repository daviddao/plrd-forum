import { getPublications } from "@/lib/queries";
import { LibraryCard } from "@/components/LibraryCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Library" };

/** LW /library-style grid; entries are pub.leaflet.publication records. */
export default async function LibraryPage() {
  const publications = await getPublications();

  return (
    <div>
      <div className="section-title">
        <h1>The Library</h1>
      </div>
      <p className="mb-5 max-w-[600px] text-[14.3px] text-text-dim3">
        Publications from the leaflet network — collections of posts by a
        single author or team, like LessWrong&apos;s sequences.
      </p>

      {publications.length === 0 ? (
        <div className="bg-paper px-6 py-10 text-center" style={{ borderBottom: "2px solid var(--lw-item-separator)" }}>
          <p className="post-body">No publications have been indexed yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {publications.map((pub) => (
            <LibraryCard key={pub.uri} pub={pub} />
          ))}
        </div>
      )}
    </div>
  );
}
