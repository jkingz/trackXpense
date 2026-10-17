---
description: Stage 3 — split the spec into ordered, independently verifiable increments
---

Split the spec in flight into increments a reviewer can check one at a time. The
spec path is in `.opencode/pipeline-state.json`.

Rewrite the **First increment** and **Later increments** sections so they form one
ordered list. Rules:

- Each increment is one user-visible or one operationally-observable outcome. "Add
  the query" is not an increment; "the list narrows to the selected category" is.
- Each increment stands alone: it builds, it has a test, and it is committable
  without the next one.
- At least two. If the honest split is one, the feature is not decomposed — say so
  and stop rather than inventing a fake second step.
- Name the files each increment will touch. A list that cannot name its files
  cannot be built in isolation.
- The first increment carries the risk: the unknown, the external call, the part
  that could invalidate the rest.

Then, for the first increment only, write the build note under the list:

- **Files** — exact paths in scope. Everything else is out of scope.
- **Test** — the unit test that will prove it, named by path.
- **Done when** — the observable condition, one line.

Do not implement anything. Do not edit source files.

Report the increment list and the first increment's scope.
