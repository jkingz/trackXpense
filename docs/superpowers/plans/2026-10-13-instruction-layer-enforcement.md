# Instruction-Layer Enforcement + AGENTS.md Structural Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the agent instruction layer machine-checked instead of prose-only, and reshape `AGENTS.md` so its headings equal `../agent-ready-template/AGENTS.md`'s exactly while its body stays this repo's own verified content.

**Architecture:** One vitest file, `tests/platform/unit/instruction-layer.test.ts`, holds five assertions over `AGENTS.md`, `.claude/skills/**/*.md`, `specs/` and `.env.example`. Each assertion is a **pure function over strings** (so a negative fixture can prove it fails) plus a thin wrapper that reads the real files. The doc work is ordered so every task ends with `pnpm check:docs` and the full gate chain green: each assertion is added in the same task that makes it pass, test-first.

**Tech Stack:** TypeScript 5.9.3 (`strict`, `noImplicitAny: false`), Vitest 5 (`TZ=UTC`), Node builtins `node:fs` / `node:path` / `node:url` only — no new dependencies, no mocks.

**Spec:** `docs/superpowers/specs/2026-10-13-instruction-layer-enforcement-design.md` — read it with this plan; the plan argues from it.

## Global Constraints

- **Node first, every command.** `pnpm` only works on Node 20 here. Prefix every command in this plan with
  `PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH"` — on Node 26 the pin fails with
  `Cannot use the pnpm version this project pins: no @exe.darwin-arm64 native binary`, which looks like a
  broken project, not a broken shell (AGENTS.md Rule 11).
- **No commits without the user's word.** STANDING RULES §7. Every "Commit" step below is a *boundary*:
  stage it, show `git status`, and commit only under the authorization granted at handoff. The spec's § Out of
  scope already records that nothing is committed yet, including the spec file itself.
- **No new dependencies.** No `npm`/`pnpm add` of anything. No git hooks (user chose the `pnpm check` + CI route).
- **Gate chain, every task** (Rule 13): `pnpm check:docs` → `pnpm typecheck` (must stay **0 errors**) →
  `pnpm test` (must be all-green; 19 tests today) → `pnpm build` (exit 0, and it type-checks) →
  `pnpm lint` (exit 1 is expected; the census must stay **87 errors / 3 warnings** — a new file that grows it is
  fixed by correcting its imports, never by adding an `eslint-disable`).
- **`import/order` is an error, not a warning.** Group order is builtin → external → internal (`@/` first) →
  parent/sibling → index, blank line between groups, alphabetical within a group (`eslint.config.mjs:20-40`).
- **Body prose is trackXpense's; headings are the template's.** The contract from the spec: never paste template
  body text (its § VERIFICATION STANDARDS rows describe a different project), and never invent a heading the
  template lacks.
- **No rotting literals in new prose.** Do not write a test count, error count, or file count into any doc in this
  plan except where the census already appears (§13, § Verification) — those baselines are load-bearing and are
  refreshed by command output, not by hand.
- **Protected paths untouched** (Rule 17): `lib/checkUser.ts`, `actions/lib/checkUser.ts`, `lib/prisma.ts`,
  `prisma/schema.prisma`, `prisma.config.ts`, `tsconfig.json`, `app/(auth)/`. No source file changes in this plan.
- **Runtime stays unverified.** No `DATABASE_URL`, no `ARCJET_KEY`, so no claim in this plan is runtime-verified;
  every claim names the command that produced it.

## File Structure

| File | Responsibility | Task |
| --- | --- | --- |
| `tests/platform/unit/instruction-layer.test.ts` | Create. The whole checker: pure helpers, five assertions, negative fixtures. Deliberately one cohesive file — its subject is one artifact. | 1, 2, 5, 6 |
| `tests/platform/fixtures/agents-md-skeleton.txt` | Create. Vendored 84-line heading skeleton of the template — the CI-readable copy of a file that is not in this repo. | 6 |
| `tests/platform/scripts/refresh-skeleton.mjs` | Create. Regenerates the fixture from `../agent-ready-template/AGENTS.md` when that sibling exists. | 6 |
| `package.json` | Modify. Add `check:docs` and `skeleton:refresh` scripts. | 1, 6 |
| `AGENTS.md` | Modify. Health check literal, feature-spec delegation, Progress Tracker cut, three heading renames, angle-bracket rewords, read-order sweep. | 2–7 |
| `specs/README.md`, `specs/00-template.md` | Create (copied from the template). | 3 |
| `specs/01-dashboard-transaction-filtering.md` | Create. The feature spec that leaves `AGENTS.md`. | 3 |
| `.claude/skills/development-workflow.md` | Modify. Restore the three `specs/` pointers; make the protected-paths line point at Rule 17. | 3, 7 |
| `.claude/skills/verification-gates.md` | Modify. Report the checker as part of gate 2; drop § Progress Tracker pointers. | 7 |
| `.claude/skills/testing.md` | Modify. Record the populated `platform` tier. | 1 |
| `tests/README.md` | Modify. Record that `platform/unit` now holds the instruction-layer checker. | 1 |
| `.github/workflows/ci.yml` | Modify. One comment line: the checker now runs inside gate 2. | 7 |

---

### Task 1: Checker harness + the two assertions that are green today

Creates the file every later task extends, and proves the checker reads real files before it proves anything
about them. `skill pointers` and `env inventory` pass on today's tree (measured: dangling none, unlisted none,
env sets identical), so this task lands green.

**Files:**
- Create: `tests/platform/unit/instruction-layer.test.ts`
- Modify: `package.json` (scripts)
- Modify: `.claude/skills/testing.md`, `tests/README.md`
- Test: the file it creates (the checker's negative fixtures are its own tests)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `ROOT`, `read(rel)`, `linesOutsideFences(md)`, `skillFilesUnder(dir)`, `skillNames(diskFiles)`,
  `skillGaps(md, names) → { dangling: string[]; unlisted: string[] }`,
  `envMismatch(docText, exampleText) → { undocumented: string[]; unmentioned: string[] }`. Task 2 adds
  `slotLines`; Task 5 adds `pathCitations` and `Resolve`; Task 6 adds `headings`, `skeletonOf`, `diffHeadings`.

- [ ] **Step 1: Record the baselines you have to beat**

Run:
```bash
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm test 2>&1 | tail -8
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm lint 2>&1 | grep -E 'problems|[0-9]+ error' | tail -3
```
Expected: `Test Files 3 passed`, `Tests 19 passed`; lint `87 errors` and `3 warnings`. Write both numbers down;
Task 7 compares against them. If they differ from this plan, stop and re-read the tree — the plan is stale, not
the repo.

- [ ] **Step 2: Write the failing test**

Create `tests/platform/unit/instruction-layer.test.ts`. The negative fixtures come first: they are the reason
the helpers exist.

```typescript
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const read = (rel: string): string => fs.readFileSync(path.join(ROOT, rel), 'utf8');

function linesOutsideFences(md: string): string[] {
  const out: string[] = [];
  let inFence = false;
  for (const line of md.split('\n')) {
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (!inFence) out.push(line);
  }
  return out;
}

function skillFilesUnder(dir: string, base: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) return skillFilesUnder(abs, base);
      if (!entry.name.endsWith('.md')) return [];
      return [path.relative(base, abs).split(path.sep).join('/')];
    })
    .sort();
}

const skillNames = (files: string[]): string[] =>
  [...new Set(files.map((f) => (f.includes('/') ? f.split('/')[0] : f.replace(/\.md$/, ''))))].sort();

const SKILL_BULLET = /^- `\/([a-z][a-z0-9-]+)`/;
const SKILL_PROSE = /`\/?([a-z][a-z0-9-]+)`\s+(?:skill|skills)\b/g;

function skillGaps(md: string, names: string[]): { dangling: string[]; unlisted: string[] } {
  const lines = linesOutsideFences(md);
  const prose = lines.join('\n');
  const listed = lines.flatMap((l) => {
    const m = l.match(SKILL_BULLET);
    return m ? [m[1]] : [];
  });
  const cited = new Set([...prose.matchAll(SKILL_PROSE)].map((m) => m[1]));
  const all = [...new Set([...cited, ...listed])];
  return {
    dangling: all.filter((n) => !names.includes(n)).sort(),
    unlisted: names.filter((n) => !listed.includes(n)).sort(),
  };
}

const ENV_NAME = /\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)\b/g;

function envMismatch(docText: string, exampleText: string): { undocumented: string[]; unmentioned: string[] } {
  const inDoc = new Set([...docText.matchAll(ENV_NAME)].map((m) => m[1]));
  const inFile = new Set(
    exampleText.split('\n').flatMap((l) => {
      const m = l.match(/^([A-Z0-9_]+)=$/);
      return m ? [m[1]] : [];
    }),
  );
  return {
    undocumented: [...inDoc].filter((n) => !inFile.has(n)).sort(),
    unmentioned: [...inFile].filter((n) => !inDoc.has(n)).sort(),
  };
}

describe('instruction-layer checker harness', () => {
  it('reads the files it claims to check', () => {
    expect(fs.existsSync(path.join(ROOT, 'AGENTS.md'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, '.env.example'))).toBe(true);
    expect(skillFilesUnder(path.join(ROOT, '.claude/skills'), path.join(ROOT, '.claude/skills'))).toHaveLength(6);
  });
});

describe('skill pointers are two-way', () => {
  it('a pointer to a skill that is not on disk and a skill nobody lists are both reported', () => {
    const doc = [
      'See `/ghost-skill` skill for the chain.',
      '',
      '## Repo skills',
      '- `/testing` — test structure',
      '- `/verification-gates` — the chain',
      '- `/development-workflow` — the loop',
      '- `/git-workflow` — commits',
      '- `/babysitting-a-pr` — PR watching',
    ].join('\n');
    const disk = skillNames(['babysitting-a-pr/SKILL.md', 'development-workflow.md', 'git-workflow.md', 'leaving-pr-comment/SKILL.md', 'testing.md', 'verification-gates.md']);
    expect(skillGaps(doc, disk)).toEqual({ dangling: ['ghost-skill'], unlisted: ['leaving-pr-comment'] });
  });

  it('AGENTS.md and .claude/skills agree in both directions', () => {
    const dir = path.join(ROOT, '.claude/skills');
    expect(skillGaps(read('AGENTS.md'), skillNames(skillFilesUnder(dir, dir)))).toEqual({ dangling: [], unlisted: [] });
  });
});

describe('env inventory matches', () => {
  it('a name missing from either side is reported', () => {
    const doc = 'Needs DATABASE_URL and STRIPE_SECRET_KEY.';
    const example = 'DATABASE_URL=\nNEW_API_KEY=\n';
    expect(envMismatch(doc, example)).toEqual({ undocumented: ['STRIPE_SECRET_KEY'], unmentioned: ['NEW_API_KEY'] });
  });

  it('AGENTS.md names exactly the variables .env.example inventories', () => {
    expect(envMismatch(read('AGENTS.md'), read('.env.example'))).toEqual({ undocumented: [], unmentioned: [] });
  });
});
```

- [ ] **Step 3: Run it to verify the harness works and both real-file assertions pass**

Run:
```bash
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm exec vitest run tests/platform 2>&1 | tail -12
```
Expected: 5 tests passed in 1 file. If `reads the files it claims to check` fails on length 6, list the folder —
`.claude/skills/{babysitting-a-pr,leaving-pr-comment}/SKILL.md` plus four flat `.md` files is the current shape,
and this plan's later tasks depend on that count.

- [ ] **Step 4: Add the two npm scripts**

In `package.json`, insert `check:docs` after `"test:watch"` (alphabetical position is not required; adjacency to
the other test scripts is):

```json
    "test:watch": "TZ=UTC vitest",
    "check:docs": "TZ=UTC vitest run tests/platform",
```

Run:
```bash
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm check:docs 2>&1 | tail -6
```
Expected: the same 5 passed. The positional filter selects the file by substring — if vitest ever reports
`No test files found`, it exits 1, which is the loud failure `tests/README.md` documents; never "fix" that by
dropping the filter.

- [ ] **Step 5: Update the two docs this makes untrue**

`.claude/skills/testing.md` — the tree diagram gains the populated tier. Replace the `platform` block's comment
with the real contents, and add under "Test tier definitions":

```markdown
- **platform/unit** — the instruction-layer checker (`instruction-layer.test.ts`): AGENTS.md heading parity
  with `../agent-ready-template`, slot-free health check, citation resolution, skill-pointer and env-inventory
  agreement. It reads files off disk; nothing it asserts needs a database.
```

`tests/README.md` — after the "Empty or credential-gated tiers exit 0." paragraph add:

```markdown
`tests/platform/unit/` is populated: `instruction-layer.test.ts` checks this repo's own guidance files, so a
wrong path, a dangling skill pointer or an undocumented env var fails `pnpm test` (and therefore CI gate 2).
Run it alone with `pnpm check:docs`.
```

- [ ] **Step 6: Full gate chain**

Run:
```bash
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm typecheck 2>&1 | tail -3
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm test 2>&1 | tail -6
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm lint 2>&1 | grep -E 'problems' | tail -2
```
Expected: typecheck silent (0 errors); test `Test Files 4 passed`, `Tests 24 passed`; lint still 87/3. If lint
reports 88+, fix the new file's import grouping — the three `node:` builtins must come first, alphabetically
(`node:fs`, `node:path`, `node:url`), then a blank line, then `vitest`.

- [ ] **Step 7: Commit boundary**

```bash
git add tests/platform/unit/instruction-layer.test.ts package.json .claude/skills/testing.md tests/README.md
git commit -m "test: add the instruction-layer checker harness with two live assertions"
```

---

### Task 2: Slot check + make the health check literal (no exemptions)

The template's health check is `grep -n '<[a-zA-Z_/]' AGENTS.md` with nothing filtered. This repo weakened the
command to fit the doc; under "follow exactly" the doc bends. Measured today: **10 hits** — 2 from the exemption
patterns inside the grep command lines themselves, 8 from prose, of which 2 are genuinely unfilled template slots.

**Files:**
- Modify: `tests/platform/unit/instruction-layer.test.ts` (append `slotLines` + its describe block)
- Modify: `AGENTS.md` — header block line 19, and lines 113, 246, 316, 484, 510, 520, 554, and the § EDITING THIS
  FILE health check (lines 837–847)

**Interfaces:**
- Consumes: `linesOutsideFences` (Task 1).
- Produces: `slotLines(md: string): number[]`.

- [ ] **Step 1: Write the failing test**

Append to the test file, after `linesOutsideFences`:

```typescript
const SLOT = /<[a-zA-Z_/]/;
const slotLines = (md: string): number[] =>
  md.split('\n').reduce<number[]>((acc, line, i) => (SLOT.test(line) ? [...acc, i + 1] : acc), []);
```

Then append the describe block:

```typescript
describe('health check reports no unfilled slot', () => {
  it('counts angle-bracket slots anywhere in the file, including prose and fenced lines', () => {
    // Line 3 names the Image component WITHOUT brackets — the shape the rewords in Step 4 produce — so only
    // line 4 hits. Line 5 is inside a fence and still counts, because the template's check is a plain grep.
    const doc = '# T\n\nUse the Image component.\nRun `cmd --name <thing>`.\n```\ngrep <pattern>\n```\n';
    expect(slotLines(doc)).toEqual([4, 6]);
  });

  it('AGENTS.md has zero hits — the template command with no grep -v exemptions', () => {
    expect(slotLines(read('AGENTS.md'))).toEqual([]);
  });
});
```

Note the first fixture: `Image` without brackets does **not** hit — that is what the rewords in Step 4 do.

- [ ] **Step 2: Run it to verify the second assertion fails with the 10 known hits**

Run:
```bash
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm check:docs 2>&1 | grep -A3 'has zero hits'
```
Expected: FAIL, array `[19, 113, 246, 316, 484, 510, 520, 554, 840, 845]` (line numbers shift by one if Task 1's
doc edits landed above them — read the actual list, then grep it).

- [ ] **Step 3: Delete the exemptions, in both places**

Replace the header block (near line 19) and the `## Health check` fenced block (near line 840) each with the
template's command, verbatim:

```bash
grep -n '<[a-zA-Z_/]' AGENTS.md
```

Replace § Health check's two explanatory paragraphs with:

```markdown
Every hit is an unfilled slot. Zero hits means this file describes your project and only your project.

`tests/platform/unit/instruction-layer.test.ts` runs this check over the whole file, so a hit inside
**VERIFICATION STANDARDS** also fails, even though that section is the one place the pattern is legitimately
quoted. It currently produces no hits. Do not add exemptions to the command; reword the prose.
```

Delete the paragraph beginning "The last `grep -v` names four patterns that look like slots but are not" — it
describes exemptions that no longer exist.

- [ ] **Step 4: Reword the eight prose hits** (Rule 3: these are the checker's demands, not drive-by cleanup)

Each replacement keeps the sentence's information and drops the brackets.

| Line | Now | Becomes |
| --- | --- | --- |
| 113 | `New migrations: `npx prisma migrate dev --name <description>`, commit the generated file.` | `New migrations: run `npx prisma migrate dev --name` with a snake_case description, then commit the generated file.` |
| 246 | `A transaction query always filters `WHERE userId = <from session>`.` | `A transaction query always scopes to the session user's `userId`.` |
| 316 | `Images: Next.js `<Image>` component required.` | `Images: the `Image` component from `next/image` is required.` |
| 484 | ``pnpm exec prisma migrate dev --name <desc>` `` | ``pnpm exec prisma migrate dev --name NAME` (snake_case description) `` |
| 510 | `Clerk 7 (Core 3) removed `<SignedIn>`, `<SignedOut>`, and `<Protect>` … Use `<Show when="signed-in"|"signed-out">` from `@clerk/nextjs`.` | `Clerk 7 (Core 3) removed the `SignedIn`, `SignedOut` and `Protect` components — rendering them **throws at runtime, not at build time**. Use Clerk 7's `Show` component with its `when` prop set to `signed-in` or `signed-out`. |
| 520 | `Run `pnpm exec prisma migrate dev --name <description>` — generates and applies the migration.` | `Run `pnpm exec prisma migrate dev --name NAME` with a snake_case description — generates and applies the migration.` |
| 554 | `Title: `<type>(<scope>): <imperative summary>` — e.g., `feat(auth): add staff role access`` | `Title: `type(scope): imperative summary` — e.g., `feat(auth): add staff role access`` |

Then re-run Step 2's command.

- [ ] **Step 5: Verify zero hits three ways**

Run:
```bash
grep -n '<[a-zA-Z_/]' AGENTS.md; echo "GREP_EXIT=$?"
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm check:docs 2>&1 | tail -5
```
Expected: grep prints nothing and `GREP_EXIT=1` (no matches); `pnpm check:docs` → 7 tests passed. The grep is the
template's own command run by hand: the assertion and the doc's instruction must agree exactly.

- [ ] **Step 6: Full gate chain, then commit boundary**

```bash
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm typecheck && PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm test 2>&1 | tail -4
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm lint 2>&1 | grep problems
git add AGENTS.md tests/platform/unit/instruction-layer.test.ts
git commit -m "test: make the AGENTS.md health check literal and drop its exemptions"
```
Expected: typecheck clean, `Tests 26 passed`, lint unchanged at 87 errors / 3 warnings.

---

### Task 3: Move feature specs into `specs/`

The template's `# FEATURE SPECS` delegates to a `specs/` folder, and its § Read order says "Unbuilt design lives
in `specs/` and TARGET STATE". This repo inlines one spec (7 headings the template does not have) and, earlier
today, had its skill pointers re-pointed *away* from `specs/`. This task reverses that edit — both were correct
for their moment; the "literal" decision selects this one.

**Files:**
- Create: `specs/README.md`, `specs/00-template.md` (copied from `../agent-ready-template/specs/`)
- Create: `specs/01-dashboard-transaction-filtering.md`
- Modify: `AGENTS.md` lines 788–824 (`# FEATURE SPECS` + the inline spec)
- Modify: `.claude/skills/development-workflow.md` lines 14, 29, 49

**Interfaces:**
- Consumes: nothing.
- Produces: `specs/` on disk, which Task 5's citation check resolves `specs/README.md` and `specs/00-template.md`
  against.

- [ ] **Step 1: Copy the template's two spec files and prove they are byte-identical**

```bash
cp -R ../agent-ready-template/specs/ ./specs/
cmp ../agent-ready-template/specs/README.md specs/README.md && cmp ../agent-ready-template/specs/00-template.md specs/00-template.md && echo IDENTICAL
ls specs/
```
Expected: `IDENTICAL`, then `00-template.md  README.md`. These two files are the template's own portable artifact
(copying them is not copying body prose: `00-template.md` is pure slots), and they are copied, not rewritten, so
`cmp` is the verification.

- [ ] **Step 2: Move the spec content out of AGENTS.md**

Create `specs/01-dashboard-transaction-filtering.md` with exactly this content — the body of AGENTS.md lines
792–822, heading levels shifted up one (`##`→`#`, `###`→`##`), numbered `01` because `specs/README.md` reserves
`00-template.md` for the template and starts real specs at 01:

```markdown
# Feature Spec 01 — Dashboard transaction filtering

## Goal

Users can filter transactions by category on the dashboard without page reload.

## First increment

1. Add category filter UI (Select dropdown on dashboard).
2. Wire to Prisma query (pass `category` param).
3. Update display in real time (client-side state or Server Action).

## Later increments

- Filter by date range
- Filter by transaction type (income/expense)

## Deferred / open questions

- Should filters persist in URL state or session storage?
- What are the default categories? Hardcoded list or user-defined?

## Security / permissions

Users may only filter their own transactions. Authority: `checkUser()` in the dashboard layout.

## Verification

- `pnpm build` ✓
- Manual: sign in, navigate to dashboard, select a category, verify transaction list updates.
- Not verified: category persistence across sessions, bulk filtering performance.
```

This is a move, not a rewrite: nothing above may be re-worded, re-verified or improved in this task.

Then delete `## 00 — Dashboard transaction filtering` and everything under it through the `---` before
`# EDITING THIS FILE`, and replace the `# FEATURE SPECS` body with the template's delegation, verbatim:

```markdown
# FEATURE SPECS

Feature specifications live in `specs/`. One file per deliverable unit of work. See `specs/README.md` for
structure and `specs/00-template.md` for the template.
```

- [ ] **Step 3: Prove nothing was lost and nothing was duplicated**

Before the deletion, capture what is leaving; after it, prove the copy is the only place those lines exist now:

```bash
wc -l AGENTS.md
grep -c '^### ' AGENTS.md                            # the 6 spec subsections are still in the doc
grep -n '^## Verification' AGENTS.md                 # the surviving H2 under SERVICE ARCHITECTURE
grep -c '^## ' specs/01-dashboard-transaction-filtering.md
grep -rn 'category filter UI\|Select dropdown' AGENTS.md specs/
```
Expected: `wc -l` = 849 before, 818 after (lines 790–823 leave, one line returns in the delegation); the new
file reports `6` H2 subsections; the last grep
finds the two phrases **only** under `specs/`. If `AGENTS.md` still answers, the deletion did not land — fix that
before continuing, because a duplicated spec is two authorities for one feature.

- [ ] **Step 4: Restore the `specs/` pointers in the workflow skill**

`grep -n 'spec' .claude/skills/development-workflow.md` reports lines 14, 36, 49 (and 29). Line 36 ("Do not restate
the spec in a doc — link it.") is generic and stays. Change the other three so `specs/` is the named home:
- line 14: `in the same change (AGENTS.md, the relevant spec, inline comments)` →
  `in the same change (AGENTS.md, the feature's spec under specs/, inline comments)`.
- line 29: `Record it in AGENTS.md § FEATURE SPECS → Deferred / open questions and stop that branch of work.` →
  `Record it in the feature's spec under specs/ (copy specs/00-template.md) and stop that branch of work.`
- line 49: `The unit's spec reflects what actually happened — a feature unit in AGENTS.md § FEATURE SPECS, a
  conversion/migration plan in `docs/superpowers/{specs,plans}/`.` →
  `The spec in specs/ reflects what actually happened for a feature unit; a conversion or migration keeps its plan
  under docs/superpowers/plans/.`

Run: `grep -n 'specs/' .claude/skills/development-workflow.md`
Expected: three lines naming `specs/`, and no line naming `AGENTS.md § FEATURE SPECS`.

- [ ] **Step 5: Gate chain, then commit boundary**

```bash
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm check:docs 2>&1 | tail -4
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm test 2>&1 | tail -4
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm lint 2>&1 | grep problems
git add specs AGENTS.md .claude/skills/development-workflow.md
git commit -m "docs: move feature specs out of AGENTS.md into specs/"
```
Expected: green; lint unchanged. `pnpm typecheck` and `pnpm build` are unaffected by markdown, but run them at
Task 7's final pass — say so in the report rather than claiming an unrun gate.

---

### Task 4: Cut `## Progress Tracker` and redistribute its facts

Nine headings the template does not have, ~81 lines. Nothing is deleted blind: each subsection goes to the
template-mandated section that holds that kind of fact, and facts that already exist there are **deleted, not
copied** (Rule 4: prove it was already said; one authority per rule).

**Files:**
- Modify: `AGENTS.md` — `### Status`, `### Invariants`, `### Language strictness`, `### Testing`,
  `# TARGET STATE`, `## Progress Tracker` (lines 571–650) deleted, and references at lines 96, 104, 130, 284,
  339, 473, 533, 566, 834
- Modify: `.claude/skills/development-workflow.md` item 3 of "Before moving to the next unit"

**Interfaces:**
- Consumes: Task 3 (the spec is out of the doc, so the tracker is the last content-bearing extra).
- Produces: an AGENTS.md whose extra headings are exactly the three renames, which Task 6 asserts.

- [ ] **Step 1: Prove which facts already have an authority, before deleting anything**

Run:
```bash
grep -n 'noImplicitAny\|useUnknownInCatchVariables' AGENTS.md
grep -n 'serialized-transaction' AGENTS.md
grep -n 'add-transaction-form' AGENTS.md
grep -n 'catch (error)\|catch binding\|parseInput' AGENTS.md
```
Expected: the two flags and the `lib/serialized-transaction.ts` gap each appear in `### Language strictness`
(already, with the same wording as the tracker's "Current goal"); `add-transaction-form` appears only in § Session
notes (so its money bug is a **relocation**, Step 3); `parseInput` appears in §15 and § Testing. Record which line
numbers you checked — the report must name them.

- [ ] **Step 2: Rewrite `### Status` to absorb "Current phase" and "Completed"**

Replace the existing § Status body (lines 135–141) with:

```markdown
**Built** — User sign-up/sign-in (Clerk), dashboard page, account creation, transaction logging, budget tracking
UI; the whole tree in TypeScript under `strict` (Plan A); the agent instruction layer, its repo skills, and the
instruction-layer checker in `tests/platform/unit/`.

**Not built** — Recurring transaction processing run against a database, delivered email alerts, receipt upload,
transaction export, analytics, multi-user sharing, mobile app. Each is a bullet in TARGET STATE.

**Next unit** — Plan B: the server-side `parseInput` boundary, then the two strict-flag flips. BLOCKERS in
DEVELOPMENT WORKFLOW lists what cannot be verified until credentials exist.

Verified: 2026-10-13, against the working tree on `feat/ts-zod-plan-a-bridge`. `git log --oneline` is the
authority on what shipped and when; this file does not duplicate it.
```

- [ ] **Step 3: Relocate the two facts that live nowhere else**

Append item 5 to `### Invariants` (the money bug, which today only § Session notes records):

```markdown
5. **`createTransaction` is handed a string amount** —
   `app/(main)/transaction/_components/add-transaction-form.tsx:99-101` builds
   `{ amount: parseFloat(data.amount), ...data }`, so the spread re-overwrites the parsed number with the raw
   form string. `actions/transaction.ts:120-122` then adds it to a `Decimal`: the INCOME branch concatenates
   (`100 + "250"` → `"100250"`) and `:143` writes that as the balance. Fresh accounts hide it
   (`0 + "250"` → `"0250"` → 250); EXPENSE is accidentally correct via the unary minus. `updateTransaction`
   parses (`:207-208`, commit `80aec7a`). No test pins `createTransaction`. Plan B's `parseInput` owns it.
```

Append to the last bullet of `### Testing`:

```markdown
- `tests/platform/unit/instruction-layer.test.ts` checks this file and the skills, not the app. A green
  `pnpm test` therefore proves the instruction layer is self-consistent; it proves nothing about runtime
  behaviour, which still has no coverage.
```

- [ ] **Step 4: Move the open questions where each one belongs**

Three of the tracker's twelve open questions duplicate `### Open product questions` verbatim (recurring cadence,
alert channel, currency) — delete the duplicates. Replace the body of `## When to fill sections` item 5 and the
`# TARGET STATE` list's tail with bullets for the rest, one line each, naming what it blocks. Write these twelve:

```markdown
- **Lint census decides CI's fourth gate:** `pnpm lint` reports pre-existing `import/order` and
  `react-hooks/set-state-in-effect` errors. Until that is decided, `.github/workflows/ci.yml` cannot add the lint
  step the template's `### Review gate` requires ("CI runs the same commands"). Options: autofix as a standalone
  commit, fix the one hook error (a behaviour change), downgrade `import/order` to `warn`, or keep this repo's
  written exception under that heading.
- **Rotting literals are still in this file.** The template forbids counts in docs; §13, § Verification and §
  Language strictness quote test, error and file counts because a baseline has to live somewhere. Deciding where
  (a generated census file? the CI log?) is its own unit.
- **`engines.node` is undeclared** while Next 16 and Clerk 7 both need `>=20.9.0` and CI pins Node 20 by hand.
  Blocks: a reproducible "which runtime" answer for a new clone.
- **The seed endpoint is an unauthenticated `GET` that writes rows.** Blocks: any deploy that is not local.
- **`@react-email/components` is deprecated upstream and `@react-email/ui` is absent,** so `pnpm email` cannot
  run. Blocks: proving `emails/template.tsx` renders; needs a replacement decision.
- **The account chart groups by a date label that drops the year**
  (`app/(main)/account/_components/account-chart.tsx:67`, re-parsed at `:83-84`), so a Dec 31 from two years
  merges into one bar and a December-to-January window mis-orders it. Fixing it changes chart output.
- **Page changes never suppressed scrolling:** `components/pagination.tsx:31` calls `router.push(url)` with no
  options after Plan A deleted a dead argument. Whether to pass `{ scroll: false }` for real is a behaviour
  decision.
- **`components/header.tsx` props and helpers are unannotated** — it belonged to no Plan A task. Plan B Phase 3.
- **The env vars read through `as string` assertions** (`lib/arcjet.ts:4`, `proxy.ts:14`,
  `actions/transaction.ts:12`, `lib/inngest/functions.ts:217`, `actions/seed.ts:8-9`) are a type-lie;
  `experimental.typedEnv` or a Zod env schema is the honest fix. Blocks: trusting the config surface.
- **`jsdom` and `@testing-library/react` are not installed,** so `hooks/use-fetch.ts` has no test. Blocks: any
  claim about the client fetch wrapper.
- **Recurring processing has never executed.** Inngest serves the four functions at `/api/inngest`; no schedule
  has fired here, so nothing is applied automatically. Blocks: the "recurring transactions" promise in Core Flow.
- **`receiptUrl` is never populated.** Gemini OCR is reachable from the add-transaction form but returns no file
  URL and there is no upload endpoint or bucket. Blocks: "upload a receipt".
```

- [ ] **Step 5: Delete the section and sweep every reference**

```bash
python3 - <<'PY'
import re
p = 'AGENTS.md'
s = open(p).read()
start = s.index('## Progress Tracker')
end = s.index('# SERVICE ARCHITECTURE — Implemented surface')
s = s[:start] + s[end:]
open(p, 'w').write(s)
PY
grep -n 'Progress Tracker\|PROGRESS TRACKER' AGENTS.md
```
Expected: the grep still lists the reference lines (96, 104, 130, 284, 339, 473, 533, 566, 834) — you are now
about to fix each. The cut swallows the `---` separator that sat above `# SERVICE ARCHITECTURE`; the one at line
569 (after § Review gate) survives, so the doc still separates the two H1s exactly once. Fix each reference:
- 96 (§13 gate 4) and 566 (§ Review gate 4): `(see Progress Tracker for the census)` → `(the census is quoted in
  § Verification)`.
- 104 (§14) and 473 (§ Read order before implementing): delete `→ PROGRESS TRACKER` from both chains.
- 130: `Update the section your change invalidates, plus PROGRESS TRACKER, before continuing.` →
  `Update the section your change invalidates, and TARGET STATE if the change lands design intent, before
  continuing.`
- 284: `… not these DB-level invariants. See PROGRESS TRACKER.` → `… not these DB-level invariants.`
- 339: drop the trailing `(see Progress Tracker)` pointer; the sentence stands alone.
- 533 (`### Before moving to the next unit` item 3): restore the template's line —
  `3. The spec in `specs/` reflects what actually happened.`
- 834 (`## When to fill sections` item 5): the template's list has no PROGRESS TRACKER row; renumber so the five
  remaining rows read like the template's (`STANDING RULES 11–17`, `PROJECT OVERVIEW through PM CONVENTIONS`,
  `SERVICE ARCHITECTURE`, `TARGET STATE`, `FEATURE SPECS (specs/)`) and delete the trailing `✓` marks — they are
  status, which is what § Status now carries.

Also delete the `| Progress Tracker |` slot row from § Stack/any table if the grep shows one, and re-run the grep
until it prints nothing.

- [ ] **Step 6: Verify the cut left no orphan claim**

Run:
```bash
grep -n 'Progress Tracker\|PROGRESS TRACKER' AGENTS.md .claude/skills/*.md; echo "REFS_EXIT=$?"
grep -c '^' AGENTS.md
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm check:docs 2>&1 | tail -5
```
Expected: `REFS_EXIT=1` (no matches anywhere), AGENTS.md near 737 lines (818 minus the ~81-line section),
checker still green (it has no
assertion that touches the deleted section — that comes in Task 6 as heading parity).

- [ ] **Step 7: Commit boundary**

```bash
git add AGENTS.md .claude/skills/development-workflow.md
git commit -m "docs: cut the Progress Tracker into the sections that own each fact"
```

---

### Task 5: Citation-resolution assertion + the rewords it demands

Every backticked path or `path:line` in `AGENTS.md` and in the repo skills must resolve. Measured with exactly
the rule below: **69 tokens resolve, 4 fail** — `01-app/02-guides/upgrading/version-16.md` (a sub-path cited
without its `node_modules/next/dist/docs/` prefix) and three inside the tracker line Task 4 deleted
(`specs/`, `lib/checkUser.js`, `lib/prisma.js`), so after Task 4 the expected failure count is **1**.

**Files:**
- Modify: `tests/platform/unit/instruction-layer.test.ts` (append `pathCitations` + block)
- Modify: `AGENTS.md` line 89 (§12)

**Interfaces:**
- Consumes: `linesOutsideFences` (Task 1), `ROOT` (Task 1), `specs/` existing on disk (Task 3).
- Produces: `type Resolve`, `pathCitations(md, resolve): string[]`.

- [ ] **Step 1: Write the failing test**

Append after `envMismatch`:

```typescript
type Resolve = (p: string) => { exists: boolean; lineCount?: number };

const CITABLE_EXT = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'json', 'prisma', 'css', 'md', 'mdx', 'yml', 'yaml', 'sql', 'sh',
]);
const TICK = /`([^`\n]+)`/g;
const PATH_SHAPE = /^[A-Za-z0-9_().\/-]+$/;
const LINE_RANGE = /^\d+(-\d+)?$/;

function pathCitations(md: string, resolve: Resolve): string[] {
  const defects: string[] = [];
  let inFence = false;
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    for (const m of lines[i].matchAll(TICK)) {
      const tok = m[1].trim();
      // Narrow on purpose: repo-relative, must carry a slash, must end in a real extension (or be a
      // trailing-slash directory). That excludes eslint rule names (import/order), npm specifiers
      // (eslint-config-next/typescript), domains, branch names and bare files (middleware.js) — every one of
      // which is legitimately named in this doc and none of which is a path in this repo.
      if (!tok.includes('/') || !PATH_SHAPE.test(tok)) continue;
      if (/[*[\]?{}<>|]/.test(tok) || tok.startsWith('/') || tok.includes('://')) continue;
      const sep = tok.indexOf(':');
      const file = (sep === -1 ? tok : tok.slice(0, sep)).replace(/\/+$/, '');
      const range = sep === -1 ? '' : tok.slice(sep + 1);
      if (!file) continue;
      const isDir = sep === -1 && tok.endsWith('/');
      const ext = file.includes('.') ? file.split('.').pop()!.toLowerCase() : '';
      if (!isDir && !CITABLE_EXT.has(ext)) continue;
      if (range && !LINE_RANGE.test(range)) continue;
      const res = resolve(file);
      if (!res.exists) {
        defects.push(`line ${i + 1}: \`${tok}\` does not resolve`);
        continue;
      }
      if (range && res.lineCount !== undefined) {
        const hi = Number(range.split('-').pop());
        if (hi > res.lineCount) defects.push(`line ${i + 1}: \`${tok}\` cites line ${hi}, file has ${res.lineCount}`);
      }
    }
  }
  return defects;
}

const resolveInRepo: Resolve = (p) => {
  const abs = path.join(ROOT, p);
  if (!fs.existsSync(abs)) return { exists: false };
  if (fs.statSync(abs).isDirectory()) return { exists: true };
  return { exists: true, lineCount: fs.readFileSync(abs, 'utf8').split('\n').length };
};
```

Then the block:

```typescript
describe('every path citation resolves', () => {
  it('reports a missing file, a line past the end, and ignores non-paths', () => {
    const fake: Resolve = (p) => (p === 'lib/real.ts' ? { exists: true, lineCount: 10 } : { exists: false });
    const doc = [
      'Says `lib/nope.ts` — broken.',
      'Says `lib/real.ts:9` — fine.',
      'Says `lib/real.ts:99` — past the end.',
      'Says `import/order` and `randomuser.me` and `origin/main` and `app/api/[...]/route.ts` — all skipped.',
      'Says `app/(main)/` — a directory, and the fake resolver says no.',
    ].join('\n');
    expect(pathCitations(doc, fake)).toEqual([
      'line 1: `lib/nope.ts` does not resolve',
      'line 3: `lib/real.ts:99` cites line 99, file has 10',
      'line 5: `app/(main)/` does not resolve',
    ]);
  });

  it('AGENTS.md cites only paths that exist', () => {
    expect(pathCitations(read('AGENTS.md'), resolveInRepo)).toEqual([]);
  });

  it('every repo skill cites only paths that exist', () => {
    const dir = path.join(ROOT, '.claude/skills');
    const defects = skillFilesUnder(dir, dir).flatMap((f) =>
      pathCitations(read(path.join('.claude/skills', f)), resolveInRepo).map((d) => `${f}: ${d}`),
    );
    expect(defects).toEqual([]);
  });
});
```

Naming the skill file in the wrapper is the point: a defect reported as `line 12` with no file is a defect nobody
can find.

- [ ] **Step 2: Run it and read the real failures**

Run:
```bash
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm check:docs 2>&1 | grep -E 'does not resolve|past the end|AssertionError|failed'
```
Expected: exactly one AGENTS.md defect (line ~89, `01-app/02-guides/upgrading/version-16.md`) and zero skill
defects. If the skills produce a defect, it is a stale pointer — reword the sentence to name a path that exists,
and never widen the exclusion list (the checker must not become the thing that lies).

- [ ] **Step 3: Fix the citation**

AGENTS.md §12, replace `(version-16 guide: `01-app/02-guides/upgrading/version-16.md`)` with
`(version-16 guide: `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`)`.

Run: `test -f node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md && echo EXISTS`
Expected: `EXISTS`.

- [ ] **Step 4: Verify green, gate chain, commit boundary**

```bash
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm check:docs 2>&1 | tail -4
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm typecheck
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm lint 2>&1 | grep problems
git add tests/platform/unit/instruction-layer.test.ts AGENTS.md
git commit -m "test: check that every path cited by the instruction layer resolves"
```
Expected: 10 tests passed in the platform file (7 from Tasks 1–2 + 3 here), `Tests 29 passed` overall;
typecheck 0 errors; census unchanged.

---

### Task 6: Structure parity against a vendored skeleton + the three renames

The template is a sibling checkout, not a repo file, so CI cannot read it: the heading skeleton is vendored as a
fixture and CI compares AGENTS.md to the fixture. When the sibling *does* exist locally, the test additionally
demands the fixture still equals its live skeleton — that is how a template change becomes a loud local failure
instead of invisible drift.

**Files:**
- Create: `tests/platform/fixtures/agents-md-skeleton.txt`
- Create: `tests/platform/scripts/refresh-skeleton.mjs`
- Modify: `package.json` (`skeleton:refresh`)
- Modify: `tests/platform/unit/instruction-layer.test.ts`
- Modify: `AGENTS.md` — three heading lines

**Interfaces:**
- Consumes: `linesOutsideFences` (Task 1).
- Produces: `headingsOutsideFences(md): string[]`, `diffHeadings(actual, expected)`, the fixture path used by both
  the test and the refresh script.

- [ ] **Step 1: Write the pure diff helper and its failing test**

Append after `pathCitations`:

```typescript
const HEADING = /^(#{1,3}) (.+)$/;

const headingsOutsideFences = (md: string): string[] =>
  linesOutsideFences(md).flatMap((l) => {
    const m = l.match(HEADING);
    return m ? [`${'#'.repeat(m[1].length)} ${m[2].trim()}`] : [];
  });

function diffHeadings(actual: string[], expected: string[]): { extra: string[]; missing: string[] } {
  const want = new Set(expected);
  const have = new Set(actual);
  return {
    extra: [...new Set(actual)].filter((h) => !want.has(h)).sort(),
    missing: [...new Set(expected)].filter((h) => !have.has(h)).sort(),
  };
}
```

```typescript
describe('AGENTS.md heading skeleton equals the template skeleton', () => {
  it('reports both directions of a drift', () => {
    expect(diffHeadings(['# A', '## B', '## Extra'], ['# A', '## Gone'])).toEqual({
      extra: ['## Extra'],
      missing: ['## Gone'],
    });
  });

  it('the vendored skeleton equals AGENTS.md, heading for heading, in order', () => {
    const fixture = read('tests/platform/fixtures/agents-md-skeleton.txt').split('\n').filter((l) => l.length > 0);
    const actual = headingsOutsideFences(read('AGENTS.md'));
    const diff = diffHeadings(actual, fixture);
    expect(diff).toEqual({ extra: [], missing: [] });
    expect(actual).toEqual(fixture);
  });

  it('the vendored skeleton still equals the live template when this machine has the sibling checkout', () => {
    const sibling = path.join(ROOT, '..', 'agent-ready-template', 'AGENTS.md');
    // Deliberately conditional, and deliberately not a skip: the assertion above always runs, so this one can
    // only add a failure, never subtract coverage. In CI the sibling does not exist and nothing is green-by-
    // emptiness — which is the exact failure mode the template's own table names.
    if (!fs.existsSync(sibling)) return;
    expect(headingsOutsideFences(fs.readFileSync(sibling, 'utf8'))).toEqual(
      read('tests/platform/fixtures/agents-md-skeleton.txt').split('\n').filter((l) => l.length > 0),
    );
  });
});
```

Run: `PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm exec vitest run tests/platform 2>&1 | grep -E 'AssertionError|✗|×' | head -4`
Expected: FAIL — the fixture does not exist yet (ENOENT), and once it does, 19 extras / 3 missing until Step 4.

- [ ] **Step 2: Write the generator**

Create `tests/platform/scripts/refresh-skeleton.mjs`:

```javascript
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Regenerates tests/platform/fixtures/agents-md-skeleton.txt from the template checkout. Run it by hand, read
// the diff, and commit the fixture only when the change is one you want AGENTS.md to follow.
const ROOT = path.resolve(fileURLToPath(new URL('../../../', import.meta.url)));
const TEMPLATE = path.join(ROOT, '..', 'agent-ready-template', 'AGENTS.md');
const OUT = path.join(ROOT, 'tests', 'platform', 'fixtures', 'agents-md-skeleton.txt');

if (!fs.existsSync(TEMPLATE)) {
  console.error(`No template at ${TEMPLATE}. This script is the only place the sibling checkout is read, and it
  refuses to write an empty fixture.`);
  process.exit(1);
}

let inFence = false;
const headings = [];
for (const line of fs.readFileSync(TEMPLATE, 'utf8').split('\n')) {
  if (line.startsWith('```')) {
    inFence = !inFence;
    continue;
  }
  if (inFence) continue;
  const m = line.match(/^(#{1,3}) (.+)$/);
  if (m) headings.push(`${'#'.repeat(m[1].length)} ${m[2].trim()}`);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, `${headings.join('\n')}\n`);
console.log(`Wrote ${headings.length} headings to ${path.relative(ROOT, OUT)}`);
```

- [ ] **Step 3: Generate the fixture and check the count**

```bash
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm exec node tests/platform/scripts/refresh-skeleton.mjs
wc -l tests/platform/fixtures/agents-md-skeleton.txt
head -4 tests/platform/fixtures/agents-md-skeleton.txt
```
Expected: `Wrote 84 headings to tests/platform/fixtures/agents-md-skeleton.txt`; `wc -l` = 84; first four lines
`# This is NOT the Next.js you know`, `# AGENT-READY PROJECT INSTRUCTION LAYER`, `# STANDING RULES — Read first,
before any task`, `## Portable core — Rules 1–10`.

Add the script to `package.json` after `check:docs`:

```json
    "check:docs": "TZ=UTC vitest run tests/platform",
    "skeleton:refresh": "node tests/platform/scripts/refresh-skeleton.mjs",
```

- [ ] **Step 4: Make the three renames**

```bash
python3 - <<'PY'
p = 'AGENTS.md'
s = open(p).read()
pairs = [
    ('## Project-specific rules — Rules 11–17',
     '## Project-specific rules — Fill these slots day one'),
    ('### 15. Cross-cutting authority — one authority per rule\n',
     '### 15. Cross-cutting authority — one authority per rule, enforced once\n'),
    ('### Review gate (must be green to merge)',
     '### Review gate'),
]
for a, b in pairs:
    assert s.count(a) == 1, (a, s.count(a))
    s = s.replace(a, b)
open(p, 'w').write(s)
PY
grep -n 'Project-specific rules\|^### 15\.\|^### Review gate' AGENTS.md
```
Expected: three lines, each in template wording. The `### Review gate` body keeps this repo's truth (gate 4 is red
on the census, CI omits it) — body prose is ours, per the contract.

- [ ] **Step 5: Verify parity**

Run: `PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm check:docs 2>&1 | tail -6`
Expected: 13 tests passed, including the two new parity assertions. If `extra` is not empty, the remaining
extras are headings Task 3 or Task 4 missed; if `missing` is not empty, a rename was applied to the wrong line.
Fix the doc, never the fixture — the fixture changes only via `pnpm skeleton:refresh` after reading the diff.

- [ ] **Step 6: Gate chain, then commit boundary**

```bash
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm typecheck
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm test 2>&1 | tail -4
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm lint 2>&1 | grep problems
git add tests/platform AGENTS.md package.json
git commit -m "test: pin AGENTS.md headings to a vendored template skeleton"
```
Expected: `Test Files 4 passed`, `Tests 32 passed`, typecheck 0, census unchanged.

---

### Task 7: Reconcile the cross-references and run the whole chain

The checker now runs inside `pnpm test`, so it is already CI gate 2 — but three docs still describe the chain as
if it were only the app's tests, and two of them list three protected paths where Rule 17 lists seven.

**Files:**
- Modify: `.github/workflows/ci.yml` (one comment line)
- Modify: `AGENTS.md` §13 CI paragraph, § Verification block, § Repo skills, § File organization tree
- Modify: `.claude/skills/verification-gates.md`, `.claude/skills/development-workflow.md`

- [ ] **Step 1: Make the three protected-path lists defer to Rule 17**

`grep -rin 'protected paths' AGENTS.md .claude/skills/` finds three lists, all different, none identical to Rule
17's seven — which is the "one authority per rule" defect this task exists to close:
- `.claude/skills/development-workflow.md:43` — `Protected paths for trackXpense: STANDING RULES §17 — …` then
  re-types seven paths. Replace with the pointer only:

```markdown
- **Protected foundations:** STANDING RULES §17 is the single list. Do not re-type it here; read it there.
```

- `AGENTS.md:434` (§ File organization, three paths) and `AGENTS.md:500` (§ Where logic goes, four paths). Both
  become:

```markdown
Protected paths: the seven in STANDING RULES §17 — one authority; this line defers to it.
```

Run: `grep -rin 'protected paths' AGENTS.md .claude/skills/ | grep -c '§17\|STANDING RULES'`
Expected: `3`. Then `grep -rin 'protected paths' AGENTS.md .claude/skills/ | grep 'lib/prisma.ts'` must print
nothing — every re-typed list is gone.

- [ ] **Step 2: Record the checker in the three places that describe the chain**

- `AGENTS.md` §13's CI paragraph: append the sentence `Gate 2 is where the instruction-layer checker runs, so
  every push checks this file, the skills, \`specs/\` and \`.env.example\`.`
- `AGENTS.md` § Verification block: add a line
  `pnpm check:docs # TZ=UTC vitest run tests/platform — the instruction layer checks itself`
  inside the fenced block, and a `# CI: gate 2 now also runs the instruction-layer checker.` comment line beside
  the existing CI comments.
- `.claude/skills/verification-gates.md`, gate 2 entry: state that `pnpm test` includes
  `tests/platform/unit/instruction-layer.test.ts`, and that when it fails the fix is in the doc or the fixture,
  not in the assertion.
- `.github/workflows/ci.yml`: change the header comment naming the gates so gate 2 reads
  `# gate 2: pnpm test — app unit tests + the instruction-layer checker (no credentials needed)`.

- [ ] **Step 3: Prove CI's gate list still matches the file**

Run:
```bash
grep -n 'pnpm \(typecheck\|test\|build\|lint\)' .github/workflows/ci.yml
grep -n 'pnpm \(typecheck\|test\|build\|lint\)' AGENTS.md | head -12
```
Expected: CI lists exactly install, typecheck, test, build — no lint step — and AGENTS.md §13 says the same in
prose. The template's `### Review gate` demands "CI runs the same commands"; that parity is unmet by design and
Task 4 recorded it as a TARGET STATE bullet, so § Review gate's body must say so out loud. Add under it:

```markdown
Deviation, on the books: the template sentence "CI runs the same commands" is not yet true here, because CI has
no lint step while gate 4 is red on a recorded census. Either the census gets decided (TARGET STATE) or this
sentence becomes the repo's written exception.
```

- [ ] **Step 4: Run the entire chain from a clean slate**

```bash
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" npx tsc --noEmit --incremental false 2>&1 | tail -3
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm check:docs 2>&1 | tail -5
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm test 2>&1 | tail -6
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm build 2>&1 | grep -E 'TypeScript|error|Compiled|route' | head -8
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm lint 2>&1 | grep -E 'problems'
```
Expected: tsc silent; `pnpm check:docs` 13 passed; `pnpm test` `Test Files 4 passed (4)`, `Tests 32 passed (32)`;
build prints `Running TypeScript` and `Compiled successfully` with 9 routes; lint `87 errors` / `3 warnings`
(the number from Step 1 of Task 1 — quote both, do not round).

- [ ] **Step 5: Confirm the two health checks the doc tells a reader to run actually pass**

```bash
grep -n '<[a-zA-Z_/]' AGENTS.md; echo "SLOTS_EXIT=$?"
PATH="$HOME/.nvm/versions/node/v20.19.5/bin:$PATH" pnpm exec node tests/platform/scripts/refresh-skeleton.mjs
git diff --stat tests/platform/fixtures/agents-md-skeleton.txt
```
Expected: `SLOTS_EXIT=1` and no output (zero unfilled slots); the refresh writes the identical fixture, so
`git diff --stat` reports nothing — proof the fixture is current, not regenerated-and-drifted.

- [ ] **Step 6: Commit boundary and report**

```bash
git add AGENTS.md .claude/skills .github/workflows/ci.yml tests/README.md docs/superpowers
git status --short
git commit -m "docs: point the gate docs at the instruction-layer checker"
```
Report, per Rule 2: the five gates with their commands and outputs; the heading diff at zero; the slot count at
zero; `Tests 32 passed`; the lint census unchanged at 87/3; what is **not** verified (the CI workflow has never
run on a runner; the money path still has no credentials); and the deviation recorded in § Review gate.

---

## Self-Review Notes

- **Spec coverage:** the five assertions (Tasks 1, 2, 5, 6), the negative fixtures (every task that adds a helper
  adds its broken input first), the cut map (Task 4 Steps 2–5), the `specs/` move and pointer reversal (Task 3),
  the health-check literal (Task 2), the three renames (Task 6 Step 4), the dependent prose sweep (Task 4 Step 5 +
  Task 7), the blocking CI↔Rule-13 decision and the rotting-literal purge as TARGET STATE bullets (Task 4 Step 4,
  restated in Task 7 Step 3). Nothing in the spec is unassigned.
- **Deliberate deviation from the spec's "checker first":** the spec's approach A put the whole checker before the
  cut. Executed literally, `pnpm test` (CI gate 2) would be red across three tasks. This plan keeps the checker
  first where it can be green (Task 1) and pairs each remaining assertion with the doc change that satisfies it,
  so every task boundary passes the chain. Same deliverables, ordered for a green tree.
- **Naming, one deviation:** the spec calls the generator `refresh:skeleton`; this plan ships it as
  `skeleton:refresh` so both doc-tooling scripts sort under the `skeleton`/`check` prefixes rather than mixing a
  verb-first name into the npm scripts. The spec's `pnpm check` (single command) is likewise shipped as
  `check:docs`, because `check` alone would collide with nothing and clarify nothing.
- **Spec reference for the moved feature spec** is `specs/01-dashboard-transaction-filtering.md`, one higher than
  the spec's `specs/00-…`: `specs/README.md` reserves `00-template.md` for the template and numbers real specs from
  01.
- **Counts in this plan** (19 → 32 tests, 87/3 census, 84 headings, 10 slot hits, 4 citation failures, 69
  resolved) were measured on this tree on 2026-10-13 with the commands quoted in the steps. They are instructions
  to compare against, not prose to copy into `AGENTS.md`.
