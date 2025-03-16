'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

import { serilizeTransaction } from '@/app/lib/serialized-transaction';
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
    return { success: true, data: serilizeTransaction(account) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
