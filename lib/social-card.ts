import type { Metadata } from "next";

import { site } from "@/lib/site";

/**
 * One page's share metadata, so `<title>`, `og:*`, `twitter:*`, `og:url` and the
 * canonical cannot disagree.
 *
 * The defect this closes: a page that set only `metadata.title` kept the root
 * layout's `og:title`, because `openGraph` and `twitter` are separate keys that
 * are shallow-merged down the tree rather than derived from `title`. Filling all
 * of them from one argument removes the chance to set one and forget another.
 *
 * `path` is a literal written in the calling file, never read from a request —
 * these values are build-time constants and nothing user-supplied reaches them.
 * Relative on purpose: `metadataBase` in the root layout resolves it to a full
 * URL, so the host still lives in one place (`lib/site.ts`).
 *
 * A caller that uses this replaces the root layout's entire `openGraph` block,
 * not just the keys it sets — Next merges metadata per field, not per key. The
 * `og:image` tags come from that same block at render time, so a card built
 * here must carry `images` itself or the shared link falls back to a bare text
 * card.
 */
export function socialCard({
  title,
  description = site.description,
  path,
}: {
  title: string;
  description?: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: site.locale,
      url: path,
      siteName: site.name,
      title,
      description,
      // Spelled out because this block replaces the root layout's wholesale, and
      // the `opengraph-image` file convention does not fill a block a page has
      // already declared: without this, `/terms` and `/privacy` render a card
      // with no image at all (measured 2026-10-27).
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${site.name} — ${site.tagline}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/twitter-image"],
    },
  };
}
