"use client";

import React, { createContext, useContext, useState } from "react";

type NavState = {
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const NavContext = createContext<NavState>({
  drawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
});

export const useNav = () => useContext(NavContext);

/**
 * Port of ForumMagnum's Header navigation state: the hamburger always opens
 * the temporary NavigationDrawer (MUI Drawer slide-in); the pinned standalone
 * sidebar on wide screens is independent and always visible.
 */
export function NavProvider({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <NavContext.Provider
      value={{
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
      }}
    >
      {children}
    </NavContext.Provider>
  );
}

export function HamburgerButton() {
  const { openDrawer } = useNav();
  return (
    <button
      aria-label="Menu"
      onClick={openDrawer}
      className="mr-2 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full text-text hover:bg-black/5 dark:hover:bg-white/10"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
      </svg>
    </button>
  );
}
