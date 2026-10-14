# Tests

Tier state in this repo, as of the Plan A close: `unit` is populated, `integration` and `e2e` are
not created — no runner entry, and `jsdom`, `@testing-library/react` and `playwright` are not
installed. `pnpm test` therefore exercises the unit tier only.

```
tests/
├── money/unit/            # exists
├── validation/unit/       # exists
├── platform/unit/         # exists
├── platform/fixtures/     # exists — agents-md-skeleton.txt
├── platform/scripts/      # exists — refresh-skeleton.mjs
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
- **platform/unit** — the instruction-layer checker (`instruction-layer.test.ts`): AGENTS.md heading parity
  with `../agent-ready-template`, slot-free health check, citation resolution, skill-pointer and env-inventory
  agreement. It reads files off disk; nothing it asserts needs a database.

## Running tests

`pnpm test` (`TZ=UTC vitest run`). `TZ=UTC` is part of the script and is load-bearing — the
recurrence tests fail under other local zones.

## An empty tier is not silently green

Vitest exits **1** with `No test files found` when a run collects nothing, so a tier with no files
reads as a failure here rather than passing vacuously. Whichever way it falls, **report the tier a
run actually collected** — a green suite says nothing about coverage unless you name its files.

`tests/platform/unit/` is populated: `instruction-layer.test.ts` checks this repo's own guidance files, so a
wrong path, a dangling skill pointer or an undocumented env var fails `pnpm test` (and therefore CI gate 2).
Run it alone with `pnpm check:docs`.

## Adding tests

- New behavior gets a new test in the same change
- Routes need: 401 (no auth), 403 (ownership), 400 (bad input)
- Ownership/tenancy needs: two-tenant fixture proving isolation
- Verify moves by count, not color — record totals before/after, in the reply, not in this file

## What no test here can prove

`DATABASE_URL`/`DIRECT_URL` are absent, so nothing touching `lib/prisma.ts` executes. The money
path — auth → create account → log transaction → balance — has zero coverage and cannot get any in
this environment. See `docs/standing-rules/13-verification-gates.md`, gate 5.
