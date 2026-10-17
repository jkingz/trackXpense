import { expect, it } from "vite-plus/test";

import { checkHealth } from "@/lib/health";

it("reports up with latency when the ping resolves", async () => {
  const result = await checkHealth(async () => {});
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.database).toBe("up");
    expect(typeof result.latencyMs).toBe("number");
  }
});

it("reports down with the reason when the ping rejects", async () => {
  const result = await checkHealth(async () => {
    throw new Error("connect timeout");
  });
  expect(result).toEqual({ ok: false, database: "down", error: "connect timeout" });
});

it("never leaks non-error rejections as objects", async () => {
  const result = await checkHealth(async () => {
    // eslint-disable-next-line no-throw-literal
    throw "gone";
  });
  expect(result).toEqual({ ok: false, database: "down", error: "unknown" });
});
