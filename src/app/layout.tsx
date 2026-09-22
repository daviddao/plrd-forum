import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import "./globals.css";
import {
  SITE_NAME,
  SITE_ORG,
  SITE_ORG_NAME,
  SITE_ORG_URL,
  SITE_CONTACT_EMAIL,
  SITE_TAGLINE,
  SITE_TAGLINE_SHORT,
  SITE_URL,
} from "@/lib/site";

/* Display serif from the Open Lab design (open-lab-two.vercel.app), self-hosted
 * at build time by next/font so no runtime font CDN is contacted. Aileron, the
 * UI sans, is bundled under public/fonts and declared in globals.css. */
const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-newsreader",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_TAGLINE,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_TAGLINE_SHORT,
  },
};

// JSON-LD entity resolution for agents/crawlers (Organization includes
// contactPoint + address per schema.org completeness conventions).
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: `${SITE_NAME} by ${SITE_ORG}`,
    url: SITE_URL,
    description: SITE_TAGLINE_SHORT,
    inLanguage: "en",
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_ORG_NAME,
    url: SITE_ORG_URL,
    description: `Research group behind ${SITE_NAME}, an ATProto-native discussion platform.`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: SITE_CONTACT_EMAIL,
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
    <html lang="en" suppressHydrationWarning className={newsreader.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* warnock-pro via Adobe Fonts for post bodies, if configured */}
        {process.env.NEXT_PUBLIC_TYPEKIT_ID && (
          <link
            rel="stylesheet"
            href={`https://use.typekit.net/${process.env.NEXT_PUBLIC_TYPEKIT_ID}.css`}
          />
        )}
      </head>
      <body className="min-h-screen bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
