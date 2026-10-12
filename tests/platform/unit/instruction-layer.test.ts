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
      const res = resolve(file);
      if (!res.exists) {
        defects.push(`line ${i + 1}: \`${tok}\` does not resolve`);
        continue;
      }
      if (!LINE_RANGE.test(range)) continue;
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
});
