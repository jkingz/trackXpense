## Architecture Context

### Stack

| Layer           | Choice                                                                                                  | Verified against                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Runtime         | Node 26.8.2 here; **no `engines`**, `packageManager pnpm@12.11.2`, no `.node-version`/`.nvmrc`/`.npmrc` | `package.json`, `pnpm-lock.yaml`, `node -v` — measured 2026-10-16                                          |
| Framework       | Next.js 16.4.1 (Turbopack dev+build)                                                                    | `package.json`, `pnpm build`                                                                               |
| Database        | Neon PostgreSQL via Prisma 7.10.0 + `@prisma/adapter-pg`                                                | `prisma/schema.prisma`, `lib/prisma.ts`, `DATABASE_URL`                                                    |
| Auth            | Better Auth email/password                                                                              | `better-auth`, `lib/neon-auth.ts`, `app/api/auth/[...route]/route.ts`                                      |
| Language        | TypeScript 7.0.2, `strict: true` + `noImplicitAny: false`, `useUnknownInCatchVariables: false`          | `tsconfig.json`                                                                                            |
| UI              | React 19.3.0 + Tailwind 4 + Base UI (`@base-ui/react`)                                                  | `package.json`, `components/ui/*.tsx` — no `@radix-ui` remains                                             |
| Forms           | React Hook Form 7.90.0 + Zod 4                                                                          | `package.json`                                                                                             |
| Tests           | Vitest 5.0.4 via Vite+ (`vp test`); unit tier only                                                      | `vite.config.ts`. Totals → `service-architecture.md` Verification                                          |
| Background jobs | Inngest                                                                                                 | `inngest@4.24.0`, `lib/inngest/`                                                                           |
| Email           | Resend                                                                                                  | `actions/send-email.ts`, called from `lib/inngest/functions.ts`                                            |
| Rate limiting   | Arcjet                                                                                                  | `lib/arcjet.ts`. `tokenBucket` in `actions/transaction.ts` only; `proxy.ts` shield/detectBot commented out |
| Lint            | ESLint via Vite+ (`vp lint` / `vp check`); types come from `tsc --noEmit` (TS 7.0.2) + `pnpm build`     | `vite.config.ts`                                                                                           |

### Boundaries

```
Browser → Better Auth (email/password; API at /api/auth/*)
       → proxy.ts (valid-session route gate)
       → Next.js App Router (Server Components, API routes)
       → Prisma → Neon PostgreSQL
       → External: Inngest (never fired), Resend (never sent)
```

### Storage model

- **Users** — Better Auth `User` rows (`email`, `emailVerified`, `name`, `image`, `password`) with related `Session`, `AuthAccount`, and `Verification` rows. Demo account is provisioned by `lib/demo.ts` and signed in through `/api/demo`; `scripts/seed-demo.ts` resets only its ledger.
- **Accounts** — checking/savings, owned by a user. Balance mutated on every transaction insert/update. No append-only log; current balance is truth.
- **Transactions** — one row per income/expense. `type` decides add/subtract. `isRecurring` + `recurringInterval` supported; processor in `lib/inngest/functions.ts` exists but never runs → no occurrence applied automatically. `status` defaults `COMPLETED`, never transitions.
- **Budgets** — one per user. `lastAlertSent` gated to prevent spam.

### Persistence schema

- `users`: `id` uuid PK, unique `email`, `emailVerified`, nullable `name`/`image`/`password`, timestamps. Better Auth tables: `account`, `session`, `verification`.
- `accounts`: `id` uuid PK, `name`, `type` (CURRENT/SAVINGS), `balance` decimal, `isDefault`, `userId` FK→users CASCADE, timestamps.
- `transactions`: `id` uuid PK, `type` (INCOME/EXPENSE), `amount` decimal, `description` nullable, `date`, `category`, `receiptUrl` nullable, `isRecurring`, `recurringInterval` (DAILY/WEEKLY/MONTHLY/YEARLY) nullable, `nextRecurringDate` nullable, `lastProcessed` nullable, `status` (PENDING/COMPLETED/FAILED), `userId` FK→users CASCADE, `accountId` FK→accounts CASCADE, timestamps.
- `budgets`: `id` uuid PK, `amount` decimal, `lastAlertSent` nullable, `userId` UK FK→users CASCADE, timestamps.

### Auth & tenancy

- **Identity** — Better Auth session cookie validated by `neonAuth.api.getSession()` in `proxy.ts` and `actions/lib/checkUser.ts`.
- **Authority** — `proxy.ts` gates `/dashboard`, `/account`, and `/transaction` via `lib/route-guard.ts`; anonymous requests redirect to `/sign-in`. `requireUser()` guards ledger pages; `checkUser()` guards actions and API reads. `/api/demo` explicitly signs into the shared demo account.
- **Ownership** — all reads scoped to the `userId` the seam resolves. No privileged bypass.
- **Demo** — `/api/demo` provisions the shared demo account if needed, then creates a Better Auth session. Demo sign-in is explicit; there is no anonymous ledger fallback.

### HTTP surface — implemented

| Route                 | Method       | Auth              | Notes                                       |
| --------------------- | ------------ | ----------------- | ------------------------------------------- |
| `/`                   | GET          | None              | Landing                                     |
| `/(auth)/sign-in`     | GET          | None              | Better Auth email/password + demo sign-in   |
| `/(auth)/sign-up`     | GET          | None              | Better Auth email/password                  |
| `/(main)/dashboard`   | GET          | Session           | Accounts, transactions, budget              |
| `/(main)/account`     | GET          | Session           | Create/manage accounts                      |
| `/(main)/transaction` | GET          | Session           | Create/view transactions                    |
| `/api/seed`           | GET          | None (dev)        | Writes rows; unauthenticated — gate in prod |
| `/api/inngest`        | GET/POST/PUT | Inngest signature | `serve()` for 4 functions; never triggered  |

Caching: no `no-store`/`revalidate` export anywhere; Cache Components on (`next.config.ts`). Three ledger pages `export const instant = false`. `revalidatePath()` at 9 sites across 4 action files (`actions/accounts.ts`×3, `budget.ts`×1, `transaction.ts`×4, `dashboard.ts`×1). Build page classes → `service-architecture.md` Pages.

### HTTP surface — planned, not built

- `GET /api/transactions` — date-range JSON export
- `POST /api/budget/alert` — manual budget-alert email
- `PATCH /api/transactions/:id/recurring` — reschedule
- `DELETE /api/transactions/:id` — soft delete

### Background work

- `app/api/inngest/route.ts` serves 4 functions in `lib/inngest/functions.ts` (budget-alert cron, recurring-trigger cron, per-event recurring processor, monthly-report cron). None executed here.
- Consumer in prod: Inngest cloud (not enabled). Gaps: nothing enqueued/scheduled/fired.

### Invariants

1. **`balance = SUM(transactions WHERE accountId, type)`** — not enforced. No trigger/audit table. `createTransaction` reads `account.balance` outside `db.$transaction` then writes an absolute number inside (`actions/transaction.ts:119-143`) → concurrent inserts can lose an update. `updateTransaction` reads-modifies-writes inside one `$transaction` (`:211-236`) but debits only the destination, so moving a transaction between accounts leaves the source unchanged. Recorded, not fixed.
2. **One budget per user** — UNIQUE index on `budgets.userId`.
3. **User owns their data** — no row may reference another `userId`; no privileged bypass exists.
4. **Recurring never auto-applied** — `isRecurring`/`recurringInterval`/`nextRecurringDate` written, processor served (`lib/inngest/functions.ts`, `/api/inngest`), never run.
5. **`createTransaction` gets a string amount** — `add-transaction-form.tsx:99-101` builds `{amount: parseFloat(data.amount), ...data}`, so the spread re-overwrites the number with the raw string. `actions/transaction.ts:120-122` then concatenates into a Decimal (`100 + "250"` → `"100250"`) and `:143` writes it; fresh accounts hide it (`0 + "250"` → `250`), EXPENSE is accidentally right. `updateTransaction` parses (`:207-208`). No test pins `createTransaction`.

No test covers an invariant — the unit tier opens no database. Totals → `service-architecture.md` Verification.
