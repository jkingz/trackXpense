import { afterEach, describe, expect, it } from "vite-plus/test";

import { db } from "@/lib/prisma";

const email = `it-${crypto.randomUUID()}@trackxpense.local`;

afterEach(async () => {
  await db.user.deleteMany({ where: { email } });
});

describe("integration: transaction CRUD", () => {
  it("creates a transaction tied to an account and reads it back", async () => {
    const user = await db.user.create({ data: { email, name: "Integration User" } });
    const account = await db.account.create({
      data: { name: "Checking", type: "CURRENT", balance: 100, userId: user.id },
    });

    const tx = await db.transaction.create({
      data: {
        type: "EXPENSE",
        amount: 42.5,
        description: "Coffee",
        date: new Date("2026-01-01"),
        category: "food",
        userId: user.id,
        accountId: account.id,
      },
    });

    const found = await db.transaction.findUnique({ where: { id: tx.id } });
    expect(found?.amount.toString()).toBe("42.5");
    expect(found?.accountId).toBe(account.id);
  });

  it("cascades transactions when the account is deleted", async () => {
    const user = await db.user.create({ data: { email, name: "Integration User" } });
    const account = await db.account.create({
      data: { name: "Checking", type: "CURRENT", balance: 0, userId: user.id },
    });
    await db.transaction.create({
      data: {
        type: "INCOME",
        amount: 10,
        date: new Date(),
        category: "salary",
        userId: user.id,
        accountId: account.id,
      },
    });

    await db.account.delete({ where: { id: account.id } });
    expect(await db.transaction.count({ where: { accountId: account.id } })).toBe(0);
  });
});
