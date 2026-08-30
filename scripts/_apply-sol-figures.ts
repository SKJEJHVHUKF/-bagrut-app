// Put a figure into the SOLUTION of the questions listed in SOLUTION_PLACEMENT.
//
// Itay, 2026-08-30: the שרטוט גרף stage teaches how a graph looks and every one
// of its worked solutions was pure algebra. lesson[].diagrams only renders on
// the 📖 rung; a solution needs its own.
//
// Idempotent: a question that already carries `diagrams` is skipped, so this can
// be re-run after editing a caption without stacking duplicates.
//
// Run: npx tsx scripts/_apply-sol-figures.ts [--dry]
import { readFileSync, writeFileSync } from 'node:fs';
import { SPECS, SOLUTION_PLACEMENT } from './_rq-figure-specs';
import { render } from './_gen-rq-figures';
import { getSubTopics } from '../content/lessons';

const ALREADY = new Set(
  getSubTopics('math5', 'פונקציות')
    .flatMap((s) => s.questions)
    .filter((q) => q.solution.diagrams?.length)
    .map((q) => q.id),
);

const FILE = 'content/lessons/math5/functions-root-quotient.ts';
const DRY = process.argv.includes('--dry');
let src = readFileSync(FILE, 'utf8');
const problems: string[] = [];
let added = 0;

// ---------------------------------------------------------------- 1. consts
// A figure reused from the lesson set (AREA_BETWEEN, ASYM_VERTICAL) already has
// its constant; only emit the ones that do not exist yet.
const ANCHOR = 'const AREA_BETWEEN_FIGURE = `';
const anchorAt = src.indexOf(ANCHOR);
if (anchorAt < 0) throw new Error('anchor constant not found — did the file move?');
const anchorEnd = src.indexOf('`;', anchorAt) + 2;

const newConsts: string[] = [];
for (const id of [...new Set(SOLUTION_PLACEMENT.map((p) => p.id))]) {
  if (src.includes(`const ${id}_FIGURE = \``)) continue;
  const spec = SPECS.find((s) => s.id === id);
  if (!spec) { problems.push(`${id}: no spec`); continue; }
  newConsts.push(`\nconst ${id}_FIGURE = \`${render(spec.fig)}\`;`);
}
if (newConsts.length) {
  src = src.slice(0, anchorEnd) + newConsts.join('') + src.slice(anchorEnd);
}

// ------------------------------------------------------- 2. wire into solutions
// Anchor on the question id, then find its `solution: {` and insert right after
// `finalAnswer:`'s line. NEVER build the replacement with a template that embeds
// the needle — a needle ending in `$` turns `$&` into "everything after the
// match" and silently duplicates the rest of the file.
for (const p of SOLUTION_PLACEMENT) {
  const spec = SPECS.find((s) => s.id === p.id);
  if (!spec) { problems.push(`${p.question}: spec ${p.id} missing`); continue; }

  const idAt = src.indexOf(`id: '${p.question}',`);
  if (idAt < 0) { problems.push(`${p.question}: question not found`); continue; }

  const solAt = src.indexOf('solution: {', idAt);
  if (solAt < 0) { problems.push(`${p.question}: no solution block`); continue; }

  // "Does it already have a figure?" is answered by the loaded module, not by
  // slicing source: a question is the LAST entry of its questions[] array often
  // enough that a text bound runs on into the next lesson step — which has
  // diagrams of its own, and every such question got silently skipped.
  if (ALREADY.has(p.question)) {
    console.log(`  - ${p.question}: already carries a figure, left alone`);
    continue;
  }

  // Anchor on `explanation:`, not on `finalAnswer:` — prettier wraps a long
  // finalAnswer onto its own line, so "the newline after the key" is sometimes
  // the gap BETWEEN the key and its value. A key's own line start always is one.
  const exAt = src.indexOf('explanation:', solAt);
  if (exAt < 0) { problems.push(`${p.question}: no explanation`); continue; }
  const lineEnd = src.lastIndexOf('\n', exAt);
  const indent = ' '.repeat(8);
  const w = spec.fig.w ?? 300;
  const h = spec.fig.h ?? 260;

  // Emitted into a single-quoted TS literal, so an apostrophe or a backslash
  // would produce a file that does not parse. Refuse rather than escape.
  if (/['\\]/.test(p.caption)) { problems.push(`${p.question}: caption needs escaping`); continue; }

  const block =
    `\n${indent}diagrams: [\n` +
    `${indent}  {\n` +
    `${indent}    type: 'custom',\n` +
    `${indent}    svg: ${p.id}_FIGURE,\n` +
    `${indent}    viewBox: '0 0 ${w} ${h}',\n` +
    `${indent}    caption:\n` +
    `${indent}      '${p.caption}',\n` +
    `${indent}  },\n` +
    `${indent}],`;

  src = src.slice(0, lineEnd) + block + src.slice(lineEnd);
  added++;
}

console.log(`${newConsts.length} new constant(s), ${added}/${SOLUTION_PLACEMENT.length} solution(s) wired${DRY ? ' (dry run)' : ''}`);
if (problems.length) {
  console.log('\n' + problems.map((x) => `  x ${x}`).join('\n'));
  process.exit(1);
}
if (!DRY) {
  writeFileSync(FILE, src, 'utf8');
  console.log(`wrote ${FILE}`);
}
