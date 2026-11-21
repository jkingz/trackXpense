import { connection } from "next/server";
import { cache, Suspense } from "react";

import { getDashboardData, getUserAccounts } from "@/actions/dashboard";
import { requireUser } from "@/actions/lib/checkUser";
import { monthTotals, spendByCategory, spendSeries } from "@/lib/dashboard-stats";
import type { LedgerCurrency } from "@/lib/money";

import { BudgetSection } from "../_components/budget-section";
import { AccountsCard } from "./_components/accounts-card";
import { BalanceHero } from "./_components/balance-hero";
import {
  BudgetSkeleton,
  ChartsSkeleton,
  HeroSkeleton,
  RecentSkeleton,
} from "./_components/dashboard-skeleton";
import { RecentActivity } from "./_components/recent-activity";
import { SpendBars } from "./_components/spend-bars";
import { WhereItWent } from "./_components/where-it-went";

// Reads the ledger on every request, so it cannot be prerendered: opt out of
// instant prerendering, which cannot complete without request data.
export const instant = false;

/**
 * Every section reads the same ledger, and React.cache collapses those reads
 * into one query per request while still letting each boundary fill in on its own.
 */
const loadTransactions = cache(() => getDashboardData());

type Account = Awaited<ReturnType<typeof getUserAccounts>>[number];

async function HeroSection({
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

  return (
    <BalanceHero
      accounts={accounts}
      totalBalance={accounts.reduce((total, account) => total + account.balance, 0)}
      income={income}
      expense={expense}
      currency={currency}
    />
  );
}

async function SpendSection({ now, currency }: { now: Date; currency: LedgerCurrency }) {
  const transactions = await loadTransactions();
  const { slices, total } = spendByCategory(transactions, now, Infinity, "year");

  return (
    <>
      <div className="--reveal lg:col-span-8">
        <SpendBars
          series={{
            "7d": spendSeries(transactions, now, "7d"),
            "30d": spendSeries(transactions, now, "30d"),
            "6m": spendSeries(transactions, now, "6m"),
          }}
        />
      </div>
      <div className="--reveal lg:col-span-4">
        <WhereItWent slices={slices} total={total} year={now.getFullYear()} currency={currency} />
      </div>
    </>
  );
}

async function RecentSection({
  accounts,
  savedId,
  ledgerHref,
  currency,
}: {
  accounts: Account[];
  savedId?: string;
  ledgerHref: string | null;
  currency: LedgerCurrency;
}) {
  const transactions = await loadTransactions();
  const names = new Map(accounts.map((account: any) => [account.id, account.name]));
  const recent = transactions.map((transaction: any) => ({
    ...transaction,
    accountName: names.get(transaction.accountId) ?? "Unknown account",
  }));

  return (
    <div className="--reveal lg:col-span-12">
      <RecentActivity
        transactions={recent}
        savedId={savedId}
        ledgerHref={ledgerHref}
        currency={currency}
      />
    </div>
  );
}

const DashBoardPage = async ({ searchParams }: { searchParams: Promise<{ saved?: string }> }) => {
  // Before its data work: a signed-out visitor is sent to sign-in instead of
  // rendering a page whose first read throws.
  const { currency } = await requireUser();
  const accounts = await getUserAccounts();
  const { saved } = await searchParams;
  const defaultAccount = accounts?.find((account: any) => account.isDefault);
  const ledgerHref = defaultAccount ? `/account/${defaultAccount.id}` : null;
  // Pin this render to a request before consulting the clock. Next refuses an
  // unstable `new Date()` during the prerender pass (blocking-prerender-current-
  // time), and the month names below are genuinely request data.
  await connection();
  const now = new Date();

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <Suspense fallback={<HeroSkeleton />}>
          <HeroSection accounts={accounts} now={now} currency={currency} />
        </Suspense>
      </div>

      <div className="flex flex-col gap-6 lg:col-span-4">
        <AccountsCard accounts={accounts} currency={currency} />
        {defaultAccount && (
          <div id="budget" className="scroll-mt-24">
            <Suspense fallback={<BudgetSkeleton />}>
              <BudgetSection accountId={defaultAccount.id} now={now} />
            </Suspense>
          </div>
        )}
      </div>

      <Suspense fallback={<ChartsSkeleton />}>
        <SpendSection now={now} currency={currency} />
      </Suspense>

      <Suspense fallback={<RecentSkeleton />}>
        <RecentSection
          accounts={accounts}
          savedId={saved}
          ledgerHref={ledgerHref}
          currency={currency}
        />
      </Suspense>
    </div>
  );
};

export default DashBoardPage;
