# Rule 16 — Datastore and external service

PostgreSQL via Prisma 7. `postinstall` runs `prisma generate` only — it does **not** apply migrations. Migrations live in `prisma/migrations/`; never edit applied migrations. New migrations: run `pnpm exec prisma migrate dev --name migration_name` with a snake_case description, then commit the generated file.

Prisma 7 moved the connection out of `prisma/schema.prisma` (the datasource block declares only `provider`): the CLI reads `url` from `prisma.config.ts`, which resolves `DIRECT_URL || DATABASE_URL` through `dotenv` and falls back to `''` so `prisma generate` still works without a database. `lib/prisma.ts` must pass a driver adapter (`@prisma/adapter-pg`) — Prisma 7 no longer opens its own connection. The `client` generator stays on `prisma-client-js`: the newer `prisma-client` generator requires an `output` path and would rewrite every Prisma import in the tree, so upgrading it is a bigger blast radius than the gain.

Environment variables: `DATABASE_URL` (client connection, used by the pg adapter), `DIRECT_URL` (Prisma CLI/migrations), `CLERK_SECRET_KEY` (auth), `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (client auth key). Prisma 7 does not auto-load `.env*`; Next.js still does for the app itself.
