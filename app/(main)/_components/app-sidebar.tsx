"use client";

import { ArrowLeft, LayoutDashboard, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AccountRow } from "@/app/(main)/dashboard/_components/account-row";
import CreateAccountDrawer from "@/components/create-account-drawer";
import { Button } from "@/components/ui/button";

type SidebarAccount = {
  id: string;
  name: string;
  type: string;
  balance: number;
  isDefault: boolean;
  _count?: { transactions?: number } | null;
};

/**
 * The app rail for every (main) route: primary action, one nav link, then the
 * account stack that switches ledgers. Stacks above content on small screens,
 * docks left on desktop.
 */
export function AppSidebar({ accounts, today }: { accounts: SidebarAccount[]; today: string }) {
  const pathname = usePathname();
  const onDashboard = pathname === "/dashboard";

  return (
    <aside className="w-full shrink-0 space-y-6 lg:sticky lg:top-24 lg:w-72 lg:self-start">
      {!onDashboard && (
        <nav aria-label="Primary">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
          >
            <ArrowLeft aria-hidden className="size-4 order-first lg:order-last lg:ml-auto" />
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
        </nav>
      )}

      <section aria-labelledby="sidebar-accounts-heading">
        <div className="overflow-hidden glass-panel">
          <header className="flex items-center justify-between gap-4 border-b px-5 py-4">
            <h2
              id="sidebar-accounts-heading"
              className="text-sm font-semibold tracking-tight text-card-foreground"
            >
              Accounts
              {accounts.length > 0 && (
                <span className="ml-1.5 font-mono text-xs font-medium tabular-nums text-muted-foreground">
                  {accounts.length}
                </span>
              )}
            </h2>
            <p className="flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
              <span aria-hidden className="--live-dot size-1.5 rounded-full bg-income" />
              <span className="date-glow">{today}</span>
            </p>
          </header>
          {accounts.length > 0 && (
            <ul className="max-h-80 divide-y divide-border overflow-y-auto lg:max-h-[calc(100vh-24rem)]">
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
        </div>
      </section>

      <Link href="/transaction/create" className="block">
        <Button className="w-full gap-2 rounded-full">
          <Plus />
          Add Transaction
        </Button>
      </Link>
    </aside>
  );
}
