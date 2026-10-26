import { fileURLToPath } from "node:url";

import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {},
  lint: {},
  staged: {
    "*": "vp check --fix",
  },
  test: {
    environment: "node",
    include:
      process.env.VITEST_TIER === "integration"
        ? ["tests/**/integration/**/*.test.ts"]
        : ["tests/**/unit/**/*.test.ts"],
    exclude: ["tests/**/e2e/**"],
    setupFiles: process.env.VITEST_TIER === "integration" ? ["tests/setup.integration.ts"] : [],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
