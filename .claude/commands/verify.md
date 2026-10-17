---
description: Stage 5 — run the gate chain and report real output
---

Self-check the increment just built. Run the chain in order, as separate tool
calls, and paste the real output for each. Do not summarise a run you did not do.

1. `pnpm test` — the tests covering the changed paths. Name the tier and the count.
2. `pnpm typecheck` — proves types, not behaviour.
3. `pnpm lint` — `vp check`: format plus lint. A new error is a failure; existing
   warnings are tolerated but must not grow.
4. `pnpm build` — anything the build fetches over the network at build time is a
   latent CI failure.
5. Live exercise, when tests cannot reach it: a page, a migration, a job. Say what
   you did and what you saw. An unrun page is not a passing page.

`pnpm verify` runs 1–4 as one chain; use it when you want a single gate.

If anything fails: fix it, then re-run the whole chain from step 1. Do not report
a partial chain as green.

Report per gate: the command, the output or count, pass or fail. Then list what
remains unverified. A claim without a command behind it does not count.

Then `/review-changes`.
