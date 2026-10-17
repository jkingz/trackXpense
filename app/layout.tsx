import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { type Metadata, type Viewport } from "next";
import { type ReactNode } from "react";
import { Toaster } from "sonner";

import Footer from "@/components/footer";
import Header from "@/components/header";
import { ThemeProviderWrapper } from "@/components/theme-provider";
import { site } from "@/lib/site";
import "./globals.css";

// Type pairs HarmonyOS Sans (where installed — the family many of our readers
// already have) with Geist as the everywhere-else sans, and every figure the
// product prints — balances, amounts, percentages — goes through Geist Mono so
// columns of money align on the decimal. Self-hosted via the `geist` package,
// no runtime font fetch. Exposed as CSS variables, never as a className.

/**
 * Site-wide metadata. Icons and social images are NOT listed here: `app/icon.tsx`,
 * `app/apple-icon.tsx`, `app/opengraph-image.tsx` and `app/twitter-image.tsx` are
 * file conventions, and Next.js emits the matching `<link>`/`og:image` tags from
 * them. Restating them by hand would only create a second place to drift.
 *
 * `metadataBase` lets every other URL field compose from a root-relative path,
 * and is what makes the canonical link and OG URLs absolute.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "expense tracker",
    "personal finance",
    "budget tracker",
    "spending tracker",
    "expense tracker app",
    "budgeting",
    "money tracking",
    "personal budget app",
  ],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  // No `alternates.canonical` here on purpose. Metadata is shallow-merged down
  // the tree, so a canonical declared in the root layout is inherited by every
  // route — which would tell crawlers /dashboard and /account are duplicates of
  // the homepage. The home page declares its own canonical in `app/page.tsx`.
  openGraph: {
    type: "website",
    locale: site.locale,
    url: site.url,
    siteName: site.name,
    title: site.title,
    description: site.description,
  },
  // X, Discord, Slack and iMessage all read the twitter card when og: is absent
  // or partial; `summary_large_image` is the large-preview variant.
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
};

/** `themeColor` and `colorScheme` moved out of `metadata` in Next.js 14; both
 *  belong to this export now. */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1120" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      // The router reads this to keep `scroll-smooth` (globals.css) without
      // logging "Detected scroll-behavior: smooth" on every navigation.
      data-scroll-behavior="smooth"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div aria-hidden className="app-aurora">
          <span className="blob blob-1" />
          <span className="blob blob-2" />
          <span className="blob blob-3" />
        </div>
        <ThemeProviderWrapper>
          {/* Header owns its own Suspense boundary: the bar paints immediately
              and only the auth-aware slot waits on the database. */}
          <Header />
          <main className="flex min-h-[calc(100vh-9rem)] w-full flex-col">{children}</main>
          <Toaster richColors />
          <Footer />
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
