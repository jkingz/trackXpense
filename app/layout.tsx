import { type Metadata, type Viewport } from "next";
import { type ReactNode } from "react";
import { Toaster } from "sonner";

import Footer from "@/components/footer";
import Header from "@/components/header";
import { ThemeProviderWrapper } from "@/components/theme-provider";
import { site } from "@/lib/site";
import { themeScript } from "@/lib/theme";
import { firaCode, firaSans } from "./fonts";
import "./globals.css";

// Every text run is Fira: Fira Sans for copy, Fira Code for the figures the
// product prints — balances, amounts, percentages — so columns of money align
// on the decimal. Both are SIL OFL, vendored in `app/fonts/` and exposed as CSS
// variables by `app/fonts.ts`, so no request leaves the browser for a font.

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
  // the homepage. Every public route that needs one declares its own: `/`,
  // `/terms` and `/privacy` through `socialCard`, which replaces this whole
  // block because a child that sets `openGraph` replaces the parent's rather
  // than merging key by key. What stays here is what is true of every route
  // that sets nothing: the site identity. `app/(auth)/layout.tsx` now overrides
  // it too (`noindex`, spec 14 increment 3); the 404 still inherits these
  // values — increment 4 changes that.
  openGraph: {
    type: "website",
    locale: site.locale,
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
      className={`${firaSans.variable} ${firaCode.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        {/* First in <body> so the theme class lands before the browser paints. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
