"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type NavState = {
  sidebarOpen: boolean; // desktop standalone sidebar
  drawerOpen: boolean; // mobile/tablet slide-out drawer
  toggle: () => void;
  closeDrawer: () => void;
};

const NavContext = createContext<NavState>({
  sidebarOpen: true,
  drawerOpen: false,
  toggle: () => {},
  closeDrawer: () => {},
});

export const useNav = () => useContext(NavContext);

/**
 * Port of ForumMagnum's HideNavigationSidebarContext + NavigationDrawer
 * behavior: on desktop the hamburger toggles the pinned sidebar, on
 * smaller screens it opens a 280px drawer with a backdrop.
 */
export function NavProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("navSidebarOpen");
    if (saved === "false") setSidebarOpen(false);
  }, []);

  const toggle = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1280) {
      setSidebarOpen((open) => {
        localStorage.setItem("navSidebarOpen", String(!open));
        return !open;
      });
    } else {
      setDrawerOpen((open) => !open);
    }
  };

  return (
    <NavContext.Provider
      value={{ sidebarOpen, drawerOpen, toggle, closeDrawer: () => setDrawerOpen(false) }}
    >
      {children}
    </NavContext.Provider>
  );
}

export function HamburgerButton() {
  const { toggle } = useNav();
  return (
    <button
      aria-label="Menu"
      onClick={toggle}
      className="mr-2 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-text hover:bg-black/5 dark:hover:bg-white/10"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
      </svg>
    </button>
  );
}
