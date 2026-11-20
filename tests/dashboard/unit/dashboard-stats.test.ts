import { expect, it } from "vite-plus/test";

import {
  cashflow,
  expenseDeltaPct,
  monthTotals,
  spendByCategory,
  spendSeries,
} from "@/lib/dashboard-stats";

// Fixed clock: Friday 2026-10-16 noon UTC. Requires TZ=UTC: the source buckets
// with local-time getters, so a zone shift moves rows between days/months.
const NOW = new Date("2026-10-16T12:00:00.000Z");

const t = (type: "INCOME" | "EXPENSE", amount: number, date: string, category: string) => ({
  type,
  amount,
  date,
  category,
});

const LEDGER = [
  t("INCOME", 5000, "2026-10-01T12:00:00.000Z", "salary"),
  t("EXPENSE", 120, "2026-10-02T12:00:00.000Z", "groceries"),
  t("EXPENSE", 1500, "2026-10-03T12:00:00.000Z", "housing"),
  t("EXPENSE", 60, "2026-10-10T12:00:00.000Z", "transportation"),
  t("INCOME", 800, "2026-10-12T12:00:00.000Z", "freelance"),
  t("EXPENSE", 80, "2026-10-15T12:00:00.000Z", "groceries"),
  t("EXPENSE", 200, "2026-09-20T12:00:00.000Z", "groceries"),
  t("EXPENSE", 1500, "2026-09-25T12:00:00.000Z", "housing"),
  t("EXPENSE", 3000, "2025-06-01T12:00:00.000Z", "housing"),
];

it("totals the clock month only", () => {
  expect(monthTotals(LEDGER, NOW)).toEqual({ income: 5800, expense: 1760, count: 6 });
});

it("returns zeros for an empty ledger", () => {
  expect(monthTotals([], NOW)).toEqual({ income: 0, expense: 0, count: 0 });
});

it("compares this month's spend against last month's", () => {
  const { expense } = monthTotals(LEDGER, NOW);
  const previous = monthTotals(LEDGER, new Date("2026-09-15T12:00:00.000Z")).expense;
  expect(previous).toBe(1700);
  expect(expenseDeltaPct(expense, previous)).toBeCloseTo(3.53, 1);
  expect(expenseDeltaPct(100, 0)).toBeNull();
});

it("ranks month categories and folds the tail into one slice", () => {
  expect(spendByCategory(LEDGER, NOW, 2)).toEqual({
    total: 1760,
    slices: [
      { key: "housing", amount: 1500 },
      { key: "groceries", amount: 200 },
      { key: "__rest", amount: 60 },
    ],
  });
});

it("buckets the last 30 days oldest-first with day labels", () => {
  const days = cashflow(LEDGER, NOW, 30);
  expect(days).toHaveLength(30);
  expect(days[0]?.label).toBe("17 Sep");
  expect(days[29]?.label).toBe("16 Oct");
  const byLabel = new Map(days.map((d) => [d.label, d]));
  expect(byLabel.get("3 Oct")).toEqual({ label: "3 Oct", income: 0, expense: 1500 });
  expect(byLabel.get("12 Oct")).toEqual({ label: "12 Oct", income: 800, expense: 0 });
  expect(byLabel.get("20 Sep")).toEqual({ label: "20 Sep", income: 0, expense: 200 });
  expect(byLabel.get("16 Oct")).toEqual({ label: "16 Oct", income: 0, expense: 0 });
});

it("ranks the clock year's categories when scoped to the year", () => {
  expect(spendByCategory(LEDGER, NOW, Infinity, "year")).toEqual({
    total: 3460,
    slices: [
      { key: "housing", amount: 3000 },
      { key: "groceries", amount: 400 },
      { key: "transportation", amount: 60 },
    ],
  });
});

it("series 7d/30d as daily spend ending today", () => {
  const week = spendSeries(LEDGER, NOW, "7d");
  expect(week.map((bar) => bar.amount)).toEqual([60, 0, 0, 0, 0, 80, 0]);
  expect(week.at(-1)?.label).toBe("16 Oct");
  expect(spendSeries(LEDGER, NOW, "30d")).toHaveLength(30);
});

it("series 6m as monthly spend ending this month", () => {
  expect(spendSeries(LEDGER, NOW, "6m")).toEqual([
    { label: "May", amount: 0 },
    { label: "Jun", amount: 0 },
    { label: "Jul", amount: 0 },
    { label: "Aug", amount: 0 },
    { label: "Sep", amount: 1700 },
    { label: "Oct", amount: 1760 },
  ]);
});
