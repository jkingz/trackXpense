import { format } from "date-fns";
import Link from "next/link";

import { usd } from "@/lib/money";
import { cn } from "@/lib/utils";

import { categoryColor, categoryLabel } from "./category-helpers";

export type RecentTransaction = {
  id: string;
  description: string | null;
  category: string;
  date: Date | string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  accountName: string;
};

/** Latest entries across every account — the account name is the scope, so no filter is needed. */
export function RecentActivity({ transactions }: { transactions: RecentTransaction[] }) {
  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <section aria-labelledby="activity-heading" className="h-full glass-panel">
      <header className="flex items-center justify-between gap-4 border-b px-5 py-4">
        <h2
          id="activity-heading"
          className="text-sm font-semibold tracking-tight text-card-foreground"
        >
          Recent activity
        </h2>
        <p className="text-xs text-muted-foreground">All accounts</p>
      </header>

      {recent.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
          <Link
            href="/transaction/create"
            className="mt-2 inline-block text-sm font-medium text-brand-deep underline-offset-4 hover:underline"
          >
            Add the first entry
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {recent.map((transaction) => {
            const isExpense = transaction.type === "EXPENSE";
            return (
              <li
                key={transaction.id}
                className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-accent/40"
              >
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: categoryColor(transaction.category) }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-card-foreground">
                    {transaction.description || categoryLabel(transaction.category)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {transaction.accountName} · {format(new Date(transaction.date), "d MMM")} ·{" "}
                    {categoryLabel(transaction.category)}
                  </span>
                </span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-sm font-semibold tabular-nums",
                    isExpense ? "text-expense" : "text-income",
                  )}
                >
                  {isExpense ? "−" : "+"}${usd(transaction.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
