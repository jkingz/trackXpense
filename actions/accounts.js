'use server';

import { revalidatePath } from 'next/cache';

import { serializeTransaction } from '@/app/lib/serialized-transaction';
import { userVerification } from '@/app/lib/user-verifications';
import { db } from '@/lib/prisma';

export async function updateDefaultAccount(accountId) {
  try {
    const user = userVerification();

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
    const user = userVerification();
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
