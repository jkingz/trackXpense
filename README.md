# TrackXpense

A personal finance dashboard: sign in with Clerk, create accounts (CURRENT / SAVINGS), log income and expense
against them, hold one budget that warns near its limit, and read the result on the dashboard.

**Pre-launch.** What is built, module by module, is `docs/agent-guide/service-architecture.md`. What is *not* built
is `docs/agent-guide/target-state.md` — read it before assuming a capability exists, and note that some entries
there are code that exists but has never been executed against a database.

## Setup

Needs a Node release at or above the floor `package.json` declares in `engines.node`. That floor comes from the
dependencies, not from Next and Clerk alone — `@arcjet/next` and Vitest both want newer than Node 20. `pnpm` is the
host's own binary: there is no `packageManager` field, so nothing activates a different version under you.

```bash
pnpm install                    # postinstall runs prisma generate only — it does NOT migrate
cp .env.example .env.local      # names only, values empty; fill what you have
pnpm exec prisma migrate dev    # apply what is in prisma/migrations/
pnpm dev
```

`.env.example` is the inventory of every variable the tree reads, each with the site that reads it. Prisma 7 does
not load `.env` files by itself: the CLI resolves its URL through `prisma.config.ts`.

## What each command proves here

| Command | What it actually shows |
| --- | --- |
| `pnpm dev` | Serves pages **only with `ARCJET_KEY` present**. `proxy.ts` runs Arcjet's LIVE `shield`/`detectBot` before anything renders, so without a key every route answers 403 and there is nothing to view. |
| `pnpm typecheck` | `next typegen && tsc --noEmit` over the whole tree, in `strict` mode with two flags deliberately still off (see `AGENTS.md` §13 and the Language strictness body). |
| `pnpm test` | The Vitest unit tier — `TZ` is pinned by the script and is load-bearing. App characterisation tests plus the instruction-layer checker. Nothing opens a database, so no money-path behaviour is covered, and the app-tier tests pin recorded defects rather than endorsing them. |
| `pnpm check:docs` | The instruction-layer checker alone: it reads this repo's own guidance files and asserts they agree. |
| `pnpm build` | Production build (Turbopack). It type-checks, and it never lints. |
| `pnpm lint` | Exits 1 on a recorded pre-existing ESLint census. The gate is "the census does not grow", not "green"; the number lives in `docs/agent-guide/service-architecture.md` § Verification. |
| `pnpm email` | Not runnable — `@react-email/components` is installed but `@react-email/ui` is not, and the CLI stops on an interactive prompt. |

Anything money-shaped needs `DATABASE_URL` plus both Clerk keys. Dashboard rows come from `GET /api/seed`, which
is an unauthenticated write endpoint for local use only.

## CI

`.github/workflows/ci.yml` runs install, typecheck, test and build — the first three gates, no lint step, no
secrets — on push to `main` or `feat/**` and on every pull request. Vercel adds a preview deployment per PR. The
authoritative gate chain, and what each gate does *not* prove, is `AGENTS.md` §13.

## For agents and contributors

- `AGENTS.md` is the instruction layer's contract: the standing rules, one stub per section, and `CLAUDE.md` is a
  one-line import of it. The section bodies live in `docs/agent-guide/`, and `docs/agent-guide/README.md` states
  the read order.
- Project-specific guidance is in `.claude/skills/`.
- Feature specs live in `specs/`, one file per deliverable unit. Design docs and plans for conversions and
  migrations stay under `docs/superpowers/`.

## Stack

Next.js App Router on Turbopack, React, TypeScript, Tailwind + Radix, Prisma over PostgreSQL, Clerk for auth,
Inngest for background work, Resend for email, Arcjet for request protection, Vitest for tests. Exact versions and
what each was verified against: `docs/agent-guide/architecture.md` § Stack — not repeated here, so this file cannot
go stale on the next bump.
