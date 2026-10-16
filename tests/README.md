# Tests

Unit tier only: `tests/**/*.test.ts`, run with `./node_modules/.bin/vp test` (Vitest 5 via Vite+, config in `vite.config.ts`, `environment: node`). No `test` script in `package.json`; no `integration`/`e2e` tier.

```
tests/
├── hooks/unit/          # use-fetch reducer
├── money/unit/          # calculateNextRecurringDate, serializeAmount
├── recurring/unit/      # recurring lifecycle
├── transactions/unit/   # transaction-table reducer
└── validation/unit/     # Zod schemas
```

## Rules

- One folder per feature; tiers are `unit`/`integration`/`e2e` — only `unit` exists.
- Tests never sit beside source files.
- Import through the `@` alias (repo root), never relatively.

## Adding tests

- New behavior gets a test in the same change.
- Verify by count, not color: totals live in `docs/agent-guide/service-architecture.md` Verification, not here.

## What no test here can prove

`DATABASE_URL`/`DIRECT_URL` are absent, so nothing touching `lib/prisma.ts` runs. The money path — auth → create account → log transaction → balance — has zero coverage here. See `docs/agent-guide/pm-conventions.md` Review gate 5.
