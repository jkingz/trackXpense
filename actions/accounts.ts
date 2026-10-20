"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/prisma";
import { serializeTransaction } from "@/lib/serialized-transaction";

import { buildTransactionWhere, checkUser, toErrorMessage } from "./lib";
import { parseInput } from "./lib/parseInput";
import { z } from "zod";

export async function updateDefaultAccount(accountId: string) {
  try {
    accountId = parseInput(z.string().min(1), accountId);
    //check if user is logged in
    const user = await checkUser();
    // set all other accounts to false
    await db.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
    // update the default account
    const account = await db.account.update({
      where: { id: accountId, userId: user.id },
      data: { isDefault: true },
    });

    // return the updated account
    revalidatePath("/dashboard");
    return { success: true, data: serializeTransaction(account) };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function getAccountsWithTransactions(accountId: string) {
  try {
    const user = await checkUser();

    // if (!account) return null;
    const account = await db.account.findFirst({
      where: { id: accountId, userId: user.id },
      include: {
        transactions: true,
        _count: { select: { transactions: true } },
      },
    });
    if (!account) return null;
    return {
      ...serializeTransaction(account),
      transactions: account.transactions.map(serializeTransaction),
    };
  } catch {}
}

export async function bulkDeleteTransactions(transactionsIds: string[]) {
  try {
    transactionsIds = parseInput(z.array(z.string().min(1)).min(1), transactionsIds);
    const user = await checkUser();

    //delete the transactions
    const transactions = await db.transaction.findMany({
      where: { id: { in: transactionsIds }, userId: user.id },
    });

    //recalculate the account balance
    const accountBalanceChanges = transactions.reduce<Record<string, number>>(
      (acc, transaction) => {
        const amount = transaction.amount.toNumber(); // Decimal to number

        // accumulate the changes by account
        const change = transaction.type === "EXPENSE" ? amount : -amount;
        acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;
        return acc;
      },
      {},
    );

    // Delete transactions and update account balances in a single transaction
    // Prisma transaction is used to ensure atomicity
    await db.$transaction(async (tx) => {
      // Delete transactions
      await tx.transaction.deleteMany({
        where: { id: { in: transactionsIds }, userId: user.id },
      });
      for (const [accountId, balanceChange] of Object.entries(accountBalanceChanges)) {
        // Update account balance
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: balanceChange } },
        });
      }
    });
    revalidatePath("/dashboard");
    const accountIds = [...new Set(transactions.map((t) => t.accountId))];
    accountIds.forEach((id) => revalidatePath(`/account/${id}`));
    return { success: true };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function getPaginatedTransactions({
  accountId,
  page = 1,
  itemsPerPage = 10,
  searchTerm = "",
  typeFilter = "",
  recurringFilter = "",
  sortField = "date",
  sortDirection = "desc",
}: {
  accountId: string;
  page?: number;
  itemsPerPage?: number;
  searchTerm?: string;
  typeFilter?: string;
  recurringFilter?: string;
  sortField?: string;
  sortDirection?: string;
}) {
  const user = await checkUser();

  const skip = (page - 1) * itemsPerPage;

  const where = buildTransactionWhere({
    userId: user.id,
    accountId,
    searchTerm,
    typeFilter,
    recurringFilter,
  });

  // Fetch transactions and total count in parallel
  const [transactions, total] = await Promise.all([
    db.transaction.findMany({
      where,
      skip,
      take: itemsPerPage,
      orderBy: { [sortField]: sortDirection },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        date: true,
        category: true,
        isRecurring: true,
        recurringInterval: true,
        nextRecurringDate: true,
      }, // Only fetch needed fields
    }),
    db.transaction.count({ where }),
  ]);

  const serializedTransactions = transactions.map((transaction) => ({
    ...transaction,
    amount: transaction.amount.toNumber(),
  }));

  const result = { transactions: serializedTransactions, total };
  return result;
}
