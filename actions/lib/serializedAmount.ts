type DecimalLike = {
  toNumber: () => number;
};

export const serializeAmount = <T>(
  obj: T & { amount?: DecimalLike | null },
): Omit<T, "amount"> & { amount: number } => {
  const { amount, ...rest } = obj;
  return {
    ...rest,
    ...(amount != null ? { amount: amount.toNumber() } : {}),
  } as Omit<T, "amount"> & { amount: number };
};
