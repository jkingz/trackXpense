# AGENTS.md

Read before every task. Rules below are portable across projects. Project specifics live in `docs/` — read the file that governs your change.

## Standing rules

### 1. Be very concise

Short replies. No preamble. Change + result + what you need.

### 2. No "done" without a command behind it

Name command + output for every completion claim. Untested = unverified, say so. Typecheck proves types, not behavior.

### 3. Scope is the request, not the opportunity

Blast radius = what was asked. No drive-by cleanup, renames, formatting, extractions, predicted abstractions. Nearby issues: one line in reply, not in diff.

### 4. Delete unused, but prove it was unused

Grep callers before deleting dead files, exports, imports, env vars, CSS, tokens, components. State what was removed + how checked.

### 5. Servers, ports, processes

Restart/kill only during current task. Clear stale processes on app ports first. End session with no orphans.

### 6. Secrets

Never print values — names only. `env` files stay out of git; commit names + empty placeholders. Client-visible values are not secrets.

### 7. Git discipline

Commit/push/PR only when asked. Before push: pull main, merge, resolve, then commit/push. No `--no-verify`, no skipped hooks/signing. No force-push shared branches, no destructive commands over others' work. Externally visible actions need explicit authorization. Skill: `.claude/skills/git-workflow.md`.

### 8. Pull-request babysitting

Every PR opened here is babysat to green: watch the thread and checks until green, handle review/CI feedback, confirm CI actually ran. Watching: `.claude/skills/babysitting-a-pr/SKILL.md`. Commenting: `.claude/skills/leaving-pr-comment/SKILL.md`. No filler. Declined finding gets written decline, then resolve.

### 9. Skills and instructions come before improvising

Check Skills below first; use the matching one instead of re-deriving. Use harness capabilities; don't hand-roll what exists.

### 10. Unknowns are labelled, not invented

No fabricated thresholds, policies, APIs, paths. State assumption + verifying step. Code is truth; conflicting doc is the defect — fix doc same change.

### 11. State logic is a reducer, not scattered setters

Any state with more than one status — async fetch state, interacting UI state, an entity lifecycle — is a reducer: a pure `(state, event) => state` function in `lib/`, plus explicit named states and events. The hook or action only dispatches into it or persists its result, so no derived booleans can contradict each other. The machine is tested without React. This adds no dependency — `useReducer` and a plain function cover it, and a state library is a new-dependency decision. Load `docs/agent-guide/code-standards.md` State management.

### 12. Docs are terse facts, not prose

Every line in `AGENTS.md` and `docs/agent-guide/` earns its place: one fact per line, `file:line` for every code claim, no history ("used to", "previously"), no filler ("note that", "essentially"), counts in one home. Full rules in `docs/agent-guide/editing.md`. A body that reads like an essay gets rewritten, not appended to.

## Skills

| When                                      | Load                                         |
| ----------------------------------------- | -------------------------------------------- |
| Start/scope any task, work loop           | `.claude/skills/development-workflow.md`     |
| Write/run/update tests                    | `.claude/skills/testing.md`                  |
| Verify change (tests, types, lint, build) | `.claude/skills/verification-gates.md`       |
| Commit, push, open PR                     | `.claude/skills/git-workflow.md`             |
| Watch PR, handle review/CI feedback       | `.claude/skills/babysitting-a-pr/SKILL.md`   |
| Post any PR/issue comment                 | `.claude/skills/leaving-pr-comment/SKILL.md` |

Rule 9 applies: if a row matches, load that skill before acting.

## Project docs

| Read                                                                | File                                         |
| ------------------------------------------------------------------- | -------------------------------------------- |
| Map, read order, what this directory polices                        | `docs/agent-guide/README.md`                 |
| What the app is for, scope, success criteria, open questions        | `docs/agent-guide/overview.md`               |
| Stack, boundaries, persistence, auth and tenancy, invariants        | `docs/agent-guide/architecture.md`           |
| Design tokens, per-component conventions, styling, icons            | `docs/agent-guide/ui.md`                     |
| Naming, imports, framework rules, errors, data access, state, tests | `docs/agent-guide/code-standards.md`         |
| Loop, commands and what each proves, schema changes                 | `docs/agent-guide/workflow.md`               |
| Commit prefixes, PR body contract, review gate                      | `docs/agent-guide/pm-conventions.md`         |
| Implemented surface: routes, jobs, pages, gate output               | `docs/agent-guide/service-architecture.md`   |
| Design intent that has not landed, or landed and never ran          | `docs/agent-guide/target-state.md`           |
| Truthfulness guardrails for status sentences                        | `docs/agent-guide/verification-standards.md` |
| Doc style, health check, when a section earns a fact                | `docs/agent-guide/editing.md`                |
| Deliverable specs                                                   | `specs/README.md` + `specs/00-template.md`   |

Code is source of truth.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
