<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# AGENT-READY PROJECT INSTRUCTION LAYER

This file is the complete guidance system for trackXpense. **Read STANDING RULES before every task.** Then read APPLICATION BUILDING CONTEXT in order when making architectural decisions. SERVICE ARCHITECTURE describes what is built; TARGET STATE describes what is not.

**Health check (fills slots, zero hits means done):**
```bash
grep -n '<[a-zA-Z_/]' AGENTS.md | grep -v 'VERIFICATION STANDARDS\|FEATURE SPECS/00-template' | grep -v 'migrate dev --name\|WHERE userId\|<Image>\|SignedIn\|<type>(<scope>)'
```

---

# STANDING RULES — Read first, before any task

Constraints that apply to every change. Read these **in full** before every taskable request. Skip nothing.

## Portable core — Rules 1–10

These rules hold in every repo.

### 1. Be very concise
- Keep responses short. Sacrifice grammar for concision.
- No preamble, no "here is what I did" essays. State the change + the result + the one thing you need from me.

### 2. No "done" without a command behind it
- Every claim of completion names the command run and what it printed.
- Untested by you = unverified. Say "not verified" instead of "should work".
- Type-checking proves types, not behavior. CI passing proves the push, not the feature.

### 3. Scope is the request, not the opportunity
- The blast radius of a change equals the radius of what was asked. Fix the reported defect only.
- No drive-by cleanup, renames, formatting, "while I'm here" extractions, or predicted abstractions.
- Nearby problems you spotted: one line in the reply only. Not in the diff.

### 4. Delete unused, but prove it was unused
- Remove dead files, exports, imports, env vars, CSS, tokens and orphaned components.
- Grep for callers before deleting; state what you removed and how you checked.

### 5. Servers, ports, processes
- Restart or kill running servers only during the current task.
- Clear stale processes on ports the app uses before starting your own.
- End a session with no orphaned dev server, queue worker, or background job.

### 6. Secrets
- Never print a secret value — reference it by name. Redact anything in output.
- `.env*` stays out of git. Only names and empty placeholders go into committed files.
- Privileged keys stay server-side: if a value is visible in a client bundle or public response, it is not a secret.

### 7. Git discipline
- Commit, push, open or merge a PR **only when asked**.
- Before pushing to a working branch: pull from main, merge, resolve conflicts, then commit/push.
- No `--no-verify`, no skipped hooks, no bypassed signing.
- Never force-push a shared branch, and never `git reset --hard` / `clean -f` / `checkout --` over work you did not write.
- Destructive or externally visible actions need explicit authorization every time.

### 8. Pull-request babysitting
- Follow the `babysitting-a-pr` skill when watching a PR.
- Every comment posted follows `leaving-pr-comment`: triggers, body contract, mandatory first-line AI-authorship disclaimer.
- No filler comments. A finding you decline gets a written decline; then resolve the thread.

### 9. Skills and instructions come before improvising
- Check available skills before starting a task; if one applies, use it rather than re-deriving the workflow.
- A harness capability that exists is used — do not hand-write a loop the platform already provides.

### 10. Unknowns are labelled, not invented
- No fabricated thresholds, policies, precedents, APIs or file paths.
- State assumptions plus the step that would verify them.
- When implementation and docs disagree, code is truth and the doc is a defect.

## Project-specific rules — Rules 11–17

### 11. Package manager and runtime
`pnpm 10.6.5` (locked in `package.json` `packageManager` field); `Node.js 20+` (inferred, not explicitly declared). Next 16 and Clerk 7 both require Node `>=20.9.0`; `engines` is still not declared in `package.json`.

### 12. Framework version drift
`Next.js 16.4.0` pinned exactly in `package.json`; `TypeScript 5.9.3` is the source language (`tsconfig.json`, `strict: true`, whole-tree `include`, 0 errors). Breaking changes from Next.js App Router documented at `node_modules/next/dist/docs/` (version-16 guide: `01-app/02-guides/upgrading/version-16.md`). Check that path before touching server components, layouts, API routes, or metadata. Next 16 defaults: Turbopack for `dev` and `build`, request-time APIs (`params`, `searchParams`, `cookies`, `headers`) are async-only, the root middleware file is `proxy.ts` (not `middleware.js`), `next lint` no longer exists, and `next build` type-checks unless `typescript.ignoreBuildErrors` is set — which it is **not**, as of Plan A Task 12.

### 13. Verification gates
The exact chain that must be green before work is reported complete:
1. `pnpm typecheck` — `next typegen && tsc --noEmit` over the whole tree. Baseline: **0 errors**. Do not let it regress; `npx tsc --noEmit --incremental false` is the non-stale re-check.
2. `pnpm test` — `TZ=UTC vitest run`. Baseline: 19 passed in 3 files (all characterisation).
3. `pnpm build` — Next.js production build (Turbopack). It now **is** a type gate (no `typescript.ignoreBuildErrors` in `next.config.mjs`) and still never lints.
4. `pnpm lint` — `eslint .` on the flat config in `eslint.config.mjs`. It is a **real gate** in the sense that it exits 1 on errors, but the tree is red on pre-existing debt: **87 errors (86 `import/order` + 1 `react-hooks/set-state-in-effect`) and 3 warnings**. The gate is "the census does not grow", not "green" — see Progress Tracker.
5. Manual verification when touching auth, database, or email flows — currently impossible here (no `DATABASE_URL`, no `ARCJET_KEY`, `@react-email/ui` missing).

See `/verification-gates` skill for the full chain and how to report each gate.

### 14. Application building order
Read these sections in order: `STANDING RULES` → `PROJECT OVERVIEW` → `ARCHITECTURE CONTEXT` → `UI CONTEXT` → `CODE STANDARDS` → `DEVELOPMENT WORKFLOW` → `PM CONVENTIONS` → `PROGRESS TRACKER`. Then `AGENTS.md` → SERVICE ARCHITECTURE section.

### 15. Cross-cutting authority — one authority per rule
- **Auth gate:** two functions, not one: `lib/checkUser.ts` (reads the Clerk session, **redirects** — pages and layouts) and `actions/lib/checkUser.ts` (reads the Clerk session, **throws** `Unauthorized` — server actions). Both are used; neither is the other's wrapper. Plan B §2c consolidates them.
- **Database access:** `lib/prisma.ts` — singleton client (pg driver adapter). All data reads/writes go through Prisma.
- **Errors:** Thrown errors in Server Components/Actions surface as generic toast via Sonner. No internal messages to client.
- **Validation:** `lib/schema.ts` — Zod schemas for form input. They run **client-side only**, through `zodResolver` in the two forms; no server action parses its input (`parseInput` is Plan B).

### 16. Datastore / external service
PostgreSQL via Prisma 7. `postinstall` runs `prisma generate` only — it does **not** apply migrations. Migrations live in `prisma/migrations/`; never edit applied migrations. New migrations: `npx prisma migrate dev --name <description>`, commit the generated file.

Prisma 7 moved the connection out of `prisma/schema.prisma` (the datasource block declares only `provider`): the CLI reads `url` from `prisma.config.ts`, which resolves `DIRECT_URL || DATABASE_URL` through `dotenv` and falls back to `''` so `prisma generate` still works without a database. `lib/prisma.ts` must pass a driver adapter (`@prisma/adapter-pg`) — Prisma 7 no longer opens its own connection.

Environment variables: `DATABASE_URL` (client connection, used by the pg adapter), `DIRECT_URL` (Prisma CLI/migrations), `CLERK_SECRET_KEY` (auth), `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (client auth key). Prisma 7 does not auto-load `.env*`; Next.js still does for the app itself.

### 17. Protected foundations
- `lib/checkUser.ts` (pages) and `actions/lib/checkUser.ts` (actions) — auth gates, do not bypass.
- `lib/prisma.ts` — singleton, do not instantiate Prisma elsewhere.
- `prisma/schema.prisma` — schema is single source of truth for data shape.
- `tsconfig.json` — the compiler settings and `include` are the type gate; do not narrow `include`, re-add `typescript.ignoreBuildErrors`, or flip `noImplicitAny` / `useUnknownInCatchVariables` without Plan B's budget.
- Clerk integration in `app/(auth)/` — do not move or modify without understanding auth flow end-to-end.

---

# APPLICATION BUILDING CONTEXT

Read these sections in the order listed above (rule 14). Update the section your change invalidates, plus PROGRESS TRACKER, before continuing.

## Project Overview

### Status

**Built** — User sign-up/sign-in (Clerk), dashboard page, account creation, transaction logging, budget tracking UI.

**Not built** — Recurring transaction processing, email alerts, analytics, receipt OCR, multi-user sharing, mobile app.

Verified: 2026-10-13, against `a22c0ff` on `feat/ts-zod-plan-a-bridge` (committed and pushed), which carries the TypeScript migration (Plan A) and the dependency upgrade.

### Overview

TrackXpense is a personal finance dashboard. Users sign up with Clerk, create accounts (checking/savings), log transactions (income/expense), and track spending against a budget. The app calculates account balances and surfaces key metrics on the dashboard.

### Goals
- Users can track spending in real time across multiple accounts
- Budgets surface warnings when approaching limits
- Transaction history is searchable and categorized

### Core user flow
1. Sign up with Clerk → Dashboard
2. Create account (CURRENT or SAVINGS) → Lands in dashboard
3. Log transaction (type, amount, category, date) → Account balance updates
4. View dashboard → See total balance, recent transactions, budget status

### Scope

**In scope:**
- User authentication (Clerk)
- Multiple accounts per user
- Transaction logging (income, expense, one-time and recurring)
- Budget alerts
- Dashboard metrics

**Out of scope:**
- Webhook processing for recurring transactions: the Inngest functions are written and served, but no schedule has ever fired in this environment (see SERVICE ARCHITECTURE, Background work)
- Email alerts delivered to a user: `actions/send-email.ts` exists and is called by `lib/inngest/functions.ts`; `RESEND_API_KEY` is absent, so nothing has been sent
- Receipt upload and OCR (UI placeholder, no backend)
- Social features / multi-user sharing
- Mobile app

### Success criteria
- Dashboard loads in < 1s after auth
- Transactions persist and reflect on balance within the same session
- New user can sign up, create an account, and log a transaction in < 2 minutes

### Open product questions
- Recurring transaction cadence: should the next occurrence be auto-created, or only on manual trigger?
- Should budget alerts be email-only, in-app toast-only, or both?
- Currency support: USD only for MVP, or multi-currency from day one?

---

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

- **Identity:** Clerk session token (JWT) in cookies. `@clerk/nextjs` middleware reads it.
- **Authority:** two functions share the name `checkUser` — `lib/checkUser.ts` (redirects to `/sign-in`, used by pages and layouts) and `actions/lib/checkUser.ts` (throws `Unauthorized`, used by server actions). "Is this user logged in?" therefore has two implementations with different failure contracts until Plan B §2c consolidates them.
- **Ownership:** All data reads are scoped to `userId`. A transaction query always filters `WHERE userId = <from session>`. No privileged read bypass.
- **Gate location:** `lib/checkUser.ts:checkUser()` in pages/layouts, `actions/lib/checkUser.ts:checkUser()` in actions. Example: `const userId = await checkUser();` in a Server Component.

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

Tests for invariants: None. `pnpm test` covers the money *serialisers* and *arithmetic* (19 unit tests), not these DB-level invariants. See PROGRESS TRACKER.

---

## UI Context

### Design tokens

Tailwind 4.3.3 (`package.json:73`; the `4.0.14` previously quoted here was the pre-upgrade pin). Colors, spacing, and type scale are in `app/globals.css` (default Tailwind tokens, no custom overrides yet).

Common utilities:
- `bg-surface`, `bg-surface-secondary` — background layers
- `text-text-primary`, `text-text-secondary` — text hierarchy
- `border-border-base` — default border color
- `rounded-md`, `rounded-lg` — border radius
- `shadow-sm`, `shadow-md` — elevation

### Per-component conventions

- Server Components as default; Client Components only for form interactivity, state, and real-time updates.
- Every source file is `.ts`/`.tsx` now, but props are annotated only where a `tsc` diagnostic demanded it (Plan A's rule). Component props in the files Tasks 9–10 left alone (`transaction-overview.tsx`, `budget-progress.tsx`, `transaction-table.tsx`, `header.tsx`, the `app/(main)/transaction/_components/*` forms) are still inferred, and rows that pass through `serializeTransaction` are `any` — so a shape mismatch at those boundaries is still not caught by the compiler.
- Event handlers: `onChange`, `onSubmit`, `onDelete` — standard React names.
- Form state: Managed with React Hook Form + Zod. Submit handlers are Server Actions.

### Styling rules

- Token rule: Use Tailwind utilities, not raw `style={}` or hardcoded colors.
- Forbidden: Raw pixel values (`px-[123px]`), `#hex` colors inline, magic numbers.
- Use components from Radix UI where UI state (dialog, dropdown, tooltip) is needed.

### Images / assets

- Images: Next.js `<Image>` component required. Remote patterns allowed: `randomuser.me` (avatars).
- Formats: AVIF and WebP preferred (configured in `next.config.mjs`).
- Icons: Lucide React (`lucide-react@0.482.0`). No SVG files committed; generate from the library.

---

## Code Standards

### General

- Naming: camelCase for variables/functions, PascalCase for components/types.
- Modules: One export per file (default) unless it is a utility barrel. No star exports.
- Imports: Absolute paths via the `@/*` alias — declared in `tsconfig.json` (`paths`, `baseUrl: "."`) and used repo-wide; relative imports remain only for same-directory siblings.
- Server vs Client: Explicit `'use client'` at the top of Client Components. Server Components have no directive.

### Language strictness

TypeScript 5.9.3 (pinned below 6.x because `typescript-eslint` requires `>=4.8.4 <6.1.0`). `tsconfig.json` controls the project; `jsconfig.json` is gone. All 81 source files are `.ts`/`.tsx` — no `.js`/`.jsx` source remains, and `allowJs: false` guarantees a missed file fails the build instead of going unchecked.

- Settings: `strict: true` (so `strictNullChecks`, `strictFunctionTypes`, `strictPropertyInitialization`), `noEmit`, `incremental`, `skipLibCheck`, `isolatedModules`, `esModuleInterop`, `resolveJsonModule`, `moduleResolution: bundler`, `jsx: react-jsx`, `baseUrl: "."` with the `@/*` path alias.
- `include` is the whole tree: `next-env.d.ts`, Next 16's generated route types (`.next/types/**/*.ts` **and** `.next/dev/types/**/*.ts`), then `**/*.ts` and `**/*.tsx`. `exclude` is `node_modules` and `.delta` (the git-excluded worktree/clone copies of this repo). Verified program: 81 source files + 8 generated files, via `npx tsc --noEmit --incremental false --listFilesOnly`.
- **Two flags stay off on purpose; Plan B flips them:** `noImplicitAny: false` and `useUnknownInCatchVariables: false`. With `noImplicitAny` off, an unannotated parameter or destructured prop is silently `any`, so untyped boundaries hide errors instead of reporting them; the 16 `catch (error)` sites keep `error` as `any`.
- Gates: `pnpm typecheck` (`next typegen && tsc --noEmit`) reports **0 errors**, and because `next.config.mjs` no longer carries the `typescript.ignoreBuildErrors` key, `pnpm build` runs the same check — it prints `Running TypeScript ...` / `Finished TypeScript in ~1.9s` instead of `Skipping validation of types`. The build is a real type gate as of Plan A Task 12.
- Known structural gap the flags leave open: `lib/serialized-transaction.ts` takes an unannotated parameter, so its return is `any`, so every serialized account/transaction row in `actions/**` and `app/(main)/**` is `any` and the `Decimal`→number seam is unchecked by the compiler. Typing it can only add errors or be neutral, so it is deferred to Plan B alongside the `parseInput` boundary decision (see Progress Tracker).
- Type-checking still proves nothing about runtime: the money path has never executed here (no `DATABASE_URL`).

### Framework rules

**Next.js 16.4.0 breaking changes from training data:**
- App Router is the standard (not Pages Router). All routes are in `app/`.
- Server Components are default; add `'use client'` to use browser APIs, hooks, or interactivity.
- API routes: `app/api/[...]/route.ts` exports `GET`, `POST`, etc. as named exports (not default export).
- Root middleware file is **`proxy.ts`**, not `middleware.js` (Next 16 renamed the convention; Plan A Task 4 also converted it to TypeScript). Auth is layered: ArcJet first, then Clerk, via `createMiddleware(aj, clerk)`. Page-level auth still goes through `checkUser()`.
- Turbopack is the default bundler for both `next dev` and `next build`; `next lint` is removed — linting is `eslint .` against the flat config, and `next build` no longer runs it.
- `params`/`searchParams`/`cookies()`/`headers()` are async-only; `revalidateTag()` needs a second `cacheLife` argument (repo uses `revalidatePath`, not `revalidateTag`).
- `next.config.mjs` no longer accepts the `eslint` key (`ignoreDuringBuilds` is gone), and as of Plan A Task 12 it carries no `typescript` key either: `ignoreBuildErrors` was removed, so `next build` type-checks the whole tree.

Read `node_modules/next/dist/docs/` before touching server component boundaries.

### Error handling

- Thrown errors in Server Components surface as a generic error boundary. User sees "Something went wrong."
- Thrown errors in API routes should return `{ status: 5xx, body: {} }` — never leak `error.message` to the client.
- Server Actions catch errors and return `{ error: "Generic message" }` to the form.
- No try-catch in business logic; let errors bubble to the middleware/boundary.

### HTTP handlers

`app/api/seed/route.ts:GET` is the only hand-written API handler and is the canonical shape:

```typescript
import { seedTransactions } from '@/actions/seed';

export async function GET() {
  try {
    const result = await seedTransactions();
    return Response.json(result);
  } catch (error) {
    return Response.json({ success: false, error: error.message });
  }
}
```

Two deviations from the rules below, both real and unfixed: it is an unauthenticated `GET` that writes rows, and its failure path returns status 200 with `error.message` in the body. Gating it is a deferred security item.

- **Status precedence:** 400 (bad input) → 401 (no auth) → 403 (forbidden) → 500 (server error).
- **Failure responses:** JSON body with `{ error: "message" }`, status is HTTP status (not 200 wrapping `{ status: 401 }`).
- **Cache headers:** No explicit headers set yet; use Next.js defaults (ISR).
- **Success shapes:** Varies by route; no standard response envelope yet.

### Data access

- **Reads:** All through Prisma client (`lib/prisma.ts`). Scope queries to the session user.
- **Privileged access:** None — no admin bypass. All reads are user-scoped.
- **Gate:** `checkUser()` — `lib/checkUser.ts` for pages (redirects), `actions/lib/checkUser.ts` for actions (throws). Called once per request in protected routes.

### File organization

```
app/                    — Next.js App Router pages, layouts, API routes (all .tsx / route.ts)
  (auth)/               — Sign-in/sign-up (unprotected layout)
  (main)/               — Dashboard, accounts, transactions (protected layout)
  api/                  — API routes
    seed/               — Test data endpoint (GET, dev only, unauthenticated)
    inngest/            — Background job receiver (serves the 4 functions below)
  layout.tsx            — Root layout (Clerk provider, theme)
  globals.css           — Tailwind + global styles
  page.tsx              — Landing page
actions/                — Server Actions (createAccount, transactions, budget, seed, send-email)
  lib/                  — Action-layer helpers: checkUser.ts (throws), calculateRecurring.ts,
                          serializedAmount.ts, index.ts (barrel)
components/             — Shared UI (Radix wrappers in components/ui/, all .tsx)
data/                   — Static data: categories.ts, landing.tsx
emails/                 — template.tsx (React Email; see Commands — the preview CLI is not runnable)
hooks/                  — use-fetch.ts (client fetch-to-server-action wrapper)
lib/                    — Utilities and shared logic
  arcjet.ts             — Arcjet tokenBucket client (used by actions/transaction.ts); proxy.ts builds its own shield/detectBot client
  checkUser.ts          — Auth gate for pages (reads Clerk session, redirects if missing)
  inngest/              — Inngest client + 4 functions (budget alert cron, recurring trigger cron, per-event recurring processor, monthly report cron)
  prisma.ts             — Prisma singleton (Prisma 7: must pass the pg driver adapter)
  schema.ts             — Validation schemas (Zod)
  serialized-transaction.ts — Decimal→number row serializer (implicit-`any` boundary; see Language strictness)
  utils.ts              — Misc utilities (cn)
tests/                  — Vitest unit tier: tests/{feature}/unit/*.test.ts
tsconfig.json           — Project TS config (strict, whole-tree include; no jsconfig.json)
next-env.d.ts           — Next-generated ambient types (git-ignored, in .gitignore)
vitest.config.ts        — Test runner config (maps the @/ alias, TZ-pinned via the npm script)
prisma/                 — Database schema and migrations
  schema.prisma         — Prisma schema (single source of truth for data; no `url` in Prisma 7)
  migrations/           — Auto-generated migration files
prisma.config.ts        — Prisma CLI config (datasource url, env loading)
proxy.ts                — Root request hook (ArcJet then Clerk); Next 16 name for middleware, in TypeScript
public/                 — Static assets
.env.local              — Local environment variables (git-ignored)
```

Protected paths: `lib/checkUser.ts`, `lib/prisma.ts`, `prisma/schema.prisma` — do not edit without understanding auth, data access, and schema implications.

### Testing

**Current status:** Vitest exists and `pnpm test` (which is `TZ=UTC vitest run`) passes **19 tests in 3 files**. All 19 are characterisation tests — they pin what the code does today, including two known defects, so a green run is not an endorsement of that behaviour.

- `tests/money/unit/serialize-amount.test.ts` (6) — `serializeAmount` / `serializeTransaction` on `Decimal`-shaped stubs. Pins the shallow-spread contract, i.e. **a nested `Decimal` stays a `Decimal`** and crosses the server/client boundary unconverted.
- `tests/money/unit/calculate-next-recurring.test.ts` (4) — the four intervals plus month-end/leap carry (`2026-01-31` + 1 month → `2026-03-03`), recorded as-is.
- `tests/validation/unit/schemas.test.ts` (9) — `accountSchema`, `transactionSchema`, the `isRecurring`/`recurringInterval` `superRefine` rule. Pins the fact that both money fields are `z.string().min(1)` today — no numeric format rule, no coercion — so **a non-numeric amount or balance validates** (`lib/schema.ts:6`, `:12`). That is the hole Plan B's `parseInput` closes.
- `TZ=UTC` is part of the script, not a suggestion: the recurrence tests are timezone-sensitive and fail under other local zones.
- Nothing is mocked, because nothing needs mocking at the unit tier. No integration or e2e tier exists: `hooks/use-fetch.ts` has no test — that would need the `jsdom` and `@testing-library/react` devDependencies, which are **not installed** (an open question, not a decision).
- Server actions still have zero coverage: they need Postgres credentials that this environment does not have.

Structure for tests that come later (`/testing` skill):
- `tests/{feature}/{tier}/` — unit tier is the only one populated
- Mock at boundary: Prisma, Clerk, Resend, Inngest
- Every route test covers 401 (no auth), 403 (ownership), 400 (bad input)
- Imports already resolve through the `@/` alias; `vitest.config.ts` maps it to the repo root

---

## Development Workflow — Portable core

See `/development-workflow` skill for the complete loop, scoping rules, and verification checklist.

Quick reference:
1. Read what governs the change (STANDING RULES, then context sections)
2. State scope in one sentence
3. Implement smallest verifiable increment
4. Verify with commands (use `/verification-gates` skill)
5. Update docs the change made untrue
6. Report what changed, what was verified, what is unknown

---

## Development Workflow — Project appendix

### Read order before implementing

`STANDING RULES` → `PROJECT OVERVIEW` → `ARCHITECTURE CONTEXT` → `UI CONTEXT` → `CODE STANDARDS` → `DEVELOPMENT WORKFLOW` (portable) → `PM CONVENTIONS` → `PROGRESS TRACKER`. Then `AGENTS.md` → SERVICE ARCHITECTURE section.

### Commands

| Need | Command |
|------|---------|
| Dev server | `pnpm dev` — Turbopack, opens http://localhost:3000 |
| Typecheck | `pnpm typecheck` — `next typegen && tsc --noEmit`, whole tree; currently **0 errors** |
| Test | `pnpm test` — `TZ=UTC vitest run`; 19 unit tests. The `TZ` is load-bearing (recurrence tests fail in other zones) |
| Build | `pnpm build` — production build (Turbopack). Since Plan A Task 12 it also type-checks (`Running TypeScript ...` in the output); it still does **not** lint |
| Lint | `pnpm lint` — `eslint .`, flat config, exits 1 on errors |
| Prisma | `pnpm exec prisma generate`; `pnpm exec prisma migrate dev --name <desc>`; `pnpm exec prisma studio` |
| Email dev | `pnpm email` — **not runnable.** `@react-email/ui` is not installed, so `email dev` stops on an interactive "must be installed / Would you like to install it?" prompt. `emails/template.tsx` is proven only by `tsc` and module resolution, never by the preview renderer |

`pnpm@10.6.5` only (pinned in `package.json`); Node.js 20+ (`>=20.9.0` for Next 16 / Clerk 7).

Prove "run one file" by testing: `pnpm lint -- --debug nonexistent.ts` should report the file does not match any pattern.

### Where logic goes

- `lib/checkUser.ts` — page/layout auth gate (redirects); `actions/lib/checkUser.ts` — action auth gate (throws). Do not implement auth logic elsewhere.
- `lib/prisma.ts` — data access, all Prisma calls go through this singleton (Prisma 7 requires the `@prisma/adapter-pg` adapter here).
- `app/(main)/` — protected pages and layouts, use `checkUser()` in layouts.
- `app/api/` — API routes, use `checkUser()` for protected endpoints.
- `lib/schema.ts` — Zod validation schemas for forms and API input.
- `proxy.ts` — root request hook: ArcJet (`shield`, `detectBot`) then `clerkMiddleware`. Next 16 renamed this file from `middleware.js`; Plan A converted it to TypeScript.

Protected paths: `lib/checkUser.ts`, `lib/prisma.ts`, `prisma/schema.prisma`, `prisma.config.ts`.

### Framework version drift

**Next.js 16.4.0 gotchas from training data:**
- Server Components are default; do not assume client-side hooks work without `'use client'`.
- API routes use named exports (`export async function GET(request) {}`), not default export.
- `getServerSession()` does not exist; use `@clerk/nextjs`'s `auth()` instead.
- Root middleware file is `proxy.ts` (this repo) — Next 16 calls it `proxy`, not `middleware`; the old `middleware.js` name is no longer picked up.
- `next.config.mjs` rejects the removed `eslint` key; build and lint are independent gates. `next build` does type-check (no `typescript.ignoreBuildErrors`), `pnpm lint` does not gate the build.
- Clerk 7 (Core 3) removed `<SignedIn>`, `<SignedOut>`, and `<Protect>` — rendering them **throws at runtime, not at build time**. Use `<Show when="signed-in"|"signed-out">` from `@clerk/nextjs`.

Read `node_modules/next/dist/docs/` before touching frameworks APIs.

### Schema changes

`postinstall` runs `prisma generate` only — migrations are **not** applied automatically. The connection string the CLI uses comes from `prisma.config.ts` (`DIRECT_URL` falling back to `DATABASE_URL`), because Prisma 7 no longer accepts `url`/`directUrl` inside the schema's datasource block and no longer loads `.env*` on its own.

To add a column:
1. Edit `prisma/schema.prisma`.
2. Run `pnpm exec prisma migrate dev --name <description>` — generates and applies the migration.
3. Commit the generated file in `prisma/migrations/`.

Do not edit applied migrations. If a migration has errors, create a new one that fixes it.

### Data today

Dashboard data is seeded via `app/api/seed/route.ts` (dev only). Run `curl http://localhost:3000/api/seed` — it is a `GET`, unauthenticated, and it writes rows. Note `actions/seed.ts:8-9` reads `ACCOUNT_ID` and `USER_ID` through `as string` assertions; neither var is in the documented inventory or in `.env.local` here, so the seed path is unverified (see the `as string` open question).

### Before moving to the next unit

1. The unit works end-to-end inside the scope you stated at the start.
2. No invariant in ARCHITECTURE CONTEXT was violated.
3. PROGRESS TRACKER reflects what actually happened.
4. The full gate chain is green: `pnpm typecheck` ✓ (0 errors), `pnpm test` ✓, `pnpm build` ✓ (type-checks, does not lint), `pnpm lint` at the recorded census, manual smoke test ✓ where credentials allow.

---

## PM Conventions

See `/git-workflow` skill for complete commit conventions, push discipline, and PR workflow.

### Commits (summary)

- Prefix: `feat:` `fix:` `style:` `perf:` `refactor:` `chore:` `docs:` `test:` `build:` `ci:`
- One logical change per commit
- Subject says **why**, body ≤ 4 lines
- Example: `feat(transaction): add category filtering on dashboard`
  - Users can now filter transactions by category on the dashboard
  - Adds Zod schema validation and updates the transaction query
  - Closes #42

### PRs (summary)

- Title: `<type>(<scope>): <imperative summary>` — e.g., `feat(auth): add staff role access`
- Body: what changed (2–3 bullets), how verified (gate + manual check), what wasn't covered (third-party, prod-only)
- One PR per feature. No grab-bag PRs.
- Draft until gate is green; request review after.
- Merge style: Squash-merge for small features, rebase-merge for larger features

### Review gate (must be green to merge)

The chain from `/verification-gates` skill and STANDING RULES (Rule 13):
1. `pnpm typecheck` → 0 errors
2. `pnpm test` → 19 passed
3. `pnpm build` → succeeds (it type-checks; it does not lint)
4. `pnpm lint` → no **new** error class; the tree stays red on pre-existing debt (see Progress Tracker for the census), so "green lint" is not the gate
5. Manual verification (smoke test in browser, database state, etc.) — impossible for auth/DB/email flows here, see the credential blockers

---

## Progress Tracker

### Current phase

**TypeScript Plan A landed and committed; Plan B (Zod enforcement) pending** — migration built 2026-10-12, committed and pushed 2026-10-13. All 79 JavaScript files are `.ts`/`.tsx`, `pnpm typecheck` is at **0 errors project-wide** (down from 194 the moment the tree was renamed), and `pnpm build` type-checks for the first time. Dependency baseline had already been raised to Next 16.4.0 / Prisma 7.10.0 / Clerk 7 / Zod 4 / Inngest 4. `b25dd3f` (this instruction layer) and `a22c0ff` (the migration) are on `origin/feat/ts-zod-plan-a-bridge`, working tree clean. `060c105` rode along: committed locally on 2026-10-11, never pushed until now. No PR opened yet.

### Current goal

Hand over to Plan B (the validation boundary + the strict-flag flips). What Plan B inherits:

- `noImplicitAny: false` and `useUnknownInCatchVariables: false` are still off by design. Measured cost of flipping them: `globalThis.prisma` at `lib/prisma.ts:9` is an accepted implicit any, and **7 of the 10 `error.message` reads sit on a catch binding** (`actions/seed.ts:109`, `actions/dashboard.ts:62`, `actions/budget.ts:101`, `actions/accounts.ts:31`, `actions/accounts.ts:116`, `app/api/seed/route.ts:8`, `hooks/use-fetch.ts:28`) — those are the ones `useUnknownInCatchVariables: true` rejects. The other 3 read `useFetch`'s `error` state, already typed `Error | null`.
- **15 catch bindings** (`14 catch (error)` + 1 `catch (parseError)` at `actions/transaction.ts:67`) await Phase-2 narrowing. The 16th catch block is binding-less: `actions/accounts.ts:62` is `catch {}` — an empty catch that swallows the error and returns `undefined` from `getAccountsWithTransactions`. It is load-bearing, because that `undefined` is what lets `app/(main)/account/[id]/page.tsx:37`'s `if (!accountData) return notFound();` fire.
- **The last structural gap:** `lib/serialized-transaction.ts:1` takes an unannotated parameter, so every serialized account/transaction row in `actions/**` and `app/(main)/**` is `any` and the `Decimal`→number seam is invisible to the compiler. Deliberately deferred rather than fixed on the last task: typing it can only add errors or be neutral, so it cannot improve the gate, and its correct shape depends on Plan B's `parseInput` boundary decision. It also hides `[id]/page.tsx:56`'s redundant `parseFloat(account.balance)`.
- No Zod boundary yet: 12 input-taking actions still accept unvalidated client input, and `actions/accounts.ts:160`'s `as TransactionType` is the compiler being silenced about a URL string.

Blockers unchanged: no `DATABASE_URL`/`DIRECT_URL` in `.env.local`, so the money path (auth → create account → log transaction → balance) cannot be smoke-tested; `pnpm dev` returns 403 on `/`, `/sign-in`, `/dashboard` without `ARCJET_KEY`; `pnpm email` needs `@react-email/ui`.

### Completed

- User authentication (Clerk integration) — 2025-09-25
- Account management (create, list, set default) — 2025-09-25
- Transaction creation (form, validation, DB insert) — 2025-09-25
- Dashboard skeleton (accounts, recent transactions, budget) — 2025-09-25
- Dependency upgrade to Next 16.4.0 / Prisma 7.10.0 / Clerk 7 / Zod 4 / Inngest 4 / ESLint 9 — 2026-10-12, build-verified, runtime-unverified, committed as `a22c0ff`
- TypeScript migration Plan A: 79 files renamed and typed under a per-directory error budget, `pnpm typecheck` 0 errors, 19 characterisation tests, `jsconfig.json` → `tsconfig.json` — 2026-10-12, committed as `a22c0ff`
- `pnpm build` became a type gate (`typescript.ignoreBuildErrors` deleted from `next.config.mjs`) and `include` widened to the whole tree — 2026-10-12
- Agent instruction layer (AGENTS.md, CLAUDE.md, `.claude/skills/`, Plan A spec + plan) committed as `b25dd3f` — 2026-10-13

### In progress

- None. Plan A is closed; the next unit is Plan B.

### Recent work

- `a22c0ff` — refactor: Convert the tree to TypeScript under strict mode — 2026-10-13
- `b25dd3f` — docs: Add agent instruction layer, repo skills and Plan A specs — 2026-10-13
- `060c105` — refactor: Remove fabricated landing content and dead hero modules — 2026-10-11
- `a7f9224` — feat: Add more dummy data on landing page — 2026-10-11
- `80aec7a` — fix: Fix update transaction account balance amount not properly parsed — 2026-10-11

### Open questions

- Recurring transaction cadence: Auto-create next occurrence or manual trigger only?
- Should budget alerts be email, in-app toast, or both?
- Currency support: USD-only MVP or multi-currency from day one?
- Where should the Inngest job run? (Local dev, external worker, serverless?)
- Should the seed endpoint be gated by a secret header in all environments?
- **Lint census: 87 errors and 3 warnings** from `pnpm lint` (`eslint .`). The errors are 86 pre-existing `import/order` violations plus 1 `react-hooks/set-state-in-effect`; the warnings are 2 `react-hooks/incompatible-library` (react-compiler noise) and 1 `react-hooks/exhaustive-deps`. 86 of them autofix with `--fix`. Autofix as a standalone commit, downgrade `import/order` to `warn`, or keep lint red and gate on build only? (AGENTS.md earlier said "92 pre-existing `import/order` errors" — the flat config's `import/order` count is 86.)
- `@react-email/components` is deprecated on npm at every published version ("Package no longer supported"), and `@react-email/ui` is not installed so `pnpm email` cannot run. Which replacement covers `emails/template.tsx`?
- Should `jsdom` + `@testing-library/react` be installed so `hooks/use-fetch.ts` can have a real `renderHook` test? (Deferred: no package installs were in Plan A's scope.)
- The `as string` env assertions in `lib/arcjet.ts:4`, `proxy.ts:14`, `actions/transaction.ts:12`, `lib/inngest/functions.ts:217` and `actions/seed.ts:8-9` are a type-lie: they tell `tsc` a possibly-absent var is a `string`. `experimental.typedEnv` (or a Zod env schema) is the honest fix.
- Scroll suppression on `components/pagination.tsx` has never worked. Task 12 deleted the dead `{ scroll: false }` argument (React's `TransitionStartFunction` takes one parameter) and tightened the lying prop signature at `:23` to match, so the call site no longer type-checks a no-op; `:31` now calls `router.push(url)` with no options. Should page changes suppress scrolling for real, via `router.push(url, { scroll: false })`, which Next.js does honour? Behaviour change, so it waits for a decision.
- **The account chart groups by a date label that loses the year, so it merges rows and mis-sorts:** `app/(main)/account/_components/account-chart.tsx:67` keys the accumulator with `format(new Date(transaction.date), 'MMM dd')` and `:83-84` re-parses that label to order the bars. So a "Dec 31" from 2025 and a "Dec 31" from 2026 merge into one bar, and a window spanning December into January orders the December bars *after* the January ones (the missing year defaults). Pre-existing — Task 11 typed the accumulator and the comparator without changing either — and fixing it means keying by an ISO day and formatting only at render, which changes chart output. Spec item 13; Plan B/Phase 3.
- Is the money bug below fixed by Plan B or by a standalone hotfix first? (`add-transaction-form.tsx:99-101` + `actions/transaction.ts:120-122`.)
- `components/header.tsx` was owned by no Plan A task and its props/helpers stay unannotated — is that Plan B Phase 3 work?
- Should `engines.node` (`>=20.9.0`) be declared now that Next 16 and Clerk 7 both require it?

### Architecture decisions

- **Auth: Clerk over custom** — Reduces complexity, handles MFA and social login.
- **Database: PostgreSQL + Prisma** — Type-safe ORM, migrations, good Next.js integration.
- **Background jobs: Inngest over Bull/Redis** — Managed service, no infra overhead.
- **UI: Radix UI + Tailwind** — Accessible components, fast iteration.
- **Prisma 7 generator stays on `prisma-client-js`** — The newer `prisma-client` generator requires an `output` path and would rewrite every Prisma import; `prisma-client-js` still generates cleanly, so the blast radius stayed on the protected client/datasource files.
- **TypeScript ramp: bridge then tighten** — `strict: true` immediately, `noImplicitAny`/`useUnknownInCatchVariables` deferred to Plan B, because the measured cost of the two flags was the whole tree and a big-bang flip has no per-file budget.
- **Annotate only where a diagnostic demands** — Plan A's per-file rule: no prophylactic types, no casts to silence, no unused-code polish inside a typing task. It is what kept 11 reviewed diffs reviewable; the leftovers are listed in Current goal / Open questions rather than hidden.
- **Tests before the rename (characterisation)** — Vitest over `node:test` because `node:test` needs Node 22+ for type stripping and does not resolve the `@/` alias.

### Session notes

- ESLint is a real gate: `eslint.config.mjs` is a flat config consuming `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` directly (FlatCompat crashes on it), `pnpm lint` is `eslint .`, and Next 16 has no `eslint` key in `next.config.mjs` so the build never lints. `.delta/**` (git-excluded worktree/clone copies) and `next-env.d.ts` are eslint-ignored, and `.delta` is also in `tsconfig.json`'s `exclude`.
- `next.config.mjs` now carries no `typescript` key: `pnpm build` prints `Running TypeScript ...` / `Finished TypeScript in ~1.9s` and fails on a type error. Verified 2026-10-12 with a clean build (exit 0, 9 routes compiled).
- **Money bug Plan A could not fix (highest severity found):** `app/(main)/transaction/_components/add-transaction-form.tsx:99-101` builds `{ amount: parseFloat(data.amount), ...data }` — the spread lands after `amount`, so the parsed number is overwritten by the raw form string and `createTransaction` receives `amount: string`. `actions/transaction.ts:120-122` then computes `account.balance.toNumber() + balanceChange`, which on the INCOME branch concatenates (`100 + "250"` → `"100250"`) and `:143` writes it as a `Decimal`. Fresh accounts hide it (`0 + "250"` → `"0250"` → 250); EXPENSE is accidentally correct via the unary minus. `updateTransaction` already parses (`:207-208`, commit `80aec7a`). **No test pins `createTransaction`.** Recorded as item 10 of the spec's "Reported, not fixed"; Plan B's `parseInput` owns it.
- Recurring transaction columns are wired in `lib/inngest/functions.ts` (`triggerRecurringTransactions` cron → `transaction.recurring.process` event → `processRecurringTransaction`, which writes `balance: { increment: ... }` inside `db.$transaction`), and `app/api/inngest/route.ts` serves all four functions. This is live money-path code, not metadata only — but it has never been run against a database in this environment.
- Email: `actions/send-email.ts` calls Resend and is invoked by the Inngest budget-alert and monthly-report functions. `RESEND_API_KEY` is not present in `.env.local`, and the preview CLI is unrunnable, so both email paths are unverified. The budget-alert payload also sends strings into an arithmetic slot (`lib/inngest/functions.ts:77-78`, `emails/template.tsx` "Remaining" row) — spec item 8.
- `components/ui/{animated-group,progressive-blur,text-effect,infinite-slider}.jsx` were deleted in Plan A Task 5 after proving zero importers, so nothing imports `motion` now; `motion@^14.1.0` remains at `package.json:41` as an unused dependency (`pnpm remove motion` awaits the user's word).
- `app/(main)/dashboard/_components/budget-progress.tsx:60` shows `toast.error('Failed asdasdto update budget')` on a failed budget update — a stray paste in user-visible text, left because Plan A forbids runtime-visible changes (spec item 11).

---

# SERVICE ARCHITECTURE — Implemented surface

This section describes only code that exists. Design intent not yet built lives in TARGET STATE below.

Update this section in the same change that alters the surface described here. Move newly built modules out of TARGET STATE.

## Request path

```
Browser (Clerk session)
    → proxy.ts (Arcjet shield/detectBot, then clerkMiddleware; redirects unauthenticated hits on /dashboard, /account, /transaction)
    → App Router page/layout
    → checkUser() (lib/checkUser.ts redirects for pages; actions/lib/checkUser.ts throws for actions)
    → Prisma queries (scoped to userId)
    → PostgreSQL
    → Response (JSON or HTML)
```

## Modules

| Module | Status |
| --- | --- |
| `lib/checkUser.ts` | Implemented: `checkUser() → userId`, **redirects** to `/sign-in` when the Clerk session is empty. Used in protected layouts. |
| `actions/lib/checkUser.ts` | Implemented: same name, different contract — **throws** `Unauthorized`. Used by server actions. The two are consolidated by Plan B §2c. |
| `lib/prisma.ts` | Implemented: Singleton Prisma client through the `@prisma/adapter-pg` adapter (`export const db = ...`). All data access goes through this. |
| `lib/schema.ts` | Implemented: Zod schemas `accountSchema` and `transactionSchema` (no `userSchema`). Applied **client-side only**, through `zodResolver` in the two forms; no action validates its input. |
| `lib/serialized-transaction.ts` | Implemented: `Decimal`→number row serializer. Parameter is unannotated, so its return is `any` — the known structural gap. |
| `lib/arcjet.ts` | Implemented: Arcjet `tokenBucket` client, imported by `actions/transaction.ts`. `proxy.ts` builds a separate shield/detectBot client. Neither is exercised here — no `ARCJET_KEY`. |
| `lib/inngest/` | Implemented at the source level: client + 4 functions (budget-alert cron, recurring trigger cron, per-event recurring processor, monthly-report cron). **Never executed** — no database, no key, no Inngest account in this environment. |
| `actions/` | Implemented: 15 exported server actions (`getUserAccounts`, `getDashboardData`, `seedTransactions` take no input; 12 accept client input and validate none of it). Includes `scanReceipt`, the Gemini receipt-OCR action, which cannot run without `GEMINI_API_KEY`. |
| `app/(auth)/` | Implemented: Clerk sign-in/sign-up pages (Clerk-managed UI). |
| `app/(main)/` | Implemented: Protected layout, reads `checkUser()`. Contains dashboard, accounts, transactions pages. |
| `app/api/seed/` | Implemented: Creates test data (users, accounts, transactions). Unauthenticated `GET`; should gate in prod. |
| `app/api/inngest/` | Implemented: `serve()` exposing GET/POST/PUT for the 4 functions above. Not connected to a running Inngest account. |
| `tests/` | Implemented: 19 Vitest unit tests (3 files), all characterisation. No integration, no e2e. |

Anything not built does not get a row.

## Cross-cutting rules — one authority, enforced once

- **Auth gate:** `lib/checkUser.ts:checkUser()` — reads Clerk `auth()`, returns `userId` or throws redirect; `actions/lib/checkUser.ts` throws `Unauthorized` instead. **Two implementations until Plan B §2c.** **Enforcement:** All protected code must import and call one of these; never re-implement session checks. (9 actions still call `auth()` inline — grep `auth()` in `actions/` for the current list.)
- **Database access:** `lib/prisma.ts` — singleton Prisma client. All reads/writes go through `db.user.findUnique()`, `db.transaction.create()`, etc. **Enforcement:** No other modules instantiate Prisma; no raw SQL.
- **Validation:** `lib/schema.ts` — Zod schemas exist, but the claim "all form submissions and API endpoints validate input against these schemas before database access" is **not** true today: the schemas run only in the client forms via `zodResolver`, and every action trusts its arguments. Server-side enforcement is Plan B's `parseInput`.

## HTTP surface (what actually exists)

| Route | Method | Auth | Notes |
| --- | --- | --- | --- |
| `/` | GET | None | Landing page (public). |
| `/(auth)/sign-in` | GET | None | Clerk sign-in UI. |
| `/(auth)/sign-up` | GET | None | Clerk sign-up UI. |
| `/(main)/dashboard` | GET | Clerk session | Protected. Shows accounts, transactions, budget. |
| `/(main)/account` | GET | Clerk session | Protected. Create/manage accounts. |
| `/(main)/transaction` | GET | Clerk session | Protected. Create/view transactions. |
| `/api/seed` | GET | None (dev) | Populate test data. No gating; should be prod-only or require secret. |
| `/api/inngest` | GET, POST, PUT | Inngest signature | `serve()` for the 4 functions. Not connected to a running Inngest account. |

**Planned and absent:** Transaction export, budget-alert email delivery (written but never sent), recurring processing against a real database, and any server-side input validation.

**Built but never verified here:** Receipt OCR is implemented and user-reachable — `actions/transaction.ts:scanReceipt()` sends the image to `gemini-1.5-flash` (`actions/transaction.ts:12,17`) and `app/(main)/transaction/_components/scan-receipt.tsx` renders it inside the add-transaction form (`add-transaction-form.tsx:136`, non-edit mode only). It has never run: `GEMINI_API_KEY` is absent, `scanReceipt(file)` takes an unannotated `file`, and its `parseFloat(data.amount)`/`new Date(data.date)` output is fed straight into the form. Note that `receiptUrl` itself is never populated by the scanner — only amount, date, description, category and merchant come back, so "upload" (persisting the file) is what is actually missing, not the OCR.

## Background work (jobs, workers, cron)

- **Inngest webhook:** `app/api/inngest/route.ts` serves the 4 functions in `lib/inngest/functions.ts` (budget-alert cron, recurring-trigger cron, per-event recurring processor, monthly-report cron). The per-event processor mutates `account.balance` inside `db.$transaction`, so it is live money-path code — but nothing has run here: no Inngest account, no database, no `RESEND_API_KEY`.
- **Who consumes this in production:** Inngest cloud (not yet enabled).
- **Gaps:** No function has executed; no cleanup jobs exist.

## Pages and caching

Pages are in `app/`:
- `/` — public landing page (prerendered)
- `/(auth)/sign-in`, `/(auth)/sign-up` — Clerk pages (dynamic)
- `/(main)/dashboard` — protected, dynamic (reads user data)
- `/(main)/account` — protected, dynamic
- `/(main)/transaction` — protected, dynamic

All dynamic pages use Next.js default ISR (cache when possible, revalidate on request). No explicit `revalidate` tags. `next build` reports all 9 routes as dynamic (`ƒ`), not prerendered.

## Verification

```bash
pnpm typecheck # next typegen && tsc --noEmit — 0 errors over 81 source files
pnpm test      # TZ=UTC vitest run — 19 passed (3 files)
pnpm build     # next build — compiles AND type-checks (9 routes, exit 0)
pnpm lint      # eslint . — exit 1: 87 errors, 3 warnings (pre-existing debt, see Rule 13)
# Manual: sign in, create account, log transaction, verify dashboard — impossible here, no DATABASE_URL
```

Test coverage of the app: effectively 0% — the 19 tests cover the money serialisers, the recurrence helper and the two Zod schemas, not any page, action or route. See CODE STANDARDS → Testing.

## Repo skills

`.claude/skills/` is the source of truth for project-specific guidance. Load them when the context applies:

- `/testing` — test structure and patterns; the unit tier exists, integration/e2e do not
- `/verification-gates` — the chain that must pass before work is complete; how to verify and report
- `/development-workflow` — the work loop, scoping rules, and requirements discipline
- `/git-workflow` — commit conventions, push discipline, and PR workflow

---

# TARGET STATE — Not Yet Built

Design intent not implemented. Treat as requirements for future work. Two shapes appear below: code that does not exist at all, and — flagged explicitly — code that exists but has never been executed or verified in this environment.

- **Recurring transaction processing run against a database:** the code is built (`triggerRecurringTransactions` cron → `transaction.recurring.process` event → `processRecurringTransaction`, which does `balance: { increment: … }` inside `db.$transaction` at `lib/inngest/functions.ts:150`) and served at `/api/inngest`, but no schedule has fired here and no occurrence has ever been applied. What is missing is execution and verification, not implementation.
- **Email alerts delivered:** `actions/send-email.ts` calls `resend.emails.send` and is invoked by the budget-alert and monthly-report Inngest functions, which also write `budget.lastAlertSent` (`lib/inngest/functions.ts:86`). No send has succeeded in this environment (`RESEND_API_KEY` absent, `pnpm email` unrunnable), so delivery remains unproven.
- **Receipt upload (storing the file):** Gemini OCR is built and user-reachable (`scanReceipt` → `scan-receipt.tsx`, rendered at `add-transaction-form.tsx:136`), but the receipt itself is never stored: `receiptUrl` stays `null` on scanned transactions, no upload endpoint or bucket exists, and the OCR call has never succeeded (`GEMINI_API_KEY` absent). See SERVICE ARCHITECTURE → HTTP surface.
- **Transaction export:** `GET /api/transactions?from=X&to=Y&format=csv` — export date range as CSV. Not built.
- **Analytics dashboard:** Charts for spending by category, trends over time. Currently only "recent transactions" are shown.
- **Tests beyond the unit tier:** 19 Vitest unit tests exist (`tests/`, `pnpm test`). Integration and e2e tests do not exist, and no page, server action, API route, `proxy.ts` or Inngest function is covered — coverage of the app's behaviour is effectively 0%. See CODE STANDARDS (Testing section).
- **Multi-user sharing:** No shared budgets or collaborative features.
- **Mobile app:** Web-only for MVP.

---

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

# FEATURE SPECS

One unit of deliverable work per section.

## 00 — Dashboard transaction filtering

### Goal

Users can filter transactions by category on the dashboard without page reload.

### First increment

1. Add category filter UI (Select dropdown on dashboard).
2. Wire to Prisma query (pass `category` param).
3. Update display in real time (client-side state or Server Action).

### Later increments

- Filter by date range
- Filter by transaction type (income/expense)

### Deferred / open questions

- Should filters persist in URL state or session storage?
- What are the default categories? Hardcoded list or user-defined?

### Security / permissions

Users may only filter their own transactions. Authority: `checkUser()` in the dashboard layout.

### Verification

- `pnpm build` ✓
- Manual: sign in, navigate to dashboard, select a category, verify transaction list updates.
- Not verified: category persistence across sessions, bulk filtering performance.

---

# EDITING THIS FILE

## When to fill sections

1. **STANDING RULES (Rules 11–17)** — day one when you learn the first fact (package manager, runtime, gates). ✓
2. **PROJECT OVERVIEW through PM CONVENTIONS** — as you build, one section per decision. ✓
3. **SERVICE ARCHITECTURE** — after your first real commit, listing only implemented code. ✓
4. **TARGET STATE** — whenever design intent outpaces implementation. ✓
5. **PROGRESS TRACKER** — after every meaningful change. ✓
6. **FEATURE SPECS** — one per unit of work. ✓

## Health check

```bash
grep -n '<[a-zA-Z_/]' AGENTS.md | grep -v 'VERIFICATION STANDARDS\|FEATURE SPECS/00-template' | grep -v 'migrate dev --name\|WHERE userId\|<Image>\|SignedIn\|<type>(<scope>)'
```

Every hit outside VERIFICATION STANDARDS and FEATURE SPECS/00-template is an unfilled slot. Zero hits means this file describes your project accurately.

The last `grep -v` names four patterns that look like slots but are not: JSX element names used in prose (`<Image>`, `<SignedIn>`), the Prisma placeholder `--name <description>` / `<desc>`, the ownership notation `WHERE userId = <from session>`, and the commit-subject template `<type>(<scope>): <imperative summary>`. Without them the check reports 8 false positives (lines 109, 242, 312, 478, 504, 514, 548, and this paragraph itself).

## One rule that organizes everything else

**Code is the source of truth.** When implementation and docs disagree, the doc is the defect. Fix the doc in the same change.
