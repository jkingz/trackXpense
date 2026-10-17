# Review — signed-out redirect, quiet dev log

Owner-reported errors from a local `pnpm dev` run, fixed as
`specs/04-signed-out-redirect-and-dev-log.md`.

## Standards

- [x] Reducer rule: sign-up now dispatches into `lib/auth-form-state.ts`, the same machine sign-in uses, so both forms derive `busy` from `status` rather than a second error string.
- [x] `checkUser()` still throws for server actions — an action must return an error, not navigate. `requireUser()` is a separate function for pages.
- [x] One authority for the session read: `requireUser()` calls the cached `currentUser()`; no page reads `neonAuth` or `db.user` itself.
- [x] `data-scroll-behavior="smooth"` is a documented Next.js attribute, not a custom one.
- Open, pre-existing, not this spec's lines: `app/(main)/layout.tsx:14` still does its own `currentUser()` + `redirect` — now redundant with `requireUser()` in the pages, left alone because removing it would change the shell's behaviour for routes this spec did not touch.

## Spec

- [x] All four increments landed: `requireUser()` on both pages, the Arcjet call behind `NODE_ENV === "production"`, the `<html>` attribute, sign-up on the shared reducer.
- [x] The spec's claim that `request()` emits the warning, not `aj.protect`, was verified in the log: the warning persisted after the first attempt moved only `aj.protect`.

## Gates

| Command          | Result                                                                    |
| ---------------- | ------------------------------------------------------------------------- |
| `pnpm test`      | 13 files, 113 tests passed                                                |
| `pnpm typecheck` | clean                                                                     |
| `pnpm lint`      | 0 errors, 1 pre-existing warning (`components/landing/closing-cta.tsx:3`) |
| `pnpm build`     | succeeded                                                                 |

## Checks (2026-10-17)

- Signed out, no cookie: `/dashboard` → 307 `/sign-in`; `/transaction/create` → 307 `/sign-in`.
- Stale cookie (`better-auth.session_token=bogus.deadbeef`), which `proxy.ts` lets through: both routes still 307 to `/sign-in`. This is the case that threw `Sign in required` before.
- Sign-up: button reads "Creating account…" and disables while the request runs; a fresh account reaches `/dashboard`.
- Browser console after both flows: zero errors, zero warnings — the `scroll-behavior` notice is gone.
- Server log after the fix: no `Sign in required`, no `scroll-behavior` notice. The one Arcjet line in the log is timestamped `00:00:21`, from before the edit.
- **Unverified end-to-end:** the Arcjet warning is gone from a real `createTransaction` call. The browser automation could not get the add-transaction form to submit (the account `Select` renders a raw UUID and the submit never fires), so no local run has exercised that path since the change. The claim rests on `request()` being unreachable outside production — code reading, not a measured run. Production behaviour of the bucket is likewise unproven.

---

# Increment 2 review — SEO/OG surface, icon, a11y, live deploy

Unit requested in-session (metadata typing, social preview, Vercel env cleanup +
redeploy), then extended with the site icon, the ARIA progressbar names and the
Lighthouse contrast failures. Reviewed on the working tree against `HEAD`
(298b804) by two parallel sub-agents, one per axis.

## Standards

- [x] **High** `docs/agent-guide/service-architecture.md` gained no rows for the new surface. Added: `lib/site.ts`, `lib/brand-mark.tsx`, `lib/og-card.tsx` to the module table, and `/robots.txt`, `/sitemap.xml`, `/opengraph-image`, `/twitter-image`, `/icon/{32,192,512}`, `/apple-icon`, `/llms.txt` to the HTTP table.
- [x] **High** `docs/agent-guide/code-standards.md` `app/` and `lib/` trees omitted the same files. Both trees updated.
- [x] **Medium** `lib/brand-mark.tsx` claimed `app/icon.tsx` supplied the home-screen icon, contradicting `app/apple-icon.tsx`. Corrected to name `app/icon.tsx` (tab/search/tile) and `app/apple-icon.tsx` (180px) separately.
- [x] **Medium** `ui.md` forbade `#hex` in markup with no carve-out, and `lib/og-card.tsx` needs it. Added the `next/og` exception: satori resolves no stylesheet and supports no Tailwind.
- [x] **Low** `app/page.tsx` claimed JSON-LD and `llms.txt` both track `featuresData`; only JSON-LD does. Comment now says `llms.txt` is a hand-written copy kept out of sync on purpose.
- [x] **Low** `lib/site.ts` falls back to localhost with no note. `.env.example` now states the fallback is right for `next dev` and wrong for a deploy.
- [x] **Low** `"TrackXpense"` repeated as a literal in `app/icon.tsx` while `lib/site.ts` holds the single source. Now `site.name`.
- [x] **Low** `components/ui/progress.tsx` overclaimed ("a violation at every call site"). Trimmed to the actual rule.
- Accepted, not changed: `app/opengraph-image.tsx` and `app/twitter-image.tsx` are near-duplicates. Next fills `og:image` and `twitter:image` from separate file conventions, so each must default-export; the ~90-line card body is already shared in `lib/og-card.tsx`.
- Accepted, not changed: `"http://localhost:3000"` and `#0b1120` appear in two files each. One is a dev default in two unrelated subsystems, the other is an OG-card background that cannot read a CSS variable.

## Spec

- [x] **High** `alternates.canonical: "/"` sat in the root layout. Metadata is shallow-merged, so `/dashboard`, `/transaction/create` and `/account` each emitted a canonical pointing at the homepage. Moved to `app/page.tsx`. Verified: `/` emits one canonical, `/sign-in` emits none.
- [x] **Medium** `--color-warn` was darkened in `@theme` but never re-declared in `.dark`, so dark mode silently inherited the light lightness (`#b46e00`) — legible, but muddy. Dark override added at `oklch(0.72 0.15 70)` (7.0:1 on `--card`, 7.8:1 on `--background`).
- [x] **Low** `components/landing/live-ledger.tsx` carried an `h-[236px]` → `h-59` rewrite that no request asked for. It was introduced by `pnpm lint --fix`; reverted.
- [x] Spec 04's deferred note was stale: it described the old single-name cookie check. `docs/agent-guide/target-state.md:28` updated. Gate still presence-only and still unfixed by design (validating in the proxy costs a round trip per request) — that part of the deferral stands.
- No spec-04 increment was removed or altered by this unit.

## Gates

| Command                           | Result                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm test`                       | 13 files, 113 tests passed                                                            |
| `pnpm typecheck`                  | clean                                                                                 |
| `pnpm lint`                       | 0 errors, 1 pre-existing warning (`components/landing/closing-cta.tsx:3`)             |
| `pnpm build`                      | succeeded, 19 routes                                                                  |
| Lighthouse 13.5.0 (desktop, live) | performance 100, accessibility 100, best-practices 100, SEO 100, agentic-browsing 100 |

## Live checks (2026-10-17, https://track-xpense-lake.vercel.app)

- `GET /` 200; `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/opengraph-image`, `/twitter-image`, `/apple-icon`, `/icon/32` all 200 with expected content types.
- `og:image`, `og:title`, `og:url`, `twitter:card=summary_large_image`, `canonical`, `robots`, `googlebot`, `keywords` all present and absolute.
- Lighthouse `color-contrast` and `aria-progressbar-name` both score 1. `llms.txt` audit passes; the `webmcp-*` and `ard-schema` audits report `notApplicable` at weight 0, so the agentic-browsing score of 100 is real.
- `/api/health` → `{"ok":true,"database":"up"}` after the `DATABASE_URL` fix. `POST /api/demo` returns a session; with that cookie `/dashboard`, `/transaction/create` and `/account/[id]` all return 200.

## Not covered

- **`DIRECT_URL` removed from Vercel (2026-10-17, by the owner).** It had been stored with literal surrounding quotes from `vercel env pull`, and was unreadable as a Secret, so it was deleted rather than repaired. Safe: `prisma.config.ts:16` reads `DIRECT_URL || DATABASE_URL` and `workflow.md:99` documents that fallback, and no runtime code reads the var — only the Prisma CLI at build time. Production redeployed and re-verified after the deletion (`/api/health` up, all routes 200, Lighthouse unchanged at 100/100/100/100/100).
- Deleting it also closed the database split: `DIRECT_URL` pointed at Supabase while `DATABASE_URL` points at Neon, so migrations and runtime targeted different databases. Both now resolve to Neon via `DATABASE_URL`.
- No browser-automation pass over the authenticated UI. The Lighthouse numbers are the unauthenticated landing page only.
- Custom domain: metadata follows `NEXT_PUBLIC_APP_URL`. Adding a domain later means changing that one var and redeploying; nothing hardcodes the vercel.app host.

Verdict: pass
