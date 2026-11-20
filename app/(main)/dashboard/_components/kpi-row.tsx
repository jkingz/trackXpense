import { formatMoney, type LedgerCurrency } from "@/lib/money";
import { cn } from "@/lib/utils";

export function KpiRow({
  currency,
  accountCount,
  totalBalance,
  income,
  expense,
  savings,
  expenseDelta,
}: {
  currency: LedgerCurrency;
  accountCount: number;
  totalBalance: number;
  income: number;
  expense: number;
  savings: number | null;
  expenseDelta: number | null;
}) {
  const net = income - expense;

  return (
    <section aria-label="Balance and monthly totals" className="ledger-panel">
      <dl>
        <div className="px-5 py-5 sm:px-6">
          <dt className="text-sm font-medium text-muted-foreground">Total balance</dt>
          <dd className="mt-1 break-words font-mono text-3xl font-semibold tracking-tight sm:text-4xl">
            {formatMoney(totalBalance, currency)}
          </dd>
          <dd className="mt-1 text-xs text-muted-foreground">
            {accountCount === 0
              ? "Add an account to start your ledger."
              : `${accountCount} ${accountCount === 1 ? "account" : "accounts"}`}
          </dd>
        </div>
      </dl>
      {accountCount > 0 && (
        <dl className="grid divide-y divide-border border-t sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-5 py-3 sm:px-6">
            <dt className="text-sm font-medium text-muted-foreground">Income</dt>
            <dd className="mt-1 break-words font-mono text-lg font-semibold text-income">
              {formatMoney(income, currency)}
            </dd>
          </div>
          <div className="px-5 py-3 sm:px-6">
            <dt className="text-sm font-medium text-muted-foreground">Expenses</dt>
            <dd className="mt-1 break-words font-mono text-lg font-semibold text-expense">
              {formatMoney(expense, currency)}
            </dd>
            {expenseDelta !== null && (
              <dd className="mt-1 text-xs text-muted-foreground">
                {expenseDelta >= 0 ? "+" : ""}
                {expenseDelta.toFixed(1)}% vs last month
              </dd>
            )}
          </div>
          <div className="px-5 py-3 sm:px-6">
            <dt className="text-sm font-medium text-muted-foreground">Net income</dt>
            <dd
              className={cn(
                "mt-1 break-words font-mono text-lg font-semibold",
                net >= 0 ? "text-income" : "text-expense",
              )}
            >
              {formatMoney(net, currency)}
            </dd>
            {savings !== null && savings >= 0 && (
              <dd className="mt-1 text-xs text-muted-foreground">
                {Math.round(savings * 100)}% of income kept
              </dd>
            )}
          </div>
        </dl>
      )}
    </section>
  );
}
