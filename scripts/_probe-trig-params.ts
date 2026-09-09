/**
 * _probe-trig-params.ts — how much of טריגונומטריה actually trains on
 * PARAMETERS rather than numbers?
 *
 *   npx tsx scripts/_probe-trig-params.ts [--stage <id>]
 *
 * Itay said this four separate times in one document, and then said he would
 * not say it again:
 *
 *   "מבחינתי שרק הרמת חימום תהיה עם מספרים וכל שאר הרמות יהיו עם פרמטרים.
 *    אני חייב לאמן אותם על זה, זה הדבר העיקרי שמשתמשים בו בבגרות. ואני אומר
 *    את זה לכל שלב — שבכל שלב יהיו פרמטרים."
 *   "כל הבגרות זה בכלל הבעות ולא חישובים."
 *   "בכל שלב אני רוצה שישולבו עבודה עם פרמטרים, זה לא שווה כלום בלעדי זה."
 *
 * So the target is a RULE, not a nice-to-have:
 *   חימום  → numbers are fine (he wants the warm-up to stay easy)
 *   ביסוס  → parametric
 *   אתגר   → parametric
 *
 * WHAT COUNTS AS PARAMETRIC. Not "the text contains a letter" — `$x$` is the
 * unknown of an equation, and solving for x is a CALCULATION, exactly what he
 * says the exam is not about. It is parametric when a quantity is given as a
 * symbol and the ANSWER is an expression in that symbol, i.e. the student
 * never learns its numeric value. Two shapes qualify:
 *   · a given stated symbolically   ("$AB = 2a$", "אורך הצלע הוא $a$")
 *   · an ask that demands an expression ("הבע באמצעות", "בטא באמצעות")
 * and `expected: {kind:'manual'}` with a symbolic final answer corroborates it.
 */
import { getBagrutQuestionsForSubTopic, getSubTopic } from '../content/lessons';
import type { PracticeQuestion } from '../content/lessons/types';

const SUBJECT = 'math5';
const TOPIC = 'טריגונומטריה';
// `indexOf` returns -1 when the flag is absent, and argv[0] is the node binary,
// so the naive form silently focuses on "C:\Program Files\nodejs\node.exe".
const FOCUS = process.argv.includes('--stage')
  ? (process.argv[process.argv.indexOf('--stage') + 1] ?? '')
  : '';

const STAGES = [
  'trig-right-triangle',
  'trig-identities',
  'trig-equations',
  'trig-sine-cosine-laws',
  'trig-triangle-area',
  'trig-plane-mixed',
];

/** An ask that can only be answered with an expression. */
const EXPRESSION_ASK =
  /הבע(?:ו)?\s+(?:את\s+)?[^.]{0,40}באמצעות|בטא(?:ו)?\s+(?:את\s+)?[^.]{0,40}באמצעות|באמצעות \$?[a-z]\$?|עבור אילו ערכים/;

/** A given handed over as a symbol rather than a number. `x` is excluded on
 *  purpose: it is the unknown of an equation, and solving for it is the
 *  calculation Itay is contrasting parameters WITH. */
const SYMBOLIC_GIVEN =
  /=\s*\\?d?frac?\{?\s*\d*\s*[abkmnpqrt]\b|=\s*\d*[abkmnpqrt]\b|\$[abkmnpqrt]\s*>\s*0\$|אורך[^.]{0,24}\$[abkmnpqrt]\$|הוא \$\d*[abkmnpqrt]\$/;

export function isParametric(q: { question: string; solution?: { finalAnswer?: string } }): boolean {
  const t = q.question;
  if (EXPRESSION_ASK.test(t)) return true;
  if (SYMBOLIC_GIVEN.test(t)) return true;
  return false;
}

const RUNGS = ['easy', 'mid', 'hard'] as const;
const HEB: Record<string, string> = { easy: 'חימום', mid: 'ביסוס', hard: 'אתגר' };

let needParam = 0;
let haveParam = 0;
const gaps: string[] = [];

console.log('טריגונומטריה — כמה מהתרגול הוא בפרמטרים\n' + '='.repeat(76));
console.log(
  'stage'.padEnd(24) + RUNGS.map((r) => HEB[r].padEnd(16)).join('') + 'בגרות',
);
console.log('-'.repeat(76));

for (const id of STAGES) {
  const st = getSubTopic(SUBJECT, TOPIC, id);
  if (!st) {
    console.log(id.padEnd(24) + '  (missing)');
    continue;
  }
  const cells: string[] = [];
  for (const r of RUNGS) {
    const qs = (st.questions ?? []).filter((q) => q.difficulty === r);
    const p = qs.filter(isParametric);
    cells.push(`${p.length}/${qs.length}`.padEnd(16));
    if (r !== 'easy') {
      needParam += qs.length;
      haveParam += p.length;
      for (const q of qs) {
        if (!isParametric(q)) gaps.push(`${id.padEnd(24)} ${HEB[r]}  ${q.id}`);
      }
    }
  }
  const bag = getBagrutQuestionsForSubTopic(SUBJECT, TOPIC, id);
  const bagP = bag.filter((b) =>
    isParametric({ question: b.context + ' ' + b.parts.map((p) => p.prompt).join(' ') } as PracticeQuestion),
  );
  console.log(id.padEnd(24) + cells.join('') + `${bagP.length}/${bag.length}`);
}

console.log('-'.repeat(76));
const pct = needParam ? Math.round((haveParam / needParam) * 100) : 0;
console.log(
  `\nביסוס + אתגר: ${haveParam} מתוך ${needParam} שאלות הן בפרמטרים  (${pct}%)`,
);
console.log(`היעד של איתי: 100% — "רק הרמת חימום תהיה עם מספרים"\n`);

if (FOCUS) {
  console.log(`שאלות שעדיין במספרים ב-${FOCUS}:`);
  for (const g of gaps.filter((x) => x.startsWith(FOCUS))) console.log('  ' + g);
} else {
  console.log(`${gaps.length} שאלות ביסוס/אתגר עדיין במספרים בלבד.`);
  console.log('הרץ עם --stage <id> כדי לראות את הרשימה לשלב מסוים.');
}
