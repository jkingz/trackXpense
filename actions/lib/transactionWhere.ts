import type { Prisma, TransactionType } from "@prisma/client";

export type TransactionFilters = {
  userId: string;
  accountId: string;
  searchTerm?: string;
  typeFilter?: string;
  recurringFilter?: string;
};

/**
 * The row scope every account-page query shares: one account, owned by the
 * user. Account and owner travel together so a naked accountId can never leak
 * another user's ledger into the table.
 */
export function buildTransactionWhere({
  userId,
  accountId,
  searchTerm = "",
  typeFilter = "",
  recurringFilter = "",
}: TransactionFilters): Prisma.TransactionWhereInput {
  const where: Prisma.TransactionWhereInput = {
    accountId,
    account: { userId },
  };

  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    where.OR = [
      { description: { contains: searchLower, mode: "insensitive" } },
      { category: { contains: searchLower, mode: "insensitive" } },
    ];
    // Avoid searching `amount` and `date` unless exact match is needed
    const amountSearch = parseFloat(searchTerm);
    if (!isNaN(amountSearch)) {
      where.OR.push({ amount: amountSearch });
    }
  }

  if (typeFilter) where.type = typeFilter as TransactionType;
  if (recurringFilter) where.isRecurring = recurringFilter === "recurring";

  return where;
}
