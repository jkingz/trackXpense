import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";
import { parseInput } from "@/actions/lib/parseInput";

describe("parseInput", () => {
  it("returns parsed value for valid input", () => {
    expect(parseInput(z.string().min(1), "ok")).toBe("ok");
  });

  it("throws ZodError for invalid input", () => {
    expect(() => parseInput(z.string().min(1), "")).toThrow();
  });
});
