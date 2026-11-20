# Pocket Log landing page

## Goal

Show public visitors the Pocket Log expense example, logging workflow, and ledger entry points on `/`.

## Increments

1. Render the approved Pocket Log design from `mockups/landing/pocket-log.html` as the homepage hero.
2. Render the logging workflow and connect the closing actions to the transaction form and dashboard.

## Security / permissions

- Public homepage. Signed-in visitors go to the dashboard and signed-out visitors opening ledger routes go to sign-in (`proxy.ts:28`).

## Verification

- `pnpm test:e2e tests/smoke/e2e/smoke.spec.ts` checks the workflow link, protected CTA navigation, and narrow dark layout.
- `pnpm verify` runs the repository gate chain.
