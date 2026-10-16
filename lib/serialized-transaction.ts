// Structural: Prisma's Decimal (and any compatible) exposes toNumber().
// Kept structural so this helper does not couple to a Prisma export path.
type DecimalLike = {
  toNumber: () => number;
};

// T is unconstrained (intersected) so rows carrying extra fields — Prisma
// models, test literals — pass through without excess-property complaints.
export const serializeTransaction = <T>(
  obj: T & { balance?: DecimalLike | null; amount?: DecimalLike | null },
): Omit<T, "balance" | "amount"> & { balance: number; amount: number } => {
  const { balance, amount, ...rest } = obj;
  return {
    ...rest,
    ...(balance != null ? { balance: balance.toNumber() } : {}),
    ...(amount != null ? { amount: amount.toNumber() } : {}),
  } as Omit<T, "balance" | "amount"> & { balance: number; amount: number };
};
