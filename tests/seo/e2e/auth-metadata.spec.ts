import { test, expect } from "@playwright/test";

import { site } from "@/lib/site";

/**
 * Spec 14, increment 3. Every route under `app/(auth)/layout.tsx` must be
 * noindex and must not unfurl with the landing headline: the segment shares one
 * title, so this is the only place the values can be wrong together.
 */
const authRoutes = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/email-verified",
] as const;

for (const route of authRoutes) {
  test(`${route} is noindex and drops the landing og:title`, async ({ page }) => {
    await page.goto(route);

    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toContain("noindex");

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
    expect(ogTitle).not.toBe(site.title);
    expect(ogTitle).toBe(site.name);

    const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute("content");
    expect(twitterTitle).not.toBe(site.title);
    expect(twitterTitle).toBe(site.name);

    await expect(page).toHaveTitle(site.name);
  });
}
