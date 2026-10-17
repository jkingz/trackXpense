# Design — auth pages, two columns

## States

The panel is static; it has no state of its own. The page it sits in:

- Signed out, idle — the only reachable state on these routes.
- Submitting / error — owned by `lib/auth-form-state.ts` on sign-in, unchanged.
- Signed in — the page leaves; the panel never renders it.

## Layout

`app/(auth)/layout.tsx` becomes the grid, so both pages inherit it:

- Desktop (`lg`, ≥1024px): two columns. Left is the panel, a full-height column
  bleeding to the viewport edge; right holds the form centred in the remaining
  width. The form keeps `max-w-md`.
- Mobile (<1024px): one column, panel first, form second. The panel drops its
  oversized heading one step so it does not push the form below the fold.
- Nothing scrolls horizontally; the existing page-level `overflow-x-hidden`
  stays.

The current `pt-40` on the auth layout is removed — it existed to clear the
sticky header when the form was the only child.

## Interaction

No new controls. The panel is `aria-hidden` decoration around its text? No — it
carries the product pitch, so it stays readable: a real `<h1>` on the panel, and
the form's own heading becomes a `<h2>` so the page keeps one first-level
heading.

Focus order on both cards: back link → email → password → submit → demo (or
sign-up's own order). The back link is one component
(`components/auth/back-link.tsx`) rendered by both pages, so the two cannot
drift; it sits above the card heading, `text-muted-foreground` →
`text-foreground`, with the same `focus-visible` ring the header nav links use.

## Tokens

From `app/globals.css` and `docs/agent-guide/ui.md`: `bg-brand-veil`,
`text-ink`, `text-ink-soft`, `bg-card`, `border-border`, `rounded-lg`,
`text-muted-foreground`, `text-brand-deep`, `--dot-grid` (the existing dotted
overlay class) for panel texture. In dark, `--color-brand-veil` is redefined at
`globals.css:137` to a faint teal, so the panel needs no dark-specific colors.

Reused components: `Button`, `Input`, `Link`, and `lucide-react` icons already
imported by `data/landing.tsx` (`Landmark`, `Gauge`, `Tags`). No new token, no
hex, no arbitrary pixel values.

## Accessibility

- Panel heading is the page `h1`; form headings are `h2`.
- The panel is decorative in tone but readable in order: heading, line, list.
  It is a sibling of the form in DOM order, so reading order is copy then form.
- Contrast: `text-ink` on `--color-brand-veil` in both themes — the dark veil is
  `oklch(0.24 0.05 205)` against `text-ink` `oklch(0.215 0.028 240)`, which is
  too close. The panel therefore uses `text-foreground`, and the veil stays a
  background wash only.
- Tap targets unchanged: the form controls keep `size="default"` / `h-10`.

## Data

Server: none new. The panel reads a static array in
`components/auth/auth-panel.tsx`; the copy is drawn from `data/landing.tsx` so it
cannot drift from the landing page's claims.
