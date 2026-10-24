# 12 — Auth Account Lifecycle

## Goal

A new user cannot sign in until they confirm their email. A returning user can request a reset link and set a new password without an operator. Both password surfaces show strength while typing, every auth form validates before submit and reports failures once, session reads no longer hit the database on every request, and auth endpoints are rate-limited across instances.

Observable outcomes:

- Sign-up returns no session; the page shows "Check your email", not the dashboard.
- Sign-in with an unverified email returns 403 `EMAIL_NOT_VERIFIED` and offers a resend.
- `/forgot-password` always answers "If this email exists…"; `/reset-password?token=…` sets the password and revokes every session.
- Weak password shows a 4-step meter and a suggestion; server rejects below 8 characters or a breached password.
- Invalid field → inline message; server/network failure → one sonner toast; never both.
- `proxy.ts` validates a session from the signed cookie, not a DB row, within a 5-minute window.
- The 6th sign-in attempt inside a minute returns 429 with `X-Retry-After`.

## Baseline (verified against code)

- `lib/neon-auth.ts:6-28` — Better Auth; `requireEmailVerification: false`, no `emailVerification`, no `sendResetPassword`, no `cookieCache`, no `rateLimit`.
- `proxy.ts:22-33` — every guarded request calls `neonAuth.api.getSession`, a DB read per request.
- `app/(auth)/sign-up/[[...sign-up]]/page.tsx:27-39` — posts `fetch("/api/auth/sign-up/email")` then hard-navigates to `/dashboard`; no field validation.
- `lib/auth-form-state.ts:1-38` — request reducer with `idle | submitting | error`; no success/awaiting state.
- `actions/send-email.ts:8-28` — Resend, `from: "Finance App <onboarding@resend.dev>"`, swallows errors into `{ success: false }`.
- `lib/env.ts:3-20` — `RESEND_API_KEY` optional; no `EMAIL_FROM`.
- `prisma/schema.prisma:10-25` — `User.emailVerified Boolean @default(false)`; no rate-limit model.
- Better Auth 1.7.12 behaviour (read from `node_modules/better-auth/dist`):
  - Sign-up with verification required returns `{ token: null, user }` (`api/routes/sign-up.mjs:155,251`) and sends the link when `sendOnSignUp` or `requireEmailVerification` is set (`:241`).
  - Unverified sign-in throws 403 `EMAIL_NOT_VERIFIED` (`api/routes/sign-in.mjs:338-352`).
  - Reset mail links to `GET /api/auth/reset-password/:token`, which redirects to `redirectTo` with `?token=` or `?error=INVALID_TOKEN` (`api/routes/password.mjs:92-127`).
  - Reset consumes the token and revokes sessions only with `revokeSessionsOnPasswordReset` (`utils/password.mjs:31-45`).
  - Rate limiting defaults to `enabled: isProduction`, `window: 10`, `max: 100`, `storage: "memory"` (`context/create-context.mjs:170-175`); 429 carries `X-Retry-After`, not `Retry-After` (`api/rate-limiter/index.mjs:67-73`).
  - Verification failure redirects to `callbackURL` with `?error=CODE` (`api/routes/email-verification.mjs:167-173`).
- Docs now describe Better Auth session handling; this first increment does not change auth behavior.

## First increment — Auth docs truth pass

Docs only; no source change. Correct every auth/identity claim before feature docs stack on it.

1. [x] `docs/agent-guide/architecture.md` — Better Auth, Neon, schema, session seam, route gate.
2. [x] `docs/agent-guide/overview.md` — sign-in and explicit demo flow.
3. [x] `docs/agent-guide/service-architecture.md` — auth routes and session gate.
4. [x] `docs/agent-guide/workflow.md` — proxy and identity seam.
5. [x] `docs/agent-guide/code-standards.md` — root hook and file map.
6. [x] Remove Clerk schema claims; Prisma uses `User.image` and has no Clerk ID.

Verify: `rg -n "Clerk|clerkUserId|clerkMiddleware|imageUrl" docs/agent-guide` → no auth/identity matches.

## Second increment — Email delivery seam

No behaviour change. One module both flows call.

1. `lib/email/auth-email.ts` (server-only, no `"use server"`): `sendVerificationEmail({ user, url })`, `sendResetPassword({ user, url })`. Build on `sendEmail` from `actions/send-email.ts`; schedule with `after()` so Resend latency is outside the auth response; log failure, never throw into the auth response.
2. `emails/verify-email.tsx`, `emails/reset-password.tsx` using `react-email` like `emails/template.tsx:1`.
3. `lib/env.ts` — add `EMAIL_FROM: z.string().optional()`; `actions/send-email.ts` reads it with the current dev sender as fallback.
4. Dev fallback: no `RESEND_API_KEY` → log the URL and return success; production never logs the URL or token.
5. Sender: decision is Resend's test sender only, so `EMAIL_FROM` stays unset and delivery works only to the Resend account owner. In production, log an error on every auth mail with no `EMAIL_FROM`; real signups stay blocked until a domain is verified.
6. `.env.example` — add `EMAIL_FROM=` (name only).

Verify: `pnpm test tests/auth/unit/auth-email.test.ts` → renders both templates, returns without throwing when Resend fails, does not log URL when `NODE_ENV=production`.

## Third increment — Signup confirmation

1. `prisma/migrations/*` — grandfather existing rows: `UPDATE "users" SET "emailVerified" = true;` before enabling the flag, or every current account (including demo) is locked out.
2. `lib/neon-auth.ts:20-27` — `emailAndPassword.requireEmailVerification: true`; `emailVerification: { sendOnSignUp: true, sendVerificationEmail, expiresIn: 60 * 60 }`.
3. `app/(auth)/sign-up/[[...sign-up]]/page.tsx` — send `callbackURL: "/email-verified"`; on `{ token: null }` dispatch awaiting-verification and render "Check your email" + resend button (`POST /api/auth/send-verification-email`) with a 60s cooldown; stop redirecting to `/dashboard`.
4. `lib/auth-form-state.ts` — add `awaiting-verification` status and `AWAITING` / `RESEND_START` / `RESEND_SENT` events; keep `FAIL` ignoring stale actions.
5. `app/(auth)/email-verified/page.tsx` — success CTA to `/sign-in`; `?error=CODE` → invalid/expired copy + link to sign-in resend.
6. Sign-in page — map 403 `EMAIL_NOT_VERIFIED` to a verify notice with resend; keep the error visible.
7. No `proxy.ts` `emailVerified` gate: sign-in is the authority (`sign-in.mjs:338`); a proxy gate would need a third `routeDecision` input and risks cookie-cache staleness.

Verify: `pnpm test tests/auth/unit/auth-form-state.test.ts tests/lib/unit/route-guard.test.ts`; live: sign-up → mail → link → `/email-verified` → sign-in works; sign-in before confirming → 403 notice.

## Fourth increment — Forgot and reset password

1. `lib/neon-auth.ts` — `emailAndPassword.sendResetPassword`, `resetPasswordTokenExpiresIn: 60 * 60`, `revokeSessionsOnPasswordReset: true`.
2. `app/(auth)/forgot-password/page.tsx` — email form posts `/api/auth/request-password-reset` with `redirectTo: "/reset-password"`; always show the same "If this email exists…" confirmation (`password.mjs:87-90`).
3. `app/(auth)/reset-password/page.tsx` — read `token` and `error` from the query; missing/`INVALID_TOKEN` → expired state linking to `/forgot-password`; valid → new password + confirm, post `/api/auth/reset-password`.
4. Sign-in page — "Forgot password?" link; reset success → toast + `/sign-in`.
5. No token in client logs, no token in analytics, no token echoed in the URL after submit.

Verify: live: request → mail → link → set password → old password fails, new works, other browser session signed out; expired token → error state, no crash.

## Fifth increment — Password strength

1. `lib/password-strength.ts` — pure `scorePassword(password, context?: { email?: string; name?: string })` → `{ score: 0 | 1 | 2 | 3 | 4; label: string; suggestions: string[] }`. Signals: length ≥ 8/12/16, 3+ character classes, repeated runs, sequences (`abc`, `123`), common-password deny list, email local-part / name substring.
2. `components/auth/password-strength.tsx` — 4 segments, `role="progressbar"`, `aria-valuenow/min/max`, label + suggestions; `bg-brand` fill on `bg-muted` track; no new tokens.
3. Use on sign-up and reset-password; meter is advisory — Zod enforces min 8 and confirm match, server enforces the real limit.
4. `lib/neon-auth.ts` — `minPasswordLength: 8`, `maxPasswordLength: 128`.
5. Compromised-password check: `haveIBeenPwned()` plugin (`node_modules/better-auth/dist/plugins/haveibeenpwned/index.d.mts`), enabled outside tests; one outbound call per password set; fails closed. Decided: on.

Verify: `pnpm test tests/auth/unit/password-strength.test.ts` → table of weak/strong inputs, deterministic scores, no React; live: weak password blocked server-side even with meter bypassed.

## Sixth increment — Form validation and toasts

1. `lib/schema.ts` — add `signUpSchema`, `signInSchema`, `forgotPasswordSchema`, `resetPasswordSchema`; Zod 4 `z.email()`; `.refine` for confirm; min 8 / max 128.
2. Four auth pages — React Hook Form + `zodResolver`, `mode: "onBlur"`; inline `aria-invalid` + `aria-describedby` + `text-destructive`; keep `authFormReducer` as the request authority (RHF owns fields only, so status cannot disagree).
3. `lib/auth-errors.ts` — map `INVALID_EMAIL_OR_PASSWORD`, `EMAIL_NOT_VERIFIED`, `PASSWORD_TOO_SHORT`, `PASSWORD_TOO_LONG`, `PASSWORD_COMPROMISED`, `INVALID_TOKEN`, 429 (`X-Retry-After`) to human copy.
4. Toast policy: field errors inline only; server/network failure → exactly one `toast.error`; success (resend, reset mail, password changed) → `toast.success`. Do not use `useFetch` for auth — it already toasts once (`hooks/use-fetch.ts:29`).
5. Focus the first invalid field on failed submit; disable submit while `status === "submitting"`.

Verify: `pnpm test tests/auth/unit/auth-errors.test.ts tests/validation/unit`; live: empty submit → inline only; wrong password → inline + one toast; double click → one request.

## Seventh increment — Session caching

1. `lib/neon-auth.ts:24-27` — `session.cookieCache: { enabled: true, maxAge: 5 * 60, strategy: "compact" }`.
2. Consequence documented: revocation, ban, password change on another device can lag up to 5 minutes; sensitive reads pass `disableCookieCache: true`.
3. `lib/route-guard.ts` unchanged; `proxy.ts` now validates from the signed cookie.
4. Do not add `unstable_cache` around user/tenant reads; no cross-request caching of ledger data.

Verify: `pnpm test tests/lib/unit/route-guard.test.ts`; live: sign in, request a guarded page twice with Prisma query logging → second request issues no `session` SELECT; sign-out → next request redirected.

## Eighth increment — Database rate limits

1. `prisma/schema.prisma` — add `RateLimit` (`id String @id @default(uuid())`, `key String? @unique`, `count Int @default(0)`, `lastRequest BigInt`, `@@map("rate_limits")`); additive migration.
2. `lib/neon-auth.ts` — `rateLimit: { enabled: true, window: 60, max: 100, storage: "database", customRules: { "/sign-in/email": { window: 60, max: 5 }, "/sign-up/email": { window: 60, max: 5 }, "/request-password-reset": { window: 60, max: 3 }, "/reset-password": { window: 300, max: 5 }, "/send-verification-email": { window: 60, max: 3 } } }`.
3. `advanced.ipAddress.ipAddressHeaders: ["x-forwarded-for"]`; without a resolvable IP every client shares one per-path bucket (`api/rate-limiter/index.mjs:243-245`).
4. Keep Arcjet for `POST /api/transactions`; auth endpoints get exactly one limiter — Better Auth. No double limiting.
5. 429 copy in `lib/auth-errors.ts` reads `X-Retry-After`.

Verify: live loop `for i in $(seq 1 6)` against `/api/auth/sign-in/email` → 429 on the 6th with `X-Retry-After`; `rate_limits` row count > 0; restart dev server → bucket still enforced (proves database storage).

## Docs close-out (each increment updates its section; final sweep here)

- `docs/agent-guide/architecture.md` — auth provider, verification gate, reset flow, cookie-cache window, rate-limit table, single authorities (Better Auth vs Arcjet), HIBP.
- `docs/agent-guide/code-standards.md` — auth form pattern (RHF fields + request reducer + toast policy), error mapping, client meter vs server password authority.
- `docs/agent-guide/ui.md` — auth page inventory, strength meter, inline vs toast split.
- `docs/agent-guide/service-architecture.md` — new routes (`/forgot-password`, `/reset-password`, `/email-verified`), auth endpoints, `rate_limits` table; update counts here only.
- `docs/agent-guide/target-state.md` — replace the email-delivery line with the remaining gaps (verified sender domain, HIBP egress).
- `.env.example` — `EMAIL_FROM=` only; no values.

## Security / permissions

- Better Auth is the only auth authority. No custom token table, no custom password hashing, no hand-rolled session.
- Verification and reset tokens are single-use, stored by Better Auth's verification table, consumed in a transaction (`utils/password.mjs:31-45`); reset revokes all sessions.
- Account enumeration: reset request always returns the same message; sign-up duplicate returns the generic response when verification is required (`sign-up.mjs:155`).
- Emails never log tokens or URLs in production; dev logs the URL only when `RESEND_API_KEY` is absent.
- HIBP sends only the first five SHA-1 characters; failure mode is fail-closed (throws), so an outage blocks password set.
- Rate limiting is keyed by client IP + path; a missing IP falls back to one shared bucket, so proxy headers are part of correctness.
- Arcjet stays the transaction-write limiter; auth routes are not double-limited.

## Deferred / open questions

- Sender domain for `EMAIL_FROM` — **deploy blocker for real users**. Decided: ship with Resend's test sender, which delivers only to the Resend account owner. Verification and reset links work in dev/owner testing; arbitrary signups receive nothing until a domain is verified.
- Grandfather existing users as `emailVerified = true`? Recommended yes; without it every current account is locked out.
- Password policy decided: minimum 8, maximum 128, HIBP on outside tests. Revisit 8 if abuse appears.
- Rate-limit numbers in increment 8 are proposals; confirm before enforcing.
- Session cache staleness of 5 minutes — acceptable for revocation? Sensitive checks can bypass.
- Form-validation scope decided: the four auth forms; transaction/budget/account forms keep their current pattern (separate work).
- `emailVerified` proxy gate — not planned; sign-in is the gate.

## Verification

- `pnpm verify` → `test`, `typecheck`, `lint`, `build` all pass.
- `pnpm test tests/auth/unit` → email, form-state, password-strength, error-map suites green.
- Live (dev server + database): sign-up → receive mail → verify → sign in; unverified sign-in → 403 notice; forgot → reset → old session revoked; 6 rapid sign-ins → 429; second guarded request issues no session SELECT.
- Unverified: real sender domain, HIBP egress, and forwarded-IP resolution in the deployed environment.
