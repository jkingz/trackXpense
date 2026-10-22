import { neonAuth } from "./neon-auth";
import { db } from "./prisma";

/** Public demo account. The password is only used server-side (see /api/demo). */
export const DEMO_EMAIL = "demo@trackxpense.local";
// Better Auth requires at least 8 characters.
export const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || "demo-password";
export const DEMO_NAME = "Alex Mercer";

const BUDGET = 1500;

type Row = {
  account: "everyday" | "rainy";
  type: "INCOME" | "EXPENSE";
  amount: number;
  category: string;
  description: string;
  daysAgo: number;
};

const ACCOUNTS = [
  { key: "everyday", name: "Everyday", type: "CURRENT", isDefault: true, opening: 1200 },
  { key: "rainy", name: "Rainy day", type: "SAVINGS", isDefault: false, opening: 3000 },
] as const;

const ROWS: Row[] = [
  {
    account: "everyday",
    type: "INCOME",
    amount: 2400,
    category: "salary",
    description: "Monthly salary",
    daysAgo: 28,
  },
  {
    account: "everyday",
    type: "EXPENSE",
    amount: 950,
    category: "housing",
    description: "Rent",
    daysAgo: 26,
  },
  {
    account: "everyday",
    type: "EXPENSE",
    amount: 86.4,
    category: "groceries",
    description: "Weekly shop",
    daysAgo: 24,
  },
  {
    account: "everyday",
    type: "EXPENSE",
    amount: 42.1,
    category: "transportation",
    description: "Fuel",
    daysAgo: 22,
  },
  {
    account: "everyday",
    type: "EXPENSE",
    amount: 18.5,
    category: "food",
    description: "Lunch with Sam",
    daysAgo: 19,
  },
  {
    account: "everyday",
    type: "EXPENSE",
    amount: 120,
    category: "utilities",
    description: "Electricity",
    daysAgo: 17,
  },
  {
    account: "everyday",
    type: "EXPENSE",
    amount: 64.25,
    category: "groceries",
    description: "Weekly shop",
    daysAgo: 15,
  },
  {
    account: "everyday",
    type: "EXPENSE",
    amount: 39.99,
    category: "entertainment",
    description: "Streaming bundle",
    daysAgo: 12,
  },
  {
    account: "everyday",
    type: "INCOME",
    amount: 180,
    category: "freelance",
    description: "Logo design invoice",
    daysAgo: 10,
  },
  {
    account: "everyday",
    type: "EXPENSE",
    amount: 210,
    category: "shopping",
    description: "Running shoes",
    daysAgo: 9,
  },
  {
    account: "everyday",
    type: "EXPENSE",
    amount: 58.3,
    category: "groceries",
    description: "Weekly shop",
    daysAgo: 8,
  },
  {
    account: "everyday",
    type: "EXPENSE",
    amount: 14.75,
    category: "food",
    description: "Coffee and pastry",
    daysAgo: 5,
  },
  {
    account: "everyday",
    type: "EXPENSE",
    amount: 75,
    category: "healthcare",
    description: "Pharmacy",
    daysAgo: 3,
  },
  {
    account: "everyday",
    type: "EXPENSE",
    amount: 31.2,
    category: "transportation",
    description: "Train pass top-up",
    daysAgo: 2,
  },
  {
    account: "everyday",
    type: "INCOME",
    amount: 2400,
    category: "salary",
    description: "Monthly salary",
    daysAgo: 0,
  },
  {
    account: "rainy",
    type: "INCOME",
    amount: 4.8,
    category: "investments",
    description: "Savings interest",
    daysAgo: 20,
  },
  {
    account: "rainy",
    type: "INCOME",
    amount: 250,
    category: "other-income",
    description: "Emergency fund top-up",
    daysAgo: 9,
  },
];

const round = (n: number) => Math.round(n * 100) / 100;

const noonDaysAgo = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(12, 0, 0, 0);
  return d;
};

/** Replaces the user's accounts, transactions and budget with the demo ledger. */
export async function resetDemoLedger(userId: string) {
  await db.$transaction(async (tx) => {
    await tx.transaction.deleteMany({ where: { userId } });
    await tx.budget.deleteMany({ where: { userId } });
    await tx.account.deleteMany({ where: { userId } });

    const ids = new Map<string, string>();
    for (const account of ACCOUNTS) {
      const created = await tx.account.create({
        data: {
          name: account.name,
          type: account.type,
          isDefault: account.isDefault,
          balance: account.opening,
          userId,
        },
        select: { id: true },
      });
      ids.set(account.key, created.id);
    }

    await tx.transaction.createMany({
      data: ROWS.map((row) => ({
        type: row.type,
        amount: row.amount,
        description: row.description,
        date: noonDaysAgo(row.daysAgo),
        category: row.category,
        userId,
        accountId: ids.get(row.account)!,
      })),
    });

    // Balance = opening + ledger, so the first added entry does not make it drift.
    for (const account of ACCOUNTS) {
      const movement = ROWS.filter((r) => r.account === account.key).reduce(
        (total, r) => total + (r.type === "INCOME" ? r.amount : -r.amount),
        0,
      );
      await tx.account.update({
        where: { id: ids.get(account.key)! },
        data: { balance: round(account.opening + movement) },
      });
    }

    await tx.budget.create({ data: { userId, amount: BUDGET } });
  });
}

/**
 * Makes sure the demo account exists and has a ledger. Idempotent: an existing
 * demo ledger is left alone. Safe to call on a fresh database.
 */
export async function ensureDemoUser() {
  let user = await db.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (!user) {
    try {
      await neonAuth.api.signUpEmail({
        body: { email: DEMO_EMAIL, password: DEMO_PASSWORD, name: DEMO_NAME },
      });
    } catch (error) {
      // A concurrent first visit may have created the row; otherwise surface the cause.
      user = await db.user.findUnique({ where: { email: DEMO_EMAIL } });
      if (!user) throw error;
    }
    user ??= await db.user.findUniqueOrThrow({ where: { email: DEMO_EMAIL } });
  }

  const owned = await db.account.count({ where: { userId: user.id } });
  if (owned === 0) await resetDemoLedger(user.id);
  return user;
}
