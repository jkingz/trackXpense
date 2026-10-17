# Theme switcher, single-click demo sign-in

## Goal

A visitor can switch theme from the header, and reaches the demo dashboard on
one click of "Try the demo".

## Increments

1. **A switcher exists, at the right end of the bar.** The header carries a
   light/dark/system control that persists, sitting after the auth slot.
   Files: `components/theme-toggle.tsx`, `components/header.tsx`.
   `components/theme-provider.tsx` is consumed as it already stands (it was
   rewritten from `next-themes` in uncommitted work before this spec; not
   touched here).
2. **One click signs in.** "Try the demo" and "Sign In" cannot be double-fired,
   show progress, and land on the dashboard in one navigation. Files:
   `lib/auth-form-state.ts`, `app/(auth)/sign-in/[[...sign-in]]/page.tsx`,
   `tests/auth/unit/auth-form-state.test.ts`.
3. **Signing out clears the bar.** After `signOut`, the landing page renders the
   signed-out auth slot, not the one prefetched while signed in. Files:
   `components/header.tsx`.

Cut before implementation: a blocking inline theme script to remove the
light-first frame on a hard reload. The owner found the flash unobservable
(2026-10-17), so `app/layout.tsx` holds no inline script and the provider
applies the stored theme after hydration. The cost is recorded in
`docs/agent-guide/target-state.md`.

Out of scope at the time, later done in `specs/04-signed-out-redirect-and-dev-log.md`:
`app/(auth)/sign-up/[[...sign-up]]/page.tsx` carried the same
`router.push` + `router.refresh` post-auth pattern and the same off-theme
markup.

## Deferred / open questions

- `app/(auth)/sign-up/[[...sign-up]]/page.tsx` still carries the
  `router.push` + `router.refresh` post-auth pattern and off-token markup.
  Fixed later in `specs/04-signed-out-redirect-and-dev-log.md`.
- Server component cache (`cacheComponents: true`) is not analysed here; the
  hard navigation sidesteps any stale guest payload instead of proving one.

## Security / permissions

No change in posture. `/api/demo` is an unauthenticated `POST` that provisions
and signs in the shared demo identity (`app/api/demo/route.ts`, `lib/demo.ts`);
it was added in the same uncommitted auth migration, and this spec only changes
how the client calls it. Theme preference is a `localStorage` string in the
browser; no authority is involved.

## Verification

- `pnpm test` → reducer suite green (START, FAIL, stale FAIL, error→START).
- `pnpm typecheck` → clean.
- `pnpm lint` → 0 errors (1 pre-existing warning, `components/landing/closing-cta.tsx:3`).
- `pnpm build` → succeeds.
- Manual, `pnpm dev`: the toggle switches Light/Dark/System, and the choice
  survives a reload (measured: `light → dark → system`, all stored and applied).
- Manual: one click of "Try the demo" reaches `/dashboard` signed in; a
  triple-click fires exactly one `POST /api/demo` (measured 2026-10-17).
- Manual: a 500 from `/api/demo` shows the alert and re-enables both buttons.
- Manual: sign out from `/dashboard` and from `/` leaves zero Dashboard /
  Add Transaction / Sign out controls and one "Sign in" link (measured
  2026-10-17; before the fix, three stale controls survived).
- Manual: one Theme control, 16px from the nav's right edge at 1280px and 16px
  from the viewport edge at 390px.
- Unverified: `system` tracking an OS-level `prefers-color-scheme` change —
  this browser's emulation reports `false` under `playwright-cli set-color-scheme`,
  so only the stored value was proven.
- Unverified: the removed flash fix — nothing measures paint timing.
