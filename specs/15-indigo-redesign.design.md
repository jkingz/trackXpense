# 15 — Indigo redesign: design

## States

- **Dashboard / no accounts** — hero shows `$0.00`, quick-entry bar hidden, Accounts card shows "Add an account" with `+ New`.
- **Dashboard / no budget** — budget card says "No budget yet" with Edit.
- **Dashboard / no spend in range** — bars render flat baseline; caption "Nothing spent in this range."
- **Dashboard / no year spend** — "Where it went" shows "No spending yet this year."
- **Dashboard / no entries** — Recent entries shows "Nothing logged yet" + link to `/transaction/create`.
- **Dashboard / loading** — existing Suspense skeletons (`dashboard-skeleton.tsx`) per section.
- **Dashboard / just saved** — `?saved=<id>` row gets the lime fill and "· just saved".
- **Quick entry / idle, submitting, error** — Log it shows `loading`; error toasts via `useFetch`; an amount that is not above zero toasts and does not submit (description is optional, `lib/schema.ts:17`).
- **New entry / create, edit, scanning, submitting, field error** — edit mode keeps "Update" copy and hides receipt fill; field errors print under the field in `text-destructive`.
- **Forbidden** — signed-out visitors redirect to `/sign-in` (`proxy.ts`, `requireUser`).

## Layout

- **Header** — logo + wordmark left; nav (Dashboard, Ledger, Budget) + avatar right. Nav hides below `md`; avatar menu carries the links there.
- **Dashboard desktop (`lg`)** — 12-col grid: hero 8 / Accounts+Budget stacked 4; bars 8 / Where it went 4; Recent entries 12.
- **Dashboard mobile** — single column in the same order; quick-entry bar wraps to two rows (type + amount, then description + chips + Log it); entries table drops the Account column below `md`.
- **New entry desktop** — 5/7 split: headline + preview left, form card right with offset `shadow` block. Mobile: headline, then form; preview card hidden below `lg`.
- Tap targets ≥ 40px (chips `h-10`, segments `h-10`).

## Interaction

- Avatar → `DropdownMenu` with nav links (mobile) and sign out; `ThemeToggle` sits beside the avatar.
- Quick entry: Expense/Income segment toggles type; category and account are `Select`s; Enter or Log it submits `createTransaction` with today's date, then `router.replace('/dashboard?saved=<id>')`.
- Range segment 7D/30D/6M swaps the series client-side (6M = monthly buckets).
- Budget Edit → inline input as today (`budget-progress.tsx` logic kept).
- New-entry form: chips set category (first 6 + `All N` opens `Select`); When segment sets today / yesterday / opens `Calendar` popover; Repeat `Switch` reveals interval `Select`; Cancel = back; submit = Log it.

## Tokens

New in `app/globals.css` `@theme` + `.dark`, documented in `docs/agent-guide/ui.md`:

- `--color-indigo` (hero, primary), `--color-indigo-soft` (secondary bars, lavender text on indigo), `--color-lime` (highlight, today bar, progress), `--color-navy` (budget card, ink).
- `--primary`, `--ring`, `--background`, `--card`, `--muted`, `--border` retuned to the indigo family in `:root` and `.dark`.
- Existing: `text-income`, `text-expense`, `bg-card`, `text-muted-foreground`, `font-mono`, `rounded-2xl|3xl`.

## Accessibility

- Focus ring `outline-ring` on every control; segments are `button` with `aria-pressed`.
- Avatar trigger `aria-label="Account menu"`; range and type segments in `role="group"` with labels.
- Lime text only on `bg-indigo` / `bg-navy` (≥ 4.5:1); `text-navy` on `bg-lime`.
- Bars carry `sr-only` amounts per bar.

## Data

- Server: `getUserAccounts`, `getDashboardData`, `getCurrentBudget` (unchanged).
- New pure helpers in `lib/dashboard-stats.ts`: `spendSeries(transactions, now, range)` and year-scoped `spendByCategory`.
- Reused components: `components/ui/button`, `select`, `switch`, `dropdown-menu`, `popover`, `calendar`, `input`, `create-account-drawer`, `theme-toggle`. `sign-out-button` is removed; its action moves into the avatar menu (`components/user-nav.tsx`).
