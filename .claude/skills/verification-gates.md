---
description: Verification gates, the chain that must pass before work is complete
when: "user finishes implementation and needs to verify; asks what tests to run or how to verify a change"
---

# Verification Gates

## Toolchain before results

`package.json` pins `packageManager: pnpm@10.6.5`, and corepack can only activate that pin on a
runtime that version supports. Measured in this checkout: Node 20.19.5 on `PATH` → `pnpm --version`
prints `10.6.5`; Node 26 → it prints `12.11.2` with
`[WARN] Cannot use the pnpm version this project pins: no @pnpm/exe.darwin-arm64 native binary was
found for this host`, and every `pnpm <script>` fails on that warning.

So check `node --version` before believing a red gate. `engines` is not declared in `package.json`,
nothing enforces this for you. `pnpm install --frozen-lockfile --ignore-scripts` is how corepack
swaps to the pinned version once the right Node is on `PATH`; it does not touch `node_modules`.

## The chain — the same five AGENTS.md § STANDING RULES §13 lists

1. **Typecheck** — `pnpm typecheck` (`next typegen && tsc --noEmit`, whole tree)
   - Proves types, not behaviour. Baseline and budget are in §13; a missed file cannot hide, because
     `tsconfig.json` `include` is the whole tree with `allowJs: false`.
   - Suspect a stale build cache: `npx tsc --noEmit --incremental false`.

2. **Tests** — `pnpm test` (`TZ=UTC vitest run`)
   - Name the tier it collected. `TZ=UTC` is in the script and is load-bearing.
   - Gate 2 also collects `tests/platform/unit/instruction-layer.test.ts` — the instruction-layer checker,
     the tier `pnpm check:docs` runs alone — so every gate-2 run re-checks AGENTS.md, `.claude/skills/` and
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
     (Verification gates) and § Verification. The gate is "the census does not grow", not "green".
   - Report the error/warning totals your run printed and compare them to the recorded census.
   - Prove a path filter reaches the runner before quoting it: `pnpm lint -- --debug nonexistent.ts`
     must say the file matches no pattern.

5. **Live exercise** — impossible for the money path in this environment
   - Auth, database and email flows cannot be smoke-tested here: `DATABASE_URL`/`DIRECT_URL` absent,
     `ARCJET_KEY` absent (so `pnpm dev` answers 403), `RESEND_API_KEY` absent, and `pnpm email` stops
     on an interactive prompt because `@react-email/ui` is not installed.
   - Say "not verified" and name the missing variable. Never upgrade that to "should work".

## Reporting

For each gate: the command, the output it printed, pass or fail. Counts belong in the reply; the only **test**
counts this repo keeps in `AGENTS.md` are the §13 gate 2 and § Verification baselines, refreshed from
command output whenever they move.

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
