## Standards

Merge of origin/main (indigo/lime redesign, `specs/15-indigo-redesign.md`) with the ledger currency ported into main's components.

- [x] **High** `docs/agent-guide/ui.md:12` — marquee/perspective claims had no CSS behind them. Fixed: removed; reduced-motion line cites `app/globals.css:398`.
- [x] **High** `docs/agent-guide/ui.md:27` — said `components/hero.tsx` is a client component for scroll motion. Fixed: hero is server, receipt animation is the client island `components/landing/pocket-log-figure.tsx:1`; Pocket Log tokens restored (`globals.css:50`, `components/hero.tsx:38`).
- [x] **Medium** `docs/agent-guide/ui.md:9-12` — stale `globals.css` citations. Fixed: `:60`, `:75`, `:365`, `:370`.
- [x] **Low** `app/globals.css:192` — dead `.daily-ledger` palette and `.ledger-panel` after the layout dropped them. Fixed: deleted (grep: no users in app/ or components/).
- [x] **Low** `app/(main)/dashboard/_components/balance-hero.tsx:30` — sign threshold differed from `formatMoney`. Fixed: `<= -0.005`.
- Clean: no hard-coded `$`/`usd`/`signedUsd` left in app/, components/, emails/; no double minus; every `CurrencyContext` consumer sits under `CurrencyProvider` (`app/(main)/layout.tsx:14`).

## Spec

Spec 15 (daily ledger):

1. Met. Currency persists and reaches main's dashboard (`app/(main)/dashboard/page.tsx`), transaction form (`app/(main)/transaction/_components/amount-form.tsx:23`) and account pages; switcher in the Accounts card (`app/(main)/dashboard/_components/accounts-card.tsx:81`).
2. Superseded by `specs/15-indigo-redesign.md` (merged from main); recorded at `PRODUCT.md:38`.

Spec 15 (indigo redesign), as merged:

- [x] **High** `specs/15-indigo-redesign.md:21` — said figures stay `$` and the pill is not built. Fixed: names the per-user currency and `CurrencyMenu`.

1. Met. Hero, quick entry, Accounts card, budget, spend bars, Where it went, Recent entries.
2. Met. Rail only on account pages (`app/(main)/account/layout.tsx`).
3. Met by file diff; `?saved=` redirect not exercised beyond e2e.

E2E: `tests/dashboard/e2e/dashboard.spec.ts:12` matches the Accounts heading exactly; `:60` checks only visible balance text, because the hidden dashboard stays mounted after navigation.

Extras: `currencySymbol` (`lib/money.ts:13`) needed by the split symbol layout; `aria-label="New account"` on the Accounts card button.

## Verdict

Verdict: pass
