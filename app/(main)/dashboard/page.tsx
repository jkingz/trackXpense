import { format } from "date-fns";
import { connection } from "next/server";
import { cache, Suspense } from "react";

import { getCurrentBudget } from "@/actions/budget";
import { getDashboardData, getUserAccounts } from "@/actions/dashboard";
import { requireUser } from "@/actions/lib/checkUser";
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
import { CategoryDonut } from "./_components/category-donut";
import {
  BudgetSkeleton,
  ChartsSkeleton,
  KpiCardsSkeleton,
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

async function KpiSection({ accounts, monthName }: { accounts: Account[]; monthName: string }) {
  const transactions = await loadTransactions();
  const now = new Date();
  const { income, expense } = monthTotals(transactions, now);
  const previous = monthTotals(
    transactions,
    new Date(now.getFullYear(), now.getMonth() - 1, 15),
  ).expense;

  return (
    <KpiRow
      accountCount={accounts.length}
      totalBalance={accounts.reduce((total, account) => total + account.balance, 0)}
      income={income}
      expense={expense}
      savings={savingsRate(income, expense)}
      expenseDelta={expenseDeltaPct(expense, previous)}
      monthName={monthName}
    />
  );
}

async function OverviewSection({
  accounts,
  monthName,
}: {
  accounts: Account[];
  monthName: string;
}) {
  const transactions = await loadTransactions();
  const now = new Date();
  const { slices, total } = spendByCategory(transactions, now);
  const names = new Map(accounts.map((account) => [account.id, account.name]));
  const recent = transactions.map((transaction) => ({
    ...transaction,
    accountName: names.get(transaction.accountId) ?? "Unknown account",
  }));

  return (
    <div className="--reveal grid items-start gap-4 lg:grid-cols-3">
      <CategoryDonut slices={slices} total={total} monthName={monthName} />
      <CashflowPanel days={cashflow(transactions, now)} week={spendByWeekday(transactions, now)} />
      <RecentActivity transactions={recent} />
    </div>
  );
}

async function YearSection() {
  const transactions = await loadTransactions();
  const { thisYear, lastYear, deltaPct } = yearComparison(transactions, new Date());

  return (
    <div className="--reveal">
      <YearCard thisYear={thisYear} lastYear={lastYear} deltaPct={deltaPct} />
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
  // Before its data work: a signed-out visitor is sent to sign-in instead of
  // rendering a page whose first read throws.
  await requireUser();
  const accounts = await getUserAccounts();
  const defaultAccount = accounts?.find((account) => account.isDefault);
  // Pin this render to a request before consulting the clock. Next refuses an
  // unstable `new Date()` during the prerender pass (blocking-prerender-current-
  // time), and the month names below are genuinely request data.
  await connection();
  const now = new Date();

  return (
    <div className="space-y-4">
      <Suspense fallback={<YearSkeleton />}>
        <YearSection />
      </Suspense>

      <div className="--reveal grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Suspense fallback={<BudgetSkeleton />}>
          <BudgetSection defaultAccountId={defaultAccount?.id} />
        </Suspense>

        <Suspense fallback={<KpiCardsSkeleton />}>
          <KpiSection accounts={accounts} monthName={format(now, "MMMM")} />
        </Suspense>
      </div>

      <Suspense fallback={<ChartsSkeleton />}>
        <OverviewSection accounts={accounts} monthName={format(now, "MMMM")} />
      </Suspense>
    </div>
  );
};

export default DashBoardPage;
