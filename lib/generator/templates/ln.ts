/**
 * generator/templates/ln.ts — parameterised repair questions for פונקציית ln
 * (sub-topics `ln-*`).
 *
 * Same contract as functions.ts: `**הכלל:**` opens every solution and never
 * contains the answer, no Hebrew inside `$…$`, no maqaf before a math island,
 * every distractor is a NAMED mistake with a note, and `build` is pure in
 * (rng, difficulty) so the id alone rebuilds the question.
 *
 * Grading convention (lib/answer-check): the natural log is mathjs `log(...)`,
 * Euler's number is `e`, so `expected` is written `2*log(3)`, `e^(-1)`,
 * `(e^2 + 3)/2` — never a rounded decimal. Display uses `\ln`.
 */

import { Frac, type Rng } from '../rng';
import { mcq, open } from './shared';
import type { GenTemplate } from '../types';

const TOPIC = 'פונקציית ln';
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

/** Non-zero integer in [lo, hi] with `avoid` excluded. */
function pickInt(rng: Rng, lo: number, hi: number, avoid: number[] = []): number {
  for (let i = 0; i < 25; i++) {
    const v = rng.int(lo, hi);
    if (v !== 0 && !avoid.includes(v)) return v;
  }
  return 0;
}

/** `e^k` as LaTeX: `e`, `e^{3}`, `e^{-2}`. */
const ePowTex = (k: number) => (k === 1 ? 'e' : `e^{${k}}`);
/** `e^k` for mathjs: `e`, `e^3`, `e^(-2)`. */
const ePowExpr = (k: number) => (k === 1 ? 'e' : k < 0 ? `e^(${k})` : `e^${k}`);

/** A coefficient in front of a term: 1 → '', -1 → '-', otherwise the number / fraction. */
function coefTex(f: Frac): string {
  if (f.n === f.d) return '';
  if (f.n === -f.d) return '-';
  return f.tex();
}

/** `\ln x + c` with the constant folded in (c = 0 → no tail). */
function lnPlus(coef: string, c: number): string {
  const head = `${coef}\\ln x`;
  if (c === 0) return head;
  return c > 0 ? `${head} + ${c}` : `${head} - ${-c}`;
}

// ---------------------------------------------------------------------------
// 1 · ln-properties — domain of ln(ax + b), and the log laws
// ---------------------------------------------------------------------------

const domLinear: GenTemplate = {
  id: 'ln-dom-linear',
  distractorTags: [null, 'sign-slip', 'condition-ignored', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ln-properties',
  title: 'תחום הגדרה של ln עם ארגומנט ליניארי',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const r = pickInt(rng, -9, 9);
    // ax + b > 0  ⇔  x > r (a > 0)  or  x < r (a < 0, hard only).
    const a = difficulty === 'easy' ? rng.int(1, 2) : difficulty === 'mid' ? rng.int(2, 5) : -rng.int(2, 5);
    const b = -a * r;
    const inner = lin(a, b);
    const gt = a > 0;
    const right = gt ? `$x > ${r}$` : `$x < ${r}$`;
    const flipped = gt ? `$x < ${r}$` : `$x > ${r}$`;
    const weak = gt ? `$x \\ge ${r}$` : `$x \\le ${r}$`;

    const question = rng.chance(0.5)
      ? `מהו תחום ההגדרה של $f(x) = \\ln(${inner})$?`
      : `עבור אילו ערכי $x$ מוגדרת הפונקציה $f(x) = \\ln(${inner})$?`;

    return mcq({
      question,
      answers: [right, flipped, weak, `$x \\ne ${r}$`],
      correct: 0,
      distractorNotes: [
        '',
        gt
          ? `כיוון האי-שוויון התהפך. מ-$${inner} > 0$ מחלקים במקדם החיובי $${a}$ והכיוון נשמר; הצבת ערך קטן מ-$${r}$ נותנת ארגומנט שלילי.`
          : `כיוון האי-שוויון לא התהפך. מ-$${inner} > 0$ מחלקים במקדם השלילי $${a}$, ובחלוקה במספר שלילי הכיוון מתהפך.`,
        `האי-שוויון החלש מכניס את $x = ${r}$, ושם הארגומנט שווה אפס, אבל $\\ln 0$ אינו מוגדר. הדרישה היא חיובי ממש.`,
        `זהו תחום של מכנה, לא של לוגריתם. ארגומנט שלילי פסול בדיוק כמו ארגומנט אפס, ולכן נפסל חצי ישר שלם ולא נקודה אחת.`,
      ],
      hint: 'הארגומנט של ln חייב להיות חיובי ממש. פתור את האי-שוויון, ושים לב לסימן המקדם.',
      solution: {
        steps: [
          '**הכלל:** המשתנה יושב בתוך לוגריתם, ולכן התנאי היחיד הוא שהארגומנט חיובי ממש, באי-שוויון חזק שהקצה שלו אינו כלול.',
          `**הנוסחה:** התנאי הוא $${inner} > 0$.`,
          `מעבירים אגף: $${a === 1 ? 'x' : `${a}x`} > ${-b}$.`,
          a === 1
            ? 'המקדם של המשתנה הוא אחד, ולכן זהו כבר התחום.'
            : gt
              ? `מחלקים במקדם החיובי $${a}$, הכיוון נשמר: $x > ${r}$.`
              : `מחלקים במקדם השלילי $${a}$, הכיוון מתהפך: $x < ${r}$.`,
        ],
        finalAnswer: right,
        explanation: 'לוגריתם דורש ארגומנט חיובי ממש, ולכן הקצה שבו הארגומנט מתאפס אינו בתחום.',
      },
    });
  },
};

const lawsSimplify: GenTemplate = {
  id: 'ln-laws-simplify',
  distractorTags: [null, 'operation-swap', 'sign-slip', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ln-properties',
  title: 'כינוס ביטוי לוגריתמי ללוגריתם יחיד',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    // ln A + ln B - ln C = ln k  with  A·B = k·C.
    const k = rng.int(2, difficulty === 'easy' ? 6 : 12);
    const C = rng.int(2, difficulty === 'easy' ? 4 : 6);
    // Split k·C into A·B with both factors > 1; fall back to (k, C) which always works.
    const prod = k * C;
    const splits: [number, number][] = [];
    for (let A = 2; A * A <= prod; A++) if (prod % A === 0) splits.push([A, prod / A], [prod / A, A]);
    const [A, B] = splits.length ? rng.pick(splits) : [k, C];
    if (A === C || B === C) return null; // a term that cancels visibly is a different exercise

    // Hard: the first term is written 2 ln a when A is a perfect square.
    const sqrtA = Math.round(Math.sqrt(A));
    const asPower = difficulty === 'hard' && sqrtA * sqrtA === A && sqrtA > 1;
    const firstTex = asPower ? `2\\ln ${sqrtA}` : `\\ln ${A}`;
    const firstSum = asPower ? 2 * sqrtA : A; // what "add the arguments" would use

    const expr = rng.chance(0.5)
      ? `${firstTex} + \\ln ${B} - \\ln ${C}`
      : `${firstTex} - \\ln ${C} + \\ln ${B}`;

    const right = `$\\ln ${k}$`;
    const swapped = firstSum + B - C;
    return mcq({
      question: `כתוב את הביטוי $${expr}$ כלוגריתם יחיד.`,
      answers: [right, `$\\ln ${swapped}$`, `$\\ln ${A * B * C}$`, `$\\dfrac{\\ln ${A * B}}{\\ln ${C}}$`],
      correct: 0,
      distractorNotes: [
        '',
        `הארגומנטים חוברו וחוסרו כמספרים רגילים. חיבור לוגריתמים מכפיל ארגומנטים וחיסור מחלק: $\\ln ${A} + \\ln ${B} = \\ln(${A} \\cdot ${B})$, לא $\\ln(${A} + ${B})$.`,
        `הסימן של האיבר המחוסר אבד. חיסור לוגריתם מחלק את הארגומנט ב-$${C}$, לא מכפיל בו.`,
        `חיסור לוגריתמים הפך לחלוקת לוגריתמים. הזהות היא $\\ln a - \\ln b = \\ln\\dfrac{a}{b}$; מנה של שני לוגריתמים אינה מתכנסת ללוגריתם יחיד.`,
      ],
      hint: 'חיבור לוגריתמים = ln של מכפלה, חיסור = ln של מנה. כנס הכול לשבר אחד וצמצם.',
      solution: {
        steps: [
          '**הכלל:** מבוקש לוגריתם יחיד, ולכן מפעילים את חוקי הלוגריתמים: סכום לוגריתמים הוא לוגריתם של מכפלה, הפרש לוגריתמים הוא לוגריתם של מנה, ומקדם נכנס כחזקה.',
          asPower ? `**הנוסחה:** $2\\ln ${sqrtA} = \\ln ${sqrtA}^2 = \\ln ${A}$.` : `**הנוסחה:** $\\ln a + \\ln b - \\ln c = \\ln\\dfrac{a \\cdot b}{c}$.`,
          `מכנסים: $\\ln\\dfrac{${A} \\cdot ${B}}{${C}} = \\ln\\dfrac{${A * B}}{${C}}$.`,
          `מצמצמים את השבר: $\\dfrac{${A * B}}{${C}} = ${k}$.`,
        ],
        finalAnswer: right,
        explanation: 'חוקי הלוגריתמים הופכים סכום והפרש למכפלה ומנה בתוך לוגריתם אחד.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 2 · ln-derivatives — chain rule at a point, product rule with x ln x
// ---------------------------------------------------------------------------

const derChainPoint: GenTemplate = {
  id: 'ln-der-chain-point',
  wrongAnswerTags: ['dropped-factor', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ln-derivatives',
  title: 'שיפוע המשיק לפונקציית ln בנקודה',
  skill: 'substitution',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const a = difficulty === 'easy' ? rng.int(2, 3) : rng.int(2, 6);
    const k = difficulty === 'hard' ? rng.int(2, 5) : 1;
    const x0 = pickInt(rng, -4, 6);
    // The inner value t = a·x0 + b is chosen small so the slope is a clean fraction.
    const t = rng.int(2, 9);
    const b = t - a * x0;
    const inner = lin(a, b);
    const slope = new Frac(k * a, t);
    const fx = `${k === 1 ? '' : k}\\ln(${inner})`;

    const question = rng.chance(0.5)
      ? `נתונה הפונקציה $f(x) = ${fx}$. מצא את שיפוע המשיק לגרף הפונקציה בנקודה שבה $x = ${x0}$.`
      : `נתונה הפונקציה $f(x) = ${fx}$. חשב את $f\'(${x0})$.`;

    return open({
      question,
      expected: { kind: 'value', value: slope.expr() },
      wrongAnswers: [
        {
          value: new Frac(k, t).expr(),
          note: `נגזרת הפנימי נשמטה. לפי כלל השרשרת $(\\ln g)\' = \\dfrac{g\'}{g}$, והפנימי $${inner}$ נגזר ל-$${a}$, ולכן המונה הוא $${k * a}$ ולא $${k}$.`,
        },
        {
          value: String(k * a),
          note: `נגזר הפנימי בלבד והמכנה נעלם. נגזרת של $\\ln$ היא תמיד שבר שהארגומנט במכנה שלו, וכאן המכנה בנקודה שווה $${t}$.`,
        },
      ],
      hint: 'כלל השרשרת: נגזרת הפנימי חלקי הפנימי. אחר כך הצב את הנקודה.',
      solution: {
        steps: [
          '**הכלל:** מבוקש שיפוע משיק, ולכן גוזרים ומציבים את הנקודה בנגזרת, וכאן הפונקציה היא לוגריתם של ביטוי פנימי ולכן גוזרים בכלל השרשרת: נגזרת הפנימי חלקי הפנימי.',
          `**הנוסחה:** $f\'(x) = ${k === 1 ? '' : `${k} \\cdot `}\\dfrac{${a}}{${inner}}$.`,
          `**ההצבה:** בערך $x = ${x0}$ הפנימי שווה $${a} \\cdot ${x0 < 0 ? `(${x0})` : x0} ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${t}$.`,
          `לכן $f\'(${x0}) = \\dfrac{${k * a}}{${t}}$.`,
        ],
        finalAnswer: `$m = ${slope.tex()}$`,
        explanation: 'שיפוע המשיק בנקודה הוא ערך הנגזרת באותה נקודה.',
      },
    });
  },
};

const derProductXlnx: GenTemplate = {
  id: 'ln-der-product-xlnx',
  distractorTags: [null, 'partial-answer', 'dropped-factor', 'partial-answer'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ln-derivatives',
  title: 'נגזרת של מכפלה עם ln x',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    // f(x) = a·x·ln x + c·x   →   f'(x) = a ln x + a + c
    const a = difficulty === 'easy' ? rng.int(1, 6) : rng.int(2, 9);
    const c = difficulty === 'easy' ? rng.int(0, 4) : pickInt(rng, -6, 6);
    const ax = a === 1 ? 'x' : `${a}x`;
    const tail = c === 0 ? '' : c > 0 ? ` + ${c === 1 ? '' : c}x` : ` - ${c === -1 ? '' : -c}x`;
    const fx = `${ax}\\ln x${tail}`;
    const A = new Frac(a);

    const right = `$${lnPlus(coefTex(A), a + c)}$`;
    const answers = [
      right,
      `$${lnPlus(coefTex(A), c)}$`,
      `$\\dfrac{${a}}{x}${c === 0 ? '' : c > 0 ? ` + ${c}` : ` - ${-c}`}$`,
      `$${a + c}$`,
    ];

    return mcq({
      question: `מהי הנגזרת של $f(x) = ${fx}$ (בתחום $x > 0$)?`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        `זהו רק המחובר הראשון של כלל המכפלה. המחובר השני, $${ax} \\cdot \\dfrac{1}{x} = ${a}$, נשמט, ולכן חסר $${a}$ בקבוע.`,
        `נגזר רק הגורם $\\ln x$ והגורם $${ax}$ נעלם. מכפלה אינה נגזרת גורם אחר גורם; כלל המכפלה $u\'v + uv\'$ נותן שני מחוברים.`,
        `נשאר רק הקבוע. המחובר $u\'v = ${a} \\cdot \\ln x$ נשמט, ואיתו התלות ב-$x$; הנגזרת של מכפלה עם $\\ln x$ עדיין מכילה $\\ln x$.`,
      ],
      hint: 'כלל המכפלה על x·ln x נותן שני מחוברים. גזור בנפרד את האיבר הליניארי.',
      solution: {
        steps: [
          '**הכלל:** הפונקציה היא מכפלה של פולינום בלוגריתם, ולכן גוזרים אותה בכלל המכפלה, שנותן שני מחוברים, ואת האיבר הליניארי גוזרים בנפרד.',
          `**הנוסחה:** $(uv)\' = u\'v + uv\'$ עם $u = ${ax}$, $v = \\ln x$.`,
          `$(${ax}\\ln x)\' = ${a}\\ln x + ${ax} \\cdot \\dfrac{1}{x} = ${a}\\ln x + ${a}$.`,
          c === 0 ? 'אין איברים נוספים לגזור.' : `נגזרת האיבר הליניארי היא $${c}$, ומחברים: $${a} ${c > 0 ? '+' : '-'} ${Math.abs(c)} = ${a + c}$.`,
        ],
        finalAnswer: right,
        explanation: 'המחובר x·(1/x) = 1 הוא זה שסטודנטים שוכחים; הוא נותן את הקבוע.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 3 · ln-equations — raise to e, and the extra root the domain rejects
// ---------------------------------------------------------------------------

const eqRaiseToE: GenTemplate = {
  id: 'ln-eq-raise-to-e',
  wrongAnswerTags: ['formula-mismatch', 'sign-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ln-equations',
  title: 'משוואה מהצורה ln של ביטוי שווה מספר',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    // ln(ax + b) = k   →   x = (e^k - b) / a
    const a = difficulty === 'easy' ? 1 : rng.int(2, 4);
    const k = difficulty === 'hard' ? -rng.int(1, 3) : rng.int(1, 4);
    const b = pickInt(rng, -6, 6);
    const inner = lin(a, b);
    const eK = ePowTex(k);
    const eE = ePowExpr(k);
    const minusB = b > 0 ? `- ${b}` : `+ ${-b}`;
    const numerTex = `${eK} ${minusB}`;
    const numerExpr = `(${eE} ${minusB})`;
    const xTex = a === 1 ? numerTex : `\\dfrac{${numerTex}}{${a}}`;

    return open({
      question: rng.chance(0.5)
        ? `פתור את המשוואה $\\ln(${inner}) = ${k}$.`
        : `מצא את $x$ המקיים $\\ln(${inner}) = ${k}$.`,
      expected: { kind: 'value', value: a === 1 ? numerExpr : `${numerExpr}/${a}` },
      wrongAnswers: [
        {
          value: a === 1 ? `(${k} ${minusB})` : `(${k} ${minusB})/${a}`,
          note: `ה-$\\ln$ נמחק בלי לבצע פעולה. הפעולה ההופכית ללוגריתם היא העלאת $e$ בחזקה: מ-$\\ln(${inner}) = ${k}$ נובע $${inner} = ${eK}$, לא $${inner} = ${k}$.`,
        },
        {
          value: a === 1 ? `(${eE} ${b > 0 ? '+' : '-'} ${Math.abs(b)})` : `(${eE} ${b > 0 ? '+' : '-'} ${Math.abs(b)})/${a}`,
          note: `הסימן של $${Math.abs(b)}$ לא התהפך בהעברת האגף. מ-$${inner} = ${eK}$ מעבירים ומקבלים $${a === 1 ? 'x' : `${a}x`} = ${eK} ${minusB}$.`,
        },
      ],
      hint: 'העלה את שני האגפים כחזקה של e, ואז פתור משוואה ליניארית. בדוק שהארגומנט חיובי.',
      solution: {
        steps: [
          '**הכלל:** לוגריתם יחיד שווה למספר, ולכן מפעילים את הפעולה ההופכית, העלאת שני האגפים כחזקה של $e$, והארגומנט חייב לצאת חיובי.',
          `**הנוסחה:** $\\ln(${inner}) = ${k}$ נותן $${inner} = ${eK}$.`,
          `מעבירים אגף: $${a === 1 ? 'x' : `${a}x`} = ${numerTex}$.`,
          a === 1 ? `הארגומנט שווה $${eK}$, חיובי, ולכן הפתרון בתחום.` : `מחלקים ב-$${a}$: $x = ${xTex}$. הארגומנט שווה $${eK}$, חיובי, ולכן הפתרון בתחום.`,
        ],
        finalAnswer: `$x = ${xTex}$`,
        explanation: 'ההופכי של ln הוא e בחזקה; הארגומנט יוצא e בחזקה, תמיד חיובי, ולכן אין פתרון שנפסל.',
      },
    });
  },
};

const eqExtraRoot: GenTemplate = {
  id: 'ln-eq-sum-extra-root',
  wrongAnswerTags: ['condition-ignored', 'operation-swap'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ln-equations',
  title: 'סכום לוגריתמים עם שורש שנפסל בתחום',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    // ln(x + A) + ln(x + B) = ln c,  A < B.  Domain: x > -A.
    // Valid root r > -A; the other root s = -(A + B) - r is < -A always.
    const A = difficulty === 'easy' ? 0 : difficulty === 'mid' ? -rng.int(1, 5) : pickInt(rng, -6, 6);
    const B = A + rng.int(1, difficulty === 'hard' ? 9 : 6);
    const r = -A + rng.int(1, difficulty === 'easy' ? 9 : 6);
    const s = -(A + B) - r;
    const c = (r + A) * (r + B);
    const p = A + B; // x² + p x + (AB - c) = 0
    const q = A * B - c;
    const fA = A === 0 ? 'x' : `(${lin(1, A)})`;
    const fB = `(${lin(1, B)})`;
    const L = `\\ln${A === 0 ? ' x' : fA} + \\ln${fB}`;

    return open({
      question: rng.chance(0.5)
        ? `פתור את המשוואה $${L} = \\ln ${c}$.`
        : `מצא את כל הפתרונות של המשוואה $${L} = \\ln ${c}$.`,
      expected: { kind: 'value', value: String(r) },
      wrongAnswers: [
        {
          value: String(s),
          note: `זהו דווקא השורש שנפסל. בהצבה $x = ${s}$ מקבלים $\\ln(${s + A})$, לוגריתם של מספר ${s + A === 0 ? 'אפס' : 'שלילי'}, שאינו מוגדר; בודקים כל שורש של הריבועית בארגומנטים המקוריים.`,
        },
        {
          value: new Frac(c - p, 2).expr(),
          note: `הארגומנטים חוברו במקום להיכפל. סכום לוגריתמים הוא לוגריתם של מכפלה: $${fA}${fB} = ${c}$, ומכאן משוואה ריבועית.`,
        },
      ],
      hint: 'כנס ללוגריתם יחיד, השווה ארגומנטים ופתור ריבועית. בסוף בדוק כל שורש בתחום.',
      solution: {
        steps: [
          '**הכלל:** סכום לוגריתמים שווה ללוגריתם, ולכן מכנסים למכפלה בתוך לוגריתם יחיד ומשווים ארגומנטים, ואת כל שורש שיוצא בודקים בתחום ההגדרה כי לוגריתם של מספר לא חיובי אינו מוגדר.',
          `**הנוסחה:** $\\ln\\big(${fA}${fB}\\big) = \\ln ${c}$, ולכן $${fA}${fB} = ${c}$.`,
          `פותחים ומעבירים: $x^2 ${p >= 0 ? '+' : '-'} ${Math.abs(p)}x ${q >= 0 ? '+' : '-'} ${Math.abs(q)} = 0$, ומכאן $x = ${r}$ או $x = ${s}$.`,
          `**בדיקת תחום:** עבור $x = ${s}$ מקבלים $\\ln(${s + A})$, לא מוגדר, ולכן נפסל. עבור $x = ${r}$ שני הארגומנטים חיוביים.`,
        ],
        finalAnswer: `$x = ${r}$`,
        explanation: 'השוואת ארגומנטים יכולה להוסיף שורש שהמשוואה המקורית לא מקבלת; בדיקת התחום מסננת אותו.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 4 · ln-investigation — the extremum of a·x·ln x + c·x, the x-intercept
// ---------------------------------------------------------------------------

const invExtremum: GenTemplate = {
  id: 'ln-inv-extremum-xlnx',
  wrongAnswerTags: ['sign-slip', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ln-investigation',
  title: 'נקודת הקיצון של x·ln x ודומיה',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    // f(x) = a x ln x + c x,  f' = a ln x + a + c = 0  →  ln x = m  →  x = e^m,  with c = -a(m + 1).
    const a = rng.int(1, 9);
    const m = difficulty === 'easy' ? rng.pick([-1, 1]) : rng.pick([-2, -1, 1, 2]);
    const c = -a * (m + 1);
    const ax = a === 1 ? 'x' : `${a}x`;
    const tail = c === 0 ? '' : c > 0 ? ` + ${c === 1 ? '' : c}x` : ` - ${c === -1 ? '' : -c}x`;
    const fx = `${ax}\\ln x${tail}`;

    return open({
      question: rng.chance(0.5)
        ? `לפונקציה $f(x) = ${fx}$ יש נקודת מינימום. מצא את שיעור ה-$x$ שלה.`
        : `נתונה הפונקציה $f(x) = ${fx}$ בתחום $x > 0$. מצא את שיעור ה-$x$ של נקודת הקיצון שלה.`,
      expected: { kind: 'value', value: ePowExpr(m) },
      wrongAnswers: [
        {
          value: ePowExpr(-m),
          note: `הסימן התהפך בבידוד $\\ln x$. מ-$${a}\\ln x + ${a + c} = 0$ מקבלים $\\ln x = ${m}$, ולכן החזקה של $e$ היא $${m}$ ולא $${-m}$.`,
        },
        {
          value: String(m),
          note: `זהו ערך $\\ln x$, לא ערך $x$. מ-$\\ln x = ${m}$ עוברים ל-$x$ בהעלאת $e$ בחזקה: $x = ${ePowTex(m)}$.`,
        },
      ],
      hint: 'גזור בכלל המכפלה, השווה לאפס ובודד את ln x. אחר כך העלה e בחזקה.',
      solution: {
        steps: [
          '**הכלל:** מבוקשת נקודת קיצון, ולכן גוזרים ומשווים את הנגזרת לאפס, וכאן הנגזרת מכילה לוגריתם ולכן מבודדים אותו ומעלים $e$ בחזקה.',
          `**הנוסחה:** $f\'(x) = ${a}\\ln x + ${ax} \\cdot \\dfrac{1}{x}${c === 0 ? '' : ` ${c > 0 ? '+' : '-'} ${Math.abs(c)}`} = ${lnPlus(coefTex(new Frac(a)), a + c)}$.`,
          `$f\'(x) = 0$ נותן $${a}\\ln x = ${-(a + c)}$, כלומר $\\ln x = ${m}$.`,
          `מעלים $e$ בחזקה: $x = ${ePowTex(m)}$. הנגזרת השנייה $\\dfrac{${a}}{x}$ חיובית, ולכן זו נקודת מינימום.`,
        ],
        finalAnswer: `$x = ${ePowTex(m)}$`,
        explanation: 'נגזרת של מכפלה עם ln x מתאפסת כשהלוגריתם שווה למספר, והפתרון הוא e בחזקת אותו מספר.',
      },
    });
  },
};

const invXIntercept: GenTemplate = {
  id: 'ln-inv-x-intercept',
  distractorTags: [null, 'condition-ignored', 'sign-slip', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ln-investigation',
  title: 'חיתוך גרף של ln עם ציר x',
  skill: 'substitution',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    // f(x) = ln(ax + b) = 0  ⇔  ax + b = 1  ⇔  x = x0.  Construct from x0.
    const a = difficulty === 'easy' ? 1 : rng.int(2, 3);
    const x0 = pickInt(rng, -9, 9, [1]);
    const b = 1 - a * x0;
    if (b === 0) return null; // ln(ax) is the un-shifted case, a different item
    const inner = lin(a, b);
    const argZero = new Frac(-b, a); // where the argument is 0 — outside the domain
    const slipped = new Frac(1 + b, a); // 1 + b instead of 1 - b

    const pt = (x: string) => `$(${x}, 0)$`;
    const right = pt(String(x0));
    const answers = [right, pt(argZero.tex()), pt(slipped.tex()), pt('1')];

    return mcq({
      question: rng.chance(0.5)
        ? `מהי נקודת החיתוך של הגרף של $f(x) = \\ln(${inner})$ עם ציר ה-$x$?`
        : `נתונה הפונקציה $f(x) = \\ln(${inner})$. באיזו נקודה חותך הגרף את ציר ה-$x$?`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        `הארגומנט הושווה לאפס. בערך $x = ${argZero.tex()}$ הפונקציה אינה מוגדרת כלל, כי $\\ln 0$ אינו קיים; לוגריתם מתאפס כשהארגומנט שווה $1$.`,
        `הסימן של $${Math.abs(b)}$ לא התהפך בהעברת האגף. מ-$${inner} = 1$ מקבלים $${a === 1 ? 'x' : `${a}x`} = ${1 - b}$.`,
        `זו נקודת החיתוך של $\\ln x$ עצמה, בלי ההזזה. בדיקה: $f(1) = \\ln(${a + b})$, שאינו אפס. מה שצריך לצאת $1$ הוא הארגומנט כולו.`,
      ],
      hint: 'חיתוך עם ציר x: f(x) = 0. ln מתאפס רק כשהארגומנט שווה 1.',
      solution: {
        steps: [
          '**הכלל:** חיתוך עם ציר ה-$x$ מתקבל מהשוואת הפונקציה לאפס, ולוגריתם מתאפס רק כשהארגומנט שלו שווה אחד, לא אפס.',
          `**הנוסחה:** $\\ln(${inner}) = 0$ נותן $${inner} = 1$.`,
          a === 1 ? `מעבירים אגף: $x = ${x0}$.` : `מעבירים אגף: $${a}x = ${1 - b}$, ולכן $x = ${x0}$.`,
          `הנקודה היא $(${x0}, 0)$.`,
        ],
        finalAnswer: right,
        explanation: 'ln 1 = 0 תמיד, ולכן מחפשים את הערך שבו הארגומנט שווה 1.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 5 · ln-integrals — the antiderivative of c/(ax+b), and the area under k/(x+a)
// ---------------------------------------------------------------------------

const intIndefinite: GenTemplate = {
  id: 'ln-int-indefinite-linear',
  distractorTags: [null, 'dropped-factor', 'operation-swap', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ln-integrals',
  title: 'אינטגרל של מספר חלקי ביטוי ליניארי',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    // ∫ c/(ax + b) dx = (c/a) ln|ax + b| + C
    const a = rng.int(2, 5);
    const c = difficulty === 'easy' ? 1 : rng.int(2, 9);
    const b = pickInt(rng, -9, 9);
    const inner = lin(a, b);
    const coef = new Frac(c, a);
    const lnAbs = `\\ln|${inner}| + C`;

    const right = `$${coefTex(coef)}${lnAbs}$`;
    const answers = [
      right,
      `$${c === 1 ? '' : c}${lnAbs}$`,
      `$${c * a}${lnAbs}$`,
      `$-\\dfrac{${c * a}}{(${inner})^2} + C$`,
    ];

    return mcq({
      question: `מהו $\\int \\dfrac{${c}}{${inner}}\\,dx$?`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        `נשמט תיקון המקדם. נגזרת המכנה היא $${a}$ ולא $${c}$, ולכן כדי שהמונה יהיה בדיוק נגזרת המכנה מחלקים ב-$${a}$: התוצאה מוכפלת ב-$\\dfrac{1}{${a}}$.`,
        `המקדם הוכפל ב-$${a}$ במקום להתחלק בו. בדיקה בגזירה חוזרת: הנגזרת של $${c * a}\\ln|${inner}|$ היא $\\dfrac{${c * a * a}}{${inner}}$, לא $\\dfrac{${c}}{${inner}}$.`,
        `זו גזירה, לא אינטגרציה. הביטוי הזה קרוב לנגזרת של הפונקציה המקורית; קדומה של שבר עם מכנה ליניארי מדרגה ראשונה היא לוגריתם.`,
      ],
      hint: 'המכנה ליניארי ונגזרתו קבועה. הפוך את המונה לנגזרת המכנה ותקן במקדם.',
      solution: {
        steps: [
          '**הכלל:** המונה קבוע והמכנה ליניארי, ולכן זה אינטגרל מהצורה נגזרת המכנה חלקי המכנה, שנותן לוגריתם של המכנה בערך מוחלט, עם תיקון מקדם כי נגזרת המכנה אינה בדיוק המונה.',
          `**הנוסחה:** $\\int \\dfrac{g\'(x)}{g(x)}\\,dx = \\ln|g(x)| + C$ עם $g(x) = ${inner}$, $g\'(x) = ${a}$.`,
          `מתקנים מקדם: $\\int \\dfrac{${c}}{${inner}}\\,dx = \\dfrac{${c}}{${a}} \\int \\dfrac{${a}}{${inner}}\\,dx$.`,
          `לכן התוצאה היא $\\dfrac{${c}}{${a}}\\ln|${inner}| + C$.`,
        ],
        finalAnswer: right,
        explanation: 'כשהמונה הוא כפולה קבועה של נגזרת המכנה, הקדומה היא לוגריתם כפול היחס בין המקדמים.',
      },
    });
  },
};

const intArea: GenTemplate = {
  id: 'ln-int-area-recip',
  wrongAnswerTags: ['dropped-factor', 'sign-slip', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ln-integrals',
  title: 'שטח מתחת לגרף של מספר חלקי ביטוי ליניארי',
  skill: 'substitution',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    // ∫_{x1}^{x2} k/(bx + a) dx = (k/b)(ln(bx2 + a) - ln(bx1 + a)) = (k/b) ln m
    // with bx1 + a = D and bx2 + a = m·D so the answer is a single clean ln.
    const b = difficulty === 'hard' ? rng.int(2, 3) : 1;
    const k = difficulty === 'easy' ? rng.int(2, 4) : pickInt(rng, 2, 6, [b]);
    const m = rng.int(2, difficulty === 'easy' ? 5 : 6);
    const d = rng.int(1, difficulty === 'easy' ? 3 : 4);
    const D = b * d;
    const x1 = difficulty === 'easy' ? d : rng.int(1, 4);
    const a = D - b * x1;
    const x2 = x1 + d * (m - 1); // b·x2 + a = m·D
    const inner = lin(b, a);
    const coef = new Frac(k, b);
    const mD = m * D;

    const right = `$S = ${coefTex(coef)}\\ln ${m}$`;
    return open({
      question: rng.chance(0.5)
        ? `חשב את השטח המוגבל בין הגרף של $f(x) = \\dfrac{${k}}{${inner}}$, ציר ה-$x$ והישרים $x = ${x1}$ ו-$x = ${x2}$.`
        : `חשב את האינטגרל $\\int_{${x1}}^{${x2}} \\dfrac{${k}}{${inner}}\\,dx$.`,
      expected: { kind: 'value', value: `${coef.expr()}*log(${m})` },
      wrongAnswers: [
        {
          value: `log(${m})`,
          note: `המקדם ${b === 1 ? `$${k}$ נשמט. הוא נשאר לאורך כל האינטגרל ומכפיל את התוצאה` : `אבד. המונה $${k}$ נשאר, ונגזרת המכנה $${b}$ מחייבת חלוקה ב-$${b}$, ולכן הלוגריתם מוכפל ב-$${coef.tex()}$`}.`,
        },
        {
          value: `-${coef.expr()}*log(${m})`,
          note: `סדר ההצבה התהפך. באינטגרל מסוים מציבים את הגבול העליון ומחסרים את התחתון: $\\ln ${mD} - \\ln ${D}$, ושטח תמיד חיובי.`,
        },
        {
          value: coef.mul(new Frac(m - 1, mD)).expr(),
          note: `הופעל כלל החזקה על $(${inner})^{-1}$, אבל הכלל הזה קורס עבור חזקה $-1$ (מכנה אפס). דווקא שם הקדומה היא לוגריתם: $\\ln|${inner}|$.`,
        },
      ],
      hint: 'הקדומה של מספר חלקי ביטוי ליניארי היא לוגריתם. הצב גבולות וכנס להפרש לוגריתמים אחד.',
      solution: {
        steps: [
          '**הכלל:** שטח בין גרף חיובי לציר ה-$x$ הוא האינטגרל המסוים בין הגבולות, וקדומה של מספר חלקי ביטוי ליניארי היא לוגריתם של המכנה חלקי נגזרת המכנה.',
          `**הנוסחה:** $\\int_{${x1}}^{${x2}} \\dfrac{${k}}{${inner}}\\,dx = \\left[ ${coefTex(coef)}\\ln|${inner}| \\right]_{${x1}}^{${x2}}$.`,
          `**ההצבה:** $${coefTex(coef)}\\ln ${mD} - ${coefTex(coef)}\\ln ${D} = ${coefTex(coef)}\\ln\\dfrac{${mD}}{${D}}$.`,
          `מצמצמים: $\\dfrac{${mD}}{${D}} = ${m}$.`,
        ],
        finalAnswer: right,
        explanation: 'הפרש לוגריתמים הוא לוגריתם של המנה, ולכן התשובה מתכנסת ללוגריתם יחיד.',
      },
    });
  },
};

export const LN_TEMPLATES: GenTemplate[] = [
  domLinear,
  lawsSimplify,
  derChainPoint,
  derProductXlnx,
  eqRaiseToE,
  eqExtraRoot,
  invExtremum,
  invXIntercept,
  intIndefinite,
  intArea,
];
