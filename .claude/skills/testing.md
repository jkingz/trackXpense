---
description: Test organization, tier definitions, and how to run tests
when: "user needs to write, run, or update tests; asks about test structure, coverage, or mocking"
---

# Testing

## Organization

Tests live in `tests/{feature}/{tier}/` — one folder per feature, tiers `unit`, `integration`, `e2e`. Nothing collocated beside the module.

**Example structure:**

```
tests/
  auth/
    unit/
    integration/
    e2e/
  dashboard/
    unit/
    integration/
```

## Import patterns

- Import the subject through the project's path alias, **never relatively**
- Check dynamic forms: `await import("./x")` is invisible to a `from "\./"` pattern
- Example: `import { handler } from "@/routes/auth"` not `import { handler } from "../../../routes/auth"`

## Mocking

- **Mock at the boundary only** — the module paths that own I/O (file, network, database)
- Never mock inside business logic
- Unit tier only; integration and e2e use real dependencies

## Running tests

- Unit: `pnpm test`
- Integration: `pnpm test:integration` — loads `.env.local`, needs `DATABASE_URL`
- E2E: `pnpm test:e2e` — Playwright builds and starts the app
- All tiers: `pnpm test && pnpm test:integration && pnpm test:e2e`
- Prove "run one file": pass a path that must match nothing; the runner must say it collected nothing. If it runs everything and exits 0, the argument never reached the runner.

## Coverage requirements

Every route gets a test covering:

- `401` (unauthenticated)
- `403` (forbidden)
- `400` (bad request)
- **No-data-before-auth path** — verify the handler checks auth before reading data

Ownership/isolation needs a two-tenant fixture that proves a foreign id cannot be read.

## Empty or credential-gated tiers

Opt-in and empty tiers exit 0 — report which tier the run actually covered in your verification output.

## What's NOT tested yet

- `<list components, e2e, migrations, or other areas not yet covered>`

## Reference

See CODE STANDARDS § Testing in AGENTS.md for integration with the full verification chain.
