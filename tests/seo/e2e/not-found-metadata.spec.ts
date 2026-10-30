import { test, expect } from "@playwright/test";

import { site } from "@/lib/site";

/**
 * Spec 14, increment 4. The root `not-found` handles every unmatched URL, so
 * this is the one place the 404's metadata is decided.
 */
test("an unmatched path is a titled, noindex 404 that does not claim the origin", async ({
  page,
}) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);

  await expect(page).toHaveTitle(`Page Not Found — ${site.name}`);

  const robots = await page
    .locator('meta[name="robots"]')
    .evaluateAll((elements) => elements.map((el) => el.getAttribute("content") ?? ""));
  expect(robots.length).toBeGreaterThan(0);
  for (const content of robots) {
    expect(content).toContain("noindex");
  }

  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
  expect(ogTitle).toBe(`Page Not Found — ${site.name}`);
  expect(ogTitle).not.toBe(site.title);

  const ogUrls = await page
    .locator('meta[property="og:url"]')
    .evaluateAll((elements) => elements.map((el) => el.getAttribute("content") ?? ""));
  expect(ogUrls).not.toContain(site.url);
  expect(ogUrls).not.toContain("/");
});
