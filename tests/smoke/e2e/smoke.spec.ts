import { test, expect } from "@playwright/test";

import { previewIntervalMs } from "@/lib/landing-preview";

test("landing explains the product and opens the demo", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page).toHaveTitle(/TrackXpense/i);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Know where your money went.");
  await expect(
    page.getByText("Sample ledger after a ₱180.00 expense.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator("[data-landing-amount]").first()).toHaveText("18,450.00");

  const icon = await page
    .locator('link[rel="icon"][sizes="32x32"]')
    .evaluate((link: HTMLLinkElement) => link.href);
  const favicon = await page.request.get(icon);
  expect(favicon.ok()).toBe(true);
  expect(favicon.headers()["content-type"]).toContain("image/png");

  for (const { name, hash, heading } of [
    { name: "How it works", hash: "#flow", heading: "From receipt to record." },
    { name: "Budget", hash: "#inside", heading: "See what’s left before you spend." },
    { name: "Accounts", hash: "#categories", heading: "Keep spending and savings separate." },
  ]) {
    await page.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(hash + "$"));
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }

  await expect(page.getByRole("link", { name: "Create an account" }).last()).toHaveAttribute(
    "href",
    "/sign-up",
  );
  await page.getByRole("button", { name: "Try the demo" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Total balance" })).toBeVisible();
});

test("the same sample loops through the ledger, receipt, and spending chart", async ({ page }) => {
  test.setTimeout(35_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  const ledger = page.locator("[data-landing-amount]");
  const receipt = page.locator("[data-receipt-preview]");
  const weekTotal = page.locator("[data-week-total]");
  const thursday = page.locator('[data-spending-bar="Thu"]');
  const saturday = page.locator('[data-spending-bar="Sat"]');
  const waterPlayback = () =>
    page
      .locator(".landing-water")
      .evaluate((element) => getComputedStyle(element, "::before").animationPlayState);
  const transforms = () =>
    Promise.all(
      [thursday, saturday].map((bar) =>
        bar.evaluate((element) => getComputedStyle(element).transform),
      ),
    );

  await expect(page.getByRole("button", { name: /^(pause|play) motion$/i })).toHaveCount(0);
  await expect(page.locator("[data-landing-receipt-scene]")).toBeAttached();
  await expect.poll(waterPlayback).toBe("running");
  await expect(receipt.getByText("Weekend coffee")).toBeVisible();
  await expect(weekTotal).toHaveText("₱2,360.00");
  const coffeeBars = await transforms();

  await expect(ledger).toHaveText(["18,144.25", "4,334.25"], { timeout: 7_000 });
  await expect(receipt.locator("[data-receipt-amount]")).toHaveText("₱485.75");
  await expect(receipt.getByText("Market groceries")).toBeVisible();
  await expect(receipt.getByText("Groceries", { exact: true })).toBeVisible();
  await expect(weekTotal).toHaveText("₱2,665.75");
  await expect
    .poll(transforms)
    .toEqual(["matrix(1, 0, 0, 0.89575, 0, 0)", "matrix(1, 0, 0, 0.43, 0, 0)"]);

  await expect(receipt.getByText("Ride home")).toBeVisible({ timeout: 7_000 });
  await expect(receipt.getByText("Transport", { exact: true })).toBeVisible();
  await expect(weekTotal).toHaveText("₱2,425.50");

  await expect(ledger).toHaveText(["18,450.00", "4,640.00"], { timeout: 7_000 });
  await expect(receipt.getByText("Weekend coffee")).toBeVisible();
  await expect(weekTotal).toHaveText("₱2,360.00");
  await expect.poll(transforms).toEqual(coffeeBars);
});

test("landing fits narrow dark mode and shows final values with reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("[data-landing-amount]")).toHaveText(["18,450.00", "4,640.00"]);
  await expect(page.locator("[data-landing-statement]")).toHaveCSS("transform", "none");
  await expect(page.getByRole("button", { name: "Pause motion" })).toHaveCount(0);
  await expect(page.locator("[data-landing-receipt-scene]")).toHaveCount(0);
  expect(
    await page
      .locator(".landing-water")
      .evaluate((element) => getComputedStyle(element, "::before").animationName),
  ).toBe("none");
  await page.clock.runFor(previewIntervalMs * 2);
  await expect(page.locator("[data-receipt-preview]").getByText("Weekend coffee")).toBeVisible();
  await expect(page.locator("[data-week-total]")).toHaveText("₱2,360.00");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});
