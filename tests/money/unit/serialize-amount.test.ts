import { expect, it } from "vite-plus/test";

import { serializeAmount } from "@/actions/lib/serializedAmount";
import { serializeTransaction } from "@/lib/serialized-transaction";

// Prisma's Decimal exposes the one method these helpers call. Nothing else is depended on, so the stub
// cannot drift from the real object in a way these assertions would miss.
const decimal = (value: number) => ({ toNumber: () => value });

it("serializeAmount converts a top-level amount to a number", () => {
  const out = serializeAmount({ amount: decimal(12.34), description: "coffee" });
  expect(out.amount).toBe(12.34);
  expect(out.description).toBe("coffee");
});

it("serializeAmount leaves a missing amount absent", () => {
  const out = serializeAmount({ description: "no money here" });
  expect(out.amount).toBeUndefined();
});

it("serializeAmount does NOT recurse: a nested Decimal stays a Decimal", () => {
  const out = serializeAmount({
    account: { amount: decimal(5) },
    rows: [{ amount: decimal(7) }],
  });
  expect(out.account.amount.toNumber()).toBe(5);
  expect(out.rows[0].amount.toNumber()).toBe(7);
});

it("serializeTransaction converts both amount and balance", () => {
  const out = serializeTransaction({ amount: decimal(9.5), balance: decimal(100) });
  expect(out.amount).toBe(9.5);
  expect(out.balance).toBe(100);
});

it("serializeTransaction also stops at the top level", () => {
  const out = serializeTransaction({ account: { balance: decimal(3) } });
  expect(out.account.balance.toNumber()).toBe(3);
});

it("serializeTransaction converts a zero amount to the number 0", () => {
  const out = serializeTransaction({ amount: decimal(0) });
  expect(out.amount).toBe(0);
});
