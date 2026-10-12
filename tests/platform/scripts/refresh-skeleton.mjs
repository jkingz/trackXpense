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
