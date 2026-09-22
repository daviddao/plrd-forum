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
 * Port of ForumMagnum's TabNavigationMenu:
 * - standalone pinned sidebar on wide screens (always visible, like LW home)
 * - NavigationDrawer opened by the hamburger at any width — a 280px paper
 *   sliding in from the left (MUI Slide: 225ms ease-out in, 195ms sharp out)
 *   with a fading backdrop.
 */
export function NavSidebar() {
  const { drawerOpen, closeDrawer } = useNav();
  const pathname = usePathname();

  // close the drawer on navigation
  useEffect(() => {
    closeDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // LW post pages surrender the left rail to the FixedPositionToC — the
  // nav is only reachable via the hamburger drawer there (FM PostsPage
  // renders MultiToCLayout instead of TabNavigationMenu's standalone column)
  const onPostPage = pathname?.startsWith("/posts/");

  return (
    <>
      {/* pinned standalone sidebar (wide screens, not on post pages) */}
      {!onPostPage && (
        <nav className="sticky top-16 hidden max-h-[calc(100vh-64px)] w-[210px] shrink-0 flex-col self-start overflow-y-auto pt-8 pl-4 xl:flex">
          <NavContent />
        </nav>
      )}

      <Drawer open={drawerOpen} onClose={closeDrawer}>
        <NavContent onNavigate={closeDrawer} />
      </Drawer>
    </>
  );
}

/**
 * Minimal port of MUI's temporary Drawer as used by NavigationDrawer.tsx:
 * Slide transition with theme.transitions timings + backdrop fade. The
 * drawer stays mounted; CSS handles enter/leave and hides it from hit
 * testing and the tab order while closed (see `.drawer-root`).
 */
function Drawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // close on Escape, lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  return (
    <div className={`drawer-root ${open ? "drawer-open" : ""}`} aria-hidden={!open}>
      <div className="drawer-backdrop" onClick={onClose} />
      <nav className="drawer-paper">{children}</nav>
    </div>
  );
}

/** Right-side spacer matching the pinned sidebar width, keeps the column centered. */
export function NavBalance() {
  const pathname = usePathname();
  if (pathname?.startsWith("/posts/")) return null; // ToC replaces the rail
  return <div className="hidden w-[210px] shrink-0 xl:block" />;
}

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <Link href="/" className="nav-item no-underline" onClick={onNavigate}>
        <span className="nav-icon">{compassIcon}</span>
        Home
      </Link>
      <Link href="/allPosts" className="nav-item no-underline" onClick={onNavigate}>
        <span className="nav-icon">{allPostsIcon}</span>
        All Posts
      </Link>
      <Link href="/concepts" className="nav-item no-underline" onClick={onNavigate}>
        <span className="nav-icon">{conceptsIcon}</span>
        Concepts
      </Link>
      <Link href="/library" className="nav-item no-underline" onClick={onNavigate}>
        <span className="nav-icon">
          <BookIcon />
        </span>
        Library
      </Link>

      <Link href="/new-post" className="nav-sub-item mt-1 no-underline" onClick={onNavigate}>
        New Post
      </Link>

      <div className="mt-4 mb-2 h-px w-[140px] bg-(--lw-border-faint)" />

      <a href="https://standard.site" target="_blank" rel="noopener noreferrer" className="nav-sub-item no-underline">
        standard.site
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
