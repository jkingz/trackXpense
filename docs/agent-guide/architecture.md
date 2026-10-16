## Architecture Context

### Stack

| Layer           | Choice                                                                                                  | Verified against                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Runtime         | Node 26.8.2 here; **no `engines`**, `packageManager pnpm@12.11.2`, no `.node-version`/`.nvmrc`/`.npmrc` | `package.json`, `pnpm-lock.yaml`, `node -v` — measured 2026-10-16                                          |
| Framework       | Next.js 16.4.1 (Turbopack dev+build)                                                                    | `package.json`, `pnpm build`                                                                               |
| Database        | PostgreSQL via Prisma 7.10.0 + `@prisma/adapter-pg`                                                     | `prisma/schema.prisma`, `lib/prisma.ts`                                                                    |
| Auth            | Clerk                                                                                                   | `@clerk/nextjs`, `app/(auth)/`, `proxy.ts`                                                                 |
| Language        | TypeScript 5.9.3 (`^5`), `strict: true` + `noImplicitAny: false`, `useUnknownInCatchVariables: false`   | `tsconfig.json`                                                                                            |
| UI              | React 19.3.0 + Tailwind 4 + Base UI (`@base-ui/react`)                                                  | `package.json`, `components/ui/*.tsx` — no `@radix-ui` remains                                             |
| Forms           | React Hook Form 7.90.0 + Zod 4                                                                          | `package.json`                                                                                             |
| Tests           | Vitest 5.0.4 via Vite+ (`vp test`); unit tier only                                                      | `vite.config.ts`. Totals → `service-architecture.md` Verification                                          |
| Background jobs | Inngest                                                                                                 | `inngest@4.24.0`, `lib/inngest/`                                                                           |
| Email           | Resend                                                                                                  | `actions/send-email.ts`, called from `lib/inngest/functions.ts`                                            |
| Rate limiting   | Arcjet                                                                                                  | `lib/arcjet.ts`. `tokenBucket` in `actions/transaction.ts` only; `proxy.ts` shield/detectBot commented out |
| Lint            | ESLint via Vite+ (`vp lint` / `vp check`); types come from `tsc --noEmit` + `pnpm build`                | `vite.config.ts`                                                                                           |

### Boundaries

```
Browser → Clerk Auth (external)
       → Next.js App Router (Server Components, API routes, proxy)
           (main)/*  — no auth; proxy redirect off
           (auth)/*  — sign-in/up
           api/*     — seed (dev), inngest (signature)
       → Prisma → PostgreSQL
       → External: Clerk Admin (provisioning), Inngest (never fired), Resend (never sent)
```

### Storage model

- **Users** — one row per Clerk user, synced on first sign-in (`clerkUserId`, `email`, `name`, `imageUrl`). Plus one non-Clerk row: demo owner in `lib/demo-identity.ts`, read by `actions/lib/checkUser.ts`, created on first anonymous request. `scripts/seed-demo.ts` writes a ledger under every users row.
- **Accounts** — checking/savings, owned by a user. Balance mutated on every transaction insert/update. No append-only log; current balance is truth.
- **Transactions** — one row per income/expense. `type` decides add/subtract. `isRecurring` + `recurringInterval` supported; processor in `lib/inngest/functions.ts` exists but never runs → no occurrence applied automatically. `status` defaults `COMPLETED`, never transitions.
- **Budgets** — one per user. `lastAlertSent` gated to prevent spam.

### Persistence schema

- `users`: `id` uuid PK, `clerkUserId` text UK, `email` text UK, `name`/`imageUrl` nullable, timestamps.
- `accounts`: `id` uuid PK, `name`, `type` (CURRENT/SAVINGS), `balance` decimal, `isDefault`, `userId` FK→users CASCADE, timestamps.
- `transactions`: `id` uuid PK, `type` (INCOME/EXPENSE), `amount` decimal, `description` nullable, `date`, `category`, `receiptUrl` nullable, `isRecurring`, `recurringInterval` (DAILY/WEEKLY/MONTHLY/YEARLY) nullable, `nextRecurringDate` nullable, `lastProcessed` nullable, `status` (PENDING/COMPLETED/FAILED), `userId` FK→users CASCADE, `accountId` FK→accounts CASCADE, timestamps.
- `budgets`: `id` uuid PK, `amount` decimal, `lastAlertSent` nullable, `userId` UK FK→users CASCADE, timestamps.

### Auth & tenancy

- **Identity** — Clerk JWT in cookies, read by `proxy.ts` and the action seam. No session → local demo owner (`lib/demo-identity.ts`).
- **Authority** — route protection lives in `proxy.ts`, but its `isProtected` matcher + `redirectToSignIn()` are commented out for review (Arcjet client too; restore steps in-file). `lib/checkUser.ts` resolves-or-creates a `users` row, returns `null` on empty session or after a failed read/write (DB failure indistinguishable from signed-out), never redirects. `actions/lib/checkUser.ts` reads `auth()`, resolves that session's row, else demo row; throws `User not found` only when a session has no row. `auth()` read in that one file.
- **Ownership** — all reads scoped to the `userId` the seam resolves. No privileged bypass.
- **Gate** — none in the request path today. `lib/checkUser.ts` `checkUser()` is imported at `components/header.tsx:9`, awaited only inside `AuthSlot` (`:36`), whose Suspense call site (`:111-113`) is commented out — so it never runs, and it changed no access decision when it did. `actions/lib/checkUser.ts` decides whose ledger an action touches, not whether the caller may act.

### HTTP surface — implemented

| Route                 | Method       | Auth              | Notes                                                       |
| --------------------- | ------------ | ----------------- | ----------------------------------------------------------- |
| `/`                   | GET          | None              | Landing                                                     |
| `/(auth)/sign-in`     | GET          | None              | Clerk                                                       |
| `/(auth)/sign-up`     | GET          | None              | Clerk                                                       |
| `/(main)/dashboard`   | GET          | None (gate off)   | Accounts, transactions, budget; renders demo owner's ledger |
| `/(main)/account`     | GET          | None (gate off)   | Create/manage accounts                                      |
| `/(main)/transaction` | GET          | None (gate off)   | Create/view transactions                                    |
| `/api/seed`           | GET          | None (dev)        | Writes rows; unauthenticated — gate in prod                 |
| `/api/inngest`        | GET/POST/PUT | Inngest signature | `serve()` for 4 functions; never triggered                  |

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
