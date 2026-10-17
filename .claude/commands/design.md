---
description: Stage 2 — settle the UI design, or exempt the feature from it
---

Settle the design for the spec in flight. Read `.opencode/pipeline-state.json` for
its path.

If the feature has no user-facing surface — a migration, a cron job, a script, a
refactor with no layout — add one line `UI: n/a` to the spec and stop. Do not
write a design document for a feature nobody sees.

Otherwise write `specs/NN-slug.design.md` and keep it to decisions a reviewer can
check:

1. **States** — every state the surface can be in, including empty, loading, error,
   and forbidden. Name them; a state you cannot name is a state you have not designed.
2. **Layout** — the arrangement at mobile width and at desktop width. Say what
   reflows, what scrolls, and what the tap target is.
3. **Interaction** — what each control does on click, on keyboard, and on submit.
4. **Tokens** — the exact token names from `docs/agent-guide/ui.md`. No raw hex, no
   invented scale, no one-off spacing.
5. **Accessibility** — focus order, focus ring, labels for icon-only controls,
   contrast for text on its actual background.
6. **Data** — what arrives from the server, and what the user sees while it has not.

Rules:

- Reuse existing components from `components/ui/` before proposing a new one.
  Name the ones you reuse.
- Design tokens only. A new token is a change to `ui.md` in this same stage.
- No implementation. This stage writes one file and stops.

Report the path written, or the `UI: n/a` line added.

Then the owner runs `/tickets`.
