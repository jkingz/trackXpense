## Standards

- [x] **High** n/a — tenancy: the only new write `actions/currency.ts:18` is scoped through `checkUser`; migration adds a `NOT NULL DEFAULT 'USD'` column then switches the default to PHP, safe on existing rows.
- [ ] **Medium** `docs/agent-guide/ui.md:18` — landing token lines (`brand-deep`, `brand-veil`, `ink`, `paper`) removed while the tokens still exist (`app/globals.css:61-66`) and are used (`components/header.tsx:83`). Fix: restore one line citing `globals.css:61`, or remove the tokens and their uses.
- [ ] **Medium** `app/globals.css:262` — `.glass-panel` (also `:273`, `:366`, `:374`) has no product user after the landing deletions. Fix: delete the four blocks.
- [ ] **Medium** `app/page.tsx:52` — JSON-LD `featureList` reads a hand-kept array (`data/landing.tsx:1`), no longer tied to rendered content. Fix: drop `featureList` or derive it from `components/landing-flow.tsx` steps.
- [ ] **Low** `app/(main)/dashboard/_components/category-breakdown.tsx:40` — `Progress` carries both `aria-hidden` and `aria-label`. Fix: drop `aria-label`.
- [ ] **Low** `app/(main)/account/_components/transaction-table.tsx:2` — `@/app/...` import above external imports; same in `accounts-form.tsx:1`, `account-row.tsx:3`, `budget-progress.tsx:2`, `account-chart.tsx:2`, `cashflow-panel.tsx:3`. Fix: move into the `@/` group.
- [ ] **Low** `docs/agent-guide/ui.md:28` — says the Pocket Log hero renders as Server Components; the hero renders a client island (`components/landing/pocket-log-figure.tsx:1`). Fix: name the client island.

## Spec

Spec 15:

1. Met. Currency persists and reaches every signed-in money surface (`tests/auth/integration/user-lifecycle.test.ts:20`, `tests/dashboard/e2e/dashboard.spec.ts:32`).
2. Met. Daily Ledger order with pinned rail (`app/(main)/_components/app-sidebar.tsx:50`); empty states and skeletons kept (`app/(main)/dashboard/page.tsx:154`).

Spec 16:

1. Met. Pocket Log hero (`components/hero.tsx`, `components/landing/pocket-log-figure.tsx`).
2. Met. Workflow and closing actions (`tests/smoke/e2e/smoke.spec.ts:19-26`).

Shipped without a spec:

- [ ] **Medium** `next.config.ts:17` — `experimental.agentUpgrade: "security"` is in no spec. Fix: revert or name it.
- [ ] **Medium** `package.json:37` — Next 16.4.2 → 16.4.6 bump with lockfile churn. Fix: split into its own `chore(deps)` change.
- [ ] **Medium** `lib/brand-mark.tsx:2` — brand mark redrawn; `app/apple-icon.tsx:12` gained a `square` mode. Fix: revert, or add an icon increment to spec 16.
- [ ] **Low** `app/page.tsx:56` — JSON-LD `priceCurrency` USD → PHP outside both specs. Fix: revert or name it in spec 16.

## Verdict

Verdict: pass
