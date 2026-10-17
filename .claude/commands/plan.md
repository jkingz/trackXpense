---
description: Stage 1 — plan a feature into specs/NN-slug.md
---

Plan this feature into a spec: `$ARGUMENTS`

Do not touch product source. This stage writes one file and nothing else.

1. Read what governs it: `AGENTS.md`, then `docs/agent-guide/overview.md`,
   `architecture.md`, and the body for the module it lands in.
2. Pick the next spec number: highest `specs/NN-*.md` plus one. Reuse an existing
   spec if this is the same feature.
3. Write `specs/NN-slug.md` from `specs/00-template.md`. Every section earns its place:
   - **Goal** — one observable sentence, not an outcome plus a wish list.
   - **Increments** — at least two ordered items, each independently shippable and
     verifiable on its own. One item means the work is not decomposed yet.
   - **Security / permissions** — who may do it and the single authority that
     enforces it. Name the file and function. If nothing enforces it, say so plainly.
   - **Verification** — the exact gate commands, and what stays unverified.
4. Record real open questions under **Deferred / open questions** instead of
   inventing an answer.

Rules:

- No requirements that are not in the governing docs. Ambiguity resolves in the
  docs first, or it becomes an open question and that branch stops.
- Numbers, paths, and versions come from command output, never from memory.
- Stop here. Report the spec path and the increment list.

Then the owner runs `/design`.
