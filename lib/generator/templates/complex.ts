/**
 * generator/templates/complex.ts — parameterised repair questions for
 * מספרים מרוכבים (sub-topics polar-de-moivre, complex-roots,
 * complex-equations, gauss-loci, finding-z).
 *
 * Same contract as functions.ts: `**הכלל:**` opens every solution and never
 * contains the answer, no Hebrew inside `$…$`, every distractor is a NAMED
 * mistake with a note, and `build` is pure in (rng, difficulty).
 *
 * Topic conventions (CLAUDE.md + the lesson file): polar form is written
 * `r\,\text{cis}\,θ°` with the angle in DEGREES, never e^{iθ}, never radians.
 * `lib/answer-check` defines `cis(deg)` in degrees, so `2*cis(60)` is a legal
 * `expected`. Every modulus and angle here is chosen so the algebraic form is
 * exact (angles on the 30°/45° grid, moduli k, k√2), so no rounded decimals
 * ever appear as answers.
 */

import { Frac, type Rng } from '../rng';
import { mcq, open } from './shared';
import type { GenTemplate } from '../types';

const TOPIC = 'מספרים מרוכבים';
const SUBJECT = 'math5';

/** `\,\text{cis}\,` — the lesson's exact spacing. Used as `${rTex}${CIS}${θ}°`. */
const CIS = '\\,\\text{cis}\\,';

// ---------------------------------------------------------------------------
// Exact surds: c·√rad, with c a reduced fraction. Enough for the 30°/45° grid.
// ---------------------------------------------------------------------------

type Surd = { c: Frac; rad: number };

const surd = (n: number, d = 1, rad = 1): Surd => ({ c: new Frac(n, d), rad });

function surdMul(a: Surd, b: Surd): Surd {
  let rad = a.rad * b.rad;
  let c = a.c.mul(b.c);
  const s = Math.round(Math.sqrt(rad));
  if (s * s === rad) {
    c = c.mul(new Frac(s));
    rad = 1;
  }
  return { c, rad };
}

function surdPow(a: Surd, n: number): Surd {
  let out = surd(1);
  for (let i = 0; i < n; i++) out = surdMul(out, a);
  return out;
}

/** LaTeX without `$`: `2`, `\sqrt{2}`, `-3\sqrt{3}`, `\dfrac{\sqrt{3}}{2}`. */
function surdTex(s: Surd): string {
  if (s.c.n === 0) return '0';
  if (s.rad === 1) return s.c.tex();
  const an = Math.abs(s.c.n);
  const sign = s.c.n < 0 ? '-' : '';
  const num = `${an === 1 ? '' : an}\\sqrt{${s.rad}}`;
  return s.c.d === 1 ? `${sign}${num}` : `${sign}\\dfrac{${num}}{${s.c.d}}`;
}

/** mathjs: `2`, `sqrt(2)`, `-3*sqrt(3)`, `sqrt(3)/2`. */
function surdExpr(s: Surd): string {
  if (s.c.n === 0) return '0';
  if (s.rad === 1) return s.c.expr();
  const { n, d } = s.c;
  const num = `${n === 1 ? '' : n === -1 ? '-' : `${n}*`}sqrt(${s.rad})`;
  return d === 1 ? num : `${num}/${d}`;
}

const abs = (s: Surd): Surd => ({ c: new Frac(Math.abs(s.c.n), s.c.d), rad: s.rad });
const negS = (s: Surd): Surd => ({ c: new Frac(-s.c.n, s.c.d), rad: s.rad });
const isZero = (s: Surd) => s.c.n === 0;

/** `a + bi` as LaTeX: `2 + 3i`, `-\sqrt{3} - i`, `2i`, `-4`, `\dfrac{\sqrt{3}}{2}\,i`. */
function cxTex(re: Surd, im: Surd): string {
  if (isZero(re) && isZero(im)) return '0';
  const imAbs = surdTex(abs(im));
  const imPart =
    imAbs === '1' ? 'i' : im.rad === 1 && im.c.d === 1 ? `${imAbs}i` : `${imAbs}\\,i`;
  if (isZero(re)) return im.c.n < 0 ? `-${imPart}` : imPart;
  if (isZero(im)) return surdTex(re);
  return `${surdTex(re)} ${im.c.n < 0 ? '-' : '+'} ${imPart}`;
}

/** `a + bi` for mathjs: `2+3i`, `-sqrt(3)-i`, `(3)*i`, `-4`. */
function cxExpr(re: Surd, im: Surd): string {
  if (isZero(re) && isZero(im)) return '0';
  const imAbs = surdExpr(abs(im));
  const imPart = imAbs === '1' ? 'i' : `(${imAbs})*i`;
  if (isZero(re)) return im.c.n < 0 ? `-${imPart}` : imPart;
  if (isZero(im)) return surdExpr(re);
  return `${surdExpr(re)}${im.c.n < 0 ? '-' : '+'}${imPart}`;
}

/** The syllabus grid. */
const ANGLES = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];

const norm = (deg: number) => ((deg % 360) + 360) % 360;

function cosS(deg: number): Surd {
  switch (norm(deg)) {
    case 0: return surd(1);
    case 180: return surd(-1);
    case 90: case 270: return surd(0);
    case 30: case 330: return surd(1, 2, 3);
    case 150: case 210: return surd(-1, 2, 3);
    case 45: case 315: return surd(1, 2, 2);
    case 135: case 225: return surd(-1, 2, 2);
    case 60: case 300: return surd(1, 2);
    case 120: case 240: return surd(-1, 2);
    default: throw new Error(`cosS: ${deg} is off the grid`);
  }
}
const sinS = (deg: number) => cosS(90 - deg);

/** r·cis θ → (re, im) exactly. */
function toAlgebraic(r: Surd, deg: number): [Surd, Surd] {
  return [surdMul(r, cosS(deg)), surdMul(r, sinS(deg))];
}

/** Quadrant of a grid angle strictly inside a quadrant, as the lesson writes it. */
function quadrant(deg: number): string {
  const t = norm(deg);
  return t < 90 ? 'I' : t < 180 ? 'II' : t < 270 ? 'III' : 'IV';
}

/** Off-axis grid points with exact integer/√3 coordinates: (r, θ). */
type PolarPt = { r: Surd; deg: number };
function gridPoints(ks: number[], degs: number[]): PolarPt[] {
  const out: PolarPt[] = [];
  for (const k of ks) {
    for (const deg of degs) {
      // 45°-family needs r = k√2; the 30°/60° family needs r = 2k.
      out.push({ r: deg % 90 === 45 ? surd(k, 1, 2) : surd(2 * k), deg });
    }
  }
  return out;
}

const polarTex = (r: Surd, deg: number) => `${surdTex(r) === '1' ? '' : surdTex(r)}${CIS}${deg}°`;
const polarExpr = (r: Surd, deg: number) => {
  const m = surdExpr(r);
  return m === '1' ? `cis(${deg})` : `${m}*cis(${deg})`;
};

// ---------------------------------------------------------------------------
// 1 · polar-de-moivre
// ---------------------------------------------------------------------------

const polarForm: GenTemplate = {
  id: 'cx-polar-form',
  distractorTags: [null, 'condition-ignored', 'sign-slip', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'polar-de-moivre',
  title: 'מעבר מהצגה אלגברית להצגה קוטבית',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const degs = difficulty === 'easy' ? [120, 135, 225, 240, 300, 315] : [120, 135, 150, 210, 225, 240, 300, 315, 330];
    const { r, deg } = rng.pick(gridPoints(difficulty === 'easy' ? [1, 2, 3, 4] : [1, 2, 3, 4, 5], degs));
    const [re, im] = toAlgebraic(r, deg);
    const z = cxTex(re, im);
    const q = quadrant(deg);
    const alpha = q === 'II' ? 180 - deg : q === 'III' ? deg - 180 : 360 - deg;
    // The quadrant a sign misread would send the point to.
    const wrongQ = q === 'III' ? 180 - alpha : 180 + alpha;
    const r2 = surdPow(r, 2);

    const right = `$${polarTex(r, deg)}$`;
    const wrongQNote =
      q === 'II'
        ? `החלק המדומה חיובי, ולכן הנקודה מעל ציר $x$ ברביע II; הזווית $${wrongQ}°$ מתאימה לרביע III, כלומר לנקודה $${cxTex(re, negS(im))}$.`
        : q === 'III'
          ? `החלק המדומה שלילי, ולכן הנקודה מתחת לציר $x$ ברביע III; הזווית $${wrongQ}°$ מתאימה לרביע II, כלומר לנקודה $${cxTex(re, negS(im))}$.`
          : `החלק הממשי חיובי, ולכן הנקודה מימין לציר $y$ ברביע IV; הזווית $${wrongQ}°$ מתאימה לרביע III, כלומר לנקודה $${cxTex(negS(re), im)}$.`;
    const fix = q === 'II' ? `180° - ${alpha}°` : q === 'III' ? `180° + ${alpha}°` : `360° - ${alpha}°`;

    return mcq({
      question: rng.chance(0.5)
        ? `מהי ההצגה הקוטבית של $z = ${z}$?`
        : `כתוב את המספר $z = ${z}$ בהצגה קוטבית $r${CIS}\\theta$ כאשר $0° \\le \\theta < 360°$.`,
      answers: [right, `$${polarTex(r, alpha)}$`, `$${polarTex(r, wrongQ)}$`, `$${polarTex(r2, deg)}$`],
      correct: 0,
      distractorNotes: [
        '',
        `הגודל נכון, אבל זו זווית העזר בלי תיקון רביע. הזווית $${alpha}°$ שייכת לנקודה ברביע I; כאן הנקודה ברביע ${q}, ולכן $\\theta = ${fix} = ${deg}°$.`,
        wrongQNote,
        `הזווית נכונה, אבל השורש נשמט מהגודל. $|z| = \\sqrt{a^2 + b^2} = \\sqrt{${surdTex(r2)}} = ${surdTex(r)}$, ולא $${surdTex(r2)}$.`,
      ],
      hint: `חשב את הגודל, וזהה את הרביע לפי הסימנים של $a$ ו-$b$ לפני שקובעים את הזווית.`,
      solution: {
        steps: [
          '**הכלל:** הצגה קוטבית דורשת גודל וזווית, ולכן מחשבים את הגודל לפי שורש סכום הריבועים ואת הזווית לפי זווית העזר עם תיקון לרביע שבו יושבת הנקודה.',
          `**הגודל:** $r = \\sqrt{a^2 + b^2} = \\sqrt{${surdTex(r2)}} = ${surdTex(r)}$.`,
          `**הרביע:** $a ${re.c.n < 0 ? '<' : '>'} 0$ ו-$b ${im.c.n < 0 ? '<' : '>'} 0$, ולכן הנקודה ברביע ${q}.`,
          `**הזווית:** זווית העזר היא $${alpha}°$, ותיקון הרביע נותן $\\theta = ${fix} = ${deg}°$.`,
          `מרכיבים: $z = ${polarTex(r, deg)}$.`,
        ],
        finalAnswer: right,
        explanation: 'זווית העזר לבדה מתאימה לרביע I; הסימנים של החלק הממשי והמדומה קובעים את התיקון.',
      },
    });
  },
};

const deMoivrePower: GenTemplate = {
  id: 'cx-de-moivre-power',
  wrongAnswerTags: ['exponent-slip', 'dropped-factor'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'polar-de-moivre',
  title: 'חזקה של מספר מרוכב לפי דה-מואבר',
  skill: 'substitution',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const n = difficulty === 'easy' ? rng.int(2, 3) : difficulty === 'mid' ? rng.int(3, 4) : rng.int(2, 4);
    let r: Surd;
    let deg: number;
    if (difficulty === 'hard') {
      // z is given algebraically; the student converts first.
      const pts = gridPoints([1, 2], [30, 45, 60, 120, 135, 150, 210, 225, 240, 300, 315, 330]).filter(
        (p) => ((n - 1) * p.deg) % 360 !== 0,
      );
      ({ r, deg } = rng.pick(pts));
    } else {
      r = surd(rng.int(2, 3));
      // (n−1)θ ≡ 0 would make "angle not multiplied" coincide with the answer.
      deg = rng.pick(ANGLES.filter((d) => d !== 0 && ((n - 1) * d) % 360 !== 0));
    }
    const rn = surdPow(r, n);
    const raw = n * deg;
    const phi = norm(raw);
    const [re, im] = toAlgebraic(r, deg);
    const zTex = difficulty === 'hard' ? cxTex(re, im) : polarTex(r, deg);

    const r2 = surdPow(r, 2);
    const convert =
      difficulty === 'hard'
        ? [
            `**המעבר לקוטבית:** $r = \\sqrt{a^2 + b^2} = \\sqrt{${surdTex(r2)}} = ${surdTex(r)}$, והנקודה ברביע ${quadrant(deg)} נותנת $\\theta = ${deg}°$, כלומר $z = ${polarTex(r, deg)}$.`,
          ]
        : [];
    const reduce = raw >= 360 ? [`מורידים כפולות של $360°$: $${raw}° - ${raw - phi}° = ${phi}°$.`] : [];

    return open({
      question: `נתון $z = ${zTex}$. חשב את $z^{${n}}$ ורשום את התוצאה בהצגה קוטבית $r${CIS}\\theta$ כאשר $0° \\le \\theta < 360°$.`,
      expected: { kind: 'value', value: polarExpr(rn, phi) },
      wrongAnswers: [
        {
          value: polarExpr(r, phi),
          note: `הזווית הוכפלה אבל הגודל נשאר $${surdTex(r)}$. לפי דה-מואבר הגודל עולה בחזקה: $${surdTex(r)}^{${n}} = ${surdTex(rn)}$.`,
        },
        {
          value: polarExpr(rn, deg),
          note: `הגודל הועלה בחזקה אבל הזווית נשארה $${deg}°$. לפי דה-מואבר הזווית מוכפלת במעריך: $${n} \\cdot ${deg}° = ${raw}°$.`,
        },
      ],
      hint: 'דה-מואבר: הגודל בחזקה, הזווית כפול המעריך. בסוף מורידים כפולות של 360 מעלות.',
      solution: {
        steps: [
          '**הכלל:** מבוקשת חזקה של מספר מרוכב, ולכן משתמשים בנוסחת דה-מואבר: הגודל מועלה בחזקה והזווית מוכפלת במעריך, ואת הזווית מורידים לתחום שבין אפס ל-360 מעלות.',
          ...convert,
          `**הנוסחה:** $z^{${n}} = r^{${n}}${CIS}(${n}\\theta)$.`,
          `**ההצבה:** $z^{${n}} = ${surdTex(r)}^{${n}}${CIS}(${n} \\cdot ${deg}°) = ${surdTex(rn)}${CIS}${raw}°$.`,
          ...reduce,
        ],
        finalAnswer: `$z^{${n}} = ${polarTex(rn, phi)}$`,
        explanation: 'חזקה בהצגה קוטבית היא חזקה על הגודל וכפל על הזווית.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 2 · complex-roots
// ---------------------------------------------------------------------------

/** How `w = R cis θ` is written in the question: `-8`, `8i`, `-8i`, or polar. */
function wTex(R: number, deg: number): string {
  if (deg === 0) return String(R);
  if (deg === 180) return String(-R);
  if (deg === 90) return `${R}i`;
  if (deg === 270) return `-${R}i`;
  return `${R}${CIS}${deg}°`;
}

/** The conversion step, only when `w` was written algebraically. */
const toPolarStep = (R: number, deg: number) =>
  deg % 90 === 0 ? [`אגף ימין בקוטבית: $${wTex(R, deg)} = ${R}${CIS}${deg}°$.`] : [];

const rootsFirst: GenTemplate = {
  id: 'cx-roots-first',
  distractorTags: [null, 'exponent-slip', 'dropped-factor', 'operation-swap'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'complex-roots',
  title: 'השורש הראשון של משוואה מהצורה z בחזקת n שווה w',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const n = difficulty === 'easy' ? rng.int(2, 3) : difficulty === 'mid' ? rng.int(3, 4) : rng.int(5, 6);
    const r = n <= 4 ? rng.int(2, 3) : 2;
    const R = r ** n;
    // θ/n must be a whole degree, and none of the three distractor angles may
    // land on the answer.
    const degs = ANGLES.filter(
      (d) => d !== 0 && d % n === 0 && ((n - 1) * d) % 360 !== 0 && norm(n * d) !== d / n,
    );
    const deg = rng.pick(degs);
    const first = deg / n;

    const right = `$${r}${CIS}${first}°$`;
    return mcq({
      question: rng.chance(0.5)
        ? `נתונה המשוואה $z^{${n}} = ${wTex(R, deg)}$. מהו השורש המתקבל מנוסחת השורשים עבור $k = 0$?`
        : `פותרים את המשוואה $z^{${n}} = ${wTex(R, deg)}$ בעזרת נוסחת השורשים. מהו $z_0$, השורש עבור $k = 0$?`,
      answers: [right, `$${R}${CIS}${first}°$`, `$${r}${CIS}${deg}°$`, `$${r}${CIS}${norm(n * deg)}°$`],
      correct: 0,
      distractorNotes: [
        '',
        `הזווית נכונה אבל הגודל לא הוצא ממנו שורש. גודל כל שורש הוא $\\sqrt[${n}]{${R}} = ${r}$, כי $${r}^{${n}} = ${R}$.`,
        `הגודל נכון אבל הזווית לא חולקה ב-$${n}$. עבור $k = 0$ הזווית היא $\\dfrac{${deg}°}{${n}} = ${first}°$.`,
        `הזווית הוכפלה ב-$${n}$ במקום להתחלק בו. זו הפעולה של דה-מואבר לחזקה; בשורש עושים את ההפך ומקבלים $${first}°$.`,
      ],
      hint: `כתוב את אגף ימין בהצגה קוטבית, ואז שורש $${n}$-י לגודל וחלוקה ב-$${n}$ לזווית.`,
      solution: {
        steps: [
          '**הכלל:** מבוקש שורש של משוואה מהצורה חזקה של z שווה למספר נתון, ולכן כותבים את אגף ימין בהצגה קוטבית ומפעילים את נוסחת השורשים: שורש n-י לגודל, והזווית ועוד כפולות של 360 מעלות מחולקות ב-n.',
          ...toPolarStep(R, deg),
          `**הנוסחה:** $z_k = \\sqrt[${n}]{${R}}${CIS}\\dfrac{${deg}° + 360° k}{${n}}$.`,
          `**ההצבה:** עבור $k = 0$: $z_0 = ${r}${CIS}\\dfrac{${deg}°}{${n}} = ${r}${CIS}${first}°$.`,
        ],
        finalAnswer: `$z_0 = ${r}${CIS}${first}°$`,
        explanation: 'בשורש הגודל יורד בשורש והזווית מתחלקת; זה ההפך מדה-מואבר.',
      },
    });
  },
};

const rootsAll: GenTemplate = {
  id: 'cx-roots-all',
  wrongAnswerTags: ['partial-answer', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'complex-roots',
  title: 'כל השורשים של משוואה מהצורה z בחזקת n שווה w',
  skill: 'counting',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const n = difficulty === 'easy' ? 2 : difficulty === 'mid' ? 3 : rng.int(3, 4);
    const r = rng.int(1, 3);
    const R = r ** n;
    const deg = rng.pick(ANGLES.filter((d) => d % n === 0));
    const rS = surd(r);
    const ks = Array.from({ length: n }, (_, k) => k);
    const angles = ks.map((k) => (deg + 360 * k) / n);
    const wrongSpacing = ks.map((k) => deg / n + (180 * k) / n);
    const list = angles.map((a) => `$${polarTex(rS, a)}$`).join(', ');

    return open({
      question: rng.chance(0.5)
        ? `מצא את כל ${n === 2 ? 'שני' : n === 3 ? 'שלושת' : 'ארבעת'} פתרונות המשוואה $z^{${n}} = ${wTex(R, deg)}$ בהצגה קוטבית.`
        : `פתור את המשוואה $z^{${n}} = ${wTex(R, deg)}$ ורשום את כל הפתרונות בהצגה קוטבית.`,
      expected: { kind: 'set', values: angles.map((a) => polarExpr(rS, a)) },
      wrongAnswers: [
        {
          value: polarExpr(rS, angles[0]),
          note: `זה רק השורש של $k = 0$. למשוואה ממעלה $${n}$ יש $${n}$ פתרונות, ומקבלים אותם מהצבת $k = 0, \\ldots, ${n - 1}$ בנוסחה.`,
        },
        {
          value: wrongSpacing.map((a) => polarExpr(rS, a)).join(', '),
          note: `המרווח בין שורשים סמוכים הוא $\\dfrac{360°}{${n}} = ${360 / n}°$, לא $${180 / n}°$. בנוסחה מוסיפים לזווית כפולות של $360°$, לא של $180°$, לפני החלוקה.`,
        },
      ],
      hint: `כתוב את אגף ימין בקוטבית. הגודל של כל שורש הוא השורש ה-$${n}$-י, והזוויות במרווחים של $${360 / n}°$.`,
      solution: {
        steps: [
          '**הכלל:** מבוקשים כל הפתרונות של חזקה של z ששווה למספר נתון, ולכן כותבים את אגף ימין בהצגה קוטבית ומפעילים את נוסחת השורשים לכל ערך של k מאפס ועד n פחות אחת.',
          ...toPolarStep(R, deg),
          `**הנוסחה:** $z_k = \\sqrt[${n}]{${R}}${CIS}\\dfrac{${deg}° + 360° k}{${n}} = ${r}${CIS}\\dfrac{${deg}° + 360° k}{${n}}$, עבור $k = 0, \\ldots, ${n - 1}$.`,
          `**ההצבה:** ${ks.map((k) => `$k = ${k}$ נותן $${polarTex(rS, angles[k])}$`).join('; ')}.`,
        ],
        finalAnswer: list,
        explanation: `השורשים יושבים על מעגל ברדיוס $${r}$ במרווחים שווים של $${360 / n}°$.`,
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 3 · complex-equations
// ---------------------------------------------------------------------------

/** `z^2 + bz + c` with folded signs. */
function quadTex(b: number, c: number): string {
  const bz = b === 0 ? '' : b === 1 ? ' + z' : b === -1 ? ' - z' : b > 0 ? ` + ${b}z` : ` - ${-b}z`;
  const cc = c === 0 ? '' : c > 0 ? ` + ${c}` : ` - ${-c}`;
  return `z^2${bz}${cc}`;
}

const quadReal: GenTemplate = {
  id: 'cx-eq-quadratic-real',
  wrongAnswerTags: ['sign-slip', 'condition-ignored'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'complex-equations',
  title: 'משוואה ריבועית עם מקדמים ממשיים ושורשים מרוכבים',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const p = difficulty === 'easy' ? rng.int(1, 6) : rng.pick([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6]);
    const q = difficulty === 'hard' ? rng.int(2, 7) : rng.int(1, 5);
    const b = -2 * p;
    const c = p * p + q * q;
    const pS = surd(p);
    const qS = surd(q);
    const z1 = cxTex(pS, qS);
    const z2 = cxTex(pS, negS(qS));

    return open({
      question: rng.chance(0.5)
        ? `פתור את המשוואה $${quadTex(b, c)} = 0$ בתחום המרוכבים.`
        : `מצא את שני הפתרונות המרוכבים של המשוואה $${quadTex(b, c)} = 0$.`,
      expected: { kind: 'set', values: [cxExpr(pS, qS), cxExpr(pS, negS(qS))] },
      wrongAnswers: [
        {
          value: `${cxExpr(negS(pS), qS)}, ${cxExpr(negS(pS), negS(qS))}`,
          note: `הסימן של $b$ בנוסחת השורשים לא הופך. הנוסחה מתחילה במינוס $b$, וכאן $b = ${b}$, ולכן החלק הממשי הוא $\\dfrac{${-b}}{2} = ${p}$.`,
        },
        {
          value: `${p + q}, ${p - q}`,
          note: `הדיסקרימיננטה שלילית, ושורש של מספר שלילי אינו מספר ממשי. $\\sqrt{${-4 * q * q}} = ${2 * q}i$, ולכן הפתרונות מרוכבים ולא ממשיים.`,
        },
      ],
      hint: 'נוסחת השורשים כרגיל. כשהדיסקרימיננטה שלילית, שורש של מינוס הופך ל-i.',
      solution: {
        steps: [
          '**הכלל:** משוואה ריבועית עם מקדמים ממשיים נפתרת בנוסחת השורשים, וכאשר הדיסקרימיננטה שלילית כותבים את השורש שלה בעזרת i ומקבלים זוג שורשים צמודים.',
          `**הנוסחה:** $z = \\dfrac{-b \\pm \\sqrt{b^2 - 4c}}{2}$ עם $b = ${b}$, $c = ${c}$.`,
          `**הדיסקרימיננטה:** $b^2 - 4c = ${b * b} - ${4 * c} = ${-4 * q * q}$.`,
          `$\\sqrt{${-4 * q * q}} = \\sqrt{${4 * q * q}} \\cdot i = ${2 * q}i$.`,
          `**ההצבה:** $z = \\dfrac{${-b} \\pm ${2 * q}i}{2} = ${p} \\pm ${q === 1 ? '' : q}i$.`,
        ],
        finalAnswer: `$z_1 = ${z1}$, $z_2 = ${z2}$`,
        explanation: 'שורשים מרוכבים של משוואה עם מקדמים ממשיים באים תמיד כזוג צמוד.',
      },
    });
  },
};

const conjLinear: GenTemplate = {
  id: 'cx-eq-conjugate-linear',
  wrongAnswerTags: ['sign-slip', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'complex-equations',
  title: 'משוואה ליניארית עם z והצמוד שלו',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const a = rng.int(1, 4);
    const bs = (difficulty === 'easy' ? [1, 2, 3] : [-3, -2, -1, 1, 2, 3]).filter((v) => v !== a && v !== -a);
    const b = rng.pick(bs);
    const range = difficulty === 'hard' ? [-5, 5] : difficulty === 'mid' ? [-3, 3] : [1, 3];
    const x = rng.int(range[0], range[1]);
    const y = rng.pick([-4, -3, -2, -1, 1, 2, 3, 4].filter((v) => v >= range[0] && v <= range[1]));
    const cRe = (a + b) * x;
    const dIm = (a - b) * y;
    const rhs = cxTex(surd(cRe), surd(dIm));
    const zT = cxTex(surd(x), surd(y));

    const aT = a === 1 ? '' : String(a);
    const bT = `${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}`;
    const lhs = `${aT}z ${bT}\\bar{z}`;

    return open({
      question: `מצא את המספר המרוכב $z$ המקיים $${lhs} = ${rhs}$.`,
      expected: { kind: 'value', value: cxExpr(surd(x), surd(y)) },
      wrongAnswers: [
        {
          value: cxExpr(surd(x), surd(-y)),
          note: `זה הצמוד של הפתרון. משוואת החלק המדומה היא $${a - b}y = ${dIm}$, ולכן $y = ${y}$, וכותבים $z = x + yi$ ולא את הצמוד שלו.`,
        },
        {
          value: `(${cRe})/(${a + b})+(${dIm})/(${a + b})*i`,
          note: `הצמוד טופל כאילו הוא $z$ עצמו. ב-$\\bar{z} = x - yi$ החלק המדומה מחליף סימן, ולכן מקדם $y$ הוא $${a} - (${b}) = ${a - b}$ ולא $${a + b}$.`,
        },
      ],
      hint: 'הצב z = x + yi ו-z̄ = x − yi, ואז השווה חלק ממשי לממשי ומדומה למדומה.',
      solution: {
        steps: [
          '**הכלל:** במשוואה שמופיעים בה z והצמוד שלו מציבים z שווה x ועוד yi והצמוד שווה x פחות yi, ומשווים בנפרד את החלק הממשי ואת החלק המדומה של שני האגפים.',
          `**ההצבה:** $${aT}(x + yi) ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}(x - yi) = ${a + b}x ${a - b < 0 ? '-' : '+'} ${Math.abs(a - b)}yi$.`,
          `**חלק ממשי:** $${a + b}x = ${cRe}$, ולכן $x = ${x}$.`,
          `**חלק מדומה:** $${a - b}y = ${dIm}$, ולכן $y = ${y}$.`,
          `לכן $z = ${zT}$.`,
        ],
        finalAnswer: `$z = ${zT}$`,
        explanation: 'שני מספרים מרוכבים שווים רק אם גם החלק הממשי וגם החלק המדומה שווים.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 4 · gauss-loci
// ---------------------------------------------------------------------------

/** `mz - ma - mbi` with the signs folded: a=2,b=-3,m=1 → `z - 2 + 3i`. */
function zMinus(a: number, b: number, m = 1): string {
  const term = (v: number, suffix: string) => {
    const av = Math.abs(v);
    return ` ${v > 0 ? '-' : '+'} ${av === 1 && suffix ? '' : av}${suffix}`;
  };
  return `${m === 1 ? '' : m}z${term(m * a, '')}${term(m * b, 'i')}`;
}

const locusCircle: GenTemplate = {
  id: 'cx-locus-circle',
  distractorTags: [null, 'sign-slip', 'values-swapped', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'gauss-loci',
  title: 'מרכז ורדיוס של מעגל במישור גאוס',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const vals = difficulty === 'easy' ? [1, 2, 3, 4, 5] : [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];
    const a = rng.pick(vals);
    const b = rng.pick(vals.filter((v) => v !== a && v !== -a));
    const R = rng.int(2, 5);
    const m = difficulty === 'hard' ? rng.int(2, 3) : 1;
    const centre = (x: number, y: number) => `מרכז $(${x}, ${y})$`;
    const right = `${centre(a, b)}, רדיוס $${R}$`;
    const z0 = cxTex(surd(a), surd(b));

    return mcq({
      question: `איזה מעגל מייצגת המשוואה $|${zMinus(a, b, m)}| = ${m * R}$?`,
      answers: [right, `${centre(-a, -b)}, רדיוס $${R}$`, `${centre(b, a)}, רדיוס $${R}$`, `${centre(a, b)}, רדיוס $${R * R}$`],
      correct: 0,
      distractorNotes: [
        '',
        `הסימנים נקראו ישירות מהביטוי. הצורה התקנית היא $|z - z_0| = r$, ולכן $${zMinus(a, b)} = z - (${z0})$ והמרכז הוא $z_0 = ${z0}$, כלומר $(${a}, ${b})$.`,
        `החלק הממשי והמדומה התחלפו. המרכז $z_0 = ${z0}$ מתאים לנקודה $(${a}, ${b})$: החלק הממשי הוא שיעור ה-$x$ והחלק המדומה הוא שיעור ה-$y$.`,
        `הרדיוס הועלה בריבוע בלי סיבה. במשוואה $|z - z_0| = r$ אגף ימין הוא הרדיוס עצמו, כי הערך המוחלט הוא מרחק ולא מרחק בריבוע.`,
      ],
      hint: `כתוב את הביטוי בצורה $|z - z_0| = r$. מה $z_0$, ומה $r$?`,
      solution: {
        steps: [
          '**הכלל:** משוואה מהצורה ערך מוחלט של z פחות מספר קבוע שווה למספר חיובי היא מעגל, ולכן משכתבים אותה לצורה התקנית: המספר הקבוע הוא המרכז ואגף ימין הוא הרדיוס.',
          ...(m === 1
            ? []
            : [`מחלקים את שני האגפים ב-$${m}$: $|${zMinus(a, b)}| = ${R}$.`]),
          `משכתבים: $${zMinus(a, b)} = z - (${z0})$, ולכן $|z - (${z0})| = ${R}$.`,
          `המרכז: $z_0 = ${z0}$, כלומר הנקודה $(${a}, ${b})$. הרדיוס: $r = ${R}$.`,
        ],
        finalAnswer: right,
        explanation: 'המרכז הוא המספר שמחסרים מ-z, בסימן ההפוך ממה שכתוב בביטוי.',
      },
    });
  },
};

/** Shared builder: a point given by modulus and argument, asked for algebraically. */
function polarToAlgebraic(
  rng: Rng,
  wording: (r: number, deg: number) => string,
  degs: number[],
  rs: number[],
  second: 'values-swapped' | 'dropped-factor',
) {
  const r = rng.pick(rs);
  const deg = rng.pick(degs);
  const rS = surd(r);
  const [re, im] = toAlgebraic(rS, deg);
  const z = cxTex(re, im);
  const [c1, s1] = [cosS(deg), sinS(deg)];

  const secondWrong =
    second === 'values-swapped'
      ? {
          value: cxExpr(im, re),
          note: `הקוסינוס והסינוס התחלפו. החלק הממשי הוא $r\\cos\\theta$ והחלק המדומה הוא $r\\sin\\theta$, ולכן $\\text{Re}(z) = ${surdTex(re)}$ ו-$\\text{Im}(z) = ${surdTex(im)}$.`,
        }
      : {
          value: cxExpr(c1, s1),
          note: `הגודל $${r}$ נשמט. $\\cos ${deg}°$ ו-$\\sin ${deg}°$ נותנים נקודה על מעגל היחידה, ועוד צריך להכפיל את שניהם ב-$r = ${r}$.`,
        };

  return open({
    question: wording(r, deg),
    expected: { kind: 'value', value: cxExpr(re, im) },
    wrongAnswers: [
      {
        value: cxExpr(re, negS(im)),
        note: `זה הצמוד, כלומר הנקודה בזווית $${360 - deg}°$. הזווית $${deg}°$ נותנת $\\sin ${deg}° = ${surdTex(s1)}$, ולכן החלק המדומה הוא $${surdTex(im)}$.`,
      },
      secondWrong,
    ],
    hint: 'z שווה r כפול cis של הזווית. פרק ל-cos ו-sin והצב ערכים מדויקים.',
    solution: {
      steps: [
        '**הכלל:** כשנתונים הגודל והזווית של מספר מרוכב כותבים אותו בהצגה קוטבית, ואת ההצגה האלגברית מקבלים מהזהות cis שווה קוסינוס ועוד i כפול סינוס עם ערכים מדויקים של הזוויות המיוחדות.',
      `**הנוסחה:** $z = ${r}${CIS}${deg}° = ${r}(\\cos ${deg}° + i\\sin ${deg}°)$.`,
      `**ההצבה:** $\\cos ${deg}° = ${surdTex(c1)}$ ו-$\\sin ${deg}° = ${surdTex(s1)}$.`,
      `$z = ${r} \\cdot ${surdTex(c1).startsWith('-') ? `(${surdTex(c1)})` : surdTex(c1)} + ${r} \\cdot ${surdTex(s1).startsWith('-') ? `(${surdTex(s1)})` : surdTex(s1)}\\, i = ${z}$.`,
      ],
      finalAnswer: `$z = ${z}$`,
      explanation: 'ההצגה הקוטבית והאלגברית מתארות את אותה נקודה; המעבר ביניהן הוא דרך cos ו-sin.',
    },
  });
}

const locusIntersection: GenTemplate = {
  id: 'cx-locus-circle-ray',
  wrongAnswerTags: ['sign-slip', 'values-swapped'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'gauss-loci',
  title: 'חיתוך מעגל עם קרן במישור גאוס',
  skill: 'substitution',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    // 0°/180° make the conjugate coincide with the answer; 45°/225° make the
    // swapped parts coincide.
    const degs = ANGLES.filter((d) => ![0, 180, 45, 225].includes(d));
    return polarToAlgebraic(
      rng,
      (r, deg) =>
        rng.chance(0.5)
          ? `מצא את נקודת החיתוך של המעגל $|z| = ${r}$ עם הקרן $\\arg(z) = ${deg}°$, ורשום אותה בהצגה אלגברית.`
          : `המעגל $|z| = ${r}$ והקרן $\\arg(z) = ${deg}°$ נחתכים בנקודה אחת. מהו המספר המרוכב $z$ שמתאים לנקודה זו?`,
      degs,
      difficulty === 'easy' ? [1, 2, 3] : [2, 3, 4],
      'values-swapped',
    );
  },
};

// ---------------------------------------------------------------------------
// 5 · finding-z
// ---------------------------------------------------------------------------

const findZFromPolar: GenTemplate = {
  id: 'cx-find-z-modulus-arg',
  wrongAnswerTags: ['sign-slip', 'dropped-factor'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'finding-z',
  title: 'מציאת z מהגודל והארגומנט',
  skill: 'substitution',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    // 0°/180° make the conjugate coincide with the answer.
    const degs = ANGLES.filter((d) => d !== 0 && d !== 180);
    return polarToAlgebraic(
      rng,
      (r, deg) =>
        rng.chance(0.5)
          ? `נתון $|z| = ${r}$ ו-$\\arg(z) = ${deg}°$. מהו $z$ בהצגה אלגברית?`
          : `למספר מרוכב $z$ יש גודל $${r}$ וארגומנט $${deg}°$. כתוב את $z$ בצורה $a + bi$.`,
      degs,
      difficulty === 'easy' ? [2, 3] : [2, 3, 4, 5],
      'dropped-factor',
    );
  },
};

const findZProduct: GenTemplate = {
  id: 'cx-find-z-product',
  wrongAnswerTags: ['operation-swap', 'sign-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'finding-z',
  title: 'מציאת גורם מרוכב מתוך מכפלה נתונה',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const vals =
      difficulty === 'easy' ? [1, 2, 3] : difficulty === 'mid' ? [-4, -3, -2, -1, 1, 2, 3, 4] : [-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6];
    const a = rng.pick(vals);
    const b = rng.pick(vals);
    const c = rng.pick(vals);
    const d = rng.pick(vals);
    // w = z1·z2
    const wr = a * c - b * d;
    const wi = a * d + b * c;
    const z1 = cxTex(surd(a), surd(b));
    const w = cxTex(surd(wr), surd(wi));
    const z2 = cxTex(surd(c), surd(d));
    const mod2 = a * a + b * b;
    // w·conj(z1) = (wr a + wi b) + (wi a − wr b) i = mod2·(c + di)
    const nr = wr * a + wi * b;
    const ni = wi * a - wr * b;
    // z1·w, the "multiplied instead of divided" answer
    const mr = a * wr - b * wi;
    const mi = a * wi + b * wr;

    return open({
      question: rng.chance(0.5)
        ? `נתונים שני מספרים מרוכבים שמכפלתם $z_1 z_2 = ${w}$, ונתון $z_1 = ${z1}$. מצא את $z_2$.`
        : `נתון $z_1 = ${z1}$ וידוע כי $z_1 \\cdot z_2 = ${w}$. מצא את המספר המרוכב $z_2$.`,
      expected: { kind: 'value', value: cxExpr(surd(c), surd(d)) },
      wrongAnswers: [
        {
          value: cxExpr(surd(mr), surd(mi)),
          note: `זו המכפלה $z_1 \\cdot (z_1 z_2)$ במקום המנה. כדי לבודד את $z_2$ מחלקים את המכפלה ב-$z_1$: $z_2 = \\dfrac{${w}}{${z1}}$.`,
        },
        {
          value: cxExpr(surd(c), surd(-d)),
          note: `זה הצמוד של התשובה. הכפלה בצמוד נעשית במונה ובמכנה יחד, ולכן המונה הוא $(${w})(${cxTex(surd(a), surd(-b))}) = ${cxTex(surd(nr), surd(ni))}$ והחלק המדומה יוצא $${d}$.`,
        },
      ],
      hint: 'בודדים את z₂ בחילוק, ומחלקים במרוכב על ידי הכפלת המונה והמכנה בצמוד של המכנה.',
      solution: {
        steps: [
          '**הכלל:** כשנתונים מכפלה ואחד הגורמים, הגורם השני הוא המנה, וחילוק במספר מרוכב נעשה על ידי הכפלת המונה והמכנה בצמוד של המכנה כדי שהמכנה יהפוך לממשי.',
          `**הנוסחה:** $z_2 = \\dfrac{z_1 z_2}{z_1} = \\dfrac{(${w})(${cxTex(surd(a), surd(-b))})}{(${z1})(${cxTex(surd(a), surd(-b))})}$.`,
          `**המכנה:** $|z_1|^2 = ${a < 0 ? `(${a})` : a}^2 + ${b < 0 ? `(${b})` : b}^2 = ${mod2}$.`,
          `**המונה:** $(${w})(${cxTex(surd(a), surd(-b))}) = ${cxTex(surd(nr), surd(ni))}$.`,
          `$z_2 = \\dfrac{${cxTex(surd(nr), surd(ni))}}{${mod2}} = ${z2}$.`,
        ],
        finalAnswer: `$z_2 = ${z2}$`,
        explanation: 'הכפלה בצמוד הופכת את המכנה לסכום ריבועים ממשי, ואז מחלקים כל חלק בנפרד.',
      },
    });
  },
};

export const COMPLEX_TEMPLATES: GenTemplate[] = [
  polarForm,
  deMoivrePower,
  rootsFirst,
  rootsAll,
  quadReal,
  conjLinear,
  locusCircle,
  locusIntersection,
  findZFromPolar,
  findZProduct,
];
