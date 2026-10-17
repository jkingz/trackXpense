import { ImageResponse } from "next/og";

import { BrandMark } from "@/lib/brand-mark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon. Separate from `app/icon.tsx` because Next.js only
 *  treats this convention as `apple-touch-icon`. iOS does not round the corners
 *  and masks them itself, so the tile renders square here. */
export default async function AppleIcon() {
  return new ImageResponse(
    <div style={{ display: "flex" }}>
      <BrandMark size={180} />
    </div>,
    { ...size },
  );
}
