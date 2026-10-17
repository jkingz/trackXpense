# Tests

Unit tier only: `tests/**/*.test.ts`, run with `pnpm test` (`vp test` — Vitest 5 via Vite+, config in `vite.config.ts`, `environment: node`). No `integration`/`e2e` tier.

```
tests/
├── hooks/unit/          # use-fetch reducer
├── money/unit/          # calculateNextRecurringDate, serializeAmount
├── pipeline/unit/       # stage machine, path/commit guards, artifact parsers
├── recurring/unit/      # recurring lifecycle
├── transactions/unit/   # transaction-table reducer
└── validation/unit/     # Zod schemas
```

## Rules

- One folder per feature; tiers are `unit`/`integration`/`e2e` — only `unit` exists.
- Tests never sit beside source files.
- Import through the `@` alias (repo root), never relatively.
- No test imports a harness adapter (`.opencode/plugins/pipeline.js`,
  `scripts/pipeline-gate.ts`). Their decisions are tested here through the
  `lib/pipeline-*.ts` reducers they call; the adapters only do I/O. See
  `docs/agent-guide/target-state.md` for what that leaves unproven.

## Adding tests

- New behavior gets a test in the same change.
- Verify by count, not color: totals live in `docs/agent-guide/service-architecture.md` Verification, not here.

## What no test here can prove

`DATABASE_URL`/`DIRECT_URL` are absent, so nothing touching `lib/prisma.ts` runs. The money path — auth → create account → log transaction → balance — has zero coverage here. See `docs/agent-guide/pm-conventions.md` Review gate 5.
