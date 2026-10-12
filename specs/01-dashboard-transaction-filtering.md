# Feature Spec 01 — Dashboard transaction filtering

## Goal

Users can filter transactions by category on the dashboard without page reload.

## First increment

1. Add category filter UI (Select dropdown on dashboard).
2. Wire to Prisma query (pass `category` param).
3. Update display in real time (client-side state or Server Action).

## Later increments

- Filter by date range
- Filter by transaction type (income/expense)

## Deferred / open questions

- Should filters persist in URL state or session storage?
- What are the default categories? Hardcoded list or user-defined?

## Security / permissions

Users may only filter their own transactions. Authority: `checkUser()` in the dashboard layout.

## Verification

This feature is not built (AGENTS.md § Status lists dashboard filtering under "Not built"), so nothing below
has been run. These are the checks that would verify it, not results:

- `pnpm build` → compiles and type-checks once the filter exists; run today it says nothing about this spec.
- `pnpm test` → stays green while the feature is built (unit tier plus the instruction-layer checker).
- Manual/live: sign in, open the dashboard, select a category, confirm the list narrows to that category and
  only to the session user's rows — not run here: no `DATABASE_URL`, no `ARCJET_KEY` (AGENTS.md §13 gate 5).
- Not verified at all yet: category persistence across sessions, bulk filtering performance.
