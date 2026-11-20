## Development Workflow

### Loop, per unit

1. Read what governs the change (STANDING RULES, then the body for the touched module).
2. State scope in one sentence — what changes, what does not.
3. Smallest verifiable increment.
4. Verify with commands (`/verification-gates`), never a claim.
5. Update docs the change made untrue, same change.
6. Report: changed / verified / unknown.

Full loop + scoping rules: `/development-workflow` skill.

### Read order

STANDING RULES → `overview.md` → `architecture.md` → `ui.md` → `code-standards.md` → this file → `pm-conventions.md`. Then `service-architecture.md`.

### Commands

| Need      | Command                                                                                                                                                                                                    |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dev       | `pnpm dev` — Turbopack, :3000. Arcjet out of path (commented in `proxy.ts`); pages answer locally                                                                                                          |
| Seed      | `pnpm db:seed` — `node scripts/seed-demo.ts`. **Destructive:** deletes every `transaction`/`budget`/`account` row (users kept), writes a deterministic seven-month ledger per `users` row                  |
| Typecheck | `pnpm typecheck` — `tsc --noEmit` (TS 7.0.2, whole tree). `pnpm build` type-checks the same tree                                                                                                           |
| Test      | `pnpm test` — unit tier; `pnpm test:integration` — real DB; `pnpm test:e2e` — Playwright                                                                                                                   |
| Lint/fmt  | `pnpm lint` — `vp check` (format + lint, non-mutating). Formatter alone: `vp fmt` (writes; `--check` to only report). Pre-commit hook runs `vp staged`. Config in `vite.config.ts`; no `eslint.config.mjs` |
| Verify    | `pnpm verify` — `test` → `test:integration` → `typecheck` → `lint` → `build` → `test:e2e` — the full gate chain                                                                                            |
| Build     | `pnpm build` — Turbopack; type-checks, does not lint                                                                                                                                                       |
| Prisma    | `pnpm exec prisma generate`; `prisma migrate dev --name migration_name`; `prisma studio`                                                                                                                   |
| Email dev | Not runnable — no `email` script, `@react-email/ui` not installed                                                                                                                                          |

Totals for test/check → `service-architecture.md` Verification.

`package.json`: **no `engines`**, `packageManager pnpm@12.11.2`; `.node-version`/`.nvmrc`/`.npmrc` absent → no version pin, no `engine-strict`. Here: pnpm 12.11.2 on Node 26.8.2 (measured 2026-10-16). Vite+ (`vp`, `vite-plus`) owns install/format/lint/test; Next driven by `pnpm dev`/`pnpm build`. CI: `vp install --frozen-lockfile` → `vp check` → `vp test` → `vp run build` on Node 24.

Harness: `.claude/settings.json` (`permissions.allow/deny/ask`), `.claude/agents/reviewer.md` (read-only reviewer), `.claude/skills/*/SKILL.md`. No hooks gate edits or commits.

### Where logic goes

- `actions/lib/checkUser.ts` — Better Auth session seam. `currentUser()` reads the session; `checkUser()` throws when signed out; `requireUser()` redirects pages to `/sign-in`.
- `lib/prisma.ts` — all Prisma calls through this singleton (Prisma 7 needs the `@prisma/adapter-pg` adapter).
- `app/(main)/` — ledger pages. `proxy.ts` validates guarded paths; layout and page guards enforce signed-in access.
- `app/api/` — `/api/transactions` and `/api/receipts` gate via `checkUser`; `/api/inngest` is signed by Inngest. A new protected route must state its check.
- `lib/schema.ts` — Zod for forms + API input.
- `proxy.ts` — root hook (Next 16 renamed from `middleware.js`). Validates Better Auth sessions on guarded paths; decisions are in `lib/route-guard.ts`.

### Framework drift

See `code-standards.md` → Framework rules. Do not duplicate Next 16 gotchas here.

### Schema changes

`postinstall` runs `prisma generate` only — migrations are not auto-applied. CLI datasource from `prisma.config.ts` (`DIRECT_URL` else `DATABASE_URL`); Prisma 7 no longer reads `url`/`directUrl` from the schema nor loads `.env*`.

Add a column: edit `prisma/schema.prisma` → `pnpm exec prisma migrate dev --name migration_name` (snake_case) → commit the generated file. Never edit applied migrations; fix with a new one.

### Data today

One seed path:

- `pnpm db:seed` (`scripts/seed-demo.ts`) — resets only the demo account's ledger, then writes its deterministic seven-month sample data. See `lib/demo.ts` and `scripts/seed-demo.ts`.

### Before next unit

1. Unit works end-to-end inside the stated scope.
2. No ARCHITECTURE invariant violated.
3. `specs/` reflects what happened.
4. Gate chain green — run it, quote output. Anything not run stays labelled unverified.
