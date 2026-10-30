# Review — per-route social cards, increment 1

Read-only `reviewer` subagent, two axes, against `HEAD` (8615427) plus the
uncommitted working tree on 2026-10-27. Fixed point: no commit yet.

## Standards

- [x] **High** `app/layout.tsx:52-56` — comment claimed "the home page's social
      values live in `app/page.tsx` via `socialCard`". `app/page.tsx:15-19` exports
      only a canonical; the home page inherits the layout values. Fixed: comment now
      says the home page inherits, and names `/terms` and `/privacy` as the callers.
- [x] **High** `app/layout.tsx:55-56` — "A route that must not advertise the
      product (auth, 404) opts out in its own file". Neither `app/(auth)/layout.tsx`
      nor `app/not-found.tsx` exports `metadata` (grep: no match). Fixed: comment now
      states both still emit the root values and points at increments 3 and 4.
- [x] **High** `lib/social-card.ts:36-50` — the helper replaced the root
      `openGraph` block, and the `opengraph-image` file convention did not fill the
      gap: `/terms` and `/privacy` served no `og:image` at all (measured against
      `pnpm start`, before the fix). Fixed: the helper now sets `images` for
      `openGraph` and `twitter`, and `tests/seo/unit/social-card.test.ts:68-75` pins
      it.
- [x] **Medium** `lib/social-card.ts:16-23` — docblock did not say that this
      block replaces the parent's rather than merging into it. Fixed: stated, with
      the consequence for `og:image`.
- [x] **Medium** `docs/agent-guide/service-architecture.md:33` — the `lib/site.ts`
      row still read as the author of canonical and `og:url`. Narrowed by the new
      `lib/social-card.ts` row at `:36`; left as is because the host claim in that
      row is still true.
- [x] **Low** `tests/seo/unit/social-card.test.ts:20,31-32` — compared values
      the helper derives from one parameter, so they could not fail independently.
      Fixed: each now asserts the literal string.
- [x] **Low** `tests/seo/unit/social-card.test.ts:56-60` — a no-op destructure
      used to narrow a union. Fixed: removed; `toMatchObject` reads through the union
      and now also covers `locale`.
- [x] **High** n/a — no auth or tenancy surface. The diff reads no session, adds
      no entry point, and `path` is a literal in each calling file, so no request
      value reaches an `og:*` tag.
- [x] **High** n/a — money invariants untouched: no Prisma call, no Decimal, no
      balance write.
- [x] **High** n/a — AGENTS.md rule 6: no secret added or printed; the diff
      touches no env var.
- [x] **n/a** AGENTS.md rule 11 — no state introduced. `socialCard` is a pure
      formatter, so there is no reducer to write.

## Spec

- [x] Increment 1 "a page's social card carries that page's own title" — met.
      `/terms` and `/privacy` serve their own `og:title`, `og:url`, canonical and
      description; `/` keeps the landing title.
- [x] Increment 2 "every shared link reports its own URL" — partial, by design.
      `lib/social-card.ts:35` already gives `/terms` and `/privacy` their own
      `og:url`; the increment's remaining work is `app/page.tsx`, which increment 1
      did not name, so this is the split holding rather than scope drift.
- [x] Increment 3 "auth routes stop advertising the product" — missing, and
      named as missing in `app/layout.tsx:56-57` rather than claimed done.
- [x] Increment 4 "a missing page stops claiming the home page's identity" —
      missing, same treatment.
- [x] Shipped beyond the spec: none. The `images` field in `lib/social-card.ts`
      is not a new increment — it restores behaviour the increment's own change
      removed.

## Gates (re-run after the fixes)

| Command       | Result                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `pnpm verify` | exit 0 — unit 18 files/134 tests, integration 4/6, typecheck, lint 0 errors/3 warnings, build ✓, e2e 6 passed (8.4s)     |
| `pnpm start`  | `/terms` + `/privacy` serve `og:image` absolute, 1200 wide; `/opengraph-image` → `200 image/png`, 139930 bytes, 1200×630 |

## Verdict

Verdict: pass

---

# Review — per-route social cards, increment 2

Read-only `reviewer` subagent, two axes, against `HEAD` (8943639) plus the
uncommitted working tree on 2026-10-28.

## Standards

- [x] **High** `app/page.tsx:13` — comment claimed `/` is "the only route that
      should claim the site title". False while `app/(auth)/layout.tsx` and
      `app/not-found.tsx` export no metadata and inherit `app/layout.tsx:30`. Fixed:
      the comment now states what this page earns (`og:url` of its own) and names
      increments 3 and 4 as the reason the layout defaults are still shared.
- [x] **High** `docs/agent-guide/service-architecture.md:36` — "Called by
      `app/terms/page.tsx` and `app/privacy/page.tsx`" omitted the new caller. Fixed:
      now names all three. AGENTS.md rule 10 — the doc is the defect.
- [x] **Medium** n/a — `app/page.tsx` is a strict superset of the block it
      replaced: every key it set before is set again, and `og:image`/`twitter:image`
      are now added where they used to be inherited.
- [x] **Low** `app/page.tsx:14-16` claimed the helper makes it impossible to set
      one field and forget another. Narrowed to "fills ... from one argument"; the
      helper does not carry `robots`, which stays a layout-inherited key.
- [x] **Declined** `tests/seo/unit/social-card.test.ts:77-87` — reviewer called it
      redundant with `:42-50`. Not acting: it is the only assertion that pins
      `path: "/"`, the exact value this increment's Done-when depends on, while
      `:42-50` asserts `/privacy`. Deleting it would let a regression on the home
      route pass.
- [x] **High** n/a — no doubled `<title>`. `title.template` does not apply to a
      page in the same segment (Next docs, `generate-metadata.md:287`), measured:
      `/` renders the landing title once.
- [x] **High** n/a — no auth or tenancy surface touched; no env var, no secret.
- [x] **n/a** AGENTS.md rule 11 — no state added.

## Spec

- [x] Increment 1 — still met; `/terms` and `/privacy` output re-measured
      unchanged after this change.
- [x] Increment 2 — met. `/` authors its card through `socialCard`; `og:url` and
      canonical are the bare origin; `og:image` present.
- [ ] Increment 3 — not started, as expected.
- [ ] Increment 4 — not started, as expected.
- [x] Shipped beyond the spec: the doc row and the comment correction, both
      required by rules 10 and 12 rather than new scope.

## Gates

| Command             | Result                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `pnpm verify`       | exit 0 — unit 18 files/135 tests, integration 4/6, typecheck clean, lint 0 errors/3 warnings, build ✓, e2e 6 passed (7.8s) |
| `pnpm start` + curl | `/` → landing title once, canonical and `og:url` both `http://localhost:3000`; `/terms` and `/privacy` unchanged           |

## Verdict

Verdict: pass

---

# Review — per-route social cards, increment 3

Read-only `reviewer` subagent, two axes, against `HEAD` (2575fe0) plus the
uncommitted working tree on 2026-10-30.

## Standards

- [x] **Low** `app/(auth)/layout.tsx:29-33` — `twitter.card: "summary_large_image"`
      with no `images` declared a large-image card a platform cannot render, and
      dropped the product image the route used to inherit. Fixed: `card: "summary"`,
      no image, comment records the choice.
- [x] **Low** `tests/seo/e2e/auth-metadata.spec.ts:25-27` — only `og:title` was
      pinned; deleting the `twitter.title` override would have stayed green.
      Fixed: the test asserts `twitter:title` too.
- [x] **Low** `docs/agent-guide/service-architecture.md:42` — the `tests/` row
      omitted `seo`. Fixed: features list now names it.
- [x] **Declined** `tests/seo/e2e/auth-metadata.spec.ts:10-16` — a hardcoded
      route list could miss a sixth auth page. Not acting: the spec names exactly
      these five; a new auth route is a new increment with its own test, and the
      layout applies to it regardless. A filesystem-derived list would couple the
      test to the route tree for no behavioural gain.
- [x] **High** n/a — no auth or tenancy surface added: metadata is build-time
      constants, no request value reaches `og:*`/`robots`, no session read.
- [x] **High** n/a — no secret added or printed; no env var touched.
- [x] **High** n/a — AGENTS.md rule 11: no multi-status state introduced.
- [x] **High** n/a — money invariants untouched: no Prisma/Decimal/balance write.

## Spec

- [x] Increment 1 — still met; `/terms` and `/privacy` output unchanged.
- [x] Increment 2 — still met; `/` still authors its own card.
- [x] Increment 3 — met. `/sign-in` and the other four auth routes serve
      `<title>TrackXpense</title>`, `robots: noindex`, `og:title`/`twitter:title`
      `TrackXpense` (never `site.title`), `twitter:card summary`, no card image.
- [ ] Increment 4 — not started, as expected.
- [x] Resolved decision recorded: the spec Done-when beats the design table's
      "root values kept"; `specs/14-per-route-social-cards.design.md:44` and the
      spec's Status now say so.
- [x] Blast-radius truth-fixes (`app/layout.tsx:48-57`,
      `docs/agent-guide/service-architecture.md:38`) match the built output and
      are minimal.
- [x] `follow: false` dropped: the spec asks only for `noindex`, so `robots`
      emits `noindex` alone.

## Gates

| Command       | Result                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm verify` | exit 0 — unit 18 files/135 tests, integration 4/6, typecheck clean, lint 0 errors/3 warnings (183 files), build ✓, e2e 11 passed (9.5s)                      |
| built HTML    | `/sign-in` → `<title>TrackXpense</title>`, `robots noindex`, `og:title`/`twitter:title` `TrackXpense`, `twitter:card summary`, no `og:image`/`twitter:image` |

## Verdict

Verdict: pass

---

# Review — per-route social cards, increment 4

Read-only `reviewer` subagent, two axes, against `HEAD` (29ed241) plus the
uncommitted working tree on 2026-10-30.

## Standards

- [x] **Low** `docs/agent-guide/service-architecture.md:88` — the 404 metadata
      changed but the implemented-surface body recorded nothing. Fixed: new
      `app/not-found.tsx` row in the module table.
- [x] **Low** `specs/14-per-route-social-cards.md:148-159` — the unverified list
      did not name the segment `notFound()` path. Fixed: labelled unexercised.
- [x] **High** n/a — duplicate `noindex` is not a defect: Next auto-injects one
      for a 404, and the explicit `robots: { index: false }` stops the child
      inheriting the root's `index: true`, so the two agree rather than
      contradict (`not-found.md:15,189`).
- [x] **High** n/a — losing `og:image` is sanctioned: the declared `openGraph`
      bypasses the file convention, `twitter:card "summary"` mirrors increment 3,
      and per-route card art is ruled out by the design.
- [x] **High** n/a — `app/layout.tsx:55-57` stays true: only the six metadata
      exports exist, so "the authenticated ledger routes still inherit it" holds.
- [x] **High** n/a — no auth/tenancy surface, no secret, no env var, no state
      (rule 11), no money path touched.

## Spec

- [x] Increment 1 — met (merged #29).
- [x] Increment 2 — met (merged #30).
- [x] Increment 3 — met (merged #31).
- [x] Increment 4 — met. Unmatched path → `404`,
      `<title>Page Not Found — TrackXpense</title>`, `robots: noindex` (Next
      injects a second agreeing one), `og:title`/`twitter:title`
      `Page Not Found — TrackXpense`, no `og:url`.
- [x] No extra scope: the restated `openGraph` fields are required because a
      child block replaces the root's wholesale.
- [x] Blast-radius truth-fixes (`app/layout.tsx:55-57`, the
      `service-architecture.md` row) are accurate and minimal.

## Gates

| Command       | Result                                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm verify` | exit 0 — unit 18 files/135 tests, integration 4/6, typecheck clean, lint 0 errors/3 warnings (184 files), build ✓, e2e 12 passed (8.7s)                             |
| built HTML    | unmatched path → `404`, `<title>Page Not Found — TrackXpense</title>`, two `robots noindex`, `og:title`/`twitter:title` `Page Not Found — TrackXpense`, no `og:url` |

## Verdict

Verdict: pass
