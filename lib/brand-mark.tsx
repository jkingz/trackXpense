/**
 * The TrackXpense mark, drawn with `next/og` primitives only.
 *
 * Shared by `app/icon.tsx` (tab, search and Windows-tile sizes) and
 * `app/apple-icon.tsx` (the 180px home-screen icon), so the brand glyph is
 * defined once. Satori supports a flexbox subset and no SVG, so the "rising
 * balance arrow" is built from rounded bars and 45° rotations rather than a
 * path — and satori has no `transform-origin`, so the head bars carry explicit
 * offsets instead.
 *
 * `size` is the edge of the square tile; every dimension below is a ratio of
 * it, so the same component renders crisply at 32px and at 1200px.
 */
export function BrandMark({ size = 128 }: { size?: number }) {
  const r = (n: number) => Math.round(size * n);

  // Arrow geometry, expressed against the tile so it scales with `size`.
  const stroke = r(0.055);
  const shaftH = r(0.2);
  const barLen = r(0.17);
  const headBox = barLen + stroke;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r(0.22),
        background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 45%, #0f766e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Ledger card. */}
      <div
        style={{
          width: r(0.64),
          height: r(0.52),
          borderRadius: r(0.09),
          background: "#ffffff",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          paddingBottom: r(0.08),
          paddingRight: r(0.1),
          position: "relative",
        }}
      >
        {/* Balance line: the figure the arrow is climbing away from. */}
        <div
          style={{
            position: "absolute",
            top: r(0.11),
            left: r(0.11),
            width: r(0.3),
            height: r(0.055),
            borderRadius: r(0.028),
            background: "#cbd5e1",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: r(0.27),
            left: r(0.11),
            width: r(0.2),
            height: r(0.055),
            borderRadius: r(0.028),
            background: "#cbd5e1",
            display: "flex",
          }}
        />

        {/* Arrow: shaft below, chevron head above. The two head bars are
            offset from the chevron's centre by L·√2/2 so that after the 45°
            rotation their upper ends meet over the shaft. Satori has no
            `transform-origin`, so the offsets have to be explicit. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              position: "relative",
              width: headBox,
              height: headBox,
              display: "flex",
            }}
          >
            {[-1, 1].map((side) => (
              <div
                key={side}
                style={{
                  position: "absolute",
                  left: headBox / 2 + side * (barLen / 2) * 0.707 - stroke / 2,
                  top: headBox / 2 + (barLen / 2) * 0.707 - stroke / 2,
                  width: barLen,
                  height: stroke,
                  borderRadius: stroke,
                  background: "#0f766e",
                  transform: `rotate(${side * 45}deg)`,
                  display: "flex",
                }}
              />
            ))}
          </div>
          <div
            style={{
              width: stroke,
              height: shaftH,
              marginTop: -stroke / 2,
              borderRadius: stroke,
              background: "#0f766e",
              display: "flex",
            }}
          />
        </div>
      </div>
    </div>
  );
}
