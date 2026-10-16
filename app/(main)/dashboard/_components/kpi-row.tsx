import { signedUsd, usd } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * The top row: three totals, no charts. Spending up month-over-month reads as
 * expense-toned (more out is worse); the kept share reads as income-toned.
 */
export function KpiRow({
  accountCount,
  totalBalance,
  income,
  expense,
  savings,
  expenseDelta,
  monthName,
}: {
  accountCount: number;
  totalBalance: number;
  income: number;
  expense: number;
  /** Share of income kept, 0–1. Null when there is no income. */
  savings: number | null;
  /** Percent change of spend vs last month. Null when last month spent nothing. */
  expenseDelta: number | null;
  monthName: string;
}) {
  if (accountCount === 0) {
    return (
      <section className="rounded-xl border border-dashed bg-card px-6 py-10 text-center md:col-span-2 xl:col-span-4">
        <p className="text-lg font-semibold tracking-tight">The ledger is empty</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Add an account — a current account, a cash wallet, whatever you actually spend from — and
          every entry you log will roll up to this line.
        </p>
      </section>
    );
  }

  const net = income - expense;
  const cards = [
    {
      label: "Total in the ledger",
      value: signedUsd(totalBalance),
      valueTone: "text-foreground" as const,
      sub: accountCount === 1 ? "1 account" : <>{accountCount} accounts</>,
      subTone: "text-muted-foreground" as const,
    },
    {
      label: `Spent in ${monthName}`,
      value: `$${usd(expense)}`,
      valueTone: "text-expense" as const,
      sub:
        expenseDelta === null ? (
          "No spending last month"
        ) : (
          <>
            {expenseDelta >= 0 ? "+" : ""}
            {expenseDelta.toFixed(1)}% vs last month
          </>
        ),
      subTone: expenseDelta !== null && expenseDelta > 0 ? "text-expense" : "text-muted-foreground",
    },
    {
      label: `Saved in ${monthName}`,
      value: `${net >= 0 ? "+" : "−"}$${usd(Math.abs(net))}`,
      valueTone: net >= 0 ? ("text-income" as const) : ("text-expense" as const),
      sub:
        savings === null ? (
          "No income this month"
        ) : (
          <>Keeping {(savings * 100).toFixed(0)}% of income</>
        ),
      subTone: savings !== null && savings >= 0 ? "text-income" : "text-muted-foreground",
    },
  ];

  return (
    <>
      {cards.map((card, index) => (
        <section
          key={card.label}
          className={
            index === 0
              ? "glass-hero flex h-full flex-col px-4 py-3 text-center"
              : "glass-panel flex h-full flex-col px-4 py-3 text-center"
          }
        >
          <p className="text-xs text-muted-foreground">{card.label}</p>
          <div className="flex flex-1 flex-col items-center justify-center py-1">
            <p
              className={cn(
                "font-mono text-xl font-semibold tabular-nums tracking-tight sm:text-2xl",
                card.valueTone,
              )}
            >
              {card.value}
            </p>
          </div>
          <p className={cn("text-xs tabular-nums", card.subTone)}>{card.sub}</p>
        </section>
      ))}
    </>
  );
}
