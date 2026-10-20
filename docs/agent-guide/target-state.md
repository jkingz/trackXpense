# TARGET STATE — Not Yet Built

Intent not implemented, or implemented and never run. Requirements for future work.

- **Recurring processing against a DB.** Verified 2026-10-21: Inngest dev server (`INNGEST_DEV=1`) synced `/api/inngest`; manual event `transaction.recurring.process` created a recurring occurrence and incremented balance. `lib/inngest/functions.ts`. Remaining: cloud keys + host decision for prod.
- **Email delivery.** `actions/send-email.ts` calls `resend.emails.send`, invoked by the budget-alert + monthly-report functions. `pnpm email` now renders `emails/template.tsx` to HTML via `scripts/render-email.ts` (verified 2026-10-21). Sending still depends on Inngest functions firing (see recurring processing) and a valid `RESEND_API_KEY`.
- **Receipt storage.** Decision (2026-10-21): local disk MVP (`public/uploads` via `/api/receipts`); `receiptUrl` now written from scan flow. S3/R2 deferred until scale requires it.
- **Analytics dashboard.** Spend-by-category, trends. Only "recent transactions" today.
- **Tests beyond unit tier.** Only the unit tier (`tests/`, `vp test`). No integration/e2e; no page, action, route, `proxy.ts` or Inngest function covered — app coverage ~0%.
- **Server-side input validation.** Schemas run client-side only (`zodResolver`); every action trusts its arguments. Plan B's `parseInput`.
- **Multi-user sharing.** No shared budgets / collaboration.
- **Mobile app.** Web-only MVP.
- **Counts are hand-maintained.** `tests/platform/` is gone → nothing checks `AGENTS.md` vs these bodies, and the totals in `service-architecture.md` Verification have no automated failure behind them. The build pipeline (`.opencode/plugins/pipeline.js`) gates stage order and commits; it does not read docs.
- **No integration tier.** The two harness adapters (`.opencode/plugins/pipeline.js`, `scripts/pipeline-gate.ts`) are driven only by throwaway harnesses (measured 2026-10-17: 34/34 plugin + 24/24 gate CLI, plus one live opencode session) because `tests/` is unit-only. A regression in an adapter's wiring ships green.
- **Claude Code hooks never ran live.** `claude -p` could not reach its API in this environment (model `dev`, `ECONNREFUSED`, measured 2026-10-17), so `UserPromptExpansion` / `PreToolUse` / `PostToolUse` wiring is verified only against the documented payload shapes and the exit-code contract. A matcher typo in `.claude/settings.json` would surface as a silently absent gate.
- **ESLint 10 + TypeScript 7 not installed** (on npm). ESLint 10 makes `eslint-plugin-import`'s `order` rule throw before printing a census (measured 2026-10-14, exit 2); `eslint-config-next` plugins cap ESLint at 9; `typescript-eslint` caps TS at `<6.1.0`. Prisma `latest` is `8.0.0-rc`, so 7.10.0 is newest stable. Blocks "on latest" claims.
- **Seed endpoint is an unauthenticated `GET` that writes.** Blocks any non-local deploy.
- **Two `checkUser` functions, no gate on either.** `lib/checkUser.ts` returns `null` (incl. on a failed read/write, so DB failure == signed-out) and its only caller is unrendered. `actions/lib/checkUser.ts` is the seam. `proxy.ts`'s `redirectToSignIn()` commented out → nothing fails closed. Blocks: any "page checks auth" claim; Plan B's `parseInput` (needs one place to read `userId`).
- **`@react-email/components` deprecated upstream, `@react-email/ui` absent** → `pnpm email` cannot run; proving `emails/template.tsx` renders needs a replacement.
- **`components/header.tsx` unowned.** Takes no props (`:82`); the unannotated component signature is Plan B Phase 3.
- **Env vars read via `as string`** (`lib/arcjet.ts:4`, `actions/transaction.ts:14`, `lib/inngest/functions.ts:214`, `actions/seed.ts:10-11`, `proxy.ts:32` in the commented Arcjet block) — a type-lie. `experimental.typedEnv` or a Zod env schema. Blocks trusting the config surface.
- **`transactions.status` has no transition logic.** Defaults `COMPLETED`, only read as a filter in `lib/inngest/functions.ts:174`. A state machine waits until a real transition exists.
- **Inngest host (decided 2026-10-21):** Vercel serverless — serve `/api/inngest`, set `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` in prod. Local dev uses `INNGEST_DEV=1`.
- **`proxy.ts` gates on cookie presence, not on a session.** `proxy.ts:8` checks cookie presence across both the bare and `__Secure-` session names, so an expired or foreign cookie reaches the app; `requireUser()` in `actions/lib/checkUser.ts` is what actually redirects. Validating the session in the proxy costs a round trip per request.
- **A stored dark theme flashes light on hard reload.** Owner declined the blocking theme script (2026-10-17), so `components/theme-provider.tsx:23-37` applies `dark` after hydration instead of before first paint. Restoring it costs one inline `<head>` script; the server-rendered alternative (`cookies()` in the layout) opts every route out of prerender under Cache Components.
