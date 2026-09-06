/**
 * _fix-trig-inline-figs.ts — move a lesson example's figure out of `problem`.
 *
 *   npx tsx scripts/_fix-trig-inline-figs.ts [--write]
 *
 * WHY. `example.problem` is the COLLAPSED BUTTON of WorkedExampleCard
 * (components/practice/WorkedExampleCard.tsx:44), rendered with <MathText
 * inline>, and MathText only splits fences when inline === false. So a ```geo
 * fence there does not draw — it prints as raw JSON on the student's screen.
 * Ten trigonometry figures have been shipping that way. I did the same thing to
 * four geometry figures before the verify-content rule existed to catch it.
 *
 * The fix is the shape geometry already uses: rule, then draw, then solve —
 * the figure becomes steps[1], introduced by "נסרטט לפי הנתונים:".
 *
 * Line surgery rather than String.replace on purpose: these figures are
 * template interpolations of FIG_* constants, and a replacement string
 * containing `$` is re-interpreted by replace() — which has silently pasted a
 * whole file into itself on this repo before.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const WRITE = process.argv.includes('--write');
const FILES = [
  'content/lessons/math5/trigonometry-plane-basics.ts',
  'content/lessons/math5/trigonometry-right-triangle.ts',
];

const FIG_LINE = /^\$\{(FIG_\w+)\}`,$/;
let moved = 0;
let failed = 0;
let skipped = 0;

for (const file of FILES) {
  const raw = readFileSync(file, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const lines = raw.split(eol);
  const out: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    // SHAPE B — the fence is written inline inside a single-quoted string,
    // escaped, all on one line, with `problem:` alone on the line above.
    // trigonometry-plane-basics.ts uses this; the FIG_* constant shape below is
    // used by trigonometry-right-triangle.ts. Both render the same and both
    // break the same way, so both are handled rather than only the one I
    // happened to look at first.
    const prev = out.length ? out[out.length - 1].trim() : '';
    if (lines[i].includes('```geo') && (prev === 'problem:' || lines[i].includes('problem:'))) {
      const sep = '\\n\\n```geo';
      const at = lines[i].indexOf(sep);
      if (at < 0) {
        console.log(`  ❌ ${file}:${i + 1} — fence in problem but no \\n\\n separator before it`);
        failed++; out.push(lines[i]); continue;
      }
      const head = lines[i].slice(0, at);
      const fence = lines[i].slice(at + 4); // drop the two escaped newlines
      if (!fence.endsWith("',")) {
        console.log(`  ❌ ${file}:${i + 1} — fence does not close its string cleanly`);
        failed++; out.push(lines[i]); continue;
      }
      let s = i + 1;
      while (s < lines.length && !/^\s*steps: \[$/.test(lines[s])) s++;
      if (s >= lines.length || !/\*\*הכלל:\*\*/.test(lines[s + 1] ?? '')) {
        console.log(`  ❌ ${file}:${i + 1} — steps[0] is not a **הכלל:** line`);
        failed++; out.push(lines[i]); continue;
      }
      out.push(head + "',");
      for (let t = i + 1; t <= s + 1; t++) out.push(lines[t]);
      out.push("          'נסרטט לפי הנתונים:\\n\\n" + fence);
      i = s + 1;
      moved++;
      console.log(`  ✅ ${file}:${i + 1} — inline fence moved to steps[1]`);
      continue;
    }

    const m = FIG_LINE.exec(lines[i]);
    if (!m) { out.push(lines[i]); continue; }
    const fig = m[1];

    // Walk back over the blank separator to the last line of the problem text,
    // and confirm we are really closing a `problem:` literal — not some other
    // template that happens to end with a figure.
    let j = out.length - 1;
    while (j >= 0 && out[j].trim() === '') j--;
    let k = j;
    while (k >= 0 && !out[k].includes('problem: `')) {
      if (out[k].includes('steps: [')) break; // walked out of the block
      k--;
    }
    if (k < 0 || !out[k].includes('problem: `')) {
      // Not a failure: `question:` renders with a BLOCK <MathText>, so a figure
      // there already draws correctly and must be left alone. Only `problem`
      // reaches the inline renderer. Printed rather than silent, so the count
      // of untouched figures stays visible.
      const owner = k >= 0 && /(\w+): `$/.exec(out[k] ?? '')?.[1];
      skipped++;
      console.log(`  ·  ${file}:${i + 1} ${fig} — left alone (in \`${owner ?? 'non-problem'}\`, renders block)`);
      out.push(lines[i]);
      continue;
    }

    // Close the problem literal on its last text line, dropping the blank(s).
    out.length = j + 1;
    out[j] = out[j] + '`,';

    // The next `steps: [` and the element after it: insert the figure at [1].
    let s = i + 1;
    while (s < lines.length && !/^\s*steps: \[$/.test(lines[s])) s++;
    if (s >= lines.length || !/\*\*הכלל:\*\*/.test(lines[s + 1] ?? '')) {
      console.log(`  ❌ ${file}:${i + 1} ${fig} — steps[0] is not a **הכלל:** line`);
      failed++; out.push(lines[i]); continue;
    }
    for (let t = i + 1; t <= s + 1; t++) out.push(lines[t]);
    out.push('          `נסרטט לפי הנתונים:' + eol + eol + '${' + fig + '}`,');
    i = s + 1;
    moved++;
    console.log(`  ✅ ${file} — ${fig} moved to steps[1]`);
  }

  if (WRITE && !failed) writeFileSync(file, out.join(eol), 'utf8');
}

console.log(
  `\n${moved} figure(s) moved, ${skipped} left alone (already rendering), ` +
    `${failed} failure(s)${WRITE ? '' : '  (dry run — pass --write)'}`,
);
if (failed) process.exit(1);
