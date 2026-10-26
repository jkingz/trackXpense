import { test, expect } from "@playwright/test";

test("auth sign-in page loads", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
});

test("demo sign-in reaches dashboard", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /try the demo/i }).click();
  await page.waitForURL(/\/dashboard/);
  await expect(page).toHaveURL(/\/dashboard/);
});

test("sign out clears the session", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /try the demo/i }).click();
  await page.waitForURL(/\/dashboard/);

  await page.locator('button[title="Sign out"]').click();
  await page.waitForURL("http://localhost:3000/");

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in/);
});
