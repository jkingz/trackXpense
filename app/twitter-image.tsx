import { ImageResponse } from "next/og";

import { OgCard } from "@/lib/og-card";
import { site } from "@/lib/site";

/** X caps a `summary_large_image` card at 5MB. Kept identical to the Open Graph
 *  card so a link looks the same whichever network renders it. */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export const alt = `${site.name} — ${site.tagline}`;

export default async function TwitterImage() {
  return new ImageResponse(<OgCard />, { ...size });
}
