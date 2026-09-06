/** Itay, 2026-09-06, on a quotient investigation solved by rewriting the
 *  quotient as a sum of powers and classifying with the second derivative:
 *  "בשאלות כאלה הייתי רוצה שבתשובות יהיה את הדרך של חקירת מנה, ולא בדרך פתרון
 *  הזאת שתלמידים בקושי פותרים ככה."
 *
 *  Two departures from the way a bagrut answer is written:
 *   1. the quotient is flattened before differentiating (x - 4 + 36x^{-1}),
 *      instead of נגזרת מנה;
 *   2. an extremum is classified by f'' instead of by a sign table.        */
import { getLesson } from '../content/lessons';
import type { PracticeQuestion } from '../content/lessons/types';

const ST = ['rq-domain', 'rq-intersections', 'rq-asymptotes', 'rq-derivative', 'rq-sketch', 'rq-transformations', 'rq-integral', 'rq-bagrut-mixed'];
const L = getLesson('math5', 'פונקציות');
if (!L) throw new Error('no lesson');

/** The question really is about a quotient (x downstairs). */
const isQuotient = (s: string) => /\\d?frac\s*\{[^}]*\}\s*\{[^}]*x[^}]*\}/.test(s);
/** The solution flattened it instead of using the quotient rule. */
const FLATTENED = /מפשטים לפני גזירה|מפרקים את השבר|רושמים כסכום|רושמים כחזקה|x\^\{-1\}|x\^\{-2\}|\bx\^-1\b/;
const QUOTIENT_RULE = /כלל\s+\S*מנה|נגזרת\s+(?:של\s+)?\S*מנה|u'v ?- ?uv'/;
/** Classified by the second derivative rather than by a sign table. */
const SECOND_DERIV = /נגזרת שנייה|הנגזרת השנייה|f''|f\s*''/;
const SIGN_TABLE = /טבלת\s+\S*סימנים|\|\s*f'\(x\)\s*\|/;
/** …and the solution actually classifies an extremum. */
const CLASSIFIES = /מקסימום|מינימום|סוג הקיצון|וסווג|קבעו את סוג/;

type Row = { id: string; stage: string; why: string };
const rows: Row[] = [];
let quotientSolutions = 0;

for (const stage of ST) {
  const st = (L.subTopics ?? []).find((s) => s.id === stage);
  if (!st) continue;
  for (const q of (st.questions ?? []) as PracticeQuestion[]) {
    const steps = (q.solution?.steps ?? []).join('\n');
    if (!steps) continue;
    const quotient = isQuotient(q.question ?? '') || isQuotient(steps);
    if (quotient) quotientSolutions++;
    // Writing 1/x^2 as x^{-2} is the RIGHT move before integrating — flag it
    // only when the solution then differentiates.
    const differentiates = /גוזרים|נגזרת|f'\(x\)/.test(steps);
    if (quotient && differentiates && FLATTENED.test(steps) && !QUOTIENT_RULE.test(steps)) rows.push({ id: q.id, stage, why: 'flattened-instead-of-quotient-rule' });
    if (CLASSIFIES.test(steps) && SECOND_DERIV.test(steps) && !SIGN_TABLE.test(steps)) rows.push({ id: q.id, stage, why: 'classified-by-second-derivative' });
  }
}

const by = new Map<string, number>();
for (const r of rows) by.set(r.why, (by.get(r.why) ?? 0) + 1);
console.log(`${quotientSolutions} solutions on a quotient · ${rows.length} finding(s)`);
for (const [k, v] of [...by].sort((a, b) => b[1] - a[1])) console.log(`   ${k.padEnd(36)} ${v}`);
if (process.argv.includes('--ids')) {
  console.log('');
  for (const r of rows) console.log(`   ${r.stage.padEnd(20)} ${r.id.padEnd(20)} ${r.why}`);
}
