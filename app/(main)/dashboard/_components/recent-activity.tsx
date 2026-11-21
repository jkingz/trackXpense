import { format } from "date-fns";
import { ArrowRight, Repeat } from "lucide-react";
import Link from "next/link";

import { formatMoney, type LedgerCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";

import { categoryLabel } from "./category-helpers";

export type RecentTransaction = {
  id: string;
  description: string | null;
  category: string;
  date: Date | string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  accountName: string;
  isRecurring?: boolean;
  recurringInterval?: string | null;
};

/** Latest entries across every account; the just-saved one wears the lime fill. */
export function RecentActivity({
  transactions,
  savedId,
  ledgerHref,
  currency,
}: {
  transactions: RecentTransaction[];
  currency: LedgerCurrency;
  savedId?: string;
  ledgerHref: string | null;
}) {
  const recent = [...transactions]
    // The just-saved row leads even when backdated, so its highlight is never cut off.
    .sort(
      (a, b) =>
        Number(b.id === savedId) - Number(a.id === savedId) ||
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
    .slice(0, 5);

  return (
    <section aria-labelledby="activity-heading" className="rounded-3xl border bg-card p-6 sm:p-8">
      <header className="flex items-center justify-between gap-4">
        <h2 id="activity-heading" className="text-lg font-semibold tracking-tight">
          Recent entries
        </h2>
        {ledgerHref && (
          <Link
            href={ledgerHref}
            className="flex items-center gap-1 rounded-sm text-sm font-semibold text-indigo focus-visible:outline-2 focus-visible:outline-ring dark:text-indigo-soft"
          >
            Open ledger <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        )}
      </header>

      {recent.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-dashed">
          {recent.map((transaction) => {
            const isExpense = transaction.type === "EXPENSE";
            const saved = transaction.id === savedId;
            return (
              <li
                key={transaction.id}
                className={cn(
                  "grid grid-cols-[4rem_1fr_auto] items-center gap-4 px-4 py-3.5 md:grid-cols-[4rem_1fr_9rem_9rem_8rem]",
                  saved && "--reveal rounded-xl border-0 bg-lime text-navy",
                )}
              >
                <span
                  className={cn("font-mono text-xs", saved ? "text-navy" : "text-muted-foreground")}
                >
                  {format(new Date(transaction.date), "d MMM")}
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  <span className={cn("truncate", saved && "font-bold")}>
                    {transaction.description || categoryLabel(transaction.category)}
                  </span>
                  {saved && <span className="shrink-0 text-xs">· just saved</span>}
                  {transaction.isRecurring && transaction.recurringInterval && (
                    <span
                      className={cn(
                        "flex shrink-0 items-center gap-1 font-mono text-xs tracking-wider uppercase",
                        saved ? "text-navy" : "text-indigo dark:text-indigo-soft",
                      )}
                    >
                      <Repeat aria-hidden className="size-3" />
                      {transaction.recurringInterval}
                    </span>
                  )}
                </span>
                <span className="hidden truncate text-sm md:block">
                  {categoryLabel(transaction.category)}
                </span>
                <span className="hidden truncate text-sm md:block">{transaction.accountName}</span>
                <span
                  className={cn(
                    "text-right font-mono tabular-nums",
                    saved ? "font-bold text-navy" : isExpense ? "text-expense" : "text-income",
                  )}
                >
                  {isExpense ? "−" : "+"}
                  {formatMoney(transaction.amount, currency)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
