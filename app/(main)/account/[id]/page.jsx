import {
  getAccountsWithTransactions,
  getPaginatedTransactions,
} from '@/actions/accounts';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { BarLoader } from 'react-spinners';
import TransactionsTable from '../_components/transaction-table';

const AccountsPage = async ({ params, searchParams }) => {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const page = parseInt(resolvedSearchParams.page || '1', 10);
  const searchTerm = resolvedSearchParams.search || '';
  const typeFilter = resolvedSearchParams.type || '';
  const recurringFilter = resolvedSearchParams.recurring || '';
  const sortField = resolvedSearchParams.sortField || 'date';
  const sortDirection = resolvedSearchParams.sortDirection || 'desc';
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

  const { transactions: allTransactions, ...account } = accountData;
  return (
    <div className="space-y-8 px-5">
      <div className="flex gap-4 items-end justify-between">
        <div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight --gradient-title capitalize">
            {account.name}
          </h1>
          <p className="text-muted-foreground">
            {account.type
              ? account.type.charAt(0) + account.type.slice(1).toLowerCase()
              : 'Unknown'}{' '}
            Account
          </p>
        </div>
        <div className="text-right pb-2">
          <div className="text-xl sm:text-2xl font-bold">
            ${parseFloat(account.balance).toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">
            {account._count?.transactions || total} Transactions
          </p>
        </div>
      </div>

      {/* {Chart Section} */}
      {/* {Transactions Table} */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={'100%'} color="#9333ea" />}
      >
        <TransactionsTable
          transactions={transactions}
          totalItems={total}
          searchParams={resolvedSearchParams}
        />
      </Suspense>
    </div>
  );
};

export default AccountsPage;
