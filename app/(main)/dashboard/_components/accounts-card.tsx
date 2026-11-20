import Link from "next/link";

import CreateAccountDrawer from "@/components/create-account-drawer";
import { signedUsd } from "@/lib/money";

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  isDefault: boolean;
  _count?: { transactions?: number } | null;
};

/** Every account with its balance; the row opens that account's ledger. */
export function AccountsCard({ accounts }: { accounts: Account[] }) {
  return (
    <section aria-labelledby="accounts-heading" className="rounded-3xl border bg-card p-6">
      <header className="flex items-center justify-between gap-4">
        <h2 id="accounts-heading" className="font-semibold tracking-tight">
          Accounts
        </h2>
        <CreateAccountDrawer>
          <button
            type="button"
            className="rounded-sm text-sm font-semibold text-indigo focus-visible:outline-2 focus-visible:outline-ring dark:text-indigo-soft"
          >
            + New
          </button>
        </CreateAccountDrawer>
      </header>

      {accounts.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Add an account — a current account, a cash wallet — and every entry rolls up here.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-dashed">
          {accounts.map((account) => {
            const entries = account._count?.transactions ?? 0;
            return (
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
                      {account.type.charAt(0) + account.type.slice(1).toLowerCase()} · {entries}{" "}
                      {entries === 1 ? "entry" : "entries"}
                    </span>
                  </span>
                  <span className="shrink-0 font-mono tabular-nums">
                    {signedUsd(account.balance)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
