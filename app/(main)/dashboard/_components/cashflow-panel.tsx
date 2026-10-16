"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { usd } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CashflowDay, WeekdaySpend } from "@/lib/dashboard-stats";

/** Thirty days of in-vs-out with this week's daily bars underneath, one card. */
export function CashflowPanel({ days, week }: { days: CashflowDay[]; week: WeekdaySpend[] }) {
  const moved = days.some((day) => day.income > 0 || day.expense > 0);
  const max = Math.max(0, ...week.map((day) => day.amount));
  const weekTotal = week.reduce((sum, day) => sum + day.amount, 0);
  // Headroom so the tallest day never kisses the top edge.
  const ceiling = Math.max(
    1,
    Math.max(0, ...days.flatMap((day) => [day.income, day.expense])) * 1.1,
  );

  if (!moved && max === 0) {
    return (
      <section aria-labelledby="cashflow-heading" className="flex h-full flex-col glass-panel p-5">
        <h2
          id="cashflow-heading"
          className="text-sm font-semibold tracking-tight text-card-foreground"
        >
          Cashflow
        </h2>
        <p className="py-10 text-center text-sm text-muted-foreground">No movement yet.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="cashflow-heading" className="flex h-full flex-col glass-panel p-5">
      <header className="flex items-baseline justify-between gap-4">
        <h2
          id="cashflow-heading"
          className="text-sm font-semibold tracking-tight text-card-foreground"
        >
          Money in and out
        </h2>
        <p className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-full bg-income" />
            In
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-full bg-expense" />
            Out
          </span>
        </p>
      </header>

      <div className="mt-2 h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={days} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="cashflow-income" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-income)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--color-income)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cashflow-expense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-expense)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--color-expense)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.6} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={4}
              stroke="var(--color-muted-foreground)"
            />
            <YAxis hide domain={[0, ceiling]} />
            <Tooltip
              formatter={(value, name) => [
                `$${usd(Number(value))}`,
                name === "income" ? "In" : "Out",
              ]}
              contentStyle={{
                backgroundColor: "color-mix(in oklab, var(--color-card) 85%, transparent)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="var(--color-income)"
              fill="url(#cashflow-income)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
              style={{
                filter:
                  "drop-shadow(0 0 6px color-mix(in oklab, var(--color-income) 55%, transparent))",
              }}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="var(--color-expense)"
              fill="url(#cashflow-expense)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
              style={{
                filter:
                  "drop-shadow(0 0 6px color-mix(in oklab, var(--color-expense) 55%, transparent))",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div aria-hidden className="min-h-4 flex-1" />

      <div className="border-t pt-4">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-sm font-semibold tracking-tight text-card-foreground">This week</h3>
          <p className="font-mono text-xs tabular-nums text-muted-foreground">${usd(weekTotal)}</p>
        </div>
        {max === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No spending this week.</p>
        ) : (
          <ol className="mt-3 grid grid-cols-7 items-end gap-2">
            {week.map((day) => (
              <li
                key={day.weekday}
                className="flex h-16 flex-col items-center justify-end gap-2"
                title={`${day.weekday}: $${usd(day.amount)}`}
              >
                <span className="sr-only">
                  {day.weekday}: ${usd(day.amount)}
                </span>
                <div
                  aria-hidden
                  className={cn(
                    "w-full rounded-md",
                    day.isPeak ? "bg-brand" : "bg-muted-foreground/25",
                  )}
                  style={{ height: `${Math.max(8, (day.amount / max) * 100)}%` }}
                />
                <span
                  className={cn(
                    "text-[11px]",
                    day.isPeak ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {day.weekday.slice(0, 1)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
