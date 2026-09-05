/**
 * generator/templates/vectors.ts — parameterised repair questions for וקטורים במרחב.
 *
 * Same contract as functions.ts: `**הכלל:**` opens every solution and never
 * contains the answer, no Hebrew inside `$…$`, every distractor is a NAMED
 * mistake with a note, and `build` is pure in (rng, difficulty).
 *
 * Exactness is by CONSTRUCTION, not by luck: lengths come from Pythagorean
 * quadruples ((2,3,6) → 7), angles from integer vector pairs whose cosine is
 * ±1/2 or ±√3/2, triangle areas from (u, v) pairs whose cross product is a
 * quadruple. A random coordinate permutation (applied to every vector of the
 * instance) keeps those invariants and buys the variety.
 *
 * Notation follows content/lessons/math5/vectors.ts: vectors are `(x, y, z)`,
 * points are `A(1, 2, 3)`, `\vec{AB} = B - A`, a line is `(1 + 2t, 3, 4 - t)`,
 * a plane is `Ax + By + Cz = D`, angles are in degrees.
 */

import { Frac, type Rng } from '../rng';
import { mcq, open } from './shared';
import type { GenTemplate } from '../types';

const TOPIC = 'וקטורים במרחב';
const SUBJECT = 'math5';

type V = [number, number, number];

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const vec = (v: V) => `(${v[0]}, ${v[1]}, ${v[2]})`;
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (k: number, a: V): V => [k * a[0], k * a[1], k * a[2]];
const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V, b: V): V => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const eqV = (a: V, b: V) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
const isZero = (a: V) => a[0] === 0 && a[1] === 0 && a[2] === 0;

/** `(-3)` when negative, `3` otherwise — for products written out in a step. */
const par = (n: number) => (n < 0 ? `(${n})` : String(n));

/** `2 \cdot (-3)` */
const mul = (a: number, b: number) => `${par(a)} \\cdot ${par(b)}`;

/** `a - b` with the sign of `b` folded in: `4 - (-1)` → `4 + 1`. */
const minus = (a: number, b: number) => (b < 0 ? `${a} + ${-b}` : `${a} - ${b}`);

/** `4 - 2 + 0` — a sum of already-computed terms. */
function sumTerms(ts: number[]): string {
  return ts.map((t, i) => (i === 0 ? String(t) : t < 0 ? ` - ${-t}` : ` + ${t}`)).join('');
}

/** A random point with small coordinates. */
const randPt = (rng: Rng, lo: number, hi: number): V => [rng.int(lo, hi), rng.int(lo, hi), rng.int(lo, hi)];

/** The six permutations of three slots. */
const PERMS: V[] = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
const permute = (v: V, p: V): V => [v[p[0]], v[p[1]], v[p[2]]];

/** Integer vectors whose length is an integer (Pythagorean quadruples). */
const QUADS: V[] = [[1, 2, 2], [2, 3, 6], [1, 4, 8], [2, 6, 9], [4, 4, 7], [3, 4, 0], [6, 6, 7], [3, 4, 12]];
const len = (v: V) => Math.round(Math.sqrt(dot(v, v)));

/** A quadruple, permuted and with random signs; the length stays an integer. */
function randQuad(rng: Rng, pool: V[] = QUADS): V {
  const q = permute(rng.pick(pool), rng.pick(PERMS));
  return [q[0] * (rng.chance(0.5) ? 1 : -1), q[1] * (rng.chance(0.5) ? 1 : -1), q[2] * (rng.chance(0.5) ? 1 : -1)];
}

/** Linear term for a line component: `x0 + 2t`, `3 - t`, `t`, `5`. */
function lineComp(x0: number, d: number): string {
  const dt = d === 1 ? 't' : d === -1 ? '-t' : `${d}t`;
  if (d === 0) return String(x0);
  if (x0 === 0) return dt;
  return d > 0 ? `${x0} + ${dt}` : `${x0} - ${dt.slice(1)}`;
}
const lineTex = (p0: V, d: V) => `(${lineComp(p0[0], d[0])}, ${lineComp(p0[1], d[1])}, ${lineComp(p0[2], d[2])})`;

/** `2x - 3y + z = 7` */
function planeTex(n: V, D: number): string {
  const vars = ['x', 'y', 'z'];
  let out = '';
  n.forEach((c, i) => {
    if (c === 0) return;
    const mag = Math.abs(c) === 1 ? '' : String(Math.abs(c));
    if (!out) out = `${c < 0 ? '-' : ''}${mag}${vars[i]}`;
    else out += ` ${c < 0 ? '-' : '+'} ${mag}${vars[i]}`;
  });
  return `${out} = ${D}`;
}

// ---------------------------------------------------------------------------
// 1 · vec-basics
// ---------------------------------------------------------------------------

const abVector: GenTemplate = {
  id: 'vec-ab-vector',
  distractorTags: [null, 'sign-slip', 'operation-swap', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'vec-basics',
  title: 'וקטור בין שתי נקודות',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const lo = difficulty === 'easy' ? 0 : -6;
    const A = randPt(rng, lo, 6);
    const B = randPt(rng, lo, 6);
    if (isZero(A) || eqV(A, B)) return null;
    const ab = sub(B, A);
    const [p, q] = rng.chance(0.5) ? ['A', 'B'] : ['P', 'Q'];

    const right = `$${vec(ab)}$`;
    return mcq({
      question: `נתונות הנקודות $${p}${vec(A)}$ ו-$${q}${vec(B)}$. מהו הוקטור $\\vec{${p}${q}}$?`,
      answers: [right, `$${vec(sub(A, B))}$`, `$${vec(add(A, B))}$`, `$${vec(B)}$`],
      correct: 0,
      distractorNotes: [
        '',
        `זהו $\\vec{${q}${p}}$, הוקטור בכיוון ההפוך. סדר האותיות קובע: הראש הוא $${q}$ והזנב $${p}$, ולכן מחסרים $${q} - ${p}$ ולא להפך.`,
        `הנקודות חוברו במקום שיחוסרו. וקטור בין שתי נקודות הוא תמיד הפרש, ראש פחות זנב, ולא סכום.`,
        `אלה שיעורי הנקודה $${q}$ עצמה, כלומר הוקטור מהראשית אליה. זה היה נכון רק אם $${p}$ הייתה הראשית.`,
      ],
      hint: `ראש פחות זנב: $${q}$ פחות $${p}$, רכיב-רכיב.`,
      solution: {
        steps: [
          '**הכלל:** מבוקש וקטור בין שתי נקודות, ולכן מחסרים ראש פחות זנב: הנקודה שאליה מגיעים פחות הנקודה שממנה יוצאים, רכיב-רכיב.',
          `**הנוסחה:** $\\vec{${p}${q}} = ${q} - ${p}$.`,
          `**ההצבה:** $\\vec{${p}${q}} = (${minus(B[0], A[0])},\\; ${minus(B[1], A[1])},\\; ${minus(B[2], A[2])}) = ${vec(ab)}$.`,
        ],
        finalAnswer: right,
        explanation: 'הוקטור הוא תזוזה ולא מיקום: הוא אומר כמה לזוז בכל ציר, בלי לומר מאיפה.',
      },
    });
  },
};

const abLength: GenTemplate = {
  id: 'vec-ab-length',
  wrongAnswerTags: ['exponent-slip', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'vec-basics',
  title: 'אורך וקטור בין שתי נקודות',
  skill: 'substitution',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const pool = difficulty === 'easy' ? QUADS.slice(0, 6) : QUADS;
    const ab = randQuad(rng, pool);
    const L = len(ab);
    const lo = difficulty === 'hard' ? -6 : difficulty === 'mid' ? -3 : 0;
    const A = randPt(rng, lo, 5);
    const B = add(A, ab);
    const sq = ab.map((c) => c * c);
    const sumSq = sq[0] + sq[1] + sq[2];
    const sumAbs = Math.abs(ab[0]) + Math.abs(ab[1]) + Math.abs(ab[2]);
    if (sumAbs === L) return null;

    const direct = difficulty === 'easy';
    const question = direct
      ? `נתון הוקטור $\\vec{v} = ${vec(ab)}$. מהו אורכו $|\\vec{v}|$?`
      : `נתונות הנקודות $A${vec(A)}$ ו-$B${vec(B)}$. חשב את אורך הקטע $AB$.`;

    return open({
      question,
      expected: { kind: 'value', value: String(L) },
      wrongAnswers: [
        {
          value: String(sumSq),
          note: `זהו סכום ריבועי הרכיבים, $${sumSq}$, לפני השורש. אורך הוא השורש של הסכום הזה.`,
        },
        {
          value: String(sumAbs),
          note: `הרכיבים חוברו בערכם המוחלט בלי ריבועים ובלי שורש. אורך נבנה מפיתגורס: שורש של סכום ריבועים.`,
        },
      ],
      hint: 'שורש של סכום ריבועי הרכיבים. מינוס נעלם בריבוע.',
      solution: {
        steps: [
          '**הכלל:** מבוקש אורך, ולכן מפעילים את פיתגורס במרחב: שורש של סכום ריבועי שלושת הרכיבים, ובשאלה על שתי נקודות מחשבים קודם את הוקטור ביניהן.',
          ...(direct ? [] : [`$\\vec{AB} = B - A = ${vec(ab)}$.`]),
          `**הנוסחה:** $|\\vec{${direct ? 'v' : 'AB'}}| = \\sqrt{${par(ab[0])}^2 + ${par(ab[1])}^2 + ${par(ab[2])}^2}$.`,
          `**ההצבה:** $\\sqrt{${sq[0]} + ${sq[1]} + ${sq[2]}} = \\sqrt{${sumSq}} = ${L}$.`,
        ],
        finalAnswer: `$${direct ? '|\\vec{v}|' : '|AB|'} = ${L}$`,
        explanation: 'סכום הריבועים הוא ריבוע שלם, ולכן האורך יוצא מספר שלם.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 2 · vec-dot-product
// ---------------------------------------------------------------------------

const dotPerpParam: GenTemplate = {
  id: 'vec-dot-perp-param',
  wrongAnswerTags: ['sign-slip', 'dropped-factor'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'vec-dot-product',
  title: 'פרמטר שעבורו שני וקטורים ניצבים',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    // a = (a1, a2, k) with k unknown; b = (b1, b2, b3). Solve a·b = 0 for k, by
    // construction: pick k and b3, then choose b1 so that a2 | (a1 b1 + b3 k).
    const range = difficulty === 'easy' ? 4 : 6;
    let k = 0;
    while (k === 0) k = difficulty === 'easy' ? rng.int(1, 5) : rng.int(-6, 6);
    const b3 = rng.pick([-3, -2, 2, 3]);
    const a2 = difficulty === 'easy' ? rng.pick([1, -1]) : rng.pick([1, -1, 2, -2, 3, -3]);
    // a1 coprime to a2 so that a suitable b1 always exists.
    let a1 = 0;
    while (a1 === 0 || (Math.abs(a2) > 1 && a1 % a2 === 0)) a1 = rng.int(-range, range);
    const b1s: number[] = [];
    for (let b1 = -range; b1 <= range; b1++) {
      if (b1 !== 0 && (a1 * b1 + b3 * k) % a2 === 0) b1s.push(b1);
    }
    if (!b1s.length) return null;
    const b1 = rng.pick(b1s);
    const b2 = -(a1 * b1 + b3 * k) / a2;
    if (b2 === 0 || Math.abs(b2) > 12) return null;

    const p = rng.pick(PERMS);
    const slot = p.indexOf(2); // where k landed after the permutation
    const aStrs = [String(a1), String(a2), 'k'];
    const aTex = `(${p.map((i) => aStrs[i]).join(', ')})`;
    const b = permute([b1, b2, b3], p);
    const known = a1 * b1 + a2 * b2;
    const eq = `${known} ${b3 < 0 ? '-' : '+'} ${Math.abs(b3)}k = 0`;

    return open({
      question: `נתונים הוקטורים $\\vec{a} = ${aTex}$ ו-$\\vec{b} = ${vec(b)}$. מצא את $k$ שעבורו $\\vec{a} \\perp \\vec{b}$.`,
      expected: { kind: 'value', value: String(k) },
      wrongAnswers: [
        {
          value: String(-k),
          note: `הסימן התהפך בהעברת האגף. מהמשוואה $${eq}$ מקבלים $${b3}k = ${-known}$, ואז מחלקים.`,
        },
        {
          value: String(-known),
          note: `זה האגף אחרי ההעברה, לפני החלוקה במקדם של $k$. צריך עוד לחלק את $${-known}$ ב-$${b3}$.`,
        },
      ],
      hint: 'ניצבים פירושו מכפלה סקלרית אפס. כתוב את המכפלה ברכיבים והשווה לאפס.',
      solution: {
        steps: [
          '**הכלל:** נדרשת ניצבות, ולכן משווים את המכפלה הסקלרית לאפס: מכפילים רכיב מול רכיב, מחברים, ומקבלים משוואה בפרמטר.',
          `**הנוסחה:** $\\vec{a} \\cdot \\vec{b} = ${mul(a1, b1)} + ${mul(a2, b2)} + ${b3 < 0 ? `(${b3})` : b3} \\cdot k = 0$.`,
          `מצמצמים: $${eq}$, ולכן $${b3}k = ${-known}$.`,
          `מחלקים ב-$${b3}$: $k = ${k}$. בדיקה: הרכיב ה-${['x', 'y', 'z'][slot]} של $\\vec{a}$ הוא $${k}$ והמכפלה מתאפסת.`,
        ],
        finalAnswer: `$k = ${k}$`,
        explanation: 'מכפלה סקלרית אפס היא התנאי היחיד לניצבות של שני וקטורים שאינם אפס.',
      },
    });
  },
};

/**
 * Integer pairs with an exact cosine. `deg` is the angle between them.
 * Cosine values: 1/2 → 60°, √3/2 → 30°. Negating one vector gives 120°/150°.
 */
const ANGLE_PAIRS: { a: V; b: V; deg: 30 | 60 }[] = [
  { a: [1, 1, 0], b: [0, 1, 1], deg: 60 },
  { a: [1, 1, 0], b: [1, 0, 1], deg: 60 },
  { a: [2, 1, 1], b: [1, 1, 0], deg: 30 },
  { a: [2, 1, 1], b: [1, 0, 1], deg: 30 },
];

/** `\sqrt{6}`, `2`, `3\sqrt{2}` — the length of an integer vector, simplified. */
function sqrtTex(n: number): string {
  let out = 1;
  let rad = n;
  for (let p = 2; p * p <= rad; p++) while (rad % (p * p) === 0) { rad /= p * p; out *= p; }
  if (rad === 1) return String(out);
  return `${out === 1 ? '' : out}\\sqrt{${rad}}`;
}

/** `\sqrt{8} = 2\sqrt{2}`, or just `\sqrt{6}` when nothing simplifies. */
function lenTex(sq: number): string {
  const simple = sqrtTex(sq);
  return simple === `\\sqrt{${sq}}` ? simple : `\\sqrt{${sq}} = ${simple}`;
}

const dotAngle: GenTemplate = {
  id: 'vec-dot-angle',
  wrongAnswerTags: ['sign-slip', 'values-swapped'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'vec-dot-product',
  title: 'זווית בין שני וקטורים',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const base = rng.pick(ANGLE_PAIRS);
    const p = rng.pick(PERMS);
    let a = permute(base.a, p);
    let b = permute(base.b, p);
    // A joint sign flip keeps the angle; flipping only one gives the obtuse case.
    if (rng.chance(0.5)) { a = scale(-1, a); b = scale(-1, b); }
    const obtuse = difficulty !== 'easy' && rng.chance(0.5);
    if (obtuse) b = scale(-1, b);
    // Scaling keeps the angle; the permutations alone collide too often.
    a = scale(rng.pick([1, 2]), a);
    b = scale(rng.pick(difficulty === 'easy' ? [1, 2] : [1, 2, 3]), b);
    const deg = obtuse ? 180 - base.deg : base.deg;
    const s = dot(a, b);
    const la = dot(a, a);
    const lb = dot(b, b);
    const cosTex = base.deg === 60 ? '\\dfrac{1}{2}' : '\\dfrac{\\sqrt{3}}{2}';
    const swapped = 90 - base.deg; // read the table on the wrong row

    const asPoints = difficulty === 'hard' && rng.chance(0.5);
    const O = asPoints ? randPt(rng, -3, 3) : ([0, 0, 0] as V);
    const question = asPoints
      ? `נתונות הנקודות $A${vec(O)}$, $B${vec(add(O, a))}$ ו-$C${vec(add(O, b))}$. חשב את הזווית $BAC$ במעלות.`
      : `נתונים הוקטורים $\\vec{a} = ${vec(a)}$ ו-$\\vec{b} = ${vec(b)}$. חשב את הזווית ביניהם במעלות.`;
    const [na, nb] = asPoints ? ['\\vec{AB}', '\\vec{AC}'] : ['\\vec{a}', '\\vec{b}'];

    return open({
      question,
      expected: { kind: 'value', value: String(deg) },
      wrongAnswers: [
        {
          value: String(180 - deg),
          note: obtuse
            ? `סימן המכפלה הסקלרית נעלם. המכפלה יצאה $${s}$, שלילית, ולכן הקוסינוס שלילי והזווית קהה.`
            : `הקוסינוס יצא חיובי, $${cosTex}$, ולכן הזווית חדה. זווית קהה מתקבלת רק כשהמכפלה הסקלרית שלילית.`,
        },
        {
          value: String(obtuse ? 180 - swapped : swapped),
          note: `הערך $${cosTex}$ הוא קוסינוס, לא סינוס. בטבלת הזוויות המיוחדות $\\cos ${base.deg}° = ${cosTex}$.`,
        },
      ],
      hint: 'מכפלה סקלרית חלקי מכפלת האורכים נותנת את הקוסינוס. ואז טבלת זוויות מיוחדות.',
      solution: {
        steps: [
          '**הכלל:** מבוקשת זווית בין וקטורים, ולכן משתמשים בנוסחת הקוסינוס: המכפלה הסקלרית חלקי מכפלת שני האורכים.',
          ...(asPoints ? [`$\\vec{AB} = B - A = ${vec(a)}$, $\\vec{AC} = C - A = ${vec(b)}$.`] : []),
          `**הנוסחה:** $\\cos\\theta = \\dfrac{${na} \\cdot ${nb}}{|${na}|\\,|${nb}|}$.`,
          `$${na} \\cdot ${nb} = ${mul(a[0], b[0])} + ${mul(a[1], b[1])} + ${mul(a[2], b[2])} = ${s}$.`,
          `$|${na}| = ${lenTex(la)}$, $|${nb}| = ${lenTex(lb)}$.`,
          `**ההצבה:** $\\cos\\theta = \\dfrac{${s}}{${sqrtTex(la)} \\cdot ${sqrtTex(lb)}} = ${obtuse ? '-' : ''}${cosTex}$, ולכן $\\theta = ${deg}°$.`,
        ],
        finalAnswer: `$\\theta = ${deg}°$`,
        explanation: 'הסימן של המכפלה הסקלרית קובע אם הזווית חדה או קהה.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 3 · vec-cross-product
// ---------------------------------------------------------------------------

const crossCompute: GenTemplate = {
  id: 'vec-cross-compute',
  distractorTags: [null, 'sign-slip', 'formula-mismatch', 'operation-swap'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'vec-cross-product',
  title: 'חישוב מכפלה וקטורית',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const hi = difficulty === 'easy' ? 2 : 3;
    const lo = difficulty === 'easy' ? 0 : -3;
    let a: V = [0, 0, 0];
    let b: V = [0, 0, 0];
    let c: V = [0, 0, 0];
    for (let i = 0; i < 30; i++) {
      a = randPt(rng, lo, hi);
      b = randPt(rng, lo, hi);
      c = cross(a, b);
      if (!isZero(c) && c[1] !== 0 && !isZero(a) && !isZero(b)) break;
    }
    if (isZero(c) || c[1] === 0) return null;
    const middleSign: V = [c[0], -c[1], c[2]];
    const compWise: V = [a[0] * b[0], a[1] * b[1], a[2] * b[2]];

    const right = `$${vec(c)}$`;
    const asNormal = difficulty === 'hard' && rng.chance(0.5);
    return mcq({
      question: asNormal
        ? `מישור מוכל בו הוקטורים $\\vec{u} = ${vec(a)}$ ו-$\\vec{v} = ${vec(b)}$. מהו הנורמל $\\vec{n} = \\vec{u} \\times \\vec{v}$?`
        : `נתונים $\\vec{a} = ${vec(a)}$ ו-$\\vec{b} = ${vec(b)}$. מהי המכפלה הוקטורית $\\vec{a} \\times \\vec{b}$?`,
      answers: [right, `$${vec(scale(-1, c))}$`, `$${vec(middleSign)}$`, `$${vec(compWise)}$`],
      correct: 0,
      distractorNotes: [
        '',
        `זו המכפלה בסדר ההפוך, $\\vec{b} \\times \\vec{a}$. החלפת הסדר במכפלה וקטורית הופכת את הסימן של כל הרכיבים.`,
        `הרכיב האמצעי יצא בסימן הפוך. בדטרמיננטה המינור האמצעי נכנס עם מינוס, ולכן הרכיב השני הוא $a_3 b_1 - a_1 b_3$ ולא $a_1 b_3 - a_3 b_1$.`,
        `הרכיבים הוכפלו זוג מול זוג, כמו במכפלה סקלרית לפני החיבור. מכפלה וקטורית מצליבה רכיבים: כל רכיב בתוצאה נבנה משני הרכיבים האחרים.`,
      ],
      hint: 'כל רכיב בתוצאה נבנה משני הרכיבים האחרים, בהצלבה. שים לב לסימן של הרכיב האמצעי.',
      solution: {
        steps: [
          '**הכלל:** מבוקשת מכפלה וקטורית, ולכן מחשבים דטרמיננטה: כל רכיב הוא הצלבה של שני הרכיבים האחרים, והרכיב האמצעי נכנס בסימן הפוך.',
          `**הנוסחה:** $\\vec{a} \\times \\vec{b} = (a_2 b_3 - a_3 b_2,\\; a_3 b_1 - a_1 b_3,\\; a_1 b_2 - a_2 b_1)$.`,
          `**ההצבה:** $(${mul(a[1], b[2])} - ${mul(a[2], b[1])},\\; ${mul(a[2], b[0])} - ${mul(a[0], b[2])},\\; ${mul(a[0], b[1])} - ${mul(a[1], b[0])})$.`,
          `מחשבים: $${vec(c)}$. בדיקה: $\\vec{a} \\cdot (\\vec{a} \\times \\vec{b}) = ${dot(a, c)}$.`,
        ],
        finalAnswer: right,
        explanation: 'התוצאה ניצבת לשני הוקטורים, ולכן המכפלה הסקלרית שלה עם כל אחד מהם היא אפס.',
      },
    });
  },
};

/** (u, v) pairs whose cross product is a Pythagorean quadruple → exact area. */
const AREA_PAIRS: { u: V; v: V }[] = [
  { u: [3, -2, 0], v: [0, 2, -1] }, // → (2, 3, 6), length 7
  { u: [4, -1, 0], v: [0, 2, -1] }, // → (1, 4, 8), length 9
  { u: [3, -1, 0], v: [0, 3, -2] }, // → (2, 6, 9), length 11
  { u: [1, -1, 0], v: [3, 4, -4] }, // → (4, 4, 7), length 9
  { u: [2, -1, 0], v: [0, 1, -1] }, // → (1, 2, 2), length 3
  { u: [0, 0, 1], v: [4, -3, 0] }, // → (3, 4, 0), length 5
  { u: [1, 0, 0], v: [2, 4, -3] }, // → (0, 3, 4), length 5
];

const crossTriangleArea: GenTemplate = {
  id: 'vec-cross-triangle-area',
  wrongAnswerTags: ['dropped-factor'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'vec-cross-product',
  title: 'שטח משולש בעזרת מכפלה וקטורית',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const base = rng.pick(AREA_PAIRS);
    const p = rng.pick(PERMS);
    let u = permute(base.u, p);
    let v = permute(base.v, p);
    if (rng.chance(0.5)) [u, v] = [v, u];
    if (rng.chance(0.5)) u = scale(-1, u);
    if (difficulty === 'hard') u = scale(rng.pick([2, 3]), u);
    const n = cross(u, v);
    const L = len(n);
    const area = new Frac(L, 2);

    const direct = difficulty === 'easy';
    const A = randPt(rng, -3, 4);
    const B = add(A, u);
    const C = add(A, v);
    const question = direct
      ? `חשב את שטח המשולש שפורשים הוקטורים $\\vec{u} = ${vec(u)}$ ו-$\\vec{v} = ${vec(v)}$.`
      : `נתונות הנקודות $A${vec(A)}$, $B${vec(B)}$ ו-$C${vec(C)}$. חשב את שטח המשולש $ABC$.`;
    const [nu, nv] = direct ? ['\\vec{u}', '\\vec{v}'] : ['\\vec{AB}', '\\vec{AC}'];

    return open({
      question,
      expected: { kind: 'value', value: area.expr() },
      wrongAnswers: [
        {
          value: String(L),
          note: `זהו אורך המכפלה הוקטורית, כלומר שטח המקבילית. שטח המשולש הוא מחצית ממנו.`,
        },
      ],
      hint: 'מכפלה וקטורית של שני וקטורי צלע, אורכה, וחצי.',
      solution: {
        steps: [
          '**הכלל:** מבוקש שטח משולש במרחב, ולכן מכפילים וקטורית שני וקטורי צלע היוצאים מאותו קדקוד, ושטח המשולש הוא מחצית אורך התוצאה.',
          ...(direct ? [] : [`$\\vec{AB} = B - A = ${vec(u)}$, $\\vec{AC} = C - A = ${vec(v)}$.`]),
          `**הנוסחה:** $S = \\dfrac{1}{2}|${nu} \\times ${nv}|$.`,
          `$${nu} \\times ${nv} = (${mul(u[1], v[2])} - ${mul(u[2], v[1])},\\; ${mul(u[2], v[0])} - ${mul(u[0], v[2])},\\; ${mul(u[0], v[1])} - ${mul(u[1], v[0])}) = ${vec(n)}$.`,
          `$|${nu} \\times ${nv}| = \\sqrt{${n[0] * n[0]} + ${n[1] * n[1]} + ${n[2] * n[2]}} = \\sqrt{${dot(n, n)}} = ${L}$.`,
          `**ההצבה:** $S = \\dfrac{1}{2} \\cdot ${L} = ${area.tex()}$.`,
        ],
        finalAnswer: `$S = ${area.tex()}$`,
        explanation: 'אורך המכפלה הוקטורית הוא שטח המקבילית, והמשולש הוא חצי ממנה.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 4 · vec-line-plane
// ---------------------------------------------------------------------------

const lineParam: GenTemplate = {
  id: 'vec-line-point-param',
  wrongAnswerTags: ['sign-slip', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'vec-line-plane',
  title: 'הפרמטר של נקודה על ישר',
  skill: 'substitution',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const lo = difficulty === 'easy' ? 0 : -5;
    const p0 = randPt(rng, lo, 5);
    // At most one zero component, and at least one component outside {0, 1} so
    // the "forgot to divide" wrong answer differs from t itself.
    let d: V = [0, 0, 0];
    while (d.filter((c) => c === 0).length > 1 || !d.some((c) => c !== 0 && c !== 1)) {
      d = randPt(rng, difficulty === 'easy' ? -2 : -3, 3);
    }
    let t0 = 0;
    while (t0 === 0) t0 = rng.int(difficulty === 'easy' ? 1 : -4, 4);
    const P = add(p0, scale(t0, d));
    // The coordinate we solve: its direction component is neither 0 nor 1.
    const i = d.findIndex((c) => c !== 0 && c !== 1);
    const xs = ['x', 'y', 'z'];
    const isRight = rng.chance(0.5);

    return open({
      question: isRight
        ? `נתון הישר $${lineTex(p0, d)}$. הנקודה $P${vec(P)}$ נמצאת על הישר. מצא את ערך הפרמטר $t$ שנותן אותה.`
        : `הנקודה $P${vec(P)}$ נמצאת על הישר $${lineTex(p0, d)}$. עבור איזה ערך של $t$ מתקבלת הנקודה?`,
      expected: { kind: 'value', value: String(t0) },
      wrongAnswers: [
        {
          value: String(-t0),
          note: `הסימן התהפך. מהמשוואה $${lineComp(p0[i], d[i])} = ${P[i]}$ מעבירים אגף ומקבלים $${d[i]}t = ${P[i] - p0[i]}$.`,
        },
        {
          value: String(P[i] - p0[i]),
          note: `זה ההפרש $${P[i]} - ${par(p0[i])}$ לפני החלוקה במקדם של $t$, שהוא $${d[i]}$.`,
        },
      ],
      hint: 'השווה רכיב אחד של הישר לרכיב המתאים של הנקודה, פתור ל-t, ובדוק בשאר הרכיבים.',
      solution: {
        steps: [
          '**הכלל:** נקודה על ישר פרמטרי מתקבלת מערך יחיד של הפרמטר, ולכן משווים רכיב של הישר לרכיב המתאים של הנקודה, פותרים, ומאמתים בשאר הרכיבים.',
          `**ההצבה:** מהרכיב ה-${xs[i]}: $${lineComp(p0[i], d[i])} = ${P[i]}$, ולכן $${d[i]}t = ${P[i] - p0[i]}$ ו-$t = ${t0}$.`,
          `בדיקה בשאר הרכיבים: $${lineTex(p0, d).replace(/t/g, `(${t0})`)} = ${vec(P)}$, מתאים.`,
        ],
        finalAnswer: `$t = ${t0}$`,
        explanation: 'אותו ערך של t חייב לצאת בכל שלושת הרכיבים, אחרת הנקודה אינה על הישר.',
      },
    });
  },
};

const planeFromNormal: GenTemplate = {
  id: 'vec-plane-normal-point',
  distractorTags: [null, 'condition-ignored', 'sign-slip', 'values-swapped'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'vec-line-plane',
  title: 'משוואת מישור מנורמל ונקודה',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    let n: V = [0, 0, 0];
    while (n.filter((c) => c === 0).length > (difficulty === 'easy' ? 1 : 0)) {
      n = randPt(rng, difficulty === 'easy' ? -2 : -4, 4);
    }
    const P = randPt(rng, difficulty === 'hard' ? -5 : -3, 5);
    const D = dot(n, P);
    if (D === 0 || eqV(n, P) || eqV(P, [0, 0, 0])) return null;
    if (P.some((c) => c === 0) && difficulty !== 'easy') return null; // keep the swapped distractor a full plane

    const right = `$${planeTex(n, D)}$`;
    const asLine = difficulty === 'hard' && rng.chance(0.5);
    return mcq({
      question: asLine
        ? `מישור עובר דרך הנקודה $P${vec(P)}$ וניצב לישר שכיוונו $\\vec{d} = ${vec(n)}$. מהי משוואת המישור?`
        : `מהי משוואת המישור העובר דרך הנקודה $P${vec(P)}$ שהנורמל שלו הוא $\\vec{n} = ${vec(n)}$?`,
      answers: [right, `$${planeTex(n, 0)}$`, `$${planeTex(n, -D)}$`, `$${planeTex(P, D)}$`],
      correct: 0,
      distractorNotes: [
        '',
        `הנקודה לא הוצבה. המקדמים נכונים, אך האיבר החופשי $D$ מתקבל מהצבת הנקודה במשוואה, וכאן הוא יצא אפס כאילו המישור עובר דרך הראשית.`,
        `הסימן של האיבר החופשי התהפך. פותחים את $A(x - x_0) + B(y - y_0) + C(z - z_0) = 0$ ומעבירים את הקבועים לאגף ימין, ולכן $D = A x_0 + B y_0 + C z_0$.`,
        `הנקודה והנורמל התחלפו בתפקידים. המקדמים של $x, y, z$ הם רכיבי הנורמל, והנקודה משמשת רק לחישוב האיבר החופשי.`,
      ],
      hint: 'המקדמים הם רכיבי הנורמל. את האיבר החופשי מקבלים מהצבת הנקודה.',
      solution: {
        steps: [
          `**הכלל:** ${asLine ? 'מישור ניצב לישר, ולכן כיוון הישר הוא הנורמל של המישור, ו' : ''}משוואת מישור נבנית מנורמל ונקודה: רכיבי הנורמל הם המקדמים, והנקודה נותנת את האיבר החופשי.`,
          `**הנוסחה:** $Ax + By + Cz = D$ כאשר $D = A x_0 + B y_0 + C z_0$.`,
          `**ההצבה:** $D = ${mul(n[0], P[0])} + ${mul(n[1], P[1])} + ${mul(n[2], P[2])} = ${sumTerms([n[0] * P[0], n[1] * P[1], n[2] * P[2]])} = ${D}$.`,
          `המישור: $${planeTex(n, D)}$.`,
        ],
        finalAnswer: right,
        explanation: 'בדיקה: הצבת הנקודה במשוואה נותנת שוויון אמת.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 5 · vec-distances-angles
// ---------------------------------------------------------------------------

const distPointPlane: GenTemplate = {
  id: 'vec-dist-point-plane',
  wrongAnswerTags: ['dropped-factor', 'exponent-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'vec-distances-angles',
  title: 'מרחק מנקודה למישור',
  skill: 'substitution',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const pool = difficulty === 'easy' ? QUADS.slice(0, 6) : QUADS;
    const n = randQuad(rng, pool);
    const L = len(n);
    const dist = rng.int(1, difficulty === 'easy' ? 3 : 6);
    const sign = difficulty === 'easy' ? 1 : rng.pick([1, -1]);
    const fromOrigin = difficulty === 'easy' && rng.chance(0.4);
    const P: V = fromOrigin ? [0, 0, 0] : randPt(rng, difficulty === 'hard' ? -5 : -3, 5);
    const D = dot(n, P) - sign * dist * L;
    if (D === 0) return null;
    const num = dot(n, P) - D; // = sign·dist·L

    return open({
      question: fromOrigin
        ? `מהו המרחק מהראשית $O$ למישור $${planeTex(n, D)}$?`
        : `חשב את המרחק מהנקודה $P${vec(P)}$ למישור $${planeTex(n, D)}$.`,
      expected: { kind: 'value', value: String(dist) },
      wrongAnswers: [
        {
          value: String(Math.abs(num)),
          note: `זהו המונה בלבד, $|${num}| = ${Math.abs(num)}$. חסרה החלוקה באורך הנורמל, שהוא $\\sqrt{${dot(n, n)}} = ${L}$.`,
        },
        {
          value: new Frac(dist, L).expr(),
          note: `המונה חולק בסכום הריבועים $${dot(n, n)}$ במקום בשורש שלו. המכנה בנוסחת המרחק הוא אורך הנורמל, $${L}$.`,
        },
      ],
      hint: 'הצב את הנקודה במשוואת המישור, קח ערך מוחלט, וחלק באורך הנורמל.',
      solution: {
        steps: [
          '**הכלל:** מבוקש מרחק מנקודה למישור, ולכן מציבים את הנקודה במשוואת המישור, לוקחים ערך מוחלט, ומחלקים באורך וקטור הנורמל.',
          `**הנוסחה:** $d = \\dfrac{|A x_1 + B y_1 + C z_1 - D|}{\\sqrt{A^2 + B^2 + C^2}}$, והנורמל הוא $\\vec{n} = ${vec(n)}$.`,
          `**ההצבה:** מונה: $|${mul(n[0], P[0])} + ${mul(n[1], P[1])} + ${mul(n[2], P[2])} - ${par(D)}| = |${num}| = ${Math.abs(num)}$.`,
          `מכנה: $\\sqrt{${n[0] * n[0]} + ${n[1] * n[1]} + ${n[2] * n[2]}} = \\sqrt{${dot(n, n)}} = ${L}$.`,
          `$d = \\dfrac{${Math.abs(num)}}{${L}} = ${dist}$.`,
        ],
        finalAnswer: `$d = ${dist}$`,
        explanation: 'הערך המוחלט במונה מבטיח מרחק חיובי, ואורך הנורמל במכנה הוא שורש ולא סכום ריבועים.',
      },
    });
  },
};

const angleLinePlane: GenTemplate = {
  id: 'vec-angle-line-plane',
  wrongAnswerTags: ['formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'vec-distances-angles',
  title: 'זווית בין ישר למישור',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const base = rng.pick(ANGLE_PAIRS);
    const p = rng.pick(PERMS);
    let d = permute(base.a, p);
    let n = permute(base.b, p);
    if (rng.chance(0.5)) [d, n] = [n, d];
    if (rng.chance(0.5)) d = scale(-1, d);
    // Scaling keeps the angle; the permutations alone collide too often.
    d = scale(rng.pick([1, 2]), d);
    n = scale(rng.pick(difficulty === 'hard' ? [1, 2, 3] : [1, 2]), n);
    // Angle between the direction and the normal is base.deg; with the plane it
    // is the complement.
    const phi = 90 - base.deg;
    const s = dot(d, n);
    const ld = dot(d, d);
    const ln = dot(n, n);
    const sinTex = phi === 30 ? '\\dfrac{1}{2}' : '\\dfrac{\\sqrt{3}}{2}';
    const D = rng.int(-6, 6);
    const p0 = randPt(rng, -3, 3);

    const asLine = difficulty !== 'easy';
    return open({
      question: asLine
        ? `נתונים הישר $${lineTex(p0, d)}$ והמישור $${planeTex(n, D)}$. חשב את הזווית בין הישר למישור במעלות.`
        : `ישר שכיוונו $\\vec{d} = ${vec(d)}$ פוגש מישור שהנורמל שלו $\\vec{n} = ${vec(n)}$. מהי הזווית בין הישר למישור במעלות?`,
      expected: { kind: 'value', value: String(phi) },
      wrongAnswers: [
        {
          value: String(base.deg),
          note: `זו הזווית בין הישר לנורמל, שמתקבלת מנוסחת הקוסינוס. הזווית בין הישר למישור משלימה אותה לתשעים מעלות, ולכן משתמשים בסינוס.`,
        },
      ],
      hint: 'בין ישר למישור: סינוס, לא קוסינוס. כיוון הישר מול הנורמל של המישור.',
      solution: {
        steps: [
          '**הכלל:** מבוקשת זווית בין ישר למישור, ולכן משווים את כיוון הישר לנורמל של המישור בנוסחת הסינוס, כי הזווית עם המישור משלימה את הזווית עם הנורמל.',
          `**הנוסחה:** $\\sin\\phi = \\dfrac{|\\vec{d} \\cdot \\vec{n}|}{|\\vec{d}|\\,|\\vec{n}|}$, כאשר $\\vec{d} = ${vec(d)}$ ו-$\\vec{n} = ${vec(n)}$.`,
          `$\\vec{d} \\cdot \\vec{n} = ${mul(d[0], n[0])} + ${mul(d[1], n[1])} + ${mul(d[2], n[2])} = ${s}$.`,
          `$|\\vec{d}| = ${lenTex(ld)}$, $|\\vec{n}| = ${lenTex(ln)}$.`,
          `**ההצבה:** $\\sin\\phi = \\dfrac{${Math.abs(s)}}{${sqrtTex(ld)} \\cdot ${sqrtTex(ln)}} = ${sinTex}$, ולכן $\\phi = ${phi}°$.`,
        ],
        finalAnswer: `$\\phi = ${phi}°$`,
        explanation: 'הערך המוחלט במונה נותן את הזווית החדה, וזו הזווית בין ישר למישור.',
      },
    });
  },
};

export const VECTORS_TEMPLATES: GenTemplate[] = [
  abVector,
  abLength,
  dotPerpParam,
  dotAngle,
  crossCompute,
  crossTriangleArea,
  lineParam,
  planeFromNormal,
  distPointPlane,
  angleLinePlane,
];
