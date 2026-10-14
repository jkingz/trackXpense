---
description: Verification gates, the chain that must pass before work is complete
when: "user finishes implementation and needs to verify; asks what tests to run or how to verify a change"
---

# Verification Gates

## Toolchain before results

`package.json` has no `packageManager` field, so `pnpm` is whatever the host resolves: `10.18.3` on this machine,
the same under Node 20.19.5, 22.15.0, 24.15.0 and 26.8.2. The field used to pin `pnpm@10.6.5` and that version was
activated against the runtime on `PATH`, which died on Node 26 with
`no @pnpm/exe.darwin-arm64 native binary was found for this host` — every `pnpm <script>` failed on the warning, and
the tree looked broken when only the shell was.

`package.json` does declare `engines.node: ">=22.21.0"`: the highest floor among the installed dependencies' own
`engines`, because `@arcjet/next` and `vitest` both sit above Node 20 while `next` and `@clerk/nextjs` only ask for
20.9.0. Nothing enforces it — `engine-strict` needs an npmrc setting this repo does not have.

So check `node --version` and `pnpm --version` before believing a red gate, and report gate numbers from a Node
inside the declared floor.

## The chain — the same five AGENTS.md § STANDING RULES §13 lists

1. **Typecheck** — `pnpm typecheck` (`next typegen && tsc --noEmit`, whole tree)
   - Proves types, not behaviour. Baseline and budget are in §13; a missed file cannot hide, because
     `tsconfig.json` `include` is the whole tree with `allowJs: false`.
   - Suspect a stale build cache: `npx tsc --noEmit --incremental false`.

2. **Tests** — `pnpm test` (`TZ=UTC vitest run`)
   - Name the tier it collected. `TZ=UTC` is in the script and is load-bearing.
   - Gate 2 also collects `tests/platform/unit/instruction-layer.test.ts` — the instruction-layer checker,
     the tier `pnpm check:docs` runs alone — so every gate-2 run re-checks AGENTS.md, its bodies in
     `docs/agent-guide/`, `.claude/skills/` and
     `.env.example` against each other, plus the vendored heading fixture. When it fails, the fix is in the
     doc or in the fixture, never in the assertion.
   - Most tests are characterisation — they pin behaviour including recorded defects, so green is not an
     endorsement. The instruction-layer checker is the exception: it reads docs, not app behaviour.
     See `/testing`.

3. **Build** — `pnpm build` (Next 16, Turbopack)
   - A real type gate since Plan A Task 12: `next.config.mjs` carries no `typescript` key, so it
     prints `Running TypeScript ...`. It **never lints** — Next 16 removed `next lint` and the
     `eslint` build key.
   - Anything fetched at build time (a font, an icon CDN) passes on a warm cache and fails on a
     sealed runner. Prove it cold: `NODE_USE_ENV_PROXY=1 HTTPS_PROXY=http://127.0.0.1:9 pnpm build`.

4. **Lint** — `pnpm lint` (`eslint .`, flat config)
   - Exits 1 on errors, and the tree is **already red** on pre-existing debt recorded in AGENTS.md §13
     (Verification gates) and `docs/agent-guide/service-architecture.md` § Verification. The gate is "the census does not grow", not "green".
   - Report the error/warning totals your run printed and compare them to the recorded census.
   - Prove a path filter reaches the runner before quoting it: `pnpm lint -- --debug nonexistent.ts`
     must say the file matches no pattern.

5. **Live exercise** — impossible for the money path in this environment
   - Auth, database and email flows cannot be smoke-tested here: `DATABASE_URL`/`DIRECT_URL` absent,
     `ARCJET_KEY` absent so `proxy.ts`'s LIVE rules answer 403 before a page renders (measured 2026-10-13: with
     `pnpm dev` up and no key, `/`, `/sign-in` and `/dashboard` each returned 403 with Arcjet's own
     `{"code":403,"message":"Forbidden"}` body, on a curl and a browser User-Agent alike — AGENTS.md §13 gate 5),
     `RESEND_API_KEY` absent, and `pnpm email` stops
     on an interactive prompt because `@react-email/ui` is not installed.
   - Say "not verified" and name the missing variable. Never upgrade that to "should work".

## Reporting

For each gate: the command, the output it printed, pass or fail. Counts belong in the reply; the only **suite
totals** this repo keeps are the `AGENTS.md` §13 gate 2 baseline and the `docs/agent-guide/service-architecture.md`
§ Verification baseline, refreshed from
command output whenever they move. Per-file test counts are labels on one file, not suite totals, and are not
what this exception scopes.

```
Typecheck: pnpm typecheck → <tsc output>
Tests:     pnpm test       → <vitest file + test counts>
Build:     pnpm build      → <route table, exit code>
Lint:      pnpm lint       → <error + warning totals> vs the recorded census
Live:      not verified — no DATABASE_URL
```

## Not gates

- **CI** — see `.github/workflows/ci.yml` for exactly which of the five it runs, and which it omits
  with a reason. Green CI proves the push, not the feature (Rule 2).
- A passing check that carries a warning annotation.
- `git status` cleanliness — a dirty tree is not evidence about behaviour.

## Reference

- STANDING RULES §13 for the authoritative chain and baselines
- PM CONVENTIONS § Review gate for the merge requirement
- `/testing` for tiers, `tests/README.md` for what no test can prove here
