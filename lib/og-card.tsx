import { BrandMark } from "@/lib/brand-mark";
import { site } from "@/lib/site";

/**
 * The 1200x630 social preview card, shared verbatim by
 * `app/opengraph-image.tsx` and `app/twitter-image.tsx`. Those two are separate
 * file conventions on purpose — Next.js only fills `twitter:image` from a
 * `twitter-image` file — so the design lives here rather than being copied.
 *
 * Dark aurora ground mirrors `.app-aurora` in globals.css, so a shared link
 * reads as the product. Headlines stay under ~30 characters per line because
 * both platforms crop to roughly the first 60-80 characters of the description.
 */
export function OgCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0b1120",
        padding: 72,
      }}
    >
      {/* Ambient colour wash, mirroring the `.blob` layers in globals.css. */}
      <div
        style={{
          position: "absolute",
          top: -220,
          right: -160,
          width: 760,
          height: 760,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(14,165,233,0.45) 0%, rgba(14,165,233,0) 70%)",
          display: "flex",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -280,
          left: -140,
          width: 720,
          height: 720,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(15,118,110,0.5) 0%, rgba(15,118,110,0) 70%)",
          display: "flex",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <BrandMark size={72} />
        <div
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: "#f8fafc",
            letterSpacing: -0.5,
            display: "flex",
          }}
        >
          {site.name}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 82,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2.5,
            color: "#f8fafc",
            display: "flex",
          }}
        >
          Log the expense.
        </div>
        <div
          style={{
            fontSize: 82,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2.5,
            // A flat brand tint, not the landing page's `.--gradient-title`:
            // satori has no `background-clip: text`, so a gradient here paints
            // the whole box instead of the glyphs.
            color: "#2dd4bf",
            display: "flex",
          }}
        >
          Watch the balance move.
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            lineHeight: 1.4,
            color: "#94a3b8",
            maxWidth: 880,
            display: "flex",
          }}
        >
          A two-account ledger you fill in yourself. One entry, one category, and your balance and
          budget headroom change the moment you save.
        </div>
      </div>
    </div>
  );
}
