"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/prisma";

import { checkUser, toErrorMessage } from "./lib";
import { parseInput } from "./lib/parseInput";
import { z } from "zod";

export async function getCurrentBudget(accountId: string) {
  try {
    const user = await checkUser();

    //get the current budget
    const budget = await db.budget.findFirst({
      where: {
        userId: user.id,
      },
    });

    // current month expenses
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    // const currentMonthExpenses = await db.transaction.aggregate({
    //   _sum: {
    //     amount: true,
    //   },
    //   where: {
    //     userId: user.id,
    //   },
    // });

    const expenses = await db.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        userId: user.id,
        type: "EXPENSE",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        accountId,
      },
    });

    return {
      budget: budget ? { ...budget, amount: budget.amount.toNumber() } : null,
      currentExpenses: expenses._sum.amount ? expenses._sum.amount.toNumber() : 0,
    };
  } catch (error) {
    console.error("Error getting budget", error);
    throw error;
  }
}

// update budget
export async function updateBudget(amount: number | string) {
  try {
    amount = parseInput(z.union([z.number(), z.string().min(1)]), amount);
    const user = await checkUser();

    const budget = await db.budget.upsert({
      where: { userId: user.id },
      update: { amount },
      create: { amount, userId: user.id },
    });

    revalidatePath("/dashboard");
    return {
      success: true,
      data: { ...budget, amount: budget.amount.toNumber() },
    };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}
