# Instruction-layer enforcement + AGENTS.md structural cleanup — design

Date: 2026-10-13
Branch: `feat/ts-zod-plan-a-bridge` (uncommitted work from the 2026-10-13 integration sits in the tree)
Approved by: user (approach A; open decisions go to § TARGET STATE; the three renamed headings revert to template wording)

## Problem

trackXpense/AGENTS.md is the instruction layer, and it is prose-only enforcement. The doc's own
health check is a `grep` nobody runs; Rule 8 mandated two skills the repo did not contain until this
morning; three repo skills asserted things that had become untrue ("Tests do not yet exist", "`pnpm
lint` exits 0 with warnings"); and pointers named a `specs/` folder and `.js` files that do not exist.
Every one of those was found by a human reading, which does not scale and did not happen for weeks.

The second half of the request: make AGENTS.md follow `../agent-ready-template/AGENTS.md` **exactly**.

## Measured starting state

`node` script over both files, fenced code blocks excluded:

| Fact | Value |
| --- | --- |
| Template headings (H1–H3) | 84 |
| trackXpense headings | 100 |
| Headings in trackXpense with no template twin | 19 |
| Headings in template missing from trackXpense | 3 |
| `## Progress Tracker` | 81 lines, 9 headings |
| Inline `## 00 — Dashboard transaction filtering` | 34 lines, 7 headings |
| AGENTS.md length | template 517 lines, trackXpense 838 |

The 3 missing are **renames**, not omissions:

| Template | trackXpense drifted to |
| --- | --- |
| `## Project-specific rules — Fill these slots day one` | `## Project-specific rules — Rules 11–17` |
| `### 15. Cross-cutting authority — one authority per rule, enforced once` | `### 15. Cross-cutting authority — one authority per rule` |
| `### Review gate` | `### Review gate (must be green to merge)` |

## What "exactly" means — the contract

**Headings must equal the template's, body prose must be trackXpense's own verified content.**

This is the whole definition, and it is what the checker enforces. It follows the template's own
division: the template's *structure* is the portable artifact, its *body* is a slot list (`<cmd>`,
`<PACKAGE_MANAGER>`, …) that the template expects every project to replace. Copying template body
text would paste another project's anecdotes into this repo — the template's § VERIFICATION
STANDARDS table (10 rows about `metrics_snapshots`, `sync_logs`, `keyword_rankings`) describes a
project that is not this one, and its § EDITING THIS FILE rule says a sentence earns its place only
if its author read the thing this session. Importing those rows would be fabricated content and would
violate the rule the import is meant to honour.

Consequences of the contract:

1. `## Progress Tracker` (9 headings) and the inline feature spec (7 headings) leave AGENTS.md.
2. The 3 renamed headings revert to template wording. Body text under `### Review gate` stays
   truthful about this repo (it records that gate 4 is red and CI omits it).
3. Feature specs move to `specs/`, because the template's `# FEATURE SPECS` delegates there and its
   `### Read order` says "Unbuilt design lives in `specs/` and TARGET STATE".
4. § EDITING THIS FILE → Health check becomes the template's command verbatim. trackXpense's four
   `grep -v` exemptions (added for `<Image>`, `<type>(<scope>)`, `--name <description>`,
   `WHERE userId = <from session>`) are deleted, so the prose carrying angle brackets is reworded
   instead. The exemptions were a check weakened to fit the doc; literal means the doc bends.

## The checker

`tests/platform/unit/instruction-layer.test.ts` — vitest, no new dependencies, no mocks, reads files
off disk. It runs inside `pnpm test`, which is CI gate 2, so every push checks the instruction layer
without touching `ci.yml`. Local entry point: `"check:docs": "TZ=UTC vitest run tests/platform"` in
`package.json`.

`tests/platform/` is a new tier folder; `tests/README.md` documents `platform` as cross-cutting
primitives, so it is the existing convention, not a new one.

### The five assertions

Each one was chosen because that class of defect actually occurred in this repo, not because it is
checkable.

1. **Structure parity.** Heading skeleton of AGENTS.md equals a **pinned snapshot** of the template's,
   exactly — same set, same text, same depth. Failures report two lists: extras and missing.
   Today: 19 extras, 3 missing.
   *Why:* the drift this whole change exists to end; also catches a future section added silently.
   After this unit it is deliberately stiff — a new AGENTS.md section fails CI until the template
   gains it first. That is what "follow exactly" means and the user accepted it.

   **The snapshot, because the template is not in the repo.** `../agent-ready-template/AGENTS.md` is a
   sibling checkout on this machine; a GitHub Actions runner has no copy of it, so comparing against
   that path would make the assertion either fail on "file not found" or silently skip — and the
   template's own table names a green tier that collected nothing as exactly this failure mode.
   So the skeleton is vendored as a text fixture, `tests/platform/fixtures/agents-md-skeleton.txt`
   (84 lines, one heading each, generated from the template file). Two rules follow:
   - CI enforces AGENTS.md against the **pinned fixture**. Deterministic, no sibling needed.
   - When the sibling path *does* exist locally, the test additionally asserts the fixture still equals
     its live skeleton. That is how a template change becomes a loud local failure instead of an
     invisible drift, and the fix is a deliberate re-generate of the fixture.
   A `refresh:skeleton` npm script regenerates the fixture from the sibling file when present.

2. **Slot check.** The template's health check, verbatim and with **no `grep -v` exemptions**:
   `grep -n '<[a-zA-Z_/]' AGENTS.md` must be empty. Measured state, so the work order is concrete:
   trackXpense scores **10 hits** today — 2 are the grep command lines themselves (they contain the
   exemption patterns, which is why deleting the exemptions also deletes those hits) and **8 are real
   prose**. Of the 8, six are angle-bracket JSX names or notation (`<Image>` at :316,
   `<SignedIn>`/`<SignedOut>`/`<Protect>`/`<Show>` at :510, `WHERE userId = <from session>` at :246)
   that get reworded, and **two are genuinely unfilled template slots** the doc had been calling false
   positives: `--name <description>` / `--name <desc>` (:113, :484, :520) and the commit-title format
   `<type>(<scope>): <imperative summary>` (:554). The template's § EDITING THIS FILE treats every hit
   outside § VERIFICATION STANDARDS as an unfilled slot, so filling them means writing the concrete
   form — a real migration name, and `type(scope): imperative summary` — not exempting them.
   Reference point: the template file itself scores **81 hits** because it is a slot list; a filled
   project file is meant to score 0. § VERIFICATION STANDARDS stays exempt by the template's own
   sentence, since its rows quote the pattern to teach it — in this repo that section currently
   produces 0 hits, so the exemption is a formality kept for the template's sake.
3. **Citations resolve.** Every backticked token shaped `path` or `path:line` / `path:line-line` in
   AGENTS.md and in every `.claude/skills/**/*.md` must be a real file, and the line number must be
   within its length. *Why:* `lib/checkUser.js`, `lib/prisma.js` and the three `specs/` pointers all
   shipped in this repo's skills and were only caught by reading. Token heuristics are narrow on
   purpose: require a `/` or `.ext`, and skip prose like `app/(main)/` directory names by checking
   `fs.existsSync` on the path with or without a trailing slash. False positives get fixed by
   rewording the prose, not by widening the exclusion list — the checker must not become the thing
   that lies.
4. **Skill pointers are two-way.** Every `/name` cited in AGENTS.md exists under `.claude/skills/`
   as `<name>.md` or `<name>/SKILL.md`; and every skill file on disk is listed in
   § SERVICE ARCHITECTURE → Repo skills. *Why:* Rule 8 named two skills that did not exist for weeks,
   and the reverse (a skill nobody references) is the same defect pointing the other way.
5. **Env inventory matches.** Every `*_UPPERCASE` variable named in AGENTS.md §16 and the file-
   organization tree appears in `.env.example`, and every name in `.env.example` appears in AGENTS.md.
   *Why:* `.env.example` was created today from code citations; without a check it drifts the moment
   someone reads a new variable.

### Not in this unit

Recorded as open decisions in § TARGET STATE, so the record is explicit rather than forgotten:

- **Rotting-literal purge.** The template forbids counts in docs; AGENTS.md is full of them (`19
  passed in 3 files`, `87 errors`, `79 files`, `0 errors over 81 source files`), and Rule 13's
  baselines are load-bearing — "the census does not grow" needs a recorded census. Purging them
  requires deciding where a baseline lives instead, which is a separate change.
- **CI ↔ Rule 13 parity.** See Blocking decision.

## The cut — where each Progress Tracker subsection goes

Nothing is deleted blind. Facts about code that exists move to the template-mandated section that
describes that kind of fact; work not yet chosen or built moves to § TARGET STATE as bullets.

| Subsection | Destination |
| --- | --- |
| Current phase | `## Project Overview → Status` (template shape: Built / Not built / verified-against line) |
| Current goal (Plan B inheritance: two flags off by design, 15 catch bindings, `lib/serialized-transaction.ts:1` gap, 12 unvalidated actions) | Split: the parts that are **current code facts** fold into `### Invariants`, `### Language strictness` and `## Code Standards` (several already live there — deduplicate, keep one authority); the parts that are **work not yet started** become TARGET STATE bullets |
| Completed | `## Project Overview → Status` ("Built"), plus git history for attribution — the template treats commit history as authoritative, so SHAs do not get re-typed into the doc |
| In progress / Recent work | Deleted. `git log --oneline` is the authority; duplicating it in a doc is the rotting-literal pattern |
| Open questions (12) | Product questions → `### Open product questions` (exists). Technical/decision items → `### TARGET STATE` bullets, one line each with what it blocks |
| Architecture decisions | `## Architecture Context` — the template has no decisions section, so each decision becomes a sentence in the section it governs (Stack, Auth & tenancy, Testing, Language strictness) |
| Session notes | Facts about current code → their sections (e.g. the money bug at `add-transaction-form.tsx:99-101` belongs in `### Invariants`, where a version of it already exists). Anything left is narrative about past sessions → cut, because the checker's slot+citation rules cannot help a prose pile that grows without bound |

Estimated net: about 100 lines leave AGENTS.md; roughly 40 of those are relocated, not lost.

**The cost, stated plainly.** Progress Tracker is the section that tells a future session *why* two
strict flags are off on purpose and what Plan B inherits. After this cut that knowledge sits in
§ Invariants / § Language strictness (the durable facts) and § TARGET STATE (the queued work), which
are auto-loaded too, but it no longer reads as a task list. The task list itself goes to the
conversation task tools, which is where ephemeral state belongs.

## Feature specs move out

1. `cp -R ../agent-ready-template/specs/ ./specs/` (README.md + 00-template.md).
2. `## 00 — Dashboard transaction filtering` and its 6 subsections move to
   `specs/00-dashboard-transaction-filtering.md`, matching the template's `specs/README.md` naming
   (`NN-feature-name.md`, numbered in implementation order).
3. `# FEATURE SPECS` in AGENTS.md becomes the template's two-sentence delegation.
4. **This reverses an edit made earlier today**, where `.claude/skills/development-workflow.md` was
   re-pointed from `specs/` to "AGENTS.md § FEATURE SPECS". Both were correct for their moment; the
   literal decision selects the other one. Restore the three `specs/` pointers.

## Dependent prose sweep (must happen in the same change, or the doc contradicts itself)

- `### Read order before implementing` and STANDING RULES §14: drop `PROGRESS TRACKER`.
- `## Development Workflow — Project appendix` → `Before moving to the next unit` item 3: restore the
  template's "The spec in `specs/` reflects what actually happened"; item 4 stays truthful about
  gate 4 rather than claiming "the full gate chain is green".
- Header block health-check line and `## Health check`: template command, no exemptions.
- `.claude/skills/verification-gates.md` and AGENTS.md Rule 13/§ Verification: any `§ Progress
  Tracker` reference repoints to the section that now holds the fact.
- Reword angle-bracket prose: `next/image` `Image` for `<Image>`, `type(scope): summary` for
  `<type>(<scope>)`, `--name DESCRIPTION` for `--name <description>`, "WHERE userId equals the
  session user" for `WHERE userId = <from session>`.
- `.claude/skills/development-workflow.md` "Protected paths for trackXpense" line and
  AGENTS.md § File organization's trailing "Protected paths:" line both currently list three paths
  while Rule 17 lists seven. One authority: both point at Rule 17.

## Blocking decision (discovered while reading the template, not resolvable inside this unit)

Template `### Review gate`: "The chain in STANDING RULES (Rule 13) / `/verification-gates` skill,
**all of it**, in that order — **CI runs the same commands**." Current CI (`.github/workflows/ci.yml`,
added today) deliberately omits `pnpm lint`, because the tree is red on a recorded census: 87 errors,
of which 86 are `import/order` and autofix with `--fix`; 1 is `react-hooks/set-state-in-effect` and
does not. The 3 warnings are `react-hooks` noise.

So the template demands either a green lint or a false sentence. Options, for the next unit:

- **Autofix as a standalone commit** — kills 86, leaves 1 error, lint still exits 1. Necessary, not
  sufficient.
- **Fix the one `set-state-in-effect`** — a real code change in a component, and a behaviour change,
  so it needs its own risk separation.
- **Downgrade `import/order` to `warn`** — makes CI lint-able immediately without touching source,
  at the cost of a rule that no longer blocks anything.
- **Deviate from the template sentence in writing** — cheapest, but then `### Review gate` body text
  is this repo's exception, which is exactly what the contract above permits for body prose.

Recommendation for this unit: keep the truthful body text under the restored heading, and record the
parity requirement as a TARGET STATE bullet so the exception is on the books rather than in the
shadows.

## Testing

- The checker is the test. Its own correctness gets pinned by **negative fixtures inside the same
  test file**: for each of the five assertions, feed it a deliberately-broken in-memory copy (an added
  heading, a `lib/nope.ts:1` citation, a `/missing-skill` pointer, an env name absent from
  `.env.example`) and assert it fails. A checker that has never been seen to fail is not a gate —
  that is the lesson the template's own table teaches.
- Nothing in this unit touches runtime code, so `pnpm typecheck`, `pnpm test`, `pnpm build` and the
  lint census are the regression net: typecheck must stay at 0, tests must go from 19 to 19+checker's
  count, build must stay exit 0, and the census must not grow.
- Verification commands, in order:
  `pnpm check:docs` → `pnpm typecheck` → `pnpm test` → `pnpm build` → `pnpm lint` (compare census).

## Out of scope

- Any source file, schema, or `package.json` dependency.
- The rotting-literal purge and the CI↔Rule-13 parity fix.
- Commits and pushes: STANDING RULES §7 — nothing is committed until asked, including the spec file
  this design produces.
- `pnpm dev` / live money-path verification: still impossible here (no `DATABASE_URL`, no
  `ARCJET_KEY`), so no claim in this unit is runtime-verified.
