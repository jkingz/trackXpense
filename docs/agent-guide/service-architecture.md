# SERVICE ARCHITECTURE — Implemented surface

Only code that exists. Intent not built → `target-state.md`. Update this body in the same change that alters the surface; move built modules out of `target-state.md`.

## Request path

```
Browser (Better Auth session, or none)
  → proxy.ts (validates session on guarded routes)
  → App Router page/layout (requireUser() for ledger pages)
  → checkUser() for actions and API routes (actions/lib/checkUser.ts)
  → Prisma queries (scoped to userId) → Neon PostgreSQL
  → Response (JSON or HTML)
```

## Modules

| Module                           | Status                                                                                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/neon-auth.ts`               | Better Auth email/password configuration backed by Prisma.                                                                                                                                                                |
| `actions/lib/checkUser.ts`       | `currentUser()` validates the Better Auth session and loads `User`; `checkUser()` throws when signed out; `requireUser()` redirects pages to `/sign-in`. Request-scoped `cache()`.                                        |
| `lib/route-guard.ts`             | Pure route decision for guarded paths; tested.                                                                                                                                                                            |
| `lib/prisma.ts`                  | Singleton Prisma client via `@prisma/adapter-pg`. All data access.                                                                                                                                                        |
| `lib/schema.ts`                  | Zod `accountSchema` + `transactionSchema` + `transactionServerSchema`. Client forms use `zodResolver`; server actions validate via `parseInput`.                                                                          |
| `lib/serialized-transaction.ts`  | `Decimal`→number row serializer, generic over row (`T` + structural `DecimalLike`); typed seam at `:9-11`.                                                                                                                |
| `lib/arcjet.ts`                  | Arcjet `tokenBucket` client, imported by `actions/transaction.ts`. `proxy.ts` shield/detectBot commented out → rate limiting is the only Arcjet rule in path.                                                             |
| `lib/async-state.ts`             | `idle/loading/success/error` reducer; `hooks/use-fetch.ts` wraps it. Tested.                                                                                                                                              |
| `lib/transaction-table-state.ts` | Transactions-table reducer (selection/search/filters/dialog). Tested.                                                                                                                                                     |
| `lib/recurring-lifecycle.ts`     | `recurringPhase` + `applyRecurringTick`; called by `lib/inngest/functions.ts`. Tested.                                                                                                                                    |
| `lib/dashboard-stats.ts`         | Pure dashboard aggregates (month totals, deltas, savings rate, category ranking, 30-day cashflow, weekday spend, year-over-year). No React; tested.                                                                       |
| `lib/health.ts`                  | `checkHealth(ping)` liveness seam; route wires a one-row DB ping. Tested without React or DB.                                                                                                                             |
| `lib/inngest/`                   | Client + 4 functions (budget-alert cron, recurring-trigger cron, per-event recurring processor, monthly-report cron). **Never executed** — `INNGEST_EVENT_KEY`/`INNGEST_SIGNING_KEY` unset.                               |
| `lib/site.ts`                    | Public origin + name/description, read from `NEXT_PUBLIC_APP_URL` (localhost fallback). Source for `metadataBase`, canonical, og:url, `/robots.txt`, `/sitemap.xml`, JSON-LD. No React.                                   |
| `lib/brand-mark.tsx`             | Brand glyph drawn with `next/og` primitives (satori has no SVG). Shared by `app/icon.tsx` and `app/apple-icon.tsx`.                                                                                                       |
| `lib/og-card.tsx`                | Shared 1200x630 social-card body; `app/opengraph-image.tsx` and `app/twitter-image.tsx` each wrap it (Next fills `og:image` and `twitter:image` from separate file conventions).                                          |
| `lib/social-card.ts`             | `socialCard({title, description?, path})` — one page's `<title>`, `og:*`, `twitter:*`, `og:url`, canonical. Called by `app/page.tsx`, `app/terms/page.tsx`, `app/privacy/page.tsx`. Tested.                               |
| `actions/`                       | 16 exported server actions (`getUserAccounts`, `getDashboardData`, `signOutAction` take no input; write paths parse input via `actions/lib/parseInput.ts`). Includes `scanReceipt` (Gemini OCR) and `sendEmail` (Resend). |
| `app/(auth)/`                    | Better Auth email/password sign-in/up pages; demo sign-in button. `layout.tsx` emits `noindex` and a neutral non-landing title (spec 14 increment 3).                                                                     |
| `app/(main)/`                    | Dashboard, account, transaction pages; session required.                                                                                                                                                                  |
| `app/not-found.tsx`              | Root 404 page for unmatched URLs; own title, `noindex`, no `og:url` (spec 14 increment 4).                                                                                                                                |
| `app/api/receipts/`              | `POST` receipt upload; R2 when `R2_*` set, else `public/uploads`. No auth gate.                                                                                                                                           |
| `app/api/inngest/`               | `serve()` GET/POST/PUT for the 4 functions. Not connected to a running Inngest account.                                                                                                                                   |
| `tests/`                         | Three tiers per feature: `{feature}/unit` (pure), `{feature}/integration` (real DB), `{feature}/e2e` (Playwright). Features: auth, dashboard, money, pipeline, recurring, seo, transactions, validation.                  |

Anything not built gets no row.

## Cross-cutting rules — one authority, enforced once

- **Auth gate:** `proxy.ts` validates Better Auth sessions for guarded routes. `requireUser()` guards ledger pages; `checkUser()` guards server actions and user-scoped API routes. Demo access signs into the shared demo account through `/api/demo`.
- **Database access:** `lib/prisma.ts` singleton. No other module instantiates Prisma; no raw SQL.
- **Validation:** `lib/schema.ts` schemas run in client forms and server actions via `parseInput` (`actions/lib/parseInput.ts`); all write paths now validate before DB access.

## HTTP surface (exists)

| Route                 | Method       | Auth              | Notes                                                                                   |
| --------------------- | ------------ | ----------------- | --------------------------------------------------------------------------------------- |
| `/`                   | GET          | None              | Landing                                                                                 |
| `/(auth)/sign-in`     | GET          | None              | Better Auth email/password + demo sign-in                                               |
| `/(auth)/sign-up`     | GET          | None              | Better Auth email/password                                                              |
| `/api/auth/*`         | GET/POST     | Better Auth       | Better Auth handler                                                                     |
| `/api/demo`           | POST         | None              | Creates/signs into the shared demo account                                              |
| `/(main)/dashboard`   | GET          | Session           | Accounts, transactions, budget                                                          |
| `/(main)/account`     | GET          | Session           | Create/manage accounts                                                                  |
| `/(main)/transaction` | GET          | Session           | Create/view transactions                                                                |
| `/api/transactions`   | GET          | Session           | Date-range export, JSON or CSV; `transactionExportSchema`                               |
| `/api/health`         | GET          | None              | Liveness: DB ping via lib/health; 200 up, 503 down; builds dynamic                      |
| `/api/inngest`        | GET/POST/PUT | Inngest signature | 4 functions; not connected                                                              |
| `/robots.txt`         | GET          | None              | `app/robots.ts`; allows `/`, disallows `/api/` + per-user routes, points at the sitemap |
| `/sitemap.xml`        | GET          | None              | `app/sitemap.ts`; `lib/site.ts` `publicRoutes` only                                     |
| `/opengraph-image`    | GET          | None              | 1200x630 png via `next/og`; static                                                      |
| `/twitter-image`      | GET          | None              | Same card as `og:image`; separate file convention                                       |
| `/icon/{32,192,512}`  | GET          | None              | Brand mark pngs; static                                                                 |
| `/apple-icon`         | GET          | None              | 180px brand mark; static                                                                |
| `/llms.txt`           | GET          | None              | `public/llms.txt`; static                                                               |

**Planned, absent:** transaction export, budget-alert email delivery (written, never sent), recurring processing against a real DB.

**Measured end to end (2026-10-16):** receipt OCR runs, fills the form. `scanReceipt` (`actions/transaction.ts:27`) sends to `gemini-3.1-flash-lite` (`RECEIPT_MODEL`, `:24`); `scan-receipt.tsx` renders inside the form (`add-transaction-form.tsx:160`, non-edit). One 1.6 MB upload → HTTP 200 in ~4s, `{amount: 19.56, date, category: "groceries", ...}`, form filled, 0 console errors. Two fixes needed: retired model name (`gemini-2.5-flash` 404s against this key though `GET /v1beta/models/gemini-2.5-flash` returns 200), and `categories-form.tsx` used `defaultValue` (read once, so a post-mount category never reached the trigger) — now controlled `value={category ?? null}` + `items`. `receiptUrl` still never written.

## Background work

- **Inngest webhook:** `app/api/inngest/route.ts` serves the 4 functions. Per-event processor mutates `account.balance` inside `db.$transaction` (live money-path code) — but nothing invoked: no Inngest account configured (`INNGEST_EVENT_KEY`/`INNGEST_SIGNING_KEY` unset).
- **Prod consumer:** Inngest cloud (not enabled). **Gaps:** no function executed; no cleanup jobs.

## Pages and caching

Per `pnpm build` (measured 2026-10-16, Next 16.4.1, Cache Components on):

- `/`, `/_not-found` — `○` static.
- `/dashboard`, `/account/[id]`, `/transaction/create`, `/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]` — `◐` partial prerender. The three ledger pages `export const instant = false` (read ledger per request).
- `/api/inngest`, `/api/receipts`, `/api/transactions` — `ƒ` dynamic.

`new Date()` in a synchronous page-shell component logs `blocking-prerender-current-time` and error-boundaries that section even with `instant = false`; `dashboard/page.tsx` awaits `connection()` before formatting the month label.

No `no-store`/`revalidate` export anywhere; no `revalidateTag`; `revalidatePath()` at 9 sites across 4 action files. Cache settings do not provide route authorization; session checks are in `proxy.ts` and `actions/lib/checkUser.ts`.

## Verification

```bash
pnpm typecheck        # exit 0 — tsc --noEmit (TS 7.0.2)
pnpm test             # exit 0 — 107 passed (12 files); passes with and without TZ=UTC
pnpm lint             # exit 0 — vp check: format + lint 0 errors / 6 no-unused-vars warnings (129 files)
pnpm verify           # exit 0 — test → typecheck → lint → build, the chain the pipeline gates on
pnpm build            # exit 0 — compiles, "Running TypeScript ...", 13 routes (/api/health dynamic)
pnpm db:seed          # deletes every transaction/budget/account row, re-seeds each users row
/usr/bin/curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/dashboard                    # signed-out request redirects to /sign-in
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
