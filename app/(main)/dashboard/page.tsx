import { format } from "date-fns";
import { connection } from "next/server";
import { cache, Suspense } from "react";

import { getCurrentBudget } from "@/actions/budget";
import { getDashboardData, getUserAccounts } from "@/actions/dashboard";
import { requireUser } from "@/actions/lib/checkUser";
import type { LedgerCurrency } from "@/lib/money";
import {
  cashflow,
  expenseDeltaPct,
  monthTotals,
  savingsRate,
  spendByCategory,
  spendByWeekday,
  yearComparison,
} from "@/lib/dashboard-stats";

import BudgetProgress from "./_components/budget-progress";
import { CashflowPanel } from "./_components/cashflow-panel";
import { CategoryBreakdown } from "./_components/category-breakdown";
import {
  BudgetSkeleton,
  ChartsSkeleton,
  KpiSkeleton,
  YearSkeleton,
} from "./_components/dashboard-skeleton";
import { KpiRow } from "./_components/kpi-row";
import { RecentActivity } from "./_components/recent-activity";
import { YearCard } from "./_components/year-card";

// Reads the ledger on every request, so it cannot be prerendered: opt out of
// instant prerendering, which cannot complete without request data.
export const instant = false;

/**
 * The statement band and the activity panel both read the same ledger, and
 * React.cache collapses those reads into one query per request while still
 * letting each boundary fill in on its own.
 */
const loadTransactions = cache(() => getDashboardData());

type Account = Awaited<ReturnType<typeof getUserAccounts>>[number];

async function KpiSection({
  accounts,
  now,
  currency,
}: {
  accounts: Account[];
  now: Date;
  currency: LedgerCurrency;
}) {
  const transactions = await loadTransactions();
  const { income, expense } = monthTotals(transactions, now);
  const previous = monthTotals(
    transactions,
    new Date(now.getFullYear(), now.getMonth() - 1, 15),
  ).expense;

  return (
    <KpiRow
      currency={currency}
      accountCount={accounts.length}
      totalBalance={accounts.reduce((total, account) => total + account.balance, 0)}
      income={income}
      expense={expense}
      savings={savingsRate(income, expense)}
      expenseDelta={expenseDeltaPct(expense, previous)}
    />
  );
}

async function OverviewSection({
  accounts,
  now,
  currency,
  defaultAccountId,
}: {
  accounts: Account[];
  now: Date;
  currency: LedgerCurrency;
  defaultAccountId?: string;
}) {
  const transactions = await loadTransactions();
  const { slices, total } = spendByCategory(transactions, now);
  const names = new Map(accounts.map((account) => [account.id, account.name]));
  const recent = transactions.map((transaction) => ({
    ...transaction,
    accountName: names.get(transaction.accountId) ?? "Unknown account",
  }));

  return (
    <>
      <CashflowPanel days={cashflow(transactions, now)} week={spendByWeekday(transactions, now)} />
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <CategoryBreakdown slices={slices} total={total} currency={currency} />
        {defaultAccountId && (
          <Suspense fallback={<BudgetSkeleton />}>
            <BudgetSection defaultAccountId={defaultAccountId} />
          </Suspense>
        )}
      </div>
      <RecentActivity transactions={recent} currency={currency} />
    </>
  );
}

async function YearSection({ currency, now }: { currency: LedgerCurrency; now: Date }) {
  const transactions = await loadTransactions();
  const { thisYear, lastYear, deltaPct } = yearComparison(transactions, now);

  return (
    <YearCard
      currency={currency}
      year={now.getFullYear()}
      thisYear={thisYear}
      lastYear={lastYear}
      deltaPct={deltaPct}
    />
  );
}

async function BudgetSection({ defaultAccountId }: { defaultAccountId: string }) {
  const budget = await getCurrentBudget(defaultAccountId);

  return (
    <BudgetProgress initialBudget={budget?.budget} currentExpenses={budget?.currentExpenses ?? 0} />
  );
}

const DashBoardPage = async () => {
  // Before its data work: a signed-out visitor is sent to sign-in instead of
  // rendering a page whose first read throws.
  const { currency } = await requireUser();
  const accounts = await getUserAccounts();
  const defaultAccount = accounts.find((account) => account.isDefault);
  // Pin this render to a request before consulting the clock. Next refuses an
  // unstable `new Date()` during the prerender pass (blocking-prerender-current-
  // time), and the month names below are genuinely request data.
  await connection();
  const now = new Date();

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="text-sm font-medium text-muted-foreground">{format(now, "MMMM yyyy")}</p>
      </header>

      <Suspense fallback={<KpiSkeleton />}>
        <KpiSection currency={currency} accounts={accounts} now={now} />
      </Suspense>
      <Suspense fallback={<ChartsSkeleton showBudget={Boolean(defaultAccount)} />}>
        <OverviewSection
          currency={currency}
          accounts={accounts}
          now={now}
          defaultAccountId={defaultAccount?.id}
        />
      </Suspense>
      <Suspense fallback={<YearSkeleton />}>
        <YearSection currency={currency} now={now} />
      </Suspense>
    </div>
  );
};

export default DashBoardPage;
