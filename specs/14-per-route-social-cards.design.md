# Design — per-route social cards

## Decision that this stage settles

Increment 1 composes page metadata through one helper, `lib/social-card.ts`,
not four hand-written `openGraph` blocks.

Why the helper wins: the defect is a page setting `title` while `openGraph`
keeps the root value (`app/layout.tsx:52-66`). Hand-writing both keys per page
recreates the defect the first time someone adds a page and remembers only one
key. The helper takes a title, a description and a path, and fills every social
key from the title, so the two cannot disagree.

Single authority: `lib/social-card.ts` owns "a page's social metadata". The root
layout stops declaring `openGraph`/`twitter` values that only make sense for `/`.
Root keeps `metadataBase`, the title template, and every non-social field.

Signature (shape fixed here, body written in `/build`):

```ts
socialCard({ title, description, path }) → Pick<Metadata, "title" | "description" | "alternates" | "openGraph" | "twitter">
```

- `title` — page title without the site suffix; the layout template adds
  `— TrackXpense` to `<title>` exactly as today.
- `description` — page copy; falls back to `site.description` when omitted.
- `path` — canonical path. Feeds `alternates.canonical`, `openGraph.url` and
  the card's own URL. One argument, so `og:url` cannot disagree with the
  canonical.

Pure data, no React, no I/O, so it is unit-testable without a request.

All `file:line` below are as of 2026-10-27; `/build` re-reads before editing.

## States

The card surface has no runtime state: it is metadata in prerendered HTML. The
states are per route, and each is a build output rather than a render branch.

| State      | Route                                                                            | Today (measured)                         | After                                                  |
| ---------- | -------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------ |
| Home       | `/`                                                                              | own title, root OG values                | unchanged                                              |
| Legal page | `/terms`, `/privacy`                                                             | `<title>` own, `og:title` root           | title + description + `og:url` own                     |
| Auth page  | `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`, `/email-verified` | root everywhere; no page metadata at all | own neutral title, `noindex`; landing headline dropped |
| Not found  | any unmatched path                                                               | `404` + root OG, root `og:url`           | `noindex`, own title, no `og:url` claim                |

Crawler-cached state: a platform that already scraped a URL keeps its old card
until the cache expires. No code state; called out so a stale unfurl is not
read as a failed deploy.

## Layout

No visual layout changes. The unfurl card is the existing 1200×630 render from
`lib/og-card.tsx:14-112` served by `app/opengraph-image.tsx:13-15` and
`app/twitter-image.tsx:13-15`. Not touched by this work.

Per-route card art is explicitly **not** in this design: `/terms` and `/privacy`
are linked only from the footer (`components/footer.tsx:77-80`) and are not in
`publicRoutes` (`lib/site.ts:30`), so a distinct image would render for an
audience that does not exist yet. Revisit if legal pages ever get promoted.

## Interaction

None. No control, no keyboard path, no submit. The only user-visible behaviour
is what a platform shows after scraping, which this work changes only in
content.

## Tokens

No new token, and no `ui.md` change: metadata ships no styles.

If card art is added later, it would reuse the `next/og` hex exception already
recorded at `docs/agent-guide/ui.md:19` — satori resolves no stylesheet, so
`lib/og-card.tsx` and `lib/brand-mark.tsx` inline hex by design.

## Accessibility

Metadata is not in the accessibility tree; nothing here changes focus order,
rings or labels.

Indirect accessibility obligation: `twitter:image` and `og:image` keep their
`alt` (`app/opengraph-image.tsx:11`, `app/twitter-image.tsx:11`). Platforms
render that alt, so a route-scoped image added later must keep exporting `alt`
or shared links lose their description for screen-reader users on the
destination page.

## Data

Server: none. Static copy from `lib/site.ts:12-23` plus per-page literals, so the
metadata is correct in the prerendered HTML — the reason `lib/site.ts:6-8` gives
for reading the env var at build time.

While data is absent: nothing to show. `/terms` and `/privacy` are static pages;
the redesign adds no fetch, no loading state and no error state.

## Security

No entry point, so nothing to authorise. Metadata is build-time constants; no
request header, query or body reaches an `og:*` value, so there is no injection
path and no credential involved. The one rule to hold: a `path` argument must
stay a literal written in the file, never derived from a request.

## Consequences to expect in `/build`

- `lib/social-card.ts` added; one new unit test in `tests/seo/unit/`.
- `app/layout.tsx:52-66` loses the hardcoded `openGraph`/`twitter` values.
  Removing `openGraph` entirely would drop `og:site_name`/`og:locale` from
  routes that call no helper, so the root keeps them as defaults and helpers
  override per page. Concrete shape is a `/build` decision; the constraint is
  that auth and 404 routes do not ship the landing headline.
- `docs/agent-guide/service-architecture.md` module table gains
  `lib/social-card.ts` in the same change (doc is the defect otherwise).
- No migration, no env var, no route added.

## Open questions carried from the spec

- Canonical host still undecided (`track-xpense-lake.vercel.app` today).
  `site.url` already centralises it, so no code blocks on the answer.
- Whether auth routes should carry a card at all. Design assumes no.
- `noindex` on the 404 is a product call; the design only rules out the current
  behaviour of advertising the home page's URL from a missing page.
