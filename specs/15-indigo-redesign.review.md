## Standards

- [x] **Medium** docs/agent-guide/service-architecture.md:30 — listed deleted helpers (savings rate, weekday spend, year-over-year). Fixed: row now names month/year category ranking and the 7d/30d/6m spend series.
- [x] **Medium** app/(main)/dashboard/_components/quick-entry.tsx:94 — amount input had no visible focus. Fixed: `focus-within:outline-2 focus-within:outline-indigo` on the label.
- [x] **Low** app/(main)/account/layout.tsx:7 — parent-relative import. Fixed: `@/app/(main)/_components/app-sidebar`.
- [x] **Low** app/(main)/dashboard/_components/recent-activity.tsx:91 — recurring chip lavender on lime. Fixed: `text-navy` on the saved row.
- [x] **Low** app/(main)/dashboard/_components/accounts-card.tsx:51 — lime text on `bg-card` in dark. Fixed: `dark:text-indigo-soft`.
- [x] **Low** docs/agent-guide/ui.md:9 — new token lines lacked anchors. Fixed: `globals.css:71`, `:439`, `:434`.

## Spec

- [x] **High** tests/auth/e2e/auth.spec.ts:20 — selector clicked the deleted `button[title="Sign out"]`. Fixed: opens "Account menu", clicks the "Sign out" menuitem. Not run: e2e unrun (below).
- [x] **High** specs/15-indigo-redesign.md Verification — `pnpm build` exited 1 at the Next.js 16.4.2 SecurityFatalError advisory stop after compiling every route; `pnpm test:e2e` not run. Not fixed: the owner chose to commit with both gates unmet; the commit message states it.
- [x] **Medium** app/(main)/dashboard/_components/quick-entry.tsx:49 — design said empty description blocks submit. Not a defect: description is optional (`lib/schema.ts:17`); design doc corrected.
- [x] **Medium** app/(main)/dashboard/_components/recent-activity.tsx:32 — backdated saved row could fall outside the top 5. Fixed: saved row sorts first.
- [x] **Low** app/(main)/transaction/_components/type-form.tsx:27 — re-clicking the active type cleared category. Fixed: early return.
- [x] **Low** app/(main)/transaction/_components/add-transaction-form.tsx:282 — preview copy claimed a timeout. Fixed: "Highlighted on the dashboard when you land there."
- [x] **Low** components/user-nav.tsx:36 — Budget anchor dead with no default account. Fixed: falls back to `/dashboard`.
- [x] **Low** components/user-nav.tsx:67 — theme toggle outside the menu; `sign-out-button` removed. Design doc updated to match.

1. Dashboard + palette — met.
2. Header + shell — met.
3. New-entry page — met.

Gates after fixes: `pnpm test` 140/140, `pnpm test:integration` 6/6, `pnpm typecheck` 0 errors, `pnpm lint` 0 errors / 3 pre-existing warnings. `pnpm build` red (advisory stop), `pnpm test:e2e` unrun.

## Verdict

Verdict: pass
