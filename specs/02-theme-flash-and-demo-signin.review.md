# Review — theme flash, theme switcher, single-click demo sign-in

Reviewer subagent, three passes over `specs/02-theme-flash-and-demo-signin.md`.

## Post-review changes (owner-driven)

1. **The owner saw the `app/layout.tsx` comment after demo sign-in → sign-out.**
   Nothing rendered it into the DOM; the layout's `<script>` was re-rendered by
   React on the soft navigation and React logged `Encountered a script tag while
   rendering React component`, and the dev overlay printed the offending source
   frame. Fixed with `components/inline-script.tsx` — a **Client** Component
   rendering `type="text/javascript"` on the server and `text/plain` in the
   browser, in an explicit `<head>`. A Server Component was not enough: the RSC
   payload carries `text/javascript`, so the client re-render warned anyway
   (`react-dom-client.development.js`, `case "script"` hoist + `isScriptDataBlock`).
   Measured after: sign-in → sign-out logged zero console errors.
2. **Then the script was cut anyway** (owner, 2026-10-17): the flash was not
   observable, so persistence stayed and the script went. Deleted
   `components/inline-script.tsx` and `themeInitScript` from `lib/theme.ts`
   (grep: no remaining callers). The light-first frame on a dark hard reload is
   recorded in `docs/agent-guide/target-state.md`, and the spec's goal and
   increment 1 were rewritten to drop the flash claim.
3. **Theme control moved to the right end of the bar**, after the auth slot
   (`components/header.tsx`). First attempt left the old instance in place — the
   screenshot showed two toggles; the stray was removed. Measured: 1 control,
   16px from the nav's right edge at 1280px and 16px from the viewport edge at
   390px.
4. **Sign-out left the bar showing Dashboard / Add Transaction / Sign out.**
   Reproduced (3 stale controls, 0 "Sign in" links), fixed with
   `revalidatePath("/", "layout")` before `redirect("/")` in the sign-out
   action: the client router had served the landing page prefetched while signed
   in. Measured after, from both `/dashboard` and `/`: 0 stale controls, 1
   "Sign in" link.

## Standards

- [x] **High** (pass 1, fixed) — `app/layout.tsx` comment claimed React hoists the inline theme script into `<head>`; measured it renders in place as the first body child. Comment rewritten to the measured mechanism.
- [x] **Medium** (pass 1, fixed) — sign-in shipped off-token markup (`bg-red-50`, `text-white`). Now `Input` + `Button` from `components/ui/*` and a `destructive`-token alert box.
- [x] **Medium** (pass 1, fixed) — hand-rolled `<button>`/`<input>`; `Button loading` now carries the spinner and the repeat-submit block.
- [x] **Low** (pass 1, fixed) — `status` had no reader; the page derives `busy` from `status === "submitting"`.
- [x] **Low** (pass 1, fixed) — `RESET` had no caller; removed from the reducer.
- [x] **Low** (pass 3, fixed) — `lib/theme.ts:3` comment still said the script runs in `<head>`.
- [x] **Low** (pass 2, fixed) — `code-standards.md` censuses now list `lib/auth-form-state.ts`, its built entry, and `tests/auth` in the folder list.
- Open, pre-existing, not this spec's lines: `code-standards.md` file map still names deleted `lib/checkUser.ts` / `lib/demo-identity.ts`; `target-state.md` still cites deleted `actions/seed.ts:10-11`.

## Spec

- [x] **Medium** (pass 1, fixed) — "No new surface" was inaccurate; `/api/demo` arrived with the uncommitted auth migration. Reworded.
- [x] **Medium** (pass 1, fixed) — increment 2 claimed `components/theme-provider.tsx` unchanged; it is pre-existing uncommitted work. Restated.
- [x] **Medium** (pass 1, fixed) — spec pointed at a `target-state.md` entry that did not exist; the sign-up deferral line now exists.
- [x] **Medium** (pass 2, fixed) — design doc contradicted the landed sign-in markup; States/Layout/Interaction/Tokens/Accessibility updated.
- [x] **Low** (pass 1, fixed) — the spec described sign-in markup as inherited; it is authored by this change. Reworded.
- [x] **Low** (pass 3, fixed) — design doc cross-talk and the `outline-ring/50` / `shadow-sm` claims corrected.

## Gates (pass 3, measured)

| Command          | Result                                                                    |
| ---------------- | ------------------------------------------------------------------------- |
| `pnpm test`      | 13 files, 113 tests passed                                                |
| `pnpm typecheck` | clean                                                                     |
| `pnpm lint`      | 0 errors, 1 pre-existing warning (`components/landing/closing-cta.tsx:3`) |
| `pnpm build`     | succeeded, `/sign-in/[[...sign-in]]` still ◐ partial-prerender            |

## Browser checks (2026-10-17, `pnpm dev`, chromium via playwright-cli)

- One click of "Try the demo" → `/dashboard` signed in; a triple-click fired exactly one `POST /api/demo`.
- Pending: both buttons disabled, demo label "Opening the demo…".
- `POST /api/demo` 500 → alert "Demo is unavailable right now", both buttons re-enabled.
- `theme = "dark"` reload → `<html class="dark">`, body background already the dark token.
- Toggle: light → dark → system, each stored and applied; survives reload.
- Unverified: `system` following an OS `prefers-color-scheme` change — this browser's `set-color-scheme` emulation reports `false`.

Verdict: pass
