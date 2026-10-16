import { expect, it } from "vite-plus/test";

import { accountSchema, transactionSchema } from "@/lib/schema";

const validTransaction = {
  type: "EXPENSE",
  amount: "42.50",
  date: new Date("2026-10-12T00:00:00.000Z"),
  accountId: "acct-1",
  category: "food",
};

it("accountSchema applies the isDefault default", () => {
  const out = accountSchema.parse({
    name: "Cheque",
    type: "CURRENT",
    balance: "100",
  });
  expect(out.isDefault).toBe(false);
});

// Defect recorded: `balance` is only checked for non-emptiness, so garbage reaches a Decimal column.
it("accountSchema accepts a non-numeric balance", () => {
  expect(
    accountSchema.safeParse({
      name: "Cheque",
      type: "CURRENT",
      balance: "not-a-number",
    }).success,
  ).toBe(true);
});

it("accountSchema reports the required name message", () => {
  const result = accountSchema.safeParse({
    name: "",
    type: "CURRENT",
    balance: "5",
  });
  expect(result.success).toBe(false);
  expect(result.error?.issues[0].message).toBe("Name is required");
});

it("accountSchema rejects an unknown account type", () => {
  const result = accountSchema.safeParse({
    name: "Cheque",
    type: "CREDIT",
    balance: "5",
  });
  expect(result.success).toBe(false);
  expect(result.error?.issues[0].code).toBe("invalid_value");
});

it("transactionSchema accepts a valid expense", () => {
  expect(transactionSchema.safeParse(validTransaction).success).toBe(true);
});

// Defect recorded: same gap as balance, on the field that drives every balance mutation.
it("transactionSchema accepts a non-numeric amount", () => {
  expect(transactionSchema.safeParse({ ...validTransaction, amount: "abc" }).success).toBe(true);
});

it("transactionSchema rejects a string date", () => {
  const result = transactionSchema.safeParse({
    ...validTransaction,
    date: "2026-10-12",
  });
  expect(result.success).toBe(false);
  expect(result.error?.issues[0].message).toBe("Date is required");
});

it("transactionSchema requires an interval when recurring", () => {
  const result = transactionSchema.safeParse({
    ...validTransaction,
    isRecurring: true,
  });
  expect(result.success).toBe(false);
  expect(result.error?.issues[0].message).toBe(
    "Recurring interval is required for recurring transactions",
  );
  expect(result.error?.issues[0].path).toEqual(["recurringInterval"]);
});

it("transactionSchema defaults isRecurring to false", () => {
  expect(transactionSchema.parse(validTransaction).isRecurring).toBe(false);
});
