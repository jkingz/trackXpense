import { format } from "date-fns";
import { Plus } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { cache, Suspense } from "react";

import { getCurrentBudget } from "@/actions/budget";
import { getDashboardData, getUserAccounts } from "@/actions/dashboard";
import { Button } from "@/components/ui/button";

import { AccountsPanel } from "./_components/accounts-panel";
import BudgetProgress from "./_components/budget-progress";
import {
  ActivitySkeleton,
  BudgetSkeleton,
  SummarySkeleton,
} from "./_components/dashboard-skeleton";
import { LedgerSummary } from "./_components/ledger-summary";
import { DashboardOverview } from "./_components/transaction-overview";

// Reads the ledger on every request, so it cannot be prerendered: opt out of
// instant prerendering, which cannot complete without request data.
export const instant = false;

/**
 * The statement band and the activity panel both read the same ledger, and
 * React.cache collapses those two reads into one query per request while still
 * letting each boundary fill in on its own.
 */
const loadTransactions = cache(() => getDashboardData());

type Account = Awaited<ReturnType<typeof getUserAccounts>>[number];

function PageHeader({ accountCount, monthLabel }: { accountCount: number; monthLabel: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
      <div>
        <p className="text-sm text-muted-foreground">{monthLabel}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Your ledger
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {accountCount === 0
            ? "No accounts yet"
            : `${accountCount} ${accountCount === 1 ? "account" : "accounts"}`}
        </p>
      </div>
      <Link href="/transaction/create">
        <Button>
          <Plus />
          Add a transaction
        </Button>
      </Link>
    </div>
  );
}

async function SummarySection({ accounts }: { accounts: Account[] }) {
  const transactions = await loadTransactions();
  const now = new Date();

  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    const date = new Date(t.date);
    if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) continue;
    if (t.type === "INCOME") income += t.amount;
    else expense += t.amount;
  }

  return (
    <div className="--reveal">
      <LedgerSummary
        totalBalance={accounts.reduce((total, account) => total + account.balance, 0)}
        accountCount={accounts.length}
        income={income}
        expense={expense}
      />
    </div>
  );
}

async function ActivitySection({ accounts }: { accounts: Account[] }) {
  const transactions = await loadTransactions();

  return (
    <div className="--reveal">
      <DashboardOverview accounts={accounts} transactions={transactions || []} />
    </div>
  );
}

async function BudgetSection({ defaultAccountId }: { defaultAccountId?: string }) {
  if (!defaultAccountId) return null;

  const budget = await getCurrentBudget(defaultAccountId);

  return (
    <div className="--reveal">
      <BudgetProgress
        initialBudget={budget?.budget}
        currentExpenses={budget?.currentExpenses || 0}
      />
    </div>
  );
}

const DashBoardPage = async () => {
  const accounts = await getUserAccounts();
  const defaultAccount = accounts?.find((account) => account.isDefault);
  // Pin this render to a request before consulting the clock. Next refuses an
  // unstable `new Date()` during the prerender pass (blocking-prerender-current-
  // time), and the month label above the ledger is genuinely request data.
  await connection();
  const monthLabel = format(new Date(), "MMMM yyyy");

  return (
    <div className="space-y-8">
      <PageHeader accountCount={accounts.length} monthLabel={monthLabel} />

      <Suspense fallback={<SummarySkeleton />}>
        <SummarySection accounts={accounts} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<ActivitySkeleton />}>
            <ActivitySection accounts={accounts} />
          </Suspense>
        </div>

        <div className="space-y-6">
          <Suspense fallback={<BudgetSkeleton />}>
            <BudgetSection defaultAccountId={defaultAccount?.id} />
          </Suspense>

          <AccountsPanel accounts={accounts} />
        </div>
      </div>
    </div>
  );
};

export default DashBoardPage;
