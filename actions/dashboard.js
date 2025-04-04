'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/prisma';
import { serializeTransaction } from '@/lib/serialized-transaction';

export async function createAccount(data) {
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

    //convert the balance into float
    const balanceFloat = parseFloat(data.balance);
    if (isNaN(balanceFloat)) {
      throw new Error('Invalid balance');
    }

    // check if this is the users first account
    const existingAccounts = await db.account.findMany({
      where: { userId: user.id },
    });

    const shouldBeDefault =
      existingAccounts.length === 0 ? true : data.isDefault;

    // check if this should be the default account, unset all other accounts
    if (shouldBeDefault) {
      // set all other accounts to false
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // create new user account
    const account = await db.account.create({
      data: {
        ...data,
        balance: balanceFloat,
        userId: user.id,
        isDefault: shouldBeDefault,
      },
    });
    // serilize the account balance
    const serializedAccount = serializeTransaction(account);

    // refetch the values of a page
    revalidatePath('/dashboard');
    return { success: true, data: serializedAccount };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getUserAccounts() {
  const { userId } = await auth();
  //check if user is logged in
  if (!userId) throw new Error('Unauthorized');

  //check if user exists
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  //if user doesn't exist,
  if (!user) throw new Error('User not found');

  //get all accounts for this user
  const accounts = await db.account.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
  });
  const serializedAccount = accounts.map(serializeTransaction);
  return serializedAccount;
}

export async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get all user transactions
  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
  });

  return transactions.map(serializeTransaction);
}
