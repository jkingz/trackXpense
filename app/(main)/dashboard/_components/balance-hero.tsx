import { usd } from "@/lib/money";

import { QuickEntry } from "./quick-entry";

type Account = { id: string; name: string; isDefault: boolean };

/** The indigo statement: total, this month's flow, and the quick-entry bar. */
export function BalanceHero({
  accounts,
  totalBalance,
  income,
  expense,
  expenseDelta,
  previousMonth,
  today,
}: {
  accounts: Account[];
  totalBalance: number;
  income: number;
  expense: number;
  /** Percent change of spend vs last month. Null when last month spent nothing. */
  expenseDelta: number | null;
  previousMonth: string;
  today: string;
}) {
  const [whole, cents] = usd(Math.abs(totalBalance)).split(".");
  const sign = totalBalance < 0 ? "−" : "";

  return (
    <section
      aria-labelledby="balance-heading"
      className="relative h-full overflow-hidden rounded-3xl bg-indigo p-6 text-white sm:p-10"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-28 -right-20 size-112 rounded-full border border-white/20"
      />

      <div className="relative flex items-start justify-between gap-4">
        <h2 id="balance-heading" className="text-sm text-white/80">
          Total balance · {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
        </h2>
        <p className="font-mono text-xs tracking-widest text-indigo-soft">{today}</p>
      </div>

      <p className="relative mt-1 text-6xl font-extrabold tracking-tighter tabular-nums sm:text-7xl">
        {sign}${whole}
        <span className="text-indigo-soft">.{cents}</span>
      </p>

      <dl className="relative mt-10 flex flex-wrap gap-x-12 gap-y-4">
        <div>
          <dt className="text-sm text-white/75">In this month</dt>
          <dd className="mt-1 font-mono text-lg tabular-nums">+${usd(income)}</dd>
        </div>
        <div>
          <dt className="text-sm text-white/75">Out this month</dt>
          <dd className="mt-1 font-mono text-lg tabular-nums">−${usd(expense)}</dd>
        </div>
        <div>
          <dt className="text-sm text-white/75">vs {previousMonth}</dt>
          <dd className="mt-1 font-mono text-lg tabular-nums text-lime">
            {expenseDelta === null
              ? "—"
              : `${Math.abs(expenseDelta).toFixed(0)}% ${expenseDelta <= 0 ? "less" : "more"}`}
          </dd>
        </div>
      </dl>

      {accounts.length > 0 && (
        <div className="relative mt-10">
          <QuickEntry accounts={accounts} />
        </div>
      )}
    </section>
  );
}
