/**
 * Single source of truth for the public identity of the site. Every URL-based
 * metadata field (canonical, Open Graph, sitemap, robots, JSON-LD) composes
 * against `site.url`, so pointing the app at a new domain is one env var.
 *
 * NEXT_PUBLIC_APP_URL is inlined at build time by Next.js, which is what we
 * want: metadata and JSON-LD must be correct in the prerendered HTML, not read
 * at request time.
 */
const url = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const site = {
  url,
  name: "TrackXpense",
  /** Title tag + og:title + twitter:title. */
  title: "TrackXpense — expense tracker that moves the moment you log",
  /** Meta description + og:description + twitter:description. ~155 chars. */
  description:
    "A personal expense tracker you fill in yourself. Log an entry, pick a category, and your running balance and budget headroom update the moment you save it.",
  /** Short blurb for JSON-LD and llms.txt. */
  tagline: "Log the expense. Watch the balance move.",
  locale: "en_US",
} as const;

/**
 * Public routes. Anything authenticated (dashboard, transaction, account) is
 * deliberately absent: it has no indexable content and must not enter the
 * sitemap or the crawler link graph.
 */
export const publicRoutes = ["/"] as const;
