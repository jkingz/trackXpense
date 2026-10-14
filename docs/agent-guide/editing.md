# EDITING THIS FILE

## When to fill sections

1. **STANDING RULES (Rules 11–17)** — day one when you learn the first fact (package manager, runtime, gates). `AGENTS.md` keeps each heading and the one fact that constrains work; the evidence lives in `docs/standing-rules/`, one file per rule.
2. **PROJECT OVERVIEW through PM CONVENTIONS** — as you build, one section per decision. The prose is here in `docs/agent-guide/`; `AGENTS.md` keeps the heading and the one fact that constrains work.
3. **SERVICE ARCHITECTURE** — after your first real commit, listing only implemented code.
4. **TARGET STATE** — whenever design intent outpaces implementation.
5. **FEATURE SPECS** (`specs/`) — one per unit of work.

## Health check

```bash
grep -n '<[a-zA-Z_/]' AGENTS.md
```

Every hit is an unfilled slot. Zero hits means `AGENTS.md` describes your project and only your project.

`tests/platform/unit/instruction-layer.test.ts` runs this check over `AGENTS.md` whole-file **and** over every body
in `docs/agent-guide/` and `docs/standing-rules/`, so a hit in any home fails — including inside **VERIFICATION
STANDARDS**, which currently produces no hits. Splitting a body out therefore moves the rule's reach, never weakens
it.
Do not add exemptions to the command; reword the prose.

## One rule that organizes everything else

**Code is the source of truth.** When implementation and docs disagree, the doc is the defect. Fix the doc in the same change.
