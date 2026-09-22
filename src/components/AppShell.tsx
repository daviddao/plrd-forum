import { Header } from "@/components/Header";
import { NavSidebar, NavBalance } from "@/components/NavSidebar";
import { NavProvider } from "@/components/nav-context";
import { FloatingEinstein } from "@/components/FloatingEinstein";

/**
 * The forum chrome: sticky header, pinned left nav, centred 765px column
 * (ForumMagnum's Layout + TabNavigationMenu), and the Einstein feedback
 * widget. Used by the `(shell)` route group layout and by the root
 * not-found page so unmatched URLs still get the full frame.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <NavProvider>
      <Header />
      <div className="flex">
        <NavSidebar />
        <main className="mx-auto w-full max-w-[765px] px-2 pb-24 sm:px-4">{children}</main>
        {/* balance the sidebar so the column stays centred, like LW */}
        <NavBalance />
      </div>
      <FloatingEinstein />
    </NavProvider>
  );
}
