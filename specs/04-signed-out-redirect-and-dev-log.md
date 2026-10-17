# Signed-out routes redirect, and the dev log goes quiet

UI: n/a

## Goal

Visiting `/dashboard` or `/transaction/create` signed out lands on `/sign-in`
instead of a `Sign in required` error, and a local `pnpm dev` prints neither
the Arcjet 127.0.0.1 warning nor the `scroll-behavior` notice.

## Increments

1. **A signed-out ledger page redirects.** `requireUser()` in the identity seam
   redirects instead of throwing, and both pages under `app/(main)/` call it
   before their data work. Files: `actions/lib/checkUser.ts`,
   `app/(main)/transaction/create/page.tsx`, `app/(main)/dashboard/page.tsx`.
2. **The Arcjet warning stops.** The rate-limit call is skipped outside
   production, where the missing public IP makes the library fall back to
   127.0.0.1 and warn. Files: `actions/transaction.ts`.
3. **Smooth scrolling stops being flagged.** `<html>` gets
   `data-scroll-behavior="smooth"` so Next's router keeps the CSS smooth scroll
   without warning on every navigation. Files: `app/layout.tsx`.
4. **Sign-up matches sign-in.** The sign-up form dispatches into
   `lib/auth-form-state.ts`, disables while pending, and hard-navigates after
   its session cookie is set. Files:
   `app/(auth)/sign-up/[[...sign-up]]/page.tsx` (reuses the existing reducer and
   its tests; no new test).

## Deferred / open questions

- `proxy.ts` still gates on cookie _presence_, not on a valid session. That is
  why a stale cookie reaches the app at all; `requireUser()` is what catches it
  now. Validating the session in the proxy costs a round trip per request.
  Recorded in `docs/agent-guide/target-state.md`.
- Arcjet rate limiting is therefore **off** in development and unproven in
  production from here: no local run has ever made a rate-limit call.

## Security / permissions

This change makes the existing check fail closed instead of crashing. Before,
`checkUser()` threw, which surfaced as a 500 with the message in the log while
the page showed nothing useful; the redirect is the same denial, expressed as
navigation. `checkUser()` keeps throwing for server actions, where a redirect
would be wrong — an action must return an error, not navigate.

## Verification

- `pnpm test` → 113 tests green (no new test: no new pure logic, and
  `tests/` is unit-only with no component tier).
- `pnpm typecheck` → clean.
- `pnpm lint` → 0 errors (1 pre-existing warning, `components/landing/closing-cta.tsx:3`).
- `pnpm build` → succeeds.
- Manual: signed out, open `/dashboard` and `/transaction/create` → URL is
  `/sign-in`, no `Sign in required` in the log.
- Manual: with a stale session cookie present (so `proxy.ts` lets it through),
  the same two routes still land on `/sign-in`.
- Manual: `pnpm dev` log shows no Arcjet 127.0.0.1 warning and no
  `scroll-behavior` notice after a client navigation.
- Manual: sign-up still reaches `/dashboard`; the button shows "Creating
  account…" and disables while it runs.
- Unverified: Arcjet's production behaviour — no local run exercises a
  rate-limit call.
