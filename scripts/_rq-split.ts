/** Split functions-root-quotient.ts into one fragment per stage so several
 *  authors can work at once, then put it back byte-for-byte.
 *
 *    npx tsx scripts/_rq-split.ts split <outDir>
 *    npx tsx scripts/_rq-split.ts join  <outDir>
 *
 *  A stage fragment runs from its `  {\n    id: '<stage>',` line to the line
 *  before the next stage's, so an author edits only their own questions and no
 *  two agents ever hold the same file. `join` refuses if a fragment is missing
 *  or if the head/tail no longer match what was split. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join as pjoin } from 'path';

const SRC = 'content/lessons/math5/functions-root-quotient.ts';
const STAGES = ['rq-domain', 'rq-intersections', 'rq-asymptotes', 'rq-derivative', 'rq-sketch', 'rq-transformations', 'rq-integral', 'rq-bagrut-mixed'];

function bounds(text: string) {
  const lines = text.split('\n');
  const starts = new Map<string, number>();
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s{4}id: '(rq-[a-z-]+)',\s*$/);
    if (m && STAGES.includes(m[1]) && /^\s{2}\{\s*$/.test(lines[i - 1] ?? '')) starts.set(m[1], i - 1);
  }
  const missing = STAGES.filter((s) => !starts.has(s));
  if (missing.length) throw new Error(`stage object not found for: ${missing.join(', ')}`);
  const ordered = STAGES.map((s) => [s, starts.get(s) as number] as const).sort((a, b) => a[1] - b[1]);
  const out: { stage: string; from: number; to: number }[] = [];
  for (let i = 0; i < ordered.length; i++) {
    const from = ordered[i][1];
    const to = i + 1 < ordered.length ? ordered[i + 1][1] : -1;
    out.push({ stage: ordered[i][0], from, to });
  }
  return { lines, spans: out };
}

const [mode, dir] = process.argv.slice(2);
if (!dir || (mode !== 'split' && mode !== 'join')) {
  console.error('usage: npx tsx scripts/_rq-split.ts <split|join> <dir>');
  process.exit(2);
}

if (mode === 'split') {
  const text = readFileSync(SRC, 'utf8');
  const { lines, spans } = bounds(text);
  mkdirSync(dir, { recursive: true });
  const last = spans[spans.length - 1];
  // The tail starts where the last stage's questions end: the line closing the
  // sub-topics array. Find it from the last stage's start.
  let tailAt = lines.length;
  for (let i = last.from; i < lines.length; i++) {
    if (/^\];\s*$/.test(lines[i])) { tailAt = i; break; }
  }
  writeFileSync(pjoin(dir, '_head.txt'), lines.slice(0, spans[0].from).join('\n'), 'utf8');
  for (const s of spans) {
    const to = s.to === -1 ? tailAt : s.to;
    writeFileSync(pjoin(dir, `${s.stage}.txt`), lines.slice(s.from, to).join('\n'), 'utf8');
  }
  writeFileSync(pjoin(dir, '_tail.txt'), lines.slice(tailAt).join('\n'), 'utf8');
  console.log(`split into ${spans.length} stage fragment(s) + head/tail under ${dir}`);
  for (const s of spans) console.log(`   ${s.stage.padEnd(20)} lines ${s.from + 1}–${(s.to === -1 ? tailAt : s.to)}`);
} else {
  const need = ['_head.txt', ...STAGES.map((s) => `${s}.txt`), '_tail.txt'];
  for (const f of need) if (!existsSync(pjoin(dir, f))) throw new Error(`missing fragment: ${f}`);
  const text = readFileSync(SRC, 'utf8');
  const { spans } = bounds(text);
  const order = spans.map((s) => s.stage);
  const body = [readFileSync(pjoin(dir, '_head.txt'), 'utf8'), ...order.map((s) => readFileSync(pjoin(dir, `${s}.txt`), 'utf8')), readFileSync(pjoin(dir, '_tail.txt'), 'utf8')];
  writeFileSync(SRC, body.join('\n'), 'utf8');
  console.log(`joined ${order.length} fragment(s) back into ${SRC}`);
}
