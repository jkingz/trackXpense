---
description: Verification gates, the chain that must pass before work is complete
when: "user finishes implementation and needs to verify; asks what tests to run or how to verify a change"
---

# Verification Gates

## The chain

Work is done when, in this order:

1. **Lint passes** — `pnpm lint`
   - ESLint with Next.js rules
   - Exits 0 with warnings (not enforced as a hard gate, but review all warnings)
   - Report the output

2. **Production build passes** — `pnpm build`
   - Next.js build to verify no TypeScript errors, broken imports, or runtime issues
   - Report the output and whether it succeeded

3. **Manual verification** — when touching:
   - **Auth flows:** Create a new user, sign in, verify Clerk session works
   - **Database reads/writes:** Verify the transaction or account actually persists
   - **Email flows:** Check Resend integration (no live send needed, log verification)
   - **API routes:** Test in browser or curl

## Reporting

For each gate:
- State what you ran
- Quote the output or result
- Say whether it passed or failed

Example:
```
Lint: pnpm lint
→ 0 errors, 3 warnings (all in unused imports, will fix)

Build: pnpm build
→ ✓ 47 pages prerendered, 0 errors

Manual: Tested account creation flow
→ New account created, persisted to DB, visible in dashboard
```

## A gate that only passes on your machine is not a gate

- Anything that needs your machine's Clerk keys or database connection is verified but noted as "local only"
- The build must succeed on a clean clone (no node_modules, no .env secrets)

## What's NOT verified yet

- **Tests** — no test framework; see TARGET STATE in AGENTS.md
- **Email delivery** — Resend SDK installed, no routes wired
- **Recurring transaction webhooks** — Inngest installed, no handlers live

## Reference

- STANDING RULES §13 for `VERIFICATION_GATE_CHAIN`
- DEVELOPMENT WORKFLOW § Verification for the full context
- PM CONVENTIONS § Review gate for the merge requirement
