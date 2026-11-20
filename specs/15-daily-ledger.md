# Daily Ledger

## Goal

Use the Daily Ledger dashboard with an account-level choice of Philippine pesos or US dollars.

## First increment

1. Save the signed-in user's ledger currency and format all signed-in money surfaces with it. Scope: `prisma/`, `actions/currency.ts`, `lib/money.ts`, `app/(main)/`, `components/create-account-drawer.tsx`, `emails/template.tsx`, `lib/inngest/functions.ts`, `tests/money/unit/money.test.ts`, `tests/auth/integration/user-lifecycle.test.ts`, `tests/dashboard/e2e/dashboard.spec.ts`, `docs/agent-guide/`.

## Later increments

2. Give the dashboard a Daily Ledger layout with a prominent balance, a pinned desktop account rail, cash flow, category spending, budget, and recent activity. Scope: `app/(main)/layout.tsx`, `app/(main)/_components/`, `app/(main)/dashboard/`, `app/globals.css`, `tests/dashboard/e2e/dashboard.spec.ts`, `docs/agent-guide/`.

## Deferred / open questions

- Single currency per ledger. Exchange rates and mixed-currency entries are out of scope.
- Existing users retain USD. New users default to PHP.

## Security / permissions

The currency action resolves the owner through `actions/lib/checkUser.ts` and accepts only PHP and USD.

## Verification

- `pnpm verify` covers the app gates.
- Exercise account currency persistence against a disposable database.
