import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { NavSidebar } from "@/components/NavSidebar";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "PLRD Forum";

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s — ${SITE_NAME}` },
  description:
    "A LessWrong-style forum built on ATProto and pub.leaflet lexicons.",
};

const themeInit = `
try {
  var t = localStorage.getItem("theme");
  if (t === "dark" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.classList.add("dark");
  }
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {/* warnock-pro / gill-sans-nova via Adobe Fonts, if configured */}
        {process.env.NEXT_PUBLIC_TYPEKIT_ID && (
          <link
            rel="stylesheet"
            href={`https://use.typekit.net/${process.env.NEXT_PUBLIC_TYPEKIT_ID}.css`}
          />
        )}
      </head>
      <body className="min-h-screen bg-bg text-text antialiased">
        <Header />
        <div className="flex">
          <NavSidebar />
          <main className="mx-auto w-full max-w-[765px] px-2 pb-24 sm:px-4">
            {children}
          </main>
          {/* balance the sidebar so the column stays centered, like LW */}
          <div className="hidden w-[210px] shrink-0 xl:block" />
        </div>
      </body>
    </html>
  );
}
