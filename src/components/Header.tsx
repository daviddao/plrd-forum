import Link from "next/link";
import { getSessionDid } from "@/lib/auth/session";
import { getProfile } from "@/lib/atproto/resolve";
import { ThemeToggle } from "./ThemeToggle";
import { HamburgerButton } from "./nav-context";

const FORUM_LABEL = process.env.NEXT_PUBLIC_SITE_NAME ?? "Forum";

/** Port of ForumMagnum's Header: 64px translucent white appBar,
 * with the plresearch.org brand lockup (logo mark + "PL R&D") as wordmark. */
export async function Header() {
  const did = await getSessionDid();
  const profile = did ? await getProfile(did) : null;

  return (
    <header className="site-header sticky top-0 z-50 h-16">
      <div className="flex h-full items-center gap-1 px-2 sm:px-4">
        <HamburgerButton />

        {/* brand lockup — plresearch.org's SiteHeader: pl_logo_mark.svg +
            "PL" (semibold) "R&D" (normal, grey), then the forum suffix in ETBook */}
        <Link href="/" className="site-wordmark no-underline" title="PL R&D Forum">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pl_logo_mark.svg" alt="PL R&D" className="site-logo" />
          <span className="wordmark-text">
            <span className="wordmark-pl">
              PL <span className="wordmark-rd">R&amp;D</span>
            </span>
            <span className="wordmark-divider" aria-hidden="true" />
            <span className="wordmark-forum">{FORUM_LABEL}</span>
          </span>
        </Link>

        <div className="flex-1" />

        <nav className="flex items-center gap-0.5">
          <Link href="/new-post" className="header-button header-cta hidden no-underline sm:flex">
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
            New Post
          </Link>
          <ThemeToggle />
          {profile ? (
            <>
              <Link
                href={`/users/${profile.handle ?? did}`}
                className="header-button flex items-center gap-2 no-underline normal-case"
                style={{ textTransform: "none", fontSize: 14.3 }}
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
                <button className="header-button cursor-pointer opacity-60 hover:opacity-100">
                  Log Out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="header-button no-underline">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
