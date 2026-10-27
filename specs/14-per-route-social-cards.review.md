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
