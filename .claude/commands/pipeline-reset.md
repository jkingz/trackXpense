---
description: Clear the pipeline stage and start a new spec
---

Reset the build pipeline.

This clears the in-flight spec, the stage, the gate result, and the review record
in `.opencode/pipeline-state.json`. It does not touch any file, revert any edit, or
delete a spec.

Use it when the machine no longer matches reality: work abandoned mid-increment, a
spec finished and renamed, or a gate is stuck.

To change the stage without abandoning the work, run the stage commands instead.
To bypass the gate layer for one session: `OPENCODE_PIPELINE=off opencode`.
