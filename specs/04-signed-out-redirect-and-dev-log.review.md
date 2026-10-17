# Review — signed-out redirect, quiet dev log

Owner-reported errors from a local `pnpm dev` run, fixed as
`specs/04-signed-out-redirect-and-dev-log.md`.

## Standards

- [x] Reducer rule: sign-up now dispatches into `lib/auth-form-state.ts`, the same machine sign-in uses, so both forms derive `busy` from `status` rather than a second error string.
- [x] `checkUser()` still throws for server actions — an action must return an error, not navigate. `requireUser()` is a separate function for pages.
- [x] One authority for the session read: `requireUser()` calls the cached `currentUser()`; no page reads `neonAuth` or `db.user` itself.
- [x] `data-scroll-behavior="smooth"` is a documented Next.js attribute, not a custom one.
- Open, pre-existing, not this spec's lines: `app/(main)/layout.tsx:14` still does its own `currentUser()` + `redirect` — now redundant with `requireUser()` in the pages, left alone because removing it would change the shell's behaviour for routes this spec did not touch.

## Spec

- [x] All four increments landed: `requireUser()` on both pages, the Arcjet call behind `NODE_ENV === "production"`, the `<html>` attribute, sign-up on the shared reducer.
- [x] The spec's claim that `request()` emits the warning, not `aj.protect`, was verified in the log: the warning persisted after the first attempt moved only `aj.protect`.

## Gates

| Command          | Result                                                                    |
| ---------------- | ------------------------------------------------------------------------- |
| `pnpm test`      | 13 files, 113 tests passed                                                |
| `pnpm typecheck` | clean                                                                     |
| `pnpm lint`      | 0 errors, 1 pre-existing warning (`components/landing/closing-cta.tsx:3`) |
| `pnpm build`     | succeeded                                                                 |

## Checks (2026-10-17)

- Signed out, no cookie: `/dashboard` → 307 `/sign-in`; `/transaction/create` → 307 `/sign-in`.
- Stale cookie (`better-auth.session_token=bogus.deadbeef`), which `proxy.ts` lets through: both routes still 307 to `/sign-in`. This is the case that threw `Sign in required` before.
- Sign-up: button reads "Creating account…" and disables while the request runs; a fresh account reaches `/dashboard`.
- Browser console after both flows: zero errors, zero warnings — the `scroll-behavior` notice is gone.
- Server log after the fix: no `Sign in required`, no `scroll-behavior` notice. The one Arcjet line in the log is timestamped `00:00:21`, from before the edit.
- **Unverified end-to-end:** the Arcjet warning is gone from a real `createTransaction` call. The browser automation could not get the add-transaction form to submit (the account `Select` renders a raw UUID and the submit never fires), so no local run has exercised that path since the change. The claim rests on `request()` being unreachable outside production — code reading, not a measured run. Production behaviour of the bucket is likewise unproven.

Verdict: pass
