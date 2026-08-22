import Link from "next/link";

export const metadata = {
  title: "Contact",
  description:
    "How to reach the PLRD Forum maintainers: email, ATProto, and GitHub.",
};

export default function ContactPage() {
  return (
    <div className="lw-card mt-8 px-8 py-10">
      <h1 className="serif-title pb-1 text-[26px]">Contact</h1>
      <div className="post-body">
        <p>
          PLRD Forum is maintained by Polaris Labs R&D. For questions about the
          forum, moderation concerns, or data requests (including deletion of
          indexed records), email{" "}
          <a href="mailto:research@protocol.ai">research@protocol.ai</a> — we
          read everything sent there and typically respond within a few days.
        </p>
        <p>
          You can also reach the maintainer on ATProto at{" "}
          <a href="https://bsky.app/profile/daviddao.org" rel="noopener">
            daviddao.org
          </a>{" "}
          , or open an issue on the source repository. Because all content lives
          in users' own PDS repositories, most content questions are best
          answered by the author directly — every post page links to the
          author's ATProto handle.
        </p>
        <p>
          For security issues, please email the address above with the subject
          line "security" rather than opening a public issue.
        </p>
      </div>
    </div>
  );
}
