import localFont from "next/font/local";

// Vendored from @fontsource (Fira Sans 4.3 / Fira Code 6.x), both SIL OFL 1.1
// — licence texts sit next to the binaries in `app/fonts/`. Self-hosted, so no
// request leaves the browser for a font.

export const firaSans = localFont({
  src: [
    { path: "./fonts/fira-sans-latin-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/fira-sans-latin-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/fira-sans-latin-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/fira-sans-latin-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/fira-sans-latin-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-fira-sans",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const firaCode = localFont({
  src: [{ path: "./fonts/fira-code-latin.woff2", weight: "300 700", style: "normal" }],
  variable: "--font-fira-code",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});
