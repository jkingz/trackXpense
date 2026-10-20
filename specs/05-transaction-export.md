# Transaction Export

UI: n/a

## Goal

A signed-in (or demo) visitor can download their transactions for a date range as JSON or CSV from `GET /api/transactions?from=&to=&format=`.

## Increments

1. JSON export endpoint: `app/api/transactions/route.ts` GET resolves owner via `actions/lib/checkUser.ts` `checkUser()`, validates `from`/`to` ISO dates with Zod (400 on invalid, default last 30 days), returns the user's transactions in range ordered by `date` desc. Touches: `app/api/transactions/route.ts`, `lib/schema.ts` (new export-range schema). Test: `tests/api/transactions-export.test.ts`.
2. CSV format: same route honors `format=csv`, serializes rows with `Content-Disposition: attachment; filename="transactions.csv"`. Touches: `app/api/transactions/route.ts`. Test: same file, CSV branch.
3. Enrich rows with account name + type. Touches: `app/api/transactions/route.ts` (include account). Test: same.
4. Pagination via `limit`/`cursor`. Touches: `app/api/transactions/route.ts`. Test: same.

### First increment scope

- **Files**: `app/api/transactions/route.ts`, `lib/schema.ts`
- **Test**: `tests/api/transactions-export.test.ts`
- **Done when**: `curl` with demo session returns JSON array scoped to owner; invalid `from` → 400; omitted params → last 30 days

## Deferred / open questions

- Whether export requires auth gate (`proxy.ts` `isProtected` still commented out) — today none; endpoint relies on `checkUser()` resolving demo owner for anonymous callers.
- CSV escaping rules for descriptions containing commas/quotes — decide during build.
- Max range / row cap — not specified; open.

## Security / permissions

Who may do it: any caller (gate off). Single authority: `actions/lib/checkUser.ts` `checkUser()` resolves the owner row; all rows filtered by `userId`. No privileged bypass. Anonymous callers get the demo ledger, matching existing pages.

## Verification

- `pnpm typecheck` → clean
- `pnpm lint` → 0 errors
- `pnpm build` → route listed as ƒ
- Manual: `curl` with demo session cookie returns JSON; `?format=csv` returns attachment; invalid dates → 400
- What remains unverified: no automated test (unit tier opens no DB); CSV correctness by manual inspection only
