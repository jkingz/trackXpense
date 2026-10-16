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

/** Share of income kept, as a 0–1 fraction. Null when there is no income. */
export function savingsRate(income: number, expense: number): number | null {
  if (income === 0) return null;
  return (income - expense) / income;
}

export type CategorySlice = { key: string; amount: number };

/** Month expenses ranked, the tail folded into one `__rest` slice. */
export function spendByCategory(
  transactions: StatTransaction[],
  now: Date,
  topN = 6,
): { slices: CategorySlice[]; total: number } {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "EXPENSE" || !sameMonth(t.date, now)) continue;
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

export type WeekdaySpend = { weekday: string; amount: number; isPeak: boolean };

/** Expense per weekday over the trailing `days`, oldest first, peak flagged. */
export function spendByWeekday(
  transactions: StatTransaction[],
  now: Date,
  days = 7,
): WeekdaySpend[] {
  const buckets = new Map<string, number>();
  const start = subDays(now, days - 1);
  for (const t of transactions) {
    if (t.type !== "EXPENSE") continue;
    const date = day(t.date);
    if (date < start || date > now) continue;
    buckets.set(dayKey(date), (buckets.get(dayKey(date)) ?? 0) + t.amount);
  }
  const amounts = Array.from({ length: days }, (_, index) => {
    const date = subDays(now, days - 1 - index);
    return { date, amount: buckets.get(dayKey(date)) ?? 0 };
  });
  const peak = Math.max(0, ...amounts.map((a) => a.amount));
  return amounts.map(({ date, amount }) => {
    return {
      weekday: format(date, "EEE"),
      amount,
      isPeak: peak > 0 && amount === peak,
    };
  });
}

export function yearComparison(transactions: StatTransaction[], now: Date) {
  let thisYear = 0;
  let lastYear = 0;
  for (const t of transactions) {
    if (t.type !== "EXPENSE") continue;
    const year = day(t.date).getFullYear();
    if (year === now.getFullYear()) thisYear += t.amount;
    else if (year === now.getFullYear() - 1) lastYear += t.amount;
  }
  return { thisYear, lastYear, deltaPct: expenseDeltaPct(thisYear, lastYear) };
}
