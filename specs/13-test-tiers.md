# 13 — Per-feature test tiers

## Goal

Every feature ships with unit, integration, and e2e tests in `tests/{feature}/{unit,integration,e2e}/`. No feature is "done" with only unit coverage.

## Solution

Restructure tests/ to mirror feature × tier. Unit stays pure (no DB). Integration hits a real test DB via Prisma. E2E runs Playwright against the dev server. CI runs all three tiers.

## User stories

1. As a developer, I want a unit test for every reducer/schema, so regressions are caught fast.
2. As a developer, I want integration tests for actions/routes, so wiring regressions ship red.
3. As a reviewer, I want e2e coverage of auth and transaction flows, so user-visible breakage is caught.

## Implementation decisions

- Directories: `tests/{feature}/{unit,integration,e2e}/`.
- Unit: pure modules, no DB, `vp test`.
- Integration: real Postgres test DB, Prisma migrate reset, `pnpm test:integration`.
- E2E: Playwright, `pnpm test:e2e`.
- CI gate runs all tiers.

## Testing decisions

- Unit tests external behavior only.
- Integration tests actions + routes against DB.
- E2E tests user flows.

## Out of scope

- Rewriting existing unit tests (move only).
- Coverage thresholds.

## Further notes

Follows existing `tests/auth/unit/` convention.
EOF
filePath=/Users/jkingz/Downloads/JKINGZ_FILES/_projects/trackXpense/specs/13-test-tiers.md
