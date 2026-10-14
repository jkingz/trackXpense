<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# AGENT-READY PROJECT INSTRUCTION LAYER

This file is the instruction layer's **contract**: the standing rules, a stub for every section, and the two sections kept whole. Rules 1–10 are here in full; the bodies the other stubs point at live in `docs/agent-guide/` — and for Rules 11–17 in `docs/standing-rules/` — and `docs/agent-guide/README.md`'s order is the read order. **Read STANDING RULES before every task.** Then read APPLICATION BUILDING CONTEXT in order when making architectural decisions. SERVICE ARCHITECTURE describes what is built; TARGET STATE describes what is not.

**Health check (fills slots, zero hits means done; `pnpm check:docs` runs the same check over `docs/agent-guide/` and `docs/standing-rules/`):**
```bash
grep -n '<[a-zA-Z_/]' AGENTS.md
```

---

# STANDING RULES — Read first, before any task

Constraints that apply to every change. Read Rules 1–10 **in full** before every taskable request; read the Rule 11–17 body your change touches. Skip nothing.

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

## Project-specific rules — Fill these slots day one

Rules 11–17 are this repo's own facts. Each heading keeps the one fact that constrains work; the evidence for it is
the body in `docs/standing-rules/`, whose index is in rule order. Read the body your change touches.

### 11. Package manager and runtime
`pnpm` is whatever the host resolves — `package.json` carries no `packageManager` field — and the Node floor is declared in `engines.node` but enforced by nothing, so measure both before trusting a gate. → `docs/standing-rules/11-package-manager-and-runtime.md`

### 12. Framework version drift
Next 16 renamed the root middleware file to `proxy.ts`, removed `next lint`, made the request-time APIs async, and type-checks inside `next build`; `node_modules/next/dist/docs/` is the authority, not training data. → `docs/standing-rules/12-framework-version-drift.md`

### 13. Verification gates
Five gates in order — typecheck, test, build, lint at "the census does not grow", then manual smoke where credentials allow — and CI runs only the first three. The baselines, what each gate does not prove, and what the checker cannot see are in `docs/standing-rules/13-verification-gates.md`.

### 14. Application building order
`STANDING RULES` → overview → architecture → UI → code standards → workflow → PM conventions → SERVICE ARCHITECTURE; the section bodies are `docs/agent-guide/README.md`'s order. → `docs/standing-rules/14-application-building-order.md`

### 15. Cross-cutting authority — one authority per rule, enforced once
`proxy.ts` keeps anonymous traffic out of a route, `actions/lib/checkUser.ts` is the only gate that throws inside a server action, `lib/prisma.ts` is the only Prisma client, and `lib/schema.ts` runs client-side only. → `docs/standing-rules/15-cross-cutting-authority.md`

### 16. Datastore / external service
Prisma 7: `postinstall` generates but never migrates, the CLI's URL comes from `prisma.config.ts`, and every variable name is inventoried in `.env.example`. → `docs/standing-rules/16-datastore-and-external-service.md`

### 17. Protected foundations
`lib/checkUser.ts`, `actions/lib/checkUser.ts`, `lib/prisma.ts`, `prisma/schema.prisma`, `tsconfig.json` and the Clerk pages in `app/(auth)/` carry the auth gate, the data shape and the type contract. → `docs/standing-rules/17-protected-foundations.md`

---

# APPLICATION BUILDING CONTEXT

Read these sections in the order `STANDING RULES` §14 gives; the bodies live in `docs/agent-guide/`, and that directory's index is the read order. Update the body your change invalidates — and `docs/agent-guide/target-state.md` if the change lands design intent — before continuing. This file keeps the contract, the stubs below, `### Status`, `## Repo skills` and `# FEATURE SPECS`.

## Project Overview

What the app is, what is in scope, and what is still an open product question → `docs/agent-guide/overview.md`

### Status

**Built** — User sign-up/sign-in (Clerk), dashboard page, account creation, transaction logging, budget tracking
UI; the whole tree in TypeScript under `strict` (Plan A); the agent instruction layer, its repo skills, and the
instruction-layer checker in `tests/platform/unit/`.

**Not built** — Recurring transaction processing run against a database, delivered email alerts, receipt upload,
transaction export, analytics, multi-user sharing, mobile app. Each is a bullet in TARGET STATE.

**Next unit** — Plan B: the server-side `parseInput` boundary, then the two strict-flag flips. STANDING
RULES → Rule 13's body, gate 5, lists what cannot be verified until credentials exist.

Verified: 2026-10-13, against the working tree on `feat/ts-zod-plan-a-bridge`. `git log --oneline` is the
authority on what shipped and when; this file does not duplicate it.

### Overview

TrackXpense is a personal finance dashboard: sign in with Clerk, create accounts (CURRENT/SAVINGS), log income and expense, track a budget, see the result on the dashboard.

### Goals

Multiple accounts tracked live, budgets that surface a warning near the limit, a searchable and categorized transaction history.

### Core user flow

Sign up → dashboard → create account → log transaction → balance updates → dashboard metrics. Four steps, each of which is a module in SERVICE ARCHITECTURE.

### Scope

In: auth, multiple accounts per user, transaction logging, budget alerts, dashboard. Out: recurring processing against a database, delivered email, receipt **storage** (the OCR half is built and reachable), multi-user sharing, mobile.

### Success criteria

Dashboard under 1s after auth, a transaction reflected on the balance within the session, signup-to-transaction under 2 minutes. None of the three has been measured here — no `DATABASE_URL`.

### Open product questions

Recurring cadence (auto-create the next occurrence or only on trigger), alert channel (email, in-app toast, or both), currency (USD-only MVP or multi-currency). Unanswered; do not code an assumption as a decision.

## Architecture Context

Stack, boundaries, storage and persistence, auth and tenancy, HTTP surface, background work, invariants → `docs/agent-guide/architecture.md`

### Stack

Next.js 16.4.0 (Turbopack for dev and build), React 19.3, Tailwind 4.3.3 + Radix, TypeScript 5.9.3, Prisma 7.10 over `@prisma/adapter-pg`, Clerk 7, Zod 4 + React Hook Form, Vitest 5 (unit tier), Inngest, Resend, Arcjet, ESLint 9 flat config. Exact versions and what each was verified against are in the body.

### System boundaries

Browser → Clerk → App Router (protected `app/(main)/` layout, `app/(auth)/`, `app/api/` for `/seed` and `/inngest`) → Prisma → PostgreSQL → Clerk Admin, Inngest, Resend. The ASCII diagram is in the body, inside a fence.

### Storage model

`Account.balance` is mutated on every transaction — there is no append-only log, so the current balance is the source of truth. `type` decides add or subtract; `isRecurring`, `recurringInterval` and `nextRecurringDate` are written but never applied automatically; one budget per user with `lastAlertSent` to stop spam.

### Persistence schema

Four tables — `users`, `accounts`, `transactions`, `budgets` — with the columns, enums, decimals and cascade FKs listed in the body. `prisma/schema.prisma` stays the single source of truth (§17), so the body is a description, never the definition.

### Auth & tenancy model

Identity is the Clerk session JWT; ownership is `userId`-scoped on every read, with no privileged bypass. "Is this user logged in?" has two implementations with different failure contracts — `lib/checkUser.ts` answers `null`, `actions/lib/checkUser.ts` throws — and neither of them protects a route: `proxy.ts` does. Plan B §2c consolidates them.

### HTTP surface — implemented

Six pages and two API routes exist; `/api/seed` is an unauthenticated `GET` that writes rows, `/api/inngest` serves functions that have never run. `next build` reports every route dynamic, so nothing here is prerendered.

### HTTP surface — planned, not built

`GET /api/transactions` (CSV export), `POST /api/budget/alert`, `PATCH /api/transactions/:id/recurring`, `DELETE /api/transactions/:id`. Four endpoints, none of them in the tree.

### Background work

Four Inngest functions are written and served (budget-alert cron, recurring-trigger cron, per-event processor, monthly-report cron); none has executed against a database here, so no cleanup job and no schedule exists in practice.

### Invariants

`balance = SUM(transactions)` is enforced by nothing — no trigger, no audit table, no test. `createTransaction` reads the balance outside `db.$transaction` and writes an absolute number, so concurrent inserts can lose an update; `updateTransaction` debits only the destination account, so moving a transaction between accounts leaves the source untouched; and the form hands `createTransaction` a string amount, which the INCOME branch concatenates. All of it is Plan B's.

## UI Context

Design tokens, per-component conventions, styling rules, images and icons → `docs/agent-guide/ui.md`

### Design tokens

Tailwind 4.3.3 defaults, no custom overrides in `app/globals.css`; the named utilities in use (`bg-surface*`, `text-text-*`, `border-border-base`, `rounded-*`, `shadow-*`) are listed in the body.

### Per-component conventions

Server Components by default, Client Components only for interactivity. Every file is `.ts`/`.tsx`, but props are annotated only where a `tsc` diagnostic demanded it (Plan A's rule) — the dashboard and transaction components Tasks 9–10 left alone still have inferred props, and rows through `serializeTransaction` are `any`.

### Styling rules

Tailwind utilities only. Forbidden: `style={}`, inline `#hex`, raw pixel values, magic numbers. Radix for dialog/dropdown/tooltip state.

### Images / assets

`next/image` is required; the only remote pattern is `randomuser.me`. AVIF/WebP preferred per `next.config.mjs`; Lucide for icons, no committed SVG.

## Code Standards

Naming, imports, language strictness, framework rules, errors, HTTP handlers, data access, file organization, testing → `docs/agent-guide/code-standards.md`

### General

camelCase for variables and functions, PascalCase for components and types, one export per file, `@/*` absolute imports except for same-directory siblings, explicit `'use client'` and no directive in Server Components.

### Language strictness

`noImplicitAny: false` and `useUnknownInCatchVariables: false` stay off until Plan B's measured budget, so an unannotated parameter or destructured prop is silently `any` and every catch binding is unchecked. The inventory that sizes that flip — the accepted implicit `any`, the `error.message` sites, the one silenced filter — is in `docs/agent-guide/code-standards.md` § Language strictness.

### Framework rules

Next 16 drifts that bite: App Router only, `proxy.ts` instead of the old middleware name, `params`/`searchParams`/`cookies()`/`headers()` async-only, Turbopack for dev and build, `next lint` gone, `next build` type-checks since Plan A Task 12, and `next.config.mjs` rejects the `eslint` key and carries no `typescript` key. Read `node_modules/next/dist/docs/` before touching a server-component boundary.

### Error handling

Thrown errors surface as a generic toast through Sonner; API failures return the HTTP status with `{ error: "message" }` and never leak `error.message`; actions catch and return `{ error: string }`; no try/catch inside business logic.

### HTTP handlers

`app/api/seed/route.ts` is the only hand-written handler and the canonical shape — with two real, unfixed deviations: it is an unauthenticated `GET` that writes, and its failure path returns status 200 with `error.message` in the body. Status precedence 400 → 401 → 403 → 500.

### Data access

All reads and writes through the `lib/prisma.ts` singleton, scoped to the session `userId`; no admin path, no raw SQL. The `userId` comes from `actions/lib/checkUser.ts` inside an action (it throws) and from the row `lib/checkUser.ts` provisions on page render; keeping anonymous traffic out of a route is `proxy.ts`, not either function.

### File organization

The tree is in the body, fenced — and a fence hides it from the citation assertion, which is how it once went stale on `specs/` unnoticed. It names `docs/agent-guide/`, and an enumeration of `specs/` is deliberately absent for the same reason.

### Testing

Vitest, run as `TZ=UTC vitest run` — the `TZ` is load-bearing. Three tiers: `tests/money` and `tests/validation` characterise app behaviour (including two known defects, so green is not endorsement), `tests/platform` checks this instruction layer. Nothing opens a database, so no money-path invariant is covered; server actions and every page/route are uncovered. Per-file labels and the tier detail are in the body.

## Development Workflow — Portable core

Six-step loop: read what governs the change, state scope, smallest verifiable increment, verify with commands, update the docs the change made untrue, report. Full version in `/development-workflow` → `docs/agent-guide/workflow.md`

## Development Workflow — Project appendix

Read order, commands, where logic goes, framework drift, schema changes, seed data, the unit-exit checklist → `docs/agent-guide/workflow.md`

### Read order before implementing

`STANDING RULES` → overview → architecture → UI → code standards → workflow → PM conventions, then SERVICE ARCHITECTURE. Same order as §14; the bodies are read in `docs/agent-guide/README.md`'s order.

### Commands

`pnpm dev`, `typecheck`, `test`, `check:docs`, `build`, `lint`, `exec prisma …`, `email`. The table in the body states what each one actually proves here — `pnpm email` cannot run, `pnpm lint` exits 1 on the recorded census, and `pnpm dev` answers 403 without `ARCJET_KEY`, so there is nothing to view.

### Where logic goes

Auth in the two `checkUser` files and nowhere else; data through `lib/prisma.ts`; protected pages in `app/(main)/`; API routes in `app/api/`; schemas in `lib/schema.ts`; the request hook in `proxy.ts`.

### Framework version drift

The Next 16 list above plus Clerk 7: `getServerSession()` does not exist (use `auth()`), and the `SignedIn`, `SignedOut` and `Protect` components are removed — rendering them throws at runtime, not at build time, so use `Show` with a `when` prop.

### Schema changes

`postinstall` runs `prisma generate` only — migrations are never applied automatically. Add a column by editing `prisma/schema.prisma`, running `pnpm exec prisma migrate dev --name migration_name` with a snake_case description, and committing the generated file. Never edit an applied migration; the CLI's URL comes from `prisma.config.ts`.

### Data today

Dashboard data comes from `curl`ing `/api/seed` — a `GET`, unauthenticated, that writes rows. `actions/seed.ts` reads `ACCOUNT_ID` and `USER_ID` through `as string` assertions; neither var is in the documented inventory or in this machine's environment, so the whole seed path is unverified.

### Before moving to the next unit

The unit works end-to-end inside the scope stated at the start, no ARCHITECTURE CONTEXT invariant was violated, the spec in `specs/` reflects what actually happened, and the gate chain ran with the numbers it printed.

## PM Conventions

Commit prefixes, PR body contract, and the review gate as this repo applies it → `docs/agent-guide/pm-conventions.md`

### Commits (summary)

Conventional prefixes (`feat` `fix` `style` `perf` `refactor` `chore` `docs` `test` `build` `ci`), one logical change per commit, subject says why, body at most 4 lines. Commit only when asked (§7).

### PRs (summary)

Title `type(scope): imperative summary`; body = what changed, how it was verified, what is not covered. One PR per feature, no grab-bag PRs, draft until the gate is green; squash-merge small features, rebase-merge larger ones.

### Review gate

The Rule 13 chain: typecheck 0 errors, test green at the baseline in its body (`docs/standing-rules/13-verification-gates.md`), build (it type-checks, never lints), lint at "no new error class", manual smoke where credentials allow. The written deviation stays in `docs/agent-guide/pm-conventions.md`: CI has no lint step, so "CI runs the same commands" is not yet true here.

# SERVICE ARCHITECTURE — Implemented surface

Only code that exists, module by module; update the body in the same change that alters the surface, and move newly built items out of TARGET STATE. Body: `docs/agent-guide/service-architecture.md`

## Request path

Browser with a Clerk session → `proxy.ts` (Arcjet `shield`/`detectBot`, then Clerk, which redirects unauthenticated hits off its own route matcher) → the root layout's header calls `checkUser()`, which resolves-or-creates the `users` row and returns `null` instead of gating → page or action → Prisma queries scoped to `userId` → PostgreSQL. The fenced diagram is in the body.

## Modules

A per-module status table — implemented, implemented-but-never-executed, and what is missing from each. Anything not built gets no row; the table is in the body.

## Cross-cutting rules — one authority, enforced once

Auth gate: `proxy.ts` protects the routes; of the two `checkUser` functions only the action-side one throws, the page-side one provisions a row and answers `null` — consolidated by Plan B §2c, with 9 action sites still reading `auth()` inline. Database: the `lib/prisma.ts` singleton only, no raw SQL. Validation: `lib/schema.ts` runs client-side only through `zodResolver`, and every action trusts its arguments — server-side enforcement is Plan B's `parseInput`.

## HTTP surface (what actually exists)

Six pages and `/api/seed` plus `/api/inngest`. Receipt OCR is built and user-reachable but has never run (no `GEMINI_API_KEY`) and never stores a file — `receiptUrl` stays `null` on scanned transactions. The route table and the "planned and absent" list are in the body.

## Background work (jobs, workers, cron)

Four functions served at `/api/inngest`; the per-event processor mutates `account.balance` inside `db.$transaction`, so it is live money-path code that has never executed here.

## Pages and caching

Public landing plus the Clerk and protected pages, all dynamic; no `no-store` or `revalidate` export anywhere in the tree, and 9 `revalidatePath()` call sites across four action files. The per-page list is in the body.

## Verification

The command list with what each printed last time and the app-coverage statement are in `docs/agent-guide/service-architecture.md` § Verification. That heading and Rule 13's gate 2 (`docs/standing-rules/13-verification-gates.md`) are the only two homes for suite totals.

## Repo skills

`.claude/skills/` is the source of truth for project-specific guidance. Load them when the context applies:

- `/testing` — test structure and patterns; the unit tier exists, integration/e2e do not
- `/verification-gates` — the chain that must pass before work is complete; how to verify and report
- `/development-workflow` — the work loop, scoping rules, and requirements discipline
- `/git-workflow` — commit conventions, push discipline, and PR workflow
- `/babysitting-a-pr` (`.claude/skills/babysitting-a-pr/SKILL.md`) — STANDING RULES §8: recency gate, verify-before-fix, exit states
- `/leaving-pr-comment` (`.claude/skills/leaving-pr-comment/SKILL.md`) — STANDING RULES §8: comment triggers, body contract, mandatory AI-authorship disclaimer

---

# TARGET STATE — Not Yet Built

Design intent that has not landed, or has landed and never run — one bullet per item with what it blocks. Read `docs/agent-guide/target-state.md` before claiming any feature in it exists.

# VERIFICATION STANDARDS — Quality guardrails

Bad doc line → why it is wrong → the honest replacement, for every claim this repo's docs could overreach. Check a status sentence against the table in `docs/agent-guide/verification-standards.md` before writing it.

# FEATURE SPECS

Feature specifications live in `specs/`. One file per deliverable unit of work. See `specs/README.md` for
structure and `specs/00-template.md` for the template. Not every unit of work lands here: a conversion or
migration keeps its design doc under `docs/superpowers/specs/` and its plan under `docs/superpowers/plans/`, as
`.claude/skills/development-workflow.md:49` states, so `specs/` stays a feature-spec directory.

---

# EDITING THIS FILE

When each section earns a fact, the health check, and the one rule that orders everything → `docs/agent-guide/editing.md`

## When to fill sections

Rules 11–17 day one; overview through PM conventions one section per decision; SERVICE ARCHITECTURE after the first real commit, implemented code only; TARGET STATE whenever intent outpaces code; `specs/` one file per unit.

## Health check

`grep -n '<[a-zA-Z_/]' AGENTS.md`, quoted at the top of this file, and zero hits means the file describes only this project. Add no exemptions — reword the prose. `pnpm check:docs` runs the same check over every body in `docs/agent-guide/` and `docs/standing-rules/`; the rule, its scope across all three homes, and why the checker re-runs it are in `docs/agent-guide/editing.md`.

## One rule that organizes everything else

Code is the source of truth. When implementation and docs disagree, the doc is the defect; fix it in the same change.
