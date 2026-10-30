# 14 — Per-route social cards and canonical URLs

## Status

Written 2026-10-27 from a live check of production. Designed in
`specs/14-per-route-social-cards.design.md`. Increments 1–3 merged (#29, #30,
#31). Increment 3: auth routes drop the landing `og:title` (neutral `TrackXpense`
title, `summary` card, no image) and carry `noindex` — this spec's Done-when
beats the design table's "root values kept". Increment 4 built 2026-10-30: the
404 gets its own title and `noindex`, and no `og:url`.

## Goal

Sharing any public route shows that route's own title in the card, and only the
home page claims a canonical. Observable: `/terms` unfurls with "Terms &
Conditions — TrackXpense", not the landing headline.

Root cause: `app/layout.tsx:52-66` declares `openGraph` and `twitter` once at the
root, with `title`/`description` hardcoded to `site.title`/`site.description`. A
page that sets only `metadata.title` (`app/terms/page.tsx:3-6`,
`app/privacy/page.tsx:3-6`) replaces `<title>` and leaves `og:title` on the root
value, because `openGraph`/`twitter` are separate keys that are shallow-merged,
not derived from `title`.

Measured 2026-10-27 against `https://track-xpense-lake.vercel.app`:

- `/privacy` → `<title>Privacy Policy — TrackXpense</title>`, `og:title` =
  site title.
- `/terms` → `<title>Terms &amp; Conditions — TrackXpense</title>`, `og:title` =
  site title.
- `/sign-in` → no page metadata at all; title and `og:title` both fall back to
  the root. Acceptable: auth routes are not shared.
- `/nope` → `http=404`, still emits the root `og:title` and `og:url`.
- `og:url` is `https://track-xpense-lake.vercel.app` on every route, so a shared
  deep link reports the home page as its URL.
- `/opengraph-image` and `/twitter-image` both `200 image/png`, 139930 bytes,
  1200×630 (`file`), byte-identical across fetches. The image pipeline itself
  needs no change.

## Increments

Each one builds, carries its own test, and commits without the next.

1. **A page's social card carries that page's own title.** `/terms` and
   `/privacy` unfurl with their own title, description and URL instead of the
   landing headline. The risk sits here: the shared helper and the root layout's
   handoff, both of which every later increment depends on.

   Files: `lib/social-card.ts` (new), `app/layout.tsx`, `app/terms/page.tsx`,
   `app/privacy/page.tsx`, `tests/seo/unit/social-card.test.ts` (new),
   `docs/agent-guide/service-architecture.md`.

   Build note for increment 1:

   - **Files** — exactly the six above. `app/page.tsx`, `app/not-found.tsx`,
     the auth routes, `app/opengraph-image.tsx`, `app/twitter-image.tsx`,
     `lib/site.ts` and the schema are out of scope.
   - **Test** — `tests/seo/unit/social-card.test.ts`, asserted from the returned
     metadata object, not from HTML: `title` equals the page title;
     `openGraph.title` equals the same string; `openGraph.url` and the canonical
     equal `path`; `twitter.title` equals the same string; omitting `description`
     yields `site.description`; `openGraph.images` carries the card image. Each
     assertion names the key it reads, so an empty object fails rather than
     passes.
   - **Done when** a curl of the running server shows `og:title` on `/terms` and
     `/privacy` matching their `<title>` prefix, an `og:image` on both, and `/`
     still showing the landing title.

2. **Every shared link reports its own URL.** `/` declares its social values
   through the same helper, so the home page's card is authored in its own file
   rather than inherited from the layout.

   Files: `lib/social-card.ts`, `app/page.tsx`, `tests/seo/unit/social-card.test.ts`.

   Done when `curl -s /` shows the landing title, a canonical of the bare
   origin, and `og:url` equal to it.

3. **Auth routes stop advertising the product to crawlers.** `/sign-in`,
   `/sign-up`, `/forgot-password`, `/reset-password` and `/email-verified` carry
   `noindex`, so a shared or indexed auth URL is not a duplicate of the landing
   page.

   Files: `app/(auth)/layout.tsx`, `tests/seo/e2e/auth-metadata.spec.ts` (new).

   Done when served HTML for `/sign-in` shows `robots: noindex` and never the
   landing `og:title`.

4. **A missing page stops claiming the home page's identity.** The 404 emits its
   own title, `noindex`, and no `og:url` pointing at `/`.

   Files: `app/not-found.tsx`, `tests/seo/e2e/not-found-metadata.spec.ts` (new).

   Done when a request for an unmatched path returns `404` with its own title and
   no `og:url` equal to the origin.

## Deferred / open questions

- Which host is canonical? Production tags point at
  `track-xpense-lake.vercel.app` (set by `NEXT_PUBLIC_APP_URL`,
  `lib/site.ts:10`). `jkingzx.pro` is registered in the Vercel team but not
  attached to this project, and `track-xpense.vercel.app` /
  `trackxpense.vercel.app` serve unrelated apps (measured 2026-10-27). Moving to
  a custom domain is one env var plus a redeploy; no code change.
- Does the owner want auth routes carded at all?
- Whether the 404 keeps the root `og:url` is a product call, not a defect.
  Increment 4 answers it: no `og:url` on the 404.

## Security / permissions

No auth surface touched. `/terms` and `/privacy` are public; `/sign-in` is
already public. Metadata is static build-time text with no user input, so no
injection path into `og:*` values. No new env var.

## Verification

Increment 1, measured 2026-10-27 (`pnpm start` after `pnpm build`):

- `pnpm verify` → exit 0. Unit `18 files / 133 tests`, integration `4 files / 6
  tests`, typecheck clean, lint `0 errors / 3 warnings` in 182 files, build
  `✓ Compiled successfully`, e2e `6 passed (8.4s)`. Nothing skipped.
- `/terms` → `og:title "Terms & Conditions"`, `og:url …/terms`, canonical
  `…/terms`.
- `/privacy` → `og:title "Privacy Policy"`, `og:url …/privacy`, canonical
  `…/privacy`.
- `/` → landing title, canonical the bare origin.
- `/sign-in` and an unmatched path → still the root title (increments 3 and 4).
- Port 3000 released; no orphan server or Playwright process.

Increment 3, measured 2026-10-30 (`pnpm verify`):

- `pnpm verify` → exit 0. Unit `18 files / 135 tests`, integration `4 files / 6
  tests`, typecheck clean, lint `0 errors / 3 warnings` in 183 files, build
  `✓ Compiled successfully`, e2e `11 passed (9.5s)` — 5 new auth-metadata cases.
- Served `/sign-in` → `<title>TrackXpense</title>`,
  `<meta name="robots" content="noindex">`, `og:title`/`twitter:title`
  `TrackXpense`, `twitter:card summary`, no card image. Same on `/sign-up`,
  `/forgot-password`, `/reset-password`, `/email-verified` (e2e).

Increment 4, measured 2026-10-30 (`pnpm verify`):

- `pnpm verify` → exit 0. Unit `18 files / 135 tests`, integration `4 files / 6
  tests`, typecheck clean, lint `0 errors / 3 warnings` in 184 files, build
  `✓ Compiled successfully`, e2e `12 passed (8.7s)` — 1 new not-found case.
- Unmatched path → `404`, `<title>Page Not Found — TrackXpense</title>`,
  `<meta name="robots" content="noindex">` (Next also injects one),
  `og:title`/`twitter:title` `Page Not Found — TrackXpense`, no `og:url`.

Still unverified:

- Not deployed. The production curl against `track-xpense-lake.vercel.app`
  has not been re-run since this change.
- A real Slack/Discord unfurl was not exercised; only served HTML was read. A
  platform that already scraped a URL keeps its cached card.
- `/opengraph-image` was not re-fetched this increment; the image pipeline is
  untouched by it.
- Increment 3 is local only: the auth routes were read from the build output,
  not production, and no real unfurl was exercised for them either.
- Increment 4 is local only too: the 404 was read from the built
  `_not-found.html`, not production.
- Only the unmatched-URL 404 was exercised. Whether the same metadata reaches a
  `notFound()` thrown from a route segment (e.g. `account/[id]`) is unexercised.
