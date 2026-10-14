# SERVICE ARCHITECTURE — Implemented surface

This body describes only code that exists. Design intent not yet built lives in `docs/agent-guide/target-state.md`.

Update this body in the same change that alters the surface described here. Move newly built modules out of `docs/agent-guide/target-state.md`.

## Request path

```
Browser (Clerk session)
    → proxy.ts (Arcjet shield/detectBot, then clerkMiddleware; redirects unauthenticated hits on /dashboard, /account, /transaction)
    → App Router page/layout (app/(main)/layout.tsx does no auth)
    → checkUser() (lib/checkUser.ts provisions the users row and returns null — it never redirects;
       actions/lib/checkUser.ts throws for server actions)
    → Prisma queries (scoped to userId)
    → PostgreSQL
    → Response (JSON or HTML)
```

## Modules

| Module | Status |
| --- | --- |
| `lib/checkUser.ts` | Implemented: resolves `currentUser()` to a `users` row, creating it on first sight. Returns `null` with no session and `null` again after catching a failed read or write; **it never redirects**. Both callers — `components/header.tsx`, mounted by `app/layout.tsx`, and `app/(main)/transaction/create/page.tsx` — discard the value, so this runs for provisioning, not for access. |
| `actions/lib/checkUser.ts` | Implemented: same name, different contract — **throws** `Unauthorized`. Used by server actions. The two are consolidated by Plan B §2c. |
| `lib/prisma.ts` | Implemented: Singleton Prisma client through the `@prisma/adapter-pg` adapter (`export const db = ...`). All data access goes through this. |
| `lib/schema.ts` | Implemented: Zod schemas `accountSchema` and `transactionSchema` (no `userSchema`). Applied **client-side only**, through `zodResolver` in the two forms; no action validates its input. |
| `lib/serialized-transaction.ts` | Implemented: `Decimal`→number row serializer. Parameter is unannotated, so its return is `any` — the known structural gap. |
| `lib/arcjet.ts` | Implemented: Arcjet `tokenBucket` client, imported by `actions/transaction.ts`. `proxy.ts` builds a separate shield/detectBot client. Neither is exercised here — no `ARCJET_KEY`. |
| `lib/inngest/` | Implemented at the source level: client + 4 functions (budget-alert cron, recurring trigger cron, per-event recurring processor, monthly-report cron). **Never executed** — no database, no key, no Inngest account in this environment. |
| `actions/` | Implemented: 15 exported server actions (`getUserAccounts`, `getDashboardData`, `seedTransactions` take no input; 12 accept client input and validate none of it). Includes `scanReceipt`, the Gemini receipt-OCR action, which cannot run without `GEMINI_API_KEY`. |
| `app/(auth)/` | Implemented: Clerk sign-in/sign-up pages (Clerk-managed UI). |
| `app/(main)/` | Implemented: dashboard, account and transaction pages. Its `layout.tsx` performs no auth — the segment is protected only by `proxy.ts`'s route matcher, and the pages read through actions that call `auth()` inline. |
| `app/api/seed/` | Implemented: Creates test data (users, accounts, transactions). Unauthenticated `GET`; should gate in prod. |
| `app/api/inngest/` | Implemented: `serve()` exposing GET/POST/PUT for the 4 functions above. Not connected to a running Inngest account. |
| `tests/` | Implemented: the unit tier — `money`, `validation`, `platform` (the instruction-layer checker). No integration, no e2e. |

Anything not built does not get a row.

## Cross-cutting rules — one authority, enforced once

- **Auth gate:** the route authority is `proxy.ts` — Arcjet `shield`/`detectBot`, then `clerkMiddleware`, which calls `redirectToSignIn()` for a session-less request matching its four `isProtected` prefixes. `lib/checkUser.ts:checkUser()` provisions the `users` row and answers `null`; `actions/lib/checkUser.ts:checkUser()` throws `Unauthorized`. **Two implementations until Plan B §2c.** **Enforcement:** new server actions call the throwing one; never re-implement a session check, and never treat the page-side one as a gate. (9 sites in `actions/accounts.ts`, `actions/budget.ts`, `actions/dashboard.ts` and `actions/transaction.ts` still read `auth()` inline.)
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
pnpm test      # TZ=UTC vitest run — 44 passed (4 files)
pnpm check:docs # TZ=UTC vitest run tests/platform — 25 passed (1 file); the instruction layer checks itself
pnpm build     # next build — compiles AND type-checks (9 routes, exit 0)
pnpm lint      # eslint . — exit 1: 87 errors, 3 warnings (pre-existing debt, see Rule 13)
# CI: .github/workflows/ci.yml runs install + typecheck + test + build on push to main|feat/** and on
#     every pull_request. No lint step (gate 4 is red on the census above), no secrets. First runner
#     execution 2026-10-14: typecheck / test / build pass in 1m0s, Tests 40 passed (40).
# CI: gate 2 now also runs the instruction-layer checker.
# Manual: sign in, create account, log transaction, verify dashboard — impossible here, no DATABASE_URL
```

These are the numbers this repo's baseline rule allows in exactly two homes: here and
`docs/standing-rules/13-verification-gates.md` gate 2.

Test coverage of the app: effectively 0% — the app-tier tests cover the money serialisers, the recurrence helper and the two Zod schemas, not any page, action or route, and the platform tier checks these docs rather than the app. See `docs/agent-guide/code-standards.md` → Testing.

