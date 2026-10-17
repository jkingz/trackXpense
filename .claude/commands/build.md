---
description: Stage 4 — build exactly one increment, with its test
---

Build increment `$ARGUMENTS` of the spec in flight (`.opencode/pipeline-state.json`).

1. Re-read the increment's **Files**, **Test**, and **Done when** in the spec.
2. Re-read `AGENTS.md` and the body in `docs/agent-guide/` that governs each file
   you are about to touch. Load the matching skill if one is listed.
3. State the scope in one sentence: what changes, what explicitly does not.

Implement only that increment.

- The **Files** list is the blast radius. A file outside it means the split was
  wrong: stop and say so, do not widen the scope silently.
- New behaviour gets its test in this same change, at `tests/<feature>/unit/`.
- State that has more than one status is a reducer in `lib/`, pure and tested
  without React. No scattered setters, no derived booleans that can disagree.
- Money goes through cents as integers, never floats. Auth and tenancy go through
  the one seam named in `docs/agent-guide/architecture.md`, not a new read of the
  session.
- No drive-by renames, reformatting, or dependency swaps.
- Nothing in `docs/agent-guide/` that this change made untrue stays untrue: fix it
  in this change or report it.

Do not commit. Do not push.

Report: what changed / what you verified with the command and its output / what
is still unverified. Anything you did not run stays labelled unverified.

Then `/verify`.
