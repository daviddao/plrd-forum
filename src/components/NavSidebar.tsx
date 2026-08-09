import Link from "next/link";
import { compassIcon } from "./icons/compassIcon";
import { allPostsIcon } from "./icons/allPostsIcon";
import { conceptsIcon } from "./icons/conceptsIcon";
import { BookIcon } from "./icons/bookIcon";

/**
 * Port of ForumMagnum's TabNavigationMenu standalone sidebar,
 * using LW's exact icon SVGs (compass / allPosts / concepts / book).
 */
export function NavSidebar() {
  return (
    <nav className="sticky top-16 hidden w-[210px] shrink-0 flex-col self-start pt-8 pl-4 xl:flex">
      <Link href="/" className="nav-item no-underline">
        <span className="nav-icon">{compassIcon}</span>
        Home
      </Link>
      <Link href="/" className="nav-item no-underline">
        <span className="nav-icon">{allPostsIcon}</span>
        All Posts
      </Link>
      <Link href="/concepts" className="nav-item no-underline">
        <span className="nav-icon">{conceptsIcon}</span>
        Concepts
      </Link>
      <Link href="/library" className="nav-item no-underline">
        <span className="nav-icon">
          <BookIcon />
        </span>
        Library
      </Link>

      <Link href="/new-post" className="nav-sub-item mt-1 no-underline">
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
