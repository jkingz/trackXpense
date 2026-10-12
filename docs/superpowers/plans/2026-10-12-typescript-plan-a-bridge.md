# TypeScript conversion — Plan A (bridge) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert all 79 JavaScript source files of trackXpense to TypeScript with no runtime-behaviour change except one forced bug fix, keeping a green gate at the end of every task.

**Architecture:** Characterisation tests pin the money-path leaves and the existing Zod schemas *before* the first rename, so any later regression is attributable. Files are then renamed in one atomic step and type-checker coverage lands as a final full `include`, with each
later task burning a measured **per-file error budget** (194 errors after Task 4) down to zero. An earlier draft
widened `include` directory-by-directory; §Correction explains why that cannot work.

**Tech Stack:** Next.js 16.4.0 (Turbopack, App Router), TypeScript 5.9.3, React 19.3.0, Vitest, Zod 4.6.6, Prisma 7.10.0, pnpm 10.6.5.

**Spec:** `docs/superpowers/specs/2026-10-12-typescript-zod-conversion-design.md` — implements Phase 0 and Phase 1. Plan B (Phase 2 Zod enforcement + Phase 3 UI tightening) is a separate plan.

## Global constraints

- Package manager is `pnpm@10.6.5` only (pinned in `package.json` `packageManager`). Node.js `>=20.9.0`.
- **No commits unless the user explicitly asks.** AGENTS.md STANDING RULES §7 overrides the per-task commit habit. Each task ends at a green gate instead; the commit subject is given for when the user asks.
- **No behaviour change.** Type-only annotations, `git mv`, and config edits. The one permitted exception is Task 4 Step 11 (a missing `await` that makes `tsc` impossible to pass) and it is called out there.
- Never edit `prisma/schema.prisma`, applied migrations, or `.env.local`. `lib/prisma.ts`, `lib/checkUser.ts`, `prisma.config.ts` are protected foundations: renamed and typed, never rewritten.
- Never print a secret. `.env.local` contains only `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`; `DATABASE_URL`, `DIRECT_URL`, `ARCJET_KEY`, `GEMINI_API_KEY`, `RESEND_API_KEY`, `INNGEST_EVENT_KEY` are all absent — so anything touching Postgres, Resend, ArcJet or Gemini stays runtime-unverified.
- Gate chain per task: `pnpm test` → `pnpm typecheck` → `pnpm build` → `pnpm lint`. **Exception, ruled before
  execution:** Tasks 1–3 gate on `pnpm test` + `pnpm build` + `pnpm lint` only. `typecheck` is
  `next typegen && tsc --noEmit` and there is no `tsconfig.json` until Task 4 Step 7, so `tsc` has no inputs
  and the step cannot pass. Tasks 1–3 must not run `next typegen` and must not create a TS config.
  **Amended after Task 4 ran (see §Correction):** from Task 4 the `include` is the final full set and the type
  gate is a per-file budget — the project total must strictly decrease and every file the task owns must reach
  0. `typescript.ignoreBuildErrors: true` is set in `next.config.mjs` for Tasks 4–11 so `pnpm build` still
  verifies bundling and module resolution; it is NOT a type gate in those tasks, and Task 12 removes it and
  fails if the key is still present.
- `pnpm lint` stays red. Measured census (2026-10-12, `eslint . -f json`): **94 errors** — 92 `import/order`,
  1 `react-hooks/set-state-in-effect`, 1 `react-hooks/static-components` — plus **3 warnings** (2
  `react-hooks/incompatible-library`, 1 `react-hooks/exhaustive-deps`). The gate is **this census must not
  grow**, per rule and per count, not "lint green" and not "no error outside `import/order`" (that wording was
  wrong: two non-`import/order` errors predate this plan).
  **Re-based at Task 5:** deleting the four dead `motion` modules (`animated-group`, `text-effect`,
  `progressive-blur`, `infinite-slider`) removed 7 errors and 1 warning. The baseline for Tasks 6–12 is now
  **87 errors** — 86 `import/order`, 1 `react-hooks/set-state-in-effect` — and **6 warnings**; still "must not
  grow", and `react-hooks/static-components` is gone with the file that carried it.
- **Task 5 measured the cascade the plan predicts.** Owning set `components/ui/**` went 23 errors → 0 and the
  project total went **184 → 105**, i.e. 79 errors disappeared, not 23: 6 with the deleted dead files and 56 at
  call sites in `app/**` (111 → 66), `components/create-account-drawer.tsx` (12 → 5) and
  `components/pagination.tsx` (10 → 6). So a task's budget paydown is normally **larger** than its owned count,
  and the "total must strictly decrease" rule is the one that catches regressions — a task that types a
  primitive too narrowly can add call-site errors, and Task 5 did add exactly one (`Select`'s now-typed
  `onValueChange` feeding a `string` into the `'CURRENT' | 'SAVINGS'` form field at
  `components/create-account-drawer.tsx:104`, owned by Task 6).
- Do not let `next dev`/`next build` create the TypeScript config. `tsconfig.json` and the `@types/*` devDependencies are written/installed explicitly in Tasks 1 and 4; otherwise Next mutates `package.json` outside this plan's control.

## Correction after Task 4 execution — the include ramp is VOID

Measured on the renamed tree (2026-10-12, `tsc --noEmit`, `strict: true`, `noImplicitAny: false`,
`useUnknownInCatchVariables: false`, `allowJs: false`): **194 errors**, not the 140 the probe predicted.

**`tsconfig.json`'s `include` cannot throttle the migration.** `include` only seeds *root* files; `tsc` then
follows the whole transitive import closure. Proof: with roots limited to `actions/ lib/ data/ hooks/ tests/
proxy.ts` — the narrow set this plan called "safe" — the run still reported 185 errors, including 18 in
`emails/template.tsx`, because an action imports the Inngest function module which imports the email template.
Nothing about the ramp works as designed, and no `exclude` list fixes it (excluding
`.next/types/validator.ts` and `.next/dev/types/validator.ts` moved the total from 194 to 194).

So Tasks 5–11 keep their subtree assignments and lose their `include` edits. The gate is now a **per-file error
budget**:

1. `pnpm typecheck` runs over the final full `include` from Task 4 onward. Its total must **strictly decrease**
   every task and reach **0** at Task 12.
2. Every task additionally requires **its own files** to report **0** errors. A task is not complete while a
   file it owns is still red, no matter what the project total does.
3. `next dev`, `next build` and `next typegen` re-serialise `tsconfig.json` (they re-add
   `plugins: [{ name: "next" }]` and `.next/dev/types/**/*.ts` on every run). That is expected and harmless;
   the migration-owned options — `allowJs: false`, `strict: true`, `noImplicitAny: false`,
   `useUnknownInCatchVariables: false` — survive it, verified in Task 4. Do not fight it and do not add
   `include` entries back per task.
4. `typescript.ignoreBuildErrors: true` is set in `next.config.mjs` **for Tasks 4–11 only**, so `pnpm build`
   keeps proving that the renames did not break module resolution, `'use client'` boundaries or bundling.
   During those tasks the build is NOT a type gate — `pnpm typecheck` is, and every report must say so.
   Task 12 Step 1 removes the flag and the tree must then be green under `pnpm build` too; Task 12 greps for
   the key and its presence is a failure.

Measured budget by directory (supersedes the subtree table in the probe section below; per-file detail lives in
each task):

| Area | Errors | Owned by |
|---|---|---|
| `app/(main)/**` — `account` 59, `transaction` 29, `dashboard` 22, layout 1 | 111 | Tasks 9, 10, 11 |
| `components/**` — `create-account-drawer` 12, `pagination` 10, `ui/text-effect` 5, `hero` 5, `ui/select` 4, `ui/pagination` 3, `ui/input` 3, `header` 3, `ui/sonner` 2, rest 6 | 53 | Tasks 5, 6, 7 |
| `emails/template.tsx` | 18 | Task 8 |
| `actions/**` — `accounts.ts` 4, `seed.ts` 1 | 5 | Task 4 |
| `tests/validation/unit/schemas.test.ts` | 5 | Task 4 |
| `app/page.tsx` 1, `app/not-found.tsx` 1 | 2 | Task 7 |
| `lib/`, `data/`, `hooks/`, `app/api/`, `proxy.ts` | 0 | already clean |

By rule: `TS2741` 90, `TS2339` 42, the remaining 62 spread over `TS2322`, `TS2345`, `TS2739`, `TS18048`,
`TS2362`/`TS2363`.

### Budget re-based after Task 5 (measured `pnpm typecheck`, 2026-10-12)

**69 errors remain**, and `TS2741`/`TS2739` are both at **0** — typing the primitives retired the whole
"props don't exist yet" class, including 18 errors in `app/(main)/account/_components/transaction-table.tsx`
that no later task could have fixed from its own file.

| Area | Errors | Owned by |
|---|---|---|
| `app/(main)/**` 39 — `account` 18 (`account-chart` 14, `transaction-table` 4), `transaction` 13 (`add-transaction-form` 12, `scan-receipt` 1), `dashboard` 8 (`page` 3, `transaction-overview` 2, `budget-progress` 2, `account-card` 1) | 39 | Tasks 9, 10, 11 |
| `components/**` outside `ui/` — `pagination` 6, `hero` 4, `create-account-drawer` 2 (incl. the `:104` TS2345 Task 5 left for Task 6) | 12 | Tasks 6, 7 |
| `emails/template.tsx` | 18 | Task 8 |
| `app/page.tsx`, `app/not-found.tsx`, `actions/**`, `tests/**`, `components/ui/**`, `lib/**`, `data/**`, `hooks/**`, `app/api/**`, `proxy.ts` | **0** | clean |

By rule: `TS2339` 32, `TS18046` 14, `TS2345` 10, `TS2322` 7, `TS2554` 2, `TS2363` 2, `TS2362` 2.
`hooks/useFetch` is not in this table but is Task 6's assignment.

### Budget re-based after Tasks 6, 7 and 8 (measured `pnpm typecheck`, 2026-10-12)

**35 errors remain**, tripwire `TS2741`/`TS2739` = 0. Task 7 turned out to be a **verified no-op** — its two
predicted errors were already paid by Tasks 5/6, `Footer()` and `HeroSection()` take no props, and all 11 files it
owns are in the checked set at 0 (`npx tsc --noEmit --listFilesOnly`). Task 8's file is now 0.

| File | Errors | Owned by |
|---|---|---|
| `app/(main)/account/_components/account-chart.tsx` | 14 | Task 11 |
| `app/(main)/transaction/_components/add-transaction-form.tsx` | 11 | Task 9 |
| `app/(main)/account/_components/transaction-table.tsx` | 4 | Task 11 |
| `app/(main)/dashboard/page.tsx` | 3 | Task 10 |
| `app/(main)/dashboard/_components/transaction-overview.tsx` | 2 | Task 10 |
| `app/(main)/transaction/_components/scan-receipt.tsx` | 1 | Task 9 |

Everything else in `include` — `actions/**`, `app/api/**`, `app/(auth)/**`, `app/{page,layout,not-found}.tsx`,
`components/**`, `data/**`, `emails/**`, `hooks/**`, `lib/**`, `proxy.ts`, `tests/**` — reports **0**.

Carried corrections the task briefs do not know about: Task 9 normalises the `useFetch` arity at
`add-transaction-form.tsx:70` and collapses the `onSubmit` if/else (statement-level, reported); Task 10 must add
**no** `(error as Error)` cast in `account-card.tsx`/`budget-progress.tsx` — `useFetch.error` is `Error | null`
since Task 6; Task 11 owns the `startTransition` narrowing plus deletion of the dead `{ scroll: false }` argument,
and is where the async `params`/`searchParams` typing pattern actually lands (Task 7 could not produce it).
Task 12 additionally owns: `styles … satisfies Record<string, React.CSSProperties>` in `emails/template.tsx:181`,
and correcting AGENTS.md's claim that `pnpm email` works (`@react-email/ui` is not installed; `email dev` blocks on
an interactive install prompt).

## The pre-execution probe (kept for the record; superseded by the section above)


Before planning, a `tsc` probe ran over the current JavaScript using `allowJs` + `checkJs`, `strict: true`,
`noImplicitAny: false`, `useUnknownInCatchVariables: false`. Result: **140 errors.**

| Error | Count | Cause |
|-------|-------|-------|
| `TS2741` | 88 | An unannotated destructured prop (`function Card({ className, ...props })`) is inferred as *requiring* `className`, so every call site that omits it errors. |
| `TS2339` | 25 | Property does not exist — `globalThis.prisma`, `initialData` narrowing, `data = {}` in the email template, and one real bug |
| `TS2322` | 12 | `string \| undefined` assigned where `string` required (env vars) plus email `style` objects |
| `TS2739` | 8 | `@react-email` components rejecting inline style objects |
| `TS2362`/`TS2363` | 4 | Arithmetic on a possibly-`Decimal` value |
| `TS2345` | 2 | `string \| undefined` passed to a `string` parameter |

**`TS2741` is not controlled by any `strict` flag.** The same probe with `strict: false` still reported **128
errors**, and a minimal `.ts` reproduction — `function Card({ className, children })` called as `Card({})` —
fails identically with `TS2345`. So the 88 prop errors cannot be switched off; they must be fixed by annotating
props on the shared UI primitives. That is type-only, provably runtime-inert, and it is the bulk of Plan A. The
spec's claim that Phase 1 is "mechanical" is therefore wrong; it was corrected in the spec before execution
(spec §Plan decomposition), and Task 12 Step 4 reconciles the drafted numbers with the executed ones.

Errors by subtree set the widening order (ascending dirtiness):

```
lib/ 2   actions/ 3   proxy.ts 1   data/ 0   hooks/ 0   tests/ 0     → Task 4 (lands with the rename)
components/ui/** 15                                                   → Task 5
components/** rest 17 (create-account-drawer 9, pagination 4, header 3, hero 1)  → Task 6
app/api/** 0   app/page.tsx 1   app/not-found.tsx 1   app/(auth)/** 0 → Task 7
emails/template.jsx 17                                                → Task 8
app/(main)/transaction/** 27                                          → Task 9
app/(main)/dashboard/** 15                                            → Task 10
app/(main)/account/** 42 (transaction-table 36, account-chart 6)      → Task 11
```

Those `app/**` numbers overlap: most are `TS2741` symptoms of the `components/ui` prop definitions, so they
disappear once Task 5 lands. Expect each later task to be smaller than its number suggests — measure, don't
assume.

## File structure

Created:

- `vitest.config.ts` — alias map + node environment; imported by no application code.
- `tsconfig.json` — the only project config, replacing `jsconfig.json`. Its `include` array is the migration throttle; its `compilerOptions` are set once in Task 4 and not touched again.
- `tests/money/unit/serialize-amount.test.ts` — pins both Decimal→number seams.
- `tests/money/unit/calculate-next-recurring.test.ts` — pins recurrence arithmetic including its rollover defects.
- `tests/validation/unit/schemas.test.ts` — pins today's Zod behaviour, including what it fails to catch.
- `next-env.d.ts` — generated by `pnpm exec next typegen`, git-ignored, never opened or edited.

Renamed: all 79 source files, per the deterministic mapping in Task 4 Step 3.

Deleted: `jsconfig.json`.

Modified: `package.json` (devDeps + `test`/`test:watch`/`typecheck`), `.gitignore`, `components.json`
(`"tsx": true`), `eslint.config.mjs`, `actions/accounts.ts` (the one bug fix), three env reads (`as string`),
`hooks/use-fetch.ts`, and the source files each widening task makes type-clean.

---

### Task 1: Vitest + the two amount serializers pinned

Adds the runner, then pins `serializeAmount` and `serializeTransaction` — the only code that converts a Prisma
`Decimal` into a JavaScript number. They are two separate functions doing the same job: `serializeAmount`
(`actions/lib/serializedAmount.js`, used by `actions/transaction.js`) and `serializeTransaction`
(`lib/serialized-transaction.js`, used by `actions/accounts.js` and `actions/dashboard.js`; it also handles
`balance`). Both are shallow.

**Files:**
- Modify: `package.json` (devDependencies + three scripts)
- Create: `vitest.config.ts`
- Create: `tests/money/unit/serialize-amount.test.ts`
- Behaviour pinned (not modified): `actions/lib/serializedAmount.js`, `lib/serialized-transaction.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `pnpm test`, `pnpm test:watch`, `pnpm typecheck`. Later tasks depend on `pnpm typecheck` meaning
  `next typegen && tsc --noEmit`. Test files must import targets through the `@/` alias and never with an
  extension, so they still resolve after Task 4 renames the targets.

- [ ] **Step 1: Install Vitest and the React/Node type packages**

```bash
pnpm add -D vitest @types/react @types/react-dom @types/node
```

Expected: pnpm prints the resolved versions and updates `pnpm-lock.yaml`. Record the printed `vitest` version in
the final report rather than guessing it. `@types/*` are declared explicitly here so
`pnpm install --frozen-lockfile` stays reproducible in CI and `next dev` never has to add them itself.

- [ ] **Step 2: Add the scripts**

In `package.json` `"scripts"`, keeping every existing key untouched:

```json
    "test": "TZ=UTC vitest run",
    "test:watch": "TZ=UTC vitest",
    "typecheck": "next typegen && tsc --noEmit"
```

`TZ=UTC` is not decoration. `actions/lib/calculateRecurring.js` advances dates with local-time setters, so the
recurrence assertions in Task 2 are only stable with the zone pinned — see Task 2 Step 2 for the measurement.
The env-prefix form assumes a POSIX shell (this repo's platform); on a bare Windows `cmd` shell the equivalent
is running the suite through `cross-env`, which is deliberately not added here.

- [ ] **Step 3: Write `vitest.config.ts`**

```ts
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
});
```

`environment: 'node'` is correct — neither module under test imports React or the DOM.

- [ ] **Step 4: Write the characterisation tests**

`tests/money/unit/serialize-amount.test.ts`:

```ts
import { expect, it } from 'vitest';

import { serializeAmount } from '@/actions/lib/serializedAmount';
import { serializeTransaction } from '@/lib/serialized-transaction';

// Prisma's Decimal exposes the one method these helpers call. Nothing else is depended on, so the stub
// cannot drift from the real object in a way these assertions would miss.
const decimal = (value: number) => ({ toNumber: () => value });

it('serializeAmount converts a top-level amount to a number', () => {
  const out = serializeAmount({ amount: decimal(12.34), description: 'coffee' });
  expect(out.amount).toBe(12.34);
  expect(out.description).toBe('coffee');
});

it('serializeAmount leaves a missing amount absent', () => {
  const out = serializeAmount({ description: 'no money here' });
  expect(out.amount).toBeUndefined();
});

it('serializeAmount does NOT recurse: a nested Decimal stays a Decimal', () => {
  const out = serializeAmount({
    account: { amount: decimal(5) },
    rows: [{ amount: decimal(7) }],
  });
  expect(out.account.amount.toNumber()).toBe(5);
  expect(out.rows[0].amount.toNumber()).toBe(7);
});

it('serializeTransaction converts both amount and balance', () => {
  const out = serializeTransaction({ amount: decimal(9.5), balance: decimal(100) });
  expect(out.amount).toBe(9.5);
  expect(out.balance).toBe(100);
});

it('serializeTransaction also stops at the top level', () => {
  const out = serializeTransaction({ account: { balance: decimal(3) } });
  expect(out.account.balance.toNumber()).toBe(3);
});

it('serializeTransaction converts a zero amount to the number 0', () => {
  const out = serializeTransaction({ amount: decimal(0) });
  expect(out.amount).toBe(0);
});
```

The last three tests **encode defects and one non-defect**: nested `Decimal`s are never converted (two tests),
while a `0` amount *does* serialize correctly — `lib/serialized-transaction.js:7` guards on `obj.amount`, which
is the Decimal **wrapper object**, always truthy, so `toNumber()` runs and yields `0`. An earlier draft of this
plan asserted `typeof out.amount === 'object'` on the belief that a zero fell through the falsy guard; running
the code disproved it, and the guard's real exposure is a missing `amount`, which test 2 already pins. Per spec
decision 4 the nested defect stays unfixed — `pnpm test` passing is the evidence that the behaviour was known
and deliberately preserved.

- [ ] **Step 5: Run them**

```bash
pnpm test
```

Expected: `6 passed`. If a test fails, the code does not do what this plan claims: **stop and report it. Do not
edit the source to make a characterisation test pass.**

- [ ] **Step 6: Confirm nothing else moved**

```bash
git status --porcelain
```

Expected: `M package.json`, `M pnpm-lock.yaml`, `?? vitest.config.ts`, `?? tests/`, plus the already-uncommitted
upgrade files (`M eslint.config.mjs`, `M lib/prisma.js`, `M prisma/schema.prisma`, `?? proxy.js`,
`?? prisma.config.ts`, `?? AGENTS.md`, `?? docs/`, `D middleware.js`, `M .gitignore`, `M next.config.mjs`, and
the upgrade's other `M` entries). If any file under `actions/`, `app/`, `components/`, `lib/`, `data/`,
`emails/`, `hooks/` shows as modified beyond that list, a step went wrong — revert it.

**Commit when asked:** `test: pin Decimal-to-number serializers before TypeScript migration`

---

### Task 2: Recurrence arithmetic pinned

`calculateNextRecurringDate` advances a `Date` with `setDate`/`setMonth`/`setFullYear`. Two behaviours are worth
recording because they are not what a finance reader expects, and `lib/inngest/functions.js` uses this function
to compute the balance writes for recurring transactions.

**Files:**
- Create: `tests/money/unit/calculate-next-recurring.test.ts`
- Behaviour pinned: `actions/lib/calculateRecurring.js`

**Interfaces:**
- Consumes: `pnpm test`.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Write the tests with the measured values**

`tests/money/unit/calculate-next-recurring.test.ts`:

```ts
import { expect, it } from 'vitest';

import { calculateNextRecurringDate } from '@/actions/lib/calculateRecurring';

const next = (start: string, interval: string) =>
  new Date(calculateNextRecurringDate(new Date(start), interval)).toISOString();

const JAN31 = '2026-01-31T00:00:00.000Z';

it('advances each interval', () => {
  expect(next(JAN31, 'DAILY')).toBe('2026-02-01T00:00:00.000Z');
  expect(next(JAN31, 'WEEKLY')).toBe('2026-02-07T00:00:00.000Z');
  expect(next('2026-01-15T00:00:00.000Z', 'MONTHLY')).toBe('2026-02-15T00:00:00.000Z');
  expect(next(JAN31, 'YEARLY')).toBe('2027-01-31T00:00:00.000Z');
});

// Defect recorded, not fixed: setMonth overflows instead of clamping to month-end.
it('rolls 31 January forward to 3 March, not 28 February', () => {
  expect(next(JAN31, 'MONTHLY')).toBe('2026-03-03T00:00:00.000Z');
});

// Defect recorded, not fixed: a leap-day anniversary lands on 1 March.
it('rolls a leap-year anniversary to 1 March', () => {
  expect(next('2024-02-29T00:00:00.000Z', 'YEARLY')).toBe('2025-03-01T00:00:00.000Z');
});

it('returns the same instant for an unrecognised interval', () => {
  expect(next(JAN31, 'FORTNIGHTLY')).toBe(JAN31);
});
```

- [ ] **Step 2: Run**

```bash
pnpm test
```

Expected: `10 passed`. **These values are NOT timezone-independent, and an earlier draft of this step claimed
they were.** `actions/lib/calculateRecurring.js:7-16` advances with local-time `setDate`/`setMonth`/
`setFullYear`, so a UTC-anchored input instant plus a local-time operation shifts the result whenever a DST
boundary falls inside the step — measured across all IANA zones, 7 of 418 fail at least one assertion here
(`America/Vancouver`, `America/Edmonton`, `Africa/Casablanca`, `Africa/El_Aaiun`, `America/Scoresbysund`,
`Asia/Almaty`, `Asia/Qostanay`). That is why Task 1 pins `TZ=UTC` in the `test` scripts. It matters beyond the
suite: `prisma/migrations/20250319162906_create_models/migration.sql:51` stores `nextRecurringDate` as
`TIMESTAMP(3)` **without time zone**, so a wall-clock produced under a shifting local offset is persisted and
read back as if it were UTC-anchored — pinning the suite to UTC matches the only place the value is well
defined. If an assertion differs anyway, print the actual value, pin that, and note the difference in the
report — do not change the source.

**Commit when asked:** `test: pin recurring date arithmetic including month-end overflow`

---

### Task 3: The existing Zod schemas pinned

`lib/schema.js` holds the only validation in the project, and it is imported by exactly two Client Components.
Nothing on the server uses it. Pinning it now means Plan B's `moneySchema` can be written as a deliberate
behaviour change rather than a guess about what changed.

**Files:**
- Create: `tests/validation/unit/schemas.test.ts`
- Behaviour pinned: `lib/schema.js`

**Interfaces:**
- Consumes: `pnpm test`, `zod@4.6.6`.
- Produces: the documented proof that `amount`/`balance` accept non-numeric strings today, which Plan B §2a
  closes and Task 12 Step 4 records.

- [ ] **Step 1: Write the tests with the measured values**

`tests/validation/unit/schemas.test.ts`:

```ts
import { expect, it } from 'vitest';

import { accountSchema, transactionSchema } from '@/lib/schema';

const validTransaction = {
  type: 'EXPENSE',
  amount: '42.50',
  date: new Date('2026-10-12T00:00:00.000Z'),
  accountId: 'acct-1',
  category: 'food',
};

it('accountSchema applies the isDefault default', () => {
  const out = accountSchema.parse({
    name: 'Cheque',
    type: 'CURRENT',
    balance: '100',
  });
  expect(out.isDefault).toBe(false);
});

// Defect recorded: `balance` is only checked for non-emptiness, so garbage reaches a Decimal column.
it('accountSchema accepts a non-numeric balance', () => {
  expect(
    accountSchema.safeParse({
      name: 'Cheque',
      type: 'CURRENT',
      balance: 'not-a-number',
    }).success,
  ).toBe(true);
});

it('accountSchema reports the required name message', () => {
  const result = accountSchema.safeParse({
    name: '',
    type: 'CURRENT',
    balance: '5',
  });
  expect(result.success).toBe(false);
  expect(result.error.issues[0].message).toBe('Name is required');
});

it('accountSchema rejects an unknown account type', () => {
  const result = accountSchema.safeParse({
    name: 'Cheque',
    type: 'CREDIT',
    balance: '5',
  });
  expect(result.success).toBe(false);
  expect(result.error.issues[0].code).toBe('invalid_value');
});

it('transactionSchema accepts a valid expense', () => {
  expect(transactionSchema.safeParse(validTransaction).success).toBe(true);
});

// Defect recorded: same gap as balance, on the field that drives every balance mutation.
it('transactionSchema accepts a non-numeric amount', () => {
  expect(
    transactionSchema.safeParse({ ...validTransaction, amount: 'abc' }).success,
  ).toBe(true);
});

it('transactionSchema rejects a string date', () => {
  const result = transactionSchema.safeParse({
    ...validTransaction,
    date: '2026-10-12',
  });
  expect(result.success).toBe(false);
  expect(result.error.issues[0].message).toBe('Date is required');
});

it('transactionSchema requires an interval when recurring', () => {
  const result = transactionSchema.safeParse({
    ...validTransaction,
    isRecurring: true,
  });
  expect(result.success).toBe(false);
  expect(result.error.issues[0].message).toBe(
    'Recurring interval is required for recurring transactions',
  );
  expect(result.error.issues[0].path).toEqual(['recurringInterval']);
});

it('transactionSchema defaults isRecurring to false', () => {
  expect(transactionSchema.parse(validTransaction).isRecurring).toBe(false);
});
```

- [ ] **Step 2: Run**

```bash
pnpm test
```

Expected: `19 passed`. If `invalid_value` is reported as `invalid_enum_value`, that is a Zod minor-version
difference in the enum issue code — pin the code the run actually printed and note it.

**Commit when asked:** `test: pin existing Zod schema behaviour including unvalidated money fields`

---

### Task 4: Rename all 79 files, then narrow-check them

The rename. `tsc` coverage is deliberately restricted to the leaf directories so this task ends green; Tasks
5–11 widen it. The rename and the `tsconfig.json` swap cannot be separated: with `.tsx` files on disk and no
config, `next build` generates its own `tsconfig.json` and edits `package.json`, putting the migration outside
this plan.

> **Step-order deviation, ruled by the controller before execution: perform Step 7 (write `tsconfig.json`)
> BEFORE Step 5 (`next typegen`).** `node_modules/next/dist/build/load-jsconfig.js:111` sets
> `useTypeScript = typeScriptPath && existsSync(tsconfig.json)`, and
> `node_modules/next/dist/lib/verify-typescript-setup.js:194` "Reconfigure (or create) the user's
> `tsconfig.json`" — and `next typegen` calls that module (`cli/next-typegen.js:21`). Run without a config,
> typegen lands Next's own defaults (`allowJs: true`, `strict: false`) and may add `@types/*` to
> `package.json`, which Global Constraints forbids. After typegen, re-read `tsconfig.json` and confirm
> `allowJs: false` and `strict: true` survived — re-write the file if Next touched it — and report any
> `package.json` delta Next made. Nothing else about the task changes; only the order of two steps.

**Files:**
- Rename: 79 files (mapping generated in Step 3) — 56 become `.tsx`, 23 become `.ts`
- Create: `tsconfig.json`; `next-env.d.ts` (generated)
- Delete: `jsconfig.json`
- Modify: `.gitignore`, `components.json`, `eslint.config.mjs`, `actions/accounts.ts`, `actions/transaction.ts`, `lib/arcjet.ts`, `lib/inngest/functions.ts`

**Interfaces:**
- Consumes: `pnpm test` from Tasks 1–3 (must stay green across the rename, unedited).
- Produces: the `.ts`/`.tsx` tree; the `tsconfig.json` whose `compilerOptions` Tasks 5–12 must not change and
  whose `include` array they only ever widen.

- [ ] **Step 1: Record the pre-rename baseline**

```bash
pnpm test && pnpm build 2>&1 | tail -3
pnpm lint 2>&1 | grep -oE "(  )+[a-z@][a-z@/-]+" | sort | uniq -c | sort -rn | head
```

Write both outputs down. The second is the per-rule error census that Task 12 Step 6 compares against; measured
today it is 94 errors and 3 warnings. The two non-`import/order` errors, with their exact homes, are
`react-hooks/set-state-in-effect` at `app/(main)/dashboard/_components/budget-progress.jsx:53` and
`react-hooks/static-components` at `components/ui/animated-group.jsx:97`. The three warnings are
`react-hooks/incompatible-library` at `app/(main)/transaction/_components/add-transaction-form.jsx:72` and
`components/create-account-drawer.jsx:105`, and `react-hooks/exhaustive-deps` at
`app/(main)/transaction/_components/scan-receipt.jsx:32`.

- [ ] **Step 2: Set `components.json` to TSX**

Change `"tsx": false` to `"tsx": true`, so future `pnpm exec shadcn add` output matches the tree.

- [ ] **Step 3: Generate the rename mapping and verify it**

Deterministic rule: contains JSX → `.tsx`, otherwise `.ts`.

```bash
for f in $(find . -name node_modules -prune -o -name .next -prune -o -name .delta -prune -o -name .git -prune -o \
  -type f \( -name '*.js' -o -name '*.jsx' \) -print | sed 's|^\./||' | sort); do
  if [ "${f##*.}" = jsx ]; then
    [ "$f" = "hooks/use-fetch.jsx" ] && echo "$f -> hooks/use-fetch.ts" || echo "$f -> ${f%.jsx}.tsx"
  elif grep -qE 'className=|<[A-Za-z][A-Za-z0-9]*[ /]|</[A-Za-z]' "$f"; then
    echo "$f -> ${f%.js}.tsx  # JSX inside .js"
  else
    echo "$f -> ${f%.js}.ts"
  fi
done
```

Expected: 79 lines, **56 `.tsx` + 23 `.ts`**. These six non-obvious outcomes must appear — if any is missing or
different, stop and work out why before renaming anything:

```
app/layout.js                    -> app/layout.tsx          # JSX inside .js
app/(auth)/layout.js             -> app/(auth)/layout.tsx   # JSX inside .js
app/(main)/layout.js             -> app/(main)/layout.tsx   # JSX inside .js
app/(main)/dashboard/layout.js   -> app/(main)/dashboard/layout.tsx  # JSX inside .js
data/landing.js                  -> data/landing.tsx        # JSX inside .js
hooks/use-fetch.jsx              -> hooks/use-fetch.ts      # no JSX, despite the .jsx name
```

Do not rename `.mjs` configs (`next.config.mjs`, `postcss.config.mjs`, `eslint.config.mjs`). `prisma.config.ts`
is already TypeScript.

- [ ] **Step 4: Apply it with `git mv`** so Git records renames, not delete+add:

```bash
git mv app/layout.js app/layout.tsx    # …one per mapping line, all 79
```

- [ ] **Step 5: Generate Next's ambient types**

```bash
pnpm exec next typegen
```

Expected: `next-env.d.ts` and `.next/types/` both exist (`ls next-env.d.ts`). Do not open or edit the file.

- [ ] **Step 6: Git-ignore the generated file**

Append to `.gitignore`:

```
next-env.d.ts
```

`next dev`/`build`/`typegen` regenerate it; the installed Next docs require ignoring it rather than tracking it.

- [ ] **Step 7: Write `tsconfig.json` with the narrow `include`**

```jsonc
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "noEmit": true,
    "incremental": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "allowJs": false,
    "strict": true,
    "noImplicitAny": false,
    "useUnknownInCatchVariables": false,
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  },
  "include": [
    "next-env.d.ts",
    ".next/types/**/*.ts",
    "vitest.config.ts",
    "prisma.config.ts",
    "tests/**/*.ts",
    "actions/**/*.ts",
    "lib/**/*.ts",
    "data/**/*.ts",
    "hooks/**/*.ts",
    "proxy.ts"
  ],
  "exclude": ["node_modules", ".delta"]
}
```

Delete `jsconfig.json` — the `paths` block above is its entire useful content. The option set is Next 16's own
generated default (`node_modules/next/dist/lib/typescript/writeConfigurationDefaults.js`: `target ES2017`,
`lib dom+dom.iterable+esnext`, `module esnext`, `moduleResolution bundler`, `jsx react-jsx`, `noEmit`,
`incremental`, `skipLibCheck`, `isolatedModules`, `esModuleInterop`, `resolveJsonModule`) plus this project's
four deliberate additions: `strict: true`, the two flags Plan B flips, and `allowJs: false` (Next suggests
`true`). `allowJs: false` is the tripwire: a missed `.js` file fails loudly instead of sitting silently
untype-checked. Files outside `include` are still compiled by SWC — they are simply not type-checked yet, exactly
as they are today.

- [ ] **Step 8: Teach ESLint the new extensions**

In `eslint.config.mjs`, add the TypeScript preset (verified export; it is a native flat array —
`typescript-eslint.configs.recommended` plus two `warn` rules plus Next's own ignores):

```js
import nextConfig from 'eslint-config-next/core-web-vitals';
import nextTsConfig from 'eslint-config-next/typescript';
import importPlugin from 'eslint-plugin-import';

const eslintConfig = [
  ...nextConfig,
  ...nextTsConfig,
  { ignores: ['.delta/**', 'next-env.d.ts'] },
  {
    /* the existing plugins/rules block, unchanged */
  },
];
```

- [ ] **Step 9: Prove the rename was inert**

```bash
pnpm test
```

Expected: `19 passed`, the same three test files, unedited. **This is the evidence the migration is
behaviour-free** — the tests import `@/actions/lib/serializedAmount` and friends extensionlessly, and they now
resolve `.ts`.

- [ ] **Step 10: Type-check the narrow set**

```bash
pnpm typecheck
```

Expected: exactly **6 errors**, all in files this plan has already read:

```
actions/accounts.ts(17,29): error TS2339: Property 'id' does not exist on type '() => Promise<any>'.
actions/accounts.ts(22,44): error TS2339: Property 'id' does not exist on type '() => Promise<any>'.
actions/transaction.ts(12,38): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
lib/arcjet.ts(4,3): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
lib/inngest/functions.ts(217,40): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
proxy.ts(14,3): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
```

Any different error set means the `include` list or a rename is wrong. Fix that before continuing.

- [ ] **Step 11: Fix the real bug the type-checker found**

`actions/accounts.ts:14` reads `const user = checkUser;` — missing both `await` and the call. `user` is the
function object, so `user.id` is `undefined`, and Prisma treats `undefined` in a `where` as "no filter". As
written, `updateDefaultAccount` clears `isDefault` on **every user's** default account, then attempts an
unscoped update. This is the one behaviour change permitted in Plan A, and it is forced: `tsc` cannot go green
without it.

```ts
    const user = await checkUser();
```

Report it separately to the user — it is a live cross-account data-integrity bug, not a typing detail.

- [ ] **Step 12: Fix the four env-var errors without changing runtime values**

`ARCJET_KEY` and `GEMINI_API_KEY` are absent from `.env.local`, so these are `undefined` at runtime today.
Preserve that exactly: assert the type, do **not** add a `''` fallback, because `''` and `undefined` can behave
differently inside those SDKs.

```ts
// actions/transaction.ts:12
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

// lib/arcjet.ts:4 and proxy.ts:14
key: process.env.ARCJET_KEY as string,

// lib/inngest/functions.ts:217
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
```

- [ ] **Step 13: Full gate**

```bash
pnpm typecheck && pnpm test && pnpm build && pnpm lint
```

Expected: `tsc` clean; `19 passed`; `next build` succeeds; `pnpm lint` errors only from `import/order`, count
within ±5 of the Step 1 census (±5 accounts for the two renamed files). `pnpm build` type-checks for real now —
Next 16 shells the project-local `tsc` — so for the first time a green build says something about types.

- [ ] **Step 14: Smoke the dev server, because a green build does not prove pages render**

```bash
pnpm dev & sleep 12
for p in / /sign-in /dashboard; do printf "%s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000$p"; done
kill %1
```

Expected: `/` → 200, `/sign-in` → 200, `/dashboard` → 307 (Clerk redirect; `DATABASE_URL` is absent so it cannot
go further). `/dashboard` → 500 means a renamed Server Component broke resolution — investigate before
reporting. Leave nothing listening on 3000.

**Commit when asked:** `refactor: migrate all source files to TypeScript with a narrowed check set`

---

### Task 5: Type the shared UI primitives' props

15 errors originate in `components/ui/**`, and they are the root cause of roughly 70 more in `app/**`. One
annotation per component fixes a class: `React.ComponentProps<'div'>` makes every DOM prop optional and passes
`className`/`children`/`ref` through, which is exactly what these wrappers intend.

**Files:**
- Modify: `tsconfig.json` (`include`: replace `"data/**/*.ts"`… keep all, add `"components/ui/**/*.tsx"`)
- Modify: `components/ui/{select,pagination,sonner,tooltip,popover,dropdown-menu,drawer,alert-dialog}.tsx`, plus `card.tsx`/`badge.tsx` as the pattern carriers

**Interfaces:**
- Consumes: `pnpm typecheck`.
- Produces: UI primitives whose props are `React.ComponentProps<…>`-based. Tasks 6–11 depend on this and must
  follow the same form — do not invent per-component prop interfaces where `ComponentProps` suffices.

- [ ] **Step 1: Widen and measure**

Add `"components/ui/**/*.tsx"` to `include`, then:

```bash
pnpm typecheck
```

Expected: 15 errors — `select.tsx` (4), `pagination.tsx` (3), `sonner.tsx` (2), and one each in
`tooltip.tsx`, `popover.tsx`, `dropdown-menu.tsx`, `drawer.tsx`, `alert-dialog.tsx`. Nothing from `card.tsx` or
`badge.tsx`: their *definitions* don't error, only their *call sites*, which live in `app/**` until Task 9.

- [ ] **Step 2: Annotate one file, then re-measure before repeating**

`components/ui/card.tsx` — all seven functions share the shape, so annotate all seven:

```tsx
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
        className,
      )}
      {...props}
    />
  );
}
```

`card.tsx` already has `import * as React from "react";`. In any file that lacks it, add
`import * as React from 'react';` above the first function.

```bash
pnpm typecheck
```

Expected: that file's errors gone, none added. Only then continue.

- [ ] **Step 3: Annotate the rest, using the element or Radix props actually wrapped**

For each remaining error, the component's own element decides the type:

```tsx
// A plain wrapper element
function PaginationLink({ className, isActive, ...props }: React.ComponentProps<'a'> & { isActive?: boolean }) {

// A variant-driven component
import { type VariantProps } from 'class-variance-authority';

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {

// A Radix primitive: take the props from the primitive itself, never hand-write them
function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
```

```bash
pnpm typecheck
```

Expected: clean over `components/ui/**`.

- [ ] **Step 4: Gate**

```bash
pnpm typecheck && pnpm test && pnpm build && pnpm lint
```

**Commit when asked:** `refactor: type shared UI component props`

---

### Task 6: `components/**` outside `ui/`, and the one shared hook

`create-account-drawer.tsx` (9), `pagination.tsx` (4), `header.tsx` (3), `hero.tsx` (1). Most are `TS2741`
symptoms already cured by Task 5; the residue is component-local state and React Hook Form types. `useFetch` is
typed in this task because Tasks 9–11 need its generic to see action return types.

**Files:**
- Modify: `tsconfig.json` (`include`: replace `"components/ui/**/*.tsx"` with `"components/**/*.tsx"`)
- Modify: `hooks/use-fetch.ts`, and `components/{create-account-drawer,pagination,header,hero}.tsx` as required

**Interfaces:**
- Consumes: Task 5's `React.ComponentProps`-typed primitives.
- Produces: `useFetch<A, R>` with a typed `fn` and `data`, used by every form in Tasks 9–11.

- [ ] **Step 1: Widen and measure**

Replace the `components/ui/**/*.tsx` entry with `"components/**/*.tsx"` (one glob, not two), then
`pnpm typecheck`. Expected: the residue in the four files above — report the actual count, which will be well
under 17 after Task 5.

- [ ] **Step 2: Give `useFetch` a generic**

`hooks/use-fetch.ts` is currently `(cb) => …` with an implicit-`any` callback. It is inside `include` from Task
4, so it type-checks today; this is a deliberate improvement, not a fix, and it is what keeps `app/**` errors
low later:

```ts
import { useState } from 'react';
import { toast } from 'sonner';

type FetchState<R> = { data: R | undefined; error: unknown };

const useFetch<A extends unknown[], R>(
  cb: (...args: A) => Promise<R>,
  // Kept as a shape rather than an interface so callers see exactly what the hook returns.
): {
  data: R | undefined;
  loading: boolean;
  error: unknown;
  fn: (...args: A) => Promise<R | undefined>;
  setData: (data: R | undefined) => void;
} => {
  const [state, setState] = useState<FetchState<R>>({ data: undefined, error: null });
  const [loading, setLoading] = useState(false);

  const fn = async (...args: A) => {
    setLoading(true);
    setState({ data: undefined, error: null });
    try {
      const data = await cb(...args);
      setState({ data, error: null });
      return data;
    } catch (error) {
      setState((prev) => ({ ...prev, error }));
      toast.error((error as Error).message);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  return {
    data: state.data,
    loading,
    error: state.error,
    fn,
    setData: (data: R | undefined) => setState((prev) => ({ ...prev, data })),
  };
};

export default useFetch;
```

Two deliberate deviations from the original, both needed to type it: `error.message` becomes
`(error as Error).message` — Plan B replaces it with the `errorMessage(error: unknown)` helper — and the `catch`
branch now returns `undefined` explicitly, so `fn` is `Promise<R | undefined>`. Runtime behaviour is identical
for every current caller, because the original `catch` already fell through to `undefined`.

- [ ] **Step 3: Fix the four components**

`create-account-drawer.tsx` errors are `useState` inference plus RHF `register` on an untyped form. Type the
form with the schema it already validates against:

```tsx
import type { z } from 'zod';
import { accountSchema } from '@/lib/schema';

type AccountFormValues = z.input<typeof accountSchema>;
const { register, handleSubmit, formState: { errors } } = useForm<AccountFormValues>({
  resolver: zodResolver(accountSchema),
});
```

`header.tsx` (3) and `hero.tsx` (1) are `TS2741`/`TS2339` on their own destructured props — annotate per Task 5
Step 2. `pagination.tsx` (4) takes `{ currentPage, totalPages, searchParams, startTransition }` from a Server
Component: type them explicitly, `searchParams` as `Promise<URLSearchParams>`-shaped value if the parent passes
the awaited object, and `startTransition` as `React.TransitionStartFunction`.

- [ ] **Step 4: Gate**

```bash
pnpm typecheck && pnpm test && pnpm build && pnpm lint
```

Expected: clean, and `pnpm build` still compiles `app/(main)/account` and `app/(main)/transaction`, which import
these components while still unchecked.

**Commit when asked:** `refactor: type top-level components and the useFetch hook`

---

### Task 7: Route handlers, root pages, and the auth pages

`app/api/**` (0 errors), `app/page.tsx` (1), `app/not-found.tsx` (1), `app/(auth)/**` (0), `app/layout.tsx` (0).
Small task, but it is the first time the public landing page and both API routes enter the checked set.

**Files:**
- Modify: `tsconfig.json` (`include` += `"app/api/**/*.ts"`, `"app/*.tsx"`, `"app/(auth)/**/*.tsx"`)
- Modify: `app/page.tsx`, `app/not-found.tsx`, `components/{hero,footer}.tsx` as required

**Interfaces:**
- Consumes: typed `components/**`, `data/landing.tsx`.
- Produces: the `PageProps`/`LayoutProps`/`RouteContext` usage from `next typegen` that Tasks 9–11 copy.

- [ ] **Step 1: Widen, then see what is left**

```bash
pnpm typecheck
```

Expected: 2 errors, one each in `app/page.tsx` and `app/not-found.tsx`.

- [ ] **Step 2: Fix them at the definition, not the call site**

Both fail on props of the components they render (`Hero`, `Footer`, `Logo`) still being inferred as requiring
`className`. Type the definition in `components/hero.tsx` / `components/footer.tsx` exactly as Task 5 Step 2 —
`React.ComponentProps<'section'>` for a section, `'div'` for a div. A call-site `as` cast would hide the prop
shape from every future page, which is the opposite of why this migration is happening.

- [ ] **Step 3: Confirm the seed route's shape is unchanged**

`app/api/seed/route.ts` exports `GET` (AGENTS.md wrongly documents `POST`). Nothing to fix — it is listed here so
its entry into the checked set is a recorded act: it is an unauthenticated route that writes rows, and from now
on at least its types are checked. Gating it is a security item for the deferred pass, not this task.

- [ ] **Step 4: Gate**

```bash
pnpm typecheck && pnpm test && pnpm build && pnpm lint
```

**Commit when asked:** `refactor: type route handlers, root pages and auth pages`

---

### Task 8: `emails/template.tsx`

17 errors in one file, two causes: `data = {}` destructuring means every `data.stats` / `data.month` /
`data.insights` / `data.percentageUsed` / `data.budgetAmount` / `data.totalExpenses` read is
`TS2339` on type `{}` (13 errors), and the `styles` object widens `textAlign: 'center'` to `string`, which
`CSSProperties` rejects (4 `TS2322`/`TS2739` at lines 59, 111, 128). It is its own task because it is the only
file that never enters the Next bundle, so its gate needs a different command.

**Files:**
- Modify: `tsconfig.json` (`include` += `"emails/**/*.tsx"`)
- Modify: `emails/template.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: a typed template for the Inngest monthly-report and budget-alert paths.

- [ ] **Step 1: Widen and measure**

```bash
pnpm typecheck
```

Expected: 17 errors, located as above.

- [ ] **Step 2: Type the props and the style map**

The component reads `userName`, `type`, and `data` (line 47). One props type covering both branches, and the
style map annotated instead of cast:

```tsx
type MonthlyReportData = {
  month?: string;
  stats?: {
    totalIncome?: number;
    totalExpense?: number;
    balance?: number;
  };
  insights?: string[];
};

type BudgetAlertData = {
  percentageUsed?: number;
  budgetAmount?: number;
  totalExpenses?: number;
};

type EmailTemplateProps = {
  userName?: string;
  type?: 'monthly-report' | 'budget-alert';
  data?: MonthlyReportData & BudgetAlertData;
};

export default function EmailTemplate({
  userName = '',
  type = 'monthly-report',
  data = {},
}: EmailTemplateProps) {
```

```tsx
const styles: Record<string, React.CSSProperties> = {
  /* every existing key, unchanged */
};
```

Add `import * as React from 'react';` if the file has no React namespace import. Read the destructuring at lines
47–50 and the `PREVIEW_DATA` shape at lines 13–46 to confirm each field name and type before writing the
interface — `PREVIEW_DATA` is the worked example of what the props really carry.

- [ ] **Step 3: Verify the email toolchain still resolves the file**

```bash
pnpm email
```

Expected: `react-email` starts its preview server and lists the template without a compile error. Nothing is
sent (`RESEND_API_KEY` is absent); reaching the preview list is the whole of what can be verified here. Then
`pnpm build`.

**Commit when asked:** `refactor: type the react-email template`

---

### Task 9: `app/(main)/transaction/**`

27 errors: `add-transaction-form.tsx` (10), `set-default-form.tsx` (5), `type-form.tsx` (3),
`date-form.tsx` (3), `form-buttons.tsx` (2), `accounts-form.tsx` (2), plus the two pages. `add-transaction-form`
holds the two hardest: `initialData` narrowing to `never`, and React Hook Form needing the schema's own type.

**Files:**
- Modify: `tsconfig.json` (`include` += `"app/(main)/layout.tsx"`, `"app/(main)/transaction/**/*.tsx"`)
- Modify: `app/(main)/transaction/{create/page.tsx,[id]/page.tsx?}` and the eight `_components` files

**Interfaces:**
- Consumes: `transactionSchema` from `lib/schema.ts`, Task 6's `useFetch<A, R>`, Task 5's typed primitives,
  `createTransaction`/`updateTransaction` from `actions/transaction.ts`.
- Produces: `TransactionFormValues` and the `z.input<typeof schema>` idiom that Plan B's `parseInput` mirrors.

- [ ] **Step 1: Widen and measure**

```bash
pnpm typecheck
```

Expected: at most 27, reduced by whatever Tasks 5–7 absorbed. Report the actual number.

- [ ] **Step 2: Fix `initialData` — the six `never` errors**

`add-transaction-form.tsx` declares `initialData = null`, so TS infers `null` and the truthy branch becomes
`never`: `Property 'amount' does not exist on type 'never'`. Type the props from the schema and the Prisma model:

```tsx
import type { z } from 'zod';
import type { Account } from '@prisma/client';

import { transactionSchema } from '@/lib/schema';

type TransactionFormValues = z.input<typeof transactionSchema>;

const AddTransactionForm = ({
  accounts,
  categories,
  editMode = false,
  initialData = null,
}: {
  accounts: Account[];
  categories: string[];
  editMode?: boolean;
  initialData?: TransactionFormValues | null;
}) => {
```

`z.input` not `z.output`: `initialData` arrives already serialised from the server, and `defaultValues` assign
`new Date(initialData.date)` into a field the schema declares as `z.date()`. Prisma 7's `prisma-client-js`
generator exports the `Account` model type, so no hand-written mirror is needed — this is the spec's
"Prisma types are the read-side authority" decision, applied.

- [ ] **Step 3: Fix the sibling forms**

- `set-default-form.tsx`, `type-form.tsx`, `form-buttons.tsx`, `accounts-form.tsx`: props annotated per Task 5
  Step 2; where a form's values cross into a server action, `useForm<TransactionFormValues>()`.
- `date-form.tsx` (3): react-day-picker 10 retyped its class names and collapsed two chevrons into one
  `Chevron` with an `orientation` prop. Type the callbacks from the library rather than declaring custom shapes:

```tsx
import type { DayPickerProps } from 'react-day-picker';
```

  Take `selected`/`onSelect`/`mode` from `DayPickerProps` and let the compiler tell you which of the three errors
  is a genuine prop-name change rather than a missing annotation.

- [ ] **Step 4: Gate, including the client component `next build` cannot verify**

```bash
pnpm typecheck && pnpm test && pnpm build && pnpm lint
pnpm dev & sleep 12
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/transaction/create
kill %1
```

Expected: gates green; `/transaction/create` → 307 redirect (signed out). A 500 here means an RHF/Zod generic
broke render — a `'use client'` component's runtime is not covered by the build. Leave nothing on port 3000.

**Commit when asked:** `refactor: type the transaction forms and page`

---

### Task 10: `app/(main)/dashboard/**`

15 errors: `transaction-overview.tsx` (8), `budget-progress.tsx` (5), `account-card.tsx` (2). Four of them are
`TS2362`/`TS2363` arithmetic on values that are `Decimal` before serialisation and `number` after — the type
checker is now describing the very seam Task 1's tests pin.

**Files:**
- Modify: `tsconfig.json` (`include` += `"app/(main)/dashboard/**/*.tsx"`)
- Modify: `app/(main)/dashboard/page.tsx` and `app/(main)/dashboard/_components/{transaction-overview,budget-progress,account-card}.tsx`

**Interfaces:**
- Consumes: `serializeTransaction` from `lib/serialized-transaction.ts`, `Account`/`Transaction` from
  `@prisma/client`, `getDashboardData` from `actions/dashboard.ts`, typed primitives.
- Produces: ~~`SerializedTransaction`, used by Task 11~~ — **not produced; see Task 11's Consumes note.** What Task 10
  actually delivered is two lines: `budgetData`'s derived annotation in `dashboard/page.tsx` and a `.getTime()`
  conversion of the `Date - Date` comparator in `transaction-overview.tsx`.

- [ ] **Step 1: Widen and measure**

```bash
pnpm typecheck
```

Expected: ~15, of which 4 are the arithmetic pair.

- [ ] **Step 2: Type the boundary, don't cast the symptom**

Do not sprinkle `as number` at the arithmetic sites — that hides the seam the tests document. Type the serialised
shape instead, which forces the conversion to happen at the page boundary:

```tsx
import type { Prisma, Transaction } from '@prisma/client';

type SerializedTransaction = Omit<Transaction, 'amount'> & { amount: number };
```

```tsx
const rows = transactions.map((t) => serializeTransaction(t) as SerializedTransaction);
```

If `pnpm typecheck` then complains the cast is unsafe, the problem is `serializeTransaction`'s untyped signature,
not the cast. Give it a generic in `lib/serialized-transaction.ts` and keep the body byte-for-byte identical —
Task 1's tests are the proof the behaviour is unchanged:

```ts
export const serializeTransaction = <
  T extends { amount?: unknown; balance?: unknown },
>(obj: T) => {
  const serialized = { ...obj };
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized;
};
```

If the two `serialized.balance`/`serialized.amount` assignments then error inside the generic, that is the first
genuinely structural change in this plan: switch the internals to a typed local rather than loosening the
caller. Report the diff of that file explicitly — it is protected-adjacent money-path code.

- [ ] **Step 3: Gate**

```bash
pnpm typecheck && pnpm test && pnpm build && pnpm lint
```

**Commit when asked:** `refactor: type the dashboard, charts and budget progress`

---

### Task 11: `app/(main)/account/**` — the last and dirtiest subtree

42 errors: `transaction-table.tsx` (36), `account-chart.tsx` (6), plus `[id]/page.tsx`. `transaction-table.tsx`
is the largest file in the repo; its errors are the same `TS2741` on `PaginationLink`/`PaginationEllipsis` plus
recharts callback params. Most should already be gone.

**Files:**
- Modify: `tsconfig.json` (`include` += `"app/(main)/account/**/*.tsx"`)
- Modify: `app/(main)/account/[id]/page.tsx`, `app/(main)/account/_components/{transaction-table,account-chart}.tsx`

**Interfaces:**
- Consumes: typed `components/pagination.tsx` (Task 6),
  `getAccountsWithTransactions`/`getPaginatedTransactions`/`bulkDeleteTransactions` from `actions/accounts.ts`.
  ~~`SerializedTransaction` (Task 10)~~ — **deleted during execution**: nothing in the tree consumes such a type,
  because `lib/serialized-transaction.ts:1` takes an implicit-`any` parameter, so `{ ...obj }` is `any` and every
  serialized row arriving in `app/(main)/**` is already `any`. No `Decimal`→`number` arithmetic diagnostic exists
  anywhere in the project. See the correction under Task 11 Step 2 and the Task 12 addendum.
- Produces: nothing. Plan A ends here.

- [ ] **Step 1: Widen and measure**

```bash
pnpm typecheck
```

Expected: 42 minus what Tasks 5–10 absorbed. Report the actual number.

- [ ] **Step 2: Type the chart's data once**

`account-chart.tsx`'s remaining errors are `(entry) => entry.amount` callbacks on implicit-`any` params plus the
`TS2362`/`TS2363` at line 68 — arithmetic on a possibly-`Decimal`. One data type covers `Cell` keys, `XAxis`
accessors and the tooltip payload:

> **Corrected during execution (Task 10 review), and Task 11 must work from this, not the paragraph above.**
> Line 68 is not Decimal arithmetic and not one root cause. Measured, `account-chart.tsx` holds **14** errors:
> `:68` is `Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date))`, i.e. **`Date - Date`**
> — the identical defect Task 10 fixed at `transaction-overview.tsx:47` — which contributes 2 of the 4 diagnostics
> there (TS2362/TS2363) and is cleared by the same `.getTime()` conversion. The other 2, plus the 10 `TS18046`
> `'unknown'` errors at `:76`, `:77` and `:108-126`, come from `filtered.reduce(..., {})`: an untyped accumulator
> object, so `Object.values` yields `unknown[]`. No `Decimal`, `amount` or `balance` arithmetic error survives
> anywhere in the project, because `serializeTransaction`'s implicit-`any` parameter makes every serialized row
> `any`. Typing that accumulator is therefore the only structural step left in Plan A, and it is worth doing for
> the `unknown` errors — not because a seam diagnostic demands `SerializedTransaction`.

```tsx
type BalancePoint = {
  date: string;
  balance: number;
  income: number;
  expense: number;
};
```

Resolve the line-68 arithmetic by mapping rows through `serializeTransaction` at the page boundary, as Task 10
Step 2 does — never by casting inside the chart.

- [ ] **Step 3: Type the table and delete-selection state**

`transaction-table.tsx` destructures `{ transactions, accountId }`: `SerializedTransaction[]` and `string`. Its
`TS2741` calls come from `PaginationLink` requiring `isActive`; Task 5 made those optional, so if any remain the
fix belongs in `components/ui/pagination.tsx`'s definition, not in 36 call sites.

Type the bulk-delete selection as `string[]`, and confirm `bulkDeleteTransactions(selectedIds)` still accepts it
— its parameter is unvalidated client input today, which is Plan B's business, not this task's.

- [ ] **Step 4: Gate**

```bash
pnpm typecheck && pnpm test && pnpm build && pnpm lint
```

**Commit when asked:** `refactor: type the account page, table and chart`

---

### Task 12: Full-project check and documentation

Widen `include` to everything, prove the count is zero, then make the docs true. This task ends Plan A: the repo
is TypeScript, `pnpm build` type-checks the whole tree, and the only behaviour change in 79 files is one missing
`await`.

**Files:**
- Modify: `tsconfig.json` (`include` → the final set)
- Modify: `docs/superpowers/specs/2026-10-12-typescript-zod-conversion-design.md` (the Phase-1 correction)
- Modify: `AGENTS.md` (rules 12/13, Stack table, Language strictness, Testing, File organization, HTTP surface, Progress Tracker, Verification)

**Interfaces:**
- Consumes: every task above.
- Produces: the state Plan B starts from — full `include`, `noImplicitAny: false`,
  `useUnknownInCatchVariables: false`, 16 `catch (error)` sites awaiting Phase 2 narrowing, and
  `globalThis.prisma` still an accepted implicit any in `lib/prisma.ts`.

- [ ] **Step 1: Widen to the whole project**

Replace `include` with the spec's final set:

```jsonc
  "include": [
    "next-env.d.ts",
    ".next/types/**/*.ts",
    "**/*.ts",
    "**/*.tsx"
  ],
```

- [ ] **Step 2: Prove zero remaining errors**

```bash
pnpm typecheck
```

Expected: no output, exit 0. Any error is in a file no earlier task widened over — fix it with the same
type-only pattern and name the directory that was missed; it means an earlier task's gate was incomplete.

- [ ] **Step 3: Prove the migration was inert, end to end**

```bash
pnpm test && pnpm build && pnpm lint
git diff --stat -M -- '*.ts' '*.tsx' | tail -5
```

Expected: `19 passed`; build green; `import/order` the only lint error, within ±10 of Task 4 Step 1. The diff
stat must classify the renames as `R` with small edit counts. A file showing large `+`/`-` was rewritten, not
renamed — re-inspect it and either justify it line by line or revert it.

- [ ] **Step 4: Reconcile the spec with what was measured**

The spec's "Phase 1 is mechanical" claim was already corrected during planning, on the strength of the probe
(140 errors, 88 of them `TS2741`, 128 surviving `strict: false`). This step replaces those drafted numbers
with the executed ones: re-run `pnpm typecheck` on the widened tree, record the per-file error census, and
confirm the spec's Plan A description names `actions/accounts.ts:14`'s missing `await` as the only behaviour
change and the six-error narrow set as the rename gate's expectation. If the executed numbers differ from the
drafted ones by more than a handful, say so in the spec rather than editing the claim back. Leave decision 4
(nested `Decimal`s preserved) intact — Task 1's tests stand as its evidence.

- [ ] **Step 4b: Burn the residuals Tasks 5–11 routed here (added during execution)**

Nothing below could be done inside its own task without breaking either the per-file budget rule or the
annotation-only shape of a reviewed diff. Each is type-only unless marked "behaviour", in which case it is a
question for the user, not an edit.

1. **Remove `typescript.ignoreBuildErrors` from `next.config.mjs`** and grep-verify the key is gone — this is
   the step that makes `pnpm build` a real type gate for the first time in Plan A.
2. **`components/pagination.tsx:23` is a false guarantee** (spec item 12). Tighten
   `startTransition: (callback: () => void, options?: unknown) => void` to one parameter. That makes
   `:31-33`'s `startTransition(fn, { scroll: false })` fail with TS2554 — the same diagnostic Task 11 deleted at
   `transaction-table.tsx:172`. Deleting the dead option there is inert; here the *intent* was real
   (`transaction-table.tsx:96-99` hand-rolls `preserveScroll` for the other navigations), so
   `router.push(url, { scroll: false })` is the honest fix and it **changes behaviour** — ask, don't assume.
   Do these two in the same change: with `ignoreBuildErrors` gone, item 1 is what makes item 2 visible.
3. **Decide `serializeTransaction`'s implicit-`any` signature** (`lib/serialized-transaction.ts:1`) — the one
   genuinely structural change Plan A has deferred. Every serialized row in `actions/**` and `app/(main)/**` is
   `any` today, which is why no `Decimal`→`number` seam diagnostic exists anywhere. Task 1's tests are the proof
   that a generic signature can land behaviour-free; report the diff of that file explicitly.
4. **Delete the unused locals Tasks 10/11 routed here** (ledger ruling P10-5): `emails/template.tsx:37`
   `PREVIEW_DATA`, `app/(main)/account/[id]/page.tsx:39` `allTransactions`, `actions/accounts.ts:62`
   `catch (error)`. Prove each unused by grep first (rule 4).
5. **`useFetch` needs a real test** — 3 cases via `renderHook`, which requires `jsdom` +
   `@testing-library/react` devDependencies that are **not installed**. Ask before installing.
6. **`emails/template.tsx:181`** — `satisfies Record<string, React.CSSProperties>` if the inline-style census
   wants it.
7. **Optional, only if a diagnostic appears after item 1:** prop typing at
   `transaction-overview.tsx:35`, `budget-progress.tsx:18`, `transaction-table.tsx:73`,
   `[id]/page.tsx:11`; `type: string` → the `TransactionType` union at `account-chart.tsx:33` (Task 11 review
   Minor M2 — a legal widening that forfeits a literal check the producer already provides);
   `parseFloat(account.balance)` at `[id]/page.tsx:56` — redundant-but-harmless because
   `serializeTransaction` has already converted `balance` to a `number`, and `any` hides it from the gate.
8. **Confirm `.delta/worktrees/**` copies are outside the include graph** once `include` is `**/*.ts`, or the
   widened tree type-checks the repo's own excluded duplicates.

- [ ] **Step 5: Update AGENTS.md, in the same change that made it untrue**

- Rule 12 / Stack table: TypeScript 5.9.3 as the language; `tsconfig.json` replaces `jsconfig.json`.
- Code Standards → Language strictness: replace "no `.ts`/`.tsx` files, `Running TypeScript` in ~2ms proves
  nothing" with the real state — `strict: true`, `allowJs: false`, `noImplicitAny: false` and
  `useUnknownInCatchVariables: false` deferred to Plan B, and `pnpm build` type-checking through the
  project-local `tsc` CLI.
- Testing: Vitest exists; `pnpm test` runs `tests/{feature}/{tier}/`; 19 tests, all characterisation; the two
  pinned defect classes (nested `Decimal`, unvalidated money strings) are documented as known.
- File organization: add `tsconfig.json`, `next-env.d.ts` (ignored), `vitest.config.ts`, `tests/`, `proxy.ts`,
  `.tsx` components, `data/landing.tsx`; remove the `.js`/`.jsx` rows.
- HTTP surface: `/api/seed` is `GET`, not `POST`.
- Auth gate rows: two `checkUser` functions exist — `lib/checkUser.ts` redirects for pages,
  `actions/lib/checkUser.ts` throws for actions — until Plan B §2c consolidates them.
- Progress Tracker: phase = "TypeScript Plan A landed; Plan B (Zod enforcement) pending"; current goal names
  the two open strict flags, the 16 catch sites, and the still-absent `DATABASE_URL`.
- Open questions: add the `as string` env assertions in `lib/arcjet.ts`, `proxy.ts`, `actions/transaction.ts`,
  `lib/inngest/functions.ts` as a known type-lie pending `experimental.typedEnv`.

- [ ] **Step 6: Final gate**

```bash
pnpm typecheck && pnpm test && pnpm build && pnpm lint
grep -n '<[a-zA-Z_/]' AGENTS.md | grep -v 'VERIFICATION STANDARDS\|FEATURE SPECS/00-template'
```

Expected: the four commands as described, and the AGENTS.md health check printing no unfilled slots.

**Commit when asked:** `refactor: complete TypeScript migration and update project documentation`

---

## What this plan deliberately does not do

- **No Zod enforcement.** All 12 input-taking actions keep accepting unvalidated client input, including
  `updateBudget(amount)` writing a raw value into a `Decimal` column and `createAccount(data)` accepting
  `balance: 'not-a-number'`. That is Plan B / Phase 2.
- **No `serializeAmount` recursion, no zero-amount fix, no month-end clamping fix.** Pinned by Tests 1–3,
  reported, unfixed (spec decision 4).
- **No `noImplicitAny`, no `useUnknownInCatchVariables`.** When Plan B flips them, expect ~1 new error in
  `lib/prisma.ts` (`globalThis.prisma` is an accepted implicit any today) and 10 in the `catch (error)` sites;
  the spec's `errorMessage(error: unknown)` helper is the planned fix.
- **No `typedRoutes`, `experimental.typedEnv`, or `next.config.ts`.**
- **No runtime verification of the money path.** No `DATABASE_URL`/`DIRECT_URL` exists here, so
  sign-in → create account → log transaction → balance remains unexecuted. These gates prove compilation and leaf
  behaviour; they do not prove a balance updates.
- **No lint-debt cleanup.** The ~92 `import/order` errors stay, still red, still a deferred decision.
- **No seed-route gating.** Unauthenticated `GET /api/seed` still writes rows; noted in Task 7 Step 3, deferred
  to the security pass.
