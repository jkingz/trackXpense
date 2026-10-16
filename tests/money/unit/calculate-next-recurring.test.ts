import { expect, it } from "vite-plus/test";

import { calculateNextRecurringDate } from "@/actions/lib/calculateRecurring";

const next = (start: string, interval: string) =>
  new Date(calculateNextRecurringDate(new Date(start), interval)).toISOString();

const JAN31 = "2026-01-31T00:00:00.000Z";

// Requires TZ=UTC: the source advances dates with local-time setters, so a DST boundary inside a step shifts the ISO result.
it("advances each interval", () => {
  expect(next(JAN31, "DAILY")).toBe("2026-02-01T00:00:00.000Z");
  expect(next(JAN31, "WEEKLY")).toBe("2026-02-07T00:00:00.000Z");
  expect(next("2026-01-15T00:00:00.000Z", "MONTHLY")).toBe("2026-02-15T00:00:00.000Z");
  expect(next(JAN31, "YEARLY")).toBe("2027-01-31T00:00:00.000Z");
});

// Defect recorded, not fixed: setMonth overflows instead of clamping to month-end.
it("rolls 31 January forward to 3 March, not 28 February", () => {
  expect(next(JAN31, "MONTHLY")).toBe("2026-03-03T00:00:00.000Z");
});

// Defect recorded, not fixed: a leap-day anniversary lands on 1 March.
it("rolls a leap-year anniversary to 1 March", () => {
  expect(next("2024-02-29T00:00:00.000Z", "YEARLY")).toBe("2025-03-01T00:00:00.000Z");
});

it("returns the same instant for an unrecognised interval", () => {
  expect(next(JAN31, "FORTNIGHTLY")).toBe(JAN31);
});
