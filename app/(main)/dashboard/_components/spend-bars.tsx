"use client";

import { useContext, useState } from "react";

import { CurrencyContext } from "@/app/(main)/_components/currency-context";
import type { SpendBar, SpendRange } from "@/lib/dashboard-stats";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

const RANGES: { key: SpendRange; label: string; title: string }[] = [
  { key: "7d", label: "7D", title: "Last 7 days" },
  { key: "30d", label: "30D", title: "Last 30 days" },
  { key: "6m", label: "6M", title: "Last 6 months" },
];

/** Spend as bars; the last bar (today, or this month) is the lime one. */
export function SpendBars({ series }: { series: Record<SpendRange, SpendBar[]> }) {
  const [range, setRange] = useState<SpendRange>("30d");
  const currency = useContext(CurrencyContext);
  const active = RANGES.find((item) => item.key === range)!;
  const bars = series[range];
  const max = Math.max(0, ...bars.map((bar) => bar.amount));
  const ticks = [0, Math.round((bars.length - 1) / 3), Math.round(((bars.length - 1) * 2) / 3)];

  return (
    <section
      aria-labelledby="spend-heading"
      className="flex h-full flex-col rounded-3xl border bg-card p-6 sm:p-8"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 id="spend-heading" className="text-lg font-semibold tracking-tight">
            {active.title}
          </h2>
        </div>
        <div role="group" aria-label="Range" className="flex rounded-xl bg-muted p-1">
          {RANGES.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-label={item.title}
              aria-pressed={range === item.key}
              onClick={() => setRange(item.key)}
              className={cn(
                "h-8 rounded-lg px-3 font-mono text-xs transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                range === item.key
                  ? "bg-card font-semibold text-foreground shadow-sm dark:bg-indigo"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {max === 0 ? (
        <p className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
          Nothing spent in this range.
        </p>
      ) : (
        <ol className="mt-8 flex h-48 flex-1 items-end gap-1.5 sm:gap-2">
          {bars.map((bar, index) => {
            const last = index === bars.length - 1;
            return (
              <li
                key={bar.label}
                className="flex h-full flex-1 items-end"
                title={`${bar.label}: ${formatMoney(bar.amount, currency)}`}
              >
                <span className="sr-only">
                  {bar.label}: {formatMoney(bar.amount, currency)}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "w-full rounded-t-sm",
                    last
                      ? "min-h-1 bg-lime ring-2 ring-navy ring-inset dark:ring-0"
                      : bar.amount === 0
                        ? "h-0.5 bg-muted"
                        : "bg-indigo dark:bg-indigo-soft",
                  )}
                  style={
                    bar.amount === 0
                      ? undefined
                      : { height: `${Math.max(4, (bar.amount / max) * 100)}%` }
                  }
                />
              </li>
            );
          })}
        </ol>
      )}

      <div
        aria-hidden
        className="mt-4 flex justify-between font-mono text-xs text-muted-foreground"
      >
        {ticks.map((index) => (
          <span key={index}>{bars[index]?.label}</span>
        ))}
        <span className="text-foreground">{range === "6m" ? "This month" : "Today"}</span>
      </div>
    </section>
  );
}
