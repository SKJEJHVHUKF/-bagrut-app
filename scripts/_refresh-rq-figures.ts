// Re-emit the figure constants and their viewBoxes in place, after a change to
// the generator or a spec. Idempotent: it replaces what is there rather than
// inserting, so the hand-written tables added since the first apply survive.
//
// Every replacement goes through a FUNCTION, never a string — the SVG and the
// captions are full of `$`, which String.replace interprets ($&, $', $`, $$).
// That footgun once pasted a copy of the whole file back in, silently.
//
// Run: npx tsx scripts/_refresh-rq-figures.ts [--dry]
import { readFileSync, writeFileSync } from 'node:fs';
import { render } from './_gen-rq-figures';
import { SPECS, PLACEMENT } from './_rq-figure-specs';

const FILE = 'content/lessons/math5/functions-root-quotient.ts';
const DRY = process.argv.includes('--dry');
let src = readFileSync(FILE, 'utf8');
const problems: string[] = [];
let n = 0;

for (const p of PLACEMENT) {
  const spec = SPECS.find((s) => s.id === p.id)!;
  const w = spec.fig.w ?? 300;
  const h = spec.fig.h ?? 260;

  // 1. the constant body
  const open = `const ${p.id}_FIGURE = \``;
  const at = src.indexOf(open);
  if (at < 0) {
    problems.push(`${p.id}: constant not found`);
    continue;
  }
  const close = src.indexOf('`;', at + open.length);
  if (close < 0) {
    problems.push(`${p.id}: unterminated template literal`);
    continue;
  }
  src = src.slice(0, at + open.length) + render(spec.fig) + src.slice(close);

  // 2. the viewBox that sits with it in the diagrams entry
  const vbNeedle = new RegExp(
    `(svg: ${p.id}_FIGURE,\\s*\\n\\s*viewBox: ')[^']*(')`,
  );
  if (!vbNeedle.test(src)) {
    problems.push(`${p.id}: viewBox line not found`);
    continue;
  }
  src = src.replace(vbNeedle, (_m, a: string, b: string) => `${a}0 0 ${w} ${h}${b}`);
  n++;
}

console.log(`${n}/${PLACEMENT.length} figures refreshed${DRY ? ' (dry run)' : ''}`);
if (problems.length) {
  console.log('\n' + problems.map((x) => `  ✗ ${x}`).join('\n'));
  process.exit(1);
}
if (!DRY) {
  writeFileSync(FILE, src, 'utf8');
  console.log(`wrote ${FILE}`);
}
