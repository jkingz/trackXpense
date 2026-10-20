# Server-side input validation

## Goal

Every server action that accepts client input parses and validates its arguments with Zod before use; invalid input throws a typed error instead of reaching the DB.

## UI: n/a

## Increments

1. Add `parseInput` helper in `actions/lib/` using the existing `lib/schema.ts` schemas; wire into `createTransaction` and `updateTransaction`. Touches: `actions/lib/parseInput.ts`, `actions/transaction.ts`.
2. Wire into `accounts.ts` and `budget.ts` actions. Touches: those files.
3. Add unit tests for `parseInput` + one action path. Touches: `tests/actions/`.

## Deferred / open questions

- Whether to return field-level errors to the client or throw. Throwing matches current behaviour.
- `dashboard.ts`/`seedTransactions` take no input.

## Security / permissions

Authority: `actions/lib/checkUser.ts` (`checkUser`) supplies `userId`; validation runs before any DB write. Single authority for parsing: `actions/lib/parseInput.ts`.

## Verification

- `pnpm typecheck`, `pnpm test`
- Manual: submit invalid payload → action throws, no DB write.
