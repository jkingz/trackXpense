import { categoryColors, defaultCategories } from "@/data/categories";
import { featuresData } from "@/data/landing";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ACCOUNT_ROWS = [
  { name: "Current", balance: "1,204.60", move: "+2,400.00", income: true },
  { name: "Savings", balance: "8,910.00", move: "\u2212500.00", income: false },
];

const CATEGORY_PICKS = ["groceries", "salary", "housing", "freelance", "utilities", "travel"];

/**
 * Each card earns its grid cell with a different treatment — running balances, a
 * climbing budget bar, a category swatch cluster, a receipt under a scan frame,
 * a stacked reading of the dashboard — so the grid never reads as five copies
 * of one card.
 */
const visuals: Record<string, () => React.ReactNode> = {
  accounts: () => (
    <dl className="mt-6 space-y-2.5">
      {ACCOUNT_ROWS.map((row) => (
        <div key={row.name} className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-muted-foreground">{row.name}</dt>
          <dd className="flex items-baseline gap-3">
            <span
              className={cn(
                "font-mono text-xs tabular-nums",
                row.income ? "text-income" : "text-expense",
              )}
            >
              {row.move}
            </span>
            <span className="font-mono text-sm font-medium tabular-nums text-foreground">
              {row.balance}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  ),

  budget: () => (
    <div className="mt-6">
      <div className="flex items-baseline justify-between gap-4 font-mono text-xs tabular-nums text-muted-foreground">
        <span>2,028.00 spent</span>
        <span>of 2,600.00</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-brand-deep transition-[width] duration-700 ease-out"
          style={{ width: "78%" }}
        />
      </div>
      <p className="mt-3 font-mono text-xs tabular-nums text-muted-foreground">
        572.00 of headroom left
      </p>
    </div>
  ),

  categories: () => (
    <ul className="mt-6 flex flex-wrap gap-1.5">
      {CATEGORY_PICKS.map((id) => {
        const category = defaultCategories.find((item) => item.id === id);
        if (!category) return null;
        return (
          <li
            key={id}
            className="flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
          >
            <span
              aria-hidden
              className="size-1.5 rounded-full"
              style={{ backgroundColor: categoryColors[category.id] }}
            />
            {category.name}
          </li>
        );
      })}
      <li className="flex items-center rounded-full border border-dashed px-2.5 py-1 font-mono text-xs text-muted-foreground">
        +15 more
      </li>
    </ul>
  ),

  receipt: () => (
    <div className="mt-6 flow-root">
      <div className="relative mx-auto max-w-[15rem] rounded-md border bg-secondary/60 p-4">
        {/* Scan frame corners — the reticle the receipt reader looks through. */}
        <span
          aria-hidden
          className="absolute left-1 top-1 size-3 border-l-2 border-t-2 border-brand-deep"
        />
        <span
          aria-hidden
          className="absolute right-1 top-1 size-3 border-r-2 border-t-2 border-brand-deep"
        />
        <span
          aria-hidden
          className="absolute bottom-1 left-1 size-3 border-b-2 border-l-2 border-brand-deep"
        />
        <span
          aria-hidden
          className="absolute bottom-1 right-1 size-3 border-b-2 border-r-2 border-brand-deep"
        />
        <dl className="space-y-1.5 font-mono text-[11px] tabular-nums text-muted-foreground">
          <div className="flex justify-between gap-4">
            <dt>amount</dt>
            <dd className="text-foreground">38.40</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>date</dt>
            <dd className="text-foreground">2026-10-04</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>category</dt>
            <dd className="text-foreground">groceries</dd>
          </div>
        </dl>
      </div>
    </div>
  ),

  dashboard: () => (
    <ul className="mt-6 space-y-2">
      {[
        { label: "Budget", fill: "78%" },
        { label: "Income", fill: "64%" },
        { label: "Expenses", fill: "41%" },
      ].map((bar) => (
        <li key={bar.label} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs text-muted-foreground">{bar.label}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <span className="block h-full rounded-full bg-brand/70" style={{ width: bar.fill }} />
          </span>
        </li>
      ))}
    </ul>
  ),
};

function FeatureBento() {
  return (
    <section id="inside" className="container mx-auto px-4 py-24 md:py-32">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold tracking-tighter text-balance text-foreground md:text-5xl">
          Five surfaces, and all of them are the same screen
        </h2>
        <p className="mt-5 text-lg text-muted-foreground">
          No modules to switch on and no report to wait for. Everything below is on the first page
          you see.
        </p>
      </div>

      {/* grid-flow-dense plus spans that sum to exactly 6 per row: no empty cells. */}
      <div className="mt-14 grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {featuresData.map((feature) => (
          <Card
            key={feature.kind}
            className={cn(
              "group gap-0 overflow-hidden border bg-card p-6 shadow-none transition-all duration-500 ease-out hover:-translate-y-1 hover:border-brand/50 hover:shadow-lg md:p-8",
              feature.span,
            )}
          >
            <CardContent className="p-0">
              <div className="flex size-11 items-center justify-center rounded-xl bg-brand-veil transition-transform duration-500 ease-out group-hover:scale-110">
                {feature.icon}
              </div>
              <h3 className="mt-5 text-lg font-bold tracking-tight text-foreground md:text-xl">
                {feature.title}
              </h3>
              <p className="mt-3 text-muted-foreground">{feature.description}</p>
              {visuals[feature.kind]?.()}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default FeatureBento;
