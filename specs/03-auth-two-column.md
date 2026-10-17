# Auth pages: two-column sign-in and sign-up

## Goal

A visitor who lands on `/sign-in` or `/sign-up` learns what the product is before
they type, and reaches a working form on one screen at any width.

## Increments

1. **The brand panel exists.** A full-bleed left panel carries a heading, one
   supporting line and three value props, all drawn from `data/landing.tsx`.
   Files: `components/auth/auth-panel.tsx` (new), `app/(auth)/layout.tsx`.
2. **The form sits beside it.** Both auth pages sit in a two-column grid on
   desktop, and the form comes first on mobile so a phone visitor is not made to
   scroll past the pitch. Files:
   `app/(auth)/sign-in/[[...sign-in]]/page.tsx`,
   `app/(auth)/sign-up/[[...sign-up]]/page.tsx`.
3. **The bar still fits a phone.** The header wordmark hides below `sm`, because
   logo + both CTAs + the theme toggle overflowed 390px by 30px.
   Files: `components/header.tsx`.
4. **Either card can be left.** A back link sits at the top of both auth forms.
   Files: `components/auth/back-link.tsx` (new), both auth pages.

## Deferred / open questions

- Copy is marketing prose written from what `data/landing.tsx` already claims.
  No testimonial, no user count, no money saved — nothing the repo cannot back.
- The account picker on `/transaction/create` shows a raw UUID in its closed
  state, the `Select` defect already recorded in `docs/agent-guide/ui.md:25`.
  Not touched here.

## Security / permissions

No change. Both pages stay public; the demo button keeps calling
`POST /api/demo` and the form keeps calling the better-auth endpoints. The
panel is static markup — no user data, no session read, nothing to authorise.

## Verification

- `pnpm test` → 113 tests green (no test is added: this change is markup and
  layout, and `tests/` is unit-only with no component tier).
- `pnpm typecheck` → clean.
- `pnpm lint` → 0 errors (1 pre-existing warning, `components/landing/closing-cta.tsx:3`).
- `pnpm build` → succeeds.
- Manual, `pnpm dev`, 1280×800: panel and form share one row, panel left (x=0,
  640px wide), form right (x=736). The auth block is 728px against 736px of
  space below the header; the page still scrolls because the footer is 391px,
  which every route shares.
- Manual, 390×844: the form is first (top=121px, inside the first screen), the
  panel follows, and there is no horizontal overflow (0px; it was 30px before
  the header wordmark was hidden below `sm`).
- Manual: demo sign-in still completes in one click; a fresh sign-up reaches
  `/dashboard` (measured 2026-10-17, zero console errors on both).
- Manual: after the back link landed, both cards are 422px tall at 1280×800, so
  the extra row did not push the card past the fold.
- Manual: toggle Dark, panel and form both follow the theme.
- Manual: the "Back to home" link on both `/sign-in` and `/sign-up` returns to
  the landing page, and it is the first focusable element on the card.
- Unverified: contrast of the panel text over its gradient at both themes is
  eyeballed, not measured.
