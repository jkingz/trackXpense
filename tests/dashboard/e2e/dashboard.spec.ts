import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /try the demo/i }).click();
  await page.waitForURL(/\/dashboard/);
});

test("dashboard loads", async ({ page }) => {
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /Total balance/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Accounts", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Recent entries/ })).toBeVisible();
});

test("the ledger fits a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByRole("heading", { name: /Total balance/ })).toBeVisible();
  await expect(page.getByRole("region", { name: /Recent entries/ })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test("transaction page loads", async ({ page }) => {
  await page.goto("/transaction/create");
  await expect(page).toHaveURL(/\/transaction\/create/);
});

test("ledger currency persists and follows the user into the account and transaction views", async ({
  page,
}) => {
  const currency = page.getByRole("button", { name: /ledger currency:/i });

  async function choose(code: "USD" | "PHP") {
    if ((await currency.textContent())?.trim() === code) return;
    await currency.click({ timeout: 5_000 });
    await page.getByRole("menuitemradio", { name: new RegExp(code) }).click({ timeout: 5_000 });
    await expect(currency).toHaveAccessibleName(`Ledger currency: ${code}`);
    await expect(page.getByRole("menu", { includeHidden: true })).toHaveCount(0);
  }

  const original = (await currency.textContent())?.trim() === "USD" ? "USD" : "PHP";
  try {
    await choose("USD");
    const balance = page.getByRole("link", { name: /Everyday/ });
    const dollars = (await balance.innerText()).match(/\$([\d,.]+)/)?.[1];
    expect(dollars).toBeTruthy();

    await choose("PHP");
    await expect(balance).toContainText(`₱${dollars}`);
    await page.reload();
    await expect(currency).toHaveAccessibleName("Ledger currency: PHP");

    await page.getByRole("button", { name: "New account" }).click();
    await expect(page.getByLabel("Initial balance (PHP)")).toBeVisible();
    await page.keyboard.press("Escape");

    await balance.click();
    await expect(page.getByRole("heading", { name: "Everyday" })).toBeVisible();
    // The dashboard stays mounted but hidden after navigation, so match only visible copies.
    await expect(
      page.getByText(`₱${dollars}`, { exact: true }).filter({ visible: true }).first(),
    ).toBeVisible();
    await page.goto("/transaction/create");
    await expect(page.getByLabel("Amount · PHP")).toBeVisible();
  } finally {
    await page.goto("/dashboard");
    await choose(original);
  }
});
