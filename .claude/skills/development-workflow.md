---
description: Development workflow, scoping, and the work loop per unit of work
when: "user starts a new task, needs to scope work, or asks about development process"
---

# Development Workflow

## The loop, per unit of work

1. **Read what governs the change** — STANDING RULES first, then the context sections for the touched module in AGENTS.md.
2. **Say the scope in one sentence** — what changes, and what explicitly does NOT.
3. **Implement the smallest increment** that can be verified on its own.
4. **Verify with a command** — never with a claim. Use `/verification-gates` skill.
5. **Update the docs** the change made untrue — in the same change (AGENTS.md, specs/, inline comments).
6. **Report** — what changed, what was verified, what is still unknown.

## Scoping rules

- **One feature unit or one agent at a time.**
- Split when a step crosses boundaries (auth + database + UI = too broad; auth gate alone = right size).
- If end-to-end verification of a step is not quick, the scope is too broad.
- **The request is the scope.** An adjacent improvement is a finding to report, not work to do.
- No "while I'm here": no renames, dependency swaps, formatting of untouched files, refactoring.

## Requirements discipline

- Do not invent behavior that is not in AGENTS.md context sections.
- Ambiguous? Resolve it in the relevant section first, then implement.
- Missing? Record it in `specs/` as an open question and stop that branch of work.

## Docs and truth

- **Code is the source of truth.** Where a doc and the code disagree, the doc is the defect.
- Design intent that is **not built** belongs in TARGET STATE, never in docs describing current behavior.
- Status docs record actual state, not intended state.
- Do not restate the spec in a doc — link it.
- No rotting literals in docs: quote command output instead of typing counts or versions by hand.

## Protected foundations

- Never patch a vendored component, framework file, or third-party internals to make a feature work.
- If a foundation file seems to need editing, the real problem is upstream of it.
- Protected paths for trackXpense: `lib/checkUser.js`, `lib/prisma.js`, `prisma/schema.prisma`, `app/(auth)/`

## Before moving to the next unit

1. The unit works end to end inside the scope you stated at the start.
2. No invariant in ARCHITECTURE CONTEXT was violated.
3. The spec in `specs/` reflects what actually happened.
4. The full gate chain is green (use `/verification-gates` skill).

## Reference

- STANDING RULES for the constraints on every change
- `/verification-gates` for the exact chain that must pass
- `/git-workflow` for commit and PR conventions
- ARCHITECTURE CONTEXT for invariants and cross-cutting rules
