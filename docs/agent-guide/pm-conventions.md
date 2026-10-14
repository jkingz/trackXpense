## PM Conventions

See `/git-workflow` skill for complete commit conventions, push discipline, and PR workflow.

### Commits (summary)

- Prefix: `feat:` `fix:` `style:` `perf:` `refactor:` `chore:` `docs:` `test:` `build:` `ci:`
- One logical change per commit
- Subject says **why**, body ≤ 4 lines
- Example: `feat(transaction): add category filtering on dashboard`
  - Users can now filter transactions by category on the dashboard
  - Adds Zod schema validation and updates the transaction query
  - Closes #42

### PRs (summary)

- Title: `type(scope): imperative summary` — e.g., `feat(auth): add staff role access`
- Body: what changed (2–3 bullets), how verified (gate + manual check), what wasn't covered (third-party, prod-only)
- One PR per feature. No grab-bag PRs.
- Draft until gate is green; request review after.
- Merge style: Squash-merge for small features, rebase-merge for larger features

### Review gate

The chain from `/verification-gates` skill and STANDING RULES (Rule 13):
1. `pnpm typecheck` → 0 errors
2. `pnpm test` → green; the baseline lives in `docs/standing-rules/13-verification-gates.md` gate 2
3. `pnpm build` → succeeds (it type-checks; it does not lint)
4. `pnpm lint` → no **new** error class; the tree stays red on pre-existing debt (the census is quoted in § Verification), so "green lint" is not the gate
5. Manual verification (smoke test in browser, database state, etc.) — impossible for auth/DB/email flows here; the missing credentials are named in `docs/standing-rules/13-verification-gates.md` gate 5

Deviation, on the books: the template sentence "CI runs the same commands" is not yet true here, because CI has
no lint step while gate 4 is red on a recorded census. Either the census gets decided (TARGET STATE) or this
sentence becomes the repo's written exception.

---

