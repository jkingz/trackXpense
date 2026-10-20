import { describe, expect, it } from "vite-plus/test";

import { checkHealth } from "@/lib/health";

describe("health (integration)", () => {
  it("reports up when db ping succeeds", async () => {
    const result = await checkHealth(async () => {});
    expect(result.ok).toBe(true);
  });
});
