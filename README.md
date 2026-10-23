# trackXpense

A self-hosted personal finance tracker. Two accounts, a ledger you fill in yourself — no bank connections, no statement imports, just the entry you made this morning and what it did to the balance.

## Features

- **Accounts** — multiple accounts (current/savings), default account, inline rename
- **Transactions** — income/expense with categories, receipts, recurring intervals
- **Budgets** — monthly budget with progress tracking and alerts
- **Recurring** — daily/weekly/monthly/yearly recurring transactions
- **Analytics** — cashflow, spending by category, year-over-year comparison
- **Receipts** — upload receipts (S3/R2 or local fallback)
- **Email** — monthly report emails via Resend
- **Auth** — email/password sign-in (Better Auth)
- **Demo mode** — one-click demo ledger for trying the app

## Tech stack

| Layer       | Technology                              |
| ----------- | --------------------------------------- |
| Framework   | Next.js 16 (App Router, Turbopack)      |
| UI          | React 19, Tailwind CSS 4, Base UI, vaul |
| Database    | PostgreSQL (Neon) via Prisma 7          |
| Auth        | Better Auth                             |
| Email       | Resend                                  |
| Jobs        | Inngest                                 |
| Storage     | S3-compatible (R2) with local fallback  |
| Tests       | Vitest (unit), Playwright (e2e)         |
| Lint/Format | Vite+ (`vp check`)                      |
| Types       | TypeScript 7.0.2 (`tsc --noEmit`)       |

## Getting started

### Prerequisites

- Node.js 24+
- pnpm 12+
- A PostgreSQL database (Neon recommended)

### Install

```bash
pnpm install
```

### Environment

Copy `.env.example` to `.env.local` and fill in:

```bash
cp .env.example .env.local
```

Required variables:

| Variable              | Description                                           |
| --------------------- | ----------------------------------------------------- |
| `DATABASE_URL`        | Postgres connection string                            |
| `BETTER_AUTH_SECRET`  | Auth secret (generate with `openssl rand -base64 32`) |
| `BETTER_AUTH_URL`     | App URL (e.g. `http://localhost:3000`)                |
| `RESEND_API_KEY`      | (optional) Resend API key for emails                  |
| `INNGEST_EVENT_KEY`   | (optional) Inngest event key                          |
| `INNGEST_SIGNING_KEY` | (optional) Inngest signing key                        |
| `R2_*`                | (optional) S3-compatible storage credentials          |

### Database

```bash
pnpm exec prisma migrate dev
pnpm db:seed   # optional: seed demo data
```

### Run

```bash
pnpm dev        # development server on :3000
pnpm build      # production build
pnpm start      # production server
```

## Scripts

| Command                 | Description                                |
| ----------------------- | ------------------------------------------ |
| `pnpm dev`              | Dev server (Turbopack)                     |
| `pnpm build`            | Production build (runs `prisma generate`)  |
| `pnpm start`            | Start production server                    |
| `pnpm typecheck`        | `tsc --noEmit`                             |
| `pnpm lint`             | `vp check` (format + lint)                 |
| `pnpm test`             | Vitest unit tests                          |
| `pnpm test:integration` | DB-gated integration tests                 |
| `pnpm test:e2e`         | Playwright e2e tests                       |
| `pnpm verify`           | Full gate: test → typecheck → lint → build |
| `pnpm db:seed`          | Seed demo ledger                           |

## Project structure

```
app/            Next.js App Router pages and layouts
actions/        Server actions
components/     Shared UI components
lib/            Utilities, auth, prisma client, storage
data/           Static data (categories)
emails/         Email templates
prisma/         Schema and migrations
tests/          Unit, integration, and e2e tests
docs/           Agent/project documentation
```

## Deployment (Vercel)

1. Push to GitHub and import into Vercel.
2. Set environment variables in Vercel dashboard.
3. Vercel runs `pnpm install` (postinstall generates Prisma client) and `pnpm build`.
4. Database migrations run via `prisma migrate deploy` in CI or manually.

## License

Private — all rights reserved.
