---
description: Verification gates, the chain that must pass before work is complete
when: "user finishes implementation and needs to verify; asks what tests to run or how to verify a change"
---

# Verification Gates

## The chain

Work is done when, in this order:

1. **Tests pass** — Tests covering changed paths pass. New behavior gets a new test in the same change.
   - Name which tier it covered — the default command is one tier, not the suite.
   - Report the command and output.

2. **Typecheck passes** — `<cmd>`
   - Proves types, not behavior.

3. **Lint passes** — `<cmd>`
   - Code style and forbidden patterns.

4. **Production build passes** — `<cmd>`
   - Anything the build fetches over the network at build time is a latent CI failure.

5. **Live exercise** (when tests cannot reach it)
   - A page, a migration, a queue job was exercised for real
   - Report the observation: what you did, what you saw

## Reporting

For each gate:

- State what you ran
- Quote the output or count
- Say whether it passed or failed

Example:

```
Tests: pnpm test:unit tests/auth/unit
→ 12 pass, 0 fail

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
