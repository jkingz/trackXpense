import { format, subDays } from "date-fns";

/**
 * The dashboard's arithmetic, with no React in it: the page folds every
 * account's rows through these and hands the results to presentational cards.
 * Dates bucket by local calendar day; tests pin TZ=UTC so the buckets are
 * stable.
 */
export type StatTransaction = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: Date | string;
  category: string;
};

const day = (value: Date | string) => new Date(value);

const sameMonth = (value: Date | string, now: Date) => {
  const date = day(value);
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export type MonthTotals = { income: number; expense: number; count: number };

export function monthTotals(transactions: StatTransaction[], now: Date): MonthTotals {
  let income = 0;
  let expense = 0;
  let count = 0;
  for (const t of transactions) {
    if (!sameMonth(t.date, now)) continue;
    if (t.type === "INCOME") income += t.amount;
    else expense += t.amount;
    count += 1;
  }
  return { income, expense, count };
}

/** Percent change of this month's spend vs last month's. Null when last month spent nothing. */
export function expenseDeltaPct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export type CategorySlice = { key: string; amount: number };

/** Month (or year) expenses ranked, the tail folded into one `__rest` slice. */
export function spendByCategory(
  transactions: StatTransaction[],
  now: Date,
  topN = 6,
  scope: "month" | "year" = "month",
): { slices: CategorySlice[]; total: number } {
  const inScope = (value: Date | string) =>
    scope === "month" ? sameMonth(value, now) : day(value).getFullYear() === now.getFullYear();
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "EXPENSE" || !inScope(t.date)) continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const slices = ranked.slice(0, topN).map(([key, amount]) => ({ key, amount }));
  const rest = ranked.slice(topN).reduce((total, [, amount]) => total + amount, 0);
  if (rest > 0) slices.push({ key: "__rest", amount: rest });
  return { slices, total: slices.reduce((total, s) => total + s.amount, 0) };
}

export type CashflowDay = { label: string; income: number; expense: number };

/** Per-day income vs expense for the trailing `days`, oldest first. */
export function cashflow(transactions: StatTransaction[], now: Date, days = 30): CashflowDay[] {
  const buckets = new Map<string, { income: number; expense: number }>();
  const start = subDays(now, days - 1);
  for (const t of transactions) {
    const date = day(t.date);
    if (date < start || date > now) continue;
    const entry = buckets.get(dayKey(date)) ?? { income: 0, expense: 0 };
    if (t.type === "INCOME") entry.income += t.amount;
    else entry.expense += t.amount;
    buckets.set(dayKey(date), entry);
  }
  return Array.from({ length: days }, (_, index) => {
    const date = subDays(now, days - 1 - index);
    const entry = buckets.get(dayKey(date)) ?? { income: 0, expense: 0 };
    return { label: format(date, "d MMM"), ...entry };
  });
}

export type SpendRange = "7d" | "30d" | "6m";
export type SpendBar = { label: string; amount: number };

/**
 * Expense per bar, oldest first: one bar per day for 7d/30d, one per calendar
 * month for 6m. The last bar is always today / this month.
 */
export function spendSeries(
  transactions: StatTransaction[],
  now: Date,
  range: SpendRange,
): SpendBar[] {
  if (range !== "6m") {
    return cashflow(transactions, now, range === "7d" ? 7 : 30).map(({ label, expense }) => ({
      label,
      amount: expense,
    }));
  }
  return Array.from({ length: 6 }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - 5 + index, 15);
    return { label: format(month, "MMM"), amount: monthTotals(transactions, month).expense };
  });
}
