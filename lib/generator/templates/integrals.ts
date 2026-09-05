/**
 * generator/templates/integrals.ts — parameterised repair questions for
 * חשבון אינטגרלי (sub-topics basic-integration, definite-integral,
 * area-between-curves, volume-revolution).
 *
 * Same contract as functions.ts: `**הכלל:**` opens every solution and never
 * contains the answer, no Hebrew inside `$…$`, every distractor is a NAMED
 * mistake with a note, all arithmetic is exact (`Frac`), and `build` is pure
 * in (rng, difficulty).
 *
 * Volumes are written `N\pi` and graded as `N*pi` — answer-check normalises
 * `\pi`/`π` to mathjs `pi` and inserts the implicit `*`.
 */

import { Frac, type Rng } from '../rng';
import { mcq, open } from './shared';
import type { GenTemplate } from '../types';

const TOPIC = 'חשבון אינטגרלי';
const SUBJECT = 'math5';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Non-zero integer in [lo, hi] with `avoid` excluded. */
function pickInt(rng: Rng, lo: number, hi: number, avoid: number[] = []): number {
  for (let i = 0; i < 25; i++) {
    const v = rng.int(lo, hi);
    if (v !== 0 && !avoid.includes(v)) return v;
  }
  return 0;
}

const xpow = (k: number) => (k === 0 ? '' : k === 1 ? 'x' : `x^${k}`);

/** `|c| x^k` as LaTeX: the sign is handled by `polyTex`. */
function coefTex(c: Frac, k: number): string {
  const a = new Frac(Math.abs(c.n), c.d);
  if (k === 0) return a.tex();
  if (a.isInt && a.n === 1) return xpow(k);
  return `${a.tex()}${xpow(k)}`;
}

/** Sum of `c·x^k` terms as LaTeX, zero terms dropped: `-\dfrac{2}{3}x^3 + 5x - 6`. */
function polyTex(terms: [Frac, number][]): string {
  let out = '';
  for (const [c, k] of terms) {
    if (c.n === 0) continue;
    const body = coefTex(c, k);
    if (out === '') out = c.n < 0 ? `-${body}` : body;
    else out += c.n < 0 ? ` - ${body}` : ` + ${body}`;
  }
  return out || '0';
}

/** Integer-coefficient polynomial, highest power first: `ipoly(1, -3, 2)` = x² − 3x + 2. */
function ipoly(...cs: number[]): string {
  return polyTex(cs.map((c, i) => [Frac.of(c), cs.length - 1 - i] as [Frac, number]));
}

/** Antiderivative terms of `cs` (highest power first, as x^deg … x^0). */
function antiderivative(cs: number[]): [Frac, number][] {
  const deg = cs.length - 1;
  return cs.map((c, i) => [new Frac(c, deg - i + 1), deg - i + 1] as [Frac, number]);
}

function evalTerms(terms: [Frac, number][], x: number): Frac {
  let s = new Frac(0);
  for (const [c, k] of terms) s = s.add(c.mul(Frac.of(x ** k)));
  return s;
}

/** F(hi) − F(lo) for a polynomial with integer coefficients (highest first). */
function defInt(cs: number[], lo: number, hi: number): Frac {
  const F = antiderivative(cs);
  return evalTerms(F, hi).sub(evalTerms(F, lo));
}

/** A subtrahend: negatives get parentheses, `a - (-b)`. */
const paren = (f: Frac) => (f.n < 0 ? `\\left(${f.tex()}\\right)` : f.tex());

/** True when every fraction is different from the first (the correct one). */
function noneEqual(correct: Frac, ...wrong: Frac[]): boolean {
  return wrong.every((w) => !w.eq(correct));
}

/** Sorted distinct pair p < q in [lo, hi] with gap ≤ maxGap. */
function pairPQ(rng: Rng, lo: number, hi: number, maxGap: number): [number, number] {
  const p = rng.int(lo, hi - 1);
  const q = p + rng.int(1, Math.min(maxGap, hi - p));
  return [p, q];
}

// ---------------------------------------------------------------------------
// 1 · basic-integration — power rule, linear inner
// ---------------------------------------------------------------------------

const powerRule: GenTemplate = {
  id: 'int-power-rule',
  distractorTags: [null, 'operation-swap', 'dropped-factor', 'index-offset'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'basic-integration',
  title: 'כלל החזקה באינטגרל לא מסוים',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    // n ≥ 2 so "divided by the old exponent" is never the same as "did not divide".
    const n = difficulty === 'easy' ? rng.int(2, 3) : rng.int(2, 4);
    const c = difficulty === 'easy' ? rng.int(1, 9) : pickInt(rng, -9, 9);
    const a = c * (n + 1); // integrand a·x^n, antiderivative c·x^{n+1}

    const opt = (coef: Frac, k: number) => `$${polyTex([[coef, k]])} + C$`;
    const right = opt(Frac.of(c), n + 1);
    const integral = `\\int ${ipoly(a, ...Array(n).fill(0))}\\,dx`;
    const question = rng.chance(0.5) ? `מהו $${integral}$?` : `חשב את האינטגרל $${integral}$.`;

    return mcq({
      question,
      answers: [right, opt(Frac.of(a * n), n - 1), opt(Frac.of(a), n + 1), opt(new Frac(a, n), n + 1)],
      correct: 0,
      distractorNotes: [
        '',
        `בוצעה גזירה במקום אינטגרציה. בדיקה הפוכה: גזירת התשובה צריכה להחזיר את $${ipoly(a, ...Array(n).fill(0))}$, וכאן היא מחזירה חזקה נמוכה יותר.`,
        `החזקה הועלתה אך לא חילקו במעריך החדש $${n + 1}$. גזירת $${polyTex([[Frac.of(a), n + 1]])}$ נותנת ביטוי גדול פי $${n + 1}$ מהאינטגרנד.`,
        `חילקו במעריך המקורי $${n}$ במקום במעריך החדש $${n + 1}$. מחלקים תמיד בחזקה שאחרי ההעלאה.`,
      ],
      hint: 'מעלים את החזקה באחד ומחלקים בחזקה החדשה. גזור את התשובה ובדוק שחזרת לאינטגרנד.',
      solution: {
        steps: [
          '**הכלל:** אינטגרל לא מסוים של חזקה של $x$ נפתר בכלל החזקה, מעלים את המעריך באחד ומחלקים במעריך החדש, והמקדם עובר דרך האינטגרל.',
          `**הנוסחה:** $\\int x^{${n}}\\,dx = \\dfrac{x^{${n + 1}}}{${n + 1}} + C$.`,
          `**ההצבה:** $${integral} = ${a} \\cdot \\dfrac{x^{${n + 1}}}{${n + 1}} + C = ${polyTex([[Frac.of(c), n + 1]])} + C$.`,
        ],
        finalAnswer: right,
        explanation: 'מחלקים בחזקה החדשה, לא בישנה, ומוסיפים קבוע.',
      },
    });
  },
};

const linearInner: GenTemplate = {
  id: 'int-linear-inner',
  distractorTags: [null, 'dropped-factor', 'operation-swap', 'index-offset'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'basic-integration',
  title: 'אינטגרל של חזקה של ביטוי לינארי',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const a = difficulty === 'easy' ? rng.int(2, 3) : rng.int(2, 5);
    const b = difficulty === 'easy' ? rng.int(1, 9) : pickInt(rng, -9, 9);
    const n = difficulty === 'easy' ? rng.int(2, 3) : rng.int(2, 4);
    const inner = ipoly(a, b);

    // `coef · (inner)^{n+1} + C` with the coefficient reduced: 1/9 → \dfrac{(…)^3}{9}, 3/4 → \dfrac{3(…)^3}{4}.
    const opt = (coef: Frac) => {
      const pw = `(${inner})^{${n + 1}}`;
      const body = coef.isInt ? `${coef.n === 1 ? '' : coef.n}${pw}` : `\\dfrac{${coef.n === 1 ? '' : coef.n}${pw}}{${coef.d}}`;
      return `$${body} + C$`;
    };
    const right = opt(new Frac(1, a * (n + 1)));
    const integral = `\\int (${inner})^{${n}}\\,dx`;
    const question = rng.chance(0.5) ? `מהו $${integral}$?` : `חשב את האינטגרל $${integral}$.`;

    return mcq({
      question,
      answers: [right, opt(new Frac(1, n + 1)), opt(new Frac(a, n + 1)), opt(new Frac(1, a * n))],
      correct: 0,
      distractorNotes: [
        '',
        `תיקון ההצבה הלינארית הושמט. הנגזרת הפנימית של $${inner}$ היא $${a}$, ולכן חייבים לחלק גם ב-$${a}$; גזירת האפשרות הזו נותנת ביטוי גדול פי $${a}$ מהאינטגרנד.`,
        `הוכפל במקדם $${a}$ במקום לחלק בו. בגזירה המקדם הפנימי מכפיל, ולכן באינטגרל, הפעולה ההפוכה, מחלקים בו.`,
        `חילקו במעריך המקורי $${n}$ במקום במעריך החדש $${n + 1}$. כלל החזקה תקף כאן כרגיל: מעלים באחד ומחלקים במה שהתקבל.`,
      ],
      hint: 'כלל החזקה על הסוגריים, ואז חלוקה נוספת במקדם של x שבתוכם.',
      solution: {
        steps: [
          '**הכלל:** בתוך הסוגריים יושב ביטוי לינארי במקום $x$ בודד, ולכן מפעילים את כלל החזקה ומחלקים גם במקדם של $x$, זהו תיקון ההצבה הלינארית.',
          `**הנוסחה:** $\\int (ax+b)^{n}\\,dx = \\dfrac{(ax+b)^{n+1}}{a(n+1)} + C$.`,
          `**ההצבה:** $a = ${a}$, $n = ${n}$, ולכן המכנה הוא $${a} \\cdot ${n + 1} = ${a * (n + 1)}$.`,
          `$${integral} = \\dfrac{(${inner})^{${n + 1}}}{${a * (n + 1)}} + C$.`,
        ],
        finalAnswer: right,
        explanation: 'המכנה כולל את המעריך החדש ואת המקדם הפנימי יחד.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 2 · definite-integral — Newton–Leibniz, and f from f'
// ---------------------------------------------------------------------------

const defPoly: GenTemplate = {
  id: 'int-def-poly',
  wrongAnswerTags: ['dropped-factor', 'sign-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'definite-integral',
  title: 'אינטגרל מסוים של פולינום',
  skill: 'substitution',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const a2 = difficulty === 'easy' ? rng.int(1, 5) : pickInt(rng, -4, 4);
    const a1 = difficulty === 'hard' ? pickInt(rng, -6, 6) : 0;
    const a0 = difficulty === 'easy' ? 0 : pickInt(rng, -9, 9);
    const cs = [a2, a1, a0];

    const lo = difficulty === 'easy' ? rng.int(1, 2) : pickInt(rng, -3, 3);
    const hi = lo + rng.int(1, 3);

    const F = antiderivative(cs);
    const Fhi = evalTerms(F, hi);
    const Flo = evalTerms(F, lo);
    const value = Fhi.sub(Flo);

    // "Raised the power but never divided" and "added F(lo) instead of subtracting".
    const noDivide = cs.reduce((s, c, i) => s.add(Frac.of(c * (hi ** (3 - i) - lo ** (3 - i)))), new Frac(0));
    const plus = Fhi.add(Flo);
    if (Flo.n === 0 || !noneEqual(value, noDivide, plus)) return null;

    const integral = `\\int_{${lo}}^{${hi}} (${ipoly(...cs)})\\,dx`;
    const question = rng.chance(0.5) ? `חשב את $${integral}$.` : `מהו הערך של האינטגרל המסוים $${integral}$?`;

    return open({
      question,
      expected: { kind: 'value', value: value.expr() },
      wrongAnswers: [
        {
          value: noDivide.expr(),
          note: `החזקות הועלו אך לא חילקו במעריך החדש. הקדומה של $x^2$ היא $\\dfrac{x^3}{3}$, ורק אחרי החלוקה מציבים את הגבולות.`,
        },
        {
          value: plus.expr(),
          note: `ערך הקדומה בגבול התחתון חובר במקום להיות מחוסר. נוסחת ניוטון-לייבניץ היא $F(${hi}) - F(${lo})$, וכאן $F(${lo}) = ${Flo.tex()}$.`,
        },
      ],
      hint: 'מצא פונקציה קדומה, הצב את הגבול העליון והחסר את ההצבה של הגבול התחתון.',
      solution: {
        steps: [
          '**הכלל:** אינטגרל מסוים של פולינום מחושב בנוסחת ניוטון-לייבניץ, מוצאים קדומה בכלל החזקה, מציבים את הגבול העליון ומחסרים את הצבת הגבול התחתון, ובלי קבוע.',
          `**הנוסחה:** $${integral} = \\left[ ${polyTex(F)} \\right]_{${lo}}^{${hi}}$.`,
          `**ההצבה:** $F(${hi}) = ${Fhi.tex()}$, $F(${lo}) = ${Flo.tex()}$.`,
          `$F(${hi}) - F(${lo}) = ${Fhi.tex()} - ${paren(Flo)} = ${value.tex()}$.`,
        ],
        finalAnswer: `$${value.tex()}$`,
        explanation: 'הקבוע מתבטל בחיסור, ולכן באינטגרל מסוים אין C.',
      },
    });
  },
};

const fromDerivative: GenTemplate = {
  id: 'int-f-from-fprime',
  wrongAnswerTags: ['partial-answer', 'sign-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'definite-integral',
  title: 'שחזור פונקציה מהנגזרת ותנאי התחלה',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    // f'(x) = a·x + b (easy/mid) or 3a·x² + b (hard) — coefficients chosen so F is integer-valued.
    const a = pickInt(rng, difficulty === 'easy' ? 1 : -4, 4);
    const b = pickInt(rng, -9, 9);
    const cs = difficulty === 'hard' ? [3 * a, 0, b] : [2 * a, b];
    const F = antiderivative(cs); // a x² + b x  or  a x³ + b x

    const x0 = difficulty === 'easy' ? rng.int(1, 3) : pickInt(rng, -3, 3);
    const y0 = pickInt(rng, -9, 9);
    const C = Frac.of(y0).sub(evalTerms(F, x0));
    if (C.n === 0) return null;

    const x1 = pickInt(rng, -4, 4, [x0]);
    const F1 = evalTerms(F, x1);
    const value = F1.add(C);
    const noC = F1;
    const flipped = F1.sub(C);
    if (!noneEqual(value, noC, flipped)) return null;

    const fTex = polyTex(F);
    return open({
      question: `נתון $f'(x) = ${ipoly(...cs)}$ וכן $f(${x0}) = ${y0}$. מצא את $f(${x1})$.`,
      expected: { kind: 'value', value: value.expr() },
      wrongAnswers: [
        {
          value: noC.expr(),
          note: `זה ערך הקדומה בלי קבוע האינטגרציה. הנתון $f(${x0}) = ${y0}$ ניתן בדיוק כדי למצוא את $C$, וכאן $C = ${C.tex()}$.`,
        },
        {
          value: flipped.expr(),
          note: `סימן הקבוע התהפך. מהמשוואה $${evalTerms(F, x0).tex()} + C = ${y0}$ מקבלים $C = ${C.tex()}$, ולא את הנגדי.`,
        },
      ],
      hint: 'אינטגרל של הנגזרת נותן את f עד כדי קבוע. הצב את הנקודה הנתונה כדי למצוא את הקבוע.',
      solution: {
        steps: [
          '**הכלל:** נתונה הנגזרת ונקודה על הגרף, ולכן משחזרים את הפונקציה באינטגרל לא מסוים, ואת קבוע האינטגרציה מוצאים מהצבת הנקודה הנתונה.',
          `**הנוסחה:** $f(x) = \\int (${ipoly(...cs)})\\,dx = ${fTex} + C$.`,
          `**ההצבה:** $f(${x0}) = ${y0}$ נותן $${evalTerms(F, x0).tex()} + C = ${y0}$, ולכן $C = ${C.tex()}$.`,
          `$f(x) = ${polyTex([...F, [C, 0]])}$, ולכן $f(${x1}) = ${F1.tex()} ${C.n < 0 ? '-' : '+'} ${new Frac(Math.abs(C.n), C.d).tex()} = ${value.tex()}$.`,
        ],
        finalAnswer: `$f(${x1}) = ${value.tex()}$`,
        explanation: 'הנקודה הנתונה קובעת את הקבוע; בלעדיה יש אינסוף פונקציות עם אותה נגזרת.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 3 · area-between-curves
// ---------------------------------------------------------------------------

/** The shared tail of both area templates: intersections at p, q and the top−bottom integral. */
function areaSolution(opts: {
  topTex: string;
  botTex: string;
  topName: string;
  diffCs: number[]; // top − bottom, integer coefficients highest first
  p: number;
  q: number;
  factored: string;
}) {
  const { topTex, botTex, topName, diffCs, p, q, factored } = opts;
  const F = antiderivative(diffCs);
  const Fq = evalTerms(F, q);
  const Fp = evalTerms(F, p);
  const S = Fq.sub(Fp);
  return {
    S,
    steps: [
      '**הכלל:** שטח כלוא בין שני גרפים הוא האינטגרל של הגרף העליון פחות התחתון, כשגבולות האינטגרציה הם שיעורי ה-$x$ של נקודות החיתוך, שמוצאים מהשוואת שתי הפונקציות.',
      `**נקודות החיתוך:** משווים את הפונקציות ומקבלים $${factored} = 0$, ולכן $x = ${p}$ או $x = ${q}$.`,
      `בקטע שבין הנקודות ${topName} למעלה, ולכן ההפרש הוא $(${topTex}) - (${botTex}) = ${ipoly(...diffCs)}$.`,
      `**הנוסחה:** $S = \\int_{${p}}^{${q}} (${ipoly(...diffCs)})\\,dx = \\left[ ${polyTex(F)} \\right]_{${p}}^{${q}}$.`,
      `**ההצבה:** $${Fq.tex()} - ${paren(Fp)} = ${S.tex()}$.`,
    ],
  };
}

const areaParabolaLine: GenTemplate = {
  id: 'int-area-parabola-line',
  wrongAnswerTags: ['sign-slip', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'area-between-curves',
  title: 'שטח בין פרבולה לישר',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const A = difficulty === 'hard' ? rng.int(2, 3) : 1;
    const [p, q] = difficulty === 'easy' ? pairPQ(rng, -3, 4, 4) : pairPQ(rng, -4, 5, 5);
    const m = difficulty === 'easy' ? 0 : pickInt(rng, -3, 3);
    const k = pickInt(rng, -6, 6);

    // f − g = A(x−p)(x−q)  ⇒  f = A x² + (m − A(p+q)) x + (k + A p q); the line is on top.
    const f = [A, m - A * (p + q), k + A * p * q];
    const g = [m, k];
    const diff = [-f[0], g[0] - f[1], g[1] - f[2]];

    const factored = `${A === 1 ? '' : A}(${ipoly(1, -p)})(${ipoly(1, -q)})`;
    const { S, steps } = areaSolution({
      topTex: ipoly(...g),
      botTex: ipoly(...f),
      topName: 'הישר',
      diffCs: diff,
      p,
      q,
      factored,
    });

    const negative = new Frac(-S.n, S.d);
    const onlyParabola = defInt(f, p, q);
    if (!noneEqual(S, negative, onlyParabola)) return null;

    return open({
      question: `חשב את השטח הכלוא בין הפרבולה $y = ${ipoly(...f)}$ והישר $y = ${ipoly(...g)}$.`,
      expected: { kind: 'value', value: S.expr() },
      wrongAnswers: [
        {
          value: negative.expr(),
          note: 'חושב תחתון פחות עליון. בין נקודות החיתוך הישר נמצא מעל הפרבולה, ושטח הוא תמיד גודל חיובי.',
        },
        {
          value: onlyParabola.expr(),
          note: 'זה האינטגרל של הפרבולה לבדה, כלומר השטח בינה לציר ה-$x$. שטח בין שני גרפים הוא אינטגרל של ההפרש ביניהם.',
        },
      ],
      hint: 'השווה את שתי הפונקציות כדי למצוא את גבולות האינטגרציה, ואז אינטגרל של עליון פחות תחתון.',
      solution: {
        steps,
        finalAnswer: `$S = ${S.tex()}$`,
        explanation: 'ההפרש בין הגרפים חיובי בכל הקטע, ולכן האינטגרל שלו הוא השטח.',
      },
    });
  },
};

const areaTwoParabolas: GenTemplate = {
  id: 'int-area-two-parabolas',
  wrongAnswerTags: ['sign-slip', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'area-between-curves',
  title: 'שטח בין שתי פרבולות',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    // Bottom parabola g = x² + m x + k opens up; top f = −x² + … opens down;
    // f − g = −2(x−p)(x−q) ≥ 0 on [p, q].
    let p: number;
    let q: number;
    if (difficulty === 'easy') {
      q = rng.int(1, 4);
      p = -q;
    } else {
      [p, q] = pairPQ(rng, -4, 5, difficulty === 'hard' ? 6 : 4);
    }
    const m = difficulty === 'easy' ? 0 : pickInt(rng, -3, 3);
    const k = pickInt(rng, -6, 6);

    const g = [1, m, k];
    const f = [-1, m + 2 * (p + q), k - 2 * p * q];
    const diff = [-2, 2 * (p + q), -2 * p * q];

    const { S, steps } = areaSolution({
      topTex: ipoly(...f),
      botTex: ipoly(...g),
      topName: 'הפרבולה הפתוחה כלפי מטה',
      diffCs: diff,
      p,
      q,
      factored: `-2(${ipoly(1, -p)})(${ipoly(1, -q)})`,
    });

    const negative = new Frac(-S.n, S.d);
    const onlyTop = defInt(f, p, q);
    if (!noneEqual(S, negative, onlyTop)) return null;

    return open({
      question: `חשב את השטח הכלוא בין הפרבולות $y = ${ipoly(...f)}$ ו-$y = ${ipoly(...g)}$.`,
      expected: { kind: 'value', value: S.expr() },
      wrongAnswers: [
        {
          value: negative.expr(),
          note: 'חושב תחתון פחות עליון. בין נקודות החיתוך הפרבולה הפתוחה כלפי מטה היא העליונה, ושטח הוא תמיד גודל חיובי.',
        },
        {
          value: onlyTop.expr(),
          note: 'זה האינטגרל של הפרבולה העליונה לבדה, כלומר השטח בינה לציר ה-$x$. שטח בין שני גרפים הוא אינטגרל של ההפרש ביניהם.',
        },
      ],
      hint: 'השווה את שתי הפרבולות כדי למצוא את נקודות החיתוך, ואז אינטגרל של העליונה פחות התחתונה.',
      solution: {
        steps,
        finalAnswer: `$S = ${S.tex()}$`,
        explanation: 'הפרבולה שפתוחה כלפי מטה היא העליונה בקטע שבין החיתוכים.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 4 · volume-revolution
// ---------------------------------------------------------------------------

const volumeLine: GenTemplate = {
  id: 'int-vol-line',
  wrongAnswerTags: ['exponent-slip', 'dropped-factor'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'volume-revolution',
  title: 'נפח גוף סיבוב של ישר דרך הראשית',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const k = difficulty === 'easy' ? rng.int(1, 4) : rng.int(1, 5);
    const lo = difficulty === 'hard' ? rng.int(1, 3) : 0;
    const hi = lo + rng.int(1, difficulty === 'easy' ? 6 : 5);

    const N = new Frac(k * k * (hi ** 3 - lo ** 3), 3); // V = N·π
    const noSquare = new Frac(k * (hi ** 2 - lo ** 2), 2);
    if (!noneEqual(N, noSquare)) return null;

    const fx = ipoly(k, 0);
    const bounds = lo === 0 ? `בין $x = 0$ ל-$x = ${hi}$` : `בתחום $${lo} \\le x \\le ${hi}$`;
    const question = rng.chance(0.5)
      ? `הגרף של $y = ${fx}$ ${bounds} מסתובב סביב ציר ה-$x$. חשב את נפח גוף הסיבוב שנוצר.`
      : `מסובבים את הגרף של $f(x) = ${fx}$ סביב ציר ה-$x$ ${bounds}. מהו נפח הגוף שנוצר?`;

    return open({
      question,
      expected: { kind: 'value', value: `${N.expr()}*pi` },
      wrongAnswers: [
        {
          value: `${noSquare.expr()}*pi`,
          note: `הפונקציה לא הועלתה בריבוע. בנוסחת הנפח מופיע $[f(x)]^2$, וכאן $(${fx})^2 = ${ipoly(k * k, 0, 0)}$; בלי הריבוע חישבת שטח כפול $\\pi$.`,
        },
        {
          value: N.expr(),
          note: `נשמט הכפל ב-$\\pi$. כל חתך של הגוף הוא דיסקה ששטחה $\\pi r^2$, ולכן $\\pi$ מכפיל את כל האינטגרל.`,
        },
      ],
      hint: 'פאי, אינטגרל, הפונקציה בריבוע, dx. רבע קודם, ואז אינטגרל מסוים רגיל.',
      solution: {
        steps: [
          '**הכלל:** גרף שמסתובב סביב ציר ה-$x$ יוצר גוף סיבוב, ונפחו הוא $\\pi$ כפול האינטגרל המסוים של הפונקציה בריבוע בין הגבולות.',
          `**הנוסחה:** $V = \\pi \\int_{${lo}}^{${hi}} (${fx})^2\\,dx = \\pi \\int_{${lo}}^{${hi}} ${ipoly(k * k, 0, 0)}\\,dx$.`,
          `**ההצבה:** $V = \\pi \\left[ ${polyTex([[new Frac(k * k, 3), 3]])} \\right]_{${lo}}^{${hi}} = \\pi \\left( ${new Frac(k * k * hi ** 3, 3).tex()} - ${new Frac(k * k * lo ** 3, 3).tex()} \\right) = ${N.tex()}\\pi$.`,
        ],
        finalAnswer: `$V = ${N.tex()}\\pi$`,
        explanation: 'הריבוע הופך כל חתך לדיסקה; פאי נשאר בחוץ ומכפיל את התוצאה.',
      },
    });
  },
};

const volumeSqrt: GenTemplate = {
  id: 'int-vol-sqrt',
  distractorTags: [null, 'dropped-factor', 'dropped-factor', 'sign-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'volume-revolution',
  title: 'נפח גוף סיבוב של פונקציית שורש',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const a = rng.int(1, 6);
    const b = difficulty === 'hard' ? rng.int(1, 9) : 0;
    const lo = difficulty === 'easy' ? 0 : rng.int(0, 4);
    const hi = lo + rng.int(1, 5);

    // [√(ax+b)]² = ax + b, so V = π [a x²/2 + b x] between the bounds.
    const N = defInt([a, b], lo, hi);
    const doubled = N.mul(Frac.of(2));
    const negative = new Frac(-N.n, N.d);

    const inner = ipoly(a, b);
    const right = `$${N.tex()}\\pi$`;
    const bounds = lo === 0 ? `בין $x = 0$ ל-$x = ${hi}$` : `בתחום $${lo} \\le x \\le ${hi}$`;

    return mcq({
      question: `מסובבים את הגרף של $f(x) = \\sqrt{${inner}}$ סביב ציר ה-$x$ ${bounds}. מהו נפח גוף הסיבוב?`,
      answers: [right, `$${N.tex()}$`, `$${doubled.tex()}\\pi$`, `$${negative.tex()}\\pi$`],
      correct: 0,
      distractorNotes: [
        '',
        'נשמט הכפל ב-$\\pi$. כל חתך של גוף הסיבוב הוא דיסקה ששטחה $\\pi r^2$, ולכן $\\pi$ מכפיל את כל האינטגרל.',
        `החזקה של $x$ הועלתה אך לא חילקו במעריך החדש. הקדומה של $${ipoly(a, 0)}$ היא $${polyTex([[new Frac(a, 2), 2]])}$, לא $${ipoly(a, 0, 0)}$.`,
        `הגבולות הוצבו בסדר הפוך, גבול תחתון פחות עליון. נפח הוא גודל חיובי, ומציבים תמיד $F(${hi}) - F(${lo})$.`,
      ],
      hint: 'הריבוע מבטל את השורש. מה נשאר מתחת לאינטגרל?',
      solution: {
        steps: [
          '**הכלל:** גרף שמסתובב סביב ציר ה-$x$ יוצר גוף סיבוב, ונפחו הוא $\\pi$ כפול האינטגרל המסוים של הפונקציה בריבוע, וכאן הריבוע מבטל את השורש.',
          `**הנוסחה:** $V = \\pi \\int_{${lo}}^{${hi}} \\left(\\sqrt{${inner}}\\right)^2\\,dx = \\pi \\int_{${lo}}^{${hi}} (${inner})\\,dx$.`,
          `**ההצבה:** $V = \\pi \\left[ ${polyTex(antiderivative([a, b]))} \\right]_{${lo}}^{${hi}} = \\pi \\left( ${evalTerms(antiderivative([a, b]), hi).tex()} - ${evalTerms(antiderivative([a, b]), lo).tex()} \\right) = ${N.tex()}\\pi$.`,
        ],
        finalAnswer: right,
        explanation: 'לרבע ולהכפיל בפאי; השורש נעלם בריבוע ונשאר אינטגרל של ביטוי לינארי.',
      },
    });
  },
};

export const INTEGRALS_TEMPLATES: GenTemplate[] = [
  powerRule,
  linearInner,
  defPoly,
  fromDerivative,
  areaParabolaLine,
  areaTwoParabolas,
  volumeLine,
  volumeSqrt,
];
