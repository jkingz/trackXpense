# Tests

Tier state in this repo, as of the Plan A close: `unit` is populated, `integration` and `e2e` are
not created — no runner entry, and `jsdom`, `@testing-library/react` and `playwright` are not
installed. `pnpm test` therefore exercises the unit tier only.

```
tests/
├── money/unit/            # exists
├── validation/unit/       # exists
└── {feature-name}/
    ├── integration/       # not created — needs Postgres credentials
    └── e2e/               # not created — needs a browser tier
```

## Test organization

- **One folder per feature** — matches the domain/module it protects
- **Three tiers** — `unit`, `integration`, `e2e`
- **Nothing beside the module** — tests never live next to source files
- **Import through aliases** — never relatively; `vitest.config.ts` maps `@` to the repo root

## Test tier definitions

- **unit** — mock at I/O boundaries only; fast, no external services
- **integration** — real database/APIs; test boundaries between modules
- **e2e** — full user flows; browser/HTTP client against a running app

## Running tests

`pnpm test` (`TZ=UTC vitest run`). `TZ=UTC` is part of the script and is load-bearing — the
recurrence tests fail under other local zones.

## An empty tier is not silently green

Vitest exits **1** with `No test files found` when a run collects nothing, so a tier with no files
reads as a failure here rather than passing vacuously. Whichever way it falls, **report the tier a
run actually collected** — a green suite says nothing about coverage unless you name its files.

## Adding tests

- New behavior gets a new test in the same change
- Routes need: 401 (no auth), 403 (ownership), 400 (bad input)
- Ownership/tenancy needs: two-tenant fixture proving isolation
- Verify moves by count, not color — record totals before/after, in the reply, not in this file

## What no test here can prove

`DATABASE_URL`/`DIRECT_URL` are absent, so nothing touching `lib/prisma.ts` executes. The money
path — auth → create account → log transaction → balance — has zero coverage and cannot get any in
this environment. See AGENTS.md § Progress Tracker → Blockers.
