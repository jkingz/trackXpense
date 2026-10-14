# Standing Rules — the project-specific bodies behind `AGENTS.md`

`AGENTS.md` keeps the STANDING RULES headings because the heading skeleton is compared against a vendored template
fixture on every run. Rules 1–10 are portable and stay whole there. Rules 11–17 are this repo's own facts, and their
bodies live here — one file per rule, numbered in reading order, which is also this index's order.

Read `AGENTS.md` first. Then, when the rule you are working under needs its evidence, read the body:

1. `docs/standing-rules/11-package-manager-and-runtime.md` — what `pnpm` and Node actually resolve to here, and why the version pin was removed.
2. `docs/standing-rules/12-framework-version-drift.md` — the Next 16 defaults that contradict training data, and where the authority lives.
3. `docs/standing-rules/13-verification-gates.md` — the five gates with their baselines, what CI really runs, and what the checker cannot see.
4. `docs/standing-rules/14-application-building-order.md` — the section order a change must be read in.
5. `docs/standing-rules/15-cross-cutting-authority.md` — the one authority for auth, database access, errors and validation.
6. `docs/standing-rules/16-datastore-and-external-service.md` — Prisma 7's split config, the migration procedure, the env inventory.
7. `docs/standing-rules/17-protected-foundations.md` — the files that carry the gate, the data shape and the type contract.

## What is policed here

`tests/platform/unit/instruction-layer.test.ts` runs the same rules over this directory that it runs over
`AGENTS.md` and `docs/agent-guide/`, and CI's gate 2 runs that file:

- **No unfilled template slot** in any file here.
- **Every repo path cited outside a fence resolves**, line ranges included.
- **This index lists every body, and every body is pointed at from `AGENTS.md`.** A rule file with no stub there,
  or a stub pointing at a file that does not exist, fails the run.
- The env-variable inventory is read across all three homes at once, so a name that appears only here still has to
  be in `.env.example`, and vice versa.

Suite totals have exactly two homes: Rule 13's gate 2 above and `docs/agent-guide/service-architecture.md`
§ Verification. Nothing else in this directory states a count.
