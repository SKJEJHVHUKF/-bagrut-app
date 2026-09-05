/**
 * generator/templates/algebra.ts — parameterised repair questions for אלגברה
 * (sub-topics quadratic-equations, discriminant-parameter, radical-rational,
 * inequalities).
 *
 * Same contract as functions.ts: `**הכלל:**` opens every solution and never
 * contains the answer, no Hebrew inside `$…$`, every distractor is a NAMED
 * mistake with a note, and `build` is pure in (rng, difficulty).
 *
 * Every instance is built FROM ITS ROOTS: the coefficients are derived, so
 * integer solutions, a surviving radical root and a rejected one, or a
 * denominator root that must be excluded, all hold by construction.
 */

import { Frac, type Rng } from '../rng';
import { mcq, open } from './shared';
import type { GenTemplate } from '../types';

const TOPIC = 'אלגברה';
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

/** `ax² + bx + c` as LaTeX with zero terms dropped and unit coefficients folded. */
function quad(a: number, b: number, c: number): string {
  let s = a === 1 ? 'x^2' : a === -1 ? '-x^2' : `${a}x^2`;
  if (b !== 0) {
    const m = Math.abs(b) === 1 ? '' : String(Math.abs(b));
    s += b > 0 ? ` + ${m}x` : ` - ${m}x`;
  }
  if (c !== 0) s += c > 0 ? ` + ${c}` : ` - ${-c}`;
  return s;
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

/** Two roots as the exam writes them, smaller first. */
function pair(u: number, v: number): string {
  const [l, h] = [u, v].sort((x, y) => x - y);
  return `$x = ${l}$ או $x = ${h}$`;
}

/** Two distinct integer roots; on easy both positive, otherwise q ≠ ±p. */
function roots(rng: Rng, difficulty: string, hi = 9): [number, number] {
  const lo = difficulty === 'easy' ? 1 : -hi;
  const p = pickInt(rng, lo, hi);
  const q = pickInt(rng, lo, hi, [p, -p]);
  return [p, q];
}

// ---------------------------------------------------------------------------
// 1 · quadratic-equations
// ---------------------------------------------------------------------------

const quadRoots: GenTemplate = {
  id: 'alg-quad-roots',
  wrongAnswerTags: ['sign-slip', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'quadratic-equations',
  title: 'פתרון משוואה ריבועית עם שורשים שלמים',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const [p, q] = roots(rng, difficulty);
    if (!p || !q) return null;
    const a = difficulty === 'hard' ? rng.int(2, 3) : 1;
    const b = -a * (p + q);
    const c = a * p * q;
    const eq = `${quad(a, b, c)} = 0`;
    const [l, h] = [p, q].sort((x, y) => x - y);

    const disc = b * b - 4 * a * c; // = a²(p-q)²
    const sq = a * Math.abs(p - q);
    const steps =
      a === 1
        ? [
            '**הכלל:** משוואה ריבועית שמקדם $x^2$ שלה הוא אחד והשורשים שלה שלמים פותרים בפירוק לגורמים: מחפשים זוג מספרים שמכפלתו האיבר החופשי וסכומו מינוס המקדם של $x$.',
            `מחפשים זוג שמכפלתו $${c}$ וסכומו $${-b}$: $${l}$ ו-$${h}$.`,
            `**הפירוק:** $${factor(l)}${factor(h)} = 0$.`,
            `כל גורם מתאפס בנפרד: $x = ${l}$ או $x = ${h}$.`,
          ]
        : [
            '**הכלל:** משוואה ריבועית שמקדם $x^2$ שלה שונה מאחד פותרים בנוסחת השורשים, ומציבים בה את שלושת המקדמים בסימניהם.',
            '**הנוסחה:** $x = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.',
            `**ההצבה:** $\\Delta = (${b})^2 - 4 \\cdot ${a} \\cdot (${c}) = ${disc}$, ולכן $\\sqrt{\\Delta} = ${sq}$.`,
            `$x = \\dfrac{${-b} \\pm ${sq}}{${2 * a}}$, כלומר $x = ${l}$ או $x = ${h}$.`,
          ];

    return open({
      question: rng.chance(0.5) ? `פתור את המשוואה $${eq}$.` : `מצא את כל הפתרונות של המשוואה $${eq}$.`,
      expected: { kind: 'set', values: [String(p), String(q)] },
      wrongAnswers: [
        {
          value: `${-p}, ${-q}`,
          note: `הסימנים של השורשים התהפכו. הגורם $${factor(l)}$ מתאפס כאשר $x = ${l}$, לא כאשר $x = ${-l}$; הצבת $x = ${-l}$ במשוואה אינה נותנת אפס.`,
        },
        {
          value: `${-b}, ${c}`,
          note: `אלה סכום השורשים ומכפלתם (או המקדמים עצמם), לא השורשים. הזוג שמכפלתו $${c}$ וסכומו $${-b}$ הוא $${l}$ ו-$${h}$, והם הפתרונות.`,
        },
      ],
      hint: a === 1 ? 'חפש זוג מספרים שמכפלתו האיבר החופשי וסכומו מינוס המקדם של x.' : 'נוסחת השורשים. שים לב לסימנים של b ו-c בהצבה.',
      solution: {
        steps,
        finalAnswer: pair(p, q),
        explanation: 'מכפלת גורמים שווה אפס בדיוק כשאחד הגורמים מתאפס, ולכן כל שורש הוא פתרון בנפרד.',
      },
    });
  },
};

const quadMcq: GenTemplate = {
  id: 'alg-quad-factor-mcq',
  distractorTags: [null, 'sign-slip', 'formula-mismatch', 'sign-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'quadratic-equations',
  title: 'זיהוי השורשים של משוואה ריבועית',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const [p, q] = roots(rng, difficulty, 8);
    if (!p || !q) return null;
    const b = -(p + q);
    const c = p * q;
    const [l, h] = [p, q].sort((x, y) => x - y);
    const right = pair(p, q);

    return mcq({
      question: `פתור: $${quad(1, b, c)} = 0$.`,
      answers: [right, pair(-p, -q), pair(-b, c), pair(p, -q)],
      correct: 0,
      distractorNotes: [
        '',
        `הסימנים התהפכו. הזוג $${-l}$ ו-$${-h}$ נותן מכפלה $${c}$ אך סכום $${b}$, ואילו נדרש סכום $${-b}$.`,
        `נלקחו סכום השורשים ומכפלתם כאילו הם השורשים עצמם. $${-b}$ הוא הסכום ו-$${c}$ המכפלה; השורשים הם הזוג שמקיים את שניהם.`,
        `סימן אחד התהפך, ולכן מכפלת הזוג הזה היא $${-c}$ ולא $${c}$. שני השורשים חייבים לתת יחד את המכפלה בסימנה הנכון.`,
      ],
      hint: `חפש שני מספרים שמכפלתם $${c}$ וסכומם $${-b}$.`,
      solution: {
        steps: [
          '**הכלל:** משוואה ריבועית שמקדם $x^2$ שלה הוא אחד פותרים בפירוק לגורמים: זוג מספרים שמכפלתו האיבר החופשי וסכומו מינוס המקדם של $x$.',
          `מחפשים זוג שמכפלתו $${c}$ וסכומו $${-b}$: $${l}$ ו-$${h}$.`,
          `**הפירוק:** $${factor(l)}${factor(h)} = 0$, ולכן $x = ${l}$ או $x = ${h}$.`,
        ],
        finalAnswer: right,
        explanation: 'פירוק לגורמים הוא המהיר ביותר כשהמקדם של x בריבוע הוא אחד והשורשים שלמים.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 2 · discriminant-parameter
// ---------------------------------------------------------------------------

const discCases: GenTemplate = {
  id: 'alg-disc-param-cases',
  distractorTags: [null, 'sign-slip', 'condition-ignored', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'discriminant-parameter',
  title: 'הפרמטר לפי מספר הפתרונות',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const a = difficulty === 'hard' ? rng.int(2, 3) : 1;
    const k = pickInt(rng, -7, 7, difficulty === 'easy' ? [7, -7] : []);
    const b = 2 * a * k; // Δ = b² - 4am = 4a²k² - 4am  →  threshold m = a·k²
    const K = a * k * k;
    const kind = rng.pick(['two', 'one', 'none'] as const);

    const eqn = `${quad(a, b, 0)} + m = 0`;
    const question =
      kind === 'two'
        ? `לאילו ערכי $m$ יש למשוואה $${eqn}$ שני פתרונות שונים?`
        : kind === 'one'
          ? `לאילו ערכי $m$ יש למשוואה $${eqn}$ פתרון יחיד?`
          : `לאילו ערכי $m$ אין למשוואה $${eqn}$ פתרון ממשי?`;

    const lt = `$m < ${K}$`;
    const gt = `$m > ${K}$`;
    const eq = `$m = ${K}$`;
    const le = `$m \\le ${K}$`;
    const ge = `$m \\ge ${K}$`;

    const noteEq = `זה המקרה של דיסקרימיננטה אפס, כלומר פתרון יחיד, ולא מה שנשאל.`;
    const rule =
      '**הכלל:** מספר הפתרונות של משוואה ריבועית נקבע מסימן הדיסקרימיננטה: חיובית נותנת שני פתרונות שונים, אפס נותן פתרון יחיד ושלילית נותנת שאין פתרון ממשי; כשיש פרמטר מנסחים את הדרישה הזו כאי-שוויון או משוואה בפרמטר.';
    const formula = `**הנוסחה:** $\\Delta = b^2 - 4ac = (${b})^2 - 4 \\cdot ${a} \\cdot m = ${b * b} - ${4 * a}m$.`;
    const dOp = kind === 'two' ? '>' : kind === 'one' ? '=' : '<';
    const mOp = kind === 'two' ? '<' : kind === 'one' ? '=' : '>';
    const demand = `דורשים $\\Delta ${dOp} 0$: $${b * b} - ${4 * a}m ${dOp} 0$.`;
    const solve = `מעבירים אגף ומחלקים במספר החיובי $${4 * a}$: $m ${mOp} ${K}$.`;

    const answers =
      kind === 'two' ? [lt, gt, le, eq] : kind === 'none' ? [gt, lt, ge, eq] : [eq, `$m = ${-K}$`, le, lt];
    const notes =
      kind === 'two'
        ? [
            '',
            `כיוון האי-שוויון התהפך. מ-$${b * b} - ${4 * a}m > 0$ מקבלים $${b * b} > ${4 * a}m$, כלומר $m < ${K}$; עבור $m$ גדול יותר הדיסקרימיננטה שלילית.`,
            `נכלל גם $m = ${K}$, אך שם $\\Delta = 0$ ויש פתרון יחיד, לא שניים שונים. הדרישה "שונים" מחייבת אי-שוויון חזק.`,
            noteEq,
          ]
        : kind === 'none'
          ? [
              '',
              `כיוון האי-שוויון התהפך. אין פתרון כאשר $\\Delta < 0$, כלומר $${b * b} < ${4 * a}m$ ומכאן $m > ${K}$.`,
              `נכלל גם $m = ${K}$, אך שם $\\Delta = 0$ ויש פתרון אחד, כלומר המשוואה כן נפתרת.`,
              noteEq,
            ]
          : [
              '',
              `הסימן התהפך בהעברת האגף. מ-$${b * b} - ${4 * a}m = 0$ מקבלים $${4 * a}m = ${b * b}$, ולכן $m = ${K}$.`,
              `פתרון יחיד דורש $\\Delta = 0$ בדיוק, לא $\\Delta \\ge 0$. עבור $m < ${K}$ יש שני פתרונות שונים.`,
              `זה המקרה של דיסקרימיננטה חיובית, כלומר שני פתרונות שונים, ולא פתרון יחיד.`,
            ];

    return mcq({
      question,
      answers,
      correct: 0,
      distractorNotes: notes,
      hint: 'כתוב את הדיסקרימיננטה כביטוי ב-m, ודרוש עליה את הסימן המתאים למספר הפתרונות.',
      solution: {
        steps: [rule, formula, demand, solve],
        finalAnswer: answers[0],
        explanation: 'הדיסקרימיננטה היא ביטוי בפרמטר, והדרישה על סימנה הופכת לתנאי על הפרמטר.',
      },
    });
  },
};

const vieta: GenTemplate = {
  id: 'alg-vieta-sum-product',
  wrongAnswerTags: ['dropped-factor', 'sign-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'discriminant-parameter',
  title: 'סכום ומכפלת השורשים לפי וייטה',
  skill: 'substitution',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const a = difficulty === 'easy' ? 2 : difficulty === 'mid' ? rng.int(2, 3) : rng.int(2, 5);
    const b = pickInt(rng, -9, 9);
    let c = pickInt(rng, -9, 9);
    // Real roots by construction: a negative c makes Δ = b² - 4ac positive.
    if (b * b - 4 * a * c < 0) c = -c;
    const disc = b * b - 4 * a * c;

    const sum = new Frac(-b, a);
    const prod = new Frac(c, a);
    const eqn = `${quad(a, b, c)} = 0`;

    return open({
      question: `נתונה המשוואה $${eqn}$ ושורשיה $x_1$ ו-$x_2$. בלי לפתור את המשוואה, מצא את סכום השורשים $x_1 + x_2$ ואת מכפלתם $x_1 \\cdot x_2$.`,
      answerLabels: ['סכום השורשים', 'מכפלת השורשים'],
      expected: { kind: 'set', values: [sum.expr(), prod.expr()] },
      wrongAnswers: [
        {
          value: `${-b}, ${c}`,
          note: `נשמטה החלוקה במקדם של $x^2$. נוסחאות וייטה הן $x_1 + x_2 = -\\dfrac{b}{a}$ ו-$x_1 \\cdot x_2 = \\dfrac{c}{a}$, וכאן $a = ${a}$ ולא אחד.`,
        },
        {
          value: `${new Frac(b, a).expr()}, ${prod.expr()}`,
          note: `הסימן של הסכום אבד. סכום השורשים הוא מינוס $b$ חלקי $a$, ולכן $x_1 + x_2 = ${sum.tex()}$.`,
        },
      ],
      hint: 'נוסחאות וייטה: הסכום הוא מינוס b חלקי a, המכפלה היא c חלקי a. אין צורך לפתור.',
      solution: {
        steps: [
          '**הכלל:** כשמבקשים סכום או מכפלה של השורשים בלי לפתור, משתמשים בנוסחאות וייטה, שמקשרות אותם ישירות למקדמי המשוואה.',
          '**הנוסחה:** $x_1 + x_2 = -\\dfrac{b}{a}$, $x_1 \\cdot x_2 = \\dfrac{c}{a}$.',
          `בודקים שיש שורשים: $\\Delta = (${b})^2 - 4 \\cdot ${a} \\cdot (${c}) = ${disc} \\ge 0$.`,
          `**ההצבה:** $a = ${a}$, $b = ${b}$, $c = ${c}$, ולכן $x_1 + x_2 = ${sum.tex()}$ ו-$x_1 \\cdot x_2 = ${prod.tex()}$.`,
        ],
        finalAnswer: `$x_1 + x_2 = ${sum.tex()}$, $x_1 \\cdot x_2 = ${prod.tex()}$`,
        explanation: 'וייטה עובד גם כשהשורשים אינם שלמים, כל עוד הדיסקרימיננטה אינה שלילית.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 3 · radical-rational
// ---------------------------------------------------------------------------

const radicalExtraneous: GenTemplate = {
  id: 'alg-radical-extraneous',
  wrongAnswerTags: ['condition-ignored', 'exponent-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'radical-rational',
  title: 'משוואת שורש עם פתרון שנפסל בבדיקה',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    // √(ax + b) = x + c. Squaring gives x² + (2c - a)x + (c² - b) = 0 with roots
    // r1, r2. A root survives iff x + c ≥ 0, so pick s = r1 + c ≥ 0 and
    // t = r2 + c < 0 and DERIVE a, b from them.
    const c = difficulty === 'easy' ? rng.int(0, 4) : difficulty === 'mid' ? rng.int(-5, 5) : rng.int(-8, 8);
    const s = difficulty === 'easy' ? rng.int(1, 5) : rng.int(0, difficulty === 'mid' ? 8 : 9);
    const ts: number[] = [];
    for (let t = difficulty === 'hard' ? -9 : -8; t <= -1; t++) if (t !== -s && t !== 1 - s) ts.push(t);
    const t = rng.pick(ts);
    const a = s + t; // ≠ 0 and ≠ 1 by construction
    const r1 = s - c;
    const r2 = t - c;
    const b = c * c - r1 * r2;
    const bad = new Frac(c - b, a - 1); // "forgot to square": ax + b = x + c
    if (bad.isInt && bad.n === r1) return null;

    const rhs = lin(1, c);
    const rhsSq = c === 0 ? 'x^2' : `(${rhs})^2`;
    const squared = quad(1, 2 * c, c * c);
    const [l, h] = [r1, r2].sort((x, y) => x - y);

    return open({
      question: `פתור את המשוואה $\\sqrt{${lin(a, b)}} = ${rhs}$.`,
      expected: { kind: 'value', value: String(r1) },
      wrongAnswers: [
        {
          value: String(r2),
          note: `זה השורש שנפסל בבדיקה. הצבת $x = ${r2}$ באגף ימין נותנת $${t}$, מספר שלילי, ושורש ריבועי אינו שלילי לעולם; ההעלאה בריבוע היא שהוסיפה אותו.`,
        },
        {
          value: bad.expr(),
          note: `השורש הוסר בלי להעלות בריבוע. אי אפשר "למחוק" שורש; מעלים את שני האגפים בריבוע ומקבלים $${lin(a, b)} = ${rhsSq}$.`,
        },
      ],
      hint: 'העלה את שני האגפים בריבוע, פתור את הריבועית, ואז הצב כל פתרון במשוואה המקורית.',
      solution: {
        steps: [
          '**הכלל:** במשוואת שורש מעלים את שני האגפים בריבוע ופותרים, ובסוף חובה להציב כל פתרון במשוואה המקורית, כי ההעלאה בריבוע עלולה להוסיף פתרון שבו האגף שמול השורש שלילי.',
          `**ההעלאה בריבוע:** $${lin(a, b)} = ${rhsSq}${c === 0 ? '' : ` = ${squared}`}$.`,
          `מעבירים אגף: $${quad(1, 2 * c - a, c * c - b)} = 0$, ולכן $x = ${l}$ או $x = ${h}$.`,
          `**בדיקה:** עבור $x = ${r2}$ אגף ימין שווה $${t}$, שלילי, ולכן נפסל; עבור $x = ${r1}$ שני האגפים שווים $${s}$.`,
        ],
        finalAnswer: `$x = ${r1}$`,
        explanation: 'שורש ריבועי אינו שלילי, ולכן פתרון שנותן אגף ימין שלילי אינו פתרון של המשוואה המקורית.',
      },
    });
  },
};

const rationalExcluded: GenTemplate = {
  id: 'alg-rational-excluded-root',
  wrongAnswerTags: ['condition-ignored', 'sign-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'radical-rational',
  title: 'משוואה רציונלית עם שורש שנפסל בתחום ההגדרה',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const [r, v] = roots(rng, difficulty, 8); // r = denominator root, v = the answer
    if (!r || !v) return null;
    const k = difficulty === 'hard' ? 2 : 1;
    const numer = quad(k, -k * (r + v), k * r * v);
    const denom = lin(1, -r);
    const kk = k === 1 ? '' : String(k);

    return open({
      question: `פתור את המשוואה $\\dfrac{${numer}}{${denom}} = 0$.`,
      expected: { kind: 'value', value: String(v) },
      wrongAnswers: [
        {
          value: String(r),
          note: `זה שורש המכנה. הצבת $x = ${r}$ נותנת מכנה אפס, והביטוי אינו מוגדר שם כלל; השורש הזה נפסל בתחום ההגדרה.`,
        },
        {
          value: String(-v),
          note: `הסימן התהפך. הגורם $${factor(v)}$ מתאפס כאשר $x = ${v}$; הצבת $x = ${-v}$ במונה אינה נותנת אפס.`,
        },
      ],
      hint: 'קודם תחום הגדרה: מה מאפס את המכנה? אחר כך מאפסים את המונה ופוסלים מה שמחוץ לתחום.',
      solution: {
        steps: [
          '**הכלל:** במשוואה רציונלית קובעים תחילה תחום הגדרה, כי המכנה חייב להיות שונה מאפס, ואז שבר שווה לאפס בדיוק כשהמונה מתאפס; פתרון שמאפס את המכנה נפסל.',
          `**תחום ההגדרה:** $${denom} \\ne 0$, כלומר $x \\ne ${r}$.`,
          `מאפסים את המונה: $${numer} = 0$, ובפירוק $${kk}${factor(r)}${factor(v)} = 0$, ולכן $x = ${r}$ או $x = ${v}$.`,
          `הפתרון $x = ${r}$ מאפס את המכנה ונפסל, ונשאר $x = ${v}$.`,
        ],
        finalAnswer: `$x = ${v}$`,
        explanation: 'שורש משותף למונה ולמכנה אינו פתרון: הביטוי אינו מוגדר שם.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 4 · inequalities
// ---------------------------------------------------------------------------

/** `l < x < h` / `x < l או x > h`, strict or weak. */
const inside = (l: number, h: number, weak = false) => (weak ? `$${l} \\le x \\le ${h}$` : `$${l} < x < ${h}$`);
const outside = (l: number, h: number, weak = false) =>
  weak ? `$x \\le ${l}$ או $x \\ge ${h}$` : `$x < ${l}$ או $x > ${h}$`;

const ineqQuadratic: GenTemplate = {
  id: 'alg-ineq-quadratic',
  distractorTags: [null, 'sign-slip', 'partial-answer', 'sign-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'inequalities',
  title: 'אי-שוויון ריבועי לפי סימן הפרבולה',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const [p, q] = roots(rng, difficulty, 8);
    if (!p || !q) return null;
    const [l, h] = [p, q].sort((x, y) => x - y);
    const gt = rng.chance(0.5);
    const weak = difficulty === 'hard';
    const op = gt ? (weak ? '\\ge' : '>') : weak ? '\\le' : '<';
    const lhs = difficulty === 'easy' && rng.chance(0.5) ? `${factor(p)}${factor(q)}` : quad(1, -(p + q), p * q);

    const right = gt ? outside(l, h, weak) : inside(l, h, weak);
    const wrong = gt ? inside(l, h, weak) : outside(l, h, weak);
    const partial = `$x ${op} ${h}$`;
    const flipped = gt ? outside(-h, -l, weak) : inside(-h, -l, weak);

    return mcq({
      question: `פתור את האי-שוויון $${lhs} ${op} 0$.`,
      answers: [right, wrong, partial, flipped],
      correct: 0,
      distractorNotes: [
        '',
        gt
          ? `זה התחום שבו הפרבולה מתחת לציר. הצבת ערך בין השורשים נותנת מכפלה של גורם חיובי בגורם שלילי, כלומר ערך שלילי, והאי-שוויון דורש חיובי.`
          : `זה התחום שבו הפרבולה מעל הציר. הצבת ערך גדול מ-$${h}$ נותנת שני גורמים חיוביים, כלומר ערך חיובי, והאי-שוויון דורש שלילי.`,
        gt
          ? `נלקח רק הצד הימני. גם משמאל לשורש $${l}$ שני הגורמים שליליים והמכפלה חיובית, ולכן הפתרון הוא שני קטעים.`
          : `נשמט הגבול התחתון. הצבת ערך קטן מ-$${l}$ נותנת שני גורמים שליליים, כלומר מכפלה חיובית, והתחום הזה אינו מקיים את האי-שוויון.`,
        `הסימנים של השורשים התהפכו. הפירוק הוא $${factor(l)}${factor(h)}$, ולכן השורשים הם $${l}$ ו-$${h}$ ולא הנגדיים שלהם.`,
      ],
      hint: 'מצא את שני השורשים, ואז שאל: הפרבולה פתוחה כלפי מעלה, איפה היא מעל הציר ואיפה מתחתיו?',
      solution: {
        steps: [
          '**הכלל:** אי-שוויון ריבועי פותרים במציאת שורשי הפרבולה ובשאלה היכן היא מעל הציר או מתחתיו: פרבולה שמקדם $x^2$ שלה חיובי שלילית בין השורשים וחיובית מחוצה להם.',
          `**השורשים:** $${factor(l)}${factor(h)} = 0$, ולכן $x = ${l}$ או $x = ${h}$.`,
          `המקדם של $x^2$ חיובי, ולכן הפרבולה ${gt ? 'חיובית מחוץ לשורשים' : 'שלילית בין השורשים'}${weak ? ', והשורשים עצמם כלולים כי האי-שוויון חלש' : ''}.`,
        ],
        finalAnswer: right,
        explanation: gt
          ? 'האי-שוויון מבקש היכן הפרבולה מעל ציר x: בקצוות, מחוץ לשורשים.'
          : 'האי-שוויון מבקש היכן הפרבולה מתחת לציר x: בין השורשים.',
      },
    });
  },
};

const ineqRational: GenTemplate = {
  id: 'alg-ineq-rational',
  distractorTags: [null, 'sign-slip', 'condition-ignored', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'inequalities',
  title: 'אי-שוויון רציונלי בטבלת סימנים',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const [p, q] = roots(rng, difficulty, 8); // p = numerator root, q = denominator root
    if (!p || !q) return null;
    const [l, h] = [p, q].sort((x, y) => x - y);
    const gt = rng.chance(0.5);
    const weak = difficulty === 'hard';
    const op = gt ? (weak ? '\\ge' : '>') : weak ? '\\le' : '<';
    const frac = `\\dfrac{${lin(1, -p)}}{${lin(1, -q)}}`;

    // Weak: the numerator root is included, the denominator root never is.
    const lo = weak && l === p ? '\\le' : '<';
    const hiOut = weak && h === p ? '\\ge' : '>';
    const hiIn = weak && h === p ? '\\le' : '<';
    const out = `$x ${lo} ${l}$ או $x ${hiOut} ${h}$`;
    const inn = `$${l} ${lo} x ${hiIn} ${h}$`;
    const right = gt ? out : inn;
    const wrong = gt ? inn : out;
    // Strict: "multiplied by the denominator" keeps only the numerator's sign.
    // Weak: both endpoints included, i.e. the denominator root was not excluded.
    const ignored = weak ? (gt ? outside(l, h, true) : inside(l, h, true)) : gt ? `$x > ${p}$` : `$x < ${p}$`;
    const domain = `$x \\ne ${q}$`;

    return mcq({
      question: `פתור את האי-שוויון $${frac} ${op} 0$.`,
      answers: [right, wrong, ignored, domain],
      correct: 0,
      distractorNotes: [
        '',
        gt
          ? `זה התחום שבו המנה שלילית. בין $${l}$ ל-$${h}$ המונה והמכנה בסימנים מנוגדים, והצבת ערך משם נותנת מנה שלילית.`
          : `זה התחום שבו המנה חיובית. מחוץ לקטע שבין $${l}$ ל-$${h}$ המונה והמכנה באותו סימן, והמנה חיובית.`,
        weak
          ? `נכלל גם $x = ${q}$, שורש המכנה. שם הביטוי אינו מוגדר כלל, ולכן שורש המכנה לעולם אינו נכנס לפתרון, גם באי-שוויון חלש.`
          : `האי-שוויון הוכפל במכנה כאילו הוא חיובי. סימן המכנה $${lin(1, -q)}$ משתנה ב-$x = ${q}$, ולכן חייבים טבלת סימנים עם שני הגורמים.`,
        `זה תחום ההגדרה בלבד. הוא אומר איפה הביטוי מוגדר, לא איפה הוא ${gt ? 'חיובי' : 'שלילי'}; הצבת ערך בין $${l}$ ל-$${h}$ נותנת מנה ${gt ? 'שלילית' : 'חיובית'}.`,
      ],
      hint: 'לא כופלים במכנה. סמן על ציר את שורש המונה ואת שורש המכנה ובדוק סימן בכל קטע.',
      solution: {
        steps: [
          '**הכלל:** באי-שוויון רציונלי אסור לכפול במכנה כי סימנו אינו ידוע; מסמנים על ציר את שורש המונה ואת שורש המכנה, בודקים את סימן המנה בכל קטע, ושורש המכנה לעולם אינו כלול בפתרון.',
          `שורש המונה: $x = ${p}$. שורש המכנה: $x = ${q}$, ושם הביטוי אינו מוגדר. הציר נחלק לשלושה קטעים.`,
          `משמאל לשניהם המונה והמכנה שליליים והמנה חיובית; בין $${l}$ ל-$${h}$ הסימנים מנוגדים והמנה שלילית; מימין לשניהם שניהם חיוביים והמנה חיובית.`,
          `${gt ? 'בוחרים את הקטעים שבהם המנה חיובית' : 'בוחרים את הקטע שבו המנה שלילית'}${weak ? `, ומוסיפים את $x = ${p}$ שבו המנה שווה אפס, אך לא את $x = ${q}$` : ''}.`,
        ],
        finalAnswer: right,
        explanation: 'מנה חיובית כשהמונה והמכנה באותו סימן; שורש המכנה אינו בתחום ההגדרה.',
      },
    });
  },
};

export const ALGEBRA_TEMPLATES: GenTemplate[] = [
  quadRoots,
  quadMcq,
  discCases,
  vieta,
  radicalExtraneous,
  rationalExcluded,
  ineqQuadratic,
  ineqRational,
];
