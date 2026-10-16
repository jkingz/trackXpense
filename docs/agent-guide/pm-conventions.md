## PM Conventions

Full commit/push/PR discipline: `/git-workflow` skill.

### Commits

- Prefix: `feat:` `fix:` `style:` `perf:` `refactor:` `chore:` `docs:` `test:` `build:` `ci:`
- One logical change per commit. Subject says **why**; body ≤ 4 lines.
- Example: `feat(transaction): add category filtering on dashboard`
  - Users can filter transactions by category
  - Adds Zod validation + updates the query
  - Closes #42

### PRs

- Title: `type(scope): imperative summary` — e.g. `feat(auth): add staff role access`.
- Body: what changed (2–3 bullets), how verified (gate + manual check), what wasn't covered.
- One PR per feature. No grab-bags. Draft until gate green, then request review.
- Merge: squash small features, rebase larger.

### Review gate

Authority for the chain. Counts → `service-architecture.md` Verification.

1. `tsc --noEmit --incremental false` → 0 errors. No `typecheck` script; don't trust `tsc --listFilesOnly` (lists, doesn't check).
2. `vp test` → green. No `pnpm test` script.
3. `pnpm build` → succeeds (type-checks, does not lint).
4. `vp check` → exit 0. Warnings tolerated, a new error is not. `vp check --fix` is the formatter + pre-commit hook.
5. Manual verification. `pnpm db:seed` + read-only `curl` prove pages render (measured 2026-10-16: `/dashboard` 200 anonymously with seeded figures and an h1; `?page=2`, `?type=INCOME`, `?search=rent` each return different rows).
   - **Unproven:** no create/update submitted through a browser — money paths exercised only by the seed script. Email + Inngest never fired (`INNGEST_EVENT_KEY`/`INNGEST_SIGNING_KEY` unset; `RESEND_API_KEY` + `GEMINI_API_KEY` present, so untriggered not unconfigured). Receipt scan is the one browser-exercised action (measured 2026-10-16, HTTP 200, fields filled). Account page transaction list not scoped to the account in its heading.

CI (`.github/workflows/ci.yml`): `vp install --frozen-lockfile` → `vp check` → `vp test` → `vp run build` on Node 24.
