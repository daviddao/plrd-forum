import { SITE_CONTACT_EMAIL, SITE_NAME, SITE_ORG_NAME } from "@/lib/site";

export const metadata = {
  title: "Contact",
  description: `How to reach the ${SITE_NAME} maintainers: email, ATProto, and GitHub.`,
};

export default function ContactPage() {
  return (
    <div className="lw-card mt-8 px-8 py-10">
      <h1 className="serif-title pb-1 text-[26px]">Contact</h1>
      <div className="post-body">
        <p>
          {SITE_NAME} is maintained by {SITE_ORG_NAME}. For questions about the
          site, moderation concerns, or data requests (including deletion of
          indexed records), email{" "}
          <a href={`mailto:${SITE_CONTACT_EMAIL}`}>{SITE_CONTACT_EMAIL}</a>. We
          read everything sent there and typically respond within a few days.
        </p>
        <p>
          You can also reach the maintainer on ATProto at{" "}
          <a href="https://bsky.app/profile/daviddao.org" rel="noopener">
            daviddao.org
          </a>{" "}
          , or open an issue on the source repository. Because all content lives
          in users’ own PDS repositories, most content questions are best
          answered by the author directly; every post page links to the
          author’s ATProto handle.
        </p>
        <p>
          For security issues, please email the address above with the subject
          line “security” rather than opening a public issue.
        </p>
      </div>
    </div>
  );
}
