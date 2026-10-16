import { expect, it } from "vite-plus/test";

import { buildTransactionWhere } from "@/actions/lib/transactionWhere";

it("scopes rows to one account owned by the user", () => {
  expect(buildTransactionWhere({ userId: "u1", accountId: "a1" })).toEqual({
    accountId: "a1",
    account: { userId: "u1" },
  });
});

it("searches description and category case-insensitively", () => {
  expect(buildTransactionWhere({ userId: "u1", accountId: "a1", searchTerm: "Rent" })).toEqual({
    accountId: "a1",
    account: { userId: "u1" },
    OR: [
      { description: { contains: "rent", mode: "insensitive" } },
      { category: { contains: "rent", mode: "insensitive" } },
    ],
  });
});

it("adds an exact amount clause for numeric searches", () => {
  const where = buildTransactionWhere({ userId: "u1", accountId: "a1", searchTerm: "42" });
  expect(where.OR).toContainEqual({ amount: 42 });
});

it("filters by type and recurring state", () => {
  expect(
    buildTransactionWhere({
      userId: "u1",
      accountId: "a1",
      typeFilter: "INCOME",
      recurringFilter: "recurring",
    }),
  ).toMatchObject({ type: "INCOME", isRecurring: true });
  expect(
    buildTransactionWhere({ userId: "u1", accountId: "a1", recurringFilter: "non-recurring" }),
  ).toMatchObject({ isRecurring: false });
});
