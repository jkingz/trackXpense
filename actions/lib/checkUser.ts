import { auth } from '@clerk/nextjs/server';

import { db } from '@/lib/prisma';

/*
A utility function to check if the user is logged in and return the user object.
**/
export const checkUser = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!user) throw new Error('User not found');
  return user;
};
