import { auth } from '@clerk/nextjs/server';

import { db } from '@/lib/prisma';

export const userVerification = async () => {
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

    //return user
    return user;
  } catch (error) {
    throw error;
  }
};
