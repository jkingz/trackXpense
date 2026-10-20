# Design — server-side input validation

## Seam

Single authority: `parseInput(schema, data)` in `actions/lib/parseInput.ts`. Each action calls it at entry, before `checkUser()`/DB. Throws `ZodError` on failure; caller sees existing error toast.

## Behaviour

- `parseInput` wraps `schema.parse(data)` and returns typed result; rethrows ZodError.
- Schemas reused from `lib/schema.ts` (`transactionSchema`, `accountSchema`); account/budget actions define local Zod schemas if missing.
- `createTransaction`/`updateTransaction`: parse `data` (amount already number) against a server variant of `transactionSchema` with `amount: z.number()`.

## Out of scope

- Client-side changes; field-level error plumbing.
