# Agent Guide — the bodies behind `AGENTS.md`

`AGENTS.md` is the contract: STANDING RULES, the health check, the stub for every section this directory holds,
and the two sections kept whole (`### Status`, `## Repo skills`). Everything the contract points at lives here as a
body, and this file's order **is** the read order — the same order `AGENTS.md` §14 states.

Read `AGENTS.md` first. Then read these in order, and only the one your change invalidates needs updating:

1. `docs/agent-guide/overview.md` — what the app is for, its scope, its success criteria, its open product questions.
2. `docs/agent-guide/architecture.md` — stack, system boundaries, storage and persistence model, auth and tenancy, HTTP surfaces, invariants.
3. `docs/agent-guide/ui.md` — design tokens, per-component conventions, styling rules, images and icons.
4. `docs/agent-guide/code-standards.md` — naming, imports, language strictness and the two flags held off, Next 16 framework rules, error handling, HTTP handler shape, data access, file organization, testing.
5. `docs/agent-guide/workflow.md` — the loop, the commands with what each actually proves here, where logic goes, schema-change procedure, the unit-exit checklist.
6. `docs/agent-guide/pm-conventions.md` — commit prefixes, PR body contract, the review gate as this repo applies it.
7. `docs/agent-guide/service-architecture.md` — implemented surface only: request path, module status, cross-cutting authorities, routes, jobs, pages, and the gate output.
8. `docs/agent-guide/target-state.md` — design intent that has not landed, or landed and never run. Read it before claiming a feature exists.
9. `docs/agent-guide/verification-standards.md` — bad doc line, why it misleads, the honest replacement. Check a status sentence against it before writing it.
10. `docs/agent-guide/editing.md` — when each section earns a fact, the health check's full rule, and the one rule that orders everything.

## What is policed here

`tests/platform/unit/instruction-layer.test.ts` runs the same rules over this directory that it runs over
`AGENTS.md`, and CI's gate 2 runs that file:

- **No unfilled template slot.** The angle-bracket check reads every file here, not just `AGENTS.md`.
- **Every repo path cited outside a fence resolves**, and a line range past the end of its file is a defect.
  Inside a fence nothing is checked — which is why the fenced file-organization tree in
  `docs/agent-guide/code-standards.md` has gone stale before without failing anything.
- **This index lists every body, and every body is pointed at from `AGENTS.md`.** A new file here with no stub
  there, or a stub pointing at a file that does not exist, fails the run.
- The env-variable inventory is read across both homes at once, so a name that appears only in a body still has to
  be in `.env.example`, and vice versa.

Suite totals have exactly two homes: `AGENTS.md` §13 gate 2 and `docs/agent-guide/service-architecture.md`
§ Verification. Nothing else in this directory states a count.

## What stays in `AGENTS.md`

The heading skeleton — every heading, in order, compared against the vendored fixture on every run. Moving a body
out never moves its heading: the heading stays as a stub carrying the one fact that constrains work, so the
structure gate and the template contract are untouched. `pnpm skeleton:refresh` regenerates the fixture from the
sibling template and is the only way it changes.
