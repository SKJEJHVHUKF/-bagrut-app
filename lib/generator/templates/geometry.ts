/**
 * generator/templates/geometry.ts — parameterised repair questions for
 * גאומטריה אנליטית.
 *
 * Same authored-content contract as the other families (see ./sequences).
 *
 * ============================================================
 * WHY THIS TOPIC PAYS FOR ITSELF TWICE
 * ============================================================
 * Analytic geometry is the best possible third family for `lib/patterns`, and
 * not because of the maths. The mistakes here are the SAME mistakes the student
 * already makes elsewhere, wearing different clothes:
 *
 *   · reading the centre of $(x-3)^2+(y+2)^2=r^2$ as $(3,2)$ is a `sign-slip`,
 *     the same tag as writing $1+q$ for $1-q$ in an infinite geometric sum
 *   · giving the focus as $(p,0)$ instead of $(p/2,0)$ is a `dropped-factor`,
 *     the same tag as forgetting the binomial coefficient
 *   · using $c^2=a^2+b^2$ on an ellipse is a `formula-mismatch`
 *   · answering $r^2$ when asked for $r$ is an `exponent-slip`
 *
 * That is what turns the report from "here are your סדרות problems and here are
 * your הסתברות problems" into one sentence about the student. A tag that only
 * ever fires in one topic cannot make that sentence.
 *
 * ============================================================
 * PARAMETERS ARE CHOSEN SO NOTHING IS EVER IRRATIONAL
 * ============================================================
 * Distances use Pythagorean triples, circle radii are integers, parabola
 * parameters are picked so $p/2$ stays whole, and ellipse pairs are drawn from
 * a table where $a^2-b^2$ is a perfect square. A generated question whose answer
 * is `5.385164807134504` is not a harder question — it is a broken one.
 *
 * Curriculum conventions, matched to the authored bank in this sub-topic:
 *   parabola  $y^2 = 2px$ → focus $(p/2, 0)$, directrix $x = -p/2$
 *   ellipse   $x^2/a^2 + y^2/b^2 = 1$ → $c^2 = a^2 - b^2$, foci $(\pm c, 0)$
 *   circle    $(x-a)^2 + (y-b)^2 = r^2$, and the general form completed
 */

import { Frac, type Rng } from '../rng';
import type { GenTemplate } from '../types';
import { mcq, open } from './shared';

const TOPIC = 'גאומטריה אנליטית';
const SUBJECT = 'math5';

// ---------------------------------------------------------------------------
// Parameter tables — every entry keeps the arithmetic exact
// ---------------------------------------------------------------------------

/** (leg, leg, hypotenuse). Distances stay whole numbers. */
const TRIPLES: [number, number, number][] = [
  [3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17],
  [7, 24, 25], [20, 21, 29], [12, 16, 20], [10, 24, 26], [15, 20, 25],
];

/**
 * `(a², b², c)` where `a`, `b` AND `c = √(a²-b²)` are all whole numbers — each
 * row is a Pythagorean triple read as `a² = b² + c²`.
 *
 * Both orientations of every triple are listed (5-4-3 gives both `(25,16,3)`
 * and `(25,9,4)`) because they are genuinely different questions, and the table
 * needs the breadth: `verify-generator` rejected the first version of this file
 * for producing 8 distinct questions from 60 seeds.
 */
const ELLIPSES: [number, number, number][] = [
  [25, 16, 3], [25, 9, 4],
  [169, 144, 5], [169, 25, 12],
  [100, 64, 6], [100, 36, 8],
  [289, 225, 8], [289, 64, 15],
  [225, 144, 9], [225, 81, 12],
  [400, 256, 12], [400, 144, 16],
  [625, 576, 7], [625, 49, 24],
  [676, 576, 10], [676, 100, 24],
  [841, 441, 20], [841, 400, 21],
];

/** Signed integer in [-hi, hi], never zero. */
function nonZero(rng: Rng, hi: number): number {
  const v = rng.int(1, hi);
  return rng.chance(0.45) ? -v : v;
}

/** `(3, -2)` — a point, written the way the bank writes it. */
const pt = (x: number, y: number) => `(${x}, ${y})`;

/** `+ 5` / `- 5`, for building an equation without a stray `+ -5`. */
function signed(n: number): string {
  return n < 0 ? `- ${-n}` : `+ ${n}`;
}

/** `y = 2x + 3`, with the degenerate coefficients written the short way. */
function lineTex(m: Frac, c: number): string {
  const mx = m.eq(new Frac(1)) ? 'x' : m.eq(new Frac(-1)) ? '-x' : `${m.tex()}x`;
  return c === 0 ? `y = ${mx}` : `y = ${mx} ${signed(c)}`;
}

// ---------------------------------------------------------------------------
// 1 · ag-line — the straight line
// ---------------------------------------------------------------------------

/**
 * The slope from two points. The dominant real mistake is inverting the ratio,
 * which is an `operation-swap` — the same tag as summing branches in a
 * probability tree instead of multiplying along one.
 */
const lineSlope: GenTemplate = {
  id: 'ag-line-slope',
  distractorTags: [null, 'operation-swap', 'sign-slip', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ag-line',
  title: 'שיפוע ישר משתי נקודות',
  skill: 'substitution',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const x1 = rng.int(-6, 6);
    const y1 = rng.int(-6, 6);
    const dx = nonZero(rng, difficulty === 'easy' ? 4 : 7);
    const dy = nonZero(rng, difficulty === 'easy' ? 6 : 9);
    const x2 = x1 + dx;
    const y2 = y1 + dy;

    const m = new Frac(dy, dx);
    const inverted = new Frac(dx, dy);        // Δx over Δy
    const flipped = new Frac(-dy, dx);        // subtracted in opposite orders
    const difference = new Frac(dy - dx);     // a difference, not a ratio

    const opts = [m, inverted, flipped, difference];
    return mcq({
      question: `מהו השיפוע של הישר העובר דרך הנקודות $${pt(x1, y1)}$ ו$${pt(x2, y2)}$?`,
      answers: opts.map((f) => `$${f.tex()}$`),
      correct: 0,
      distractorNotes: [
        '',
        `כאן המונה והמכנה התחלפו. השיפוע הוא ההפרש ב$y$ חלקי ההפרש ב$x$, כלומר כמה עולים לכל צעד ימינה, ולא ההפך.`,
        `הסימן הפוך. חשוב לחסר את שתי הנקודות באותו סדר: אם במונה כתוב $y_2 - y_1$ אז במכנה חייב להיות $x_2 - x_1$.`,
        `זהו הפרש ולא יחס. השיפוע מודד קצב, ולכן מחלקים את השינוי ב$y$ בשינוי ב$x$ במקום לחסר ביניהם.`,
      ],
      hint: 'השיפוע הוא כמה $y$ משתנה לכל יחידה אחת של $x$. איזו מהשתיים נמצאת במונה?',
      solution: {
        steps: [
          '**הכלל:** נתונות שתי נקודות ומבוקש השיפוע, ולכן משתמשים בנוסחת השיפוע $m = \\dfrac{y_2 - y_1}{x_2 - x_1}$, שמודדת את השינוי ב$y$ לכל שינוי ב$x$.',
          `מציבים: $m = \\dfrac{${y2} - (${y1})}{${x2} - (${x1})}$.`,
          `$m = \\dfrac{${dy}}{${dx}}$.`,
        ],
        finalAnswer: `$m = ${m.tex()}$`,
        explanation: 'נוסחת השיפוע: $m = \\dfrac{y_2-y_1}{x_2-x_1}$, ושתי החיסורים חייבים להיות באותו סדר.',
      },
    });
  },
};

/**
 * Perpendicularity: the negative RECIPROCAL. Both halves get their own
 * distractor, because a student who takes only the sign and a student who takes
 * only the reciprocal have made two different mistakes.
 */
const linePerpendicular: GenTemplate = {
  id: 'ag-line-perpendicular',
  distractorTags: [null, 'formula-mismatch', 'sign-slip', 'operation-swap'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ag-line',
  title: 'ישר ניצב דרך נקודה',
  skill: 'formula-choice',
  difficulties: ['mid', 'hard'],
  build(rng, difficulty) {
    // A whole-number intercept needs m2 · x0 to be whole, so the point's x is
    // a multiple of the given slope's numerator.
    const mn = rng.int(2, difficulty === 'hard' ? 5 : 4);
    const m1 = new Frac(rng.chance(0.4) ? -mn : mn);
    const k = rng.int(-3, 3);
    const x0 = m1.n * k;
    const y0 = rng.int(-7, 7);
    if (x0 === 0 && y0 === 0) return null;

    const m2 = new Frac(-1).div(m1);
    const c = y0 - m2.mul(new Frac(x0)).value;
    if (!Number.isInteger(c)) return null;

    const parallel = lineTex(m1, y0 - m1.mul(new Frac(x0)).value);
    const signOnly = new Frac(-m1.n, m1.d);
    const reciprocalOnly = new Frac(m1.d, m1.n);

    const cSign = y0 - signOnly.mul(new Frac(x0)).value;
    const cRecip = y0 - reciprocalOnly.mul(new Frac(x0)).value;
    if (!Number.isInteger(cSign) || !Number.isInteger(cRecip)) return null;

    return mcq({
      question: `מצא את משוואת הישר הניצב לישר $${lineTex(m1, rng.int(-5, 5))}$ והעובר דרך הנקודה $${pt(x0, y0)}$.`,
      answers: [
        `$${lineTex(m2, c)}$`,
        `$${parallel}$`,
        `$${lineTex(signOnly, cSign)}$`,
        `$${lineTex(reciprocalOnly, cRecip)}$`,
      ],
      correct: 0,
      distractorNotes: [
        '',
        'זהו ישר מקביל ולא ניצב: השיפוע נשאר זהה. שני ישרים מקבילים כשהשיפועים שווים, וניצבים כשהמכפלה שלהם היא $-1$.',
        `כאן רק הסימן התהפך והמספר נשאר. ניצבות דורשת גם היפוך וגם סימן, כי התנאי הוא $m_1 \\cdot m_2 = -1$.`,
        'כאן רק המספר התהפך והסימן נשאר. מכפלת שני שיפועים חיוביים לעולם אינה שלילית, ולכן חסר המינוס.',
      ],
      hint: 'מה חייבת להיות מכפלת השיפועים של שני ישרים ניצבים? ומה זה אומר על השיפוע השני?',
      solution: {
        steps: [
          '**הכלל:** מבוקש ישר ניצב לישר נתון, ולכן משתמשים בתנאי הניצבות $m_1 \\cdot m_2 = -1$ כדי למצוא את השיפוע החדש, ורק אחר כך מציבים את הנקודה בנוסחת הישר $y - y_1 = m(x - x_1)$.',
          `שיפוע הישר הנתון הוא $m_1 = ${m1.tex()}$, ולכן $m_2 = \\dfrac{-1}{${m1.tex()}} = ${m2.tex()}$.`,
          `מציבים את הנקודה: $y - (${y0}) = ${m2.tex()}(x - (${x0}))$.`,
        ],
        finalAnswer: `$${lineTex(m2, c)}$`,
        explanation: 'ניצבות: $m_1 m_2 = -1$, כלומר השיפוע השני הוא ההופכי בסימן הפוך.',
      },
    });
  },
};

/** Distance between two points. Triples keep the answer whole. */
const lineDistance: GenTemplate = {
  id: 'ag-line-distance',
  wrongAnswerTags: ['exponent-slip', 'operation-swap'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ag-line',
  title: 'מרחק בין שתי נקודות',
  skill: 'substitution',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const [a, b, c] = rng.pick(TRIPLES);
    const x1 = rng.int(-8, 8);
    const y1 = rng.int(-8, 8);
    const dx = rng.chance(0.5) ? a : -a;
    const dy = rng.chance(0.5) ? b : -b;
    const x2 = x1 + dx;
    const y2 = y1 + dy;
    if (difficulty === 'easy' && (x1 < 0 || y1 < 0)) return null;

    return open({
      question: `חשב את המרחק בין הנקודות $${pt(x1, y1)}$ ו$${pt(x2, y2)}$.`,
      expected: { kind: 'value', value: String(c) },
      wrongAnswers: [
        {
          value: String(c * c),
          note: `זהו ריבוע המרחק ולא המרחק. אחרי חיבור הריבועים נשאר להוציא שורש, ומתקבל $${c}$.`,
        },
        {
          value: String(Math.abs(dx) + Math.abs(dy)),
          note: 'כאן ההפרשים חוברו במקום להיכנס לנוסחת פיתגורס. המרחק הישר בין הנקודות קצר מהמסלול שהולך קודם אופקית ואז אנכית.',
        },
      ],
      hint: 'ההפרש האופקי וההפרש האנכי הם שתי הניצבות במשולש ישר זווית. מה המרחק הישר ביניהן?',
      solution: {
        steps: [
          '**הכלל:** מבוקש מרחק בין שתי נקודות במישור, וההפרש האופקי וההפרש האנכי הם ניצבי משולש ישר זווית, ולכן משתמשים בנוסחת המרחק $d = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}$.',
          `ההפרשים: $x_2 - x_1 = ${dx}$ וגם $y_2 - y_1 = ${dy}$.`,
          `$d = \\sqrt{(${dx})^2 + (${dy})^2} = \\sqrt{${a * a} + ${b * b}} = \\sqrt{${a * a + b * b}}$.`,
        ],
        finalAnswer: `$d = ${c}$`,
        explanation: 'נוסחת המרחק היא משפט פיתגורס על ההפרשים בין הקואורדינטות.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 2 · ag-circle — equations and tangents
// ---------------------------------------------------------------------------

/**
 * The centre from the general form. The sign trap is the point: in
 * $(x-a)^2$ the centre coordinate is $+a$, so a student reading the equation
 * literally gets every sign backwards.
 */
const circleCentre: GenTemplate = {
  id: 'ag-circle-centre',
  distractorTags: [null, 'sign-slip', 'sign-slip', 'values-swapped'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ag-circle',
  title: 'מרכז מעגל מהמשוואה הכללית',
  skill: 'substitution',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const a = nonZero(rng, 7);
    const b = nonZero(rng, 7);
    const r = rng.int(2, 9);
    if (a === b) return null;

    // General form: x² + y² + Dx + Ey + F = 0
    const D = -2 * a;
    const E = -2 * b;
    const F = a * a + b * b - r * r;

    const equation =
      difficulty === 'easy'
        ? `(x ${signed(-a)})^2 + (y ${signed(-b)})^2 = ${r * r}`
        : `x^2 + y^2 ${signed(D)}x ${signed(E)}y ${signed(F)} = 0`;

    return mcq({
      question: `מהו מרכז המעגל $${equation}$?`,
      answers: [`$${pt(a, b)}$`, `$${pt(-a, -b)}$`, `$${pt(a, -b)}$`, `$${pt(b, a)}$`],
      correct: 0,
      distractorNotes: [
        '',
        `שני הסימנים הפוכים. בכתיב $(x - a)^2$ הסימן במשוואה הוא מינוס, ולכן המרכז הוא $${a}$ ולא $${-a}$.`,
        `הסימן של שיעור ה$y$ הפוך. אותו כלל חל על שני הצירים בנפרד.`,
        'הקואורדינטות התחלפו ביניהן. השיעור הראשון תמיד מגיע מהביטוי שבו מופיע $x$.',
      ],
      hint: 'בכתיב $(x - a)^2 + (y - b)^2 = r^2$ המרכז הוא $(a, b)$. שים לב לסימן שבתוך הסוגריים.',
      solution: {
        steps: [
          difficulty === 'easy'
            ? '**הכלל:** המשוואה נתונה בכתיב הקנוני של מעגל, ולכן קוראים ממנה ישירות את המרכז לפי $(x-a)^2 + (y-b)^2 = r^2$, שבו המרכז הוא $(a, b)$ והסימנים בתוך הסוגריים הפוכים לשיעורי המרכז.'
            : '**הכלל:** המשוואה נתונה בצורה הכללית ולא בכתיב הקנוני, ולכן משלימים ריבוע לכל משתנה בנפרד כדי להגיע לצורה $(x-a)^2 + (y-b)^2 = r^2$, שממנה קוראים את המרכז.',
          difficulty === 'easy'
            ? `מהסוגריים: $x ${signed(-a)}$ נותן שיעור $x$ של המרכז, ו$y ${signed(-b)}$ נותן את שיעור ה$y$.`
            : `משלימים ריבוע: מקדם $x$ הוא $${D}$ ולכן חצי ממנו הוא $${D / 2}$, ומקדם $y$ הוא $${E}$ ולכן חצי ממנו הוא $${E / 2}$.`,
          `שיעורי המרכז הם ההופכיים בסימן לאותם חצאי מקדמים.`,
        ],
        finalAnswer: `מרכז $${pt(a, b)}$`,
        explanation: 'מעגל: $(x-a)^2+(y-b)^2=r^2$ עם מרכז $(a,b)$ ורדיוס $r$.',
      },
    });
  },
};

/** The radius, where the trap is answering `r²`. */
const circleRadius: GenTemplate = {
  id: 'ag-circle-radius',
  distractorTags: [null, 'exponent-slip', 'dropped-factor', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ag-circle',
  title: 'רדיוס מעגל מהצורה הכללית',
  skill: 'equation-solving',
  difficulties: ['mid', 'hard'],
  build(rng) {
    const a = nonZero(rng, 6);
    const b = nonZero(rng, 6);
    const r = rng.int(2, 9);
    const D = -2 * a;
    const E = -2 * b;
    const F = a * a + b * b - r * r;
    if (F === 0) return null;

    const squared = r * r;
    const halfSum = a * a + b * b;                // stopped before subtracting F
    const fromF = Math.abs(F);                    // read F as the radius
    if (new Set([r, squared, halfSum, fromF]).size !== 4) return null;

    return mcq({
      question: `מהו הרדיוס של המעגל $x^2 + y^2 ${signed(D)}x ${signed(E)}y ${signed(F)} = 0$?`,
      answers: [`$${r}$`, `$${squared}$`, `$${halfSum}$`, `$${fromF}$`],
      correct: 0,
      distractorNotes: [
        '',
        `זהו $r^2$ ולא $r$. אחרי השלמת הריבוע האגף הימני שווה ל$r^2$, ולכן נשאר להוציא שורש.`,
        `כאן נעצרנו אחרי חיבור שני המשלימים, בלי לקזז את האיבר החופשי $${F}$ שכבר היה במשוואה.`,
        'זהו האיבר החופשי במשוואה כמו שהוא. הוא אינו הרדיוס ואף לא ריבועו, אלא רק אחד המרכיבים בחישוב.',
      ],
      hint: 'השלם ריבוע לשני המשתנים. מה נשאר באגף ימין, ומה היחס בינו לבין הרדיוס?',
      solution: {
        steps: [
          '**הכלל:** המשוואה נתונה בצורה הכללית ומבוקש הרדיוס, ולכן משלימים ריבוע לשני המשתנים כדי להגיע לצורה $(x-a)^2 + (y-b)^2 = r^2$, שבה האגף הימני הוא ריבוע הרדיוס ולא הרדיוס עצמו.',
          `משלימים: $(x ${signed(-a)})^2 + (y ${signed(-b)})^2 = ${a * a} + ${b * b} - (${F})$.`,
          `האגף הימני יוצא $${squared}$, וזהו $r^2$.`,
        ],
        finalAnswer: `$r = ${r}$`,
        explanation: 'אחרי השלמת ריבוע האגף הימני הוא $r^2$; הרדיוס הוא השורש שלו.',
      },
    });
  },
};

/** The tangent at a point on the circle — perpendicular to the radius. */
const circleTangent: GenTemplate = {
  id: 'ag-circle-tangent',
  distractorTags: [null, 'formula-mismatch', 'sign-slip', 'operation-swap'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ag-circle',
  title: 'משיק למעגל בנקודה שעליו',
  skill: 'formula-choice',
  difficulties: ['hard'],
  build(rng) {
    const [tdx, tdy] = rng.pick(TRIPLES.slice(0, 6));
    const dx = rng.chance(0.5) ? tdx : -tdx;
    const dy = rng.chance(0.5) ? tdy : -tdy;

    /**
     * The point of tangency sits at a multiple of `lcm(|dx|, |dy|)`.
     *
     * All four options are lines whose intercept must come out whole, and each
     * one divides by a different one of `dx`/`dy`. Drawing the centre freely
     * satisfied those four constraints only 59% of the time, so `generate`
     * returned null for 41% of seeds and the supply silently thinned. Choosing
     * the point on the common multiple makes every intercept whole by
     * construction instead of by luck.
     */
    const g = (x: number, y: number): number => (y ? g(y, x % y) : Math.abs(x));
    const lcm = Math.abs(dx * dy) / g(Math.abs(dx), Math.abs(dy));
    const px = lcm * rng.int(-2, 2);
    const py = rng.int(-6, 6);
    const a = px - dx;
    const b = py - dy;

    // Radius slope dy/dx; the tangent is its negative reciprocal.
    const mRad = new Frac(dy, dx);
    const mTan = new Frac(-1).div(mRad);
    const c = py - mTan.mul(new Frac(px)).value;
    if (!Number.isInteger(c)) return null;

    const cRad = py - mRad.mul(new Frac(px)).value;
    const mSign = new Frac(-mRad.n, mRad.d);
    const cSign = py - mSign.mul(new Frac(px)).value;
    const mRecip = new Frac(mRad.d, mRad.n);
    const cRecip = py - mRecip.mul(new Frac(px)).value;
    if (![cRad, cSign, cRecip].every(Number.isInteger)) return null;

    return mcq({
      question: `נתון מעגל שמרכזו $${pt(a, b)}$. מצא את משוואת המשיק למעגל בנקודה $${pt(px, py)}$ שעליו.`,
      answers: [
        `$${lineTex(mTan, c)}$`,
        `$${lineTex(mRad, cRad)}$`,
        `$${lineTex(mSign, cSign)}$`,
        `$${lineTex(mRecip, cRecip)}$`,
      ],
      correct: 0,
      distractorNotes: [
        '',
        'זהו הישר שעובר דרך המרכז ודרך נקודת ההשקה, כלומר הרדיוס עצמו. המשיק ניצב לו ולכן שיפועו שונה.',
        'רק הסימן של שיפוע הרדיוס התהפך. ניצבות דורשת גם היפוך המספר וגם שינוי הסימן.',
        'רק המספר התהפך והסימן נשאר. בלי המינוס מכפלת השיפועים אינה יוצאת $-1$.',
      ],
      hint: 'מה הקשר בין המשיק לבין הרדיוס שמגיע לנקודת ההשקה? חשב קודם את שיפוע הרדיוס.',
      solution: {
        steps: [
          '**הכלל:** מבוקש משיק בנקודה שעל המעגל, והמשיק תמיד ניצב לרדיוס בנקודת ההשקה, ולכן מחשבים תחילה את שיפוע הרדיוס ואז מפעילים עליו את תנאי הניצבות $m_1 m_2 = -1$.',
          `שיפוע הרדיוס מהמרכז אל נקודת ההשקה: $m = \\dfrac{${py} - (${b})}{${px} - (${a})} = ${mRad.tex()}$.`,
          `לכן שיפוע המשיק הוא $${mTan.tex()}$, ומציבים את נקודת ההשקה בנוסחה $y - y_1 = m(x - x_1)$.`,
        ],
        finalAnswer: `$${lineTex(mTan, c)}$`,
        explanation: 'משיק למעגל ניצב לרדיוס בנקודת ההשקה.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 3 · ag-parabola
// ---------------------------------------------------------------------------

/**
 * `2p` values that keep both `p` and `p/2` whole — every multiple of 4.
 *
 * The first version of this file stopped at 32 and the gate rejected it: eight
 * values is not enough parameter space for a template whose only other freedoms
 * are a sign and an axis.
 */
const TWO_P = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60] as const;

const parabolaFocus: GenTemplate = {
  id: 'ag-parabola-focus',
  distractorTags: [null, 'dropped-factor', 'values-swapped', 'sign-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ag-parabola',
  title: 'מוקד הפרבולה',
  skill: 'substitution',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const twoP = rng.pick(TWO_P);
    const p = twoP / 2;
    const half = p / 2;
    const negative = difficulty !== 'easy' && rng.chance(0.4);
    const s = negative ? -1 : 1;
    // Both orientations, so the "focus sits on the OTHER axis" distractor is a
    // real trap rather than something a student rules out by habit.
    const vertical = rng.chance(0.5);

    const equation = vertical
      ? `x^2 = ${negative ? '-' : ''}${twoP}y`
      : `y^2 = ${negative ? '-' : ''}${twoP}x`;
    const on = (v: number) => (vertical ? pt(0, v) : pt(v, 0));
    const off = (v: number) => (vertical ? pt(v, 0) : pt(0, v));

    return mcq({
      question: `מהו המוקד של הפרבולה $${equation}$?`,
      answers: [
        `$${on(s * half)}$`,
        `$${on(s * p)}$`,
        `$${off(s * half)}$`,
        `$${on(-s * half)}$`,
      ],
      correct: 0,
      distractorNotes: [
        '',
        `כאן נלקח $p$ עצמו ולא $\\dfrac{p}{2}$. מהמשוואה מקבלים $2p = ${twoP}$ ולכן $p = ${p}$, והמוקד יושב במרחק $\\dfrac{p}{2} = ${half}$ מהקודקוד.`,
        `הקואורדינטות התחלפו. כאן המשתנה המרובע הוא $${vertical ? 'x' : 'y'}$, ולכן ציר הסימטריה הוא ציר ה$${vertical ? 'y' : 'x'}$ והמוקד יושב עליו.`,
        'הסימן הפוך. המוקד נמצא תמיד בתוך הפרבולה, כלומר בכיוון שאליו היא נפתחת, וסימן המקדם הוא שקובע את הכיוון הזה.',
      ],
      hint: `מהמשוואה אפשר לקרוא את $2p$ ישירות. המוקד רחוק מהקודקוד $\\dfrac{p}{2}$, לא $p$.`,
      solution: {
        steps: [
          `**הכלל:** המשוואה היא מהצורה $${vertical ? 'x^2 = 2py' : 'y^2 = 2px'}$, כלומר פרבולה שקודקודה בראשית וציר הסימטריה שלה הוא ציר ה$${vertical ? 'y' : 'x'}$, ולכן המוקד נמצא על אותו ציר במרחק $\\dfrac{p}{2}$ מהקודקוד.`,
          `משווים מקדמים: $2p = ${negative ? '-' : ''}${twoP}$ ולכן $p = ${s * p}$.`,
          `המרחק מהקודקוד הוא $\\dfrac{p}{2} = ${s * half}$, בכיוון שאליו הפרבולה נפתחת.`,
        ],
        finalAnswer: `מוקד $${on(s * half)}$`,
        explanation: 'לפרבולה $y^2 = 2px$: מוקד $\\left(\\dfrac{p}{2}, 0\\right)$ ומדריך $x = -\\dfrac{p}{2}$.',
      },
    });
  },
};

const parabolaDirectrix: GenTemplate = {
  id: 'ag-parabola-directrix',
  distractorTags: [null, 'sign-slip', 'dropped-factor', 'values-swapped'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ag-parabola',
  title: 'מדריך הפרבולה',
  skill: 'formula-choice',
  difficulties: ['mid', 'hard'],
  build(rng) {
    const twoP = rng.pick(TWO_P);
    const p = twoP / 2;
    const half = p / 2;
    const vertical = rng.chance(0.5); // x² = 2py, i.e. opens up/down
    const negative = rng.chance(0.4);
    const s = negative ? -1 : 1;

    const equation = vertical
      ? `x^2 = ${negative ? '-' : ''}${twoP}y`
      : `y^2 = ${negative ? '-' : ''}${twoP}x`;
    const axis = vertical ? 'y' : 'x';
    const other = vertical ? 'x' : 'y';

    return mcq({
      question: `מהו המדריך של הפרבולה $${equation}$?`,
      answers: [
        `$${axis} = ${-s * half}$`,
        `$${axis} = ${s * half}$`,
        `$${axis} = ${-s * p}$`,
        `$${other} = ${-s * half}$`,
      ],
      correct: 0,
      distractorNotes: [
        '',
        'הסימן הפוך. המדריך והמוקד נמצאים בצדדים הפוכים של הקודקוד, ולכן אם המוקד חיובי המדריך שלילי.',
        `כאן נלקח $p$ במקום $\\dfrac{p}{2}$. מהמשוואה $2p = ${twoP}$ ולכן $p = ${p}$, והמרחק אל המדריך הוא מחצית מכך.`,
        `זהו ישר בכיוון הלא נכון. הפרבולה הזו פתוחה לאורך ציר ה$${axis}$, ולכן המדריך ניצב לו ומשוואתו נותנת ערך ל$${axis}$.`,
      ],
      hint: 'המוקד והמדריך נמצאים במרחק שווה מהקודקוד, ובצדדים הפוכים שלו.',
      solution: {
        steps: [
          `**הכלל:** לכל נקודה על פרבולה המרחק מהמוקד שווה למרחק מהמדריך, ולכן המדריך נמצא בצד ההפוך למוקד ובאותו מרחק מהקודקוד, כלומר $${axis} = -\\dfrac{p}{2}$ עבור פרבולה מהצורה הזו.`,
          `משווים מקדמים: $2p = ${negative ? '-' : ''}${twoP}$ ולכן $p = ${s * p}$.`,
          `מחצית מכך היא $${s * half}$, והמדריך נמצא בצד ההפוך.`,
        ],
        finalAnswer: `מדריך $${axis} = ${-s * half}$`,
        explanation: 'המוקד והמדריך סימטריים ביחס לקודקוד, במרחק $\\dfrac{p}{2}$ כל אחד.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 4 · ag-ellipse
// ---------------------------------------------------------------------------

/**
 * `c² = a² - b²`. The distractor that matters is `a² + b²`, which is the
 * HYPERBOLA relation — a `formula-mismatch` in the exact sense the tag means:
 * a correct formula applied to the wrong shape.
 */
const ellipseFoci: GenTemplate = {
  id: 'ag-ellipse-foci',
  distractorTags: [null, 'formula-mismatch', 'values-swapped', 'dropped-factor'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ag-ellipse',
  title: 'מוקדי האליפסה',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng) {
    const [a2, b2, c] = rng.pick(ELLIPSES);
    const a = Math.sqrt(a2);
    if (!Number.isInteger(a) || c === a) return null;

    // The hyperbola-relation distractor is shown as a SURD, not rounded.
    // Requiring a²+b² to be a perfect square too was the first version of this
    // template, and it rejected every draw — no such pair exists in the table.
    // A student who uses the wrong relation really does land on √(a²+b²).
    const sumTex = `\\sqrt{${a2 + b2}}`;
    // Both orientations. The major axis is wherever the LARGER denominator is,
    // which is the reading skill the "wrong axis" distractor tests — and with
    // only the horizontal form the student never has to perform it.
    const vertical = rng.chance(0.5);
    const equation = vertical
      ? `\\dfrac{x^2}{${b2}} + \\dfrac{y^2}{${a2}} = 1`
      : `\\dfrac{x^2}{${a2}} + \\dfrac{y^2}{${b2}} = 1`;
    const major = vertical ? 'y' : 'x';
    const minor = vertical ? 'x' : 'y';
    const on = (v: string) => (vertical ? `(0, \\pm ${v})` : `(\\pm ${v}, 0)`);
    const off = (v: string) => (vertical ? `(\\pm ${v}, 0)` : `(0, \\pm ${v})`);

    return mcq({
      question: `מהם המוקדים של האליפסה $${equation}$?`,
      answers: [`$${on(String(c))}$`, `$${on(sumTex)}$`, `$${off(String(c))}$`, `$${on(String(a))}$`],
      correct: 0,
      distractorNotes: [
        '',
        `כאן חוברו $a^2$ ו$b^2$ במקום להיחסר. חיבור מתאים להיפרבולה, ובאליפסה המוקדים נמצאים בתוך העקום, ולכן $c^2 = a^2 - b^2$ והמרחק יוצא קטן מ$a$ ולא גדול ממנו.`,
        `המוקדים הונחו על הציר הלא נכון. המכנה הגדול יותר, $${a2}$, יושב מתחת ל$${major}^2$, ולכן הציר הראשי הוא ציר ה$${major}$ והמוקדים עליו ולא על ציר ה$${minor}$.`,
        `זהו $a$, חצי הציר הראשי, ולא $c$. $a$ הוא המרחק אל הקודקוד ולא אל המוקד.`,
      ],
      hint: 'המוקדים של אליפסה נמצאים תמיד בתוכה, קרוב יותר למרכז מהקודקודים. איזו פעולה בין $a^2$ ל$b^2$ מבטיחה את זה?',
      solution: {
        steps: [
          '**הכלל:** המשוואה היא של אליפסה שמרכזה בראשית, ולכן המוקדים יושבים על הציר שמתחתיו המכנה גדול יותר, ומרחקם מהמרכז מקיים $c^2 = a^2 - b^2$.',
          `המכנה הגדול הוא $${a2}$ והוא יושב מתחת ל$${major}^2$, ולכן הציר הראשי הוא ציר ה$${major}$ ומתקיים $a^2 = ${a2}$ וכן $b^2 = ${b2}$.`,
          `$c^2 = ${a2} - ${b2} = ${c * c}$, ומוציאים שורש.`,
        ],
        finalAnswer: `מוקדים $${on(String(c))}$`,
        explanation: 'אליפסה: $c^2 = a^2 - b^2$; היפרבולה: $c^2 = a^2 + b^2$.',
      },
    });
  },
};

const ellipseEccentricity: GenTemplate = {
  id: 'ag-ellipse-eccentricity',
  distractorTags: [null, 'operation-swap', 'formula-mismatch', 'values-swapped'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ag-ellipse',
  title: 'אקסצנטריות של אליפסה',
  skill: 'substitution',
  difficulties: ['mid', 'hard'],
  build(rng) {
    const [a2, b2, c] = rng.pick(ELLIPSES);
    const a = Math.sqrt(a2);
    if (!Number.isInteger(a)) return null;
    const b = Math.sqrt(b2);

    const e = new Frac(c, a);
    const inverted = new Frac(a, c);
    const overB = Number.isInteger(b) ? new Frac(c, b) : null;
    const bOverA = Number.isInteger(b) ? new Frac(b, a) : null;
    if (!overB || !bOverA) return null;

    const opts = [e, inverted, overB, bOverA];
    if (new Set(opts.map((f) => f.tex())).size !== 4) return null;

    // Both orientations — the eccentricity is the same either way, but the
    // student has to identify which denominator is `a²` before they can use it.
    const vertical = rng.chance(0.5);
    const equation = vertical
      ? `\\dfrac{x^2}{${b2}} + \\dfrac{y^2}{${a2}} = 1`
      : `\\dfrac{x^2}{${a2}} + \\dfrac{y^2}{${b2}} = 1`;

    return mcq({
      question: `מהי האקסצנטריות של האליפסה $${equation}$?`,
      answers: opts.map((f) => `$${f.tex()}$`),
      correct: 0,
      distractorNotes: [
        '',
        `המונה והמכנה התחלפו. אקסצנטריות של אליפסה תמיד קטנה מ-$1$, ותוצאה גדולה מ-$1$ היא סימן מיידי שהיחס הפוך.`,
        `כאן החלוקה היא ב$b$ ולא ב$a$. האקסצנטריות משווה את מרחק המוקד לחצי הציר הראשי, שהוא $a$.`,
        `זהו היחס בין שני החצאים, $\\dfrac{b}{a}$, ולא בין המוקד לציר הראשי. הוא מודד כמה האליפסה שטוחה, אבל אינו האקסצנטריות.`,
      ],
      hint: 'האקסצנטריות משווה את מרחק המוקד מהמרכז לחצי הציר הראשי. מי משניהם גדול יותר?',
      solution: {
        steps: [
          '**הכלל:** מבוקשת האקסצנטריות, שמודדת כמה האליפסה רחוקה ממעגל, ולכן משתמשים ביחס $e = \\dfrac{c}{a}$ בין מרחק המוקד מהמרכז לבין חצי הציר הראשי, ומחשבים תחילה את $c$ לפי $c^2 = a^2 - b^2$.',
          `$c^2 = ${a2} - ${b2} = ${c * c}$ ולכן $c = ${c}$, וכן $a = \\sqrt{${a2}} = ${a}$.`,
          `מציבים: $e = \\dfrac{${c}}{${a}}$.`,
        ],
        finalAnswer: `$e = ${e.tex()}$`,
        explanation: 'אקסצנטריות: $e = \\dfrac{c}{a}$, ולאליפסה תמיד $0 \\le e < 1$.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 5 · ag-loci
// ---------------------------------------------------------------------------

/** `(x - 3)^2` / `x^2` — never the `(x + 0)^2` a naive template would emit. */
function shifted(v: 'x' | 'y', k: number): string {
  return k === 0 ? `${v}^2` : `(${v} ${signed(-k)})^2`;
}

const lociCircle: GenTemplate = {
  id: 'ag-loci-circle',
  distractorTags: [null, 'exponent-slip', 'sign-slip', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ag-loci',
  title: 'מקום גאומטרי של מרחק קבוע',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const d = rng.int(2, 12);
    // The centre is NEVER the origin. With `a = b = 0` the "signs flipped"
    // distractor is character-identical to the correct answer, and `mcq`
    // rejected every easy draw — the gate found this before a student could.
    // On `easy` it sits on an axis, which keeps the equation short.
    const onAxis = difficulty === 'easy';
    const a = onAxis && rng.chance(0.5) ? 0 : nonZero(rng, 6);
    const b = onAxis && a !== 0 ? 0 : nonZero(rng, 6);

    const lhs = `${shifted('x', a)} + ${shifted('y', b)}`;
    const flipped = `${shifted('x', -a)} + ${shifted('y', -b)}`;
    const hyperbola = `${shifted('x', a)} - ${shifted('y', b)}`;

    const answers = [
      `$${lhs} = ${d * d}$`,
      `$${lhs} = ${d}$`,
      `$${flipped} = ${d * d}$`,
      `$${hyperbola} = ${d * d}$`,
    ];
    if (new Set(answers).size !== 4) return null;

    return mcq({
      question: `מהו המקום הגאומטרי של כל הנקודות במישור שמרחקן מהנקודה $${pt(a, b)}$ שווה ל-$${d}$?`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        `באגף ימין נכתב המרחק ולא ריבועו. נוסחת המרחק כוללת שורש, וכשמעלים את שני האגפים בריבוע האגף הימני הופך ל-$${d}^2 = ${d * d}$.`,
        `הסימנים בתוך הסוגריים הפוכים. במעגל שמרכזו $${pt(a, b)}$ הביטוי הוא $${shifted('x', a)}$, כלומר הסימן במשוואה הפוך לשיעור המרכז.`,
        'בין שני הריבועים יש כאן חיסור. חיסור מתאר היפרבולה; המרחק לפי פיתגורס מחבר את שני הריבועים, ולכן מעגל נכתב תמיד עם סימן חיבור.',
      ],
      hint: 'קבוצת הנקודות שמרחקן מנקודה קבועה שווה למספר קבוע היא בדיוק ההגדרה של צורה אחת מוכרת.',
      solution: {
        steps: [
          '**הכלל:** מבוקשת קבוצת כל הנקודות שמרחקן מנקודה קבועה שווה למספר קבוע, וזו בדיוק ההגדרה של מעגל, ולכן כותבים את נוסחת המרחק ומעלים את שני האגפים בריבוע כדי להיפטר מהשורש.',
          `תנאי המרחק: $\\sqrt{${lhs}} = ${d}$.`,
          'מעלים את שני האגפים בריבוע.',
        ],
        finalAnswer: `מעגל $${lhs} = ${d * d}$`,
        explanation: 'מקום גאומטרי של מרחק קבוע מנקודה הוא מעגל שמרכזו באותה נקודה.',
      },
    });
  },
};

const lociBisector: GenTemplate = {
  id: 'ag-loci-bisector',
  distractorTags: [null, 'values-swapped', 'formula-mismatch', 'sign-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ag-loci',
  title: 'מקום גאומטרי של מרחק שווה משתי נקודות',
  skill: 'equation-solving',
  difficulties: ['mid', 'hard'],
  build(rng) {
    // Two points symmetric about a horizontal or vertical line, so the
    // bisector is a clean equation the student can recognise.
    const horizontal = rng.chance(0.5);
    const k = nonZero(rng, 7);
    const mid = rng.int(-5, 5);
    const p1 = horizontal ? [mid - k, 0] : [0, mid - k];
    const p2 = horizontal ? [mid + k, 0] : [0, mid + k];
    const axis = horizontal ? 'x' : 'y';
    const otherAxis = horizontal ? 'y' : 'x';

    const answers = [
      `$${axis} = ${mid}$`,
      `$${otherAxis} = ${mid}$`,
      `$${axis} = ${mid + k}$`,
      `$${axis} = ${-mid}$`,
    ];
    if (new Set(answers).size !== 4) return null;

    return mcq({
      question: `מהו המקום הגאומטרי של כל הנקודות שמרחקן מ$${pt(p1[0], p1[1])}$ שווה למרחקן מ$${pt(p2[0], p2[1])}$?`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        `הציר התחלף. שתי הנקודות נבדלות זו מזו בשיעור ה$${axis}$ שלהן, ולכן דווקא הוא זה שנקבע, וה$${otherAxis}$ נשאר חופשי.`,
        `זהו שיעור אחת הנקודות עצמן ולא האמצע ביניהן. הישר המבוקש עובר במרחק שווה משתיהן, כלומר באמצע.`,
        'הסימן הפוך. אמצע הקטע הוא ממוצע שני השיעורים, ולא ההופכי שלו בסימן.',
      ],
      hint: 'נקודה שמרחקה שווה משתי נקודות נמצאת על אנך אמצעי לקטע שביניהן. איפה עובר האנך הזה?',
      solution: {
        steps: [
          '**הכלל:** מבוקשות הנקודות שמרחקן משתי נקודות נתונות שווה, וזהו בדיוק האנך האמצעי לקטע שמחבר אותן, ולכן משווים את שתי נוסחאות המרחק ומפשטים.',
          `משווים: $\\sqrt{(x - (${p1[0]}))^2 + (y - (${p1[1]}))^2} = \\sqrt{(x - (${p2[0]}))^2 + (y - (${p2[1]}))^2}$.`,
          `מעלים בריבוע, והאיברים הריבועיים מצטמצמים ונשאר ${axis === 'x' ? 'ישר אנכי' : 'ישר אופקי'} שעובר באמצע הקטע.`,
        ],
        finalAnswer: `$${axis} = ${mid}$`,
        explanation: 'מקום גאומטרי של מרחק שווה משתי נקודות הוא האנך האמצעי לקטע שביניהן.',
      },
    });
  },
};

export const GEOMETRY_TEMPLATES: GenTemplate[] = [
  lineSlope,
  linePerpendicular,
  lineDistance,
  circleCentre,
  circleRadius,
  circleTangent,
  parabolaFocus,
  parabolaDirectrix,
  ellipseFoci,
  ellipseEccentricity,
  lociCircle,
  lociBisector,
];
