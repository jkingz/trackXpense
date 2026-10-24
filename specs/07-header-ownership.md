# Header Ownership

## Goal

`components/header.tsx` accepts props (user, session state) instead of reading identity internally, so it is testable and owned.

## UI: n/a (refactor, no layout change)

## Increments

1. Add props to `Header` (`user: User | null`) and remove internal `checkUser()` call; update call sites. Touches: `components/header.tsx`, `app/(main)/layout.tsx` (or wherever Header rendered). Test: existing render tests.
2. Pass resolved user from server component. Touches: layout file.

### First increment scope

- **Files**: `components/header.tsx`
- **Test**: `tests/components/header.test.tsx` (new)
- **Done when**: Header renders from props; no internal auth read

## Deferred / open questions

- Auth seam: Better Auth via `actions/lib/checkUser.ts`.

## Security / permissions

No permission change. Authority: caller resolves user via `actions/lib/checkUser.ts`.

## Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm build`
- Unverified: no render tests currently
