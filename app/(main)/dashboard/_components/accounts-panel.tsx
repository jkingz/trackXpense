import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import CreateAccountDrawer from "@/components/create-account-drawer";

import { AccountRow } from "./account-row";

/**
 * Accounts as a ledger stack rather than a grid of identical cards: one border,
 * hairline rules between rows, the balance right-aligned on the decimal. The
 * create trigger is a row too, so adding an account is part of the same list
 * instead of a floating card beside it.
 */
export function AccountsPanel({
  accounts,
}: {
  accounts: {
    id: string;
    name: string;
    type: string;
    balance: number;
    isDefault: boolean;
    _count?: { transactions?: number } | null;
  }[];
}) {
  return (
    <section
      aria-labelledby="accounts-heading"
      className="overflow-hidden rounded-2xl border bg-card"
    >
      <header className="border-b px-5 py-3.5">
        <h2
          id="accounts-heading"
          className="text-sm font-semibold tracking-tight text-card-foreground"
        >
          Accounts
        </h2>
      </header>

      {accounts.length > 0 && (
        <ul className="divide-y divide-border">
          {accounts.map((account) => (
            <AccountRow key={account.id} account={account} />
          ))}
        </ul>
      )}

      <CreateAccountDrawer>
        <Button
          variant="ghost"
          className="w-full justify-center gap-2 rounded-none border-t bg-muted/40 py-3.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-4" />
          New account
        </Button>
      </CreateAccountDrawer>
    </section>
  );
}
