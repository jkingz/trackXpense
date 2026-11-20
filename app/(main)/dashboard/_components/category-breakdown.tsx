import { Progress } from "@/components/ui/progress";
import type { CategorySlice } from "@/lib/dashboard-stats";
import { formatMoney, type LedgerCurrency } from "@/lib/money";

import { categoryLabel } from "./category-helpers";

export function CategoryBreakdown({
  slices,
  total,
  currency,
}: {
  slices: CategorySlice[];
  total: number;
  currency: LedgerCurrency;
}) {
  return (
    <section aria-labelledby="category-heading" className="ledger-panel p-5">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="category-heading" className="text-sm font-semibold">
          Spending by category
        </h2>
        <p className="font-mono text-sm tabular-nums text-muted-foreground">
          {formatMoney(total, currency)}
        </p>
      </header>
      {total === 0 ? (
        <p className="py-8 text-sm text-muted-foreground">No spending recorded this month.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {slices.map(({ key, amount }) => {
            const label = categoryLabel(key);
            const share = (amount / total) * 100;
            return (
              <li
                key={key}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2 gap-y-1 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]"
              >
                <span className="text-sm">{label}</span>
                <Progress
                  aria-hidden
                  aria-label={label}
                  value={share}
                  className="col-span-3 row-start-2 h-1.5 bg-muted sm:col-span-1 sm:row-auto"
                />
                <span className="break-words text-right font-mono text-xs tabular-nums">
                  {formatMoney(amount, currency)}
                </span>

                <span className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {Math.round(share)}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
