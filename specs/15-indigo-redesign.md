# 15 — Indigo redesign: header, dashboard, new entry

## Goal

A signed-in user sees the indigo/lime header, a dashboard that logs an entry from the hero bar, and a two-column new-entry page, in light and dark themes.

## Increments

1. **Dashboard + palette.** Indigo/lime tokens in `app/globals.css`; dashboard renders the indigo hero with quick entry, Accounts card, dark budget card, spend bars (7D/30D/6M), year "Where it went", Recent entries with `?saved=<id>` highlight. Files: `app/globals.css`, `docs/agent-guide/ui.md`, `lib/dashboard-stats.ts`, `app/(main)/dashboard/page.tsx`, `app/(main)/dashboard/layout.tsx`, `app/(main)/dashboard/_components/*`.
2. **Header + shell.** Header shows Dashboard / Ledger / Budget nav and an avatar menu when signed in; the account rail renders only on `/account/*`. Files: `components/header.tsx`, `app/(main)/layout.tsx`, `app/(main)/account/layout.tsx` (new).
3. **New-entry page.** Two-column page with chip/segment form; create lands on `/dashboard?saved=<id>`. Files: `app/(main)/transaction/create/page.tsx`, `app/(main)/transaction/_components/*`.

### Build note — increment 1

- **Files** — as listed in increment 1.
- **Test** — `tests/dashboard/unit/dashboard-stats.test.ts` covers `spendSeries` (7D/30D daily, 6M monthly) and year-scoped `spendByCategory`.
- **Done when** — `/dashboard` matches mockups 1–2 in light and dark, and quick entry creates a highlighted row.

## Deferred / open questions

- Currency: per-user PHP/USD from `specs/15-daily-ledger.md` increment 1, formatted by `formatMoney` (`lib/money.ts:15`); the pill is `CurrencyMenu` in the Accounts card (`app/(main)/dashboard/_components/accounts-card.tsx:81`).
- No Budget page exists; "Budget" links to the dashboard budget card (`/dashboard#budget`).
- "Ledger" links to the default account page; no all-accounts ledger route exists.

## Security / permissions

Signed-in owner only. `proxy.ts` + `lib/route-guard.ts` gate the routes; `requireUser()` (`actions/lib/checkUser.ts`) guards the pages; quick entry and the form call `createTransaction` (`actions/transaction.ts`), which scopes by `checkUser()`. No new action or route.

## Verification

- `pnpm test` → new pure helpers in `lib/dashboard-stats.ts` (spend series per range, year category split) pass in `tests/dashboard/unit/dashboard-stats.test.ts`.
- `pnpm typecheck`, `pnpm lint`, `pnpm build` → clean.
- `pnpm test:e2e` → `tests/dashboard/e2e/dashboard.spec.ts` passes.
- Browser preview: `/dashboard` and `/transaction/create` in light and dark; quick entry creates a row and highlights it.
- Unverified: receipt fill against live Gemini.
