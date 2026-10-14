---
description: Test organization, tier definitions, and how to run tests
when: "user needs to write, run, or update tests; asks about test structure, coverage, or mocking"
---

# Testing

## What exists today

`pnpm test` is `TZ=UTC vitest run`. The **unit tier is populated** — `tests/money/unit/`,
`tests/validation/unit/` and `tests/platform/unit/` (the instruction-layer checker, run alone with
`pnpm check:docs`). `integration` and `e2e` do not exist: no runner entry for them, and
`jsdom`, `@testing-library/react` and `playwright` are not in `package.json`.

Most tests present are **characterisation**: they pin what the code does today, including two recorded
defects (see `docs/agent-guide/code-standards.md` § Testing), so a green run is not an endorsement of that behaviour. The
instruction-layer checker in `tests/platform/unit/` is the exception — it reads this repo's own guidance files
(`AGENTS.md`, `docs/agent-guide/`, `docs/standing-rules/`, `.claude/skills/`, `.env.example`) off disk and asserts they agree, so it pins no application
behaviour and needs no database.

Never write a **suite total** into this file, and add none to the instruction layer outside its two recorded
baselines — `docs/standing-rules/13-verification-gates.md` gate 2 and
`docs/agent-guide/service-architecture.md` § Verification, which are refreshed
from command output whenever the suite moves. A total typed
anywhere else is wrong the day the next test lands. Per-file counts — the `(6)`, `(4)`, `(9)` labels in
`docs/agent-guide/code-standards.md` § Testing — name one file, not the suite, so they are outside this rule. Run the command and quote
its output in the reply.

## `TZ=UTC` is load-bearing

It lives in the npm script, not in a config file. The recurrence tests are timezone-sensitive and
fail under other local zones. Call `vitest` directly only with `TZ=UTC` prefixed.

## Organization

`tests/{feature}/{tier}/` — one folder per feature, tiers `unit`, `integration`, `e2e`. Nothing
collocated beside the module.

```
tests/
  money/unit/            # exists
  validation/unit/       # exists
  platform/unit/         # exists — instruction-layer.test.ts
  {feature}/integration/ # tier not created
```

## Import patterns

Import the subject through the `@/` alias, never relatively. `vitest.config.ts` maps `@` to the
repo root and sets `environment: 'node'`, `include: ['tests/**/*.test.ts']`.

## Mocking

- **Mock at the boundary only** — the modules that own I/O: Prisma (`lib/prisma.ts`), Clerk,
  Resend, Inngest.
- Never mock inside business logic.
- Unit tier only; integration and e2e use real dependencies.
- Nothing is mocked today — the unit tier needs no mocks.

## Running

| Need | Command |
| --- | --- |
| Whole suite | `pnpm test` |
| Instruction-layer checker alone | `pnpm check:docs` |
| One tier or file | `TZ=UTC pnpm exec vitest run tests/money/unit` |
| Watch | `pnpm test:watch` |

Prove the path filter reaches the runner before quoting it: `TZ=UTC pnpm exec vitest run
tests/nope/unit` must name the filter and the `include` glob back.

**An empty tier is not silently green here.** Vitest exits **1** with `No test files found` when a
run collects nothing (measured, not assumed), so a tier with no files reports a failure rather than
passing vacuously. Still name the tier a run actually collected when you report it.

## Coverage requirements — for tests not yet written

Every route/action covering `401` (unauthenticated), `403` (ownership), `400` (bad input), plus the
**no-data-before-auth** path — assert auth gates run before any read. Ownership needs a two-user
fixture that proves a foreign account cannot be read.

Server actions have zero coverage and cannot get it here: they need Postgres credentials this
environment does not have (`docs/standing-rules/13-verification-gates.md`, gate 5).

## Reference

- `docs/agent-guide/code-standards.md` § Testing for the inventory
- `/verification-gates` for where tests sit in the chain
- `tests/README.md` for the tier definitions
