/** Pocket Log receipt and confirmation badge for generated icons and social cards. */
export function BrandMark({ size = 128, square = false }: { size?: number; square?: boolean }) {
  const px = (ratio: number) => Math.round(size * ratio);
  const ink = "#17116f";

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: size,
        height: size,
        borderRadius: square ? 0 : px(0.22),
        background: "#342bc4",
      }}
    >
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: px(0.19),
          top: px(0.17),
          width: px(0.53),
          height: px(0.64),
          flexDirection: "column",
          gap: px(0.08),
          paddingTop: px(0.17),
          paddingLeft: px(0.105),
          borderRadius: px(0.08),
          background: "#fffdfb",
          boxShadow: `${px(0.05)}px ${px(0.06)}px 0 ${ink}`,
          transform: "rotate(-10deg)",
        }}
      >
        <div
          style={{ width: px(0.29), height: px(0.063), borderRadius: px(0.035), background: ink }}
        />
        <div
          style={{
            width: px(0.21),
            height: px(0.063),
            borderRadius: px(0.035),
            background: "#8077c0",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          position: "absolute",
          right: px(0.11),
          bottom: px(0.15),
          width: px(0.36),
          height: px(0.31),
          alignItems: "center",
          justifyContent: "center",
          borderRadius: px(0.07),
          background: "#eaf68a",
          boxShadow: `${px(0.045)}px ${px(0.045)}px 0 ${ink}`,
          transform: "rotate(8deg)",
        }}
      >
        <div
          style={{
            display: "flex",
            width: px(0.16),
            height: px(0.095),
            borderLeft: `${px(0.052)}px solid ${ink}`,
            borderBottom: `${px(0.052)}px solid ${ink}`,
            transform: "translateY(-10%) rotate(-45deg)",
          }}
        />
      </div>
    </div>
  );
}
