import { formatMoney, type LedgerCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";

/** This year's spend against last year's, one line. */
export function YearCard({
  year,
  thisYear,
  lastYear,
  deltaPct,
  currency,
}: {
  year: number;
  thisYear: number;
  lastYear: number;
  deltaPct: number | null;
  currency: LedgerCurrency;
}) {
  return (
    <section
      aria-labelledby="year-heading"
      className="ledger-panel flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4"
    >
      <div>
        <h2 id="year-heading" className="text-sm font-semibold tracking-tight text-card-foreground">
          This year vs last year
        </h2>
        {deltaPct !== null && (
          <p
            className={cn(
              "mt-0.5 font-mono text-xs tabular-nums",
              deltaPct <= 0 ? "text-income" : "text-expense",
            )}
          >
            {deltaPct > 0 ? "+" : ""}
            {deltaPct.toFixed(1)}% vs last year
          </p>
        )}
      </div>
      <dl className="flex flex-wrap items-baseline gap-4 sm:ml-auto sm:gap-8">
        <div className="sm:text-right">
          <dt className="text-xs text-muted-foreground">{year} spent</dt>
          <dd className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-card-foreground">
            {formatMoney(thisYear, currency)}
          </dd>
        </div>
        <div className="sm:text-right">
          <dt className="text-xs text-muted-foreground">{year - 1} spent</dt>
          <dd className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-muted-foreground">
            {formatMoney(lastYear, currency)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
