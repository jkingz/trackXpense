import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockCheckUser, db } = vi.hoisted(() => ({
  mockCheckUser: vi.fn(),
  db: {
    $transaction: vi.fn(),
    account: { updateMany: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    transaction: { findMany: vi.fn(), count: vi.fn() },
  },
}));

vi.mock("@/actions/lib/checkUser", () => ({ checkUser: mockCheckUser }));
vi.mock("@/lib/prisma", () => ({ db }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  getAccountsWithTransactions,
  getPaginatedTransactions,
  updateDefaultAccount,
} from "@/actions/accounts";

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckUser.mockResolvedValue({ id: "me" });
  db.transaction.findMany.mockResolvedValue([]);
  db.transaction.count.mockResolvedValue(0);
});

describe("updateDefaultAccount", () => {
  it("unsets and sets the default in one transaction", async () => {
    db.$transaction.mockResolvedValue([{ count: 1 }, { id: "a", balance: { toNumber: () => 0 } }]);

    const res = await updateDefaultAccount("a");

    expect(res.success).toBe(true);
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.$transaction.mock.calls[0][0]).toHaveLength(2);
  });

  it("reports failure when the transaction rolls back", async () => {
    db.$transaction.mockRejectedValue(new Error("Record not found"));

    expect((await updateDefaultAccount("not-mine")).success).toBe(false);
  });
});

describe("getPaginatedTransactions", () => {
  it("falls back on bad page and sort params instead of crashing", async () => {
    await getPaginatedTransactions({
      accountId: "a",
      page: 0,
      sortField: "foo",
      sortDirection: "sideways",
    });

    expect(db.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, orderBy: { date: "desc" } }),
    );
  });

  it("keeps valid params", async () => {
    await getPaginatedTransactions({
      accountId: "a",
      page: 3,
      sortField: "amount",
      sortDirection: "asc",
    });

    expect(db.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, orderBy: { amount: "asc" } }),
    );
  });
});

describe("getAccountsWithTransactions", () => {
  it("surfaces DB errors instead of reporting the account missing", async () => {
    db.account.findFirst.mockRejectedValue(new Error("connection lost"));

    await expect(getAccountsWithTransactions("a")).rejects.toThrow("connection lost");
  });

  it("returns null only when the account is not the caller's", async () => {
    db.account.findFirst.mockResolvedValue(null);

    expect(await getAccountsWithTransactions("a")).toBeNull();
  });
});
