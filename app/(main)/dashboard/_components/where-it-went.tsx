import type { CategorySlice } from "@/lib/dashboard-stats";
import { formatMoney, type LedgerCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";

import { categoryLabel } from "./category-helpers";

// Four ranked swatches; dark mode swaps the order so the lead stays brightest.
const SWATCH = [
  "bg-indigo dark:bg-indigo-soft",
  "bg-indigo-soft dark:bg-indigo",
  "bg-navy dark:bg-white",
  "bg-lime border border-navy dark:border-0",
];

/** The year's spend by category: top four as a stacked bar and a list. */
export function WhereItWent({
  slices,
  total,
  year,
  currency,
}: {
  currency: LedgerCurrency;
  slices: CategorySlice[];
  total: number;
  year: number;
}) {
  const top = slices.slice(0, 4);
  const pct = (amount: number) => (total > 0 ? (amount / total) * 100 : 0);

  return (
    <section
      aria-labelledby="where-heading"
      className="flex h-full flex-col rounded-3xl border bg-card p-6 sm:p-8"
    >
      <header className="flex items-baseline justify-between gap-4">
        <h2 id="where-heading" className="text-lg font-semibold tracking-tight">
          Where it went <span className="text-sm font-normal text-muted-foreground">· {year}</span>
        </h2>
        <p className="font-mono text-sm tabular-nums text-muted-foreground">
          {formatMoney(total, currency)}
        </p>
      </header>

      {total === 0 ? (
        <p className="flex flex-1 items-center justify-center py-16 text-sm text-muted-foreground">
          No spending yet this year.
        </p>
      ) : (
        <>
          <div aria-hidden className="mt-5 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
            {top.map((slice, index) => (
              <span
                key={slice.key}
                className={cn(
                  "--share-bar h-full first:rounded-l-full last:rounded-r-full",
                  SWATCH[index],
                )}
                style={{ width: `${pct(slice.amount)}%` }}
              />
            ))}
          </div>

          <ul className="mt-6 space-y-3">
            {top.map((slice, index) => (
              <li key={slice.key} className="flex items-center gap-3">
                <span aria-hidden className={cn("size-2.5 shrink-0 rounded-sm", SWATCH[index])} />
                <span className="min-w-0 flex-1 truncate">{categoryLabel(slice.key)}</span>
                <span className="sr-only">{pct(slice.amount).toFixed(0)}% of spending</span>
                <span className="w-24 text-right font-mono tabular-nums">
                  {formatMoney(slice.amount, currency)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
