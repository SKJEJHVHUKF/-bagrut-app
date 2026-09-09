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
import { EXPRESS_IN_TERMS_OF } from './verify-trig-ladder';
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

/** An ask that can only be answered with an expression — the SAME pattern the
 *  ladder gate uses, imported rather than copied. Three private copies of this
 *  had drifted apart and none of them matched `הביעו`, the verb the real exam
 *  papers use 66 times. */
const EXPRESSION_ASK = EXPRESS_IN_TERMS_OF;

/** A given handed over as a symbol rather than a number. `x` is excluded on
 *  purpose: it is the unknown of an equation, and solving for it is the
 *  calculation Itay is contrasting parameters WITH. */
const SYMBOLIC_GIVEN =
  /=\s*\\?d?frac?\{?\s*\d*\s*[abkmnpqrt]\b|=\s*\d*[abkmnpqrt]\b|\$[abkmnpqrt]\s*>\s*0\$|אורך[^.]{0,24}\$[abkmnpqrt]\$|הוא \$\d*[abkmnpqrt]\$/;

/** The parameter surviving INTO the answer. */
const SYMBOLIC_ANSWER = /[abkmnpqrt](?![a-z])/;

/**
 * The symbol the question ITSELF names after "באמצעות".
 *
 * 🔴 `x` is excluded from SYMBOLIC_ANSWER on purpose — it is normally the
 * unknown of an equation. But `בטא באמצעות $x$ את אורך הצלע $BC$` names `x` as
 * the thing to express IN, which makes it the parameter of that question and
 * nothing else. Judging it by the default letter class marked two real הבעה
 * questions as numeric. When the ask names its symbol, believe the ask.
 */
function askedSymbols(t: string): string[] {
  const out = new Set<string>();
  for (const m of t.matchAll(/באמצעות\s+\$([^$]+)\$/g)) {
    for (const ch of m[1].replace(/\\[a-zA-Z]+/g, '').match(/[a-z]/g) ?? []) out.add(ch);
  }
  return [...out];
}

/**
 * Did the parameter actually DO anything?
 *
 * 🔴 The anti-gaming guard used to sit inside the `SYMBOLIC_GIVEN` branch only,
 * so a question phrased `הבע באמצעות $a$ …` whose parameter cancels on the
 * first line counted as parametric. An author hit exactly that twice while
 * writing and rewrote both on judgement, because nothing flagged them — which
 * means the metric could have been satisfied without teaching one הבעה.
 *
 * Requiring the parameter in the FINAL ANSWER would be wrong in the other
 * direction: the classic exam shape expresses in `a` and then RECOVERS `a`, so
 * its final answer is legitimately a number. The honest test is whether
 * symbolic work happened at all — the parameter has to survive through more
 * than one step of the solution.
 */
function parameterDoesWork(q: {
  question: string;
  solution?: { finalAnswer?: string; steps?: string[] };
}): boolean {
  const steps = q.solution?.steps ?? [];
  if (!steps.length) return true; // nothing to judge on; do not penalise
  const named = askedSymbols(q.question);
  const symbol = named.length ? new RegExp(`[${named.join('')}](?![a-z])`) : SYMBOLIC_ANSWER;
  const carries = steps.filter((s) => {
    const math = (s.match(/\$[^$]+\$/g) ?? []).join(' ').replace(/\\[a-zA-Z]+/g, '');
    return symbol.test(math);
  }).length;
  return carries >= 2;
}

export function isParametric(q: {
  question: string;
  solution?: { finalAnswer?: string; steps?: string[] };
}): boolean {
  const t = q.question;
  if (!EXPRESSION_ASK.test(t) && !SYMBOLIC_GIVEN.test(t)) return false;
  return parameterDoesWork(q);
}

const RUNGS = ['easy', 'mid', 'hard'] as const;
const HEB: Record<string, string> = { easy: 'חימום', mid: 'ביסוס', hard: 'אתגר' };

let needParam = 0;
let haveParam = 0;
const gaps: string[] = [];
const shortfalls: string[] = [];

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
    // 🔴 The targets, settled by Itay on 2026-09-09 after I read his first
    // wording two different wrong ways:
    //   "אין בעיה שרמות חימום יהיו עם מספרים בלי פרמטרים בכלל, אבל שרמת ביסוס
    //    תתחיל לשלב ברוב השאלות שלה פרמטרים, ורמת אתגר עוד יותר — אני רוצה
    //    שמעל 80 אחוז שם יכיל שאלות עם פרמטרים."
    // So חימום is EXEMPT, and the two rungs above it carry DIFFERENT bars.
    if (r !== 'easy') {
      const target = r === 'hard' ? 0.8 : 0.6;
      const share = qs.length ? p.length / qs.length : 1;
      needParam += qs.length;
      haveParam += p.length;
      if (share < target) {
        shortfalls.push(
          `${id.padEnd(24)} ${HEB[r]}  ${p.length}/${qs.length} = ${Math.round(share * 100)}%` +
            `  (יעד ${Math.round(target * 100)}%)`,
        );
      }
      for (const q of qs.filter((x) => !isParametric(x))) {
        gaps.push(`${id.padEnd(24)} ${HEB[r]}  ${q.id}`);
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
console.log(`\nביסוס + אתגר: ${haveParam} מתוך ${needParam} בפרמטרים  (${pct}%)`);
console.log('היעד: חימום פטור · ביסוס לפחות 60% · אתגר מעל 80% · בגרות 100%\n');
if (shortfalls.length) {
  console.log('רונגים מתחת ליעד:');
  for (const sf of shortfalls) console.log('  ✗ ' + sf);
  console.log('');
} else {
  console.log('✅ כל רונג עומד ביעד שלו.\n');
}

if (FOCUS) {
  console.log(`שאלות שעדיין במספרים ב-${FOCUS}:`);
  for (const g of gaps.filter((x) => x.startsWith(FOCUS))) console.log('  ' + g);
} else {
  console.log(`${gaps.length} שאלות ביסוס/אתגר עדיין במספרים בלבד.`);
  console.log('הרץ עם --stage <id> כדי לראות את הרשימה לשלב מסוים.');
}
