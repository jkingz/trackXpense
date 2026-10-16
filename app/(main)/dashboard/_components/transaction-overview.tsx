"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryColors, defaultCategories } from "@/data/categories";
import { usd } from "@/lib/money";
import { cn } from "@/lib/utils";

type OverviewAccount = {
  id: string;
  name: string;
  isDefault: boolean;
};

type OverviewTransaction = {
  id: string;
  accountId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: Date | string;
  category: string;
  description: string | null;
};

const categoryNames = new Map(defaultCategories.map((c) => [c.id, c.name]));

const categoryLabel = (id: string) => categoryNames.get(id) ?? id;
const categoryDot = (id: string) => categoryColors[id] ?? "var(--color-brand-deep)";

/** How many categories get their own bar before the remainder folds into one line. */
const TOP_CATEGORIES = 6;

/**
 * One account filter drives both panels, so "recent activity" and "where it
 * goes" always describe the same account instead of silently disagreeing.
 */
export function DashboardOverview({
  accounts,
  transactions,
}: {
  accounts: OverviewAccount[];
  transactions: OverviewTransaction[];
}) {
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts.find((a) => a.isDefault)?.id || accounts[0]?.id,
  );

  const accountTransactions = transactions.filter((t) => t.accountId === selectedAccountId);

  const recentTransactions = [...accountTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  const now = new Date();
  const monthExpenses = accountTransactions.filter((t) => {
    const date = new Date(t.date);
    return (
      t.type === "EXPENSE" &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });

  const totalsByCategory = new Map<string, number>();
  for (const transaction of monthExpenses) {
    totalsByCategory.set(
      transaction.category,
      (totalsByCategory.get(transaction.category) ?? 0) + transaction.amount,
    );
  }

  const ranked = [...totalsByCategory.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, TOP_CATEGORIES);
  const rest = ranked.slice(TOP_CATEGORIES);
  const monthTotal = monthExpenses.reduce((total, t) => total + t.amount, 0);

  type Bar = { key: string; label: string; amount: number; color: string };
  const bars: Bar[] = top.map(([category, amount]) => ({
    key: category,
    label: categoryLabel(category),
    amount,
    color: categoryDot(category),
  }));
  if (rest.length > 0) {
    bars.push({
      key: "__rest",
      label: "Everything else",
      amount: rest.reduce((total, [, amount]) => total + amount, 0),
      color: "var(--color-muted-foreground)",
    });
  }

  return (
    <div className="space-y-6">
      {/* Recent activity */}
      <section aria-labelledby="activity-heading" className="rounded-2xl border bg-card">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4">
          <h2
            id="activity-heading"
            className="text-sm font-semibold tracking-tight text-card-foreground"
          >
            Recent activity
          </h2>
          {/* `items` resolves the closed trigger's label to the account name; `null` is
              Base UI's empty sentinel, so the placeholder still shows when no account exists. */}
          <Select
            value={selectedAccountId ?? null}
            items={accounts.map((account) => ({ label: account.name, value: account.id }))}
            onValueChange={(value) => setSelectedAccountId(value ?? "")}
          >
            <SelectTrigger size="sm" className="w-[150px]">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </header>

        {recentTransactions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-muted-foreground">Nothing logged in this account yet.</p>
            <Link
              href="/transaction/create"
              className="mt-2 inline-block text-sm font-medium text-brand-deep underline-offset-4 hover:underline"
            >
              Add the first entry
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recentTransactions.map((transaction) => {
              const isExpense = transaction.type === "EXPENSE";
              return (
                <li
                  key={transaction.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/40"
                >
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: categoryDot(transaction.category) }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-card-foreground">
                      {transaction.description || categoryLabel(transaction.category)}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {format(new Date(transaction.date), "d MMM")} ·{" "}
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

      {/* Where the month went */}
      <section aria-labelledby="breakdown-heading" className="rounded-2xl border bg-card px-5 py-4">
        <header className="flex items-baseline justify-between gap-4">
          <h2
            id="breakdown-heading"
            className="text-sm font-semibold tracking-tight text-card-foreground"
          >
            Where this month went
          </h2>
          <p className="font-mono text-xs tabular-nums text-muted-foreground">${usd(monthTotal)}</p>
        </header>

        {bars.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No spending recorded this month.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {bars.map((bar) => {
              const share = monthTotal > 0 ? (bar.amount / monthTotal) * 100 : 0;
              return (
                <li key={bar.key}>
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        aria-hidden
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: bar.color }}
                      />
                      <span className="truncate text-card-foreground">{bar.label}</span>
                    </span>
                    <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                      ${usd(bar.amount)}
                      <span className="ml-2 text-xs opacity-70">{share.toFixed(0)}%</span>
                    </span>
                  </div>
                  {/* Width is data, so it has to be inline. The bar is decorative
                      — the number above already carries the value. */}
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="--share-bar h-full rounded-full"
                      style={{ width: `${share}%`, backgroundColor: bar.color }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
