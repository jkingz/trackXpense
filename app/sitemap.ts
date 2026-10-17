import type { MetadataRoute } from "next";

import { publicRoutes, site } from "@/lib/site";

/**
 * `/sitemap.xml`. Lists only `publicRoutes` — authenticated routes are excluded
 * because their content is per-session and should never enter the index.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: new URL(route, site.url).toString(),
    lastModified,
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.5,
  }));
}
