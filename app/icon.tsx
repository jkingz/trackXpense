import { ImageResponse } from "next/og";

import { BrandMark } from "@/lib/brand-mark";
import { site } from "@/lib/site";

export const contentType = "image/png";

/**
 * Every consumer size from one source: the 32px tab favicon, the 192px mark
 * Google surfaces in search results, and the 512px Windows tile. Next.js emits
 * the matching `<link rel="icon">` tags from this list, so `metadata.icons`
 * never has to be hand-maintained. The iOS home-screen icon lives in
 * `app/apple-icon.tsx`, which is a separate file convention.
 */
export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 }, alt: site.name },
    { id: "192", size: { width: 192, height: 192 }, alt: site.name },
    { id: "512", size: { width: 512, height: 512 }, alt: site.name },
  ].map((image) => ({ ...image, contentType }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const size = Number(await id);

  return new ImageResponse(<BrandMark size={size} />, {
    width: size,
    height: size,
  });
}
