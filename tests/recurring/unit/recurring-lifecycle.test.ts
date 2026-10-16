import { expect, it } from "vite-plus/test";

import { applyRecurringTick, recurringPhase } from "@/lib/recurring-lifecycle";

const now = new Date("2026-10-17T00:00:00.000Z");

it("a never-processed transaction is due", () => {
  expect(recurringPhase({ lastProcessed: null, nextRecurringDate: null }, now)).toBe("due");
});

it("a missing next date is due even after processing", () => {
  expect(recurringPhase({ lastProcessed: now, nextRecurringDate: null }, now)).toBe("due");
});

it("a future next date is scheduled", () => {
  const future = new Date("2026-11-01T00:00:00.000Z");
  expect(recurringPhase({ lastProcessed: now, nextRecurringDate: future }, now)).toBe("scheduled");
});

it("a next date at or before now is due", () => {
  expect(recurringPhase({ lastProcessed: now, nextRecurringDate: now }, now)).toBe("due");
});

it("a tick stamps lastProcessed and rolls the next date by the interval", () => {
  const next = applyRecurringTick(
    { lastProcessed: null, nextRecurringDate: null },
    { now, interval: "MONTHLY" },
  );
  expect(next.lastProcessed).toEqual(now);
  expect(next.nextRecurringDate).toEqual(new Date("2026-11-17T00:00:00.000Z"));
});
