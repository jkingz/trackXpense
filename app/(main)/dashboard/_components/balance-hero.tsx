import Link from "next/link";

import { formatMoney, type LedgerCurrency } from "@/lib/money";

import { QuickEntry } from "./quick-entry";

type Account = { id: string; name: string; isDefault: boolean };

/** The indigo statement: total, this month's flow, and the quick-entry bar. */
export function BalanceHero({
  accounts,
  totalBalance,
  income,
  expense,
  currency,
}: {
  currency: LedgerCurrency;
  accounts: Account[];
  totalBalance: number;
  income: number;
  expense: number;
}) {
  const [whole, cents] = formatMoney(Math.abs(totalBalance), currency).split(".");
  // Same threshold as formatMoney: a sub-cent negative prints as ₱0.00 with no minus.
  const sign = totalBalance <= -0.005 ? "−" : "";

  return (
    <section
      aria-labelledby="balance-heading"
      className="relative h-full overflow-hidden rounded-3xl bg-indigo p-6 text-white sm:p-10"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-28 -right-20 size-112 rounded-full border border-white/20"
      />

      <h2 id="balance-heading" className="relative text-sm text-white/80">
        Total balance
      </h2>

      <p className="relative mt-1 text-6xl font-extrabold tracking-tighter tabular-nums sm:text-7xl">
        {sign}
        {whole}
        <span className="text-indigo-soft">.{cents}</span>
      </p>

      <dl className="relative mt-10 flex flex-wrap gap-x-12 gap-y-4">
        <div>
          <dt className="text-sm text-white/75">Income this month</dt>
          <dd className="mt-1 font-mono text-lg tabular-nums">{formatMoney(income, currency)}</dd>
        </div>
        <div>
          <dt className="text-sm text-white/75">Spent this month</dt>
          <dd className="mt-1 font-mono text-lg tabular-nums">{formatMoney(expense, currency)}</dd>
        </div>
      </dl>

      {accounts.length > 0 && (
        <div className="relative mt-10">
          <QuickEntry accounts={accounts} />
          <Link
            href="/transaction/create"
            className="mt-4 inline-block rounded-sm text-sm font-medium text-white underline decoration-white/50 underline-offset-4 hover:decoration-white focus-visible:outline-2 focus-visible:outline-white"
          >
            Log from a receipt or add details
          </Link>
        </div>
      )}
    </section>
  );
}
