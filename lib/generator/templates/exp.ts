/**
 * generator/templates/exp.ts — parameterised repair questions for פונקציה מעריכית
 * (sub-topics `exp-derivatives`, `exp-equations`, `exp-investigation`, `exp-integrals`).
 *
 * Same contract as functions.ts: `**הכלל:**` opens every solution and never
 * contains the answer, no Hebrew inside `$…$`, every distractor is a NAMED
 * mistake with a note, and `build` is pure in (rng, difficulty).
 *
 * Answers stay EXACT: `3*exp(2)`, `log(3)` (natural log in mathjs), `(exp(6)-1)/3`.
 * `lib/answer-check` accepts `3e^2`, `ln 3`, `(e^6-1)/3` from the student for the same.
 */

import { Frac, type Rng } from '../rng';
import { mcq, open } from './shared';
import type { GenTemplate } from '../types';

const TOPIC = 'פונקציה מעריכית';
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

/** `e^{n}` as LaTeX with the two trivial powers folded: e^0 → `1`, e^1 → `e`. */
const eTex = (n: number) => (n === 0 ? '1' : n === 1 ? 'e' : `e^{${n}}`);

/** `e^{n}` for `expected` (mathjs). */
const eExpr = (n: number) => (n === 0 ? '1' : `exp(${n})`);

/** `c · e^{n}` as LaTeX: `3e^{2}`, `-e^{4}`, `5` (when n = 0). */
function cE(c: number, n: number): string {
  if (n === 0) return String(c);
  const coef = c === 1 ? '' : c === -1 ? '-' : String(c);
  return `${coef}${eTex(n)}`;
}

/** Coefficient prefix for a LaTeX term: 1 → '', -1 → '-', else the number. */
const coef = (c: number) => (c === 1 ? '' : c === -1 ? '-' : String(c));

// ---------------------------------------------------------------------------
// 1 · exp-derivatives
// ---------------------------------------------------------------------------

const derChainPoint: GenTemplate = {
  id: 'exp-der-chain-point',
  wrongAnswerTags: ['dropped-factor', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'exp-derivatives',
  title: 'שיפוע המשיק לפונקציה מעריכית עם כלל השרשרת',
  skill: 'substitution',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const a = difficulty === 'hard' ? pickInt(rng, -5, 5, [1, -1]) : rng.int(2, difficulty === 'easy' ? 3 : 5);
    // c = a·x0 + b is the exponent at the point. c = 1 makes two wrong answers
    // collide (e^1 vs 1·e^1) and c = a makes one of them the right answer.
    const c = pickInt(rng, -3, 4, [1, a]) || (difficulty === 'hard' ? 0 : 2);
    const x0 = difficulty === 'easy' ? rng.int(0, 3) : rng.int(-3, 3);
    const b = c - a * x0;
    const fx = `e^{${lin(a, b)}}`;

    return open({
      question: rng.chance(0.5)
        ? `נתונה הפונקציה $f(x) = ${fx}$. מצא את שיפוע המשיק לגרף הפונקציה בנקודה שבה $x = ${x0}$.`
        : `נתונה הפונקציה $f(x) = ${fx}$. חשב את $f'(${x0})$.`,
      expected: { kind: 'value', value: c === 0 ? String(a) : `${a}*exp(${c})` },
      wrongAnswers: [
        {
          value: eExpr(c),
          note: `נשמטה הנגזרת הפנימית. הנגזרת של $${fx}$ היא $${a}${fx}$, כי גוזרים את המעריך $${lin(a, b)}$ ומקבלים $${a}$, וזה מכפיל את הכל.`,
        },
        {
          value: c === 0 ? '0' : `${c}*exp(${c})`,
          note: `הוכפל בערך המעריך במקום בנגזרתו. נגזרת המעריך $${lin(a, b)}$ היא הקבוע $${a}$, ולא הערך $${c}$ שהמעריך מקבל בנקודה.`,
        },
      ],
      hint: `כלל השרשרת: גוזרים את המעריך ומכפילים. אחר כך מציבים $x = ${x0}$.`,
      solution: {
        steps: [
          '**הכלל:** מבוקש שיפוע משיק, ולכן גוזרים ומציבים את הנקודה בנגזרת, וכאן המעריך הוא ביטוי ליניארי ולכן גוזרים בכלל השרשרת: מכפילים בנגזרת המעריך.',
          `**הנוסחה:** נגזרת המעריך היא $(${lin(a, b)})' = ${a}$, ולכן $f'(x) = ${a}${fx}$.`,
          `**ההצבה:** $f'(${x0}) = ${a}e^{${a * x0 + b}}$${c === 0 ? ` $= ${a} \\cdot 1 = ${a}$` : ''}.`,
        ],
        finalAnswer: `$f'(${x0}) = ${cE(a, c)}$`,
        explanation: 'שיפוע המשיק בנקודה הוא ערך הנגזרת באותה נקודה.',
      },
    });
  },
};

const derProductPoint: GenTemplate = {
  id: 'exp-der-product-point',
  wrongAnswerTags: ['dropped-factor', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'exp-derivatives',
  title: 'נגזרת של מכפלה עם פונקציה מעריכית בנקודה',
  skill: 'formula-choice',
  difficulties: ['mid', 'hard'],
  build(rng, difficulty) {
    // f(x) = x·e^{ax}, f' = e^{ax}(1 + ax). a ≠ 1 so "forgot the chain factor"
    // does not coincide with the right answer.
    const a = difficulty === 'hard' ? pickInt(rng, -3, 4, [1, -1]) : rng.int(2, 4);
    // x0 ≠ 0: at zero "forgot the chain factor" evaluates to the right answer.
    // |a·x0| stays ≤ 12: at e^{-20} every candidate is within the grader's 1e-7 of zero.
    const x0 = pickInt(rng, -3, 3);
    const n = a * x0; // exponent at the point
    const m = 1 + n; // the bracket (1 + a·x0), never 0 for integer a ≠ ±1
    const ekx = `e^{${lin(a, 0)}}`;
    const fx = rng.chance(0.5) ? `x ${ekx}` : `x \\cdot ${ekx}`;
    const dEkx = a < 0 ? `(${a}${ekx})` : `${a}${ekx}`; // derivative of e^{ax}, wrapped if negative
    const bracket = `(1 ${a < 0 ? '-' : '+'} ${lin(Math.abs(a), 0)})`;
    const bracketAt = `(1 ${n < 0 ? '-' : '+'} ${Math.abs(n)})`;

    return open({
      question: rng.chance(0.5)
        ? `נתונה הפונקציה $f(x) = ${fx}$. חשב את $f'(${x0})$.`
        : `נתונה הפונקציה $f(x) = ${fx}$. מצא את שיפוע המשיק לגרף הפונקציה בנקודה שבה $x = ${x0}$.`,
      expected: { kind: 'value', value: n === 0 ? String(m) : `${m}*exp(${n})` },
      wrongAnswers: [
        {
          value: n === 0 ? String(n) : `${n}*exp(${n})`,
          note: `נשמט האיבר הראשון של כלל המכפלה. הנגזרת של $x$ היא $1$, ולכן $f'(x) = 1 \\cdot ${ekx} + x \\cdot ${dEkx}$, ולא רק האיבר השני.`,
        },
        {
          value: x0 + 1 === 0 ? '0' : `${x0 + 1}*${eExpr(n)}`,
          note: `נשמט כלל השרשרת בגזירת $${ekx}$. הנגזרת שלו היא $${dEkx}$, ולכן בסוגריים מתקבל $${bracket}$ ולא $(1 + x)$.`,
        },
      ],
      hint: 'כלל המכפלה, ובגזירת המעריכית לא לשכוח להכפיל בנגזרת המעריך. אחר כך להוציא גורם משותף ולהציב.',
      solution: {
        steps: [
          '**הכלל:** הפונקציה היא מכפלה של פולינום במעריכית, ולכן גוזרים בכלל המכפלה, גוזרים את המעריכית בכלל השרשרת, ומוציאים את המעריכית כגורם משותף לפני ההצבה.',
          `**הנוסחה:** $f'(x) = 1 \\cdot ${ekx} + x \\cdot ${dEkx} = ${ekx}${bracket}$.`,
          `**ההצבה:** $f'(${x0}) = e^{${n}}${bracketAt} = ${cE(m, n)}$.`,
        ],
        finalAnswer: `$f'(${x0}) = ${cE(m, n)}$`,
        explanation: 'הוצאת המעריכית כגורם משותף משאירה סוגריים ליניאריים שקל להציב בהם.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 2 · exp-equations
// ---------------------------------------------------------------------------

const eqSameBase: GenTemplate = {
  id: 'exp-eq-same-base',
  distractorTags: [null, 'sign-slip', 'formula-mismatch', 'exponent-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'exp-equations',
  title: 'משוואה מעריכית עם בסיס משותף',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const base = rng.pick(difficulty === 'easy' ? [2, 3] : [2, 3, 5]);
    const n = rng.int(1, difficulty === 'hard' ? 4 : 3); // RHS = base^n
    const p = difficulty === 'easy' ? 1 : difficulty === 'mid' ? rng.int(1, 2) : rng.int(2, 3);
    // Root x0 ≠ n (else "x = the exponent" is right), q ≠ 0 (else the sign slip is right).
    const x0 = pickInt(rng, -4, 4, [n]) || (n === -1 ? 1 : -1);
    const q = n - p * x0;
    if (q === 0) return null;
    const rhs = base ** n;

    const signSlip = new Frac(n + q, p);
    const treatedAsExponent = new Frac(rhs - q, p);
    const answers = [`$x = ${x0}$`, `$x = ${signSlip.tex()}$`, `$x = ${treatedAsExponent.tex()}$`, `$x = ${n}$`];

    return mcq({
      question: `פתור את המשוואה $${base}^{${lin(p, q)}} = ${rhs}$.`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        `הסימן של $${q}$ לא התהפך בהעברת האגף. מהמשוואה $${lin(p, q)} = ${n}$ מקבלים $${p === 1 ? 'x' : `${p}x`} = ${n - q}$, ולכן $x = ${x0}$.`,
        `האגף הימני נלקח כמעריך כמו שהוא. המספר $${rhs}$ הוא הערך של החזקה, ולפני ההשוואה יש לכתוב אותו כחזקה של $${base}$: $${rhs} = ${base}^{${n}}$.`,
        `המעריך $${n}$ נלקח כתשובה. הוא שווה לביטוי $${lin(p, q)}$ כולו, ולא ל-$x$ עצמו; עוד צריך לפתור את המשוואה הליניארית.`,
      ],
      hint: `כתוב את $${rhs}$ כחזקה של $${base}$, ואז השווה מעריכים.`,
      solution: {
        steps: [
          '**הכלל:** בשני האגפים אפשר להגיע לאותו בסיס, ולכן כותבים את המספר כחזקה של הבסיס ומשווים מעריכים, כי פונקציה מעריכית היא חד-חד-ערכית.',
          `**הנוסחה:** $${rhs} = ${base}^{${n}}$, ולכן $${base}^{${lin(p, q)}} = ${base}^{${n}}$.`,
          `משווים מעריכים: $${lin(p, q)} = ${n}$.`,
          `מעבירים אגף: $${p === 1 ? 'x' : `${p}x`} = ${n - q}$${p === 1 ? '' : `, ולכן $x = ${x0}$`}.`,
        ],
        finalAnswer: answers[0],
        explanation: 'בסיסים שווים גוררים מעריכים שווים.',
      },
    });
  },
};

const eqQuadratic: GenTemplate = {
  id: 'exp-eq-quadratic-sub',
  wrongAnswerTags: ['partial-answer', 'sign-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'exp-equations',
  title: 'משוואה מעריכית ריבועית בהצבה',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    // (t - t1)(k·t - 1) = 0 with t = e^x. On easy/mid k = 1 (two integer roots);
    // on hard k ∈ {2,3} gives the root 1/k and a negative log.
    // t1 ≠ k on hard: with t1 = k the sign-flipped set equals the right one.
    const k = difficulty === 'hard' ? rng.int(2, 4) : 1;
    const hi = difficulty === 'easy' ? 9 : 12;
    const t1 = pickInt(rng, 2, hi, [k]);
    const t2 = k === 1 ? pickInt(rng, 2, hi, [t1]) : 0;
    if (k === 1 && t2 === 0) return null;
    const factored = `(t - ${t1})(${coef(k)}t - ${k === 1 ? t2 : 1})`;
    // Expanded: k t² - (k t1 + 1) t + t1   (k=1, root t2: t² - (t1+t2) t + t1 t2)
    const B = k === 1 ? t1 + t2 : k * t1 + 1;
    const C = k === 1 ? t1 * t2 : t1;
    const lhs = `${coef(k)}e^{2x} - ${B}e^{x} + ${C}`;

    const root2Expr = k === 1 ? `log(${t2})` : `-log(${k})`;
    const root2Tex = k === 1 ? `\\ln ${t2}` : `-\\ln ${k}`;
    const wrongT = k === 1 ? `${t1}, ${t2}` : `${t1}, 1/${k}`;

    return open({
      question: rng.chance(0.5) ? `פתור את המשוואה $${lhs} = 0$.` : `מצא את כל הפתרונות של המשוואה $${lhs} = 0$.`,
      expected: { kind: 'set', values: [`log(${t1})`, root2Expr] },
      wrongAnswers: [
        {
          value: wrongT,
          note: `אלו ערכי $t = e^x$, לא ערכי $x$. אחרי ההצבה חוזרים למשתנה המקורי: מ-$e^x = t$ מקבלים $x = \\ln t$.`,
        },
        {
          value: `-log(${t1}), ${k === 1 ? `-log(${t2})` : `log(${k})`}`,
          note: `הסימנים של השורשים התהפכו. הפירוק הוא $${factored} = 0$, ולכן $t = ${t1}$ ולא $t = ${-t1}$.`,
        },
      ],
      hint: 'זו משוואה ריבועית מוסווית. הצב t במקום e^x, פתור, ואז חזור ל-x עם ln.',
      solution: {
        steps: [
          '**הכלל:** המשוואה מכילה את $e^{2x}$ ואת $e^{x}$ בלבד, ולכן מציבים משתנה חדש במקום $e^x$, פותרים משוואה ריבועית, פוסלים שורש שאינו חיובי וחוזרים ל-$x$ בעזרת לוגריתם טבעי.',
          `**ההצבה:** $t = e^x$ עם $t > 0$, ומקבלים $${coef(k)}t^2 - ${B}t + ${C} = 0$.`,
          `פירוק: $${factored} = 0$, ולכן $t = ${t1}$ או $t = ${k === 1 ? t2 : `\\dfrac{1}{${k}}`}$, שניהם חיוביים.`,
          `חזרה למשתנה: $e^x = ${t1}$ נותן $x = \\ln ${t1}$, ו-$e^x = ${k === 1 ? t2 : `\\dfrac{1}{${k}}`}$ נותן $x = ${root2Tex}$.`,
        ],
        finalAnswer: `$x = \\ln ${t1}$ או $x = ${root2Tex}$`,
        explanation: 'הצבה הופכת משוואה מעריכית לריבועית; החזרה ל-x היא לוגריתם טבעי של כל שורש חיובי.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 3 · exp-investigation
// ---------------------------------------------------------------------------

const invExtremumX: GenTemplate = {
  id: 'exp-inv-extremum-x',
  wrongAnswerTags: ['dropped-factor', 'sign-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'exp-investigation',
  title: 'שיעור ה-x של נקודת הקיצון של פולינום כפול מעריכית',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    // f(x) = (x + c)e^{kx}, f' = e^{kx}(k x + k c + 1) = 0 → x = -(kc + 1)/k.
    const k = difficulty === 'easy' ? rng.int(1, 3) : difficulty === 'mid' ? pickInt(rng, -3, 3) : pickInt(rng, -5, 5, [1, -1]);
    const c = rng.int(-6, 6);
    const xStar = new Frac(-(k * c + 1), k);
    const poly = c === 0 ? 'x' : `(${lin(1, c)})`;
    const ekx = `e^{${lin(k, 0)}}`;
    const dEkx = k < 0 ? `(${coef(k)}${ekx})` : `${coef(k)}${ekx}`;
    const bracket = lin(k, k * c + 1);

    return open({
      question: rng.chance(0.5)
        ? `לפונקציה $f(x) = ${poly}${ekx}$ יש נקודת קיצון אחת. מצא את שיעור ה-$x$ שלה.`
        : `נתונה הפונקציה $f(x) = ${poly}${ekx}$. מצא את שיעור ה-$x$ של נקודת הקיצון של הפונקציה.`,
      expected: { kind: 'value', value: xStar.expr() },
      wrongAnswers: [
        {
          value: String(-c),
          note: `נשמט האיבר הראשון של כלל המכפלה. הנגזרת של $${poly}$ היא $1$, ולכן $f'(x) = ${ekx} + ${poly} \\cdot ${dEkx}$, והאיבר $${ekx}$ מזיז את המאפס.`,
        },
        {
          value: new Frac(-(k * c) + 1, k).expr(),
          note: `סימן שגוי בפתרון המשוואה הליניארית. מ-$${bracket} = 0$ מעבירים אגף ומקבלים $${coef(k)}x = ${-(k * c + 1)}$, ורק אז מחלקים ב-$${k}$.`,
        },
      ],
      hint: 'גזור בכלל המכפלה, הוצא את המעריכית כגורם משותף, והשווה את הסוגריים לאפס.',
      solution: {
        steps: [
          '**הכלל:** מבוקשת נקודת קיצון, ולכן גוזרים בכלל המכפלה, מוציאים את המעריכית כגורם משותף, ומשווים לאפס רק את הסוגריים, כי מעריכית לעולם אינה מתאפסת.',
          `**הנוסחה:** $f'(x) = 1 \\cdot ${ekx} + ${poly} \\cdot ${dEkx} = ${ekx}(${bracket})$.`,
          `$${ekx} > 0$ תמיד, ולכן $${bracket} = 0$.`,
          `מעבירים אגף: $${coef(k)}x = ${-(k * c + 1)}$, ולכן $x = ${xStar.tex()}$.`,
        ],
        finalAnswer: `$x = ${xStar.tex()}$`,
        explanation: 'המעריכית מוצאת כגורם משותף ונפסלת כמאפס; הסוגריים הליניאריים נותנים את הקיצון.',
      },
    });
  },
};

const invAsymptote: GenTemplate = {
  id: 'exp-inv-asymptote',
  distractorTags: [null, 'formula-mismatch', 'condition-ignored', 'values-swapped'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'exp-investigation',
  title: 'אסימפטוטה אופקית של פונקציה מעריכית מוזזת',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    // f(x) = a·e^{kx} + c → y = c. Distractors: a + c (plugged x = 0), 0 (ignored the
    // shift), a (kept the coefficient). Distinct iff c ∉ {0, a, -a}.
    const a = difficulty === 'easy' ? rng.int(1, 5) : pickInt(rng, -5, 5);
    const k = difficulty === 'hard' ? pickInt(rng, -3, 3) : difficulty === 'mid' ? pickInt(rng, -2, 2) : 1;
    const c = pickInt(rng, -8, 8, [a, -a]) || (a === 2 ? 3 : 2);
    const fx = `${coef(a)}e^{${lin(k, 0)}} ${c > 0 ? '+' : '-'} ${Math.abs(c)}`;
    const side = k > 0 ? 'מינוס אינסוף' : 'אינסוף';

    const answers = [`$y = ${c}$`, `$y = ${a + c}$`, '$y = 0$', `$y = ${a}$`];
    return mcq({
      question: rng.chance(0.5)
        ? `מהי האסימפטוטה האופקית של $f(x) = ${fx}$?`
        : `נתונה הפונקציה $f(x) = ${fx}$. מהי משוואת האסימפטוטה האופקית של הגרף?`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        `זהו $f(0)$, נקודת החיתוך עם ציר ה-$y$, ולא אסימפטוטה. אסימפטוטה אופקית מתארת לאן הפונקציה שואפת כאשר $x$ רחוק מאוד, לא את ערכה באפס.`,
        `נשכחה ההזזה. הכלל $y = 0$ תקף ל-$e^{x}$ עצמה; כאן נוסף הקבוע $${c > 0 ? c : `(${c})`}$ שמזיז את כל הגרף ואת האסימפטוטה איתו.`,
        `המקדם $${a}$ נלקח כאסימפטוטה. הוא מכפיל את המעריכית, שדועכת לאפס, ולכן $${a} \\cdot 0 = 0$, ונשאר רק הקבוע החופשי.`,
      ],
      hint: 'לאן שואפת המעריכית כאשר x שואף לאינסוף או למינוס אינסוף? מה נשאר מהביטוי?',
      solution: {
        steps: [
          '**הכלל:** מעריכית שואפת לאפס בצד אחד של הציר, ולכן האסימפטוטה האופקית של מעריכית כפול מקדם ועוד קבוע היא הקבוע החופשי, בכיוון שבו המעריך שואף למינוס אינסוף.',
          `כאשר $x$ שואף ל${side}, המעריך $${lin(k, 0)}$ שואף למינוס אינסוף, ולכן $${coef(a)}e^{${lin(k, 0)}}$ שואף לאפס.`,
          `נשאר הקבוע: $f(x)$ שואף ל-$${c}$.`,
        ],
        finalAnswer: answers[0],
        explanation: 'המעריכית דועכת לאפס והקבוע החופשי הוא מה שנשאר.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 4 · exp-integrals
// ---------------------------------------------------------------------------

const intAntiderivative: GenTemplate = {
  id: 'exp-int-antiderivative',
  distractorTags: [null, 'formula-mismatch', 'dropped-factor', 'values-swapped'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'exp-integrals',
  title: 'אינטגרל לא מסוים של מעריכית עם מעריך ליניארי',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    // ∫ a e^{kx+b} dx = (a/k) e^{kx+b} + C. a ≥ 2 and a ≠ k keep the four options
    // apart (a = 1 makes a·k and k/a coincide; a² = k makes a and k/a coincide).
    const k = difficulty === 'easy' ? rng.int(2, 3) : difficulty === 'mid' ? rng.int(2, 4) : pickInt(rng, -4, 4, [1, -1]);
    const a = pickInt(rng, 2, 6, [k, -k, k === 4 ? 2 : 0, k === -4 ? 2 : 0]);
    const b = difficulty === 'easy' ? rng.int(0, 5) : rng.int(-5, 5);
    const ex = `e^{${lin(k, b)}}`;
    const term = (f: Frac) => `$${f.isInt ? coef(f.n) : f.tex()}${ex} + C$`;

    const f = new Frac(a, k);
    const answers = [term(f), term(new Frac(a * k)), term(new Frac(a)), term(new Frac(k, a))];
    return mcq({
      question: `מהו $\\int ${a}${ex}\\,dx$?`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        `הוכפל במקדם המעריך במקום לחלק בו. זו נוסחת הגזירה, לא האינטגרל; גזירה חוזרת של האפשרות הזו נותנת $${a * k * k}${ex}$, ולא את האינטגרנד.`,
        `נשמט החילוק ב-$${k}$. גזירה חוזרת של $${a}${ex}$ נותנת $${a * k}${ex}$, פי $${Math.abs(k)}$ מהאינטגרנד.`,
        `המקדם ומקדם המעריך התחלפו. המקדם $${a}$ נשאר כמו שהוא, ומחלקים אותו במקדם של $x$ במעריך, שהוא $${k}$.`,
      ],
      hint: 'הקדומה של מעריכית עם מעריך ליניארי היא אותה מעריכית חלקי המקדם של x. בדוק בגזירה חוזרת.',
      solution: {
        steps: [
          '**הכלל:** המעריך ליניארי, ולכן האינטגרל של המעריכית הוא אותה מעריכית חלקי המקדם של $x$ במעריך, והמקדם שמלפנים נשאר כפי שהוא.',
          `**הנוסחה:** $\\int ${a}${ex}\\,dx = ${a} \\cdot \\dfrac{1}{${k}}${ex} + C$.`,
          `בדיקה בגזירה: $\\left(${f.tex()}${ex}\\right)' = ${f.tex()} \\cdot ${k}${ex} = ${a}${ex}$.`,
        ],
        finalAnswer: answers[0],
        explanation: 'באינטגרל מחלקים במקדם של x במעריך; בגזירה מכפילים בו.',
      },
    });
  },
};

const intDefinite: GenTemplate = {
  id: 'exp-int-definite',
  wrongAnswerTags: ['dropped-factor', 'sign-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'exp-integrals',
  title: 'אינטגרל מסוים של מעריכית',
  skill: 'substitution',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    // ∫_{x1}^{x2} a e^{kx} dx = (a/k)(e^{k x2} - e^{k x1}). k ≠ 1 so "forgot 1/k" differs.
    const k = difficulty === 'easy' ? rng.int(2, 3) : difficulty === 'mid' ? rng.int(2, 4) : pickInt(rng, -3, 4, [1, -1]);
    const a = difficulty === 'hard' ? pickInt(rng, 2, 6, [k, -k]) : 1;
    const x1 = rng.int(0, difficulty === 'easy' ? 2 : 3);
    const x2 = x1 + rng.int(1, 3);
    const [n2, n1] = [k * x2, k * x1];
    const f = new Frac(a, k);
    const ex = `e^{${lin(k, 0)}}`;
    const integrand = `${coef(a)}${ex}`;

    const diffExpr = `(${eExpr(n2)} - ${eExpr(n1)})`;
    const diffTex = `\\left(${eTex(n2)} - ${eTex(n1)}\\right)`;
    const resultTex = f.isInt ? `${coef(f.n)}${diffTex}` : `${f.tex()}${diffTex}`;

    return open({
      question: rng.chance(0.5)
        ? `חשב את האינטגרל $\\int_{${x1}}^{${x2}} ${integrand}\\,dx$. השאר את התשובה כביטוי מדויק.`
        : `חשב את השטח המוגבל בין הגרף של $f(x) = ${integrand}$, ציר ה-$x$ והישרים $x = ${x1}$ ו-$x = ${x2}$. השאר את התשובה כביטוי מדויק.`,
      expected: { kind: 'value', value: `${f.expr()}*${diffExpr}` },
      wrongAnswers: [
        {
          value: `${a}*${diffExpr}`,
          note: `נשמט החילוק במקדם המעריך. הקדומה של $${ex}$ היא $\\dfrac{1}{${k}}${ex}$, ולא $${ex}$; בדיקה בגזירה חוזרת מאשרת.`,
        },
        {
          value: `${f.expr()}*(${eExpr(n1)} - ${eExpr(n2)})`,
          note: `סדר הגבולות התהפך. הכלל הוא ערך הקדומה בגבול העליון פחות ערכה בגבול התחתון: $F(${x2}) - F(${x1})$.`,
        },
      ],
      hint: 'מצא קדומה (חלקי המקדם של x), הצב את הגבול העליון ופחות את התחתון.',
      solution: {
        steps: [
          '**הכלל:** אינטגרל מסוים של מעריכית עם מעריך ליניארי מחושב מהקדומה, שהיא המעריכית חלקי המקדם של $x$, בהצבת הגבול העליון פחות הגבול התחתון.',
          `**הנוסחה:** הקדומה היא $${f.tex()}${ex}$, ולכן $\\int_{${x1}}^{${x2}} ${integrand}\\,dx = \\left[${f.tex()}${ex}\\right]_{${x1}}^{${x2}}$.`,
          `**ההצבה:** גבול עליון פחות גבול תחתון: $${resultTex}$${n1 === 0 ? ', כאשר $e^{0} = 1$' : ''}.`,
        ],
        finalAnswer: `$${resultTex}$`,
        explanation: 'התשובה נשארת כביטוי מדויק עם e; מספר עשרוני מעוגל אינו תשובה סופית.',
      },
    });
  },
};

export const EXP_TEMPLATES: GenTemplate[] = [
  derChainPoint,
  derProductPoint,
  eqSameBase,
  eqQuadratic,
  invExtremumX,
  invAsymptote,
  intAntiderivative,
  intDefinite,
];
