# TARGET STATE — Not Yet Built

Intent not implemented, or implemented and never run. Requirements for future work.

- **Recurring processing against a DB.** Built (`triggerRecurringTransactions` cron → `transaction.recurring.process` → `processRecurringTransaction`, `balance: { increment }` in `db.$transaction`, `lib/inngest/functions.ts`), served at `/api/inngest`. Never fired here → no occurrence applied. Missing: execution + verification.
- **Email delivery.** `actions/send-email.ts` calls `resend.emails.send`, invoked by the budget-alert + monthly-report functions, which write `budget.lastAlertSent` (`lib/inngest/functions.ts:86`). Never sent here. `RESEND_API_KEY` present in `.env.local` (measured 2026-10-16) → not the gap; callers are Inngest functions that never fire, and `pnpm email` is unrunnable.
- **Receipt storage.** Gemini OCR built, reachable (`scanReceipt` → `scan-receipt.tsx`, `add-transaction-form.tsx:160`), verified (browser upload 2026-10-16 → HTTP 200, fields filled). `receiptUrl` stays `null`; no upload endpoint or bucket.
- **Transaction export.** `GET /api/transactions?from=X&to=Y&format=csv` — not built.
- **Analytics dashboard.** Spend-by-category, trends. Only "recent transactions" today.
- **Tests beyond unit tier.** Only the unit tier (`tests/`, `vp test`). No integration/e2e; no page, action, route, `proxy.ts` or Inngest function covered — app coverage ~0%.
- **Server-side input validation.** Schemas run client-side only (`zodResolver`); every action trusts its arguments. Plan B's `parseInput`.
- **Multi-user sharing.** No shared budgets / collaboration.
- **Mobile app.** Web-only MVP.
- **Counts are hand-maintained.** `tests/platform/` is gone → nothing checks `AGENTS.md` vs these bodies, and the totals in `service-architecture.md` Verification have no automated failure behind them.
- **ESLint 10 + TypeScript 7 not installed** (on npm). ESLint 10 makes `eslint-plugin-import`'s `order` rule throw before printing a census (measured 2026-10-14, exit 2); `eslint-config-next` plugins cap ESLint at 9; `typescript-eslint` caps TS at `<6.1.0`. Prisma `latest` is `8.0.0-rc`, so 7.10.0 is newest stable. Blocks "on latest" claims.
- **Seed endpoint is an unauthenticated `GET` that writes.** Blocks any non-local deploy.
- **Two `checkUser` functions, no gate on either.** `lib/checkUser.ts` returns `null` (incl. on a failed read/write, so DB failure == signed-out) and its only caller is unrendered. `actions/lib/checkUser.ts` is the seam. `proxy.ts`'s `redirectToSignIn()` commented out → nothing fails closed. Blocks: any "page checks auth" claim; Plan B's `parseInput` (needs one place to read `userId`).
- **`@react-email/components` deprecated upstream, `@react-email/ui` absent** → `pnpm email` cannot run; proving `emails/template.tsx` renders needs a replacement.
- **Account chart drops the year** (`account-chart.tsx:63`, re-parsed `:79-80`) → a Dec 31 from two years merges into one bar; Dec→Jan window mis-orders. Fix changes chart output.
- **Page changes never suppress scrolling.** `components/pagination.tsx:32` `router.push` with new query inside `startTransition`, no options. Whether to pass `{ scroll: false }` is a behaviour decision.
- **Failed budget update toasts twice.** `hooks/use-fetch.ts:29` toasts `err.message`; `budget-progress.tsx:57-61` toasts the same from an effect. Drop the effect or keep it as the only toast — a behaviour decision.
- **`components/header.tsx` unowned.** Takes no props (`:82`); the unannotated component signature is Plan B Phase 3.
- **Env vars read via `as string`** (`lib/arcjet.ts:4`, `actions/transaction.ts:14`, `lib/inngest/functions.ts:214`, `actions/seed.ts:10-11`, `proxy.ts:32` in the commented Arcjet block) — a type-lie. `experimental.typedEnv` or a Zod env schema. Blocks trusting the config surface.
- **`transactions.status` has no transition logic.** Defaults `COMPLETED`, only read as a filter in `lib/inngest/functions.ts:174`. A state machine waits until a real transition exists.
- **Where the Inngest job should run is undecided** (local dev, external worker, serverless). Blocks giving `lib/inngest/functions.ts` a schedule that fires.
