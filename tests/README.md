# Tests

Three tiers, one folder per feature: `tests/{feature}/{unit,integration,e2e}/`.

| Tier        | Glob                                | Command                 |
| ----------- | ----------------------------------- | ----------------------- |
| unit        | `tests/**/unit/**/*.test.ts`        | `pnpm test`             |
| integration | `tests/**/integration/**/*.test.ts` | `pnpm test:integration` |
| e2e         | `tests/**/e2e/**/*.spec.ts`         | `pnpm test:e2e`         |

Vitest via Vite+ (`vp test`, config in `vite.config.ts`); e2e via Playwright (`playwright.config.ts`). `tests/integration/` holds cross-feature DB checks.

## Rules

- Tests never sit beside source files.
- Import through the `@` alias (repo root), never relatively.

## Adding tests

- New behavior gets a test in the same change.
- Verify by count, not color: totals live in `docs/agent-guide/service-architecture.md` Verification, not here.

## What no test here can prove

`DATABASE_URL`/`DIRECT_URL` are absent, so nothing touching `lib/prisma.ts` runs. The money path — auth → create account → log transaction → balance — has zero coverage here. See `docs/agent-guide/pm-conventions.md` Review gate 5.
