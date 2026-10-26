import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /try the demo/i }).click();
  await page.waitForURL(/\/dashboard/);
});

test("dashboard loads", async ({ page }) => {
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading").first()).toBeVisible();
});

test("transaction page loads", async ({ page }) => {
  await page.goto("/transaction/create");
  await expect(page).toHaveURL(/\/transaction\/create/);
});
