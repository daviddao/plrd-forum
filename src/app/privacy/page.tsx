import Link from "next/link";

export const metadata = {
  title: "Privacy",
  description:
    "PLRD Forum's privacy practices: what the index stores, what stays in your PDS, and how to have records removed.",
};

export default function PrivacyPage() {
  return (
    <div className="lw-card mt-8 px-8 py-10">
      <h1 className="serif-title pb-1 text-[26px]">Privacy</h1>
      <div className="post-body">
        <p>
          PLRD Forum is an index, not a host. When you write a post or comment,
          the record is stored in <em>your</em> ATProto data repository on your
          PDS provider (for example your Bluesky data server). This site keeps a
          local copy of those public records — title, text, author DID,
          timestamps, vote counts — purely to render pages like the frontpage
          and post views.
        </p>
        <p>
          Sign-in uses ATProto OAuth: we never see your app password. The site
          sets one session cookie containing your DID so you stay logged in;
          it is not used for tracking and never shared. We do not run analytics,
          advertising, or third-party trackers. Server logs are kept only for
          operational debugging.
        </p>
        <p>
          Public content you publish here is, naturally, public — visible to
          anyone reading this site and any other app that indexes the ATProto
          network. To remove content from PLRD Forum, delete the record at the
          source (your PDS); the index follows. If something indexed from your
          repository should not be here at all, email{" "}
          <a href="mailto:research@protocol.ai">research@protocol.ai</a> and we
          will exclude your handle from the index.
        </p>
      </div>
    </div>
  );
}
