# Agent Guide — bodies behind `AGENTS.md`

`AGENTS.md` = the contract: STANDING RULES, health check, one stub per section. Bodies live here. Order below = read order = the Project docs table order in `AGENTS.md`.

Read `AGENTS.md` first, then only the body your change invalidates.

1. `overview.md` — what the app is, scope, success criteria, open questions.
2. `architecture.md` — stack, boundaries, storage, auth/tenancy, invariants.
3. `ui.md` — tokens, per-component conventions, styling, icons.
4. `code-standards.md` — naming, imports, strictness, Next 16 rules, errors, data access, state, tests.
5. `workflow.md` — loop, commands + what each proves, where logic goes, schema changes.
6. `pm-conventions.md` — commit prefixes, PR body, review gate.
7. `service-architecture.md` — implemented surface only, plus the count home.
8. `target-state.md` — intent not landed, or landed and never run. Read before claiming a feature works.
9. `verification-standards.md` — bad line vs honest line. Check status sentences here.
10. `editing.md` — doc style + health check + when a section earns a fact.

## Policing

Nothing enforces this today: `tests/platform/` (the checker that read `AGENTS.md`, these bodies, the skills, `.env.example` off disk) is not in the tree. So these rules are conventions, not gates — and a doc/`AGENTS.md` drift fails nothing. See `target-state.md`.

Checks to keep even though nothing enforces them:

- No unfilled slot marker (angle-bracket check) in `AGENTS.md` or any body.
- Every `file:line` cited outside a fence resolves; a range past EOF is a defect.
- `AGENTS.md` stubs every body here; every body is listed above.
- `.env.example` names every env var referenced anywhere in either home.

Counts have one home: `service-architecture.md` → Verification. No other body states a total.

## What stays in `AGENTS.md`

Heading skeleton (every heading, in order) + the two whole sections. Moving a body out never moves its heading — the stub stays, carrying the one fact that constrains work.
