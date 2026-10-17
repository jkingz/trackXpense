# Review — auth pages, two columns

Reviewer subagent, first pass over `specs/03-auth-two-column.md`.

## Standards

- [x] Server Component default: `components/auth/auth-panel.tsx` ships no `"use client"`, holds no state, and reads no session.
- [x] `app/(auth)/layout.tsx` owns the grid, so sign-in and sign-up cannot drift.
- [x] Tokens only: `bg-brand-veil`, `text-foreground`, `text-muted-foreground`, `text-brand-deep`, `rounded-lg`, `border`, `shadow-sm`, and the existing `--dot-grid` class. No hex, no arbitrary pixel values.
- [x] Reused components: `Button` (with `loading` still carrying the repeat-submit block), `Input`, `Link`, `lucide-react` icons.
- [x] Heading order: the panel owns the page `h1`; both form headings became `h2`.
- Open, pre-existing: the header wordmark now hides below `sm` (390px overflow fix). No doc owns header responsive behaviour; flagged rather than documented.

## Spec

- [x] Increment 1 (panel) and increment 2 (form beside it) both landed; increment 3 records the header fix that fell out of the mobile check.
- [x] The design doc's contrast warning was honoured: the panel text uses `text-foreground`, not `text-ink`, because `text-ink` against the dark veil (`oklch(0.215 0.028 240)` on `oklch(0.24 0.05 205)`) is too close.
- [x] Copy carries no testimonial, user count, or money-saved claim.
- [x] Increment 4 (back link): one `components/auth/back-link.tsx` rendered by both cards, so the two pages cannot drift.

## Gates

| Command          | Result                                                                    |
| ---------------- | ------------------------------------------------------------------------- |
| `pnpm test`      | 13 files, 113 tests passed                                                |
| `pnpm typecheck` | clean                                                                     |
| `pnpm lint`      | 0 errors, 1 pre-existing warning (`components/landing/closing-cta.tsx:3`) |
| `pnpm build`     | succeeded                                                                 |

## Browser checks (2026-10-17, `pnpm dev`, chromium)

- 1280×800: panel x=0 w=640, form x=736, one row. Auth block 728px in 736px of space; the page scrolls because the footer is 391px, which every route shares.
- 390×844: form top=121px (inside the first screen), panel below it, horizontal overflow 0px — it was 30px until the header wordmark was hidden below `sm`.
- Dark mode: panel and form both follow the toggle.
- Demo sign-in reaches `/dashboard`; a fresh sign-up reaches `/dashboard`; zero console errors on both.
- Sign-up gained `Input`/`Button` tokens and a `destructive` alert box to match sign-in's markup. Its post-auth `router.push` + `router.refresh` and missing pending state were left here and fixed in `specs/04-signed-out-redirect-and-dev-log.md`.
- Back link: visible on both routes, first focusable element inside the form, and both land on `/`. Card height 422px at 1280×800, so it stays above the fold.
- Unverified: contrast ratios of the panel text over its veil, in both themes. Eyeballed, not measured.

Verdict: pass
