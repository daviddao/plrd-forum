import Link from "next/link";

/** Port of ForumMagnum's TabNavigationMenu standalone sidebar. */
export function NavSidebar() {
  return (
    <nav className="sticky top-16 hidden w-[210px] shrink-0 flex-col self-start pt-8 pl-4 xl:flex">
      <Link href="/" className="nav-item no-underline">
        <CompassIcon />
        Home
      </Link>
      <Link href="/" className="nav-item no-underline">
        <ListIcon />
        All Posts
      </Link>
      <Link href="/new-post" className="nav-item no-underline">
        <PenIcon />
        New Post
      </Link>

      <div className="mt-4 mb-2 h-px w-[140px] bg-(--lw-border-faint)" />

      <a
        href="https://leaflet.pub"
        target="_blank"
        rel="noopener noreferrer"
        className="nav-sub-item no-underline"
      >
        leaflet.pub
      </a>
      <a
        href="https://atproto.com"
        target="_blank"
        rel="noopener noreferrer"
        className="nav-sub-item no-underline"
      >
        AT Protocol
      </a>
      <a
        href="https://www.lesswrong.com"
        target="_blank"
        rel="noopener noreferrer"
        className="nav-sub-item no-underline"
      >
        Styled after LessWrong
      </a>
    </nav>
  );
}

function CompassIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
