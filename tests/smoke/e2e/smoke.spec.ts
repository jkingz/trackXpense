import { test, expect } from "@playwright/test";

test("landing loads and links the expense example to the app", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/TrackXpense/i);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /Spend it\.\s*Log it\.\s*Get on with it\./,
  );
  await expect(page.getByText("Example expense and its updated account balance")).toBeVisible();

  const icon = await page
    .locator('link[rel="icon"][sizes="32x32"]')
    .evaluate((link: HTMLLinkElement) => link.href);
  const favicon = await page.request.get(icon);
  expect(favicon.ok()).toBe(true);
  expect(favicon.headers()["content-type"]).toContain("image/png");

  await page.getByRole("link", { name: "See how to log an expense" }).click();
  await expect(page).toHaveURL(/#flow$/);
  await expect(page.getByRole("heading", { name: "From checkout to checked off." })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open your ledger", exact: true }).first(),
  ).toHaveAttribute("href", "/dashboard");

  await page.getByRole("link", { name: "Log an expense", exact: true }).click();
  await expect(page).toHaveURL(/\/sign-in/);
});

test("Pocket Log fits a narrow viewport in dark mode", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Expense saved")).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});
