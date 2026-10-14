## Architecture Context

### Stack

| Layer | Choice | Verified against |
| --- | --- | --- |
| Runtime | Node.js 20+ (`>=20.9.0` for Next 16 and Clerk 7) | Inferred, not pinned in `.nvmrc` or `engines` |
| Framework | Next.js 16.4.0 (Turbopack default for dev + build) | `package.json`, `pnpm-lock.yaml` |
| Database | PostgreSQL via Prisma 7.10.0 + `@prisma/adapter-pg` driver adapter | `prisma/schema.prisma`, `prisma.config.ts`, `lib/prisma.ts` |
| Auth | Clerk | `@clerk/nextjs@7.9.14`, app/(auth)/ routes, `proxy.ts` |
| Language | TypeScript 5.9.3, `strict: true` with `noImplicitAny: false` + `useUnknownInCatchVariables: false` | `tsconfig.json`, `package.json` (no `.js`/`.jsx` source files remain) |
| UI | React 19.3.0 + Tailwind 4.3.3 + Radix UI | `package.json`, `app/globals.css` |
| Forms | React Hook Form 7.90.0 + Zod 4 | `@hookform/resolvers@5.9.1`, `zod@4.6.6` |
| Tests | Vitest 5 (unit tier only) | `vitest.config.ts`, `tests/`, `pnpm test` |
| Background jobs | Inngest | `inngest@4.23.0`, `lib/inngest/` |
| Email | Resend | `resend@6.32.1`, `actions/send-email.ts` (called from `lib/inngest/functions.ts`) |
| Rate limiting | Arcjet | `@arcjet/next@1.14.1` (was `1.0.0-beta.4`), `proxy.ts` |
| Lint | ESLint 9.39.5 flat config, `eslint-config-next@16.4.0` | `eslint.config.mjs` (TypeScript pinned to 5.9.3 for `typescript-eslint` peer range) |

### System boundaries

```
User (browser)
    ↓
Clerk Auth (external)
    ↓
Next.js App Router (Server Components, API routes, Middleware)
    ├─ Protected Layout (app/(main)/*) — reads Clerk session
    ├─ Auth Layout (app/(auth)/*) — sign-in/sign-up forms
    └─ API Routes (app/api/*)
        ├─ /seed — dev-only seeding
        └─ /inngest — background job webhook
    ↓
Prisma ORM
    ↓
PostgreSQL
    ↓
External APIs
    ├─ Clerk Admin API (user provisioning)
    ├─ Inngest (job scheduling; 4 functions served at /api/inngest, never triggered here)
    └─ Resend (email; called from Inngest functions, never sent here)
```

### Storage model

- **Users**: One row per Clerk user, synced on first sign-in. Fields: `clerkUserId` (Clerk's ID), `email`, `name`, `imageUrl`.
- **Accounts**: Checking or savings account owned by a user. Balance is mutated on every transaction insert/update. No append-only log; current balance is the source of truth.
- **Transactions**: One row per income/expense event. `type` (INCOME or EXPENSE) determines whether amount is added or subtracted from account balance. `isRecurring` flag and `recurringInterval` support recurring charges: `lib/inngest/functions.ts` has the processing job that increments the balance and rolls `nextRecurringDate` forward, but it has never run in this environment, so nothing creates or applies an occurrence automatically day to day.
- **Budgets**: One row per user, one budget for all expenses. `lastAlertSent` tracks when the alert was last emailed (prevents spam).

### Persistence schema

- `users`: `id` uuid PK, `clerkUserId` text UK (unique, from Clerk), `email` text UK, `name` text nullable, `imageUrl` text nullable, `createdAt` timestamp, `updatedAt` timestamp.
- `accounts`: `id` uuid PK, `name` text, `type` enum (CURRENT/SAVINGS), `balance` decimal, `isDefault` boolean, `userId` text FK → `users` ON DELETE CASCADE, `createdAt` timestamp, `updatedAt` timestamp.
- `transactions`: `id` uuid PK, `type` enum (INCOME/EXPENSE), `amount` decimal, `description` text nullable, `date` timestamp, `category` text, `receiptUrl` text nullable, `isRecurring` boolean, `recurringInterval` enum nullable (DAILY/WEEKLY/MONTHLY/YEARLY), `nextRecurringDate` timestamp nullable, `lastProcessed` timestamp nullable, `status` enum (PENDING/COMPLETED/FAILED), `userId` text FK → `users` ON DELETE CASCADE, `accountId` text FK → `accounts` ON DELETE CASCADE, `createdAt` timestamp, `updatedAt` timestamp.
- `budgets`: `id` uuid PK, `amount` decimal, `lastAlertSent` timestamp nullable, `userId` text UK FK → `users` ON DELETE CASCADE, `createdAt` timestamp, `updatedAt` timestamp.

### Auth & tenancy model

- **Identity:** Clerk session token (JWT) in cookies. `proxy.ts` — the Next 16 name for the root middleware — reads it.
- **Authority:** route protection lives in `proxy.ts` — `clerkMiddleware` calls `redirectToSignIn()` for a session-less request on the paths its `isProtected` matcher names, after Arcjet's `shield`/`detectBot`. The two functions that share the name `checkUser` decide no access at that layer. `lib/checkUser.ts` resolves `currentUser()` to a `users` row and creates it on first sight; it returns `null` for an empty session and returns `null` again after catching a failed read or write, so a database failure is indistinguishable from a signed-out visitor, and it never redirects. `actions/lib/checkUser.ts` reads `auth()` and throws `Unauthorized` with no session, `User not found` with no row. "Is this user logged in?" therefore has two implementations with different failure contracts until Plan B §2c consolidates them.
- **Ownership:** All data reads are scoped to `userId`. A transaction query always scopes to the session user's `userId`. No privileged read bypass.
- **Gate location:** `actions/lib/checkUser.ts:checkUser()` at the top of a server action is the only call here that fails closed. `lib/checkUser.ts:checkUser()` has two callers — `components/header.tsx:9` (the header is mounted by `app/layout.tsx`, so it runs on every page including the public landing) and `app/(main)/transaction/create/page.tsx:8` — and both `await` it and discard the value, so that call provisions the `users` row and changes no access decision. The comment on the second one, "Redirects if not authenticated", describes behavior the function does not have.

### HTTP surface — implemented

| Route | Method | Auth | Notes |
| --- | --- | --- | --- |
| `/` | GET | None | Landing page (public, no auth check) |
| `/(auth)/sign-in` | GET | None | Clerk sign-in page |
| `/(auth)/sign-up` | GET | None | Clerk sign-up page |
| `/(main)/dashboard` | GET | Clerk session | Protected layout; shows accounts, transactions, budget |
| `/(main)/account` | GET | Clerk session | Create/manage accounts |
| `/(main)/transaction` | GET | Clerk session | Create/view transactions |
| `/api/seed` | GET | None (dev only) | Populate test data; unauthenticated writes — gate in prod (open question) |
| `/api/inngest` | GET, POST, PUT | Inngest signature | `serve()` from `app/api/inngest/route.ts` — hosts the 4 functions in `lib/inngest/functions.ts`; no schedule has triggered them in this environment |

Cache headers: no `no-store` or `revalidate` export appears anywhere in the tree. Four action files call `revalidatePath()` at 9 sites (`actions/accounts.ts` ×3, `actions/budget.ts` ×1, `actions/transaction.ts` ×4, `actions/dashboard.ts` ×1), and `next build` reports all 9 routes as dynamic (`ƒ`), so nothing here is prerendered.

### HTTP surface — planned, not built

- `GET /api/transactions` — JSON export for a date range
- `POST /api/budget/alert` — Manual trigger for budget alert email (Resend integration)
- `PATCH /api/transactions/:id/recurring` — Reschedule a recurring transaction
- `DELETE /api/transactions/:id` — Soft delete (mark as cancelled)

### Background work

- **Inngest webhook:** `app/api/inngest/route.ts` receives job payloads. Four functions are written in `lib/inngest/functions.ts` (budget-alert cron, recurring-transaction trigger cron, per-event recurring processor, monthly-report cron) but none has run against a database or a mail provider in this environment.
- **Who consumes this in production:** Inngest (not yet enabled).
- **Gaps:** No job has been executed; enqueue/schedule is unverified.

### Invariants

1. **Account balance = SUM(transactions WHERE accountId AND type)** — Each transaction insert/update must atomically recalculate the account balance, or a stored trigger enforces it. Today neither holds: no trigger or audit table exists, and `createTransaction` reads `account.balance` *outside* the `db.$transaction` then writes an absolute number inside it (`actions/transaction.ts:119-143`), so a concurrent pair of inserts can lose an update. `updateTransaction` does read-modify-write inside one `$transaction` (`:211-236`) but debits only the destination account, so moving a transaction between accounts leaves the source unchanged. Recorded here, not fixed: fixing either is a behaviour change and belongs to Plan B.
2. **One budget per user** — Budget table has a UNIQUE index on `userId`.
3. **User owns all their data** — No transaction, account, or budget row may reference a `userId` different from the session user without explicit privilege (none exist).
4. **Recurring transactions are never auto-applied in practice** — `isRecurring=true`, `recurringInterval` and `nextRecurringDate` are written and the Inngest processor that would apply them exists and is served (`lib/inngest/functions.ts:150`, `app/api/inngest/route.ts`), but it has never run against a database, so no occurrence is created or applied automatically today.
5. **`createTransaction` is handed a string amount** —
   `app/(main)/transaction/_components/add-transaction-form.tsx:99-101` builds
   `{ amount: parseFloat(data.amount), ...data }`, so the spread re-overwrites the parsed number with the raw
   form string. `actions/transaction.ts:120-122` then adds it to a `Decimal`: the INCOME branch concatenates
   (`100 + "250"` → `"100250"`) and `:143` writes that as the balance. Fresh accounts hide it
   (`0 + "250"` → `"0250"` → 250); EXPENSE is accidentally correct via the unary minus. `updateTransaction`
   parses (`:207-208`, commit `80aec7a`). No test pins `createTransaction`. Plan B's `parseInput` owns it.

Tests for invariants: None. `pnpm test` collects the app tier under `tests/money` and `tests/validation` — the money serialisers, the recurrence arithmetic and the two Zod schemas — and nothing there opens a database, so these DB-level invariants have no coverage at all.

---

