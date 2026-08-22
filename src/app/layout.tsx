import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { NavSidebar, NavBalance } from "@/components/NavSidebar";
import { NavProvider } from "@/components/nav-context";
import { FloatingEinstein } from "@/components/FloatingEinstein";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Forum";
const BRAND = "PLRD Forum";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.PUBLIC_URL?.startsWith("https") ? process.env.PUBLIC_URL : undefined) ??
  "https://plrd-forum.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: BRAND, template: `%s — ${BRAND}` },
  description:
    "PLRD Forum is a LessWrong-style discussion forum built on ATProto and the standard.site lexicons. Every post, comment, vote, and reaction is a record in the reader's own data repository.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: BRAND,
    title: BRAND,
    description:
      "A LessWrong-style forum built on ATProto — posts, comments, votes, and reactions live in your own PDS.",
  },
};

// JSON-LD entity resolution for agents/crawlers (Organization includes
// contactPoint + address per schema.org completeness conventions).
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND,
    alternateName: `${process.env.NEXT_PUBLIC_SITE_NAME ?? "Forum"} · PL R&D Forum`,
    url: SITE_URL,
    description:
      "A LessWrong-style discussion forum built on ATProto and the standard.site lexicons.",
    inLanguage: "en",
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Polaris Labs R&D",
    url: "https://www.plrd.org",
    description:
      "Research group behind PLRD Forum, an ATProto-native discussion platform.",
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: "research@protocol.ai",
        contactType: "customer support",
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "San Francisco",
      addressRegion: "CA",
      addressCountry: "US",
    },
  },
];

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* warnock-pro / gill-sans-nova via Adobe Fonts, if configured */}
        {process.env.NEXT_PUBLIC_TYPEKIT_ID && (
          <link
            rel="stylesheet"
            href={`https://use.typekit.net/${process.env.NEXT_PUBLIC_TYPEKIT_ID}.css`}
          />
        )}
      </head>
      <body className="min-h-screen bg-bg text-text antialiased">
        <NavProvider>
          <Header />
          <div className="flex">
            <NavSidebar />
            <main className="mx-auto w-full max-w-[765px] px-2 pb-24 sm:px-4">
              {children}
            </main>
            {/* balance the sidebar so the column stays centered, like LW */}
            <NavBalance />
          </div>
          <FloatingEinstein />
        </NavProvider>
      </body>
    </html>
  );
}
