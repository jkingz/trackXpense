import { signedUsd, usd } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * The one loud element on the page: what is in the ledger right now, with the
 * month's movement as quiet supporting figures. Money direction keeps the same
 * tokens the rest of the app uses, so income and expense read consistently
 * whether they appear here, in a row, or in the chart.
 */
export function LedgerSummary({
  totalBalance,
  accountCount,
  income,
  expense,
}: {
  totalBalance: number;
  accountCount: number;
  income: number;
  expense: number;
}) {
  const net = income - expense;

  const stats = [
    { label: "In this month", value: income, tone: "income" as const, sign: "+" },
    { label: "Out this month", value: expense, tone: "expense" as const, sign: "−" },
    {
      label: "Net this month",
      value: Math.abs(net),
      tone: net >= 0 ? ("income" as const) : ("expense" as const),
      sign: net >= 0 ? "+" : "−",
    },
  ];

  if (accountCount === 0) {
    return (
      <section className="rounded-2xl border border-dashed bg-card px-6 py-10 text-center">
        <p className="text-lg font-semibold tracking-tight">The ledger is empty</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Add an account — a current account, a cash wallet, whatever you actually spend from — and
          every entry you log will roll up to this line.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-card px-6 py-7 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div>
          <p className="text-sm text-muted-foreground">Total in the ledger</p>
          <p className="mt-2 font-mono text-4xl font-bold tabular-nums leading-none tracking-tight text-foreground sm:text-5xl">
            {signedUsd(totalBalance)}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:flex sm:divide-x sm:divide-border">
          {stats.map((stat) => (
            <div key={stat.label} className="sm:pr-8 sm:last:pr-0">
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd
                className={cn(
                  "mt-1 font-mono text-lg font-semibold tabular-nums",
                  stat.tone === "income" ? "text-income" : "text-expense",
                )}
              >
                {stat.sign}${usd(stat.value)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
