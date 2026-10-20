# Test Tiers (Integration + E2E)

UI: n/a

## Goal

Add integration and e2e test tiers beyond unit; CI runs all three.

## UI: n/a

## Increments

1. Add integration tier: Vitest + test DB, actions/routes covered. Touches: `vitest.config.ts`, `tests/integration/**`, CI.
2. Add e2e tier: Playwright, smoke flows. Touches: `playwright.config.ts`, `tests/e2e/**`, CI.
3. Wire CI gates. Touches: `.github/workflows/ci.yml`.

### First increment scope

- **Files**: `vitest.config.ts`, `tests/integration/**`
- **Test**: first integration test (health or transaction)
- **Done when**: `pnpm test:integration` runs against test DB

## Deferred / open questions

- Test DB provisioning (Neon branch vs local Postgres).
- Playwright browser install in CI.

## Security / permissions

n/a

## Verification

- `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`
- Unverified: flakiness, runtime