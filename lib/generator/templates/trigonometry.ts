/**
 * generator/templates/trigonometry.ts — parameterised repair questions for
 * טריגונומטריה: plane trig (degrees) and trig functions (radians).
 *
 * Same contract as functions.ts: `**הכלל:**` opens every solution and never
 * contains the answer, no Hebrew inside `$…$`, no maqaf before a math island,
 * every distractor is a NAMED mistake with a note, and `build` is pure in
 * (rng, difficulty) so the id alone rebuilds the question.
 *
 * Units follow the lesson files, not a rule of thumb: `trig-*`,
 * `special-angles-reduction` and `tf-equations` are in DEGREES (tf-equations
 * writes `0° ≤ x < 360°` throughout); `trig-calculus`, `tf-domain`,
 * `tf-derivative`, `tf-investigation`, `tf-integral` are in RADIANS.
 *
 * Every angle is a special angle, so every answer is EXACT — `lib/answer-check`
 * evaluates trig in radians, so an open `expected` is always a plain number
 * (`30`, `5`, `3*sqrt(3)/2`), never an expression containing sin/cos.
 *
 * `tf-bagrut` and `trig-plane-mixed` have no template on purpose: they are the
 * multi-part bagrut rehearsals and a single-answer item would not be that.
 */

import { Frac, type Rng } from '../rng';
import { mcq, open } from './shared';
import type { GenTemplate } from '../types';

const TOPIC = 'טריגונומטריה';
const SUBJECT = 'math5';

// ---------------------------------------------------------------------------
// Shared helpers — exact surds and special angles
// ---------------------------------------------------------------------------

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

/** n·√rad / d, reduced, squares pulled out of the radical. */
type Rt = { n: number; rad: number; d: number };

function rt(n: number, rad = 1, d = 1): Rt {
  if (n === 0) return { n: 0, rad: 1, d: 1 };
  for (let s = 2; s * s <= rad; s++) {
    while (rad % (s * s) === 0) {
      rad /= s * s;
      n *= s;
    }
  }
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g, rad, d: d / g };
}
const rtMul = (r: Rt, k: number) => rt(r.n * k, r.rad, r.d);
const rtNeg = (r: Rt) => rtMul(r, -1);
/** a / b, rationalised. */
const rtDiv = (a: Rt, b: Rt) => rt(a.n * b.d, a.rad * b.rad, a.d * b.n * b.rad);
/** 1 + r, for a rational r (rad = 1). */
const rtAdd1 = (r: Rt) => rt(r.n + r.d, 1, r.d);

/** LaTeX without `$`. `-\dfrac{\sqrt{3}}{2}`, `2\sqrt{3}`, `5`, `0`. */
function rtTex(r: Rt): string {
  if (r.n === 0) return '0';
  const sign = r.n < 0 ? '-' : '';
  const n = Math.abs(r.n);
  const root = r.rad === 1 ? '' : `\\sqrt{${r.rad}}`;
  const num = root ? (n === 1 ? root : `${n}${root}`) : String(n);
  return r.d === 1 ? `${sign}${num}` : `${sign}\\dfrac{${num}}{${r.d}}`;
}
/** Same value wrapped in parentheses when negative — for `6 \cdot (-\dfrac12)`. */
const rtTexP = (r: Rt) => (r.n < 0 ? `\\left(${rtTex(r)}\\right)` : rtTex(r));

/** mathjs-evaluable: `-3*sqrt(3)/2`, `5`, `0`. */
function rtExpr(r: Rt): string {
  if (r.n === 0) return '0';
  const root = r.rad === 1 ? '' : `sqrt(${r.rad})`;
  const num = !root ? String(r.n) : r.n === 1 ? root : r.n === -1 ? `-${root}` : `${r.n}*${root}`;
  return `${num}${r.d === 1 ? '' : `/${r.d}`}`;
}

/** sin of the first-quadrant special angles. */
const SIN: Record<number, Rt> = { 0: rt(0), 30: rt(1, 1, 2), 45: rt(1, 2, 2), 60: rt(1, 3, 2), 90: rt(1) };
const TAN: Record<number, Rt> = { 30: rt(1, 3, 3), 45: rt(1), 60: rt(1, 3) };

const norm360 = (deg: number) => ((deg % 360) + 360) % 360;
/** Quadrant 1–4 (boundaries go to the quadrant they open). */
function quad(deg: number): 1 | 2 | 3 | 4 {
  const t = norm360(deg);
  return t < 90 ? 1 : t < 180 ? 2 : t < 270 ? 3 : 4;
}
/** Reference (base) angle in the first quadrant. */
function ref(deg: number): number {
  const t = norm360(deg);
  if (t <= 90) return t;
  if (t <= 180) return 180 - t;
  if (t <= 270) return t - 180;
  return 360 - t;
}
function sinDeg(deg: number): Rt {
  const v = SIN[ref(deg)];
  return quad(deg) <= 2 ? v : rtNeg(v);
}
function cosDeg(deg: number): Rt {
  const v = SIN[90 - ref(deg)];
  const q = quad(deg);
  return q === 1 || q === 4 ? v : rtNeg(v);
}
function tanDeg(deg: number): Rt {
  const v = TAN[ref(deg)];
  const q = quad(deg);
  return q === 1 || q === 3 ? v : rtNeg(v);
}

const QUAD_HE = ['', 'הראשון', 'השני', 'השלישי', 'הרביעי'];

/** nπ/d as LaTeX, reduced: `\dfrac{\pi}{6}`, `\dfrac{5\pi}{6}`, `\pi`, `2\pi`, `0`. */
function radTexND(n: number, d: number): string {
  if (n === 0) return '0';
  const g = gcd(n, d);
  n /= g;
  d /= g;
  const num = n === 1 ? '\\pi' : `${n}\\pi`;
  return d === 1 ? num : `\\dfrac{${num}}{${d}}`;
}
const radTex = (deg: number) => radTexND(deg, 180);
/** Inline form for integral limits: `\pi/3`, `2\pi/3`, `\pi`. */
function radInline(deg: number): string {
  const g = gcd(deg, 180);
  const n = deg / g;
  const d = 180 / g;
  const num = n === 1 ? '\\pi' : `${n}\\pi`;
  return d === 1 ? num : `${num}/${d}`;
}

/** Coefficient in front of a function: 1 → '', -1 → '-', else the number. */
const coef = (a: number) => (a === 1 ? '' : a === -1 ? '-' : String(a));
/** ` + 3` / ` - 3` for a trailing constant. */
const signed = (b: number) => (b >= 0 ? ` + ${b}` : ` - ${-b}`);

function pickInt(rng: Rng, lo: number, hi: number, avoid: number[] = []): number {
  for (let i = 0; i < 25; i++) {
    const v = rng.int(lo, hi);
    if (v !== 0 && !avoid.includes(v)) return v;
  }
  return 0;
}

/** Pythagorean triples as (p, r, q): sin = p/q ⇒ cos = r/q. */
const TRIPLES: [number, number, number][] = [
  [3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17], [7, 24, 25], [24, 7, 25],
];

// ---------------------------------------------------------------------------
// 1 · trig-right-triangle — a side from an angle and a side
// ---------------------------------------------------------------------------

const rtSide: GenTemplate = {
  id: 'trig-rt-side',
  wrongAnswerTags: ['values-swapped', 'operation-swap'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'trig-right-triangle',
  title: 'צלע במשולש ישר-זווית מזווית וצלע',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    // Right angle at C: AB is the hypotenuse, BC is opposite A, AC is adjacent to A.
    // 45° is excluded: the two legs coincide and the "swapped ratio" distractor
    // would equal the answer.
    const A = rng.pick([30, 60]);
    const opp = rng.chance(0.5);
    const leg = opp ? 'BC' : 'AC';
    const fn = opp ? '\\sin' : '\\cos';
    const ratioName = opp ? 'סינוס' : 'קוסינוס';
    const legDesc = opp ? 'הניצב שמול הזווית' : 'הניצב שליד הזווית';
    const val = opp ? sinDeg(A) : cosDeg(A);
    const other = opp ? cosDeg(A) : sinDeg(A);
    const where = opp ? `הניצב $${leg}$ נמצא מול הזווית $A$.` : `הניצב $${leg}$ יוצא מהקודקוד $A$, ולכן הוא הניצב שליד הזווית.`;

    if (difficulty !== 'hard') {
      // Hypotenuse given, leg wanted: leg = hyp · ratio.
      const k = rng.int(2, difficulty === 'easy' ? 9 : 15);
      const hyp = 2 * k;
      const ans = rtMul(val, hyp);
      return open({
        question: `במשולש $ABC$ הזווית בקודקוד $C$ ישרה, הזווית בקודקוד $A$ שווה $${A}°$ והיתר $AB = ${hyp}$. מהו אורך הניצב $${leg}$?`,
        expected: { kind: 'value', value: rtExpr(ans) },
        wrongAnswers: [
          {
            value: rtExpr(rtMul(other, hyp)),
            note: `זה אורך הניצב השני. הצלע $${leg}$ היא ${legDesc} $A$, ולכן היחס שמתאים לה הוא ${ratioName}, לא היחס האחר.`,
          },
          {
            value: rtExpr(rtDiv(rt(hyp), val)),
            note: `חילקת ביחס במקום להכפיל בו. הניצב יושב במונה של היחס, ולכן $${leg} = AB \\cdot ${fn} ${A}°$, וניצב חייב לצאת קטן מהיתר $${hyp}$.`,
          },
        ],
        hint: `הצלע $${leg}$ היא ${legDesc} $A$. איזה יחס מקשר אותה ליתר?`,
        solution: {
          steps: [
            `**הכלל:** ${ratioName} של זווית חדה הוא ${legDesc} חלקי היתר. נתונים היתר והזווית ומבוקש ניצב, ולכן כותבים את היחס הזה ומבודדים את הניצב.`,
            where,
            `**הנוסחה:** $${fn} ${A}° = \\dfrac{${leg}}{AB}$.`,
            `**ההצבה:** $${leg} = ${hyp} \\cdot ${fn} ${A}° = ${hyp} \\cdot ${rtTex(val)} = ${rtTex(ans)}$.`,
          ],
          finalAnswer: `$${leg} = ${rtTex(ans)}$`,
          explanation: 'הניצב במונה, ולכן מכפילים את היתר ביחס. התוצאה קטנה מהיתר, כמצופה.',
        },
      });
    }

    // Hard: a leg given, hypotenuse wanted: hyp = leg / ratio.
    const m = rng.int(2, 12);
    const ans = rtDiv(rt(m), val);
    return open({
      question: `במשולש $ABC$ הזווית בקודקוד $C$ ישרה, הזווית בקודקוד $A$ שווה $${A}°$ והניצב $${leg} = ${m}$. מהו אורך היתר $AB$?`,
      expected: { kind: 'value', value: rtExpr(ans) },
      wrongAnswers: [
        {
          value: rtExpr(rtDiv(rt(m), other)),
          note: `נבחר היחס הלא נכון. הצלע $${leg}$ היא ${legDesc} $A$, ולכן היחס שמקשר אותה ליתר הוא ${ratioName}.`,
        },
        {
          value: rtExpr(rtMul(val, m)),
          note: `הכפלת ביחס במקום לחלק בו. היתר יושב במכנה של היחס, ולכן $AB = \\dfrac{${m}}{${fn} ${A}°}$, והיתר חייב לצאת גדול מהניצב $${m}$.`,
        },
      ],
      hint: `הצלע $${leg}$ היא ${legDesc} $A$. כתוב את היחס עם $AB$ במכנה ובודד אותו.`,
      solution: {
        steps: [
          `**הכלל:** ${ratioName} של זווית חדה הוא ${legDesc} חלקי היתר. נתונים ניצב והזווית ומבוקש היתר, ולכן כותבים את היחס הזה ומבודדים את היתר שבמכנה.`,
          where,
          `**הנוסחה:** $${fn} ${A}° = \\dfrac{${m}}{AB}$.`,
          `**ההצבה:** $AB = \\dfrac{${m}}{${fn} ${A}°} = \\dfrac{${m}}{${rtTex(val)}} = ${rtTex(ans)}$.`,
        ],
        finalAnswer: `$AB = ${rtTex(ans)}$`,
        explanation: 'היתר במכנה, ולכן מחלקים. התוצאה גדולה מהניצב, כמצופה.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 2 · trig-plane-basics — reduction identities 180°−α, 90°−α, −α
// ---------------------------------------------------------------------------

const pbReduction: GenTemplate = {
  id: 'trig-pb-reduction',
  distractorTags: [null, 'sign-slip', 'values-swapped', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'trig-plane-basics',
  title: 'זהויות הצמצום של זווית משלימה ונגדית',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    // 45° excluded: sin 45° = cos 45°, so two options would be equal in value.
    const a = pickInt(rng, 1, 89, [45]);
    const form = rng.pick(['180-a', '90-a', '-a'] as const);
    const f = rng.pick(['sin', 'cos'] as const);
    const cof = f === 'sin' ? 'cos' : 'sin';

    // Result: which function, which sign.
    let resF: 'sin' | 'cos';
    let sign: 1 | -1;
    let shown: string;
    let identity: string;
    let place: string;
    if (form === '180-a') {
      resF = f;
      sign = f === 'sin' ? 1 : -1;
      shown = difficulty === 'easy' ? `(180° - ${a}°)` : ` ${180 - a}°`;
      identity = `\\${f}(180° - \\alpha) = ${sign < 0 ? '-' : ''}\\${f}\\alpha`;
      place = `הזווית $${180 - a}°$ נמצאת ברבע השני, ושם הסינוס חיובי והקוסינוס שלילי.`;
    } else if (form === '90-a') {
      resF = cof;
      sign = 1;
      shown = difficulty === 'easy' ? `(90° - ${a}°)` : ` ${90 - a}°`;
      identity = `\\${f}(90° - \\alpha) = \\${cof}\\alpha`;
      place = `הזווית $${90 - a}°$ חדה, ושם כל הפונקציות חיוביות; ההשלמה לזווית ישרה מחליפה סינוס בקוסינוס.`;
    } else {
      resF = f;
      sign = f === 'sin' ? -1 : 1;
      shown = `(-${a}°)`;
      identity = `\\${f}(-\\alpha) = ${sign < 0 ? '-' : ''}\\${f}\\alpha`;
      place = `הזווית $-${a}°$ נמצאת ברבע הרביעי, ושם הקוסינוס חיובי והסינוס שלילי.`;
    }
    const resCof = resF === 'sin' ? 'cos' : 'sin';
    const opt = (fn: string, s: number) => `$${s < 0 ? '-' : ''}\\${fn} ${a}°$`;
    const correct = opt(resF, sign);
    const rewrite =
      form === '180-a'
        ? `כותבים את הזווית כהשלמה לזווית שטוחה: $${180 - a}° = 180° - ${a}°$.`
        : form === '90-a'
          ? `כותבים את הזווית כהשלמה לזווית ישרה: $${90 - a}° = 90° - ${a}°$.`
          : `הזווית שלילית, ולכן משתמשים בזהות הזווית הנגדית.`;
    const swapNote =
      form === '90-a'
        ? `הפונקציה לא התחלפה. בהשלמה לזווית ישרה סינוס הופך לקוסינוס ולהפך, כי הזוויות החדות במשולש ישר-זווית משלימות זו את זו.`
        : `הפונקציה התחלפה בלי סיבה. סינוס וקוסינוס מתחלפים רק בהשלמה לזווית ישרה; כאן הפונקציה נשארת והסימן הוא כל השאלה.`;

    return mcq({
      question: `לאיזה מהביטויים הבאים שווה $\\${f}${shown}$?`,
      answers: [correct, opt(resF, -sign), opt(resCof, sign), opt(resCof, -sign)],
      correct: 0,
      distractorNotes: [
        '',
        `הסימן שגוי. ${place}`,
        swapNote,
        `גם הפונקציה וגם הסימן שגויים. ${place} ${form === '90-a' ? 'והפונקציה מתחלפת.' : 'והפונקציה אינה מתחלפת.'}`,
      ],
      hint: 'באיזה רבע נמצאת הזווית? מה הסימן של הפונקציה שם, ומתי בכלל מתחלפים סינוס וקוסינוס?',
      solution: {
        steps: [
          '**הכלל:** זווית שאינה חדה, זווית שלילית או השלמה לזווית ישרה מצמצמים לזווית חדה בעזרת זהויות הצמצום: הסימן נקבע לפי הרבע שבו הזווית נמצאת, והפונקציה מתחלפת רק בהשלמה לזווית ישרה.',
          rewrite,
          `**הנוסחה:** $${identity}$.`,
          `${place}`,
          `לכן $\\${f}${shown} = ${correct.slice(1, -1)}$.`,
        ],
        finalAnswer: correct,
        explanation: 'הערך המספרי הוא של הזווית החדה; הרבע קובע את הסימן, וההשלמה לזווית ישרה מחליפה את הפונקציה.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 3–4 · trig-sine-cosine-laws
// ---------------------------------------------------------------------------

/** (b, c, angle) with an integer third side: b² + c² − 2bc·cos(angle) is a square. */
const COS_LAW_NICE: [number, number, number][] = [
  [3, 8, 60], [5, 8, 60], [7, 15, 60], [8, 15, 60], [5, 21, 60], [16, 21, 60], [6, 16, 60], [10, 16, 60],
  [3, 5, 120], [7, 8, 120], [5, 16, 120], [6, 10, 120], [9, 15, 120], [11, 24, 120], [7, 33, 120],
];

const lawCosSide: GenTemplate = {
  id: 'trig-law-cos-side',
  wrongAnswerTags: ['sign-slip', 'condition-ignored'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'trig-sine-cosine-laws',
  title: 'צלע ממשפט הקוסינוסים',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    let b: number, c: number, A: number;
    if (difficulty === 'easy') {
      [b, c, A] = rng.pick(COS_LAW_NICE);
      if (rng.chance(0.5)) [b, c] = [c, b];
    } else {
      A = rng.pick([60, 120]);
      b = rng.int(2, 12);
      c = pickInt(rng, 2, 12, [b]);
    }
    const cosA = cosDeg(A); // ±1/2
    const sq = b * b + c * c - (A === 60 ? b * c : -b * c);
    const ans = rt(1, sq);
    const flipped = rt(1, b * b + c * c + (A === 60 ? b * c : -b * c));
    const pyth = rt(1, b * b + c * c);
    const term = A === 60 ? `- ${b * c}` : `+ ${b * c}`;

    return open({
      question: `במשולש $ABC$ נתון $AB = ${c}$, $AC = ${b}$ והזווית $A = ${A}°$. חשב את אורך הצלע $BC$.`,
      expected: { kind: 'value', value: rtExpr(ans) },
      wrongAnswers: [
        {
          value: rtExpr(flipped),
          note: `הסימן של איבר התיקון התהפך. $\\cos ${A}° = ${rtTex(cosA)}$, ולכן $-2 \\cdot ${c} \\cdot ${b} \\cdot ${rtTexP(cosA)}$ שווה $${A === 60 ? '-' : '+'}${b * c}$${A === 120 ? ', וזווית קהה תמיד מגדילה את הצלע שמולה.' : ', וזווית חדה תמיד מקטינה את הצלע שמולה.'}`,
        },
        {
          value: rtExpr(pyth),
          note: `זה משפט פיתגורס, והוא תקף רק כשהזווית ישרה. הזווית כאן $${A}°$, ולכן חייבים את איבר התיקון $-2bc\\cos A$.`,
        },
      ],
      hint: 'שתי צלעות והזווית הכלואה ביניהן. איזה משפט מתחיל בדיוק מהנתונים האלה?',
      solution: {
        steps: [
          '**הכלל:** נתונות שתי צלעות והזווית הכלואה ביניהן ומבוקשת הצלע שמולה, וזה הטריגר למשפט הקוסינוסים: ריבוע הצלע שמול הזווית שווה לסכום ריבועי שתי הצלעות האחרות פחות פעמיים מכפלתן כפול קוסינוס הזווית.',
          `**הנוסחה:** $BC^2 = AB^2 + AC^2 - 2 \\cdot AB \\cdot AC \\cdot \\cos A$.`,
          `**ההצבה:** $BC^2 = ${c}^2 + ${b}^2 - 2 \\cdot ${c} \\cdot ${b} \\cdot \\cos ${A}°$.`,
          `$\\cos ${A}° = ${rtTex(cosA)}$, ולכן $BC^2 = ${c * c} + ${b * b} ${term} = ${sq}$.`,
          `$BC = \\sqrt{${sq}} = ${rtTex(ans)}$.`,
        ],
        finalAnswer: `$BC = ${rtTex(ans)}$`,
        explanation:
          A === 60
            ? 'זווית חדה נותנת קוסינוס חיובי, ולכן הצלע שמולה קטנה מזו של פיתגורס.'
            : 'זווית קהה נותנת קוסינוס שלילי, ולכן איבר התיקון מתווסף והצלע שמולה גדולה מזו של פיתגורס.',
      },
    });
  },
};

/** (A, B) pairs for the sine law. Excluded: (30,45) and (30,135), where the
 *  two named mistakes produce the same number, and (60,120), where equal sines
 *  make the "swapped pair" mistake land on the answer. */
const SIN_LAW_ACUTE: [number, number][] = [[30, 60], [60, 30], [60, 45], [45, 30], [45, 60]];
const SIN_LAW_ALL: [number, number][] = [
  ...SIN_LAW_ACUTE, [30, 120], [45, 120], [120, 30], [120, 45], [135, 30],
];

const lawSinSide: GenTemplate = {
  id: 'trig-law-sin-side',
  wrongAnswerTags: ['values-swapped', 'dropped-factor'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'trig-sine-cosine-laws',
  title: 'צלע ממשפט הסינוסים',
  skill: 'substitution',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const [A, B] = rng.pick(difficulty === 'easy' ? SIN_LAW_ACUTE : SIN_LAW_ALL);
    const a = rng.int(2, 12); // BC, opposite A
    const sA = sinDeg(A);
    const sB = sinDeg(B);
    const ans = rtMul(rtDiv(sB, sA), a); // AC = a·sinB / sinA

    return open({
      question: `במשולש $ABC$ נתון $BC = ${a}$, הזווית $A = ${A}°$ והזווית $B = ${B}°$. חשב את אורך הצלע $AC$.`,
      expected: { kind: 'value', value: rtExpr(ans) },
      wrongAnswers: [
        {
          value: rtExpr(rtMul(rtDiv(sA, sB), a)),
          note: `הזוגות התהפכו. הצלע $BC$ נמצאת מול הזווית $A$ והצלע $AC$ מול הזווית $B$, ולכן $\\dfrac{AC}{\\sin ${B}°} = \\dfrac{${a}}{\\sin ${A}°}$.`,
        },
        {
          value: rtExpr(rtMul(sB, a)),
          note: `חסרה החלוקה בסינוס הזווית שמול הצלע הנתונה. אחרי הכפלה ב-$\\sin ${B}°$ צריך עוד לחלק ב-$\\sin ${A}° = ${rtTex(sA)}$.`,
        },
      ],
      hint: 'יש זוג: צלע והזווית שמולה. כתוב את היחס של הזוג הזה, והשווה אותו ליחס של הצלע המבוקשת.',
      solution: {
        steps: [
          '**הכלל:** נתונה צלע יחד עם הזווית שמולה, כלומר זוג, ומבוקשת צלע שגם הזווית שמולה נתונה, וזה הטריגר למשפט הסינוסים: היחס בין צלע לסינוס הזווית שמולה קבוע בכל המשולש.',
          `הצלע $BC$ מול הזווית $A$, והצלע $AC$ מול הזווית $B$.`,
          `**הנוסחה:** $\\dfrac{AC}{\\sin B} = \\dfrac{BC}{\\sin A}$.`,
          `**ההצבה:** $AC = \\dfrac{${a} \\cdot \\sin ${B}°}{\\sin ${A}°} = \\dfrac{${a} \\cdot ${rtTex(sB)}}{${rtTex(sA)}} = ${rtTex(ans)}$.`,
        ],
        finalAnswer: `$AC = ${rtTex(ans)}$`,
        explanation: 'זוג ידוע קובע את היחס הקבוע; הזווית השנייה נותנת מיד את הצלע שמולה.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 5–6 · trig-triangle-area
// ---------------------------------------------------------------------------

const areaSin: GenTemplate = {
  id: 'trig-area-sin',
  wrongAnswerTags: ['dropped-factor', 'values-swapped'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'trig-triangle-area',
  title: 'שטח משולש משתי צלעות והזווית ביניהן',
  skill: 'substitution',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const a = rng.int(2, 12);
    const b = rng.int(2, 12);
    // 45°/135° excluded: sin 45° has no table neighbour to be confused with.
    const g = rng.pick(difficulty === 'easy' ? [30, 60] : [30, 60, 120, 150]);
    const s = sinDeg(g);
    const area = rtMul(s, a * b / 2);
    const twice = rtMul(s, a * b);
    // The table slip: sin 30° read as sin 60° and vice versa.
    const swappedBase = ref(g) === 30 ? 60 : 30;
    const swapped = rtMul(SIN[swappedBase], a * b / 2);
    const obtuse = g > 90 ? `$\\sin ${g}° = \\sin(180° - ${g}°) = \\sin ${180 - g}° = ${rtTex(s)}$.` : `$\\sin ${g}° = ${rtTex(s)}$.`;
    const question = rng.chance(0.5)
      ? `במשולש שתי צלעות באורך $${a}$ ובאורך $${b}$, והזווית ביניהן $${g}°$. מהו שטח המשולש?`
      : `במשולש $ABC$ נתון $AB = ${a}$, $AC = ${b}$ והזווית $A = ${g}°$. חשב את שטח המשולש.`;

    return open({
      question,
      expected: { kind: 'value', value: rtExpr(area) },
      wrongAnswers: [
        {
          value: rtExpr(twice),
          note: `נשמט החצי. נוסחת השטח היא חצי מכפלת הצלעות כפול הסינוס, והמכפלה $${a} \\cdot ${b} \\cdot ${rtTex(s)}$ היא פי שניים מהשטח.`,
        },
        {
          value: rtExpr(swapped),
          note: `הוחלף ערך בטבלה: הוצב $\\sin ${swappedBase}° = ${rtTex(SIN[swappedBase])}$ במקום $\\sin ${ref(g)}° = ${rtTex(s)}$. הסינוס של הזווית הקטנה יותר הוא הקטן יותר.`,
        },
      ],
      hint: 'שתי צלעות והזווית שביניהן. הנוסחה מכילה חצי, את שתי הצלעות וסינוס של הזווית הכלואה.',
      solution: {
        steps: [
          '**הכלל:** נתונות שתי צלעות והזווית שביניהן ומבוקש שטח, ולכן משתמשים בנוסחת השטח הטריגונומטרית: חצי מכפלת שתי הצלעות כפול סינוס הזווית הכלואה.',
          `**הנוסחה:** $S = \\dfrac{1}{2} \\cdot ${a} \\cdot ${b} \\cdot \\sin ${g}°$.`,
          obtuse,
          `**ההצבה:** $S = \\dfrac{1}{2} \\cdot ${a} \\cdot ${b} \\cdot ${rtTex(s)} = ${rtTex(area)}$.`,
        ],
        finalAnswer: `$S = ${rtTex(area)}$`,
        explanation: g > 90 ? 'זווית קהה וזווית המשלימה שלה לזווית שטוחה נותנות את אותו שטח, כי לשתיהן אותו סינוס.' : 'הסינוס של הזווית הכלואה הוא מה שהופך את מכפלת הצלעות לשטח.',
      },
    });
  },
};

const areaAngle: GenTemplate = {
  id: 'trig-area-angle',
  wrongAnswerTags: ['partial-answer', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'trig-triangle-area',
  title: 'הזווית משטח ושתי צלעות: שתי אפשרויות',
  skill: 'equation-solving',
  difficulties: ['mid', 'hard'],
  build(rng, difficulty) {
    const a = rng.int(2, 12);
    const b = rng.pick([4, 8, 12]); // ab divisible by 4 → S is n or n√3
    // 45° excluded: its "cosine instead of sine" slip lands on the acute answer itself.
    const alpha = rng.pick([30, 60]);
    const s = sinDeg(alpha);
    const S = rtMul(s, a * b / 2);
    const first = difficulty === 'hard' && rng.chance(0.5) ? `במשולש $ABC$ נתון $AB = ${a}$, $AC = ${b}$ ושטחו $${rtTex(S)}$. מצא את כל הערכים האפשריים של הזווית $A$ (במעלות).` : `במשולש שתי צלעות באורך $${a}$ ובאורך $${b}$, ושטחו $${rtTex(S)}$. מצא את כל הערכים האפשריים של הזווית ביניהן (במעלות).`;

    return open({
      question: `${first} רשום את הערכים מופרדים בפסיק.`,
      expected: { kind: 'set', values: [String(alpha), String(180 - alpha)] },
      wrongAnswers: [
        {
          value: String(alpha),
          note: `זו רק הזווית החדה. גם $\\sin ${180 - alpha}° = ${rtTex(s)}$, ולכן הזווית הקהה $${180 - alpha}°$ נותנת בדיוק את אותו שטח, ושתיהן אפשריות.`,
        },
        {
          value: String(90 - alpha),
          note: `זו הזווית שהקוסינוס שלה $${rtTex(s)}$. בנוסחת השטח מופיע סינוס, ולכן מחפשים זווית שהסינוס שלה $${rtTex(s)}$.`,
        },
      ],
      hint: 'הצב בנוסחת השטח וחלץ את הסינוס. לאיזה זוויות בין אפס לזווית שטוחה יש בדיוק את הסינוס הזה?',
      solution: {
        steps: [
          '**הכלל:** נתונים שטח ושתי צלעות ומבוקשת הזווית ביניהן, ולכן מציבים בנוסחת השטח הטריגונומטרית ומחלצים את הסינוס, וכיוון שלזווית ולמשלימתה לזווית שטוחה יש אותו סינוס, מתקבלות שתי זוויות אפשריות.',
          `**הנוסחה:** $S = \\dfrac{1}{2} \\cdot ${a} \\cdot ${b} \\cdot \\sin\\alpha$.`,
          `**ההצבה:** $\\sin\\alpha = \\dfrac{2S}{${a} \\cdot ${b}} = \\dfrac{2 \\cdot ${rtTex(S)}}{${a * b}} = ${rtTex(s)}$.`,
          `$\\alpha = ${alpha}°$ או $\\alpha = 180° - ${alpha}° = ${180 - alpha}°$.`,
        ],
        finalAnswer: `$\\alpha = ${alpha}°$ או $\\alpha = ${180 - alpha}°$`,
        explanation: 'סינוס אינו מבדיל בין זווית חדה לזווית הקהה המשלימה אותה, ולכן שני משולשים שונים נותנים את אותו שטח.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 7–8 · trig-identities
// ---------------------------------------------------------------------------

const idPythag: GenTemplate = {
  id: 'trig-id-pythag',
  distractorTags: [null, 'sign-slip', 'exponent-slip', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'trig-identities',
  title: 'מסינוס לקוסינוס דרך זהות פיתגורס',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const [p, r, q] = rng.pick(TRIPLES);
    const givenSin = difficulty === 'easy' ? true : rng.chance(0.5);
    const given = givenSin ? 'sin' : 'cos';
    const want = givenSin ? 'cos' : 'sin';
    // sin given: quadrant I or II decides the sign of cos. cos given: I or IV decides sin.
    const neg = rng.chance(0.5);
    const quadrant = neg ? (givenSin ? 2 : 4) : 1;
    const sign = neg ? -1 : 1;
    const val = new Frac(sign * r, q);
    const wantName = want === 'cos' ? 'הקוסינוס' : 'הסינוס';
    const lead = rng.chance(0.5) ? `נתון $\\${given} x = \\dfrac{${p}}{${q}}$, והזווית $x$ נמצאת ברבע ${QUAD_HE[quadrant]}.` : `הזווית $x$ נמצאת ברבע ${QUAD_HE[quadrant]}, ונתון $\\${given} x = \\dfrac{${p}}{${q}}$.`;
    const correct = `$${val.tex()}$`;

    return mcq({
      question: `${lead} מצא את $\\${want} x$.`,
      answers: [correct, `$${new Frac(-sign * r, q).tex()}$`, `$${new Frac(sign * r * r, q * q).tex()}$`, `$${new Frac(q - p, q).tex()}$`],
      correct: 0,
      distractorNotes: [
        '',
        `הסימן שגוי. ברבע ${QUAD_HE[quadrant]} ${wantName} ${neg ? 'שלילי' : 'חיובי'}, והרבע הוא מה שקובע את הסימן אחרי הוצאת השורש.`,
        `נשמט השורש. מזהות פיתגורס מתקבל $\\${want}^2 x = \\dfrac{${r * r}}{${q * q}}$, וזה הריבוע; צריך עוד להוציא שורש.`,
        `חוסר במקום ריבועים. הזהות היא $\\sin^2 x + \\cos^2 x = 1$, לא סכום של סינוס וקוסינוס, ולכן אי-אפשר לחסר $\\dfrac{${p}}{${q}}$ מאחד.`,
      ],
      hint: 'זהות פיתגורס נותנת את הריבוע. הרבע קובע את הסימן.',
      solution: {
        steps: [
          `**הכלל:** נתון ערך של ${given === 'sin' ? 'סינוס' : 'קוסינוס'} ומבוקש ${wantName} של אותה זווית, ולכן משתמשים בזהות פיתגורס, ואת הסימן של התוצאה קובע הרבע שבו הזווית נמצאת.`,
          `**הנוסחה:** $\\sin^2 x + \\cos^2 x = 1$.`,
          `**ההצבה:** $\\${want}^2 x = 1 - \\left(\\dfrac{${p}}{${q}}\\right)^2 = \\dfrac{${r * r}}{${q * q}}$.`,
          `ברבע ${QUAD_HE[quadrant]} ${wantName} ${neg ? 'שלילי' : 'חיובי'}, ולכן $\\${want} x = ${val.tex()}$.`,
        ],
        finalAnswer: `$\\${want} x = ${val.tex()}$`,
        explanation: 'הזהות נותנת את הריבוע בלבד; השורש יוצא עם שני סימנים, והרבע בוחר אחד מהם.',
      },
    });
  },
};

const idDouble: GenTemplate = {
  id: 'trig-id-double',
  wrongAnswerTags: ['dropped-factor', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'trig-identities',
  title: 'זווית כפולה מערך נתון של סינוס',
  skill: 'substitution',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const [p, r, q] = rng.pick(TRIPLES);
    const neg = difficulty === 'easy' ? false : rng.chance(0.5);
    const quadrant = neg ? 2 : 1;
    const cosX = new Frac(neg ? -r : r, q);
    const sinX = new Frac(p, q);
    const askSin = rng.chance(0.5);
    const lead = rng.chance(0.5) ? `נתון $\\sin x = ${sinX.tex()}$, והזווית $x$ נמצאת ברבע ${QUAD_HE[quadrant]}.` : `הזווית $x$ נמצאת ברבע ${QUAD_HE[quadrant]}, ונתון $\\sin x = ${sinX.tex()}$.`;

    if (askSin) {
      const ans = sinX.mul(cosX).mul(new Frac(2));
      return open({
        question: `${lead} מצא את $\\sin 2x$.`,
        expected: { kind: 'value', value: ans.expr() },
        wrongAnswers: [
          {
            value: sinX.mul(cosX).expr(),
            note: `נשמט המקדם $2$. הנוסחה היא $\\sin 2x = 2\\sin x\\cos x$, והמכפלה $\\sin x\\cos x$ לבדה היא רק חצי מהתשובה.`,
          },
          {
            value: sinX.mul(new Frac(2)).expr(),
            note: `סינוס אינו פונקציה ליניארית: $\\sin 2x$ אינו $2\\sin x$. צריך את נוסחת הזווית הכפולה, וגם את $\\cos x$.`,
          },
        ],
        hint: 'נוסחת הזווית הכפולה של הסינוס דורשת גם את הקוסינוס. השלם אותו קודם בעזרת זהות פיתגורס, עם הסימן של הרבע.',
        solution: {
          steps: [
            '**הכלל:** נתון סינוס של זווית ומבוקש סינוס הזווית הכפולה, ולכן משתמשים בנוסחת הזווית הכפולה, ולפני כן משלימים את הקוסינוס בעזרת זהות פיתגורס עם הסימן שמתאים לרבע.',
            `**הנוסחה:** $\\sin 2x = 2\\sin x\\cos x$.`,
            `מזהות פיתגורס: $\\cos^2 x = 1 - \\dfrac{${p * p}}{${q * q}} = \\dfrac{${r * r}}{${q * q}}$, וברבע ${QUAD_HE[quadrant]} $\\cos x = ${cosX.tex()}$.`,
            `**ההצבה:** $\\sin 2x = 2 \\cdot ${sinX.tex()} \\cdot ${cosX.n < 0 ? `\\left(${cosX.tex()}\\right)` : cosX.tex()} = ${ans.tex()}$.`,
          ],
          finalAnswer: `$\\sin 2x = ${ans.tex()}$`,
          explanation: 'המקדם 2 והקוסינוס עם הסימן הנכון הם שני המקומות שבהם התשובה נופלת.',
        },
      });
    }

    const ans = new Frac(1).sub(sinX.mul(sinX).mul(new Frac(2)));
    return open({
      question: `${lead} מצא את $\\cos 2x$.`,
      expected: { kind: 'value', value: ans.expr() },
      wrongAnswers: [
        {
          value: new Frac(1).sub(sinX.mul(sinX)).expr(),
          note: `נשמט המקדם $2$. הביטוי $1 - \\sin^2 x$ הוא $\\cos^2 x$, ואילו $\\cos 2x = 1 - 2\\sin^2 x$.`,
        },
        {
          value: cosX.mul(new Frac(2)).expr(),
          note: `קוסינוס אינו פונקציה ליניארית: $\\cos 2x$ אינו $2\\cos x$. צריך את נוסחת הזווית הכפולה.`,
        },
      ],
      hint: 'לקוסינוס הזווית הכפולה יש צורה שמכילה רק סינוס. בחר בה, ולא תצטרך את הקוסינוס בכלל.',
      solution: {
        steps: [
          '**הכלל:** נתון סינוס של זווית ומבוקש קוסינוס הזווית הכפולה, ולכן בוחרים בצורה של נוסחת הזווית הכפולה שמכילה רק את הסינוס הנתון, וכך הרבע אינו משנה.',
          `**הנוסחה:** $\\cos 2x = 1 - 2\\sin^2 x$.`,
          `**ההצבה:** $\\cos 2x = 1 - 2 \\cdot \\dfrac{${p * p}}{${q * q}} = ${ans.tex()}$.`,
        ],
        finalAnswer: `$\\cos 2x = ${ans.tex()}$`,
        explanation: 'לקוסינוס הזווית הכפולה שלוש צורות; זו שמכילה רק סינוס מתאימה בדיוק לנתון.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 9 · trig-equations — a basic equation in [0°, 360°)
// ---------------------------------------------------------------------------

type TrigFn = 'sin' | 'cos' | 'tan';

/** The two solutions in [0°, 360°) of fn(x) = ±value(alpha). */
function solutionsDeg(fn: TrigFn, alpha: number, neg: boolean): [number, number] {
  if (fn === 'sin') return neg ? [180 + alpha, 360 - alpha] : [alpha, 180 - alpha];
  if (fn === 'cos') return neg ? [180 - alpha, 180 + alpha] : [alpha, 360 - alpha];
  return neg ? [180 - alpha, 360 - alpha] : [alpha, 180 + alpha];
}
const fnValue = (fn: TrigFn, alpha: number): Rt => (fn === 'tan' ? TAN[alpha] : SIN[alpha]);
const FN_HE: Record<TrigFn, string> = { sin: 'הסינוס', cos: 'הקוסינוס', tan: 'הטנגנס' };

/** `\sin x = -\dfrac{1}{2}` or the cleared form `2\sin x + 1 = 0`. */
function equationTex(fn: TrigFn, v: Rt, neg: boolean, cleared: boolean): string {
  if (!cleared) return `\\${fn} x = ${neg ? '-' : ''}${rtTex(v)}`;
  const num = rtTex(rt(v.n, v.rad));
  return `${v.d === 1 ? '' : v.d}\\${fn} x ${neg ? '+' : '-'} ${num} = 0`;
}

/** The sentence that places the two solutions, per function and sign. */
function placeSolutions(fn: TrigFn, alpha: number, neg: boolean): string {
  const [x1, x2] = solutionsDeg(fn, alpha, neg);
  const name = FN_HE[fn];
  if (fn === 'sin') {
    return neg
      ? `${name} שלילי, ולכן הזוויות ברבעים השלישי והרביעי: $x = 180° + ${alpha}° = ${x1}°$ וגם $x = 360° - ${alpha}° = ${x2}°$.`
      : `${name} חיובי, ולכן הזוויות ברבעים הראשון והשני: $x = ${x1}°$ וגם $x = 180° - ${alpha}° = ${x2}°$.`;
  }
  if (fn === 'cos') {
    return neg
      ? `${name} שלילי, ולכן הזוויות ברבעים השני והשלישי: $x = 180° - ${alpha}° = ${x1}°$ וגם $x = 180° + ${alpha}° = ${x2}°$.`
      : `${name} חיובי, ולכן הזוויות ברבעים הראשון והרביעי: $x = ${x1}°$ וגם $x = 360° - ${alpha}° = ${x2}°$.`;
  }
  return neg
    ? `${name} שלילי, ולכן הזוויות ברבעים השני והרביעי: $x = 180° - ${alpha}° = ${x1}°$ וגם $x = ${x1}° + 180° = ${x2}°$.`
    : `${name} חיובי, ולכן הזוויות ברבעים הראשון והשלישי: $x = ${x1}°$ וגם $x = ${alpha}° + 180° = ${x2}°$.`;
}

const RULE_EQ: Record<TrigFn, string> = {
  sin: '**הכלל:** משוואת סינוס בסיסית: מוצאים מהערך את זווית הבסיס, ואז את שתי הזוויות בתחום לפי הכלל שלזווית ולמשלימתה לזווית שטוחה יש אותו סינוס, והסימן קובע באילו רבעים הן.',
  cos: '**הכלל:** משוואת קוסינוס בסיסית: מוצאים מהערך את זווית הבסיס, ואז את שתי הזוויות בתחום לפי הכלל שלזווית ולנגדית לה יש אותו קוסינוס, והסימן קובע באילו רבעים הן.',
  tan: '**הכלל:** משוואת טנגנס בסיסית: מוצאים מהערך את זווית הבסיס, ואז את שתי הזוויות בתחום לפי הכלל שמחזור הטנגנס הוא זווית שטוחה, והסימן קובע באילו רבעים הן.',
};

const eqBasic: GenTemplate = {
  id: 'trig-eq-basic',
  wrongAnswerTags: ['partial-answer', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'trig-equations',
  title: 'משוואה טריגונומטרית בסיסית בתחום',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const fn = rng.pick(['sin', 'cos', 'tan'] as const);
    const alpha = rng.pick([30, 45, 60]);
    const neg = rng.chance(0.5);
    const v = fnValue(fn, alpha);
    const [x1, x2] = solutionsDeg(fn, alpha, neg);
    const otherFn: TrigFn = fn === 'sin' ? 'cos' : 'sin';
    const [o1, o2] = solutionsDeg(otherFn, alpha, neg);
    const eq = equationTex(fn, v, neg, difficulty !== 'easy');
    const lead = rng.chance(0.5) ? `פתור את המשוואה $${eq}$` : `מצא את כל הפתרונות של המשוואה $${eq}$`;

    return open({
      question: `${lead} בתחום $0° \\le x < 360°$. רשום את כל הפתרונות, מופרדים בפסיק.`,
      expected: { kind: 'set', values: [String(x1), String(x2)] },
      wrongAnswers: [
        {
          value: String(x1),
          note: `זה פתרון אחד נכון, אבל בסיבוב שלם ${FN_HE[fn]} מקבל כל ערך פעמיים. חסרה הזווית $${x2}°$.`,
        },
        {
          value: `${o1},${o2}`,
          note: `זו התבנית של ${FN_HE[otherFn]}. ${fn === 'cos' ? 'בקוסינוס הזווית השנייה היא הנגדית, כלומר ההשלמה לסיבוב שלם, ולא ההשלמה לזווית שטוחה.' : fn === 'sin' ? 'בסינוס הזווית השנייה היא ההשלמה לזווית שטוחה, ולא ההשלמה לסיבוב שלם.' : 'בטנגנס הזווית השנייה רחוקה מהראשונה בזווית שטוחה, כי זה המחזור שלו.'}`,
        },
      ],
      hint: `מצא קודם את הזווית החדה שערכה $${rtTex(v)}$, ואז שאל באילו רבעים ${FN_HE[fn]} ${neg ? 'שלילי' : 'חיובי'}.`,
      solution: {
        steps: [
          RULE_EQ[fn],
          ...(difficulty !== 'easy' ? [`מבודדים: $\\${fn} x = ${neg ? '-' : ''}${rtTex(v)}$.`] : []),
          `זווית הבסיס: $\\${fn} ${alpha}° = ${rtTex(v)}$.`,
          placeSolutions(fn, alpha, neg),
        ],
        finalAnswer: `$x = ${x1}°$ וגם $x = ${x2}°$`,
        explanation: 'זווית הבסיס נותנת את הגודל, והסימן של הערך הנתון בוחר את שני הרבעים.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 10 · special-angles-reduction — the exact value of a non-acute angle
// ---------------------------------------------------------------------------

const specialValue: GenTemplate = {
  id: 'trig-special-value',
  distractorTags: [null, 'sign-slip', 'values-swapped', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'special-angles-reduction',
  title: 'ערך מדויק של זווית שאינה חדה',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    // The 45° family is excluded: sin and cos share a magnitude, so the
    // "read the other coordinate" distractor would equal the answer.
    const base = [120, 150, 210, 240, 300, 330];
    const theta = rng.pick(difficulty === 'easy' ? base : [...base, -30, -60, -120, -150, -210, -240]);
    const fn = rng.pick(['sin', 'cos', 'tan'] as const);
    const t = norm360(theta);
    const q = quad(t);
    const a = ref(t);
    const v = fn === 'sin' ? sinDeg(t) : fn === 'cos' ? cosDeg(t) : tanDeg(t);
    const coName = fn === 'sin' ? 'הקוסינוס' : fn === 'cos' ? 'הסינוס' : 'הקוטנגנס';
    // The co-function's magnitude, carrying the correct sign.
    const coMag = fn === 'tan' ? rtDiv(rt(1), v) : rtMul(fn === 'sin' ? cosDeg(a) : sinDeg(a), v.n < 0 ? -1 : 1);
    const positive = (fn === 'sin' && q <= 2) || (fn === 'cos' && (q === 1 || q === 4)) || (fn === 'tan' && (q === 1 || q === 3));
    const reduce = q === 2 ? `180° - ${t}° = ${a}°` : q === 3 ? `${t}° - 180° = ${a}°` : `360° - ${t}° = ${a}°`;
    const shown = theta < 0 ? `(${theta}°)` : ` ${theta}°`;
    const correct = `$${rtTex(v)}$`;
    const signWord = positive ? 'חיובי' : 'שלילי';

    return mcq({
      question: rng.chance(0.5) ? `מהו $\\${fn}${shown}$?` : `חשב את $\\${fn}${shown}$.`,
      answers: [correct, `$${rtTex(rtNeg(v))}$`, `$${rtTex(coMag)}$`, `$${rtTex(rtNeg(coMag))}$`],
      correct: 0,
      distractorNotes: [
        '',
        `הגודל נכון והסימן שגוי. הזווית ברבע ${QUAD_HE[q]}, ושם ${FN_HE[fn]} ${signWord}.`,
        `זה הערך של ${coName} של זווית הבסיס, לא של ${FN_HE[fn]}. ${fn === 'tan' ? 'היחס התהפך.' : 'הוחלף בין שתי הפונקציות בטבלת הערכים.'}`,
        `גם הפונקציה וגם הסימן שגויים: זה ${coName} של זווית הבסיס עם הסימן ההפוך.`,
      ],
      hint: 'באיזה רבע נמצאת הזווית? מהי זווית הבסיס שלה, ומה הסימן של הפונקציה באותו רבע?',
      solution: {
        steps: [
          '**הכלל:** זווית שאינה חדה מצמצמים לזווית הבסיס שלה ברבע הראשון: הערך המספרי הוא הערך של זווית הבסיס, והסימן נקבע לפי הרבע שבו הזווית נמצאת.',
          ...(theta < 0 ? [`זווית שלילית משלימים לסיבוב: $${theta}° + 360° = ${t}°$.`] : []),
          `הזווית $${t}°$ נמצאת ברבע ${QUAD_HE[q]}, וזווית הבסיס שלה היא $${reduce}$.`,
          `ברבע ${QUAD_HE[q]} ${FN_HE[fn]} ${signWord}.`,
          `$\\${fn} ${a}° = ${rtTex(fn === 'sin' ? sinDeg(a) : fn === 'cos' ? cosDeg(a) : tanDeg(a))}$, ולכן $\\${fn}${shown} = ${rtTex(v)}$.`,
        ],
        finalAnswer: `$\\${fn}${shown} = ${rtTex(v)}$`,
        explanation: 'הטבלה הקטנה של הזוויות החדות מספיקה לכל המעגל; הרבע רק מוסיף סימן.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 11 · trig-calculus — the extremum of a sin x + b cos x
// ---------------------------------------------------------------------------

const PYTH_PAIRS: [number, number][] = [[3, 4], [6, 8], [5, 12], [8, 15], [7, 24], [9, 12], [12, 16], [15, 20], [20, 21]];

const calcRsinMax: GenTemplate = {
  id: 'trig-calc-rsin-max',
  wrongAnswerTags: ['formula-mismatch', 'partial-answer'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'trig-calculus',
  title: 'קיצון של סכום סינוס וקוסינוס',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    let [a, b] = rng.pick(PYTH_PAIRS);
    if (rng.chance(0.5)) [a, b] = [b, a];
    if (difficulty !== 'easy') {
      if (rng.chance(0.5)) a = -a;
      if (rng.chance(0.5)) b = -b;
    }
    const R = Math.sqrt(a * a + b * b);
    const wantMax = rng.chance(0.5);
    const sign = wantMax ? 1 : -1;
    const fx = `${coef(a)}\\sin x ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}\\cos x`;
    const word = wantMax ? 'המקסימלי' : 'המינימלי';
    const sub = wantMax ? '\\max' : '\\min';

    return open({
      question: rng.chance(0.5) ? `מהו הערך ${word} של $f(x) = ${fx}$?` : `נתונה הפונקציה $f(x) = ${fx}$. מצא את הערך ${word} שלה.`,
      expected: { kind: 'value', value: String(sign * R) },
      wrongAnswers: [
        {
          value: String(sign * (Math.abs(a) + Math.abs(b))),
          note: `סכום המקדמים אינו הקיצון. הסינוס והקוסינוס אינם מגיעים לשיא באותה זווית, ולכן המשרעת של הסכום היא $\\sqrt{${a < 0 ? `(${a})` : a}^2 + ${b < 0 ? `(${b})` : b}^2} = ${R}$, קטנה מסכום המקדמים.`,
        },
        {
          value: String(sign * Math.max(Math.abs(a), Math.abs(b))),
          note: `זה רק המקדם הגדול מבין השניים. שני האיברים תורמים לגל היחיד, והמשרעת שלו היא שורש סכום ריבועי המקדמים.`,
        },
      ],
      hint: 'כתוב את הסכום כגל יחיד. המשרעת שלו היא שורש סכום ריבועי המקדמים, וסינוס מגיע לכל היותר לאחד.',
      solution: {
        steps: [
          '**הכלל:** סכום של סינוס וקוסינוס של אותה זווית כששואלים על ערך מקסימלי או מינימלי כותבים כגל יחיד בצורת $R\\sin(x + \\varphi)$, שבו $R$ הוא שורש סכום ריבועי המקדמים, והקיצון הוא $R$ במקסימום ומינוס $R$ במינימום.',
          `**הנוסחה:** $R = \\sqrt{a^2 + b^2}$ עבור $f(x) = a\\sin x + b\\cos x$.`,
          `**ההצבה:** $R = \\sqrt{${a < 0 ? `(${a})` : a}^2 + ${b < 0 ? `(${b})` : b}^2} = \\sqrt{${a * a + b * b}} = ${R}$.`,
          wantMax
            ? `$\\sin(x + \\varphi) \\le 1$, ולכן הערך המקסימלי הוא $R = ${R}$.`
            : `$\\sin(x + \\varphi) \\ge -1$, ולכן הערך המינימלי הוא $-R = ${-R}$.`,
        ],
        finalAnswer: `$f_{${sub}} = ${sign * R}$`,
        explanation: 'המשרעת של הגל היחיד היא כל מה שצריך; הסימנים של המקדמים משנים רק את הזווית של ההזזה.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 12 · tf-equations — the general solution (degrees, as the lesson writes it)
// ---------------------------------------------------------------------------

const eqGeneral: GenTemplate = {
  id: 'tf-eq-general',
  distractorTags: [null, 'formula-mismatch', 'formula-mismatch', 'partial-answer'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'tf-equations',
  title: 'הפתרון הכללי של משוואת סינוס או קוסינוס',
  skill: 'formula-choice',
  difficulties: ['mid', 'hard'],
  build(rng, difficulty) {
    const fn = rng.pick(['sin', 'cos'] as const);
    const alpha = rng.pick([30, 45, 60]);
    const neg = rng.chance(0.5);
    const v = SIN[alpha];
    const eq = equationTex(fn, v, neg, difficulty === 'hard');
    // The first family's angle, and the two-family form.
    const t1 = fn === 'sin' ? (neg ? 180 + alpha : alpha) : neg ? 180 - alpha : alpha;
    const t2 = fn === 'sin' ? (neg ? 360 - alpha : 180 - alpha) : 0;
    const sinShape = (x: number) => `$x = ${x}° + 360°k$ וגם $x = ${180 - x}° + 360°k$`;
    const cosShape = (x: number) => `$x = \\pm ${x}° + 360°k$`;
    const correct = fn === 'sin' ? `$x = ${t1}° + 360°k$ וגם $x = ${t2}° + 360°k$` : cosShape(t1);
    const otherShape = fn === 'sin' ? cosShape(t1) : sinShape(t1);
    const lead = rng.pick([`מהו הפתרון הכללי של המשוואה $${eq}$?`, `רשום את הפתרון הכללי של $${eq}$.`, `נתונה המשוואה $${eq}$. מהו הפתרון הכללי שלה?`]);

    return mcq({
      question: lead,
      answers: [correct, `$x = ${t1}° + 180°k$`, otherShape, `$x = ${t1}° + 360°k$`],
      correct: 0,
      distractorNotes: [
        '',
        `המחזור שנרשם הוא של הטנגנס. סינוס וקוסינוס חוזרים על עצמם רק אחרי סיבוב שלם, ולכן המחזור הוא $360°$, וגם המשפחה השנייה חסרה.`,
        fn === 'sin'
          ? `זו תבנית הקוסינוס: פלוס-מינוס אותה זווית. בסינוס המשפחה השנייה היא ההשלמה לזווית שטוחה, כי $\\sin(180° - x) = \\sin x$, ואילו $\\sin(-x) = -\\sin x$.`
          : `זו תבנית הסינוס. בקוסינוס הזווית הנגדית נותנת אותו ערך, כי $\\cos(-x) = \\cos x$, ולכן המשפחה השנייה היא מינוס הזווית ולא ההשלמה לזווית שטוחה.`,
        `זו משפחה אחת בלבד. בכל סיבוב ${FN_HE[fn]} מקבל את הערך פעמיים, ולכן לפתרון הכללי שתי משפחות.`,
      ],
      hint: `מהו המחזור של ${FN_HE[fn]}, ואיזו זווית שנייה נותנת את אותו ערך בכל סיבוב?`,
      solution: {
        steps: [
          fn === 'sin'
            ? '**הכלל:** מבוקש פתרון כללי, ולכן כותבים את המשפחות עם $k$ שלם: למשוואת סינוס יש שתי משפחות במחזור של סיבוב שלם, הזווית הבסיסית והשלמתה לזווית שטוחה.'
            : '**הכלל:** מבוקש פתרון כללי, ולכן כותבים את המשפחות עם $k$ שלם: למשוואת קוסינוס יש שתי משפחות במחזור של סיבוב שלם, הזווית הבסיסית והנגדית לה, ולכן כותבים פלוס-מינוס.',
          ...(difficulty === 'hard' ? [`מבודדים: $\\${fn} x = ${neg ? '-' : ''}${rtTex(v)}$.`] : []),
          `זווית הבסיס: $\\${fn} ${alpha}° = ${rtTex(v)}$.`,
          neg
            ? fn === 'sin'
              ? `הסינוס שלילי, ולכן הזוויות מתחת לציר: $${t1}°$ וגם $${t2}°$.`
              : `הקוסינוס שלילי, ולכן הזווית ברבע השני: $180° - ${alpha}° = ${t1}°$, והנגדית לה.`
            : fn === 'sin'
              ? `הסינוס חיובי: $${t1}°$ וגם $180° - ${alpha}° = ${t2}°$.`
              : `הקוסינוס חיובי: $${t1}°$ והנגדית לה, $-${t1}°$.`,
          `מוסיפים את המחזור: ${correct}.`,
        ],
        finalAnswer: correct,
        explanation: 'שתי משפחות ומחזור של סיבוב שלם; זה מה שמבדיל את הסינוס והקוסינוס מהטנגנס.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 13 · tf-domain — vertical asymptotes of a trig quotient (radians)
// ---------------------------------------------------------------------------

const domAsymptotes: GenTemplate = {
  id: 'tf-dom-asymptotes',
  distractorTags: [null, 'partial-answer', 'sign-slip', 'values-swapped'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'tf-domain',
  title: 'אסימפטוטות אנכיות של מנה טריגונומטרית',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const fn = rng.pick(['sin', 'cos'] as const);
    const alpha = rng.pick([30, 45, 60]);
    const neg = difficulty === 'easy' ? false : rng.chance(0.5);
    const v = SIN[alpha];
    const denom = equationTex(fn, v, neg, true).replace(' = 0', '');
    // Numerator never vanishes where the denominator does.
    const numer = rng.pick(['1', '2', '3', fn === 'sin' ? '\\cos x' : '\\sin x', 'x']);
    const otherFn: TrigFn = fn === 'sin' ? 'cos' : 'sin';
    const set = (xs: number[]) => xs.map((x) => `$x = ${radTex(x)}$`).join(', ');
    const sol = solutionsDeg(fn, alpha, neg);
    const correct = set(sol);
    const [x1, x2] = sol;
    const second =
      fn === 'sin'
        ? neg
          ? `$x = \\pi + ${radTex(alpha)} = ${radTex(x1)}$ וגם $x = 2\\pi - ${radTex(alpha)} = ${radTex(x2)}$`
          : `$x = ${radTex(x1)}$ וגם $x = \\pi - ${radTex(alpha)} = ${radTex(x2)}$`
        : neg
          ? `$x = \\pi - ${radTex(alpha)} = ${radTex(x1)}$ וגם $x = \\pi + ${radTex(alpha)} = ${radTex(x2)}$`
          : `$x = ${radTex(x1)}$ וגם $x = 2\\pi - ${radTex(alpha)} = ${radTex(x2)}$`;

    return mcq({
      question: `מהן האסימפטוטות האנכיות של $f(x) = \\dfrac{${numer}}{${denom}}$ בתחום $0 \\le x \\le 2\\pi$?`,
      answers: [correct, set([x1]), set(solutionsDeg(fn, alpha, !neg)), set(solutionsDeg(otherFn, alpha, neg))],
      correct: 0,
      distractorNotes: [
        '',
        `זו אסימפטוטה אחת נכונה, אבל בסיבוב שלם ${FN_HE[fn]} מקבל את הערך פעמיים, ולכן המכנה מתאפס פעמיים.`,
        `נפתרה המשוואה עם הסימן ההפוך. מהמכנה $${denom} = 0$ מקבלים $\\${fn} x = ${neg ? '-' : ''}${rtTex(v)}$, ${neg ? 'ערך שלילי' : 'ערך חיובי'}, וזה קובע את הרבעים.`,
        `זו התבנית של ${FN_HE[otherFn]}. המכנה מכיל ${FN_HE[fn]}, ${fn === 'sin' ? 'והזווית השנייה שלו היא ההשלמה לזווית שטוחה' : 'והזווית השנייה שלו היא הנגדית'}.`,
      ],
      hint: 'אסימפטוטה אנכית: המכנה אפס והמונה לא. השווה את המכנה לאפס ופתור בתחום, ברדיאנים.',
      solution: {
        steps: [
          '**הכלל:** אסימפטוטה אנכית של מנה נמצאת במקום שבו המכנה מתאפס והמונה אינו מתאפס, ולכן משווים את המכנה לאפס ופותרים משוואה טריגונומטרית בתחום, ברדיאנים.',
          `מאפסים את המכנה: $${denom} = 0$, כלומר $\\${fn} x = ${neg ? '-' : ''}${rtTex(v)}$.`,
          `זווית הבסיס: $${radTex(alpha)}$. ${FN_HE[fn]} ${neg ? 'שלילי' : 'חיובי'}, ולכן ${second}.`,
          'המונה אינו מתאפס באף אחת מהנקודות האלה, ולכן שתיהן אסימפטוטות אנכיות.',
        ],
        finalAnswer: correct,
        explanation: 'המכנה מתאפס פעמיים בסיבוב, והמונה שונה מאפס שם, ולכן שתי אסימפטוטות.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 14 · tf-derivative — slope of a tangent to a·sin(bx) / a·cos(bx) (radians)
// ---------------------------------------------------------------------------

const derSlope: GenTemplate = {
  id: 'tf-der-slope',
  wrongAnswerTags: ['dropped-factor', 'sign-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'tf-derivative',
  title: 'שיפוע משיק לפונקציה טריגונומטרית עם כלל השרשרת',
  skill: 'substitution',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const fn = rng.pick(['sin', 'cos'] as const);
    const a = difficulty === 'easy' ? rng.int(1, 5) : pickInt(rng, -5, 5);
    const b = rng.pick(difficulty === 'easy' ? [2, 3] : [2, 3, 4]);
    // bx₀ = θ. Excluded: θ where the derivative is zero (its sign-slip would
    // coincide with the answer).
    const thetas = difficulty === 'hard' ? [30, 60, 120, 150, 180] : [30, 60, 90];
    const theta = rng.pick(thetas.filter((t) => (fn === 'sin' ? t !== 90 : t !== 180)));
    // x₀ = θ/b as nπ/d.
    const g = gcd(theta, 180 * b);
    const x0 = radTexND(theta / g, (180 * b) / g);
    const inner = fn === 'sin' ? cosDeg(theta) : sinDeg(theta); // sin' = cos, cos' = -sin
    const ab = fn === 'sin' ? a * b : -a * b;
    const ans = rtMul(inner, ab);
    const dfn = fn === 'sin' ? 'cos' : 'sin';
    const fx = `${coef(a)}\\${fn} ${b}x`;

    return open({
      question: `נתונה הפונקציה $f(x) = ${fx}$. מצא את שיפוע המשיק לגרף הפונקציה בנקודה שבה $x = ${x0}$.`,
      expected: { kind: 'value', value: rtExpr(ans) },
      wrongAnswers: [
        {
          value: rtExpr(rtMul(inner, fn === 'sin' ? a : -a)),
          note: `נשמטה הנגזרת הפנימית. הזווית היא $${b}x$, ולכן לפי כלל השרשרת מכפילים גם ב-$${b}$: $f'(x) = ${coef(ab)}\\${dfn} ${b}x$.`,
        },
        {
          value: rtExpr(rtNeg(ans)),
          note: fn === 'sin'
            ? `הסימן התהפך. הנגזרת של הסינוס היא הקוסינוס בלי מינוס; המינוס מופיע רק בנגזרת של הקוסינוס.`
            : `נשמט המינוס. הנגזרת של הקוסינוס היא מינוס הסינוס, ולכן $f'(x) = ${coef(ab)}\\sin ${b}x$.`,
        },
      ],
      hint: 'גזור בכלל השרשרת, ואז הצב את הנקודה בנגזרת. הזווית שתתקבל היא זווית מיוחדת.',
      solution: {
        steps: [
          '**הכלל:** מבוקש שיפוע משיק, ולכן גוזרים ומציבים את הנקודה בנגזרת, וכאן הזווית היא ביטוי פנימי ולכן גוזרים בכלל השרשרת: נגזרת הפונקציה הטריגונומטרית כפול נגזרת הפנימית.',
          fn === 'sin'
            ? `**הנוסחה:** $f'(x) = ${coef(a)}\\cos ${b}x \\cdot ${b} = ${coef(ab)}\\cos ${b}x$.`
            : `**הנוסחה:** $f'(x) = ${a} \\cdot (-\\sin ${b}x) \\cdot ${b} = ${coef(ab)}\\sin ${b}x$.`,
          `**ההצבה:** $f'\\left(${x0}\\right) = ${coef(ab)}\\${dfn} ${radTex(theta)}$, וכיוון ש-$\\${dfn} ${radTex(theta)} = ${rtTex(inner)}$, מקבלים $${ab} \\cdot ${rtTexP(inner)} = ${rtTex(ans)}$.`,
        ],
        finalAnswer: `$m = ${rtTex(ans)}$`,
        explanation: 'שיפוע המשיק הוא ערך הנגזרת בנקודה; המקדם הפנימי מוכפל החוצה בכלל השרשרת.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 15 · tf-investigation — the extreme value of a·sin(bx) + c
// ---------------------------------------------------------------------------

const invMaxValue: GenTemplate = {
  id: 'tf-inv-max-value',
  wrongAnswerTags: ['sign-slip', 'dropped-factor'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'tf-investigation',
  title: 'ערך המקסימום או המינימום של פונקציה טריגונומטרית',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const fn = rng.pick(['sin', 'cos'] as const);
    const a = difficulty === 'easy' ? rng.int(2, 6) : pickInt(rng, -6, 6, [1]);
    const A = Math.abs(a);
    // c ≠ ±2|a|: there the two named mistakes would coincide.
    const c = pickInt(rng, -9, 9, [2 * A, -2 * A]);
    const b = difficulty === 'easy' ? 1 : rng.pick([1, 2, 3]);
    const wantMax = rng.chance(0.5);
    const ans = wantMax ? c + A : c - A;
    const fx = `${coef(a)}\\${fn} ${b === 1 ? '' : b}x${signed(c)}`;
    const word = wantMax ? 'המקסימלי' : 'המינימלי';
    const sub = wantMax ? '\\max' : '\\min';
    const arg = `${b === 1 ? '' : b}x`;

    return open({
      question: rng.chance(0.5) ? `מהו הערך ${word} של הפונקציה $f(x) = ${fx}$?` : `נתונה הפונקציה $f(x) = ${fx}$. מצא את הערך ${word} שלה.`,
      expected: { kind: 'value', value: String(ans) },
      wrongAnswers: [
        {
          value: String(wantMax ? c - A : c + A),
          note: wantMax
            ? `זה הערך המינימלי. המקסימום מתקבל כשהאיבר הטריגונומטרי תורם $+${A}$, כלומר $${c} + ${A}$.`
            : `זה הערך המקסימלי. המינימום מתקבל כשהאיבר הטריגונומטרי תורם $-${A}$, כלומר $${c} - ${A}$.`,
        },
        {
          value: String(wantMax ? A : -A),
          note: `נשמט הקבוע. האיבר $${wantMax ? '' : '-'}${A}$ הוא הקצה של האיבר הטריגונומטרי בלבד, והקבוע $${c}$ מזיז את כל הגרף ולכן מתווסף לקיצון.`,
        },
      ],
      hint: 'סינוס וקוסינוס נעים בין מינוס אחד לאחד. מה קורה לתחום הזה כשכופלים במקדם ומוסיפים קבוע?',
      solution: {
        steps: [
          '**הכלל:** סינוס וקוסינוס נעים בין מינוס אחד לאחד, ולכן לפונקציה מהצורה מקדם כפול הפונקציה הטריגונומטרית ועוד קבוע, הערך המקסימלי הוא הקבוע ועוד הערך המוחלט של המקדם, והמינימלי הוא הקבוע פחות הערך המוחלט של המקדם.',
          `$-1 \\le \\${fn} ${arg} \\le 1$.`,
          a > 0
            ? `כופלים ב-$${a}$: $${-A} \\le ${coef(a)}\\${fn} ${arg} \\le ${A}$.`
            : `כופלים ב-$${a}$, מספר שלילי, והכיוון מתהפך: $${-A} \\le ${coef(a)}\\${fn} ${arg} \\le ${A}$.`,
          `מוסיפים $${c}$: $${c - A} \\le f(x) \\le ${c + A}$.`,
          `הערך ${word} הוא $${ans}$.`,
        ],
        finalAnswer: `$f_{${sub}} = ${ans}$`,
        explanation: 'המקדם קובע את המשרעת והקבוע את הגובה של קו האמצע; הקצוות הם קו האמצע פלוס-מינוס המשרעת.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 16 · tf-integral — a definite integral of a·sin x / a·cos x from 0 (radians)
// ---------------------------------------------------------------------------

const intDefinite: GenTemplate = {
  id: 'tf-int-definite',
  wrongAnswerTags: ['sign-slip', 'dropped-factor'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'tf-integral',
  title: 'אינטגרל מסוים של סינוס או קוסינוס',
  skill: 'substitution',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const fn = rng.pick(['sin', 'cos'] as const);
    const a = difficulty === 'easy' ? rng.int(2, 7) : pickInt(rng, -7, 7, [1, -1]);
    // ∫₀^θ sin = 1 − cos θ (rational for these θ); ∫₀^θ cos = sin θ (≠ 0).
    const theta = fn === 'sin' ? rng.pick([60, 90, 120, 180]) : rng.pick([30, 60, 90, 120, 150]);
    const unit = fn === 'sin' ? rtAdd1(rtNeg(cosDeg(theta))) : sinDeg(theta);
    const ans = rtMul(unit, a);
    const lim = radInline(theta);
    const F = fn === 'sin' ? `${coef(-a)}\\cos x` : `${coef(a)}\\sin x`;
    const Fdesc = fn === 'sin' ? 'מינוס הקוסינוס' : 'הסינוס';
    const evalStep =
      fn === 'sin'
        ? `**ההצבה:** $\\left[${F}\\right]_0^{${lim}} = ${coef(-a)}\\cos ${radTex(theta)} - (${coef(-a)}\\cos 0) = ${-a} \\cdot ${rtTexP(cosDeg(theta))} ${a >= 0 ? '+' : '-'} ${Math.abs(a)} = ${rtTex(ans)}$.`
        : `**ההצבה:** $\\left[${F}\\right]_0^{${lim}} = ${coef(a)}\\sin ${radTex(theta)} - ${coef(a)}\\sin 0 = ${a} \\cdot ${rtTex(sinDeg(theta))} - 0 = ${rtTex(ans)}$.`;

    return open({
      question: `חשב את האינטגרל המסוים $\\displaystyle\\int_0^{${lim}} ${coef(a)}\\${fn} x\\,dx$.`,
      expected: { kind: 'value', value: rtExpr(ans) },
      wrongAnswers: [
        {
          value: rtExpr(rtNeg(ans)),
          note: fn === 'sin'
            ? `הסימן של הקדומה אבד. הקדומה של $\\sin x$ היא $-\\cos x$, כי הנגזרת של $\\cos x$ היא $-\\sin x$; בלי המינוס כל התוצאה מתהפכת.`
            : `נוסף מינוס שאינו שייך. הקדומה של $\\cos x$ היא $\\sin x$ בלי מינוס; המינוס שייך לקדומה של הסינוס.`,
        },
        {
          value: rtExpr(unit),
          note: `נשמט המקדם $${a}$. הוא נשאר לאורך כל האינטגרל ומכפיל את התוצאה.`,
        },
      ],
      hint: `מצא קדומה, הצב את הגבול העליון ואת הגבול התחתון, וחסר. זכור מה קורה למינוס בקדומה של ${fn === 'sin' ? 'הסינוס' : 'הקוסינוס'}.`,
      solution: {
        steps: [
          `**הכלל:** אינטגרל מסוים מחשבים מפונקציה קדומה והצבת הגבולות, העליון פחות התחתון, והקדומה של ${fn === 'sin' ? 'הסינוס' : 'הקוסינוס'} היא ${Fdesc}.`,
          `**הנוסחה:** $\\int ${coef(a)}\\${fn} x\\,dx = ${F} + C$.`,
          evalStep,
        ],
        finalAnswer: `$\\displaystyle\\int_0^{${lim}} ${coef(a)}\\${fn} x\\,dx = ${rtTex(ans)}$`,
        explanation: fn === 'sin' ? 'המינוס של הקדומה והחיסור של הגבול התחתון מבטלים זה את זה, ולכן התוצאה חיובית עבור מקדם חיובי.' : 'הסינוס מתאפס באפס, ולכן הגבול התחתון אינו תורם דבר.',
      },
    });
  },
};

export const TRIGONOMETRY_TEMPLATES: GenTemplate[] = [
  rtSide,
  pbReduction,
  lawCosSide,
  lawSinSide,
  areaSin,
  areaAngle,
  idPythag,
  idDouble,
  eqBasic,
  specialValue,
  calcRsinMax,
  eqGeneral,
  domAsymptotes,
  derSlope,
  invMaxValue,
  intDefinite,
];
