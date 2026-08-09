import Link from "next/link";
import { getSessionDid } from "@/lib/auth/session";
import { getProfile } from "@/lib/atproto/resolve";
import { ThemeToggle } from "./ThemeToggle";
import { HamburgerButton } from "./nav-context";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "PLRD FORUM";

/** Port of ForumMagnum's Header: 64px translucent white appBar. */
export async function Header() {
  const did = await getSessionDid();
  const profile = did ? await getProfile(did) : null;

  return (
    <header className="site-header sticky top-0 z-50 h-16">
      <div className="flex h-full items-center px-2 sm:px-4">
        <HamburgerButton />

        <Link href="/" className="site-wordmark no-underline">
          {SITE_NAME.toUpperCase()}
        </Link>

        <div className="flex-1" />

        <nav className="flex items-center">
          <Link href="/new-post" className="header-button hidden no-underline sm:block">
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
                  <img src={profile.avatar} alt="" className="h-[22px] w-[22px] rounded-full" />
                )}
                {profile.displayName || profile.handle}
              </Link>
              <form action="/oauth/logout" method="post">
                <button className="header-button cursor-pointer">Log Out</button>
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
