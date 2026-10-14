## Project Overview

### Overview

TrackXpense is a personal finance dashboard. Users sign up with Clerk, create accounts (checking/savings), log transactions (income/expense), and track spending against a budget. The app calculates account balances and surfaces key metrics on the dashboard.

### Goals
- Users can track spending in real time across multiple accounts
- Budgets surface warnings when approaching limits
- Transaction history is searchable and categorized

### Core user flow
1. Sign up with Clerk → Dashboard
2. Create account (CURRENT or SAVINGS) → Lands in dashboard
3. Log transaction (type, amount, category, date) → Account balance updates
4. View dashboard → See total balance, recent transactions, budget status

### Scope

**In scope:**
- User authentication (Clerk)
- Multiple accounts per user
- Transaction logging (income, expense, one-time and recurring)
- Budget alerts
- Dashboard metrics

**Out of scope:**
- Webhook processing for recurring transactions: the Inngest functions are written and served, but no schedule has ever fired in this environment (see SERVICE ARCHITECTURE, Background work)
- Email alerts delivered to a user: `actions/send-email.ts` exists and is called by `lib/inngest/functions.ts`; `RESEND_API_KEY` is absent, so nothing has been sent
- Receipt **storage**: the OCR half is built and user-reachable (`scanReceipt` in `actions/transaction.ts`, rendered by `app/(main)/transaction/_components/scan-receipt.tsx`), so this is no longer a UI placeholder without a backend; what is out of scope is persisting the file — `receiptUrl` is never written and no upload endpoint exists. See SERVICE ARCHITECTURE → HTTP surface and TARGET STATE
- Social features / multi-user sharing
- Mobile app

### Success criteria
- Dashboard loads in < 1s after auth
- Transactions persist and reflect on balance within the same session
- New user can sign up, create an account, and log a transaction in < 2 minutes

### Open product questions
- Recurring transaction cadence: should the next occurrence be auto-created, or only on manual trigger?
- Should budget alerts be email-only, in-app toast-only, or both?
- Currency support: USD only for MVP, or multi-currency from day one?

---

