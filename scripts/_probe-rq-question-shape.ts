/** Itay, 2026-09-06, on a multi-part question rendered as one paragraph:
 *  "תראה איך השאלה עצמה דחוסה ומסורבלת במקום להיות מסודרת ויפה לעיין."
 *
 *  Two shapes make a stem hard to read:
 *   1. parts (א. ב. ג.) run together inside one line instead of one per line;
 *   2. a stem that is simply very long with no break anywhere.
 *  And one more thing the student sees: answerLabels are echoed back as the
 *  typed answer, so a long label becomes a long cramped sentence in the box. */
import { getLesson } from '../content/lessons';
import type { PracticeQuestion } from '../content/lessons/types';

const ST = ['rq-domain', 'rq-intersections', 'rq-asymptotes', 'rq-derivative', 'rq-sketch', 'rq-transformations', 'rq-integral', 'rq-bagrut-mixed'];
const L = getLesson('math5', 'פונקציות');
if (!L) throw new Error('no lesson');

const PART = /(?:^|\s)([אבגדה])\.\s/g;
type Row = { id: string; why: string; detail: string };
const rows: Row[] = [];
let total = 0;

for (const id of ST) {
  const st = (L.subTopics ?? []).find((s) => s.id === id);
  if (!st) continue;
  for (const q of (st.questions ?? []) as PracticeQuestion[]) {
    total++;
    const stem = q.question ?? '';
    const parts = [...stem.matchAll(PART)].map((m) => m[1]);
    const perLine = stem.split('\n').length;
    if (parts.length >= 2 && perLine < parts.length) {
      rows.push({ id: q.id, why: 'parts-on-one-line', detail: `${parts.join(', ')} in ${perLine} line(s)` });
    } else if (parts.length < 2 && stem.replace(/\$[^$]*\$/g, '').length > 220 && perLine === 1) {
      rows.push({ id: q.id, why: 'one-long-line', detail: `${stem.length} chars, no break` });
    }
    for (const [i, lab] of (q.answerLabels ?? []).entries()) {
      if (lab.replace(/\$[^$]*\$/g, '').length > 28) rows.push({ id: q.id, why: 'long-answer-label', detail: `[${i}] ${lab.slice(0, 60)}` });
    }
  }
}

const by = new Map<string, number>();
for (const r of rows) by.set(r.why, (by.get(r.why) ?? 0) + 1);
console.log(`${total} questions · ${rows.length} finding(s)`);
for (const [k, v] of [...by].sort((a, b) => b[1] - a[1])) console.log(`   ${k.padEnd(20)} ${v}`);
if (process.argv.includes('--ids')) {
  console.log('');
  for (const r of rows) console.log(`   ${r.id.padEnd(20)} ${r.why.padEnd(20)} ${r.detail}`);
}
