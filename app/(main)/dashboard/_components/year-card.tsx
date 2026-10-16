import { usd } from "@/lib/money";
import { cn } from "@/lib/utils";

/** This year's spend against last year's, one line. */
export function YearCard({
  thisYear,
  lastYear,
  deltaPct,
}: {
  thisYear: number;
  lastYear: number;
  deltaPct: number | null;
}) {
  const year = new Date().getFullYear();

  return (
    <section
      aria-labelledby="year-heading"
      className="glass-panel flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4"
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
      <dl className="ml-auto flex items-baseline gap-8">
        <div className="text-right">
          <dt className="text-xs text-muted-foreground">{year} spent</dt>
          <dd className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-card-foreground">
            ${usd(thisYear)}
          </dd>
        </div>
        <div className="text-right">
          <dt className="text-xs text-muted-foreground">{year - 1} spent</dt>
          <dd className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-muted-foreground">
            ${usd(lastYear)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
