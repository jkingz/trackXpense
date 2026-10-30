import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

/**
 * The root `not-found` renders for every unmatched URL. Until this metadata
 * existed it inherited the landing page's title and identity, so a missing page
 * advertised `/` as its own address. `robots` is explicit because the root
 * layout sets `index: true`; Next also injects a noindex for a 404 status, and
 * both now agree.
 *
 * No `openGraph.url`: a 404 has no address of its own, so it must not claim the
 * origin. The `<title>` goes through the root `title.template`; `og:*`/`twitter:*`
 * are literal because the template only applies to `title`.
 */
const notFoundTitle = "Page Not Found";
const notFoundDescription = "The page you're looking for doesn't exist or has been moved.";

export const metadata: Metadata = {
  title: notFoundTitle,
  description: notFoundDescription,
  robots: { index: false },
  openGraph: {
    type: "website",
    locale: site.locale,
    siteName: site.name,
    title: `${notFoundTitle} — ${site.name}`,
    description: notFoundDescription,
  },
  twitter: {
    card: "summary",
    title: `${notFoundTitle} — ${site.name}`,
    description: notFoundDescription,
  },
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-6xl font-bold --gradient-title mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-gray-600 mb-8">
        Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/">
        <Button>Return Home</Button>
      </Link>
    </div>
  );
}
