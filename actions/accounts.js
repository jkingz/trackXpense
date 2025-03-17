'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

import { serializeTransaction } from '@/app/lib/serialized-transaction';
import { db } from '@/lib/prisma';

export async function updateDefaultAccount(accountId) {
  try {
    const { userId } = await auth();
    //check if user is logged in
    if (!userId) throw new Error('Unauthorized');

    //check if user exists
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    //if user doesn't exist,
    if (!user) throw new Error('User not found');

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
    revalidatePath('/dashboard');
    return { success: true, data: serializeTransaction(account) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAccountsWithTransactions(accountId) {
  try {
    const { userId } = await auth();
    //check if user is logged in
    if (!userId) throw new Error('Unauthorized');

    //check if user exists
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    //if user doesn't exist,
    if (!user) throw new Error('User not found');

    const account = await db.account.findUnique({
      where: { id: accountId, userId: user.id },
      include: {
        transactions: { orderBy: { date: 'desc' } },
        _count: { select: { transactions: true } },
      },
    });
    if (!account) return null;
    return {
      ...serializeTransaction(account),
      transactions: account.transactions.map(serializeTransaction),
    };
  } catch (error) {}
}

export async function bulkDeleteTransactions(transactionsIds) {
  try {
    const { userId } = await auth();
    //check if user is logged in
    if (!userId) throw new Error('Unauthorized');

    //check if user exists
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    //if user doesn't exist,
    if (!user) throw new Error('User not found');

    //delete the transactions
    const transactions = await db.transaction.findMany({
      where: { id: { in: transactionsIds }, userId: user.id },
    });

    //recalculate the account balance
    const accountBalanceChanges = transactions.reduce((acc, transaction) => {
      const amount = parseFloat(transaction.amount); // Convert to number
      const change =
        transaction.type === 'EXPENSE'
          ? amount
          : -amount;

      // accumulate the changes by account
      acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;
      return acc;
    }, {});

    // Delete transactions and update account balances in a single transaction
    // Prisma transaction is used to ensure atomicity
    await db.$transaction(async (tx) => {
      // Delete transactions
      await tx.transaction.deleteMany({
        where: { id: { in: transactionsIds }, userId: user.id },
      });
      for (const [accountId, balanceChange] of Object.entries(
        accountBalanceChanges
      )) {
        // Update account balance
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: balanceChange } },
        });
      }
    });
    revalidatePath('/dashboard');
    const accountIds = [...new Set(transactions.map((t) => t.accountId))];
    accountIds.forEach((id) => revalidatePath(`/account/${id}`));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
