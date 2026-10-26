import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  testMatch: "**/e2e/**/*.spec.ts",
  retries: process.env.CI ? 2 : 0,
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: process.env.CI ? "pnpm start" : "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});
