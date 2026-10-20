"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/prisma";
import type { AccountInput } from "@/lib/schema";
import { serializeTransaction } from "@/lib/serialized-transaction";

import { checkUser, toErrorMessage } from "./lib";

export async function createAccount(data: AccountInput) {
  try {
    // The ledger owner: a Neon Auth session when there is one, the local identity
    // otherwise. Throws only if a session points at no row.
    const user = await checkUser();

    //convert the balance into float
    const balanceFloat = parseFloat(data.balance);
    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance");
    }

    // check if this is the users first account
    const existingAccounts = await db.account.findMany({
      where: { userId: user.id },
    });

    const shouldBeDefault = existingAccounts.length === 0 ? true : data.isDefault;

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
    revalidatePath("/dashboard");
    return { success: true, data: serializedAccount };
  } catch (error) {
    throw new Error(toErrorMessage(error));
  }
}

export async function getUserAccounts() {
  const user = await checkUser();

  //get all accounts for this user
  const accounts = await db.account.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
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
  const user = await checkUser();

  // Get all user transactions
  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  return transactions.map(serializeTransaction);
}
