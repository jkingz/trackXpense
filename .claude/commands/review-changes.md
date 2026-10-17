---
description: Stage 6 — two-axis AI review (Standards, Spec), written to the spec
---

Review the increment just built, on two independent axes, and write the report.

The spec path is in `.opencode/pipeline-state.json`.

**Run both axes.** Launch the `reviewer` subagent (read-only: it cannot edit, so it
returns findings to you and you write the file). Give it the fixed point
(`HEAD`, or the merge-base with the branch) and ask for:

- **Standards** — does the diff follow the documented standards in this repo?
  Read `AGENTS.md`, `docs/agent-guide/code-standards.md`, `architecture.md`, and
  `ui.md`. Cite `file:line` for every claim.
- **Spec** — does the diff do what the spec asked, and only that? Name each
  increment and say met / partial / missing. Anything shipped that the spec did
  not ask for is a finding, not a bonus.

Severity:

- **High** — wrong behaviour, data loss, an auth or tenancy hole, a broken
  invariant, or a claim in the report that is not true.
- **Medium** — real defect with a workaround, or a standard violated without
  behavioural consequence.
- **Low** — naming, ordering, dead code.

**Then write** `specs/NN-slug.review.md` (same base name as the spec, `.review.md`)
in exactly this shape — the pipeline parses it, so the format is load-bearing:

```markdown
## Standards

<findings, each as `- [ ] **High** <file:line> — <problem>` or `- [x] **High** n/a`>

## Spec

<per-increment verdicts>

## Verdict

Verdict: pass
```

Rules:

- `Verdict: pass` only when there are zero open High findings and no unchecked
  Medium that hides a defect. Otherwise `Verdict: fail`.
- An open High is `- [ ]`. A High you checked off because it does not apply is
  `- [x]` with the reason.
- No finding without `file:line` and no proposed fix. A finding you cannot cite is
  an opinion, not a finding.
- Do not fix anything here. Report, then let `/build` or `/fix` carry the change.

With `Verdict: fail` or open High findings, fix them and re-run `/verify` and
`/review-changes` before committing.
