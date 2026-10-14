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
    if (isFenceLine(line)) {
      inFence = !inFence;
      continue;
    }
    if (!inFence) out.push(line);
  }
  return out;
}

// One literal for the fence delimiter, so the assertion that pins refresh-skeleton.mjs to this file's rule has a
// single source: change FENCE here and the generator check goes red with it instead of drifting silently.
const FENCE = '```';
const isFenceLine = (line: string): boolean => line.startsWith(FENCE);

const SLOT = /<[a-zA-Z_/]/;
const slotLines = (md: string): number[] =>
  md.split('\n').reduce<number[]>((acc, line, i) => (SLOT.test(line) ? [...acc, i + 1] : acc), []);

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

type Resolve = (p: string) => { exists: boolean; lineCount?: number };

const CITABLE_EXT = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs', 'json', 'prisma', 'css', 'md', 'mdx', 'yml', 'yaml', 'sql', 'sh',
]);
const TICK = /`([^`\n]+)`/g;
// `:` is in the shape on purpose: `actions/transaction.ts:119-143` is the citation form this assertion exists
// to police, and a class without it would skip every line-bearing citation in the doc instead of checking it.
const PATH_SHAPE = /^[A-Za-z0-9_().\/:-]+$/;
const LINE_RANGE = /^\d+(-\d+)?$/;

function pathCitations(md: string, resolve: Resolve): string[] {
  const defects: string[] = [];
  let inFence = false;
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (isFenceLine(lines[i])) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    for (const m of lines[i].matchAll(TICK)) {
      const tok = m[1].trim();
      // Narrow on purpose: repo-relative, must carry a slash, must end in a real extension (or be a
      // trailing-slash directory) UNLESS it carries a line range, which is checked against the target below even
      // when the target has no extension. That excludes eslint rule names (import/order), npm specifiers
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
      if (!isDir && !range && !CITABLE_EXT.has(ext)) continue;
      const res = resolve(file);
      if (!res.exists) {
        defects.push(`line ${i + 1}: \`${tok}\` does not resolve`);
        continue;
      }
      if (!LINE_RANGE.test(range)) continue;
      // A range on something with no line count (a directory) is a defect, not a pass: resolveInRepo only reports
      // lineCount for files, so this is where `some/dir/:42` stops being dropped before resolve().
      if (range && res.lineCount === undefined) {
        defects.push(`line ${i + 1}: \`${tok}\` cites a line range on \`${file}\`, which has no line count`);
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
  const text = fs.readFileSync(abs, 'utf8');
  return { exists: true, lineCount: text.split('\n').length - (text.endsWith('\n') ? 1 : 0) };
};

// Mirrors tests/platform/scripts/refresh-skeleton.mjs: change one, change the other, then pnpm skeleton:refresh.
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

// The instruction layer has two homes: AGENTS.md (contract + stubs + the two sections kept whole) and
// docs/agent-guide/ (the moved bodies). Everything below polices both as one unit, because a rule that reads only
// AGENTS.md would go quiet on the day its content moved — which is exactly the drift this directory creates.
const GUIDE_DIR = 'docs/agent-guide';
const guideBodies = (): string[] => skillFilesUnder(path.join(ROOT, GUIDE_DIR), ROOT);
const GUIDE_POINTER = /docs\/agent-guide\/([a-z0-9][a-z0-9-]*\.md)/g;
// Fence-aware on purpose: the file-organization tree names the directory without naming a body, and a pointer
// inside a fence is an example, not a promise.
const guidePointers = (md: string): string[] =>
  [...linesOutsideFences(md).join('\n').matchAll(GUIDE_POINTER)].map((m) => m[1]);

// The third home: Rules 11–17 keep their headings in AGENTS.md (the fixture owns the skeleton) and their bodies
// here. Kept out of GUIDE_DIR on purpose, because the index-equality assertion above compares one directory's
// README against that directory's files, and merging the two would make it pass on the wrong pairing.
const RULES_DIR = 'docs/standing-rules';
const RULE_POINTER = /docs\/standing-rules\/([a-z0-9][a-z0-9-]*\.md)/g;
const rulesBodies = (): string[] => skillFilesUnder(path.join(ROOT, RULES_DIR), ROOT);
const rulePointers = (md: string): string[] =>
  [...linesOutsideFences(md).join('\n').matchAll(RULE_POINTER)].map((m) => m[1]);

function ruleHomeGaps(
  indexText: string,
  contractText: string,
  names: string[],
): { unindexed: string[]; unpointed: string[]; dangling: string[] } {
  const indexed = [...new Set(rulePointers(indexText))];
  const pointed = [...new Set(rulePointers(contractText))];
  const bodies = names.filter((n) => n !== 'README.md');
  return {
    unindexed: bodies.filter((n) => !indexed.includes(n)).sort(),
    unpointed: bodies.filter((n) => !pointed.includes(n)).sort(),
    dangling: [...new Set([...indexed, ...pointed])].filter((p) => !names.includes(p)).sort(),
  };
}

describe('instruction-layer checker harness', () => {
  it('reads the files it claims to check', () => {
    expect(fs.existsSync(path.join(ROOT, 'AGENTS.md'))).toBe(true);
    expect(fs.existsSync(path.join(ROOT, '.env.example'))).toBe(true);
    // Its only job is proving skillFilesUnder walked .claude/skills and found the files; the two-way listing check
    // in the next describe is what polices AGENTS.md § Repo skills. A seventh skill means updating this number.
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

  it('the instruction layer names exactly the variables .env.example inventories', () => {
    // All three homes are one doc: names like DIRECT_URL live in the moved bodies, so scanning AGENTS.md alone
    // would report them as unmentioned the moment the bodies split out.
    const layer = [read('AGENTS.md'), ...guideBodies().map(read), ...rulesBodies().map(read)].join('\n');
    expect(envMismatch(layer, read('.env.example'))).toEqual({ undocumented: [], unmentioned: [] });
  });
});

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

describe('every path citation resolves', () => {
  it('reports a missing file, a line past the end, and ignores non-paths', () => {
    const fake: Resolve = (p) => (p === 'lib/real.ts' ? { exists: true, lineCount: 10 } : { exists: false });
    const doc = [
      'Says `lib/nope.ts` — broken.',
      'Says `lib/real.ts:9` — fine.',
      'Says `lib/real.ts:99` — past the end.',
      'Says `import/order` and `randomuser.me` and `origin/main` and `app/api/[...]/route.ts` — all skipped.',
      'Says `app/(main)/` — a directory, and the fake resolver says no.',
      'Says `lib/ghost.ts:helper()` — symbol-addressed and the file is missing.',
      'Says `lib/real.ts:checkUser()` — symbol-addressed and the file exists, so no defect.',
      'Says `lib/nope2.ts:1-2-3` — a malformed range on a missing file still checks the file.',
    ].join('\n');
    expect(pathCitations(doc, fake)).toEqual([
      'line 1: `lib/nope.ts` does not resolve',
      'line 3: `lib/real.ts:99` cites line 99, file has 10',
      'line 5: `app/(main)/` does not resolve',
      'line 6: `lib/ghost.ts:helper()` does not resolve',
      'line 8: `lib/nope2.ts:1-2-3` does not resolve',
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

  it('a line range on a directory is reported instead of dropped before resolve()', () => {
    const fake: Resolve = (p) => (p === 'some/dir' ? { exists: true } : { exists: false });
    // Before this rule was written the extension gate dropped `some/dir/:42` and the run stayed green.
    expect(pathCitations('Says `some/dir/:42` — a range on a directory.', fake)).toEqual([
      'line 1: `some/dir/:42` cites a line range on `some/dir`, which has no line count',
    ]);
  });
});

describe('feature spec citations resolve', () => {
  it('every repo path cited in the files under specs/ exists', () => {
    const dir = path.join(ROOT, 'specs');
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.md'))
      .sort();
    // Trip-wire, not content: the defects list below is empty today because none of these files carries a
    // path-shaped backtick token the narrow citation rule accepts, so without this the walk could break
    // (a renamed directory, a filter that matches nothing) and the run would stay green. A fourth spec file
    // means updating this number.
    expect(files).toHaveLength(3);
    const defects = files.flatMap((f) =>
      pathCitations(read(path.join('specs', f)), resolveInRepo).map((d) => `${f}: ${d}`),
    );
    expect(defects).toEqual([]);
  });
});

describe('agent-guide bodies are policed like AGENTS.md', () => {
  it('the index lists every body and the directory holds nothing the index omits', () => {
    const names = guideBodies().map((f) => f.split('/').pop()!);
    // Trip-wire, same job as the specs/ and skills ones: README plus ten section bodies. An eleventh body means
    // a new file nobody updated the count for — and without this line the set equality below could pass on [].
    expect(names).toHaveLength(11);
    const listed = [...new Set(guidePointers(read(`${GUIDE_DIR}/README.md`)))].sort();
    expect(listed).toEqual(names.filter((n) => n !== 'README.md').sort());
  });

  it('every AGENTS.md stub pointer resolves, and every body is pointed at', () => {
    const names = guideBodies().map((f) => f.split('/').pop()!);
    const pointed = [...new Set(guidePointers(read('AGENTS.md')))];
    expect(pointed.filter((p) => !names.includes(p))).toEqual([]);
    expect(names.filter((n) => n !== 'README.md' && !pointed.includes(n))).toEqual([]);
  });

  it('no body carries an unfilled template slot', () => {
    expect(guideBodies().flatMap((f) => slotLines(read(f)).map((l) => `${f}:${l}`))).toEqual([]);
  });

  it('every repo path cited outside a fence in a body resolves', () => {
    const defects = guideBodies().flatMap((f) =>
      pathCitations(read(f), resolveInRepo).map((d) => `${f}: ${d}`),
    );
    expect(defects).toEqual([]);
  });
});

describe('standing-rule bodies are policed like the other two homes', () => {
  it('a body the index omits, a body no stub points at, and a pointer to nothing are all reported', () => {
    // Deliberately-broken input for the three directions below, so none of them can pass by matching nothing.
    const names = ['README.md', '11-both.md', '12-index-only.md', '13-stub-only.md'];
    const index = [
      'Index: `docs/standing-rules/11-both.md`, `docs/standing-rules/12-index-only.md`',
      'and `docs/standing-rules/ghost.md`.',
    ].join('\n');
    const contract = 'Stub: `docs/standing-rules/11-both.md` and `docs/standing-rules/13-stub-only.md`.';
    expect(ruleHomeGaps(index, contract, names)).toEqual({
      unindexed: ['13-stub-only.md'],
      unpointed: ['12-index-only.md'],
      dangling: ['ghost.md'],
    });
  });

  it('docs/standing-rules holds README plus one body per project rule, indexed and pointed at', () => {
    const names = rulesBodies().map((f) => f.split('/').pop()!);
    // Trip-wire, same job as the 11-file and 3-file ones: README plus the seven bodies for Rules 11–17. An eighth
    // means a rule moved out of AGENTS.md without an index row and a stub.
    expect(names).toHaveLength(8);
    expect(ruleHomeGaps(read(`${RULES_DIR}/README.md`), read('AGENTS.md'), names)).toEqual({
      unindexed: [],
      unpointed: [],
      dangling: [],
    });
  });

  it('no standing-rule body carries an unfilled template slot', () => {
    expect(rulesBodies().flatMap((f) => slotLines(read(f)).map((l) => `${f}:${l}`))).toEqual([]);
  });

  it('every repo path cited outside a fence in a standing-rule body resolves', () => {
    const defects = rulesBodies().flatMap((f) =>
      pathCitations(read(f), resolveInRepo).map((d) => `${f}: ${d}`),
    );
    expect(defects).toEqual([]);
  });
});

describe('AGENTS.md heading skeleton equals the template skeleton', () => {
  it('reports both directions of a drift', () => {
    // Both inputs are deliberately unsorted, so the sorted expectations below only hold because diffHeadings
    // sorts each side; `# A` sits on both sides and is reported by neither.
    expect(diffHeadings(['## Zeta', '# A', '## B'], ['# A', '## Gone', '## Alpha'])).toEqual({
      extra: ['## B', '## Zeta'],
      missing: ['## Alpha', '## Gone'],
    });
  });

  it('the vendored skeleton equals AGENTS.md, heading for heading, in order', () => {
    const fixture = read('tests/platform/fixtures/agents-md-skeleton.txt').split('\n').filter((l) => l.length > 0);
    const actual = headingsOutsideFences(read('AGENTS.md'));
    const diff = diffHeadings(actual, fixture);
    expect(diff).toEqual({ extra: [], missing: [] });
    expect(actual).toEqual(fixture);
  });

  it('the heading rule sees #, ## and ### only, so H4, no-space and indented forms drop on both sides', () => {
    // Widening HEADING later is a deliberate edit, not a silent drift: this pins what the parity check cannot see.
    // Never add setext detection — AGENTS.md uses bare --- separators and would grow phantom H2s on both sides.
    expect(headingsOutsideFences('#### Fourth\n#Nospace\n\t ## Tab-indented\n')).toEqual([]);
    expect(headingsOutsideFences('# One\n#### Fourth\n#Nospace\n   ## Indented\n')).toEqual(['# One']);
  });

  it('the generator extracts with this file\'s rule, not with a copy of it in prose', () => {
    // refresh-skeleton.mjs runs at the top level, so this reads it as text instead of importing it.
    const src = read('tests/platform/scripts/refresh-skeleton.mjs');
    expect(src).toContain(HEADING.source);
    expect(src).toContain(`startsWith('${FENCE}')`);
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
