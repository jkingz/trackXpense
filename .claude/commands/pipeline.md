---
description: Report the pipeline stage, or reset it
---

Report where the build pipeline stands. Read `.opencode/pipeline-state.json`.

Print, one line each:

- **stage** — planned / designed / decomposed / building / verified / reviewed
- **spec** — the file in flight, or none
- **increment** — the number being built
- **gates** — green / red / stale, and the last gate command that ran
- **review** — the report path, its `Verdict`, and open High count
- **HEAD** — `git rev-parse --short HEAD`

Then the single next command, based on the stage:

| Stage      | Next                     |
| ---------- | ------------------------ |
| no spec    | `/plan specs/NN-slug.md` |
| planned    | `/design`                |
| designed   | `/tickets`               |
| decomposed | `/build <increment>`     |
| building   | `/verify`                |
| verified   | `/review-changes`        |
| reviewed   | commit, then `/next`     |

Do not edit anything to produce this report.

Escape hatch, if the gates are wrong or you need an unscripted fix:
`OPENCODE_PIPELINE=off opencode`. Say so when you suggest it; it turns off the
whole gate layer for that session only.
