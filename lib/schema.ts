import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(["CURRENT", "SAVINGS"]),
  balance: z.string().min(1, "Balance is required"),
  isDefault: z.boolean().default(false),
});

export const transactionSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: z.string().min(1, "Amount is required"),
    description: z.string().optional(),
    date: z.date({ error: "Date is required" }),
    accountId: z.string().min(1, "Account is required"),
    category: z.string().min(1, "Category is required"),
    receiptUrl: z.string().optional(),
    isRecurring: z.boolean().default(false),
    recurringInterval: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring && !data.recurringInterval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurring interval is required for recurring transactions",
        path: ["recurringInterval"],
      });
    }
  });

// Shared form value types so server actions and form components agree.
// Transaction forms parse amount to a number before submitting, so the
// submitted shape differs from the raw schema input.
export const transactionExportSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  format: z.enum(["json", "csv"]).default("json"),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  cursor: z.string().optional(),
});

export type AccountInput = z.input<typeof accountSchema>;
export type TransactionInput = Omit<z.input<typeof transactionSchema>, "amount"> & {
  amount: number;
};

// Server-side variant: amount arrives as a number (form parses before submit).
export const transactionServerSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: z.number().finite(),
    description: z.string().optional(),
    date: z.date({ error: "Date is required" }),
    accountId: z.string().min(1, "Account is required"),
    category: z.string().min(1, "Account is required"),
    isRecurring: z.boolean().default(false),
    recurringInterval: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
    receiptUrl: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring && !data.recurringInterval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurring interval is required for recurring transactions",
        path: ["recurringInterval"],
      });
    }
  });
