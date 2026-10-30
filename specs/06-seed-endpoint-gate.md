# Seed Endpoint Gate

## Status

Resolved by deletion: `app/api/seed` and `actions/seed.ts` no longer exist (measured 2026-10-30). No gate needed.

## Goal

`GET /api/seed` no longer writes rows in production; it is disabled (or gated) outside local dev.

## UI: n/a

## Increments

1. Guard `app/api/seed/route.ts` to return 404 unless `NODE_ENV === "development"` (or a dev flag). Touches: `app/api/seed/route.ts`. Test: `tests/health/unit/seed-gate.test.ts` (or new `tests/api/seed-gate.test.ts`).
2. Add env-based allowlist (`SEED_ENABLED`) as override. Touches: `app/api/seed/route.ts`, `.env.example`/docs. Test: same.
3. Remove seed from production build routes (optional).

### First increment scope

- **Files**: `app/api/seed/route.ts`
- **Test**: `tests/api/seed-gate.test.ts`
- **Done when**: non-dev request → 404; dev request → seeds as before

## Deferred / open questions

- Whether to delete the endpoint entirely vs gate it.
- Auth-based gating (admin only) deferred until auth gate lands.

## Security / permissions

Who may do it: dev environment only. Single authority: `app/api/seed/route.ts` checks `process.env.NODE_ENV`. No user identity involved.

## Verification

- `pnpm typecheck` → clean
- `pnpm build` → route still listed
- Manual: curl in dev → 200; `NODE_ENV=production` → 404
- Unverified: automated test (none for route handlers currently)
