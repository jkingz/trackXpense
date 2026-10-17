# Design — theme flash, theme switcher, single-click demo sign-in

## States

Header theme control:

- `light` — `<html class="">`, stored `theme = "light"`.
- `dark` — `<html class="dark">`, stored `theme = "dark"`.
- `system` (default) — stored `theme = "system"`; the `dark` class tracks
  `matchMedia("(prefers-color-scheme: dark)")` live.
- `unresolved` — before the first effect runs, the server value is `system`.
  Not rendered differently; the blocking script at the top of `<body>` has
  already decided the class, so there is nothing to show.

Sign-in form:

- `idle` — both buttons enabled, labels "Sign In" / "Try the demo".
- `submitting(submit)` — both buttons disabled and spinning; Sign In reads
  "Signing in…", demo keeps its label.
- `submitting(demo)` — both buttons disabled and spinning; demo reads
  "Opening the demo…", Sign In keeps its label.
- `error(message)` — both buttons re-enabled, an alert box above the fields.
- `signed-in` — not a rendered state: the handler hard-navigates.

## Layout

Mobile: the toggle is a `size-9` icon button at the right end of the bar, after
the auth slot; the nav links stay `hidden lg:flex`. Desktop: same slot; the auth
slot keeps its own `Suspense` and skeleton geometry, so the bar does not reflow
when the database answers.

Sign-in form: unchanged `max-w-md`, centred. The pending button swaps its label
and both disable; the error box replaces nothing else in the layout.

## Interaction

Toggle: click opens a `DropdownMenu` with three radio items (Light / Dark /
System). Choosing one calls `setTheme` — writes `localStorage.theme`, updates
React state, and the provider's effect toggles the `dark` class. Choosing
"System" re-attaches the `matchMedia` listener, so a later OS change repaints.
Keyboard: the trigger is a real `<button>`; the menu is Base UI, so arrows and
Escape come from `components/ui/dropdown-menu.tsx`.

Sign out: the form's server action calls `signOut`, then
`revalidatePath("/", "layout")`, then `redirect("/")`. Without the revalidate the
client router serves the landing page it prefetched while signed in, and the bar
keeps its ledger actions over a signed-out session.

Demo button: click dispatches `START demo`. A second click while `pending` is
not null is ignored in the handler, and the button is `disabled` so the browser
drops the event too. On success the page leaves by `window.location.assign`.

## Tokens

Semantic tokens already declared in `app/globals.css` — `bg-background`,
`bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`,
`border-border`, `border-input`, `text-destructive`, `bg-destructive/10`,
`border-destructive/40`, `rounded-md`, `text-primary-foreground` on
`bg-primary`. `shadow-xs` comes with `Button`'s variants; nothing here writes a
shadow or a hex by hand. Reused components: `Button`
(`components/ui/button.tsx`, whose `loading` prop carries both the spinner and
the repeat-submit block), `Input` (`components/ui/input.tsx`),
`DropdownMenu*` (`components/ui/dropdown-menu.tsx`), icons from `lucide-react`
(`Sun`, `Moon`, `Monitor`). No new token.

## Accessibility

- Trigger is icon-only, so `aria-label="Theme"` plus `title="Theme"`.
- `aria-label="Theme"` sits on `DropdownMenuContent`; the current value is
  announced by the radio check indicator, not colour.
- Focus ring comes from `Button`'s `focus-visible:ring-ring/50`; disabled state
  is a real `disabled` attribute, not `aria-disabled`.
- The sign-in error box is `role="alert"` so it is announced when it appears.
- Contrast: `text-muted-foreground` on `bg-card` (existing pairing already used
  by the header), `text-primary-foreground` on `bg-primary`.

## Data

Server: nothing new. `POST /api/demo` still returns the better-auth response and
`Set-Cookie`. Toggle: none — the provider reads `localStorage.theme` client-side
only, which is why the blocking script must read the same key.
