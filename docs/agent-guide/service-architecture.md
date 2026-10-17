# SERVICE ARCHITECTURE — Implemented surface

Only code that exists. Intent not built → `target-state.md`. Update this body in the same change that alters the surface; move built modules out of `target-state.md`.

## Request path

```
Browser (Clerk session, or none)
  → proxy.ts (clerkMiddleware only; Arcjet + redirectToSignIn commented out → session-less reaches the page)
  → App Router page/layout (app/(main)/layout.tsx does no auth)
  → checkUser() (lib/checkUser.ts provisions users row, returns null, never redirects;
                 actions/lib/checkUser.ts resolves session, else demo row)
  → Prisma queries (scoped to userId) → PostgreSQL
  → Response (JSON or HTML)
```

## Modules

| Module                           | Status                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/checkUser.ts`               | Resolves `currentUser()` to a `users` row, creates on first sight. Returns `null` with no session and `null` after a failed read/write; **never redirects**. Only importer `AuthSlot` (`components/header.tsx:36`), whose Suspense site (`:111-113`) is commented out → **no request calls this**.                                                       |
| `actions/lib/checkUser.ts`       | Identity seam. Session → that row; no session → demo row (`lib/demo-identity.ts`), read first, created on miss (not `upsert` — Prisma would compute `@default(uuid())` every call; Cache Components refuses it during prerender). Unique violation on create re-reads. Throws `User not found` only when a session has no row. Request-scoped `cache()`. |
| `lib/prisma.ts`                  | Singleton Prisma client via `@prisma/adapter-pg`. All data access.                                                                                                                                                                                                                                                                                       |
| `lib/schema.ts`                  | Zod `accountSchema` + `transactionSchema` (no `userSchema`). **Client-side only** via `zodResolver`; no action validates input.                                                                                                                                                                                                                          |
| `lib/serialized-transaction.ts`  | `Decimal`→number row serializer, generic over row (`T` + structural `DecimalLike`); typed seam at `:9-11`.                                                                                                                                                                                                                                               |
| `lib/arcjet.ts`                  | Arcjet `tokenBucket` client, imported by `actions/transaction.ts`. `proxy.ts` shield/detectBot commented out → rate limiting is the only Arcjet rule in path.                                                                                                                                                                                            |
| `lib/async-state.ts`             | `idle/loading/success/error` reducer; `hooks/use-fetch.ts` wraps it. Tested.                                                                                                                                                                                                                                                                             |
| `lib/transaction-table-state.ts` | Transactions-table reducer (selection/search/filters/dialog). Tested.                                                                                                                                                                                                                                                                                    |
| `lib/recurring-lifecycle.ts`     | `recurringPhase` + `applyRecurringTick`; called by `lib/inngest/functions.ts`. Tested.                                                                                                                                                                                                                                                                   |
| `lib/dashboard-stats.ts`         | Pure dashboard aggregates (month totals, deltas, savings rate, category ranking, 30-day cashflow, weekday spend, year-over-year). No React; tested.                                                                                                                                                                                                      |
| `lib/health.ts`                  | `checkHealth(ping)` liveness seam; route wires a one-row DB ping. Tested without React or DB.                                                                                                                                                                                                                                                            |
| `lib/inngest/`                   | Client + 4 functions (budget-alert cron, recurring-trigger cron, per-event recurring processor, monthly-report cron). **Never executed** — `INNGEST_EVENT_KEY`/`INNGEST_SIGNING_KEY` unset.                                                                                                                                                              |
| `actions/`                       | 15 exported server actions (`getUserAccounts`, `getDashboardData`, `seedTransactions` take no input; 12 accept client input, validate none). Includes `scanReceipt` (Gemini OCR; `GEMINI_API_KEY` set, browser upload returns extraction in 3-5s from `gemini-3.1-flash-lite` — only the stored file is missing).                                        |
| `app/(auth)/`                    | Clerk sign-in/up pages.                                                                                                                                                                                                                                                                                                                                  |
| `app/(main)/`                    | Dashboard, account, transaction pages. `layout.tsx` does no auth; anonymous visit renders directly via the seam (demo owner).                                                                                                                                                                                                                            |
| `app/api/seed/`                  | Creates test data. Unauthenticated `GET`; gate in prod.                                                                                                                                                                                                                                                                                                  |
| `app/api/inngest/`               | `serve()` GET/POST/PUT for the 4 functions. Not connected to a running Inngest account.                                                                                                                                                                                                                                                                  |
| `tests/`                         | Unit tier only: `money`, `validation`, `hooks`, `recurring`, `transactions`, `dashboard`. No integration/e2e.                                                                                                                                                                                                                                            |

Anything not built gets no row.

## Cross-cutting rules — one authority, enforced once

- **Auth gate:** route authority is `proxy.ts` — `clerkMiddleware` runs every request, but `isProtected` + `redirectToSignIn()` commented out for review (restoring = uncomment). `lib/checkUser.ts` provisions the row, answers `null`, currently unreachable. `actions/lib/checkUser.ts` is the identity seam (session row, else demo owner). **Enforcement:** `auth()` read in exactly one file; new actions call the seam, never re-implement a session check.
- **Database access:** `lib/prisma.ts` singleton. No other module instantiates Prisma; no raw SQL.
- **Validation:** `lib/schema.ts` schemas run only in client forms; the claim "all submissions validate before DB access" is **false** today. Server-side enforcement is Plan B's `parseInput`.

## HTTP surface (exists)

| Route                 | Method       | Auth              | Notes                                                              |
| --------------------- | ------------ | ----------------- | ------------------------------------------------------------------ |
| `/`                   | GET          | None              | Landing                                                            |
| `/(auth)/sign-in`     | GET          | None              | Clerk                                                              |
| `/(auth)/sign-up`     | GET          | None              | Clerk                                                              |
| `/(main)/dashboard`   | GET          | None (gate off)   | Accounts, transactions, budget; demo owner's ledger                |
| `/(main)/account`     | GET          | None (gate off)   | Create/manage accounts                                             |
| `/(main)/transaction` | GET          | None (gate off)   | Create/view transactions                                           |
| `/api/seed`           | GET          | None (dev)        | Writes rows; prod-only or secret                                   |
| `/api/health`         | GET          | None              | Liveness: DB ping via lib/health; 200 up, 503 down; builds dynamic |
| `/api/inngest`        | GET/POST/PUT | Inngest signature | 4 functions; not connected                                         |

**Planned, absent:** transaction export, budget-alert email delivery (written, never sent), recurring processing against a real DB, any server-side input validation.

**Measured end to end (2026-10-16):** receipt OCR runs, fills the form. `scanReceipt` (`actions/transaction.ts:27`) sends to `gemini-3.1-flash-lite` (`RECEIPT_MODEL`, `:24`); `scan-receipt.tsx` renders inside the form (`add-transaction-form.tsx:160`, non-edit). One 1.6 MB upload → HTTP 200 in ~4s, `{amount: 19.56, date, category: "groceries", ...}`, form filled, 0 console errors. Two fixes needed: retired model name (`gemini-2.5-flash` 404s against this key though `GET /v1beta/models/gemini-2.5-flash` returns 200), and `categories-form.tsx` used `defaultValue` (read once, so a post-mount category never reached the trigger) — now controlled `value={category ?? null}` + `items`. `receiptUrl` still never written.

## Background work

- **Inngest webhook:** `app/api/inngest/route.ts` serves the 4 functions. Per-event processor mutates `account.balance` inside `db.$transaction` (live money-path code) — but nothing invoked: no Inngest account configured (`INNGEST_EVENT_KEY`/`INNGEST_SIGNING_KEY` unset).
- **Prod consumer:** Inngest cloud (not enabled). **Gaps:** no function executed; no cleanup jobs.

## Pages and caching

Per `pnpm build` (measured 2026-10-16, Next 16.4.1, Cache Components on):

- `/`, `/_not-found` — `○` static.
- `/dashboard`, `/account/[id]`, `/transaction/create`, `/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]` — `◐` partial prerender. The three ledger pages `export const instant = false` (read ledger per request).
- `/api/inngest`, `/api/seed` — `ƒ` dynamic.

`new Date()` in a synchronous page-shell component logs `blocking-prerender-current-time` and error-boundaries that section even with `instant = false`; `dashboard/page.tsx` awaits `connection()` before formatting the month label.

No `no-store`/`revalidate` export anywhere; no `revalidateTag`; `revalidatePath()` at 9 sites across 4 action files. Not access control — ledger pages reachable anonymously while the redirect block stays commented out.

## Verification

```bash
pnpm typecheck        # exit 0 — tsc --noEmit
pnpm test             # exit 0 — 107 passed (12 files); passes with and without TZ=UTC
pnpm lint             # exit 0 — vp check: format + lint 0 errors / 6 no-unused-vars warnings (129 files)
pnpm verify           # exit 0 — test → typecheck → lint → build, the chain the pipeline gates on
pnpm build            # exit 0 — compiles, "Running TypeScript ...", 13 routes (/api/health dynamic)
pnpm db:seed          # deletes every transaction/budget/account row, re-seeds each users row
/usr/bin/curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/dashboard                    # 200, anonymous
/usr/bin/curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/account/<seeded-id>          # 200 for all four
# CI: .github/workflows/ci.yml — vp install --frozen-lockfile, vp check, vp test, vp run build on Node 24.
# tests/platform is gone → nothing checks AGENTS.md vs these bodies; totals are hand-maintained.
# Exercised in a browser (2026-10-16): receipt scan on /transaction/create. NOT exercised: no form write (create/update), no Inngest function.
# Fixed 2026-10-17: getPaginatedTransactions takes a required accountId and scopes via buildTransactionWhere
# (actions/lib/transactionWhere.ts, tested) — account + owner travel together, so each account page renders its own ledger.
# Measured 2026-10-17: pipeline gate layer — 58/58 checks green across two throwaway harnesses (not committed:
# no integration tier in tests/) — 34/34 driving .opencode/plugins/pipeline.js through its V2 hooks and commands,
# 24/24 driving scripts/pipeline-gate.ts through real Claude Code hook payloads. Plus one live opencode v2.0.30
# session (source write refused at stage planned, specs/ write allowed). Claude Code 2.1.300 hooks NOT exercised
# live: its API was unreachable here (ECONNREFUSED). See target-state.md.
```

These are the **only** home for totals this body's `architecture.md`/`code-standards.md`/`workflow.md`/`pm-conventions.md` defer to. `AGENTS.md` quotes none. Hand-maintained.

App test coverage: effectively 0% — the unit tests cover money serialisers, the recurrence helper, two Zod schemas, three app reducers and the build-pipeline machine, not any page/action/route.
