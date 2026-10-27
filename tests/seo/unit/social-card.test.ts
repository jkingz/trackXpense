import { expect, it } from "vite-plus/test";

import { site } from "@/lib/site";
import { socialCard } from "@/lib/social-card";

/**
 * Asserted from the returned metadata object, and every assertion names the key
 * it reads. A helper that returned `{}` would fail on `openGraph.title` rather
 * than pass because two undefined values compared equal.
 */
it("puts the page title on <title>, og:title and twitter:title", () => {
  const metadata = socialCard({
    title: "Privacy Policy",
    description: "How TrackXpense handles your ledger.",
    path: "/privacy",
  });

  expect(metadata.title).toBe("Privacy Policy");
  expect(metadata.openGraph?.title).toBe("Privacy Policy");
  expect(metadata.twitter?.title).toBe("Privacy Policy");
});

it("keeps the page description on every surface that renders it", () => {
  const metadata = socialCard({
    title: "Privacy Policy",
    description: "How TrackXpense handles your ledger.",
    path: "/privacy",
  });

  expect(metadata.description).toBe("How TrackXpense handles your ledger.");
  expect(metadata.openGraph?.description).toBe("How TrackXpense handles your ledger.");
  expect(metadata.twitter?.description).toBe("How TrackXpense handles your ledger.");
});

it("falls back to the site description when the page has none of its own", () => {
  const metadata = socialCard({ title: "Terms & Conditions", path: "/terms" });

  expect(metadata.description).toBe(site.description);
  expect(metadata.openGraph?.description).toBe(site.description);
});

it("points og:url and the canonical at the page, not the home page", () => {
  const metadata = socialCard({ title: "Privacy Policy", path: "/privacy" });

  // Both stay relative: `metadataBase` in the root layout turns them into full
  // URLs at render, keeping the host in one place (`lib/site.ts`).
  expect(metadata.openGraph?.url).toBe("/privacy");
  expect(metadata.alternates?.canonical).toBe("/privacy");
  expect(metadata.openGraph?.url).not.toBe("/");
});

it("keeps the site identity on the card, which a page cannot override by accident", () => {
  const metadata = socialCard({ title: "Privacy Policy", path: "/privacy" });

  // `toMatchObject` reads through the `OpenGraph`/`Twitter` unions without
  // narrowing, so `type` and `card` are asserted where they actually live.
  expect(metadata.openGraph).toMatchObject({ type: "website", locale: site.locale });
  expect(metadata.openGraph?.siteName).toBe(site.name);
  expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
});

/**
 * Regression pinned 2026-10-27: the first version of this helper replaced the
 * root layout's `openGraph` block without restating its images, and the
 * `opengraph-image` file convention did not fill the gap — `/terms` and
 * `/privacy` served no `og:image` at all.
 */
it("carries a card image, which the file convention does not add once a page declares openGraph", () => {
  const metadata = socialCard({ title: "Privacy Policy", path: "/privacy" });

  expect(metadata.openGraph).toMatchObject({
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  });
  expect(metadata.twitter).toMatchObject({ images: ["/twitter-image"] });
});
