## Code Standards

### General

- Names: camelCase vars/functions, PascalCase components/types.
- Modules: one export per file unless a barrel. No star exports.
- Imports: `@/*` alias (tsconfig `paths`, no `baseUrl`); relative only for same-dir siblings.
- `'use client'` explicit; Server Components carry no directive.

### Language strictness

TS 5.9.3 (`^5`). All source `.ts`/`.tsx`, but `allowJs: true` — a `.js` added later ships unchecked.

- `tsconfig.json`: `strict`, `noEmit`, `incremental`, `skipLibCheck`, `isolatedModules`, `esModuleInterop`, `resolveJsonModule`, `allowJs`, `moduleResolution: bundler`, `jsx: react-jsx`, `target: ES2017`, `allowImportingTsExtensions`, `@/*`. No `baseUrl`. `include`: whole tree + Next generated types; `exclude`: `node_modules`.
- **Two flags off on purpose:** `noImplicitAny: false` (unannotated params/destructured props silently `any`), `useUnknownInCatchVariables: false`. Binding-less `catch {}` at `actions/accounts.ts:52` is load-bearing — swallows the error so `app/(main)/account/[id]/page.tsx:45` `if (!accountData) return notFound()` fires. `globalThis.prisma` (`lib/prisma.ts:9`) is the one accepted implicit `any`.
- `error.message` reads: 5 sites, none a catch binding — `actions/lib/errors.ts:2` + `scripts/seed-demo.ts:607` behind `instanceof Error`, and `account-row.tsx:53`, `budget-progress.tsx:59`, `create-account-drawer.tsx:69` read `useFetch`'s `Error | null` state (`hooks/use-fetch.ts:12`). Action layer converts via `toErrorMessage` (`actions/lib/errors.ts`).
- `actions/accounts.ts:131` casts `where.type = typeFilter as TransactionType` — strictness gap, not a data bug.
- `lib/serialized-transaction.ts:9-11` — generic over row (`T` + structural `DecimalLike`), returns `Omit<T,"balance"|"amount"> & {balance:number; amount:number}`. The untyped half is destructured props / unannotated params (`noImplicitAny: false`).
- Types never prove runtime. Runtime proof is local + read-only: `pnpm db:seed` wrote the demo ledger, `curl` of `/dashboard` + `/account/[id]` returned seeded figures. No browser click, no Inngest fire, no DB test tier.

### Framework rules — Next.js 16 (breaking vs training data)

- App Router only; routes in `app/`. Server Components default; `'use client'` for browser APIs/hooks/interactivity.
- API routes: `route.ts` named exports (`GET`, `POST`), not default.
- Root hook file is **`proxy.ts`** (not `middleware.js`), TS. It validates Better Auth sessions for guarded paths via `neonAuth.api.getSession()`; route decisions live in `lib/route-guard.ts`.
- Turbopack default dev+build. `next lint` removed upstream; no `eslint.config.mjs`, no `pnpm lint` — config lives in `vite.config.ts`.
- `params`/`searchParams`/`cookies()`/`headers()` are async-only. `revalidateTag()` needs a second `cacheLife` arg; repo uses `revalidatePath`.
- Config is `next.config.ts`: `cacheComponents: true`, `partialPrefetching: true`, server-action body limit `5mb`, `@tailwindcss/turbopack` for `*.css`. No `eslint`/`typescript` key → `next build` type-checks the whole tree.

Read `node_modules/next/dist/docs/` before touching server-component boundaries.

### Error handling

- Server Component throw → generic error boundary ("Something went wrong.").
- API route throw → `{ status: 5xx, body: {} }` — never leak `error.message`.
- Server Action catch → `{ error: "Generic message" }` to the form.
- No try-catch in business logic; let errors bubble to boundary/middleware.

### HTTP handlers

`app/api/seed/route.ts:GET` is the only hand-written handler, canonical shape:

```typescript
import { seedTransactions } from "@/actions/seed";

export async function GET() {
  try {
    const result = await seedTransactions();
    return Response.json(result);
  } catch (error) {
    return Response.json({ success: false, error: error.message });
  }
}
```

Two real unfixed deviations: unauthenticated `GET` that writes rows; failure path returns 200 with `error.message`. Gating is a deferred security item.

- **Status precedence:** 400 (bad input) → 401 (no auth) → 403 (forbidden) → 500 (server).
- **Failure:** JSON `{ error: "message" }`, real HTTP status.
- **Cache headers:** none set; Next defaults (ISR).
- **Success shapes:** vary; no envelope.

### Data access

- Reads via Prisma client (`lib/prisma.ts`), scoped to the session user. No privileged/admin bypass.
- **Gate:** `proxy.ts` validates sessions on guarded page paths; `app/(main)/layout.tsx` redirects signed-out visitors. New server actions call `actions/lib/checkUser.ts`; protected API routes call the same seam. Demo is an explicit sign-in via `/api/demo`.

### State management

State with more than one status is a reducer: a pure `(state, event) => state` in `lib/`, plus named states/events. The hook/action only dispatches or persists; no derived booleans that can contradict. `useReducer` + a plain function cover it — no state library (a library is a new-dependency decision).

- **Async client state — built.** `lib/async-state.ts`: `idle → loading → success | error` via `START`/`SUCCESS`/`ERROR`/`SET_DATA`. `hooks/use-fetch.ts` wraps it, keeps `{ data, loading, error, fn, setData }`, call sites unchanged. Test: `tests/hooks/unit/use-fetch-reducer.test.ts`.
- **Table UI state — built.** `lib/transaction-table-state.ts`: selection/search/filters/dialog via `TOGGLE_SELECT`/`SET_SELECT_ALL`/`SET_*`/`CLEAR_*`/`SET_DELETE_DIALOG`. `transaction-table.tsx` uses it. Test: `tests/transactions/unit/transaction-table-state.test.ts`.
- **Recurring lifecycle — built.** `lib/recurring-lifecycle.ts`: `recurringPhase` (`due`/`scheduled`) + `applyRecurringTick` (stamps `lastProcessed`, rolls `nextRecurringDate`). `lib/inngest/functions.ts` calls both. Test: `tests/recurring/unit/recurring-lifecycle.test.ts`.
- **Build pipeline — built.** `lib/pipeline-state.ts`: `planned → designed → decomposed → building → verified → reviewed` via `PLAN_WRITTEN`/`DESIGN_WRITTEN`/`TICKETS_WRITTEN`/`BUILD_STARTED`/`VERIFY_*`/`REVIEW_*`/`SOURCE_EDITED`/`NEXT_INCREMENT`. `canEditSource`, `canCommit`, `commitBlocker`, `stageBlocker`. Guards in `lib/pipeline-guard.ts` (path class, edit, commit), artifact parsing in `lib/pipeline-artifacts.ts`, I/O in `lib/pipeline-runtime.ts`. Adapters: `.opencode/plugins/pipeline.js` (OpenCode V2) and `scripts/pipeline-gate.ts` (Claude Code hooks). Neither is unit-tested — `tests/` is unit-only. Test: `tests/pipeline/unit/`.
- **Sign-in form — built.** `lib/auth-form-state.ts`: `idle → submitting | error` via `START`/`FAIL`, with `pending: "submit" | "demo"`. A `FAIL` whose `action` is no longer `pending` is dropped, so a double-fired request cannot relabel the button the user is using. `app/(auth)/sign-in/[[...sign-in]]/page.tsx` dispatches it and derives `busy` from `status`. Test: `tests/auth/unit/auth-form-state.test.ts`.
- **`transactions.status`** (`PENDING`/`COMPLETED`/`FAILED`) has no transition logic — defaults `COMPLETED`, only read as a filter. Modelling it would be invention; leave until a transition exists.

### File organization

```
app/
  (auth)/               — sign-in/up
  (main)/               — dashboard, accounts, transactions (session required)
  api/auth/[...route]/  — Better Auth endpoints
  api/demo/             — demo-account sign-in
  api/seed/             — dev seed (GET, unauth)
  api/inngest/          — job receiver (serves 4 functions)
  apple-icon.tsx        — 180px home-screen icon (apple-touch-icon)
  icon.tsx              — brand mark at 32/192/512 (favicon + search + tile)
  opengraph-image.tsx   — 1200x630 social card (og:image)
  twitter-image.tsx     — 1200x630 social card (twitter:image)
  robots.ts             — /robots.txt rules + sitemap pointer
  sitemap.ts            — /sitemap.xml from lib/site.ts publicRoutes
  layout.tsx globals.css page.tsx
actions/                — server actions (accounts, budget, dashboard, seed, send-email, transaction)
  lib/                  — checkUser.ts (identity seam), calculateRecurring.ts, errors.ts, serializedAmount.ts, index.ts
components/             — shared UI; ui/*.tsx = Base UI wrappers
  landing/ hero.tsx landing-flow.tsx
data/                   — categories.ts, landing.tsx
emails/                 — template.tsx (React Email; preview CLI unrunnable)
hooks/                  — use-fetch.ts (reducer wrapper for server actions)
lib/
  arcjet.ts             — Arcjet tokenBucket (proxy client commented out)
  async-state.ts        — idle/loading/success/error machine
  auth-form-state.ts    — sign-in idle/submitting/error machine (pure)
  brand-mark.tsx        — brand glyph as next/og primitives (icon + social cards)
  neon-auth.ts          — Better Auth configuration backed by Prisma
  route-guard.ts        — guarded paths + session route decisions
  demo.ts               — demo account and ledger provisioning
  health.ts             — liveness seam behind /api/health
  og-card.tsx           — shared 1200x630 social card body
  site.ts               — public origin + name/description; metadataBase source
  inngest/              — client + 4 functions
  money.ts              — usd/signedUsd (grouping, decimals, sign)
  pipeline-artifacts.ts — spec/review/verify-output parsing (pure)
  pipeline-guard.ts     — path class + edit/commit decisions (pure)
  pipeline-runtime.ts   — pipeline state on disk + git facts + stage checks (I/O; harness adapters call it)
  pipeline-state.ts     — build-pipeline stage machine (pure)
  prisma.ts             — Prisma singleton (pg adapter)
  recurring-lifecycle.ts— due/scheduled phase + tick
  schema.ts             — Zod schemas
  serialized-transaction.ts — Decimal→number row serializer
  transaction-table-state.ts — table reducer
  utils.ts              — cn
tests/                  — auth, hooks, money, pipeline, recurring, transactions, validation under {feature}/unit/; no runner beyond vp
  platform/             — DELETED (instruction-layer checker); not in tree
scripts/                — pipeline-gate.ts (Claude Code hook CLI); seed-demo.ts
.opencode/              — plugins/pipeline.js (V2 gate enforcer); pipeline-state.json gitignored
.claude/                — commands/ (shared stage prompt bodies), agents/reviewer.md, settings.json (hooks + permissions)
CLAUDE.md               — harness entry; imports AGENTS.md
opencode.json           — permission ladder + reviewer subagent
specs/                  — feature specs + .design.md/.review.md siblings (unpolicied fence)
docs/agent-guide/       — these bodies
docs/superpowers/       — deleted
tsconfig.json  next-env.d.ts  next.config.ts  vite.config.ts
prisma/                 — schema.prisma + migrations/
prisma.config.ts        — CLI datasource (DIRECT_URL else DATABASE_URL)
scripts/                — seed-demo.ts (db:seed) — destructive
proxy.ts                — root hook (Better Auth session validation + redirects)
public/  .env.local  .env.example
```

Protected paths: none defined in `AGENTS.md`.

### Testing

Runner: **Vitest 5.0.4 via Vite+** — no `vitest.config.ts`, no `test` script; `vite.config.ts` sets `test.include: ["tests/**/*.test.ts"]`, `test.environment: "node"`; run `./node_modules/.bin/vp test`. Totals → `service-architecture.md` Verification.

- Files: `tests/money/unit/serialize-amount.test.ts` (shallow-spread contract — nested `Decimal` stays `Decimal` across the boundary), `tests/money/unit/calculate-next-recurring.test.ts` (4 intervals + month-end/leap carry `2026-01-31`+1mo → `2026-03-03`), `tests/validation/unit/schemas.test.ts` (both money fields are `z.string().min(1)` — no numeric rule, so a non-numeric amount validates; Plan B `parseInput` closes this), `tests/hooks/unit/use-fetch-reducer.test.ts`, `tests/transactions/unit/transaction-table-state.test.ts`, `tests/recurring/unit/recurring-lifecycle.test.ts`.
- `TZ=UTC` was part of a deleted `test` script; `vp test` sets no zone. Recurrence test passed in local zone and under `TZ=UTC` (measured 2026-10-16) — pin the zone if you depend on it.
- Nothing mocked (unit tier needs none). No integration/e2e. `hooks/use-fetch.ts` wrapper has no render test — needs `jsdom` + `@testing-library/react`, not installed.
- Server actions: zero coverage; no runner and no decision on which DB a test may touch (`DATABASE_URL` resolves, `scripts/seed-demo.ts` writes through it).
- `tests/platform/` gone → nothing asserts docs/`AGENTS.md`/skills/`.env.example` agree; a green `vp test` only pins the characterisation files.
- Vitest over `node:test` decided 2026-10-12 (`node:test` didn't resolve `@/*`).

Structure for later (`/testing` skill): `tests/{feature}/{tier}/`; mock at boundary (Prisma, Better Auth, Resend, Inngest); every route test covers 401/403/400; imports via `@/*`.
