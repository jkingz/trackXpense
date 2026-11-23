"use client";

import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useState } from "react";

import { AccountRow } from "@/app/(main)/dashboard/_components/account-row";
import AddTransactionDialog from "@/components/add-transaction-dialog";
import CreateAccountDrawer from "@/components/create-account-drawer";
import { Button } from "@/components/ui/button";

import { CurrencyContext } from "./currency-context";
import { CurrencyMenu } from "./currency-menu";

type SidebarAccount = {
  id: string;
  name: string;
  type: string;
  balance: number;
  isDefault: boolean;
  _count?: { transactions?: number } | null;
};

/**
 * The app rail for every (main) route: primary action, then the
 * account stack that switches ledgers. Docks left from `lg`; hidden below, where
 * the mobile tab bar takes over.
 */
export function AppSidebar({ accounts, today }: { accounts: SidebarAccount[]; today: string }) {
  const currency = useContext(CurrencyContext);
  const pathname = usePathname();

  // On an account route only that account stays in the rail; the others come
  // back through the toggle or by leaving the account page. Route change resets
  // the toggle, so opening another account collapses the list again.
  const activeAccount = accounts.find((account) => pathname === `/account/${account.id}`);
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  useEffect(() => {
    setShowAllAccounts(false);
  }, [pathname]);
  const collapsed = Boolean(activeAccount) && !showAllAccounts;
  const visibleAccounts = collapsed && activeAccount ? [activeAccount] : accounts;

  return (
    <aside
      aria-label="Ledger navigation"
      className="hidden w-full shrink-0 flex-col gap-4 rounded-lg border border-sidebar-border bg-sidebar p-4 text-sidebar-foreground lg:sticky lg:flex lg:top-24 lg:w-64 lg:self-start"
    >
      <AddTransactionDialog accounts={accounts}>
        <Button className="w-full" size="lg">
          <Plus data-icon="inline-start" />
          Add transaction
        </Button>
      </AddTransactionDialog>

      <section
        aria-labelledby="sidebar-accounts-heading"
        className="border-t border-sidebar-border pt-3"
      >
        <header className="flex items-center justify-between gap-2 px-2 pb-2">
          <h2 id="sidebar-accounts-heading" className="text-sm font-semibold">
            Accounts
          </h2>
          <p className="text-xs tabular-nums text-muted-foreground">{today}</p>
        </header>
        {accounts.length > 0 && (
          <ul
            id="sidebar-accounts-list"
            className="max-h-64 divide-y divide-sidebar-border overflow-y-auto lg:max-h-[calc(100vh-23rem)]"
          >
            {visibleAccounts.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                active={account.id === activeAccount?.id}
              />
            ))}
          </ul>
        )}

        {activeAccount && accounts.length > 1 && (
          <button
            type="button"
            onClick={() => setShowAllAccounts((value) => !value)}
            aria-expanded={!collapsed}
            aria-controls="sidebar-accounts-list"
            className="w-full rounded-md px-2 py-2.5 text-left text-xs font-medium text-muted-foreground hover:bg-sidebar-accent focus-visible:outline-2 focus-visible:outline-ring"
          >
            {collapsed ? `Show all ${accounts.length} accounts` : "Show only this account"}
          </button>
        )}

        <CreateAccountDrawer currency={currency}>
          <Button variant="ghost" className="mt-2 w-full justify-start">
            <Plus data-icon="inline-start" />
            New account
          </Button>
        </CreateAccountDrawer>
      </section>

      <div className="flex items-center justify-between gap-2 border-t border-sidebar-border pt-3">
        <span className="text-xs font-medium text-muted-foreground">Ledger currency</span>
        <CurrencyMenu />
      </div>
    </aside>
  );
}
