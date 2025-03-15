import { z } from 'zod';

export const accountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(['CURRENT', 'SAVING']),
  balance: z.number().min(1, "Balance is required"),
  isDefault: z.boolean().default(false),
});
