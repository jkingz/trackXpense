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
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
