import Link from "next/link";
import { getSessionDid } from "@/lib/auth/session";
import { getProfile } from "@/lib/atproto/resolve";
import { SITE_NAME, SITE_ORG } from "@/lib/site";
import { ThemeToggle } from "./ThemeToggle";
import { HamburgerButton } from "./nav-context";

/** ForumMagnum's 64px sticky appBar with the Open Lab brand lockup
 * (`.lab-brand`: logo mark, site name, organisation caption). */
export async function Header() {
  const did = await getSessionDid();
  const profile = did ? await getProfile(did) : null;

  return (
    <header className="site-header sticky top-0 z-50 h-16">
      <div className="flex h-full items-center gap-1 px-2 sm:px-4">
        <HamburgerButton />

        <Link href="/" className="site-wordmark no-underline" title={`${SITE_NAME} by ${SITE_ORG}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pl_logo_mark.svg" alt="" className="site-logo" />
          <span className="wordmark-text">
            {SITE_NAME}
            <span className="wordmark-org">By {SITE_ORG}</span>
          </span>
        </Link>

        <div className="flex-1" />

        <nav className="flex items-center gap-1">
          <Link href="/new-post" className="header-button header-cta hidden no-underline sm:inline-flex">
            <svg
              className="h-[13px] w-[13px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            New post
          </Link>
          <ThemeToggle />
          {profile ? (
            <>
              <Link
                href={`/users/${profile.handle ?? did}`}
                className="header-button inline-flex gap-2 no-underline"
              >
                {profile.avatar && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar}
                    alt=""
                    className="h-[24px] w-[24px] rounded-full ring-1 ring-black/10 dark:ring-white/15"
                  />
                )}
                {profile.displayName || profile.handle}
              </Link>
              <form action="/oauth/logout" method="post">
                <button className="header-button inline-flex cursor-pointer">Log out</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="header-button inline-flex no-underline">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
