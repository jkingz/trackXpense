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

Users may only filter their own transactions. Authority today: `proxy.ts` for the session, then the `userId`-scoped reads in
`actions/dashboard.ts` — `app/(main)/layout.tsx` performs no auth and the dashboard page calls no `checkUser()`, so this
feature cannot inherit a page-level gate; it must scope its own query by the session `userId`.

## Verification

This feature is not built (`docs/agent-guide/verification-standards.md` § Verification Standards: "No category dropdown; dashboard has no filtering
UI"), so nothing below has been run. These are the checks that would verify it, not results:

- `pnpm build` → compiles and type-checks once the filter exists; run today it says nothing about this spec.
- `vp test` → stays green while the feature is built (unit tier).
- Manual/live: sign in, open the dashboard, select a category, confirm the list narrows to that category and
  only to the session user's rows — not run here: no `DATABASE_URL`, no `ARCJET_KEY` (`docs/agent-guide/pm-conventions.md` Review gate 5).
- Not verified at all yet: category persistence across sessions, bulk filtering performance.
