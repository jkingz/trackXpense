# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Primary audience today: portfolio reviewers evaluating the work. They arrive at `/` and enter through the shared demo account (`/api/demo`).
- Modelled end user (inferred from the PHP default, not confirmed): an individual tracking their own day-to-day spending by hand, mostly in pesos.

## Product Purpose

- TrackXpense is a personal money manager. The user logs income and expenses against checking and savings accounts, and balances, budget headroom and dashboard metrics update when an entry is saved.
- Status: portfolio demo project, with no real users.
- Success: a visitor can go from landing to a working ledger (demo or sign-up → account → transaction) in under 2 minutes, and the dashboard loads in under 1 s after auth (`docs/agent-guide/overview.md`).

## Positioning

- Category: money manager, in the same space as apps like Money Manager.
- Working claim, taken from the copy and not confirmed as a differentiator: manual entry by choice, no bank sync, and the balance moves the moment you save (`lib/site.ts` tagline: "Log the expense. Watch the balance move.").
- Open: a distinct differentiator has not been decided.

## Operating Context

- Core flow: sign in or use the demo → create account (CURRENT/SAVINGS) → log a transaction (type, amount, category, date) → dashboard.
- The demo ledger holds seven months of sample history (`pnpm db:seed`).

## Capabilities and Constraints

- Better Auth email/password sign-in plus a demo sign-in. Ledger routes require a session (`proxy.ts`).
- Multiple accounts per user, with 21 categories, one budget per user and receipt OCR scanning.
- One ledger currency per user, PHP or USD (`lib/money.ts:1`). New users get PHP and existing users keep USD. There are no exchange rates and no mixed-currency entries.
- Built but inactive: recurring processing (Inngest never fires), budget alert email (Resend never sends) and receipt storage.
- Out of scope: multi-user sharing, bank sync and a native mobile app.
- Product names in use: "Daily Ledger" for the dashboard layout (`specs/15-daily-ledger.md`) and "Pocket Log" for the landing hero (`specs/16-pocket-log.md`).

## Brand Commitments

None are binding beyond the name TrackXpense.

## Evidence on Hand

- Seeded demo ledger data only.
- There are no real users, testimonials, customer logos, metrics, press or pricing. Do not fabricate any of these.

## Product Principles

- The demo is the pitch: every public path leads to a working ledger quickly.
- Logging is the core act, and any feedback after saving must be immediate and visible.
- Claim only what runs. Inactive features (recurring, email alerts, receipt storage) are not advertised as working.
- One currency per ledger, formatted correctly for PHP and USD.
