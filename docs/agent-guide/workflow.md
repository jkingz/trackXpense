## Development Workflow

### Loop, per unit

1. Read what governs the change (STANDING RULES, then the body for the touched module).
2. State scope in one sentence — what changes, what does not.
3. Smallest verifiable increment.
4. Verify with commands (`/verification-gates`), never a claim.
5. Update docs the change made untrue, same change.
6. Report: changed / verified / unknown.

Full loop + scoping rules: `/development-workflow` skill.

### Build pipeline

Stages, one command each. Enforced by the harness, not by convention.

| Stage      | Command                  | Leaves behind                                            |
| ---------- | ------------------------ | -------------------------------------------------------- |
| planned    | `/plan specs/NN-slug.md` | `specs/NN-slug.md`                                       |
| designed   | `/design`                | `specs/NN-slug.design.md`, or `UI: n/a` in the spec      |
| decomposed | `/tickets`               | ordered increments in the spec                           |
| building   | `/build <n>`             | the increment + its unit test                            |
| verified   | `/verify`                | a green `pnpm verify`                                    |
| reviewed   | `/review-changes`        | `specs/NN-slug.review.md`, `Verdict: pass`, no open High |

Then commit, then `/next` for the next increment. `/pipeline` prints the stage; `/pipeline-reset` clears it. State lives in `.opencode/pipeline-state.json` (gitignored).

Enforced: product-source edits are refused before `building`; `git commit` is refused until `pnpm verify` is green for the current code and a review report postdates that code with no open High. Docs-only trees (`specs/`, `docs/`, `AGENTS.md`, `CLAUDE.md`, `.claude/`, `.opencode/`, `opencode.json`) are exempt from the commit gate and editable at any stage.

### Harness support

One gate, two adapters. Both call `lib/pipeline-runtime.ts`, so the rules cannot drift apart.

|              | OpenCode                                                             | Claude Code                                            |
| ------------ | -------------------------------------------------------------------- | ------------------------------------------------------ |
| Machine      | `lib/pipeline-state.ts`, `-guard.ts`, `-artifacts.ts`, `-runtime.ts` | same                                                   |
| Adapter      | `.opencode/plugins/pipeline.js` (V2 plugin API)                      | `scripts/pipeline-gate.ts` (hook CLI)                  |
| Wiring       | `ctx.tool.hook(...)`, `ctx.command.transform`                        | hooks in `.claude/settings.json`                       |
| Stage gate   | hook on command execute                                              | `UserPromptExpansion`, matched on command name         |
| Edit gate    | `tool.execute.before` on edit tools                                  | `PreToolUse` on `Write\|Edit`                          |
| Commit gate  | `tool.execute.before` on the `shell` tool                            | `PreToolUse` on `Bash` with `if: Bash(git commit *)`   |
| Verify gate  | `tool.execute.after` (exit code in metadata)                         | `PostToolUse` / `PostToolUseFailure`                   |
| Permissions  | `opencode.json` → `permissions` array                                | `.claude/settings.json` → `permissions.allow/deny/ask` |
| Review agent | `agents.reviewer` in `opencode.json`                                 | `.claude/agents/reviewer.md`                           |
| Commands     | registered by the plugin from `.claude/commands/*.md`                | discovered natively from `.claude/commands/*.md`       |

Command names are shared, so the two harnesses cannot diverge mid-flow. Two are not `review`/`reset`: `/review` is a bundled **alias** of `/code-review`, and `/reset` is a built-in alias — Claude Code replaces a built-in but never its aliases, so both names would silently keep running the bundled behaviour. `/review-changes` and `/pipeline-reset` are unclaimed.

Escape hatch: `OPENCODE_PIPELINE=off opencode`. For Claude Code, disable the hook group in `.claude/settings.json` — a hook cannot read an env switch, since a command that could set the switch could also disable the gate.

Machine: `lib/pipeline-*.ts`. Tests: `tests/pipeline/unit/` (the pure modules only). The two adapters are I/O and have no committed tests — `tests/` is unit-only.

Measured 2026-10-17: opencode v2.0.30 — 34/34 plugin checks, plus a live session where a `write` to `lib/health.ts` was refused at stage `planned` and a `write` to `specs/` was allowed. Claude Code 2.1.300 — 24/24 gate-CLI checks driving real hook payloads through a child process per event. The Claude Code hooks were **not** exercised in a live session: the CLI could not reach its API here (model `dev`, `ECONNREFUSED`). Harnesses are throwaway, not committed.

### Read order

STANDING RULES → `overview.md` → `architecture.md` → `ui.md` → `code-standards.md` → this file → `pm-conventions.md`. Then `service-architecture.md`.

### Commands

| Need      | Command                                                                                                                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dev       | `pnpm dev` — Turbopack, :3000. Arcjet out of path (commented in `proxy.ts`); pages answer locally                                                                                         |
| Seed      | `pnpm db:seed` — `node scripts/seed-demo.ts`. **Destructive:** deletes every `transaction`/`budget`/`account` row (users kept), writes a deterministic seven-month ledger per `users` row |
| Typecheck | `pnpm typecheck` — `tsc --noEmit` (whole tree). `pnpm build` type-checks the same tree                                                                                                    |
| Test      | `pnpm test` — Vitest via Vite+, `tests/**/*.test.ts`                                                                                                                                      |
| Lint/fmt  | `pnpm lint` — `vp check` (format + lint, non-mutating). Formatter alone: `vp fmt [--fix]`. Pre-commit hook runs `vp check --fix`. Config in `vite.config.ts`; no `eslint.config.mjs`      |
| Verify    | `pnpm verify` — `test` → `typecheck` → `lint` → `build`, the chain the pipeline records                                                                                                   |
| Build     | `pnpm build` — Turbopack; type-checks, does not lint                                                                                                                                      |
| Prisma    | `pnpm exec prisma generate`; `prisma migrate dev --name migration_name`; `prisma studio`                                                                                                  |
| Email dev | Not runnable — no `email` script, `@react-email/ui` not installed                                                                                                                         |

Totals for test/check → `service-architecture.md` Verification.

`package.json`: **no `engines`**, `packageManager pnpm@12.11.2`; `.node-version`/`.nvmrc`/`.npmrc` absent → no version pin, no `engine-strict`. Here: pnpm 12.11.2 on Node 26.8.2 (measured 2026-10-16). Vite+ (`vp`, `vite-plus`) owns install/format/lint/test; Next driven by `pnpm dev`/`pnpm build`. CI: `vp install --frozen-lockfile` → `vp check` → `vp test` → `vp run build` on Node 24.

Harness: `opencode.json` holds the permission ladder (`permissions` array of `{action, resource, effect}`; deny destructive git/`rm`/`--no-verify`, ask the rest) and the read-only `reviewer` subagent under `agents`. Claude Code: `.claude/settings.json` (hooks + `permissions.allow/deny/ask`) and `.claude/agents/reviewer.md`. Shared prompt bodies: `.claude/commands/*.md`.

The plugin targets the V2 plugin API — default-exports `{ id, setup(ctx) }`, registers hooks with `ctx.tool.hook("execute.before" | "execute.after", ...)`, commands with `ctx.command.transform`. A V1 plugin function does not run in V2. Two V2 facts the guards depend on: the shell tool is named `shell` (not `bash`) and edit tools carry `input.path` (not `filePath`). V2 has no global `command.execute.before` hook, so the plugin owns the commands and reads each prompt body from `.claude/commands/`. `Plugin.define` is only a typed identity helper, so nothing is imported and the plugin stays dependency-free. It is `.js` on purpose: `tsconfig.json` includes `**/*.ts`, so a typed plugin would drag `@opencode/plugin` into `pnpm typecheck`.

`scripts/pipeline-gate.ts` is `.ts` run directly by `node`, which strips types natively (measured on Node 26.8.2). Relative imports inside `lib/` therefore carry explicit `.ts` extensions — Node will not resolve them otherwise. Hooks pass `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON` because the root `package.json` has no `"type"`.

### Where logic goes

- `lib/checkUser.ts` — session→row provisioning; only caller (`AuthSlot`) unrendered → unreachable. Returns `null`, never redirects. `actions/lib/checkUser.ts` — the identity seam: session row, else demo owner (`lib/demo-identity.ts`). `auth()` read only here; no auth logic elsewhere. Keep: fallback is read-then-create, not `upsert` (upsert makes Prisma compute `@default(uuid())` even when the row exists; Cache Components refuses that unstable value during prerender → `blocking-prerender-crypto`, an error boundary per page). A session with no row throws `User not found`.
- `lib/prisma.ts` — all Prisma calls through this singleton (Prisma 7 needs the `@prisma/adapter-pg` adapter).
- `app/(main)/` — ledger pages. Read whoever the seam resolves. `app/(main)/layout.tsx` does no auth; `proxy.ts` redirect commented out → nothing protects them.
- `app/api/` — `/api/seed` runs no gate (unauth `GET` that writes); `/api/inngest` is signed by Inngest. A new protected route must state its check.
- `lib/schema.ts` — Zod for forms + API input.
- `proxy.ts` — root hook (Next 16 renamed from `middleware.js`). Exports `clerkMiddleware` alone; Arcjet + session-less `redirectToSignIn()` commented out with restore steps in-file.

### Framework drift

See `code-standards.md` → Framework rules. Do not duplicate Next 16 gotchas here.

### Schema changes

`postinstall` runs `prisma generate` only — migrations are not auto-applied. CLI datasource from `prisma.config.ts` (`DIRECT_URL` else `DATABASE_URL`); Prisma 7 no longer reads `url`/`directUrl` from the schema nor loads `.env*`.

Add a column: edit `prisma/schema.prisma` → `pnpm exec prisma migrate dev --name migration_name` (snake_case) → commit the generated file. Never edit applied migrations; fix with a new one.

### Data today

Two seed paths; only one has run.

- `pnpm db:seed` (`scripts/seed-demo.ts`) — the demo ledger. Wipe is unscoped: deletes every `transaction`/`budget`/`account` row (users kept), then writes a deterministic seven-month ledger (`mulberry32` seeded from each identity) for **every `users` row** — demo owner upserted first, signed-in Clerk identity seeded too (session outranks the fallback). Each identity: four accounts, one budget of 2900, per-account balances recomputed from `opening + income − expense`. Recurring rows get `lastProcessed`, `nextRecurringDate` only when the next occurrence is still future → cron selects none (`lib/inngest/functions.ts:171-185`). All in one `db.$transaction`; failure keeps prior data. Measured 2026-10-16: 2 users, 8 accounts, 402 transactions, 2 budgets; 4 `PENDING`, 0 future-dated, 0 cron-selectable.
- `curl /api/seed` (`app/api/seed/route.ts` → `actions/seed.ts`) — unauth `GET` that writes; reads `ACCOUNT_ID`/`USER_ID` via `as string` (`actions/seed.ts:10-11`) declared in `.env.example` but set nowhere here. Never exercised. Unverified — prefer `pnpm db:seed`.

### Before next unit

1. Unit works end-to-end inside the stated scope.
2. No ARCHITECTURE invariant violated.
3. `specs/` reflects what happened.
4. Gate chain green — run it, quote output. Anything not run stays labelled unverified.
