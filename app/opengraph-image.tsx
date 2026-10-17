import { ImageResponse } from "next/og";

import { OgCard } from "@/lib/og-card";
import { site } from "@/lib/site";

/** Facebook, LinkedIn and WhatsApp cap Open Graph images at 8MB. 1200x630 is
 *  the size those platforms crop for a large card. */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export const alt = `${site.name} — ${site.tagline}`;

export default async function OpengraphImage() {
  return new ImageResponse(<OgCard />, { ...size });
}
