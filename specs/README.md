# Feature Specs

One file per feature or deliverable unit of work.

## Naming convention

- `01-feature-name.md` — numbered in implementation order
- `01-feature-name.design.md` — stage 2 output, or `UI: n/a` in the spec instead
- `01-feature-name.review.md` — stage 6 output, ending in `Verdict: pass` or `Verdict: fail`
- `00-template.md` — copy this for new specs

## Structure

Each spec describes:

- **Goal** — observable outcome
- **Increments** — implementation phases, at least two, each independently verifiable
- **Open questions** — unresolved decisions
- **Security** — auth/permissions model
- **Verification** — how to prove it works

Specs live here; implementations live in the codebase. When a spec and code disagree, code is truth.

The `.review.md` format is parsed by `lib/pipeline-artifacts.ts`: a `Verdict:` line
decides pass/fail and `- [ ] **High**` lines count as open findings. Keep the shape
from `/review-changes`.
