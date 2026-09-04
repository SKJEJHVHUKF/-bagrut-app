/**
 * generator/templates/functions.ts — parameterised repair questions for פונקציות
 * (the מנה ושורש track, sub-topics `rq-*`).
 *
 * Same contract as sequences.ts: `**הכלל:**` opens every solution and never
 * contains the answer, no Hebrew inside `$…$`, no maqaf before a math island,
 * every distractor is a NAMED mistake with a note, and `build` is pure in
 * (rng, difficulty) so the id alone rebuilds the question.
 *
 * `rq-bagrut-mixed` has no template on purpose: it is the multi-part bagrut
 * rehearsal and a single-answer item would not be that.
 */

import { Frac, type Rng } from '../rng';
import { mcq, open } from './shared';
import type { GenTemplate } from '../types';

const TOPIC = 'פונקציות';
const SUBJECT = 'math5';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** `ax + b` as LaTeX: `x`, `-x`, `3x - 5`, `2x`, `-4x + 1`. */
function lin(a: number, b: number): string {
  const ax = a === 1 ? 'x' : a === -1 ? '-x' : `${a}x`;
  if (b === 0) return ax;
  return b > 0 ? `${ax} + ${b}` : `${ax} - ${-b}`;
}

/** `(x - p)` with the sign folded in: p = -3 → `(x + 3)`. */
const factor = (p: number) => `(${lin(1, -p)})`;

/** Non-zero integer in [lo, hi] with `avoid` excluded. */
function pickInt(rng: Rng, lo: number, hi: number, avoid: number[] = []): number {
  for (let i = 0; i < 25; i++) {
    const v = rng.int(lo, hi);
    if (v !== 0 && !avoid.includes(v)) return v;
  }
  return 0;
}

/** A point `(x, 0)` / `(0, y)` as LaTeX. */
const pt = (x: number, y: number) => `(${x}, ${y})`;

// ---------------------------------------------------------------------------
// 1 · rq-domain — where a quotient / a root is defined
// ---------------------------------------------------------------------------

const domQuotient: GenTemplate = {
  id: 'fn-dom-quotient',
  distractorTags: [null, 'sign-slip', 'formula-mismatch', 'condition-ignored'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'rq-domain',
  title: 'תחום הגדרה של פונקציית מנה',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const r = pickInt(rng, -9, 9);
    const c = difficulty === 'hard' ? rng.int(2, 3) : 1;
    const denom = lin(c, -c * r); // cx - cr, root at r

    // Numerator: a constant on easy, a linear factor with its own root otherwise.
    const k = pickInt(rng, 2, 9, [r, -r]);
    const s = pickInt(rng, -9, 9, [r, -r]);
    const numer = difficulty === 'easy' ? String(k) : lin(1, -s);
    const numerRoot = difficulty === 'easy' ? k : s;

    const answers = [`$x \\ne ${r}$`, `$x \\ne ${-r}$`, `$x \\ne ${numerRoot}$`, `$x > ${r}$`];
    return mcq({
      question: `מהו תחום ההגדרה של $f(x) = \\dfrac{${numer}}{${denom}}$?`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        `הסימן נלקח כפי שהוא במקום להיפתר. מהמשוואה $${denom} = 0$ מקבלים $x = ${r}$, והצבת $x = ${-r}$ נותנת מכנה שאינו אפס.`,
        difficulty === 'easy'
          ? `נפסל המונה. המונה הוא המספר $${k}$ ואין בו משתנה כלל, ולכן הוא אינו מגביל דבר.`
          : `נפסל שורש המונה. מונה שמתאפס נותן ערך פונקציה אפס, נקודה חוקית לגמרי; רק המכנה מגביל את התחום.`,
        `הוחמר לאי-שוויון בלי סיבה. מכנה מטיל תנאי של שונה מאפס, לא של גדול מאפס, ולכן נפסלת נקודה בודדת ולא טווח שלם.`,
      ],
      hint: 'מאפסים את המכנה ופוסלים את מה שיוצא. המונה לא משתתף.',
      solution: {
        steps: [
          '**הכלל:** המשתנה יושב במכנה, ולכן התנאי היחיד הוא שהמכנה שונה מאפס, והמונה אינו משתתף בבדיקה.',
          `**הנוסחה:** התנאי הוא $${denom} \\ne 0$.`,
          `פותרים את המשוואה המתאימה: $${denom} = 0$, ומקבלים $x = ${r}$.`,
          'זהו הערך היחיד שיוצא מהתחום.',
        ],
        finalAnswer: `$x \\ne ${r}$`,
        explanation: 'מכנה מטיל תנאי של שונה מאפס, ולכן נפסלת נקודה בודדת ולא טווח.',
      },
    });
  },
};

const domRoot: GenTemplate = {
  id: 'fn-dom-root-edge',
  wrongAnswerTags: ['sign-slip', 'dropped-factor'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'rq-domain',
  title: 'קצה תחום ההגדרה של פונקציית שורש',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const a = rng.int(2, 5);
    const m = difficulty === 'easy' ? rng.int(1, 9) : pickInt(rng, -9, 9);
    const b = -a * m; // ax + b >= 0  ⇔  x >= m
    const inner = lin(a, b);

    return open({
      question: `נתונה הפונקציה $f(x) = \\sqrt{${inner}}$. מהו הערך הקטן ביותר של $x$ שנמצא בתחום ההגדרה שלה?`,
      expected: { kind: 'value', value: String(m) },
      wrongAnswers: [
        {
          value: String(-m),
          note: `הסימן לא הועבר. מהאי-שוויון $${a}x \\ge ${-b}$ מחלקים במספר חיובי ומקבלים $x \\ge ${m}$, והצבת $x = ${-m}$ מתחת לשורש נותנת מספר שלילי.`,
        },
        {
          value: String(-b),
          note: `זה האגף אחרי העברה, לפני החלוקה במקדם של $x$. צריך עוד לחלק את $${-b}$ במקדם $${a}$.`,
        },
      ],
      hint: 'הביטוי מתחת לשורש חייב להיות אי-שלילי. פתור את האי-שוויון ומצא את הקצה.',
      solution: {
        steps: [
          '**הכלל:** המשתנה יושב מתחת לשורש ריבועי, ולכן התנאי הוא שהביטוי מתחת לשורש אי-שלילי, באי-שוויון חלש שהקצה שלו כלול.',
          `**הנוסחה:** התנאי הוא $${inner} \\ge 0$.`,
          `מעבירים אגף: $${a}x \\ge ${-b}$.`,
          `מחלקים במקדם החיובי $${a}$, ולכן הכיוון נשמר: $x \\ge ${m}$.`,
          'הקצה כלול, כי שורש של אפס מוגדר ושווה לאפס.',
        ],
        finalAnswer: `$x = ${m}$`,
        explanation: 'תחום ההגדרה הוא כל הערכים מהקצה ומעלה, והקצה עצמו כלול.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 2 · rq-intersections — the axes
// ---------------------------------------------------------------------------

/** Every non-zero divisor of `n`, both signs. */
function divisors(n: number): number[] {
  const out: number[] = [];
  for (let d = 1; d <= Math.abs(n); d++) if (n % d === 0) out.push(d, -d);
  return out;
}

const intAxes: GenTemplate = {
  id: 'fn-int-axes',
  wrongAnswerTags: ['sign-slip', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'rq-intersections',
  title: 'חיתוך פונקציית מנה עם שני הצירים',
  skill: 'substitution',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const x0 = pickInt(rng, -8, 8);
    const a = difficulty === 'easy' ? 1 : rng.int(2, 4);
    const b = -a * x0; // numerator ax + b, root x0
    // Denominator x + c with c | b so the y-intercept b/c is an integer, and
    // x0 inside the domain.
    const cs = divisors(b).filter((c) => c !== -x0 && (difficulty === 'hard' || c > 0));
    if (!cs.length) return null;
    const c = rng.pick(cs);
    const y0 = b / c;
    if (y0 === x0 || -c === x0) return null;

    return open({
      question: `נתונה הפונקציה $f(x) = \\dfrac{${lin(a, b)}}{${lin(1, c)}}$. מצא את שיעור ה-$x$ של נקודת החיתוך עם ציר ה-$x$ ואת שיעור ה-$y$ של נקודת החיתוך עם ציר ה-$y$.`,
      answerLabels: ['x בחיתוך עם ציר x', 'y בחיתוך עם ציר y'],
      expected: { kind: 'set', values: [String(x0), String(y0)] },
      wrongAnswers: [
        {
          value: String(-x0),
          note: `הסימן לא הועבר. מהמשוואה $${lin(a, b)} = 0$ מקבלים $x = ${x0}$; הצבת $x = ${-x0}$ במונה אינה נותנת אפס.`,
        },
        {
          value: String(-c),
          note: `זה שורש המכנה, כלומר האסימפטוטה האנכית, ולא חיתוך. חיתוך עם ציר ה-$x$ מתקבל מאיפוס המונה בלבד.`,
        },
      ],
      hint: 'חיתוך עם ציר x: מאפסים את המונה. חיתוך עם ציר y: מציבים אפס במקום x.',
      solution: {
        steps: [
          '**הכלל:** חיתוך עם ציר ה-$x$ מתקבל מאיפוס המונה, וחיתוך עם ציר ה-$y$ מהצבת אפס במקום המשתנה, ובשניהם המכנה חייב להישאר שונה מאפס.',
          `**ציר ה-$x$:** $${lin(a, b)} = 0$, ומכאן $x = ${x0}$. המכנה שם שווה $${x0 + c}$, שונה מאפס.`,
          `**ציר ה-$y$:** מציבים $x = 0$ ומקבלים $f(0) = \\dfrac{${b}}{${c}} = ${y0}$.`,
        ],
        finalAnswer: `$${pt(x0, 0)}$, $${pt(0, y0)}$`,
        explanation: 'מונה אפס נותן חיתוך עם ציר x; הצבת אפס נותנת חיתוך עם ציר y.',
      },
    });
  },
};

const intXFactored: GenTemplate = {
  id: 'fn-int-x-factored',
  distractorTags: [null, 'condition-ignored', 'sign-slip', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'rq-intersections',
  title: 'חיתוכים עם ציר x כשהמונה מפורק לגורמים',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const lo = difficulty === 'easy' ? 1 : -7;
    const p = pickInt(rng, lo, 7);
    const q = pickInt(rng, lo, 7, [p, -p]);
    const r = pickInt(rng, -7, 7, [p, q, -p, -q]);
    const [x1, x2] = [p, q].sort((u, v) => u - v);
    const [n1, n2] = [-p, -q].sort((u, v) => u - v);

    const two = `$${pt(x1, 0)}$, $${pt(x2, 0)}$`;
    return mcq({
      question: `מהן נקודות החיתוך של $f(x) = \\dfrac{${factor(p)}${factor(q)}}{${lin(1, -r)}}$ עם ציר ה-$x$?`,
      answers: [two, `$${pt(x1, 0)}$, $${pt(x2, 0)}$, $${pt(r, 0)}$`, `$${pt(n1, 0)}$, $${pt(n2, 0)}$`, `$${pt(r, 0)}$`],
      correct: 0,
      distractorNotes: [
        '',
        `נספר גם שורש המכנה. בערך $x = ${r}$ הפונקציה אינה מוגדרת כלל; שם יש אסימפטוטה אנכית, לא נקודה על הגרף.`,
        `הסימנים של השורשים התהפכו. הגורם $${factor(p)}$ מתאפס כשמציבים $x = ${p}$, לא $x = ${-p}$.`,
        `זה שורש המכנה בלבד. חיתוך עם ציר ה-$x$ מתקבל מאיפוס המונה, והמכנה רק נבדק שאינו אפס שם.`,
      ],
      hint: 'מאפסים כל גורם במונה בנפרד. המכנה רק נבדק שאינו אפס.',
      solution: {
        steps: [
          '**הכלל:** המונה כבר מפורק לגורמים, ולכן חיתוך עם ציר ה-$x$ מתקבל מאיפוס כל גורם בנפרד, ושורש המכנה נפסל כי הפונקציה אינה מוגדרת שם.',
          `$${factor(p)} = 0$ נותן $x = ${p}$, ו-$${factor(q)} = 0$ נותן $x = ${q}$.`,
          `בודקים את המכנה: הוא מתאפס רק כאשר $x = ${r}$, ולכן שני השורשים בתחום ההגדרה.`,
        ],
        finalAnswer: two,
        explanation: 'שורשי המונה הם החיתוכים; שורש המכנה הוא אסימפטוטה.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 3 · rq-asymptotes
// ---------------------------------------------------------------------------

const asyVertical: GenTemplate = {
  id: 'fn-asy-vertical',
  distractorTags: [null, 'formula-mismatch', 'sign-slip', 'values-swapped'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'rq-asymptotes',
  title: 'אסימפטוטה אנכית של פונקציית מנה',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const r = pickInt(rng, -9, 9);
    const s = pickInt(rng, -9, 9, [r, -r]);
    const a = difficulty === 'easy' ? 1 : rng.int(2, 4);
    const numer = lin(a, -a * s); // root s
    const denom = lin(1, -r);

    return mcq({
      question: `מהי האסימפטוטה האנכית של $f(x) = \\dfrac{${numer}}{${denom}}$?`,
      answers: [`$x = ${r}$`, `$y = ${r}$`, `$x = ${-r}$`, `$x = ${s}$`],
      correct: 0,
      distractorNotes: [
        '',
        `המספר נכון אך הצורה שגויה. אסימפטוטה אנכית היא קו אנכי ולכן משוואתה נפתחת במשתנה $x$; הרישום $y = ${r}$ מתאר קו אופקי.`,
        `הסימן לא הועבר. מהמשוואה $${denom} = 0$ מקבלים $x = ${r}$; הצבת $x = ${-r}$ נותנת מכנה שונה מאפס.`,
        `אופס המונה במקום המכנה. בערך $x = ${s}$ הפונקציה שווה אפס, כלומר זו נקודת חיתוך עם ציר ה-$x$ ולא אסימפטוטה.`,
      ],
      hint: 'אפס את המכנה, ובדוק שהמונה אינו מתאפס באותו ערך.',
      solution: {
        steps: [
          '**הכלל:** אסימפטוטה אנכית מתקבלת מאיפוס המכנה, בתנאי שהמונה אינו מתאפס באותו ערך.',
          `**הנוסחה:** מאפסים את המכנה: $${denom} = 0$.`,
          `מעבירים אגף: $x = ${r}$.`,
          `בודקים את המונה שם: $${a * (r - s)}$, שונה מאפס, ולכן האסימפטוטה תקפה.`,
        ],
        finalAnswer: `$x = ${r}$`,
        explanation: 'המכנה מתאפס והמונה לא, ולכן הפונקציה שואפת לאינסוף ליד הערך הזה.',
      },
    });
  },
};

const asyHorizontal: GenTemplate = {
  id: 'fn-asy-horizontal',
  distractorTags: [null, 'formula-mismatch', 'formula-mismatch', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'rq-asymptotes',
  title: 'אסימפטוטה אופקית לפי השוואת חזקות',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const n = rng.int(1, 3);
    const m = difficulty === 'easy' ? n : rng.int(1, 3);
    const a = pickInt(rng, -7, 7, [1, -1]);
    const c = difficulty === 'hard' ? pickInt(rng, -4, 4, [1, -1]) : 1;
    const b = pickInt(rng, -9, 9);
    const d = pickInt(rng, -9, 9);

    const ratio = new Frac(a, c);
    const free = new Frac(b, d);
    if (ratio.eq(free)) return null;

    const pow = (k: number, coef: number) => `${coef === 1 ? '' : coef === -1 ? '-' : coef}x${k === 1 ? '' : `^${k}`}`;
    const fx = `\\dfrac{${pow(n, a)} ${b > 0 ? '+' : '-'} ${Math.abs(b)}}{${pow(m, c)} ${d > 0 ? '+' : '-'} ${Math.abs(d)}}`;

    const optRatio = `$y = ${ratio.tex()}$`;
    const optZero = '$y = 0$';
    const optFree = `$y = ${free.tex()}$`;
    const optNone = 'אין אסימפטוטה אופקית';

    const noteRatio = 'יחס המקדמים המובילים קובע את האסימפטוטה רק כשהחזקות שוות.';
    const noteZero = 'הכלל $y = 0$ תקף רק כשחזקת המכנה גדולה יותר.';
    const noteFree = 'חושב יחס האיברים החופשיים. הם קובעים את הערך בהצבת אפס, לא את ההתנהגות בקצוות.';
    const noteNone = 'אסימפטוטה אופקית נעדרת רק כשחזקת המונה גדולה מזו של המכנה.';

    const rule = '**הכלל:** אסימפטוטה אופקית נקבעת מהשוואת החזקה הגבוהה במונה לזו שבמכנה: חזקות שוות נותנות יחס מקדמים מובילים, מכנה גבוה יותר נותן אפס, ומונה גבוה יותר נותן שאין אסימפטוטה.';
    const q = `מהי האסימפטוטה האופקית של $f(x) = ${fx}$?`;
    const powers = `החזקה הגבוהה במונה היא $${n}$ ובמכנה היא $${m}$.`;

    if (n === m) {
      return mcq({
        question: q,
        answers: [optRatio, optZero, optFree, optNone],
        correct: 0,
        distractorNotes: ['', noteZero + ` כאן שתי החזקות הן $${n}$.`, noteFree, noteNone + ' כאן הן שוות.'],
        hint: 'השווה את החזקות הגבוהות. מה עושים כשהן שוות?',
        solution: {
          steps: [rule, powers, `החזקות שוות, ולכן לוקחים את יחס המקדמים המובילים: $\\dfrac{${a}}{${c}}$.`],
          finalAnswer: optRatio,
          explanation: 'המקדמים החופשיים אינם משפיעים על ההתנהגות בקצוות.',
        },
      });
    }
    if (n < m) {
      return mcq({
        question: q,
        answers: [optZero, optRatio, optFree, optNone],
        correct: 0,
        distractorNotes: ['', noteRatio + ` כאן חזקת המכנה גדולה יותר.`, noteFree, noteNone + ' כאן המכנה הוא הגבוה.'],
        hint: 'השווה את החזקות הגבוהות. מי גדל מהר יותר?',
        solution: {
          steps: [rule, powers, 'חזקת המכנה גדולה יותר, ולכן המכנה גדל מהר יותר והשבר מתכווץ לאפס.'],
          finalAnswer: optZero,
          explanation: 'כשהמכנה גדל מהר יותר, ערכי הפונקציה שואפים לאפס.',
        },
      });
    }
    return mcq({
      question: q,
      answers: [optNone, optRatio, optZero, optFree],
      correct: 0,
      distractorNotes: ['', noteRatio + ' כאן המונה הוא הגבוה.', noteZero + ' כאן המונה הוא הגבוה.', noteFree],
      hint: 'השווה את החזקות הגבוהות. מי גדל מהר יותר?',
      solution: {
        steps: [rule, powers, 'חזקת המונה גדולה יותר, ולכן הפונקציה גדלה בערכה המוחלט ללא גבול ואינה מתקרבת לשום ישר אופקי.'],
        finalAnswer: optNone,
        explanation: 'מונה שגדל מהר יותר מהמכנה אינו משאיר אסימפטוטה אופקית.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 4 · rq-derivative
// ---------------------------------------------------------------------------

const derQuotientSlope: GenTemplate = {
  id: 'fn-der-quotient-slope',
  wrongAnswerTags: ['sign-slip', 'dropped-factor'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'rq-derivative',
  title: 'שיפוע המשיק לפונקציית מנה',
  skill: 'substitution',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const c = difficulty === 'hard' ? 2 : 1;
    const a = difficulty === 'easy' ? 1 : pickInt(rng, -5, 5);
    const b = pickInt(rng, -9, 9);
    const d = pickInt(rng, -9, 9);
    const det = a * d - b * c;
    if (det === 0) return null;

    // The denominator's value at x0 is t, chosen small so the slope is a clean fraction.
    const ts = [-3, -2, 2, 3].filter((t) => (t - d) % c === 0);
    if (!ts.length) return null;
    const t = rng.pick(ts);
    const x0 = (t - d) / c;
    if (x0 === 0 && difficulty !== 'easy') return null;

    const slope = new Frac(det, t * t);
    const numer = lin(a, b);
    const denom = lin(c, d);

    return open({
      question: `נתונה הפונקציה $f(x) = \\dfrac{${numer}}{${denom}}$. מצא את שיפוע המשיק לגרף הפונקציה בנקודה שבה $x = ${x0}$.`,
      expected: { kind: 'value', value: slope.expr() },
      wrongAnswers: [
        {
          value: new Frac(-det, t * t).expr(),
          note: `הסדר במונה של כלל המנה התהפך. הנוסחה היא נגזרת המונה כפול המכנה פחות המונה כפול נגזרת המכנה: $${a} \\cdot (${denom}) - (${numer}) \\cdot ${c}$.`,
        },
        {
          value: new Frac(det, t).expr(),
          note: `המכנה לא הועלה בריבוע. בכלל המנה המכנה של הנגזרת הוא המכנה המקורי בריבוע, וכאן $(${t})^2 = ${t * t}$.`,
        },
      ],
      hint: 'כלל המנה, ואז הצבה של הערך הנתון בנגזרת.',
      solution: {
        steps: [
          '**הכלל:** מבוקש שיפוע משיק, ולכן גוזרים ומציבים את הנקודה בנגזרת, וכאן הפונקציה היא מנה ולכן גוזרים בכלל המנה.',
          `**הנוסחה:** $f\'(x) = \\dfrac{${a} \\cdot (${denom}) - (${numer}) \\cdot ${c}}{(${denom})^2}$.`,
          `מצמצמים את המונה: $${a * d} - (${b * c}) = ${det}$, ולכן $f\'(x) = \\dfrac{${det}}{(${denom})^2}$.`,
          `**ההצבה:** בערך $x = ${x0}$ המכנה שווה $${t}$, ולכן $f\'(${x0}) = \\dfrac{${det}}{${t * t}}$.`,
        ],
        finalAnswer: `$m = ${slope.tex()}$`,
        explanation: 'שיפוע המשיק בנקודה הוא ערך הנגזרת באותה נקודה.',
      },
    });
  },
};

const derExtremum: GenTemplate = {
  id: 'fn-der-min-x-plus-a-over-x',
  wrongAnswerTags: ['condition-ignored', 'exponent-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'rq-derivative',
  title: 'נקודת מינימום של פונקציה עם איבר מנה',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const m = rng.int(2, 12);
    const k = difficulty === 'easy' ? rng.int(1, 2) : rng.int(2, 5);
    const a = k * m * m; // f = kx + a/x  →  f' = k - a/x² = 0  →  x² = m²
    const kx = `${k === 1 ? '' : k}x`;
    const fx =
      difficulty === 'hard'
        ? `\\dfrac{${kx}^2 + ${a}}{x}`
        : rng.chance(0.5)
          ? `${kx} + \\dfrac{${a}}{x}`
          : `\\dfrac{${a}}{x} + ${kx}`;

    return open({
      question: `לפונקציה $f(x) = ${fx}$ יש נקודת מינימום. מצא את שיעור ה-$x$ שלה.`,
      expected: { kind: 'value', value: String(m) },
      wrongAnswers: [
        {
          value: String(-m),
          note: `זו נקודת המקסימום. שני הפתרונות של $x^2 = ${m * m}$ הם קיצון, ובדיקת הנגזרת השנייה $f\'\'(x) = \\dfrac{${2 * a}}{x^3}$ נותנת ערך חיובי רק בצד החיובי.`,
        },
        {
          value: String(m * m),
          note: `נפתר $x = ${m * m}$ במקום $x^2 = ${m * m}$. אחרי ההעברה מקבלים משוואה ריבועית, ושורש שלה הוא $${m}$.`,
        },
      ],
      hint: 'גזור, השווה לאפס ופתור. אחר כך קבע איזה מהפתרונות הוא מינימום.',
      solution: {
        steps: [
          '**הכלל:** מבוקשת נקודת קיצון, ולכן גוזרים ומשווים את הנגזרת לאפס, ואת סוג הקיצון קובעים בעזרת הנגזרת השנייה.',
          `${difficulty === 'hard' ? `מפרקים את המנה: $f(x) = ${k === 1 ? '' : k}x + \\dfrac{${a}}{x}$, ולכן ` : ''}$f\'(x) = ${k} - \\dfrac{${a}}{x^2}$.`,
          `$f\'(x) = 0$ נותן $${k}x^2 = ${a}$, כלומר $x^2 = ${m * m}$, ולכן $x = ${m}$ או $x = ${-m}$.`,
          `$f\'\'(x) = \\dfrac{${2 * a}}{x^3}$, חיובי כאשר $x = ${m}$ ושלילי כאשר $x = ${-m}$.`,
        ],
        finalAnswer: `$x = ${m}$`,
        explanation: 'נגזרת שנייה חיובית מסמנת מינימום; הפתרון השלילי הוא המקסימום.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 5 · rq-sketch — the sign chart behind the sketch
// ---------------------------------------------------------------------------

const signQuotient: GenTemplate = {
  id: 'fn-sign-quotient',
  distractorTags: [null, 'sign-slip', 'partial-answer', 'condition-ignored'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'rq-sketch',
  title: 'תחומי החיוביות של פונקציית מנה',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const lo = difficulty === 'easy' ? 1 : -8;
    const p = pickInt(rng, lo, 8);
    const q = pickInt(rng, lo, 8, [p]);
    const [l, h] = [p, q].sort((u, v) => u - v);

    const positive = `$x < ${l}$ או $x > ${h}$`;
    return mcq({
      question: `נתונה הפונקציה $f(x) = \\dfrac{${lin(1, -p)}}{${lin(1, -q)}}$. באילו תחומים הפונקציה חיובית?`,
      answers: [positive, `$${l} < x < ${h}$`, `$x > ${p}$`, `$x \\ne ${q}$`],
      correct: 0,
      distractorNotes: [
        '',
        `זה התחום שבו הפונקציה שלילית. בין שני הערכים המונה והמכנה בסימנים מנוגדים, ולכן המנה שלילית; הצבת ערך מהתחום הזה מאשרת.`,
        `נבדק המונה בלבד. סימן המנה נקבע גם על-ידי המכנה, ומשמאל לשני הערכים שניהם שליליים ולכן המנה חיובית.`,
        `זה תחום ההגדרה, לא תחום החיוביות. פונקציה מוגדרת יכולה להיות שלילית, וזה קורה בין $${l}$ ל-$${h}$.`,
      ],
      hint: 'שני ערכים משנים סימן: שורש המונה ושורש המכנה. בדוק את הסימן בכל אחד משלושת הקטעים.',
      solution: {
        steps: [
          '**הכלל:** סימן של מנה נקבע משני הגורמים יחד, ולכן מסמנים על ציר את שורש המונה ואת שורש המכנה ובודקים את הסימן בכל קטע בנפרד.',
          `שורש המונה: $x = ${p}$. שורש המכנה: $x = ${q}$. הציר נחלק לשלושה קטעים.`,
          `משמאל לשניהם, כאשר $x < ${l}$, המונה והמכנה באותו סימן ולכן המנה חיובית; בין הערכים הסימנים מנוגדים והמנה שלילית; מימין לשניהם שניהם חיוביים והמנה חיובית.`,
        ],
        finalAnswer: positive,
        explanation: 'מנה חיובית כשהמונה והמכנה באותו סימן.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 6 · rq-transformations — shifting a/x
// ---------------------------------------------------------------------------

const shiftAsymptotes: GenTemplate = {
  id: 'fn-shift-asymptotes',
  distractorTags: [null, 'sign-slip', 'values-swapped', 'partial-answer'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'rq-transformations',
  title: 'אסימפטוטות אחרי הזזת הגרף',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const a = difficulty === 'easy' ? 1 : pickInt(rng, -6, 6);
    // On hard the wording says "N יחידות", so keep N ≥ 2 for the plural to read right.
    const unit = difficulty === 'hard' ? [1, -1] : [];
    const h = pickInt(rng, difficulty === 'easy' ? 1 : -8, 8, unit);
    const k = pickInt(rng, difficulty === 'easy' ? 1 : -8, 8, [h, -h, ...unit]);

    const g = `\\dfrac{${a === 1 ? '' : a === -1 ? '-' : a}${a === 1 || a === -1 ? '1' : ''}}{${lin(1, -h)}} ${k > 0 ? '+' : '-'} ${Math.abs(k)}`;
    const question =
      difficulty === 'hard'
        ? `הגרף של $f(x) = \\dfrac{${a}}{x}$ הוזז $${Math.abs(h)}$ יחידות ${h > 0 ? 'ימינה' : 'שמאלה'} ו-$${Math.abs(k)}$ יחידות ${k > 0 ? 'למעלה' : 'למטה'}, והתקבל הגרף של $g(x)$. מהן האסימפטוטות של $g$?`
        : `מהן האסימפטוטות של $g(x) = ${g}$?`;

    const right = `$x = ${h}$, $y = ${k}$`;
    return mcq({
      question,
      answers: [right, `$x = ${-h}$, $y = ${k}$`, `$x = ${k}$, $y = ${h}$`, `$x = ${h}$, $y = 0$`],
      correct: 0,
      distractorNotes: [
        '',
        `סימן ההזזה האופקית התהפך. במכנה כתוב $${lin(1, -h)}$, שמתאפס כאשר $x = ${h}$, ולכן האסימפטוטה האנכית שם.`,
        `ההזזות הוחלפו. המכנה קובע את האסימפטוטה האנכית, והמספר שמחוץ לשבר קובע את האופקית.`,
        `האסימפטוטה האופקית נשארה של $\\dfrac{1}{x}$. התוספת $${k}$ מחוץ לשבר מזיזה את כל הגרף, כולל האסימפטוטה האופקית.`,
      ],
      hint: 'המכנה קובע את האסימפטוטה האנכית; המספר שמחוץ לשבר קובע את האופקית.',
      solution: {
        steps: [
          '**הכלל:** בפונקציה מהצורה מספר חלקי גורם ליניארי ועוד קבוע, האסימפטוטה האנכית היא שורש המכנה והאופקית היא הקבוע שמחוץ לשבר.',
          `${difficulty === 'hard' ? `הזזה אופקית נכנסת למכנה בסימן הפוך והזזה אנכית מתווספת בחוץ: $g(x) = ${g}$. ` : ''}מאפסים את המכנה: $${lin(1, -h)} = 0$, ולכן $x = ${h}$.`,
          `כאשר $x$ גדל, השבר שואף לאפס ונשאר הקבוע: $y = ${k}$.`,
        ],
        finalAnswer: right,
        explanation: 'ההזזה האופקית מופיעה במכנה בסימן הפוך; האנכית מופיעה כמו שהיא מחוץ לשבר.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 7 · rq-integral — the area under a/x²
// ---------------------------------------------------------------------------

const intRecipSquare: GenTemplate = {
  id: 'fn-int-recip-square',
  wrongAnswerTags: ['sign-slip', 'dropped-factor'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'rq-integral',
  title: 'שטח מתחת לגרף של מספר חלקי x בריבוע',
  skill: 'substitution',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const a = rng.int(2, 9);
    const x1 = rng.int(1, difficulty === 'easy' ? 2 : 4);
    const x2 = x1 + rng.int(1, difficulty === 'hard' ? 6 : 3);
    const area = new Frac(a * (x2 - x1), x1 * x2);

    return open({
      question: `חשב את השטח המוגבל בין הגרף של $f(x) = \\dfrac{${a}}{x^2}$, ציר ה-$x$ והישרים $x = ${x1}$ ו-$x = ${x2}$.`,
      expected: { kind: 'value', value: area.expr() },
      wrongAnswers: [
        {
          value: new Frac(-a * (x2 - x1), x1 * x2).expr(),
          note: `הסימן של הפונקציה הקדומה אבד. הקדומה של $x^{-2}$ היא $-x^{-1}$, ולכן ההצבה היא $-\\dfrac{${a}}{${x2}} + \\dfrac{${a}}{${x1}}$, ושטח תמיד חיובי.`,
        },
        {
          value: new Frac(x2 - x1, x1 * x2).expr(),
          note: `המקדם $${a}$ נשמט. הוא נשאר לאורך כל האינטגרל ומכפיל את התוצאה.`,
        },
      ],
      hint: 'כתוב את הפונקציה כחזקה שלילית, מצא קדומה והצב את הגבולות.',
      solution: {
        steps: [
          '**הכלל:** שטח בין גרף חיובי לציר ה-$x$ הוא האינטגרל המסוים בין הגבולות, ואת המנה כותבים כחזקה שלילית כדי לגזור ממנה קדומה.',
          `**הנוסחה:** $\\int_{${x1}}^{${x2}} ${a}x^{-2}\\,dx = \\left[ -\\dfrac{${a}}{x} \\right]_{${x1}}^{${x2}}$.`,
          `**ההצבה:** $-\\dfrac{${a}}{${x2}} - \\left(-\\dfrac{${a}}{${x1}}\\right) = \\dfrac{${a}}{${x1}} - \\dfrac{${a}}{${x2}}$.`,
        ],
        finalAnswer: `$S = ${area.tex()}$`,
        explanation: 'הקדומה של מספר חלקי x בריבוע היא מינוס אותו מספר חלקי x.',
      },
    });
  },
};

export const FUNCTIONS_TEMPLATES: GenTemplate[] = [
  domQuotient,
  domRoot,
  intAxes,
  intXFactored,
  asyVertical,
  asyHorizontal,
  derQuotientSlope,
  derExtremum,
  signQuotient,
  shiftAsymptotes,
  intRecipSquare,
];
