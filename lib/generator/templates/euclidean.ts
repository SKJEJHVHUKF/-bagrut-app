/**
 * generator/templates/euclidean.ts — parameterised repair questions for
 * גיאומטריה אוקלידית.
 *
 * Same authored-content contract as the other families (see ./sequences), plus
 * the one thing unique to this topic: most questions carry a SKETCH.
 *
 * ============================================================
 * THE FIGURE IS COMPUTED, NOT DRAWN
 * ============================================================
 * A ```geo fence is validated by `lib/geo-figure.validateGeo` as a geometric
 * MODEL, not as a picture: length labels must share one scale, segments marked
 * parallel must be parallel, a point listed on a circle must lie on it, and an
 * angle labelled `50°` must measure 50°. Authored figures satisfy that because
 * a human placed the points; a generated figure has to satisfy it for EVERY
 * draw, which rules out hand-placed coordinates entirely.
 *
 * So every figure here is built the other way round: the parameters come first,
 * the coordinates are derived from them, and the drawing is therefore correct
 * by construction rather than by inspection. Place `A` at the origin, run `AB`
 * along the x-axis at its true length, run `AC` at a fixed angle at its true
 * length, and a label of `4` on `AD` sits on a segment of length exactly 4 — one
 * scale, no drift, no possibility of the sketch and the numbers disagreeing.
 *
 * `verify-generator` runs the real validator over every generated fence, so a
 * parameterisation that would break the geometry fails the gate rather than
 * showing a student a figure that lies.
 *
 * ============================================================
 * WHAT IS DELIBERATELY NOT HERE
 * ============================================================
 * `eg-method` (how to write a proof) and `eg-mixed` (full bagrut questions)
 * have no templates and fall back to the authored bank. Half of `eg-method` is
 * `expected: manual` by design — the thing being taught is the WRITING of a
 * justification, which a single-answer generated item cannot assess without
 * becoming a different exercise. Same reasoning as `ar-practice`/`pr-practice`.
 */

import { Frac } from '../rng';
import type { GenTemplate } from '../types';
import { mcq, open } from './shared';

const TOPIC = 'גיאומטריה אוקלידית';
const SUBJECT = 'math5';

// ---------------------------------------------------------------------------
// Figure helpers — coordinates derived from the question's own numbers
// ---------------------------------------------------------------------------

type Pt = [number, number];

const round = (p: Pt): Pt => [Number(p[0].toFixed(3)), Number(p[1].toFixed(3))];

/** A point at distance `r` from the origin, `deg` degrees above the x-axis. */
function polar(r: number, deg: number): Pt {
  const a = (deg * Math.PI) / 180;
  return round([r * Math.cos(a), r * Math.sin(a)]);
}

/** `from` + t·(`to` − `from`). */
function along(from: Pt, to: Pt, t: number): Pt {
  return round([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]);
}

/** Wrap a spec as the fenced block MathText renders. */
function fence(spec: object): string {
  return '```geo\n' + JSON.stringify(spec) + '\n```';
}

// ---------------------------------------------------------------------------
// 1 · eg-congruence — the congruence criteria
// ---------------------------------------------------------------------------

/**
 * Which criterion the GIVENS support. Text-only on purpose: the question is
 * about reading three givens and naming the theorem, and a sketch would let a
 * student answer from the picture instead of from the givens.
 */
const CRITERIA = [
  {
    id: 'sas',
    name: 'צ.ז.צ',
    givens: ([a, b, c, d, e, f]: readonly string[]) =>
      `$${a}${b} = ${d}${e}$, $\\angle ${a} = \\angle ${d}$ וגם $${a}${c} = ${d}${f}$`,
    why: 'שתי צלעות והזווית שביניהן',
  },
  {
    id: 'asa',
    name: 'ז.צ.ז',
    // ז.צ.ז names only two vertices per triangle, so `c` and `f` go unused —
    // the parameter is one destructured array so all three signatures match.
    givens: ([a, b, , d, e]: readonly string[]) =>
      `$\\angle ${a} = \\angle ${d}$, $${a}${b} = ${d}${e}$ וגם $\\angle ${b} = \\angle ${e}$`,
    why: 'שתי זוויות והצלע שביניהן',
  },
  {
    id: 'sss',
    name: 'צ.צ.צ',
    givens: ([a, b, c, d, e, f]: readonly string[]) =>
      `$${a}${b} = ${d}${e}$, $${b}${c} = ${e}${f}$ וגם $${a}${c} = ${d}${f}$`,
    why: 'שלוש הצלעות',
  },
] as const;

/**
 * Vertex namings. This is the template's main source of variety — the maths has
 * only three outcomes — so the list is long on purpose: four sets gave twelve
 * distinct questions in sixty seeds and the gate rejected it.
 */
const NAME_SETS: [string, string, string, string, string, string][] = [
  ['A', 'B', 'C', 'D', 'E', 'F'],
  ['A', 'B', 'C', 'K', 'L', 'M'],
  ['P', 'Q', 'R', 'X', 'Y', 'Z'],
  ['A', 'B', 'C', 'A1', 'B1', 'C1'],
  ['K', 'L', 'M', 'P', 'Q', 'R'],
  ['A', 'B', 'D', 'C', 'E', 'F'],
  ['M', 'N', 'P', 'X', 'Y', 'Z'],
  ['A', 'C', 'E', 'B', 'D', 'F'],
  ['P', 'Q', 'S', 'K', 'L', 'N'],
  ['D', 'E', 'F', 'D1', 'E1', 'F1'],
];

const congruenceCriterion: GenTemplate = {
  id: 'eg-congruence-criterion',
  distractorTags: [null, 'formula-mismatch', 'formula-mismatch', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'eg-congruence',
  title: 'לפי איזה משפט חפיפה',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng) {
    const names = rng.pick(NAME_SETS);
    const [a, b, c, d, e, f] = names;
    const right = rng.pick(CRITERIA);
    const others = CRITERIA.filter((x) => x.id !== right.id);

    // "ז.ז.ז" is not a congruence criterion at all — equal angles give
    // SIMILARITY, not congruence. It is the single most useful wrong option in
    // the topic, so it is always on the list.
    const answers = [right.name, ...others.map((o) => o.name), 'ז.ז.ז'];
    if (new Set(answers).size !== 4) return null;

    return mcq({
      question: `במשולשים $\\triangle ${a}${b}${c}$ ו$\\triangle ${d}${e}${f}$ נתון: ${right.givens(names)}. לפי איזה משפט המשולשים חופפים?`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        `הנתונים כאן הם ${right.why}, ולא ${others[0].why}. לפני שבוחרים משפט, בדוק מה בדיוק נתון ובאיזה סדר.`,
        `הנתונים כאן הם ${right.why}, ולא ${others[1].why}. שים לב מה נתון ומה רק נראה נכון בשרטוט.`,
        'שוויון שלוש זוויות אינו משפט חפיפה כלל, אלא משפט דמיון. שני משולשים יכולים להיות בעלי אותן זוויות בדיוק ובכל זאת בגדלים שונים לגמרי.',
      ],
      hint: 'ספור בנתונים כמה צלעות וכמה זוויות מופיעות, ובאיזה סדר הן מסודרות סביב המשולש.',
      solution: {
        steps: [
          '**הכלל:** מבוקש משפט החפיפה המתאים, ולכן קוראים את הנתונים לפי הסדר שבו הם מסודרים במשולש — צלע, זווית או צלע — ומתאימים אותם לאחד משלושת משפטי החפיפה.',
          `הנתונים כאן הם ${right.why}.`,
          'זה בדיוק המבנה שמשפט החפיפה המתאים דורש.',
        ],
        finalAnswer: right.name,
        explanation: 'משפטי החפיפה הם צ.ז.צ, ז.צ.ז, צ.צ.צ (וכן צ.צ.ז בתנאים מסוימים). שוויון שלוש זוויות נותן דמיון בלבד.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 2 · eg-similarity — ratios, and the square that students forget
// ---------------------------------------------------------------------------

/**
 * The area of similar figures scales as `k²`. Answering `k` is the single most
 * common mistake in the sub-topic, and it is an `exponent-slip` — the same tag
 * as putting the wrong power on `q` in a geometric sequence.
 */
const similarityAreaRatio: GenTemplate = {
  id: 'eg-similarity-area-ratio',
  distractorTags: [null, 'exponent-slip', 'exponent-slip', 'values-swapped'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'eg-similarity',
  title: 'יחס שטחים במשולשים דומים',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const m = rng.int(2, difficulty === 'easy' ? 7 : 9);
    const n = rng.int(m + 1, difficulty === 'easy' ? 10 : 13);
    if (new Frac(m, n).n !== m) return null; // keep the ratio in lowest terms

    /**
     * Area or perimeter. Two reasons, and the second is the important one:
     * the maths alone has too few outcomes for the gate's variety floor, AND
     * perimeter-vs-area is precisely the confusion this sub-topic repairs — a
     * student who always squares is as wrong as one who never does.
     *
     * The option ORDER is the same for both variants, which is what keeps
     * `distractorTags` (a positional contract) honest: index 1 is always the
     * wrong power, index 2 always the cube, index 3 always the flipped ratio.
     */
    const area = rng.chance(0.5);
    const correct = area ? `$${m * m} : ${n * n}$` : `$${m} : ${n}$`;
    const wrongPower = area ? `$${m} : ${n}$` : `$${m * m} : ${n * n}$`;

    const answers = [
      correct,
      wrongPower,
      `$${m ** 3} : ${n ** 3}$`,
      area ? `$${n * n} : ${m * m}$` : `$${n} : ${m}$`,
    ];
    if (new Set(answers).size !== 4) return null;

    return mcq({
      question: `שני משולשים דומים, ויחס הדמיון ביניהם הוא $${m} : ${n}$. מהו היחס בין ${area ? 'שטחיהם' : 'היקפיהם'}?`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        area
          ? 'זהו יחס הדמיון עצמו, כלומר היחס בין הצלעות. שטח נמדד בשתי מידות אורך, ולכן הוא גדל בריבוע יחס הדמיון.'
          : 'כאן היחס הועלה בריבוע. היקף הוא סכום של אורכים, כלומר מידת אורך אחת, ולכן הוא גדל בדיוק כמו יחס הדמיון ובלי ריבוע.',
        'זהו יחס הדמיון בחזקה שלישית, שמתאים ליחס נפחים בגופים דומים ולא לגדלים במישור.',
        'היחס הפוך. המשולש הקטן יותר נשאר הקטן יותר גם כאן, ולכן סדר האגפים נשמר.',
      ],
      hint: area
        ? 'שטח הוא מכפלה של שני אורכים. אם כל אורך גדל פי $k$, פי כמה גדל השטח?'
        : 'היקף הוא סכום של אורכים. אם כל אורך גדל פי $k$, פי כמה גדל הסכום?',
      solution: {
        steps: [
          area
            ? '**הכלל:** המשולשים דומים ומבוקש יחס השטחים, ולכן משתמשים בכך ששטח נמדד בשתי מידות אורך, ומכאן שיחס השטחים בצורות דומות שווה לריבוע יחס הדמיון.'
            : '**הכלל:** המשולשים דומים ומבוקש יחס ההיקפים, ולכן משתמשים בכך שהיקף הוא סכום של אורכים בלבד, ומכאן שיחס ההיקפים בצורות דומות שווה ליחס הדמיון עצמו.',
          `יחס הדמיון הוא $k = \\dfrac{${m}}{${n}}$.`,
          area
            ? `יחס השטחים הוא $k^2 = \\dfrac{${m}^2}{${n}^2}$.`
            : `יחס ההיקפים הוא $k$ עצמו, בלי שינוי חזקה.`,
        ],
        finalAnswer: correct,
        explanation: 'בצורות דומות: אורכים והיקפים ביחס $k$, שטחים ביחס $k^2$, נפחים ביחס $k^3$.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 3 · eg-thales — a parallel line cuts proportional segments
// ---------------------------------------------------------------------------

/**
 * The flagship figure case, and the reason the coordinates are derived rather
 * than placed: `A` at the origin, `AB` along the x-axis at its TRUE length and
 * `AC` at 62° at its TRUE length. Then `D` and `E` sit at their true distances,
 * every length label shares one scale, and `DE ∥ BC` holds because the ratios
 * are equal by construction — which is the theorem the question is about.
 */
const thalesSegment: GenTemplate = {
  id: 'eg-thales-segment',
  wrongAnswerTags: ['operation-swap', 'values-swapped'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'eg-thales',
  title: 'תאלס — חלוקה ביחס שווה',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const ad = rng.int(2, difficulty === 'easy' ? 6 : 9);
    const k = rng.int(2, difficulty === 'hard' ? 5 : 3); // DB = k · AD
    const db = ad * k;
    // `AE` is drawn as a MULTIPLE of k so the flipped-proportion wrong answer
    // (`AE / k`) is always a whole number. `wrongAnswerTags` is aligned by
    // POSITION, so a conditionally-present entry would silently mislabel the
    // other one — the constraint belongs in the parameters, not in a filter.
    const m = rng.int(1, difficulty === 'easy' ? 3 : 5);
    const ae = k * m;
    const ec = ae * k; // Thales: AD/DB = AE/EC
    if (ec > 90 || ae === ad || ae === ec) return null;

    const ab = ad + db;
    const ac = ae + ec;
    const A: Pt = [0, 0];
    const B: Pt = polar(ab, 0);
    const C: Pt = polar(ac, 62);
    const D: Pt = along(A, B, ad / ab);
    const E: Pt = along(A, C, ae / ac);

    const figure = fence({
      points: { A, B, C, D, E },
      polygons: ['ABC'],
      segments: ['DE'],
      parallel: [{ on: 'DE' }, { on: 'BC' }],
      labels: [
        { on: 'AD', text: String(ad) },
        { on: 'DB', text: String(db) },
        { on: 'AE', text: String(ae) },
      ],
      width: 260,
    });

    return open({
      question: `במשולש $\\triangle ABC$ הנקודה $D$ נמצאת על הצלע $AB$ והנקודה $E$ על הצלע $AC$, כך ש$DE \\parallel BC$. נתון $AD = ${ad}$, $DB = ${db}$ וגם $AE = ${ae}$. מצא את $EC$.\n\n${figure}`,
      expected: { kind: 'value', value: String(ec) },
      wrongAnswers: [
        {
          value: String(m),
          note: 'היחס נלקח הפוך. הפרופורציה היא $\\dfrac{AD}{DB} = \\dfrac{AE}{EC}$, כלומר החלק שליד הקודקוד אל החלק שמתחתיו, ובאותו כיוון בשתי הצלעות.',
        },
        {
          value: String(ac),
          note: `זהו אורך הצלע $AC$ כולה ולא החלק $EC$. הנקודה $E$ מחלקת אותה, ומבוקש רק החלק שבין $E$ ל$C$.`,
        },
      ],
      hint: `$DE$ מקביל ל$BC$, ולכן הוא חותך את שתי הצלעות באותו יחס. מהו היחס $\\dfrac{AD}{DB}$ כאן?`,
      solution: {
        steps: [
          '**הכלל:** ישר המקביל לצלע במשולש חותך את שתי הצלעות האחרות ביחס שווה, ולכן משתמשים במשפט תאלס $\\dfrac{AD}{DB} = \\dfrac{AE}{EC}$ ופותרים את הפרופורציה לנעלם.',
          `מציבים: $\\dfrac{${ad}}{${db}} = \\dfrac{${ae}}{EC}$.`,
          `מכפילים במכפלה מוצלבת: $${ad} \\cdot EC = ${db} \\cdot ${ae}$.`,
        ],
        finalAnswer: `$EC = ${ec}$`,
        explanation: 'משפט תאלס: מקביל לצלע חותך את הצלעות האחרות ביחסים שווים.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 4 · eg-circle — inscribed angles and cyclic quadrilaterals
// ---------------------------------------------------------------------------

/**
 * Central angle → inscribed angle. The figure places `A` and `B` symmetrically
 * about the downward vertical so that `∠AOB` measures exactly the drawn value,
 * and `C` on the major arc, where the inscribed angle theorem then makes
 * `∠ACB` exactly half — so the label the validator checks is true because the
 * geometry is true, not because it was typed to match.
 */
const circleInscribed: GenTemplate = {
  id: 'eg-circle-inscribed',
  distractorTags: [null, 'operation-swap', 'operation-swap', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'eg-circle',
  title: 'זווית מרכזית וזווית היקפית',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    // Even, so the inscribed angle is a whole number of degrees.
    const central = rng.int(difficulty === 'easy' ? 20 : 15, 84) * 2;
    const inscribed = central / 2;
    if (central >= 180) return null;

    const r = 5;
    const half = central / 2;
    const O: Pt = [0, 0];
    const A: Pt = polar(r, 270 - half);
    const B: Pt = polar(r, 270 + half);
    const C: Pt = polar(r, 90);

    const figure = fence({
      points: { O, A, B, C },
      circles: [{ center: 'O', r, on: ['A', 'B', 'C'] }],
      segments: ['OA', 'OB', 'AC', 'BC'],
      angles: [
        { at: 'O', from: 'A', to: 'B', label: `${central}°` },
        { at: 'C', from: 'A', to: 'B', accent: true },
      ],
      width: 240,
    });

    const answers = [`$${inscribed}°$`, `$${central}°$`, `$${central * 2}°$`, `$${180 - central}°$`];
    if (new Set(answers).size !== 4) return null;

    return mcq({
      question: `במעגל שמרכזו $O$ נתונה הזווית המרכזית $\\angle AOB = ${central}°$. הנקודה $C$ נמצאת על המעגל, על הקשת הגדולה. מהי הזווית ההיקפית $\\angle ACB$?\n\n${figure}`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        'זו הזווית המרכזית עצמה. הזווית ההיקפית הנשענת על אותה קשת קטנה ממנה, ובדיוק פי שניים.',
        'כאן הוכפל במקום לחלק. הזווית המרכזית היא הגדולה מבין השתיים, ולכן ההיקפית קטנה ממנה ולא גדולה.',
        'זו זווית משלימה ל-$180°$, שרלוונטית למרובע חסום ולא ליחס בין מרכזית להיקפית על אותה קשת.',
      ],
      hint: 'הזווית המרכזית והזווית ההיקפית נשענות על אותה קשת. מי מהן גדולה, ופי כמה?',
      solution: {
        steps: [
          '**הכלל:** שתי הזוויות נשענות על אותה קשת, האחת מהמרכז והשנייה מנקודה על המעגל, ולכן משתמשים במשפט הזווית ההיקפית: זווית היקפית שווה למחצית הזווית המרכזית הנשענת על אותה קשת.',
          `הזווית המרכזית הנשענת על הקשת $AB$ היא $${central}°$.`,
          `לכן הזווית ההיקפית היא מחציתה: $\\dfrac{${central}}{2}$.`,
        ],
        finalAnswer: `$\\angle ACB = ${inscribed}°$`,
        explanation: 'זווית היקפית שווה למחצית הזווית המרכזית הנשענת על אותה קשת.',
      },
    });
  },
};

/** Opposite angles of a cyclic quadrilateral sum to 180°. */
const circleCyclicQuad: GenTemplate = {
  id: 'eg-circle-cyclic-quad',
  distractorTags: [null, 'formula-mismatch', 'operation-swap', 'sign-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'eg-circle',
  title: 'מרובע חסום במעגל',
  skill: 'formula-choice',
  difficulties: ['mid', 'hard'],
  build(rng) {
    // Even, so the "halved" distractor is a whole number of degrees. Euclidean
    // geometry answers in this syllabus are whole degrees, and a lone `56.5°`
    // among three integers is eliminated by its shape rather than by the maths.
    const given = rng.int(28, 62) * 2;
    const opposite = 180 - given;
    if (given === opposite) return null;

    const r = 5;
    /**
     * Four points around the circle, in angular order so `ABCD` is convex.
     *
     * NO angle is labelled in the figure. The drawn quadrilateral cannot have
     * `∠A = given` for an arbitrary `given` without solving for the arcs, and
     * labelling it anyway would be exactly the lie `validateGeo` exists to
     * catch. The sketch shows the CONFIGURATION — a quadrilateral inscribed in
     * a circle — and the numbers live in the question text, which is how the
     * authored bank handles the same situation.
     */
    const A: Pt = polar(r, 160);
    const B: Pt = polar(r, 250);
    const C: Pt = polar(r, 340);
    const D: Pt = polar(r, 60);

    const figure = fence({
      points: { O: [0, 0], A, B, C, D },
      circles: [{ center: 'O', r, on: ['A', 'B', 'C', 'D'] }],
      polygons: ['ABCD'],
      width: 240,
    });

    const answers = [`$${opposite}°$`, `$${given}°$`, `$${360 - given}°$`, `$${90 - given / 2}°$`];
    if (new Set(answers).size !== 4) return null;

    return mcq({
      question: `המרובע $ABCD$ חסום במעגל, ונתון $\\angle A = ${given}°$. מהי הזווית $\\angle C$?\n\n${figure}`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        'זוויות נגדיות במרובע חסום אינן שוות אלא משלימות ל-$180°$. שוויון בין זוויות נגדיות מאפיין מקבילית, ולא כל מרובע חסום.',
        'כאן החיסור נעשה מ-$360°$. סכום כל ארבע הזוויות במרובע הוא $360°$, אבל כל זוג נגדי מסתכם ל-$180°$.',
        'זהו חישוב של זווית היקפית מול מרכזית, שאינו הכלל הרלוונטי לזוג זוויות נגדיות במרובע חסום.',
      ],
      hint: 'במרובע החסום במעגל, מה סכומן של שתי זוויות נגדיות?',
      solution: {
        steps: [
          '**הכלל:** המרובע חסום במעגל, ולכן כל זוג זוויות נגדיות בו משלימות זו את זו ל-$180°$, ומכאן שהזווית המבוקשת היא ההפרש בין $180°$ לזווית הנתונה.',
          `נתון $\\angle A = ${given}°$, ו$\\angle C$ נגדית לה.`,
          `לכן $\\angle C = 180° - ${given}°$.`,
        ],
        finalAnswer: `$\\angle C = ${opposite}°$`,
        explanation: 'במרובע חסום במעגל סכום כל זוג זוויות נגדיות הוא $180°$.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 5 · eg-shapes — the midsegment, and trapezoid area
// ---------------------------------------------------------------------------

/**
 * The midsegment: half the base, and the small triangle it cuts off has a
 * quarter of the area. Both halves are asked, because a student who knows the
 * length rule and guesses the area rule is exactly the student this repairs.
 */
const shapesMidsegment: GenTemplate = {
  id: 'eg-shapes-midsegment',
  distractorTags: [null, 'exponent-slip', 'operation-swap', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'eg-shapes',
  title: 'קטע אמצעים במשולש',
  skill: 'formula-choice',
  difficulties: ['mid', 'hard'],
  build(rng) {
    const area = rng.int(4, 30) * 4; // divisible by 4, so a quarter is whole
    const quarter = area / 4;

    const ab = rng.int(8, 14);
    const ac = rng.int(9, 15);
    const A: Pt = [0, 0];
    const B: Pt = polar(ab, 0);
    const C: Pt = polar(ac, 68);
    const D: Pt = along(A, B, 0.5);
    const E: Pt = along(A, C, 0.5);

    const figure = fence({
      points: { A, B, C, D, E },
      polygons: ['ABC'],
      segments: ['DE'],
      parallel: [{ on: 'DE' }, { on: 'BC' }],
      ticks: [
        { on: 'AD', n: 1 },
        { on: 'DB', n: 1 },
        { on: 'AE', n: 2 },
        { on: 'EC', n: 2 },
      ],
      width: 250,
    });

    const answers = [
      `$${quarter}$`,
      `$${area / 2}$`,
      `$${area}$`,
      `$${Math.round(area / 3)}$`,
    ];
    if (new Set(answers).size !== 4) return null;

    return mcq({
      question: `במשולש $\\triangle ABC$ הנקודות $D$ ו$E$ הן אמצעי הצלעות $AB$ ו$AC$. שטח המשולש $\\triangle ABC$ הוא $${area}$. מהו שטח המשולש $\\triangle ADE$?\n\n${figure}`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        'כאן השטח חולק בשניים, כמו האורכים. הצלעות אכן קטנות פי שניים, אבל השטח קטן פי הריבוע של היחס.',
        'זהו שטח המשולש כולו. המשולש הקטן הוא רק חלק ממנו.',
        'שליש אינו היחס כאן. יחס הדמיון בין המשולשים הוא $\\dfrac{1}{2}$, ולכן יחס השטחים הוא הריבוע שלו.',
      ],
      hint: `$DE$ הוא קטע אמצעים, ולכן $\\triangle ADE$ דומה ל$\\triangle ABC$. מהו יחס הדמיון, ומה זה אומר על השטח?`,
      solution: {
        steps: [
          '**הכלל:** $D$ ו$E$ הן אמצעי הצלעות, ולכן $DE$ הוא קטע אמצעים, המשולש הקטן דומה לגדול ביחס $\\dfrac{1}{2}$, ויחס השטחים בצורות דומות הוא ריבוע יחס הדמיון.',
          `יחס הדמיון הוא $\\dfrac{1}{2}$, ולכן יחס השטחים הוא $\\left(\\dfrac{1}{2}\\right)^2 = \\dfrac{1}{4}$.`,
          `מכאן שטח $\\triangle ADE$ הוא רבע משטח $\\triangle ABC$, כלומר $\\dfrac{${area}}{4}$.`,
        ],
        finalAnswer: `$${quarter}$`,
        explanation: 'קטע אמצעים מקביל לצלע השלישית ושווה למחציתה; המשולש שהוא חותך דומה ביחס $\\dfrac{1}{2}$ ושטחו רבע.',
      },
    });
  },
};

/** Trapezoid area — the "forgot to halve" family, with a real figure. */
const shapesTrapezoid: GenTemplate = {
  id: 'eg-shapes-trapezoid-area',
  wrongAnswerTags: ['dropped-factor', 'operation-swap'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'eg-shapes',
  title: 'שטח טרפז',
  skill: 'substitution',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const big = rng.int(6, difficulty === 'easy' ? 14 : 22);
    const small = rng.int(2, big - 2);
    const h = rng.int(2, difficulty === 'easy' ? 8 : 12);
    // The area must be whole, so `(a + b) · h` has to be even.
    if (((big + small) * h) % 2 !== 0) return null;
    const area = ((big + small) * h) / 2;

    // Coordinates carry the true lengths, so the labels share one scale and the
    // two bases really are parallel.
    const offset = rng.int(1, Math.max(1, big - small - 1));
    const A: Pt = [0, 0];
    const B: Pt = [big, 0];
    const C: Pt = [offset + small, h];
    const D: Pt = [offset, h];

    const figure = fence({
      points: { A, B, C, D },
      polygons: ['ABCD'],
      parallel: [{ on: 'AB' }, { on: 'DC' }],
      labels: [
        { on: 'AB', text: String(big) },
        { on: 'DC', text: String(small) },
      ],
      width: 250,
    });

    return open({
      question: `בטרפז $ABCD$ הבסיסים הם $AB = ${big}$ ו$DC = ${small}$, והגובה בין הבסיסים הוא $${h}$. חשב את שטח הטרפז.\n\n${figure}`,
      expected: { kind: 'value', value: String(area) },
      wrongAnswers: [
        {
          value: String((big + small) * h),
          note: 'כאן חסרה החלוקה בשניים. נוסחת שטח הטרפז לוקחת את ממוצע הבסיסים כפול הגובה, ולכן החלוקה בשניים היא חלק מהנוסחה ולא קישוט.',
        },
        {
          value: String(big * h),
          note: `כאן חושב שטח מלבן לפי הבסיס הגדול בלבד. שני הבסיסים שונים זה מזה, ולכן שניהם נכנסים לחישוב.`,
        },
      ],
      hint: 'שטח טרפז לוקח את שני הבסיסים יחד. מה עושים איתם לפני שמכפילים בגובה?',
      solution: {
        steps: [
          '**הכלל:** מבוקש שטח טרפז ונתונים שני הבסיסים והגובה, ולכן מציבים בנוסחת שטח הטרפז $S = \\dfrac{(a + b) \\cdot h}{2}$, שבה $a$ ו$b$ הם הבסיסים המקבילים.',
          `מציבים: $S = \\dfrac{(${big} + ${small}) \\cdot ${h}}{2}$.`,
          `$S = \\dfrac{${big + small} \\cdot ${h}}{2}$.`,
        ],
        finalAnswer: `$S = ${area}$`,
        explanation: 'שטח טרפז: ממוצע הבסיסים כפול הגובה.',
      },
    });
  },
};

export const EUCLIDEAN_TEMPLATES: GenTemplate[] = [
  congruenceCriterion,
  similarityAreaRatio,
  thalesSegment,
  circleInscribed,
  circleCyclicQuad,
  shapesMidsegment,
  shapesTrapezoid,
];
