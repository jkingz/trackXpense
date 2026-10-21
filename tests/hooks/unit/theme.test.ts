import { expect, it } from "vite-plus/test";

import { isDarkTheme } from "@/lib/theme";

it("renders dark when dark is chosen regardless of the OS preference", () => {
  expect(isDarkTheme("dark", false)).toBe(true);
  expect(isDarkTheme("dark", true)).toBe(true);
});

it("renders light when light is chosen regardless of the OS preference", () => {
  expect(isDarkTheme("light", true)).toBe(false);
  expect(isDarkTheme("light", false)).toBe(false);
});

it("follows the OS preference on system", () => {
  expect(isDarkTheme("system", true)).toBe(true);
  expect(isDarkTheme("system", false)).toBe(false);
});
