import { notFound } from "next/navigation";

import { getAccountsWithTransactions, getPaginatedTransactions } from "@/actions/accounts";
import { signedUsd } from "@/lib/money";

import AccountChart from "../_components/account-chart";
import TransactionsTable from "../_components/transaction-table";

// Reads one account's ledger on every request, so it cannot be prerendered: opt
// out of instant prerendering, which cannot complete without request data.
export const instant = false;

const AccountsPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const page = parseInt(resolvedSearchParams.page || "1", 10);
  const searchTerm = resolvedSearchParams.search || "";
  const typeFilter = resolvedSearchParams.type || "";
  const recurringFilter = resolvedSearchParams.recurring || "";
  const sortField = resolvedSearchParams.sortField || "date";
  const sortDirection = resolvedSearchParams.sortDirection || "desc";
  const itemsPerPage = 10;

  // Fetch account and transactions in parallel
  const [accountData, { transactions, total }] = await Promise.all([
    getAccountsWithTransactions(resolvedParams.id),
    getPaginatedTransactions({
      page,
      itemsPerPage,
      searchTerm,
      typeFilter,
      recurringFilter,
      sortField,
      sortDirection,
    }),
  ]);

  if (!accountData) return notFound();

  const { ...account } = accountData;
  const entryCount = account._count?.transactions || total;
  return (
    <div className="space-y-8 px-5">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-sm text-muted-foreground">
            {account.type
              ? account.type.charAt(0) + account.type.slice(1).toLowerCase()
              : "Unknown"}{" "}
            account
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground capitalize sm:text-4xl">
            {account.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {entryCount} {entryCount === 1 ? "entry" : "entries"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
            {signedUsd(account.balance)}
          </p>
        </div>
      </div>

      {/* Both halves render from the transactions already awaited above, so the
          route's loading.tsx is the boundary here — no nested Suspense needed. */}
      <div className="--reveal space-y-8">
        <AccountChart transactions={transactions} />

        <TransactionsTable
          transactions={transactions}
          totalItems={total}
          searchParams={resolvedSearchParams}
        />
      </div>
    </div>
  );
};

export default AccountsPage;
