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

- `pnpm build` ✓
- Manual: sign in, navigate to dashboard, select a category, verify transaction list updates.
- Not verified: category persistence across sessions, bulk filtering performance.
