---
description: Verification gates, the chain that must pass before work is complete
when: "user finishes implementation and needs to verify; asks what tests to run or how to verify a change"
---

# Verification Gates

## The chain

Work is done when, in this order:

1. **Unit tests pass** — `pnpm test`. Pure modules, no DB.
2. **Integration tests pass** — `pnpm test:integration`. Real database.
3. **E2E tests pass** — `pnpm test:e2e`. Playwright drives the built app.
   - New behavior gets a test in the same change. Name the tier(s) covered and report the command and output.
4. **Typecheck passes** — `pnpm typecheck`
   - Proves types, not behavior.

5. **Lint passes** — `pnpm lint`
   - Code style and forbidden patterns.

6. **Production build passes** — `pnpm build`
   - Anything the build fetches over the network at build time is a latent CI failure.

7. **Live exercise** (when tests cannot reach it)
   - A page, a migration, a queue job was exercised for real
   - Report the observation: what you did, what you saw

## Reporting

For each gate:

- State what you ran
- Quote the output or count
- Say whether it passed or failed

Example:

```
Unit: pnpm test
→ 128 pass, 0 fail

Integration: pnpm test:integration
→ 6 pass, 0 fail

E2E: pnpm test:e2e
→ 5 pass, 0 fail

Typecheck: pnpm typecheck
→ No errors

Lint: pnpm lint
→ No violations

Build: pnpm build
→ 42 pages prerendered, 0 errors

Live: Tested /dashboard page, saw new metric chart render correctly
```

## A gate that only passes on your machine is not a gate

Anything fetched at build time over the network is a latent CI failure. Anything that needs your machine's environment state is not verified.

## CI verification

The same commands run on every push and pull request. No test count is quoted in AGENTS.md; read the suite output from CI, not the docs.

## Reference

- STANDING RULES §13 for `VERIFICATION_GATE_CHAIN`
- DEVELOPMENT WORKFLOW § Verification for the full context
- PM CONVENTIONS § Review gate for the merge requirement
