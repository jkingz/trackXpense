# CLAUDE.md

This repository's contract is `AGENTS.md`. Read it first; it holds the STANDING
RULES and the index into `docs/agent-guide/`.

@AGENTS.md

## Build pipeline

Feature work runs seven stages, one command each: `/plan` → `/design` →
`/tickets` → `/build` → `/verify` → `/review` → commit → `/next`. `/pipeline`
prints the current stage; `/reset` clears it.

Enforced by hooks in `.claude/settings.json`, not by convention: product-source
edits are refused before `/build`, and `git commit` is refused until
`pnpm verify` is green for the current code and a review report postdates it
with no open High. Docs-only trees are exempt from the commit gate.

The gate is one implementation, `scripts/pipeline-gate.ts` over
`lib/pipeline-*.ts`; the OpenCode plugin at `.opencode/plugins/pipeline.js`
calls the same modules, so both harnesses enforce identically.

Escape hatch `OPENCODE_PIPELINE=off opencode` for OpenCode. For Claude Code,
remove or disable the hook groups in `.claude/settings.json` — the gate has no
environment switch, because a hook cannot read one that a command could also set.

Body: `docs/agent-guide/workflow.md` → Build pipeline.
