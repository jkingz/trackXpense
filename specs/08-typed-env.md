# Typed Env

## Goal

Env vars are validated at startup via a Zod schema; no `process.env.X as string` type-lies remain.

## UI: n/a

## Increments

1. Add `lib/env.ts` Zod schema + parsed `env` export for all vars. Touches: `lib/env.ts`.
2. Replace `as string` reads in `lib/arcjet.ts`, `actions/transaction.ts`, `lib/inngest/functions.ts`, `actions/seed.ts`, `proxy.ts`. Touches those files.
3. Add build-time check that missing required vars fail build.

### First increment scope

- **Files**: `lib/env.ts`
- **Test**: `tests/lib/env.test.ts`
- **Done when**: `env` typed and validates at import

## Deferred / open questions

- Which vars required vs optional (demo vs prod).
- Whether to use `experimental.typedEnv`.

## Security / permissions

n/a — config surface.

## Verification

- `pnpm typecheck`, `pnpm build`
- Unverified: runtime validation in prod
