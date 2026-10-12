# TypeScript conversion + server-side Zod validation

Date: 2026-10-12
Status: approved approach, awaiting spec review
Repo state: `060c105` + an uncommitted dependency upgrade (Next 16.4.0 / Prisma 7.10.0 / Clerk 7 / Zod 4 / ESLint 9)

## The bet

Convert all 79 JavaScript source files to TypeScript without changing runtime behaviour, and use that
pass to install the validation boundary the app has never had: **no server action validates any input
today.** Twelve exported actions accept client-supplied arguments and pass them straight to Prisma;
`updateBudget` writes a raw client value into a `Decimal` column (`actions/budget.js:78-94`).

Two things are in scope and one thing deliberately is not: the *rename* must be provably inert, and the
*validation boundary* is new behaviour. They are separated into different phases precisely so a
regression can be blamed on one and not the other.

## Decisions already taken

| # | Decision | Chosen |
|---|----------|--------|
| 1 | Staging | Bridge then tighten: rename all 79 files with relaxed inference flags, build green, then flip flags module-by-module, money path first |
| 2 | Zod placement | Every input-taking server action, via one shared helper |
| 3 | Verification | A test runner plus money-seam unit tests, written **before** the first rename |
| 4 | `serializeAmount` | Behaviour preserved exactly; nested-`Decimal` defect reported, not fixed here |
| 5 | Type authority | Prisma-generated types on the read side, Zod schemas on the write side |
| 6 | Ramp flags | `strict: true` with `noImplicitAny: false` + `useUnknownInCatchVariables: false`, both flipped in Phase 2 |

## Measured current state

Verified 2026-10-12 against the working tree, not from documentation.

- **79 source files**: `app/` 28, `components/` 28, `actions/` 10, `lib/` 8, `data/` 2, `hooks/` 1,
  `emails/` 1, `proxy.js` 1. Zero `.ts`/`.tsx` outside `node_modules`.
- **`prisma.config.ts` is already TypeScript** and works, because the Prisma CLI loads it itself.
- **No import carries a file extension** (0 matches for `from '….js'`/`'….jsx'`). Every import is `@/…`
  extensionless, so **renaming requires no import rewrites** — the single largest de-risker of Phase 1.
- `jsconfig.json` contains only `compilerOptions.paths['@/*'] = ['./*']`. No `tsconfig.json`, no
  `next-env.d.ts`.
- `components.json` has `"tsx": false`, so `shadcn add` keeps generating `.jsx`.
- `typescript@^5.9.3` is already a devDependency. `@types/react@19.3.0` is present in the tree
  transitively but is **not** a declared devDependency. No test runner, no test script, zero test files.
- **Auth gate is not single-authority.** `lib/checkUser.js` (redirects) and `actions/lib/checkUser.js`
  (throws `Unauthorized`) are two different functions with the same name. Only
  `actions/transaction.js` calls `checkUser()`; the other actions call `auth()` inline — 9 sites.
  AGENTS.md's "one authority per rule" for the auth gate is a documentation defect.
- **`/api/seed` is `GET`, not `POST`** (`app/api/seed/route.js:3`), unauthenticated. AGENTS.md documents
  it as `POST`. Not fixed here; recorded.
- **Money seam**: `actions/lib/serializedAmount.js` does `{...obj}` then `obj.amount.toNumber()`. Only
  top-level `amount`. Related rows and arrays keep `Decimal` instances across the server/client boundary.

## Phase 0 — pin the money seam before touching anything

Goal: a green suite that describes **today's** behaviour while the files are still `.js`. Every later
phase re-runs it unchanged; a pass after a rename is the evidence the rename was inert.

Runner: **Vitest**, one devDependency. Node's built-in `node:test` is the zero-dependency alternative
and was rejected on one ground: it needs Node ≥22.18 for unconditional type stripping, so the suite
would break on the `>=20.9.0` floor this project documents, and it does not resolve `@/*` aliases that
Phase 2 tests need.

New files:

- `tests/money/unit/serialize-amount.test.ts` — `Decimal`-shaped stub (`.toNumber()`), a nested object,
  an array, and `amount` absent. Pins the shallow-spread behaviour **including** the fact that nested
  `Decimal`s are untouched.
- `tests/money/unit/calculate-next-recurring.test.ts` — the four intervals, plus month-end carry
  (`2026-01-31` + 1 month) and DST-crossing dates, recorded as-is whatever they currently produce.
- `tests/validation/unit/schemas.test.ts` — `accountSchema`, `transactionSchema`, and the
  `isRecurring`/`recurringInterval` `superRefine` rule.

`package.json`: add `"test": "vitest run"`, `"test:watch": "vitest"`, and `vitest` as a devDependency.
`vitest.config.ts` maps `@/` to the repo root so Phase 0 imports and Phase 2 imports use the same specifiers.

Excluded from Phase 0, with reasons: `actions/lib/checkUser.js` (needs Clerk `auth()`), `lib/prisma.ts`
(side-effectful adapter construction), and all 15 exported actions (they touch Postgres, which has no
credentials in this environment). Their verification stays where it has always been — unverified.

**Gate 0**: `pnpm test` green, `pnpm lint` unchanged at the recorded baseline, nothing else touched.

## Phase 1 — bridge: 79 renames, build green

Reversible, and one behaviour change: the missing `await` in `actions/accounts.js:14` that `tsc` will not let
pass. "Mechanical" was the draft's word and measurement replaced it — see §Plan decomposition.

1. `git mv` each file: `.js` → `.ts`, `.jsx` → `.tsx`. `proxy.js` → `proxy.ts`. `hooks/use-fetch.jsx` →
   `hooks/use-fetch.tsx` is wrong — it contains no JSX; it becomes `.ts`. Extensionless-imports means no
   call-site edits.
2. Config files stay as they are: `next.config.mjs`, `postcss.config.mjs`, `eslint.config.mjs`. Renaming
   `next.config.mjs` → `.ts`/`.mts` is a separate concern with its own module-resolution behaviour and is
   out of scope.
3. Delete `jsconfig.json`; write `tsconfig.json` with Next 16's own generated defaults (read from
   `node_modules/next/dist/lib/typescript/writeConfigurationDefaults.js`, not memory): `target: ES2017`,
   `lib: [dom, dom.iterable, esnext]`, `module: esnext`, `moduleResolution: bundler`, `jsx: react-jsx`,
   `noEmit`, `incremental`, `skipLibCheck`, `isolatedModules`, `esModuleInterop`, `resolveJsonModule`,
   plus `paths` copied from `jsconfig.json`, plus the project's own additions:

   ```jsonc
   "strict": true,
   "noImplicitAny": false,             // Phase 2 flips
   "useUnknownInCatchVariables": false, // Phase 2 flips
   "allowJs": false,                    // Next suggests true; after Phase 1 no .js source remains
   ```

   `strict: true` lands `strictNullChecks`, `strictFunctionTypes`, `strictPropertyInitialization` and
   friends immediately. The two deferred flags are the *only* ones with measurable Phase-1 cost:
   `noImplicitAny` because the 52 `.jsx` files (28 under `app/`, 28 under `components/`, counted as
   `.js`+`.jsx` per directory) have untyped props and parameters, and `useUnknownInCatchVariables`
   because of the 16 `catch` blocks / 10 `error.message` reads.
   `allowJs: false` is a guarantee, not a cleanup: if any `.js` file is missed, the build fails loudly
   instead of silently excluding it from checking.
   `include` is literally `["next-env.d.ts", ".next/types/**/*.ts", "**/*.ts", "**/*.tsx"]` — the `**`
   globs must reach `tests/`, otherwise `tsc --noEmit` silently skips the money-seam suite that the whole
   verification story rests on.
4. Install `@types/react`, `@types/react-dom`, `@types/node` as declared devDependencies, rather than
   letting `next dev` mutate `package.json` mid-run — `pnpm install --frozen-lockfile` must keep working.
5. `.gitignore`: add `next-env.d.ts` (Next manages and regenerates it; the installed docs say to ignore
   it and untrack it if already committed).
6. `components.json`: `"tsx": true`, so future `shadcn add` output matches the rest of the repo.
7. `eslint.config.mjs`: add `eslint-config-next/typescript` (verified export) to the flat config so
   `.tsx` files get the same rule set `.jsx` files had.
8. `pnpm typecheck` script: `next typegen && tsc --noEmit` — the CI pattern documented in
   `node_modules/next/dist/docs/01-app/03-api-reference/06-cli/next.md`.

Known unknowns for Phase 1, each with a named check:

- `emails/template.jsx` → `.tsx`: `react-email@6.11.1`'s `email dev` must still resolve the entry.
  Checked by `pnpm email` locally (renders without sending); the Resend *send* path remains unverified
  because `RESEND_API_KEY` is absent.
- Third-party types: `motion@14`, `react-day-picker@10`, and Radix components can surface genuinely
  missing upstream types. Handled with local `.d.ts` declarations in `types/`, never with `any` casts.
- `pnpm build` now type-checks (Next 16 shells the project-local `tsc` CLI). The build stops being a
  bundling-only gate and starts being a real one. Expect longer builds.

**Gate 1**: `pnpm test` (unchanged files, now importing `.ts` modules) + `pnpm build` +
`pnpm typecheck` all green, and `pnpm lint` reporting no new error class beyond the recorded
pre-existing `import/order` debt.

## Phase 2 — tighten the money path and add the boundary

Order matters: schemas and validation first (they are new behaviour, reviewable on their own), then the
flag flips (they are mechanical).

This is the only phase that changes what the app does at runtime. The complete list of deltas, so a
reviewer knows what to look for:

1. Twelve actions start rejecting input they previously accepted, including a budget/transaction `amount`
   that is not a plain decimal string with ≤2 places.
2. `getPaginatedTransactions` callers stop sending `''` sentinels and send `undefined` instead.
3. Nine actions gain an ownership/session check they did not have as a shared call (the `auth()` →
   `checkUser()` consolidation); behaviour is the same, the failure message moves from `'Unauthorized'`
   written 9 times to one implementation.
4. `lib/schema.ts` gains a `.transform(Number)` on money, so the value that reaches Prisma is a `number`
   rather than whatever the client sent.

Everything else in Phases 1–3 is expected to be behaviour-free, and Phase 0's suite is what makes that
claim checkable.

### 2a. Single-authority schemas

`lib/schema.ts` keeps its two existing schemas and gains one per action input. Prisma's generated enums
are the value authority, verified present as both runtime objects and types in
`node_modules/.prisma/client/index.d.ts` (`export const AccountType`, `export type AccountType`).
Zod 4.6's `z.enum()` accepts an enum-like object directly (`_enum` overload 2 in
`node_modules/zod/src/v4/classic/schemas.ts:2150-2165`), so no value list is duplicated and
`schema.prisma` stays the one source of truth:

```ts
import { AccountType, RecurringInterval, TransactionType } from '@prisma/client';
export const transactionTypeSchema = z.enum(TransactionType);
```

`lib/schema.ts` stays client-importable — it is already imported by two Client Components — so it must
not import `server-only` or `lib/prisma`.

Money fields are the part that must be exact, because `80aec7a` was a bug about exactly this:

```ts
export const moneySchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a positive number with up to 2 decimals')
  .transform(Number);
```

`Number` is safe at this magnitude and precision (2 decimals, well under `Number.MAX_SAFE_INTEGER`), and
Prisma accepts a `number` for a `Decimal` column. The alternative — passing a string into Prisma and
letting the driver coerce — hides the same class of bug the last fix addressed.

### 2b. The enforcement point

`actions/lib/parse-input.ts`, one helper, thrown errors, no return envelopes:

```ts
export class ValidationError extends Error {
  constructor(issues: z.ZodIssue[]) {
    super(issues[0]?.message ?? 'Invalid input');
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

export function parseInput<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) throw new ValidationError(result.error.issues);
  return result.data;
}
```

Why throw instead of returning `{ error }`: `hooks/use-fetch.jsx:17-20` already catches and toasts
`error.message`, so a rejection surfaces as "Amount must be a positive number with up to 2 decimals"
with **no caller changes**. Most actions wrap themselves in `try/catch`, but the convention is not uniform
and two exceptions are measured, not assumed: `actions/accounts.js:30` and `:115` return
`{ success: false, error: error.message }` envelopes today, `getAccountsWithTransactions`
(`actions/accounts.js:61`) has an **empty** catch that swallows the error and returns `undefined`, and
`getPaginatedTransactions` (`actions/accounts.js:119`) has **no** catch, so a throw from it reaches the
caller uncaught. Plan B must handle those three call sites explicitly rather than rely on a blanket
try/catch claim. The AGENTS.md convention that says "Server Actions … return `{ error }` to the form"
describes only part of the code; the doc gets corrected in this change to name both shapes.

Why a helper instead of a `withValidation(schema, fn)` wrapper: a wrapper would obscure the `'use server'`
boundary and the per-action argument arity (`updateTransaction(data, id)` takes two).

Call order inside each action, uniform:

```ts
const user = await checkUser();               // auth first: no info to non-users
const input = parseInput(createTransactionSchema, data);
// ownership-scoped Prisma call
```

`parseInput` runs on `unknown`, not on a pre-typed value. That is the point — TypeScript erases at
runtime, so the schema is the only thing that can actually reject a client.

### 2c. Inventory

15 exported actions. Three take no arguments (`getUserAccounts`, `getDashboardData`, `seedTransactions`)
and get nothing. Twelve take client input and get a schema each:

| Action | Arg today | Schema |
|--------|-----------|--------|
| `actions/accounts.js:11` `updateDefaultAccount` | `accountId` | `z.string().uuid()` |
| `actions/accounts.js:34` `getAccountsWithTransactions` | `accountId` | `z.string().uuid()` |
| `actions/accounts.js:64` `bulkDeleteTransactions` | `transactionsIds` | `z.array(z.string().uuid()).min(1).max(200)` |
| `actions/accounts.js:119` `getPaginatedTransactions` | 6 destructured fields | object: page/itemsPerPage coerced to bounded ints; `typeFilter`/`recurringFilter`/`sortField`/`sortDirection` as bounded enums — **today they arrive as `''` sentinels**, so the schema must accept `''` or the callers must send `undefined`. Callers are edited to send `undefined`; `''` is not added to the type as a legal value |
| `actions/budget.js:8` `getCurrentBudget` | `accountId` | `z.string().uuid()` |
| `actions/budget.js:78` `updateBudget` | `amount` | `moneySchema` |
| `actions/dashboard.js:9` `createAccount` | `data` | `accountSchema` |
| `actions/transaction.js:15` `scanReceipt` | `File` | not Zod-reachable: `instanceof File` + size/MIME checks, same error type. Zod cannot validate a browser `File` |
| `actions/transaction.js:78` `createTransaction` | `data` | `createTransactionSchema` |
| `actions/transaction.js:157` `getTransactionById` | `id` | `z.string().uuid()` |
| `actions/transaction.js:176` `updateTransaction` | `data, id` | both, separately |
| `actions/send-email.js:5` `sendEmail` | `{to, subject, react}` | schema added, but it is **server-side only** (called by `lib/inngest/functions.js`), so it is not a client boundary. Validated anyway for consistency; cheap |

Also: replace the 9 inline `auth()` call sites with the existing `actions/lib/checkUser.js`, so "is this
user who they say they are" has one implementation in the action layer. This is not drive-by cleanup —
`parseInput` is spec'd to run *after* `checkUser()`, which is impossible while half the actions roll
their own. `lib/checkUser.js` (the redirecting one) stays for pages/layouts, and the two files get names
that say which is which (`getSessionUser()` in actions, `checkUser()` in pages).

### 2d. Flag flips

`noImplicitAny: true`, fixed in `actions/` → `lib/` → `data/`. Then
`useUnknownInCatchVariables: true`, one `errorMessage(error: unknown): string` helper replacing the 10
`error.message` reads. Money-path leaves get explicit return types; component props wait for Phase 3.

**Gate 2**: `pnpm test` (plus new `parseInput` and per-schema rejection tests), `pnpm typecheck`,
`pnpm build`. Unit tests cover the helper and the schemas directly — they do **not** cover a full action
call, because that needs Clerk auth and Postgres.

## Phase 3 — tighten the UI layer

`noImplicitAny` through `app/` and `components/`, props typed with interfaces, `PageProps` / `LayoutProps`
/ `RouteContext` from `next typegen` used instead of hand-written param types, `serializeAmount` given a
generic that preserves its input shape. Ends with `allowJs: false` re-checked and zero `any` in
`actions/`, `lib/`, `data/`.

## Verification, stated honestly

Green at each gate: tests, `tsc --noEmit`, `next build`, lint-vs-baseline.

Still unverified after all three phases, and no phase changes that: **the runtime money path.**
`DATABASE_URL` / `DIRECT_URL` are absent from `.env.local`, so sign-in → create account → log
transaction → balance has never been executed against a database in this environment. Types prove shape,
tests prove leaf logic, the build proves compilation. None of them proves a balance updates.
`pnpm lint` also stays red on ~92 pre-existing `import/order` errors carried in from before the upgrade;
the gate is "no new error class", not "green".

Manual verification becomes possible the moment a throwaway database URL exists, and should be run then.

## Reported, not fixed

1. `serializeAmount` does not recurse — nested `Decimal` values still cross to the client (decision 4).
   Needs its own change with its own approval.
2. Two same-named `checkUser` functions with different contracts (consolidated as part of 2c, since the
   validation order depends on it). Related and found while drafting: `actions/accounts.js:14` reads
   `const user = checkUser;` — missing both `await` and the call — so `user.id` is `undefined`, Prisma
   drops the `userId` filter, and `updateDefaultAccount` clears `isDefault` on **every user's** default
   account and can promote an account it does not own. Not a doc problem; it is a live authorization bug.
   The rename makes it a compile error (`Property 'id' does not exist on type`), so Plan A Task 4 fixes it
   as a forced change and its behaviour test lands with it.
3. `/api/seed` is an **unauthenticated `GET`** that writes rows. AGENTS.md calls it `POST`. Deferred to
   the security pass, but it is reachable in production as written.
4. Invariant "account balance = SUM(transactions)" is unenforced by anything — no trigger, no audit, no
   test. Type-safe actions reduce the ways to break it; they do not detect it.
5. ~~Four `motion`-importing components under `components/ui/` are imported by nothing~~ — **resolved during
   execution, contrary to this prediction.** Plan A Task 5 deleted `animated-group`, `progressive-blur`,
   `text-effect` and `infinite-slider` after proving zero references repo-wide, because typing them was the cost
   the plan was about to pay. `motion` remains in `package.json:41` as an unused dependency; `pnpm remove motion`
   is a one-command cleanup awaiting the user's word.
6. `actions/seed.ts:87` runs `deleteMany({ where: { accountId: ACCOUNT_ID } })`, and `ACCOUNT_ID` comes from
   an env var that is in no documented inventory, so it is `undefined` — Prisma reads `undefined` in a filter
   as "no filter", which is every user's transactions, reachable through item 3's unauthenticated `GET`. Plan A
   Task 4 made this *less* visible rather than fixing it: `const ACCOUNT_ID = process.env.ACCOUNT_ID as string`
   is inert at runtime (byte-identical to base) but tells `tsc` the value cannot be undefined, so the compiler
   will never flag the missing filter. `actions/**` is owned by no other Plan A task, so **Plan B owns it**:
   parse the env with a Zod schema that fails loudly, and gate the route.
7. The react-day-picker 10 upgrade dropped the `initialFocus` prop, and
   `app/(main)/transaction/_components/date-form.tsx` consequently lost it — the date picker no longer moves
   focus to the selected day when the popover opens. `grep initialFocus node_modules/react-day-picker/` returns
   nothing, so re-adding the prop is not available; the rdp-10 equivalent needs a `ref`/`autoFocus` on a day
   button. Real keyboard/a11y regression, unreviewed by a human, out of both plans' scope.
8. The budget-alert email sends **strings into an arithmetic slot** and discards a field.
   `lib/inngest/functions.ts:77-78` builds `data` as `budgetAmount: parseInt(budgetAmount).toFixed(1)` and
   `totalExpenses: parseInt(totalExpenses).toFixed(1)` — `.toFixed()` returns a string, and `budget.amount` is a
   Prisma `Decimal`, so `parseInt` truncates the cents the email then claims to report — while
   `emails/template.tsx:170` computes `data?.budgetAmount - data?.totalExpenses` for the "Remaining" row.
   The same call site passes `accountName: defaultAccount.name`, which `EmailTemplate` never renders. Plan A
   Task 8 could not fix any of this without changing what the emails say, so it typed the two fields as
   `number | string` (truthful across both callers) and put two `as number` casts on the subtraction — inert at
   runtime, verified byte-identical by `tsc` downlevel emit. **Plan B owns the real fix**: a Zod schema for the
   email payload that requires numbers, serializes `Decimal` through `serializeAmount`, and either renders
   `accountName` or stops sending it.
9. `pnpm email` has never been runnable in this repo, and AGENTS.md documents it as a working command.
   `node_modules/@react-email/` contains only `components`; `email dev` halts on
   `? To run the preview server, the package "@react-email/ui" must be installed. Would you like to install it?`
   — an interactive prompt, so Plan A Task 8's Step 3 gate was unattainable and `emails/template.tsx` is proven
   only by `tsc` and module resolution, never by the preview renderer. Combined with the spec's existing open
   question that `@react-email/components` is deprecated at every published version, the email toolchain needs
   one decision (install `@react-email/ui`, or replace the stack) rather than two. Task 12 corrects the AGENTS.md
   line; the install itself is the user's call.
10. **Income transactions silently corrupt the account balance.** `add-transaction-form.tsx:95-99` builds
   `{ amount: parseFloat(data.amount), ...data }` — the spread lands *after* `amount`, so the parsed value is
   overwritten by the raw form string and `createTransaction` receives `amount: string`. Then
   `actions/transaction.ts:120-122` computes `account.balance.toNumber() + balanceChange` where
   `balanceChange` is that string on the INCOME branch: `100 + "250"` is `"100250"`, not `350`, and Prisma
   accepts the string as a `Decimal`, so `:143` writes it. The EXPENSE branch is accidentally correct because
   the unary minus coerces first (`-`"250"` → `-250`). It survived scrutiny because a fresh account has balance
   `0`, and `0 + "250"` is `"0250"` → `250` — right answer by coincidence. `updateTransaction` already
   `parseFloat`s (`:207-208`, commit `80aec7a`), which is why only create is broken. **No test pins
   `createTransaction`** (`grep -rn "createTransaction\|parseFloat" tests/` → no matches), so Plan A's Phase 0
   suite does not cover this seam and cannot catch it. Plan A cannot fix it: deleting `parseFloat` or reordering
   the spread changes runtime behaviour, which Phase 1 forbids. **Plan B owns it** — the boundary `parseInput`
   coerces once, on validated input, and a characterisation test for both branches lands with it.
11. `app/(main)/dashboard/_components/budget-progress.tsx:60` shows the user
    `toast.error('Failed asdasdto update budget')` when a budget update fails — a stray paste in a failure message
    on the money path. Plan A Task 10 owns the file, but Phase 1 forbids runtime-visible changes and this string is
    what a user reads, so it is reported rather than silently corrected. One-line fix, awaiting the user's word.
12. **Pagination has never suppressed scroll, and a type annotation hid why.** Two call sites passed an options
    object as `startTransition`'s *second* argument — `transaction-table.tsx:172` (deleted by Plan A Task 11,
    because React 19's `TransitionStartFunction` has exactly one parameter, `@types/react/index.d.ts:1844-1852`, so
    TS2554 made the dead argument visible) and `components/pagination.tsx:31-33`, which read
    `startTransition(() => router.push(...), { scroll: false })`. The second site compiled only because
    `pagination.tsx:23` declared the injected prop as
    `startTransition: (callback: () => void, options?: unknown) => void` — a signature React does not implement.
    That annotation was written to match the call site as it was, and it worked: the option type-checked and was
    discarded at runtime. So it was a false guarantee in exactly the category this conversion exists to remove, and
    the feature ("don't jump to the top when changing page") has never worked on the pagination path. Corroboration
    that the intent was real: `transaction-table.tsx:96-99` hand-rolls a `preserveScroll` helper for its *other*
    navigations (`:108-109`, `:162-163`).
    - **Type-only half: LANDED in Task 12.** `:23` is now `startTransition: (callback: () => void) => void` (one
      parameter) and the dead options object is gone, so `:31` reads `startTransition(() => router.push(...))`. It
      was done in the same change that removes `typescript.ignoreBuildErrors`, which is what makes it visible: with
      the build type-checking, keeping the second argument would fail the gate with TS2554 — the type checker as the
      prompt rather than as a cover-up. Proven inert because `TransitionStartFunction`
      (`@types/react/index.d.ts:1844-1852`) takes one argument, so the deleted option was never read by React.
    - **Behaviour half: STILL OPEN, awaiting the user.** Scroll suppression remains broken; the honest fix is
      `router.push(url, { scroll: false })`, which Next.js does honour. That changes observable behaviour, so Phase 1
      forbade it and it was not done here.
13. **The account chart groups by a date key that cannot sort correctly.** `account-chart.tsx:67` keys the accumulator
    with `format(new Date(transaction.date), 'MMM dd')`, then `:83-84` sorts by `new Date(thatLabel)`. Two
    consequences, both pre-existing: a "Dec 31" from 2025 and a "Dec 31" from 2026 collapse into one bar, and
    because the missing year defaults, a window spanning December into January orders the December bars *after* the
    January ones. Plan A Task 11 typed this accumulator (`DailyGroup`) and converted the comparator to `.getTime()`,
    both of which are behaviour-free — so the chart now *documents* the ordering as a typed, chronological sort
    while still not performing one correctly. Fixing it means keying by an ISO day and formatting only at render,
    which changes chart output: **Phase 2/3 territory, not Plan A.**

## Plan decomposition

This spec is deliberately two implementation plans, because they carry different risk:

- **Plan A — Phase 0 + Phase 1.** Pin behaviour, then rename. Not purely mechanical, and this is a
  correction to the earlier draft of this section: measurement found 140 `tsc` errors on the renamed tree
  (88 of them `TS2741` from unannotated destructured props, which no `strict` flag suppresses), so Phase 1
  carries per-directory typing tasks, and the rename forces one real behaviour change — the
  `updateDefaultAccount` authorization fix in item 2 above. Everything else in Plan A is behaviour-free,
  and the pass criteria stay mechanical: the Phase 0 tests must pass unedited at every step.
  - **Drafted vs executed.** The 140 errors / 88 `TS2741` figures above are what the *draft* measured at
    planning time (its probe also recorded 128 of them surviving `strict: false`); they were wrong in size,
    though right in kind. The executed census on the renamed tree at Task 4's close was **194 errors**, burned
    down to **0** by Task 12 across Tasks 5–11 (`npx tsc --noEmit --incremental false` → exit 0, 0 errors,
    project-wide). So the claim this section exists to correct — "Phase 1 is mechanical" — is now corrected
    twice: not mechanical, and more expensive than the correction itself estimated.
  - **`include` widening was inert.** Task 12 replaced the per-directory globs with `["next-env.d.ts",
    ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.ts", "**/*.tsx"]` and the error count did not
    move, because nothing new entered the program: the four root files the old list named explicitly
    (`next-env.d.ts`, `vitest.config.ts`, `prisma.config.ts`, `proxy.ts`) were already covered by `**/*.ts`,
    and `.delta/` stays in `exclude`. Verified census: **81 `.ts`/`.tsx` files** outside `node_modules`,
    `.next` and `.delta`, and **zero `.js`/`.jsx` sources remain**, so `allowJs: false` is satisfied rather
    than merely asserted.
- **Plan B — Phase 2 (+ Phase 3 as follow-on).** Introduces the validation boundary and flips the strict
  flags. Needs its own review, because "the build is green" no longer means "nothing changed".

Plan A gets written first. Phase 3 is scheduled after Plan B but planned inside it.

## Out of scope

`typedRoutes`, `experimental.typedEnv`, `next.config.ts`, the deferred lint-debt decision, the three
zero-import dependencies, `engines.node`, the `@react-email/components` deprecation, and any UI/redesign
work — all of these stay as they were. Committing is not part of this plan; the phases are separate
commits **when asked**.

## Documentation that becomes untrue and gets fixed in the same change

- AGENTS.md rule 15 / "Cross-cutting rules": auth gate is not one authority until 2c lands; then it is.
- AGENTS.md "Server Actions … return `{ error }`" → replaced by the thrown-`ValidationError` contract.
- AGENTS.md Code Standards → Language strictness: `tsconfig.json`, `strict: true`, the two deferred flags
  and the phase that flips them; the "build reports *Running TypeScript* in ~2ms because there are no
  `.ts` files" line becomes obsolete at Phase 1.
- AGENTS.md `/testing` section and "Test coverage: 0%" → Vitest, `tests/{feature}/{tier}/`, `pnpm test`.
- AGENTS.md `app/api/seed` `POST` → `GET`.
- File organization table: `tsconfig.json`, `next-env.d.ts`, `tests/`, `proxy.ts`, `.tsx` components.
