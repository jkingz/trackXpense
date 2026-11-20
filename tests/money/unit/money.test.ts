import { describe, expect, it } from "vite-plus/test";

import { defaultCurrency, formatMoney } from "@/lib/money";

describe("ledger currency", () => {
  it("defaults to Philippine pesos and shows grouped amounts to two decimals", () => {
    expect(defaultCurrency).toBe("PHP");
    expect(formatMoney(1234.5, defaultCurrency)).toBe("₱1,234.50");
  });

  it("formats the same amount in US dollars", () => {
    expect(formatMoney(1234.5, "USD")).toBe("$1,234.50");
  });

  it("places the minus before the symbol and hides it at rounded zero", () => {
    expect(formatMoney(-1234.5, "PHP")).toBe("−₱1,234.50");
    expect(formatMoney(-0.005, "USD")).toBe("−$0.01");
    expect(formatMoney(-0.004, "USD")).toBe("$0.00");
  });
});
