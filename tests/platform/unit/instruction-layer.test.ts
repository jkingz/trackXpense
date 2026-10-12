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
