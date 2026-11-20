import { describe, expect, it } from "vite-plus/test";

import { csvField } from "@/lib/csv";

describe("csvField", () => {
  it("doubles quotes instead of backslash-escaping them", () => {
    expect(csvField('5" screws, box')).toBe('"5"" screws, box"');
  });

  it("defuses formula-leading cells", () => {
    expect(csvField("=HYPERLINK(1)")).toBe(`"'=HYPERLINK(1)"`);
    expect(csvField("-5")).toBe(`"'-5"`);
  });

  it("leaves plain text alone", () => {
    expect(csvField("coffee")).toBe('"coffee"');
  });
});
