import Link from "next/link";

import CreateAccountDrawer from "@/components/create-account-drawer";
import { CurrencyMenu } from "@/app/(main)/_components/currency-menu";
import { formatMoney, type LedgerCurrency } from "@/lib/money";

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  isDefault: boolean;
};

/** Every account with its balance; the row opens that account's ledger. */
export function AccountsCard({
  accounts,
  currency,
}: {
  accounts: Account[];
  currency: LedgerCurrency;
}) {
  return (
    <section aria-labelledby="accounts-heading" className="rounded-3xl border bg-card p-6">
      <header className="flex items-center justify-between gap-4">
        <h2 id="accounts-heading" className="font-semibold tracking-tight">
          Accounts
        </h2>
        <CreateAccountDrawer currency={currency}>
          <button
            type="button"
            aria-label="New account"
            className="rounded-sm text-sm font-semibold text-indigo focus-visible:outline-2 focus-visible:outline-ring dark:text-indigo-soft"
          >
            + New
          </button>
        </CreateAccountDrawer>
      </header>

      {accounts.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Add an account to start logging entries.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-dashed">
          {accounts.map((account) => (
            <li key={account.id}>
              <Link
                href={`/account/${account.id}`}
                className="flex items-center justify-between gap-4 rounded-md py-3 focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span className="min-w-0">
                  <span className="flex items-baseline gap-2 font-semibold">
                    <span className="truncate">{account.name}</span>
                    {account.isDefault && (
                      <span className="text-xs font-bold tracking-wider text-indigo uppercase dark:text-indigo-soft">
                        Default
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {account.type.charAt(0) + account.type.slice(1).toLowerCase()}
                  </span>
                </span>
                <span className="shrink-0 font-mono tabular-nums">
                  {formatMoney(account.balance, currency)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3">
        <span className="text-xs font-medium text-muted-foreground">Ledger currency</span>
        <CurrencyMenu />
      </div>
    </section>
  );
}
