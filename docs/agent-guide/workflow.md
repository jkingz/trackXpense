## Development Workflow — Portable core

See `/development-workflow` skill for the complete loop, scoping rules, and verification checklist.

Quick reference:
1. Read what governs the change (STANDING RULES, then context sections)
2. State scope in one sentence
3. Implement smallest verifiable increment
4. Verify with commands (use `/verification-gates` skill)
5. Update docs the change made untrue
6. Report what changed, what was verified, what is unknown

---

## Development Workflow — Project appendix

### Read order before implementing

`STANDING RULES` → `PROJECT OVERVIEW` → `ARCHITECTURE CONTEXT` → `UI CONTEXT` → `CODE STANDARDS` → `DEVELOPMENT WORKFLOW` (portable) → `PM CONVENTIONS`. Then `AGENTS.md` → SERVICE ARCHITECTURE section.

### Commands

| Need | Command |
|------|---------|
| Dev server | `pnpm dev` — Turbopack, opens http://localhost:3000 — but with no `ARCJET_KEY` the proxy's LIVE rules answer 403 (measured 2026-10-13 with `curl -i`: `/`, `/sign-in` and `/dashboard` all return Arcjet's `{"code":403,"message":"Forbidden"}`; gate 5), so there is nothing to view here |
| Typecheck | `pnpm typecheck` — `next typegen && tsc --noEmit`, whole tree; currently **0 errors** |
| Test | `pnpm test` — `TZ=UTC vitest run`; the unit tier, and with it the instruction-layer checker. The `TZ` is load-bearing (recurrence tests fail in other zones) |
| Build | `pnpm build` — production build (Turbopack). Since Plan A Task 12 it also type-checks (`Running TypeScript ...` in the output); it still does **not** lint |
| Lint | `pnpm lint` — `eslint .`, flat config, exits 1 on errors |
| Prisma | `pnpm exec prisma generate`; `pnpm exec prisma migrate dev --name migration_name` (snake_case description); `pnpm exec prisma studio` |
| Email dev | `pnpm email` — **not runnable.** `@react-email/ui` is not installed, so `email dev` stops on an interactive "must be installed / Would you like to install it?" prompt. `emails/template.tsx` is proven only by `tsc` and module resolution, never by the preview renderer |

`pnpm@10.6.5` only (pinned in `package.json`); Node.js 20+ (`>=20.9.0` for Next 16 / Clerk 7).

Prove "run one file" by testing: `pnpm lint -- --debug nonexistent.ts` should report the file does not match any pattern.

### Where logic goes

- `lib/checkUser.ts` — session→row provisioning, reached from the header that `app/layout.tsx` mounts; it returns `null` and never redirects, so it is not a gate. `actions/lib/checkUser.ts` — the action gate that throws. Do not implement auth logic elsewhere.
- `lib/prisma.ts` — data access, all Prisma calls go through this singleton (Prisma 7 requires the `@prisma/adapter-pg` adapter here).
- `app/(main)/` — protected pages. `proxy.ts`'s route matcher is what protects them; `app/(main)/layout.tsx` performs no auth, so do not describe it as the gate.
- `app/api/` — API routes. `/api/seed` calls no gate at all (unauthenticated `GET` that writes) and `/api/inngest` is authenticated by Inngest's own signing, so a new protected route must state which check it runs.
- `lib/schema.ts` — Zod validation schemas for forms and API input.
- `proxy.ts` — root request hook: ArcJet (`shield`, `detectBot`) then `clerkMiddleware`. Next 16 renamed this file from `middleware.js`; Plan A converted it to TypeScript.

Protected paths: the seven in STANDING RULES §17 — one authority; this line defers to it.

### Framework version drift

**Next.js 16.4.0 gotchas from training data:**
- Server Components are default; do not assume client-side hooks work without `'use client'`.
- API routes use named exports (`export async function GET(request) {}`), not default export.
- `getServerSession()` does not exist; use `@clerk/nextjs`'s `auth()` instead.
- Root middleware file is `proxy.ts` (this repo) — Next 16 calls it `proxy`, not `middleware`; the old `middleware.js` name is no longer picked up.
- `next.config.mjs` rejects the removed `eslint` key; build and lint are independent gates. `next build` does type-check (no `typescript.ignoreBuildErrors`), `pnpm lint` does not gate the build.
- Clerk 7 (Core 3) removed the `SignedIn`, `SignedOut` and `Protect` components — rendering them **throws at runtime, not at build time**. Use Clerk 7's `Show` component with its `when` prop set to `signed-in` or `signed-out`.

Read `node_modules/next/dist/docs/` before touching frameworks APIs.

### Schema changes

`postinstall` runs `prisma generate` only — migrations are **not** applied automatically. The connection string the CLI uses comes from `prisma.config.ts` (`DIRECT_URL` falling back to `DATABASE_URL`), because Prisma 7 no longer accepts `url`/`directUrl` inside the schema's datasource block and no longer loads `.env*` on its own.

To add a column:
1. Edit `prisma/schema.prisma`.
2. Run `pnpm exec prisma migrate dev --name migration_name` with a snake_case description — generates and applies the migration.
3. Commit the generated file in `prisma/migrations/`.

Do not edit applied migrations. If a migration has errors, create a new one that fixes it.

### Data today

Dashboard data is seeded via `app/api/seed/route.ts` (dev only). Run `curl http://localhost:3000/api/seed` — it is a `GET`, unauthenticated, and it writes rows. Note `actions/seed.ts:8-9` reads `ACCOUNT_ID` and `USER_ID` through `as string` assertions; neither var is in the documented inventory or in `.env.local` here, so the seed path is unverified (see the `as string` open question).

### Before moving to the next unit

1. The unit works end-to-end inside the scope you stated at the start.
2. No invariant in ARCHITECTURE CONTEXT was violated.
3. The spec in `specs/` reflects what actually happened.
4. The full gate chain is green: `pnpm typecheck` ✓ (0 errors), `pnpm test` ✓, `pnpm build` ✓ (type-checks, does not lint), `pnpm lint` at the recorded census, manual smoke test ✓ where credentials allow.

---

