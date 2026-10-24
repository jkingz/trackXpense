## Project Overview

### What it is

TrackXpense — personal finance dashboard. User signs in or chooses the demo, creates accounts (checking/savings), logs transactions (income/expense), tracks spend vs budget. App computes balances + dashboard metrics.

Better Auth email/password sign-in and demo sign-in are implemented. Ledger routes require a valid session; the demo button signs visitors into the shared demo account.

### Goals

- Real-time spend tracking across accounts.
- Budget warnings near limit.
- Searchable, categorized history.

### Core flow

1. Sign in or choose demo → `/dashboard`; demo ledger has seven-month sample history (`pnpm db:seed`).
2. Create account (CURRENT/SAVINGS) → dashboard.
3. Log transaction (type, amount, category, date) → balance updates.
4. Dashboard → total balance, recent transactions, budget status.

### Scope

In:

- Better Auth email/password auth; ledger routes require a valid session.
- Multiple accounts per user.
- Transaction logging — income/expense, one-time + recurring.
- Budget alerts.
- Dashboard metrics.

Out:

- Recurring webhook processing — Inngest functions written + served, never fired (`INNGEST_EVENT_KEY`/`INNGEST_SIGNING_KEY` unset).
- Email delivery — `actions/send-email.ts` written, called only by Inngest functions that never fire; `RESEND_API_KEY` present in `.env.local` (measured 2026-10-16), so unconfigured is not the gap.
- Receipt **storage** — OCR built + reachable (`scanReceipt` in `actions/transaction.ts`, rendered by `scan-receipt.tsx`); `receiptUrl` never written, no upload endpoint.
- Social / multi-user sharing.
- Mobile app.

See `service-architecture.md` and `target-state.md`.

### Success criteria

- Dashboard loads < 1s after auth.
- Transactions persist + reflect on balance same session.
- New user signup → account → transaction < 2min.

### Open questions

- Recurring cadence — auto-create next occurrence, or manual trigger only?
- Budget alerts — email, in-app toast, or both?
- Currency — USD only, or multi-currency from day one?
