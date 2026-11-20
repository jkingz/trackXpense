import { afterEach, describe, expect, it, vi } from "vite-plus/test";

const { session } = vi.hoisted(() => ({ session: { user: null as { id: string } | null } }));

vi.mock("@/actions/lib/checkUser", () => ({ checkUser: async () => session.user }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { bulkDeleteTransactions } from "@/actions/accounts";
import { createTransaction, updateTransaction } from "@/actions/transaction";
import { db } from "@/lib/prisma";

const email = `it-${crypto.randomUUID()}@trackxpense.local`;

afterEach(async () => {
  await db.user.deleteMany({ where: { email } });
});

// Invariant: balance = opening + sum(INCOME) - sum(EXPENSE) for every account.
async function expectLedger(accountId: string, opening: number) {
  const [account, rows] = await Promise.all([
    db.account.findUniqueOrThrow({ where: { id: accountId } }),
    db.transaction.findMany({ where: { accountId } }),
  ]);
  const net = rows.reduce(
    (sum, t) => sum + (t.type === "EXPENSE" ? -1 : 1) * t.amount.toNumber(),
    0,
  );
  expect(account.balance.toNumber()).toBeCloseTo(opening + net, 2);
}

describe("integration: balance ledger", () => {
  it("keeps every balance equal to opening plus its entries through create, edit, move, delete", async () => {
    const user = await db.user.create({ data: { email, name: "Ledger User" } });
    session.user = user;
    const a = await db.account.create({
      data: { name: "A", type: "CURRENT", balance: 100, userId: user.id },
    });
    const b = await db.account.create({
      data: { name: "B", type: "SAVINGS", balance: 50, userId: user.id },
    });
    const base = { date: new Date("2026-11-15"), category: "food", isRecurring: false };

    const created = await createTransaction({
      ...base,
      type: "EXPENSE",
      amount: 30,
      accountId: a.id,
    });
    await createTransaction({ ...base, type: "INCOME", amount: 20, accountId: a.id });
    await expectLedger(a.id, 100);

    // edit amount in place
    await updateTransaction(
      { ...base, type: "EXPENSE", amount: 45, accountId: a.id },
      created.data.id,
    );
    await expectLedger(a.id, 100);

    // move to another account
    await updateTransaction(
      { ...base, type: "EXPENSE", amount: 45, accountId: b.id },
      created.data.id,
    );
    await expectLedger(a.id, 100);
    await expectLedger(b.id, 50);

    await bulkDeleteTransactions([created.data.id]);
    await expectLedger(b.id, 50);
    expect((await db.account.findUniqueOrThrow({ where: { id: b.id } })).balance.toNumber()).toBe(
      50,
    );
  });
});
