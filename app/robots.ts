import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

/**
 * `/robots.txt`. Only the marketing page is crawlable: the ledger routes are
 * per-user and render nothing useful to a crawler, and `/api` is machine-only.
 * `llms.txt` is advertised so AI crawlers that look for it find the structured
 * summary next to the crawl rules.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/transaction", "/account"],
      },
    ],
    sitemap: new URL("/sitemap.xml", site.url).toString(),
    host: site.url,
  };
}
