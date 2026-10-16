---
description: Git discipline, commit conventions, and PR workflow
when: "user needs to commit, push, open a PR, or asks about git workflows"
---

# Git Workflow

## Commits

- Prefix with conventional type: `feat:` `fix:` `style:` `perf:` `refactor:` `chore:` `docs:` `test:` `build:` `ci:`
- **One logical change per commit.** No sweeping mixed commits.
- Subject says **why**, body ≤ 4 lines. A reader of `git log` alone should understand what defect existed before.
- Never commit secrets, rotated tokens, or real env values.
- **Always check `git status` before `git add`.** Verify you are not staging `.env` files.

## Push discipline

- **Only push when asked.** Do not assume authorization.
- Before pushing to a working branch: `git pull` from main, merge, resolve conflicts, then `git commit` and `git push`.
- Force-push only on your own branch, never on shared branches — use `--force-with-lease` only.
- Never skip hooks. No `--no-verify`, no bypassed signing.

## Pull requests

- Title: `<type>(<scope>): <imperative summary>` — e.g. `feat(auth): add staff role access`
- Body structure:
  - **What changed** (2–3 bullets)
  - **How it was verified** (each gate + any live check)
  - **What wasn't covered** (real credentials, third-party webhooks, host-specific behavior)
- One PR per feature/unit. No grab-bag PRs.
- Keep draft until CI is green; request review after the suite passes.

## Review process

Use the `/babysitting-a-pr` skill to watch a PR. For comments you write on behalf of the owner, use `/leaving-pr-comment` — it enforces the contract and includes the mandatory AI-authorship disclaimer.

No filler comments. A finding you decline gets a written decline; then resolve the thread.

## When to skip the PR

Tiny doc-only or rename-only changes don't need a PR — commit directly with a conventional message.

## References

- STANDING RULES §7 for the full git discipline contract
- DEVELOPMENT WORKFLOW § Git and review for the review gate chain
