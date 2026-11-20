import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockCheckUser, db, tx, generateContent } = vi.hoisted(() => {
  const tx = {
    transaction: { update: vi.fn(), create: vi.fn() },
    account: { update: vi.fn() },
  };
  return {
    mockCheckUser: vi.fn(),
    generateContent: vi.fn(),
    tx,
    db: {
      transaction: { findUnique: vi.fn(), aggregate: vi.fn() },
      budget: { findFirst: vi.fn() },
      account: { findUnique: vi.fn() },
      $transaction: vi.fn((fn: (t: typeof tx) => unknown) => fn(tx)),
    },
  };
});

vi.mock("@/actions/lib/checkUser", () => ({ checkUser: mockCheckUser }));
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("@/lib/arcjet", () => ({ default: {} }));
vi.mock("@/lib/env", () => ({ env: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@arcjet/next", () => ({ request: vi.fn() }));
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent };
    }
  },
}));

import { getCurrentBudget } from "@/actions/budget";
import { createTransaction, scanReceipt, updateTransaction } from "@/actions/transaction";

const decimal = (n: number) => ({ toNumber: () => n });
const input = (accountId: string) => ({
  type: "EXPENSE" as const,
  amount: 30,
  date: new Date("2026-11-01"),
  accountId,
  category: "food",
  isRecurring: false,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckUser.mockResolvedValue({ id: "me" });
  db.transaction.findUnique.mockResolvedValue({
    id: "t1",
    accountId: "a",
    type: "EXPENSE",
    amount: decimal(10),
  });
  tx.transaction.update.mockResolvedValue({ id: "t1", accountId: "b", amount: decimal(30) });
});

describe("updateTransaction", () => {
  it("refuses an account the caller does not own and writes nothing", async () => {
    db.account.findUnique.mockResolvedValue(null);

    await expect(updateTransaction(input("someone-else"), "t1")).rejects.toThrow(
      "Account not found",
    );
    expect(db.account.findUnique).toHaveBeenCalledWith({
      where: { id: "someone-else", userId: "me" },
    });
    expect(db.$transaction).not.toHaveBeenCalled();
  });

  it("refunds the old account and charges the new one when an entry moves", async () => {
    db.account.findUnique.mockResolvedValue({ id: "b" });

    await updateTransaction(input("b"), "t1");

    expect(tx.account.update).toHaveBeenCalledWith({
      where: { id: "a" },
      data: { balance: { increment: 10 } },
    });
    expect(tx.account.update).toHaveBeenCalledWith({
      where: { id: "b" },
      data: { balance: { increment: -30 } },
    });
  });
});

describe("scanReceipt", () => {
  const image = new File(["x"], "r.png", { type: "image/png" });

  it("never calls Gemini when signed out", async () => {
    mockCheckUser.mockRejectedValue(new Error("Sign in required"));

    await expect(scanReceipt(image)).rejects.toThrow("Sign in required");
    expect(generateContent).not.toHaveBeenCalled();
  });

  it("rejects non-images and oversized files before calling Gemini", async () => {
    await expect(scanReceipt(new File(["x"], "a.html", { type: "text/html" }))).rejects.toThrow(
      "unsupported file type",
    );
    const huge = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", { type: "image/png" });
    await expect(scanReceipt(huge)).rejects.toThrow("file too large");
    expect(generateContent).not.toHaveBeenCalled();
  });
});

describe("createTransaction", () => {
  it("moves the balance with an atomic increment, not a stale read", async () => {
    db.account.findUnique.mockResolvedValue({ id: "a", balance: decimal(999) });
    tx.transaction.create.mockResolvedValue({ id: "t2", accountId: "a", amount: decimal(30) });

    await createTransaction(input("a"));

    expect(tx.account.update).toHaveBeenCalledWith({
      where: { id: "a" },
      data: { balance: { increment: -30 } },
    });
  });
});

describe("getCurrentBudget", () => {
  it("counts the whole last day of the month", async () => {
    vi.useFakeTimers({ now: new Date(2026, 10, 30, 15) });
    db.budget.findFirst.mockResolvedValue(null);
    db.transaction.aggregate.mockResolvedValue({ _sum: { amount: null } });

    await getCurrentBudget("a");

    expect(db.transaction.aggregate.mock.calls[0][0].where.date).toEqual({
      gte: new Date(2026, 10, 1),
      lt: new Date(2026, 11, 1),
    });
    vi.useRealTimers();
  });
});
