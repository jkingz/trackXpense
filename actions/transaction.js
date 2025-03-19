'use server';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/prisma';

import aj from '@/lib/arcjet';
import { request } from '@arcjet/next';
import { calculateNextRecurringDate, checkUser, serializeAmount } from './lib';

export async function createTransaction(data) {
  try {
    // check if use if logged in
    const user = await checkUser();

    // Get request data for ArcJet
    const req = await request();

    // Check rate limit
    const decision = await aj.protect(req, {
      userId: user.id, // Specify the user ID
      requested: 1, // Specify how many tokens to consume
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error('Too many requests. Please try again later.');
      }

      throw new Error('Request blocked');
    }
    // check account if exists
    const account = await db.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });
    if (!account) {
      throw new Error('Account not found');
    }

    // calculate balance
    const balanceChange = data.type === 'EXPENSE' ? -data.amount : data.amount;
    // new balance
    const newBalance = account.balance.toNumber() + balanceChange;

    // create transaction
    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.recurringInterval, data.date)
              : null,
        },
      });

      // update account balance
      await tx.account.update({
        where: {
          id: data.accountId,
        },
        data: {
          balance: newBalance,
        },
      });
      return newTransaction;
    });
    revalidatePath('/dashboard');
    revalidatePath('/account/${transaction.accountId}');
    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error);
  }
}
