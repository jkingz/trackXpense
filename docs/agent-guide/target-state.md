# TARGET STATE — Not Yet Built

Design intent not implemented. Treat as requirements for future work. Two shapes appear below: code that does not exist at all, and — flagged explicitly — code that exists but has never been executed or verified in this environment.

- **Recurring transaction processing run against a database:** the code is built (`triggerRecurringTransactions` cron → `transaction.recurring.process` event → `processRecurringTransaction`, which does `balance: { increment: … }` inside `db.$transaction` at `lib/inngest/functions.ts:150`) and served at `/api/inngest`, but no schedule has fired here and no occurrence has ever been applied. What is missing is execution and verification, not implementation.
- **Email alerts delivered:** `actions/send-email.ts` calls `resend.emails.send` and is invoked by the budget-alert and monthly-report Inngest functions, which also write `budget.lastAlertSent` (`lib/inngest/functions.ts:86`). No send has succeeded in this environment (`RESEND_API_KEY` absent, `pnpm email` unrunnable), so delivery remains unproven.
- **Receipt upload (storing the file):** Gemini OCR is built and user-reachable (`scanReceipt` → `scan-receipt.tsx`, rendered at `add-transaction-form.tsx:136`), but the receipt itself is never stored: `receiptUrl` stays `null` on scanned transactions, no upload endpoint or bucket exists, and the OCR call has never succeeded (`GEMINI_API_KEY` absent). See SERVICE ARCHITECTURE → HTTP surface.
- **Transaction export:** `GET /api/transactions?from=X&to=Y&format=csv` — export date range as CSV. Not built.
- **Analytics dashboard:** Charts for spending by category, trends over time. Currently only "recent transactions" are shown.
- **Tests beyond the unit tier:** the unit tier exists (`tests/`, `pnpm test`). Integration and e2e tests do not exist, and no page, server action, API route, `proxy.ts` or Inngest function is covered — coverage of the app's behaviour is effectively 0%. See CODE STANDARDS (Testing section).
- **Multi-user sharing:** No shared budgets or collaborative features.
- **Mobile app:** Web-only for MVP.
- **Lint census decides CI's fourth gate:** `pnpm lint` reports pre-existing `import/order` and
  `react-hooks/set-state-in-effect` errors. Until that is decided, `.github/workflows/ci.yml` cannot add the lint
  step the template's `### Review gate` requires ("CI runs the same commands"). Options: autofix as a standalone
  commit, fix the one hook error (a behaviour change), downgrade `import/order` to `warn`, or keep this repo's
  written exception under that heading. How far the autofix option actually gets is measured, not assumed: the run
  prints `86 errors and 0 warnings potentially fixable with the --fix option`, so the whole `import/order` half of
  the census would clear and the `react-hooks/set-state-in-effect` error would not — which is why "autofix" and
  "fix the one hook error" are two different commits. Running `--fix` is not this round's scope: it rewrites
  source files.
- **Rotting literals are still in the instruction layer.** The no-new-counts rule that governs them was written by
  this unit into `/testing` and `/verification-gates`, while the counts still sitting in these bodies came from the
  Plan A Progress Tracker that the tracker cut deleted — two owners, neither of them this body — and `AGENTS.md`
  §13, `docs/agent-guide/service-architecture.md` § Verification, `docs/agent-guide/code-standards.md` § Testing and
  § Language strictness there quote test, error and file counts because a baseline has to live somewhere. Deciding
  where (a generated census file? the CI log?) is its own unit.
- **`engines.node` is undeclared** while Next 16 and Clerk 7 both need `>=20.9.0` and CI pins Node 20 by hand.
  Blocks: a reproducible "which runtime" answer for a new clone.
- **The seed endpoint is an unauthenticated `GET` that writes rows.** Blocks: any deploy that is not local.
- **One auth gate, not two `checkUser` functions.** `lib/checkUser.ts` resolves-or-creates the `users` row and returns `null` —
  including when the Prisma read or write throws, so a database failure is indistinguishable from a signed-out visitor — and
  both of its page-side callers discard the value; `actions/lib/checkUser.ts` throws `Unauthorized`. Plan B §2c consolidates
  them into one session source with one failure contract. Blocks: any claim that a page checks auth, and Plan B's
  `parseInput` boundary, which needs a single place to read the `userId` from.
- **`@react-email/components` is deprecated upstream and `@react-email/ui` is absent,** so `pnpm email` cannot
  run. Blocks: proving `emails/template.tsx` renders; needs a replacement decision.
- **The account chart groups by a date label that drops the year**
  (`app/(main)/account/_components/account-chart.tsx:67`, re-parsed at `:83-84`), so a Dec 31 from two years
  merges into one bar and a December-to-January window mis-orders it. Fixing it changes chart output.
- **Page changes never suppressed scrolling:** `components/pagination.tsx:31` calls `router.push(url)` with no
  options after Plan A deleted a dead argument. Whether to pass `{ scroll: false }` for real is a behaviour
  decision.
- **A stray paste sits in user-visible copy:** `app/(main)/dashboard/_components/budget-progress.tsx:60` toasts
  `error.message || 'Failed asdasdto update budget'`, so the string `Failed asdasdto update budget` is what a user
  reads on a failed budget update whenever `error.message` is empty. It is still open because the component is one
  of the props-inferred dashboard files (see `docs/agent-guide/ui.md` → Per-component conventions) that no app-tier test covers,
  so editing its copy has no gate; and because `useFetch` already toasts `error.message` itself
  (`hooks/use-fetch.ts:26-28`), which means this effect fires a second toast for the same failure — whether to
  drop the effect or keep it as the only toast is a behaviour decision, not a string edit. Blocks: claiming the
  dashboard's failure copy is verified.
- **`motion@^14.1.0` is an unused dependency:** listed in `package.json`, and a `git grep` for imports from
  `motion` across the tracked `.ts`/`.tsx` tree returns nothing, so no module imports it. It stays because dropping
  a dependency edits `package.json` and the lockfile, which is the user's call (`pnpm remove motion`), not a docs
  round's. Blocks: an accurate dependency inventory — every install, build and lockfile diff still carries a
  package nothing uses.
- **`components/header.tsx` was owned by no Plan A task.** It takes no props (`const Header` at
  `components/header.tsx:8`), so what stays unannotated there is its component signature — Plan B Phase 3.
- **The env vars read through `as string` assertions** (`lib/arcjet.ts:4`, `proxy.ts:14`,
  `actions/transaction.ts:12`, `lib/inngest/functions.ts:217`, `actions/seed.ts:8-9`) are a type-lie;
  `experimental.typedEnv` or a Zod env schema is the honest fix. Blocks: trusting the config surface.
- **The checker does not pin its own doc.** The health-check grep is a literal in three places across the two
  homes — `AGENTS.md` twice (the header block and the `## Health check` stub) and `docs/agent-guide/editing.md`
  once — and nothing asserts they still equal the template's literal one-liner, so a bracket-free `grep -v`
  exemption could return without failing the slot check. Blocks: the health check staying honest without a human
  reading it.
- **The env-inventory assertion scans both whole homes — `AGENTS.md` and every body in `docs/agent-guide/` — not
  §16 and the file-organization tree as the design scoped it,** so it claims every upper-case-with-underscore token
  in prose as a variable `.env.example` must inventory.
  Together with the slot check that forbids angle brackets, the only placeholder form the instruction layer can use is
  lowercase snake_case (`--name migration_name`). Blocks: any future placeholder in `AGENTS.md`, and any task
  that wants a normal shell metavariable.
- **The structure gate compares this repo to a snapshot of the template, not to the template:** the fixture is
  committed, so what CI polices is `AGENTS.md` against that copy. The one assertion that does read the sibling
  template is conditional on the checkout being present on the machine running the test, so on CI it returns
  before comparing anything and the template can be edited freely with nothing failing here. Provenance measured
  2026-10-13 rather than retyped from the design note — the template is not a git checkout at all, so its identity
  is a content hash rather than a commit: `git -C ../agent-ready-template rev-parse` reports not a repository, and
  that directory's AGENTS.md is 517 lines, 21,607 bytes, sha256 prefix ccc3027465a95481, modified 2026-10-12.
  Refreshing the snapshot is `pnpm skeleton:refresh`, which regenerates the fixture from that same sibling.
  Blocks: any claim that CI checks conformance to the template as the template evolves.
- **Where the Inngest job should run is undecided** — local dev, an external worker, or a serverless function.
  Blocks: giving `lib/inngest/functions.ts` an environment where a schedule can actually fire.

---

