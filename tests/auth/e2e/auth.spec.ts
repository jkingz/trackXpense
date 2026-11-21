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
  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "Dashboard", exact: true })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "Ledger", exact: true })).toBeVisible();
  await expect(header.getByRole("link", { name: "Budget", exact: true })).toHaveAttribute(
    "href",
    "/dashboard",
  );

  await page.setViewportSize({ width: 375, height: 812 });
  await header.getByRole("button", { name: "Account menu" }).click();
  await expect(page.getByRole("menuitem", { name: "Dashboard", exact: true })).toHaveCount(0);
  await expect(page.getByRole("menuitem", { name: "Ledger", exact: true })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Budget", exact: true })).toBeVisible();
  await page.getByRole("menuitem", { name: "Budget", exact: true }).click();
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { name: "Total balance", exact: true })).toBeVisible();
});

test("sign out clears the session", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /try the demo/i }).click();
  await page.waitForURL(/\/dashboard/);

  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: /sign out/i }).click();
  await page.waitForURL("http://localhost:3000/");

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in/);
});
