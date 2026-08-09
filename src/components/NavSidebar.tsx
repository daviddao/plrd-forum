"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useNav } from "./nav-context";
import { compassIcon } from "./icons/compassIcon";
import { allPostsIcon } from "./icons/allPostsIcon";
import { conceptsIcon } from "./icons/conceptsIcon";
import { BookIcon } from "./icons/bookIcon";

/**
 * Port of ForumMagnum's TabNavigationMenu (standalone sidebar +
 * NavigationDrawer), using LW's exact icon SVGs.
 */
export function NavSidebar() {
  const { sidebarOpen, drawerOpen, closeDrawer } = useNav();
  const pathname = usePathname();

  // close the drawer on navigation
  useEffect(() => {
    closeDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* desktop standalone sidebar */}
      {sidebarOpen && (
        <nav className="sticky top-16 hidden max-h-[calc(100vh-64px)] w-[210px] shrink-0 flex-col self-start overflow-y-auto pt-8 pl-4 xl:flex">
          <NavContent />
        </nav>
      )}

      {/* drawer (below xl), LW NavigationDrawer: 280px paper + backdrop */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[1100] xl:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          <nav className="absolute top-0 left-0 h-full w-[280px] overflow-y-auto bg-paper pt-6 pl-5 shadow-xl">
            <NavContent />
          </nav>
        </div>
      )}
    </>
  );
}

/** Right-side spacer matching the sidebar width so the column stays centered. */
export function NavBalance() {
  const { sidebarOpen } = useNav();
  if (!sidebarOpen) return null;
  return <div className="hidden w-[210px] shrink-0 xl:block" />;
}

function NavContent() {
  return (
    <>
      <Link href="/" className="nav-item no-underline">
        <span className="nav-icon">{compassIcon}</span>
        Home
      </Link>
      <Link href="/allPosts" className="nav-item no-underline">
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

      <a href="https://leaflet.pub" target="_blank" rel="noopener noreferrer" className="nav-sub-item no-underline">
        leaflet.pub
      </a>
      <a href="https://atproto.com" target="_blank" rel="noopener noreferrer" className="nav-sub-item no-underline">
        AT Protocol
      </a>
      <a href="https://www.lesswrong.com" target="_blank" rel="noopener noreferrer" className="nav-sub-item no-underline">
        Styled after LessWrong
      </a>
    </>
  );
}
