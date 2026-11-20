"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { checkUser } from "@/actions/lib/checkUser";
import { ledgerCurrencies } from "@/lib/money";
import { db } from "@/lib/prisma";

const ledgerCurrencySchema = z.enum(ledgerCurrencies);

export async function updateLedgerCurrency(input: unknown) {
  const user = await checkUser();
  const parsed = ledgerCurrencySchema.safeParse(input);
  if (!parsed.success) return { error: "Choose PHP or USD." };

  try {
    await db.user.update({ where: { id: user.id }, data: { currency: parsed.data } });
    revalidatePath("/(main)", "layout");
    return { currency: parsed.data };
  } catch {
    return { error: "Could not save your ledger currency." };
  }
}
