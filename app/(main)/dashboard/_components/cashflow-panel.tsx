"use client";

import { CurrencyContext } from "@/app/(main)/_components/currency-context";
import { useAnimate, useReducedMotion } from "motion/react";
import { useContext, useEffect } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CashflowDay, WeekdaySpend } from "@/lib/dashboard-stats";

/** Thirty days of in-vs-out with this week's daily bars underneath, one card. */
export function CashflowPanel({ days, week }: { days: CashflowDay[]; week: WeekdaySpend[] }) {
  const currency = useContext(CurrencyContext);
  const [scope, animate] = useAnimate<HTMLElement>();
  const reduceMotion = useReducedMotion();
  const moved = days.some((day) => day.income > 0 || day.expense > 0);
  const max = Math.max(0, ...week.map((day) => day.amount));
  const hasWeeklySpending = max > 0;
  const weekTotal = week.reduce((sum, day) => sum + day.amount, 0);
  // Headroom so the tallest day never kisses the top edge.
  const ceiling = Math.max(
    1,
    Math.max(0, ...days.flatMap((day) => [day.income, day.expense])) * 1.1,
  );

  useEffect(() => {
    if (reduceMotion) return;

    const panel = animate(scope.current, { y: [8, 0] }, { duration: 0.25, ease: "easeOut" });
    const bars = hasWeeklySpending
      ? animate(
          "[data-weekly-spend-bar]",
          { scaleY: [0.75, 1] },
          { duration: 0.3, ease: "easeOut" },
        )
      : undefined;

    return () => {
      panel.complete();
      bars?.complete();
    };
  }, [animate, hasWeeklySpending, reduceMotion, scope]);

  if (!moved && !hasWeeklySpending) {
    return (
      <section
        ref={scope}
        aria-labelledby="cashflow-heading"
        className="ledger-panel flex flex-col p-5"
      >
        <h2
          id="cashflow-heading"
          className="text-sm font-semibold tracking-tight text-card-foreground"
        >
          Cash flow
        </h2>
        <p className="py-10 text-center text-sm text-muted-foreground">No movement yet.</p>
      </section>
    );
  }

  return (
    <section
      ref={scope}
      aria-labelledby="cashflow-heading"
      className="ledger-panel flex flex-col p-5"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2
          id="cashflow-heading"
          className="text-sm font-semibold tracking-tight text-card-foreground"
        >
          Cash flow
        </h2>
        <p className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-full bg-primary" />
            Income
          </span>
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-full bg-expense" />
            Expenses
          </span>
        </p>
      </header>

      <p className="mt-1 text-xs text-muted-foreground">Last 30 days</p>
      <div className="mt-3 h-36 w-full overflow-clip sm:h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={days} margin={{ top: 8, right: 16, bottom: 0, left: 16 }}>
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
                formatMoney(Number(value), currency),
                name === "income" ? "Income" : "Expenses",
              ]}
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="var(--primary)"
              fill="var(--primary)"
              fillOpacity={0.09}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="var(--color-expense)"
              fill="none"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 border-t pt-3">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-sm font-semibold tracking-tight text-card-foreground">Last 7 days</h3>
          <p className="font-mono text-xs tabular-nums text-muted-foreground">
            {formatMoney(weekTotal, currency)}
          </p>
        </div>
        {!hasWeeklySpending ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No spending in the last 7 days.
          </p>
        ) : (
          <ol className="mt-3 grid grid-cols-7 items-end gap-2">
            {week.map((day) => (
              <li
                key={day.weekday}
                className="flex h-16 flex-col items-center justify-end gap-2"
                title={`${day.weekday}: ${formatMoney(day.amount, currency)}`}
              >
                <span className="sr-only">
                  {day.weekday}: {formatMoney(day.amount, currency)}
                </span>
                <div
                  aria-hidden
                  data-weekly-spend-bar
                  className={cn(
                    "w-full origin-bottom rounded-md",
                    day.isPeak ? "bg-primary" : "bg-muted-foreground/25",
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
