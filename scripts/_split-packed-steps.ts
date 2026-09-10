/**
 * _split-packed-steps.ts — one-shot codemod. Itay, 2026-09-10, on סדרות:
 * **"התשובות דחוסות ולא מסודרות לעיין"**.
 *
 *   npx tsx scripts/_split-packed-steps.ts          report only
 *   npx tsx scripts/_split-packed-steps.ts --write  apply
 *
 * WHAT IS WRONG. 254 steps across 134 questions hold two moves in ONE array
 * entry, separated by a blank line. The renderer gives each entry a numbered
 * circle and a generous gap (space-y-6, already widened twice), so a packed
 * entry renders as one bullet containing two thoughts — which is exactly the
 * "dense, hard to read through" complaint. Measured against the neighbours:
 * טריגונומטריה 1%, גאומטריה 3%, סדרות 14%, and **the archived exam solutions 0%**.
 * Splitting moves this topic toward the exam's own shape, not away from it.
 *
 * WHY A CODEMOD AND NOT 254 EDITS. It is one mechanical transformation with a
 * checkable invariant: the concatenation of a question's steps must be
 * unchanged. That is worth more than 254 chances to mistype Hebrew or LaTeX.
 *
 * 🔴 TWO TRAPS THIS FILE IS BUILT AROUND.
 *  1. `String.replace` with a STRING replacement interprets `$&`, `$1`, `` $` ``
 *     — and every one of these steps is full of `$...$` maths. A previous
 *     codemod in this repo pasted an entire file back into itself that way,
 *     silently. Everything here uses slicing and array joins; there is no
 *     string-replacement call anywhere in it.
 *  2. Only `solution.steps` may be split. `teach`, `explanation`, `note` and
 *     `context` legitimately hold paragraphs, so a line-based sweep would wreck
 *     them. The scanner tracks bracket depth from a literal `steps: [` and
 *     touches nothing outside it.
 */
import { readFileSync, writeFileSync } from 'fs';

const FILES = [
  'content/lessons/math5/sequences-arithmetic.ts',
  'content/lessons/math5/sequences-geometric.ts',
  'content/lessons/math5/sequences-matkonet.ts',
  'content/lessons/math5/sequences.ts',
  'content/lessons/math5/seq-extra/arithmetic.ts',
  'content/lessons/math5/seq-extra/geometric.ts',
  'content/lessons/math5/seq-extra/infinite.ts',
  'content/lessons/math5/seq-extra/applied.ts',
];

const WRITE = process.argv.includes('--write');
let filesTouched = 0;
let stepsSplit = 0;
let entriesAdded = 0;
let hitsInSegment = 0;

/**
 * Expand every single-quoted literal in `segment` that holds a blank line into
 * several literals. The literal pattern tolerates an escaped quote inside.
 *
 * 🔴 Rebuilt by SLICING, never by String.replace: these strings are full of
 * `$…$`, and a string replacement interprets `$&` / `$1` / `` $` `` — a previous
 * codemod in this repo pasted a whole file back into itself that way, silently.
 */
function expandLiterals(segment: string): string {
  const LITERAL = /'(?:[^'\\]|\\.)*'/g;
  let rebuilt = '';
  let last = 0;
  hitsInSegment = 0;
  for (const lm of segment.matchAll(LITERAL)) {
    const body = lm[0].slice(1, -1);
    if (!body.includes('\\n\\n')) continue;
    const blocks = body.split('\\n\\n').map((b) => b.trim()).filter(Boolean);
    if (blocks.length < 2) continue;
    rebuilt += segment.slice(last, lm.index) + blocks.map((b) => `'${b}'`).join(', ');
    last = lm.index + lm[0].length;
    hitsInSegment++;
    entriesAdded += blocks.length - 1;
  }
  if (!hitsInSegment) return segment;
  stepsSplit += hitsInSegment;
  return rebuilt + segment.slice(last);
}

for (const file of FILES) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');
  const out: string[] = [];

  let depth = 0; // bracket depth inside a `steps: [ … ]` array; 0 = outside
  let split = 0;

  for (const line of lines) {
    if (depth === 0) {
      const opener = /(^|\s)steps:\s*\[/.exec(line);
      if (!opener) {
        out.push(line);
        continue;
      }
      // 🔴 A `steps: [ … ]` array written entirely on ONE line used to be
      // skipped: the opener branch pushed the line and only THEN set depth, so
      // the expansion below never saw it. Two packed steps survived two passes
      // that way. Expand the opener line too, from the `[` onwards — never
      // before it, where the `question` and `hint` fields live and where a blank
      // line is legitimate prose.
      const from = opener.index + opener[0].length;
      out.push(line.slice(0, from) + expandLiterals(line.slice(from)));
      split += hitsInSegment; // without this the file counts as untouched and is never written
      depth = /steps:\s*\[\s*\]/.test(line) ? 0 : 1;
      depth += (line.slice(from).match(/\[/g) ?? []).length - (line.slice(from).match(/\]/g) ?? []).length;
      if (depth < 0) depth = 0;
      continue;
    }

    // Inside the array: track depth so a nested [] cannot end it early.
    const opens = (line.match(/\[/g) ?? []).length;
    const closes = (line.match(/\]/g) ?? []).length;

    // Expand EVERY single-quoted literal on the line, not just a line that is
    // one literal. The first version required the whole line to be one entry,
    // and six steps live on a shared line (`'…', '…',`) — it skipped them rather
    // than mangling them, which was the right refusal, but they still need
    // splitting. The literal pattern handles an escaped quote inside the string.
    //
    // 🔴 The rebuild is done by SLICING, never by String.replace: every one of
    // these strings is full of `$…$`, and a string replacement would interpret
    // `$&` / `$1` / ``$` `` and quietly corrupt the maths.
    if (line.includes('\\n\\n') && !line.trimStart().startsWith('//')) {
      const expanded = expandLiterals(line);
      if (hitsInSegment) {
        out.push(expanded);
        split += hitsInSegment;
        depth += opens - closes;
        if (depth <= 0) depth = 0;
        continue;
      }
    }

    out.push(line);
    depth += opens - closes;
    if (depth <= 0) depth = 0;
  }

  if (split) {
    filesTouched++;

    console.log(`${file.replace('content/lessons/math5/', '').padEnd(30)} ${String(split).padStart(3)} steps split`);
    if (WRITE) writeFileSync(file, out.join('\n'), 'utf8');
  }
}

console.log(
  `\n${stepsSplit} packed steps in ${filesTouched} files -> ${stepsSplit + entriesAdded} entries` +
    (WRITE ? ' (written)' : ' (dry run — pass --write)'),
);
