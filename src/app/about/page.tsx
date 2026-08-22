import Link from "next/link";

export const metadata = {
  title: "About",
  description:
    "What PLRD Forum is: a LessWrong-style discussion forum built on ATProto, where every post, comment, vote, and reaction is a record in the author's own data repository.",
};

export default function AboutPage() {
  return (
    <div className="lw-card mt-8 px-8 py-10">
      <h1 className="serif-title pb-1 text-[26px]">About PLRD Forum</h1>
      <div className="post-body">
        <p>
          PLRD Forum is a reading and discussion community maintained by Polaris
          Labs R&D. It is a faithful port of the visual design of LessWrong,
          running on entirely different foundations: the AT Protocol. Where
          traditional forums keep everything in a private database, PLRD Forum
          stores each post, comment, vote, and reaction as a signed record in
          the author's own data repository (PDS), published with the open{" "}
          <code>site.standard.*</code> lexicons (originally created for
          leaflet.pub).
        </p>
        <p>
          The site itself is only an index. It watches the ATProto firehose and
          aggregates records from authors who have opted in by posting here or
          being backfilled. Delete your records at the source and they disappear
          from this index too. Your identity is your decentralized identifier
          (DID) — sign in with any Bluesky handle, no separate password.
        </p>
        <p>
          Karma is positive-only and equals the number of recommend records on a
          post; comments thread through parent links; reactions are short-form
          comments with named labels like "Agreed" or "Insightful", in the
          LessWrong tradition.
        </p>
        <p>
          Agents and developers: see <Link href="/docs">/docs</Link> for
          machine-readable endpoints, the OpenAPI description, llms.txt, and an
          MCP server.
        </p>
      </div>
    </div>
  );
}
