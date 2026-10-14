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
- **Two flags stay off on purpose; Plan B flips them:** `noImplicitAny: false` and `useUnknownInCatchVariables: false`. With `noImplicitAny` off, an unannotated parameter or destructured prop is silently `any`, so untyped boundaries hide errors instead of reporting them; the 15 catch bindings (14 `catch (error)` plus `catch (parseError)` at `actions/transaction.ts:67`) keep `error` as `any`. The 16th block is binding-less and load-bearing: `actions/accounts.ts:62`'s `catch {}` swallows the error and returns `undefined`, which is what lets `app/(main)/account/[id]/page.tsx:37`'s `if (!accountData) return notFound();` fire. Plan B's budget for flipping them is measured, not remembered: `globalThis.prisma` at `lib/prisma.ts:9` is the **one accepted implicit `any`** the migration signed off, so it is the named exception the flip has to keep or fix. And `grep -rn --include='*.ts' --include='*.tsx' --exclude-dir=node_modules --exclude-dir=.delta --exclude-dir=docs error.message .` prints 10 sites, 7 of them reading a catch binding — `app/api/seed/route.ts:8`, `hooks/use-fetch.ts:28`, `actions/seed.ts:109`, `actions/dashboard.ts:62`, `actions/budget.ts:101`, `actions/accounts.ts:31`, `actions/accounts.ts:116` — which is exactly what `useUnknownInCatchVariables: true` rejects; the other 3 read `useFetch`'s `error` state, already typed `Error | null` at `hooks/use-fetch.ts:10`. The third member of the family is `actions/accounts.ts:160`'s `where.type = typeFilter as TransactionType`: a cast that silences the compiler about a URL string, so it is a strictness gap rather than a data bug, and it is in this bullet rather than in the schema section because that is what it is.
- Gates: `pnpm typecheck` (`next typegen && tsc --noEmit`) reports **0 errors**, and because `next.config.mjs` no longer carries the `typescript.ignoreBuildErrors` key, `pnpm build` runs the same check — it prints `Running TypeScript ...` / `Finished TypeScript in ~1.9s` instead of `Skipping validation of types`. The build is a real type gate as of Plan A Task 12.
- Known structural gap the flags leave open: `lib/serialized-transaction.ts` takes an unannotated parameter, so its return is `any`, so every serialized account/transaction row in `actions/**` and `app/(main)/**` is `any` and the `Decimal`→number seam is unchecked by the compiler. Typing it can only add errors or be neutral, so it is deferred to Plan B alongside the `parseInput` boundary decision.
- Type-checking still proves nothing about runtime: the money path has never executed here (no `DATABASE_URL`).

### Framework rules

**Next.js 16.4.0 breaking changes from training data:**
- App Router is the standard (not Pages Router). All routes are in `app/`.
- Server Components are default; add `'use client'` to use browser APIs, hooks, or interactivity.
- API routes: `app/api/[...]/route.ts` exports `GET`, `POST`, etc. as named exports (not default export).
- Root middleware file is **`proxy.ts`**, not `middleware.js` (Next 16 renamed the convention; Plan A Task 4 also converted it to TypeScript). Auth is layered: ArcJet first, then Clerk, via `createMiddleware(aj, clerk)`. `proxy.ts` is the only thing that redirects a session-less request; `lib/checkUser.ts` provisions the row and answers `null`.
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
- **Gate:** `actions/lib/checkUser.ts` throws and is what a new server action calls. `lib/checkUser.ts` resolves-or-creates the `users` row and returns `null` — the two page-side callers discard it — so it is provisioning, not a gate. Nothing calls either on a route handler; `proxy.ts` is what keeps anonymous traffic out of a page.

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
  checkUser.ts          — Resolves the Clerk session to a users row, creating it on first sight; returns null, never redirects
  inngest/              — Inngest client + 4 functions (budget alert cron, recurring trigger cron, per-event recurring processor, monthly report cron)
  prisma.ts             — Prisma singleton (Prisma 7: must pass the pg driver adapter)
  schema.ts             — Validation schemas (Zod)
  serialized-transaction.ts — Decimal→number row serializer (implicit-`any` boundary; see Language strictness)
  utils.ts              — Misc utilities (cn)
tests/                  — Vitest unit tier: tests/{feature}/unit/*.test.ts, tests/README.md for tiers
  platform/fixtures/    — agents-md-skeleton.txt: the vendored template heading skeleton the checker compares
                          AGENTS.md against on every pnpm test (CI gate 2); it changes only via
                          pnpm skeleton:refresh, never by hand
  platform/scripts/     — refresh-skeleton.mjs: regenerates that fixture from the sibling template checkout
specs/                  — Feature specs: one file per deliverable unit, plus the template and index that
                          § FEATURE SPECS points at. Which files are there is not listed here on purpose —
                          this tree is unpolicied (a fence hides it from the citation assertion, see Rule 13's
                          body), so an enumeration would be the stale copy a new spec never updates.
docs/agent-guide/       — the bodies AGENTS.md's stubs point at: one file per section, in the read order
                          its README.md states. Policed by the same slot and citation assertions as AGENTS.md, so a
                          dangling path here fails a push; the fenced tree this line sits in is the exception
                          (Rule 13's body)
docs/standing-rules/    — the bodies behind STANDING RULES 11–17: one file per rule, indexed by its README.md,
                          policed the same way. AGENTS.md keeps each heading and its one constraining fact
docs/superpowers/       — plans/ and specs/ for conversion and migration units: Plan A's and this instruction layer's
                          own design docs and plans live here, not under specs/ (see § FEATURE SPECS)
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
.env.example            — Committed name inventory, values empty (STANDING RULES §6); each name cites its read site
.github/workflows/ci.yml — CI: install + gates 1–3, no lint, no secrets (see Rule 13)
```

Protected paths: the seven in STANDING RULES §17 — one authority; this line defers to it.

### Testing

**Current status:** Vitest exists and `pnpm test` (which is `TZ=UTC vitest run`) is green across the `tests/money`, `tests/validation` and `tests/platform` tiers; the baseline totals live in `docs/standing-rules/13-verification-gates.md` gate 2 and `docs/agent-guide/service-architecture.md` § Verification — the only two places that state suite totals, and neither is here. Most of the suite is characterisation — it pins what the code does today, including two known defects, so a green run is not an endorsement of that behaviour. The instruction-layer checker in `tests/platform/unit/` is the exception: it reads this repo's own guidance files off disk — `AGENTS.md`, this directory, `docs/standing-rules/`, `.claude/skills/`, `.env.example` and the heading fixture — and asserts they agree, so it pins no application behaviour and needs no database.

- `tests/money/unit/serialize-amount.test.ts` (6) — `serializeAmount` / `serializeTransaction` on `Decimal`-shaped stubs. Pins the shallow-spread contract, i.e. **a nested `Decimal` stays a `Decimal`** and crosses the server/client boundary unconverted.
- `tests/money/unit/calculate-next-recurring.test.ts` (4) — the four intervals plus month-end/leap carry (`2026-01-31` + 1 month → `2026-03-03`), recorded as-is.
- `tests/validation/unit/schemas.test.ts` (9) — `accountSchema`, `transactionSchema`, the `isRecurring`/`recurringInterval` `superRefine` rule. Pins the fact that both money fields are `z.string().min(1)` today — no numeric format rule, no coercion — so **a non-numeric amount or balance validates** (`lib/schema.ts:6`, `:12`). That is the hole Plan B's `parseInput` closes.
- `TZ=UTC` is part of the script, not a suggestion: the recurrence tests are timezone-sensitive and fail under other local zones.
- Nothing is mocked, because nothing needs mocking at the unit tier. No integration or e2e tier exists: `hooks/use-fetch.ts` has no test — that would need the `jsdom` and `@testing-library/react` devDependencies, which are **not installed** (an open question, not a decision).
- Server actions still have zero coverage: they need Postgres credentials that this environment does not have.
- `tests/platform/unit/instruction-layer.test.ts` checks `AGENTS.md`, the bodies in this directory, the skills and
  `.env.example` — not the app. A green
  `pnpm test` therefore proves the instruction layer is self-consistent; it proves nothing about runtime
  behaviour, which still has no coverage.
- Vitest rather than `node:test`, decided 2026-10-12: `node:test` needs Node 22 or newer for type stripping and
  does not resolve the `@/` alias this repo's imports use.

Structure for tests that come later (`/testing` skill):
- `tests/{feature}/{tier}/` — unit tier is the only one populated
- Mock at boundary: Prisma, Clerk, Resend, Inngest
- Every route test covers 401 (no auth), 403 (ownership), 400 (bad input)
- Imports already resolve through the `@/` alias; `vitest.config.ts` maps it to the repo root

---

