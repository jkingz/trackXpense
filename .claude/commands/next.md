---
description: Stage 7 — move to the next increment after a clean, committed one
---

Close out the current increment and open the next.

Preconditions, all enforced by `.opencode/plugins/pipeline.js`:

- the gates are green (`pnpm verify` passed after the last source edit),
- the review report has `Verdict: pass` and no open High,
- the review postdates the code it judges,
- the increment is committed.

State in one line what the finished increment delivers, then list the next
increment from the spec with its **Files**, **Test**, and **Done when**.

If an increment is not finished, say which gate is open instead of advancing.

Do not start the next increment's work here — that is `/build` again.
