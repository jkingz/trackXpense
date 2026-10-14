# VERIFICATION STANDARDS — Quality guardrails

A sentence earns its place only if its author read the thing this session.

| Bad line | Why wrong | Good line |
| --- | --- | --- |
| "Transactions update the account balance." | The balance column is mutated on insert, but never verified as consistent. | "Account balance is mutated on transaction insert; no audit log or trigger enforces consistency. Invariant: `balance = SUM(transactions)` — not tested." |
| "Transactions update the account balance." | The balance column is rewritten on insert and update, but nothing verifies the result and the read-modify-write in `createTransaction` is not atomic. | "Account balance is rewritten by `createTransaction` (`actions/transaction.ts:119-143`, balance read outside the `$transaction`) and `updateTransaction` (`:211-236`); no audit log or trigger enforces consistency. Invariant: `balance = SUM(transactions)` — not tested." |
| "Recurring transactions are auto-processed." | The job is written and served, but it has never fired here, so nothing is applied automatically today. | "Recurring processing exists as code only: `triggerRecurringTransactions` cron → `transaction.recurring.process` → `processRecurringTransaction` (`lib/inngest/functions.ts`), served at `/api/inngest`. Never executed against a database in this environment, so no occurrence is applied in practice." |
| "Email alerts work." | The Resend call exists and the Inngest functions invoke it, but no send has ever succeeded here. | "`actions/send-email.ts` calls `resend.emails.send` and is invoked by the budget-alert and monthly-report functions, which also write `lastAlertSent` (`lib/inngest/functions.ts:86`). `RESEND_API_KEY` is absent and `pnpm email` is unrunnable, so no email has been sent or rendered locally." |
| "Users can filter transactions by category." | There is no category filter control; category is only reachable through free-text search and is sortable. | "Account page filters are server-side and cover search term (OR across `description`, `category` and a numeric `amount`, `actions/accounts.ts:150-156`), `type` and recurring, plus sort and page. No category dropdown; dashboard has no filtering UI." |
| "ESLint enforces all standards." | ESLint is not part of `pnpm build` at all on Next 16 (`next lint` is removed and the `eslint` key is gone from `next.config.mjs`), and `pnpm lint` currently fails. | "ESLint is a guide, not a gate: `pnpm build` never runs ESLint on Next 16, and `pnpm lint` exits 1 today with 87 errors (86 `import/order`, 1 `react-hooks/set-state-in-effect`) and 3 warnings. Type checking is now the gate (`pnpm build` type-checks since Plan A Task 12). |
| "All protected routes check auth." | Some routes call `checkUser()`, but not all, and there is no single authority. | "There are two `checkUser` implementations: `lib/checkUser.ts` (redirects — pages/layouts) and `actions/lib/checkUser.ts` (throws `Unauthorized` — server actions). `app/(main)/` layouts call the page-side one; `app/api/seed` calls neither; 9 actions still read `auth()` inline. Grep for `checkUser` and `auth()` to verify." |

---

