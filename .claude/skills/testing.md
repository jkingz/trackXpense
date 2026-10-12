---
description: Test organization, tier definitions, and how to run tests
when: "user needs to write, run, or update tests; asks about test structure, coverage, or mocking"
---

# Testing

## Current status

Tests do not yet exist in trackXpense. This skill documents the structure for when tests are added.

See TARGET STATE in AGENTS.md for the testing roadmap.

## Organization (when tests are added)

Tests will live in `tests/{feature}/{tier}/` — one folder per feature, tiers `unit`, `integration`, `e2e`. Nothing collocated beside the module.

**Example structure:**
```
tests/
  auth/
    unit/
    integration/
  dashboard/
    unit/
    integration/
  transactions/
    unit/
    integration/
    e2e/
```

## Import patterns

- Import the subject through the project's path alias (if configured), or relative paths
- Example: `import { handler } from "@/actions/transactions"` or `import { handler } from "../../../actions/transactions"`

## Mocking

- **Mock at the boundary only** — modules that own I/O (Prisma, Clerk, Resend, Inngest)
- Never mock inside business logic
- Unit tier only; integration and e2e use real dependencies

## Running tests (template)

When tests are added, these commands will apply:

- All tiers: `pnpm test`
- One tier only: `pnpm test:unit tests/auth/unit` (example)
- Prove "run one file": pass a path that must match nothing; the runner must say it collected nothing.

## Coverage requirements

Every route/action gets a test covering:
- `401` (unauthenticated, if auth-gated)
- `403` (forbidden, if ownership-gated)
- `400` (bad request)
- **No-data-before-auth path** — verify auth gates run before data reads

Ownership/isolation needs a two-user fixture that proves a foreign account cannot be read.

## What's NOT tested yet

- All features — no test framework installed yet
- See TARGET STATE in AGENTS.md for the testing roadmap

## Reference

See CODE STANDARDS § Testing in AGENTS.md for integration with the full verification chain.
