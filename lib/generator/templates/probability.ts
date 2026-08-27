/**
 * generator/templates/probability.ts — parameterised repair questions for הסתברות.
 *
 * Same authored-content contract as the סדרות templates, plus the two rules
 * specific to this topic:
 *
 *   · EXACT arithmetic only. Every probability here is a `Frac`; nothing is
 *     computed in floats and then rounded into an answer. `9/20` is an answer a
 *     student can check; `0.45000000000000007` is a bug wearing an answer's
 *     clothes. The one exception is the binomial templates, where the exact
 *     fraction is unreadable — those round for DISPLAY only, at a precision the
 *     option guard proves is enough to keep the four options distinct.
 *   · Final answers NAME the event: `P(שני הכדורים אדומים) $= \dfrac{3}{10}$`,
 *     with the Hebrew OUTSIDE the math island. The split-island pattern
 *     `$P($עברית$)$` renders broken in RTL (feedback_probability_answer_notation).
 *
 * Sub-topic `pr-practice` has no template: it is the "close to bagrut level"
 * bank, whose value is the multi-part structure a single generated item cannot
 * carry. It falls back to the authored bank.
 */

import type { PracticeQuestion } from '@/content/lessons/types';
import { choose, Frac, type Rng } from '../rng';
import { mcq } from './shared';
import type { GenTemplate } from '../types';

const TOPIC = 'הסתברות';
const SUBJECT = 'math5';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** A probability must land in [0,1]; a draw that leaves it doesn't ship. */
const valid = (...fs: Frac[]) => fs.every((f) => f.value >= 0 && f.value <= 1);

/** `$\dfrac{3}{10}$` — the option/answer form used everywhere below. */
const tex = (f: Frac) => `$${f.tex()}$`;

/**
 * Round for display, at a precision the caller then checks keeps the options
 * distinct. Trailing zeros are kept: `0.2600` and `0.2601` must not collapse
 * into visibly different lengths that hint at which one is computed.
 */
const dec = (f: Frac, places = 4) => f.value.toFixed(places);

/**
 * Hebrew is inflected, so singular and plural forms are LISTED rather than
 * derived. Stripping "ים" off "אדומים" yields "אדומ", and a question that asks
 * about an "אדומ" is one a student notices before they notice the maths.
 */
const CONTEXTS = [
  { unit: 'כדורים', one: 'כדור', theOne: 'הכדור', aPl: 'אדומים', aSg: 'אדום', bPl: 'כחולים', bSg: 'כחול' },
  { unit: 'גולות', one: 'גולה', theOne: 'הגולה', aPl: 'ירוקות', aSg: 'ירוקה', bPl: 'צהובות', bSg: 'צהובה' },
  { unit: 'פתקים', one: 'פתק', theOne: 'הפתק', aPl: 'מסומנים', aSg: 'מסומן', bPl: 'ריקים', bSg: 'ריק' },
] as const;

// ---------------------------------------------------------------------------
// 1 · pr-basics — the complement, and "או"
// ---------------------------------------------------------------------------

/**
 * The union formula and the complement in one item. The dominant real mistake
 * is adding `P(A)+P(B)` without subtracting the overlap, so that is distractor
 * one and its note names the double-count explicitly.
 */
const prUnion: GenTemplate = {
  id: 'pr-union-complement',
  distractorTags: [null, 'dropped-factor', 'complement-skipped', 'operation-swap'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'pr-basics',
  title: 'איחוד מאורעות ומאורע משלים',
  skill: 'complement',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const den = difficulty === 'easy' ? 20 : rng.pick([25, 40, 50]);
    const pa = new Frac(rng.int(6, Math.floor(den * 0.55)), den);
    const pb = new Frac(rng.int(5, Math.floor(den * 0.5)), den);
    const both = new Frac(rng.int(1, Math.floor(den * 0.2)), den);
    if (both.value > Math.min(pa.value, pb.value)) return null;

    const union = pa.add(pb).sub(both);
    if (!valid(pa, pb, both, union) || union.value >= 1) return null;

    const noOverlap = pa.add(pb);          // forgot to subtract the intersection
    const complement = union.comp();        // answered the complement instead
    const addedOverlap = pa.add(pb).add(both);

    if (noOverlap.value > 1) return null;

    return mcq({
      question: `נתון $P(A) = ${pa.tex()}$, $P(B) = ${pb.tex()}$ וגם $P(A \\cap B) = ${both.tex()}$. חשב את ההסתברות שיקרה $A$ או $B$.`,
      answers: [tex(union), tex(noOverlap), tex(complement), tex(addedOverlap)],
      correct: 0,
      distractorNotes: [
        '',
        `זהו $P(A) + P(B)$ בלי חיסור החיתוך. התוצאות שנמצאות גם ב$A$ וגם ב$B$ נספרו כאן פעמיים, ולכן מחסרים אותן פעם אחת.`,
        'זוהי ההסתברות שלא יקרה אף אחד מהשניים, כלומר המאורע המשלים לאיחוד. השאלה מבקשת את האיחוד עצמו.',
        'החיתוך חובר במקום לחסר. הוא כבר כלול פעמיים בסכום, ולכן הוספה שלישית מרחיקה עוד יותר.',
      ],
      hint: 'התוצאות שנמצאות בשני המאורעות נספרות בסכום פעמיים. כמה פעמים הן צריכות להיספר?',
      solution: {
        steps: [
          '**הכלל:** מבוקשת הסתברות של "או", כלומר איחוד שני מאורעות שאינם זרים, ולכן משתמשים בנוסחת החיבור $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$, שמחסרת את החפיפה שנספרה פעמיים.',
          `מציבים: $P(A \\cup B) = ${pa.tex()} + ${pb.tex()} - ${both.tex()}$.`,
          `$${pa.add(pb).tex()} - ${both.tex()}$.`,
        ],
        finalAnswer: `P(A או B) $= ${union.tex()}$`,
        explanation: 'נוסחת החיבור: $P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$, ולמאורעות זרים החיתוך מתאפס.',
      },
    });
  },
};

const prCounting: GenTemplate = {
  id: 'pr-counting-bag',
  distractorTags: [null, 'sample-space', 'complement-skipped', 'sample-space'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'pr-basics',
  title: 'הסתברות מתוך ספירת תוצאות',
  skill: 'counting',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const c = rng.pick(CONTEXTS);
    const a = rng.int(3, difficulty === 'easy' ? 9 : 14);
    const b = rng.int(3, difficulty === 'easy' ? 9 : 16);
    const total = a + b;

    const pA = new Frac(a, total);
    // NOT `a/b` ("divided by the other group"): that exceeds 1 whenever a > b,
    // and an option showing an impossible probability eliminates itself. Every
    // distractor has to be a value the student could plausibly believe.
    const afterOneDrawn = new Frac(a - 1, total - 1); // counted as if one was already out
    const other = new Frac(b, total);                 // answered the complement
    const wrongTotal = new Frac(a, total + 1);        // miscounted the sample space
    if (pA.eq(other)) return null;

    return mcq({
      question: `בכד יש $${a}$ ${c.unit} ${c.aPl} ועוד $${b}$ ${c.unit} ${c.bPl}. מוציאים ${c.one} אחד באקראי. מה ההסתברות שהוא ${c.aSg}?`,
      answers: [tex(pA), tex(afterOneDrawn), tex(other), tex(wrongTotal)],
      correct: 0,
      distractorNotes: [
        '',
        `כאן נספרו $${a - 1}$ מתוך $${total - 1}$, כאילו ${c.one} אחד כבר יצא מהכד. מוציאים ${c.one} אחד בלבד, והכד מלא לפני ההוצאה, ולכן המכנה הוא $${total}$.`,
        `זוהי ההסתברות ל${c.one} ${c.bSg}, המאורע המשלים. השאלה מבקשת את הצבע השני.`,
        `המכנה כאן הוא $${total + 1}$. בכד יש בדיוק $${total}$ ${c.unit}, ואין ${c.one} נוסף.`,
      ],
      hint: 'מהו מספר כל התוצאות האפשריות בהוצאה אחת?',
      solution: {
        steps: [
          '**הכלל:** כל התוצאות שוות סיכוי ומבוקשת הסתברות של תוצאה מסוימת, ולכן משתמשים בהגדרה הבסיסית $P(A) = \\dfrac{k}{n}$, כאשר $k$ הוא מספר התוצאות הרצויות ו$n$ הוא מספר כל התוצאות האפשריות.',
          `סך כל ה${c.unit} בכד: $${a} + ${b} = ${total}$.`,
          `מספר התוצאות הרצויות הוא $${a}$, ולכן ההסתברות היא $\\dfrac{${a}}{${total}}$.`,
        ],
        finalAnswer: `P(${c.theOne} ${c.aSg}) $= ${pA.tex()}$`,
        explanation: 'הסתברות קלאסית: רצויות חלקי אפשריות, כשכל התוצאות שוות סיכוי.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 2 · pr-tree — two draws, with and without replacement
// ---------------------------------------------------------------------------

/**
 * The single highest-yield item in the topic: with replacement the second
 * branch is unchanged, without replacement both numerator and denominator drop
 * by one. Getting that wrong is the `independence` mistake, and here it is the
 * whole question rather than a step inside one.
 */
const prTwoDraws: GenTemplate = {
  id: 'pr-tree-two-draws',
  distractorTags: [null, 'condition-ignored', 'operation-swap', 'partial-answer'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'pr-tree',
  title: 'שתי הוצאות ברצף, עם החזרה ובלעדיה',
  skill: 'independence',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const c = rng.pick(CONTEXTS);
    const a = rng.int(3, difficulty === 'hard' ? 12 : 8);
    const b = rng.int(3, difficulty === 'hard' ? 12 : 8);
    const total = a + b;
    const replaced = difficulty === 'easy' ? false : rng.chance(0.4);

    const first = new Frac(a, total);
    const second = replaced ? first : new Frac(a - 1, total - 1);
    const answer = first.mul(second);

    const wrongBranch = replaced
      ? first.mul(new Frac(a - 1, total - 1))
      : first.mul(first);
    const summed = first.add(second);
    const oneDrawOnly = first;

    if (!valid(answer, wrongBranch, summed) || summed.value > 1) return null;

    const wording = replaced
      ? `מוציאים ${c.one} באקראי, מחזירים אותו לכד, ומוציאים ${c.one} נוסף`
      : `מוציאים שני ${c.unit} באקראי בזה אחר זה, בלי להחזיר את הראשון לכד`;

    const branchNote = replaced
      ? `כאן המכנה קטן בהוצאה השנייה. ${c.theOne} הוחזר לכד, ולכן ההרכב חוזר להיות $${a}$ מתוך $${total}$ בדיוק כמו בהוצאה הראשונה.`
      : `כאן ההוצאה השנייה חושבה כאילו ההרכב לא השתנה. ${c.theOne} הראשון לא הוחזר, ולכן נשארו $${a - 1}$ ${c.aPl} מתוך $${total - 1}$.`;

    return mcq({
      question: `בכד יש $${a}$ ${c.unit} ${c.aPl} ועוד $${b}$ ${c.unit} ${c.bPl}. ${wording}. מה ההסתברות ששני ה${c.unit} ${c.aPl}?`,
      answers: [tex(answer), tex(wrongBranch), tex(summed), tex(oneDrawOnly)],
      correct: 0,
      distractorNotes: ['', branchNote, 'הענפים חוברו במקום להיות מוכפלים. לאורך ענף אחד בעץ מכפילים, ומחברים רק בין ענפים מקבילים שמובילים לאותו מאורע.', 'זוהי ההסתברות להוצאה הראשונה בלבד. השאלה מבקשת ששתי ההוצאות יצליחו.'],
      hint: replaced
        ? 'אחרי ההחזרה, האם ההרכב בכד השתנה?'
        : `אחרי שהוצאת ${c.one} אחד ולא החזרת אותו, כמה ${c.unit} נשארו בכד ומתוכם כמה ${c.aPl}?`,
      solution: {
        steps: [
          '**הכלל:** מבוקשת הסתברות ששתי הוצאות ברצף יצליחו שתיהן, וזהו מסלול אחד בעץ ההסתברויות, ולכן מכפילים לאורכו לפי כלל המכפלה $P(A \\cap B) = P(A) \\cdot P(B|A)$.',
          `הוצאה ראשונה: $${first.tex()}$, כי יש $${a}$ ${c.aPl} מתוך $${total}$.`,
          replaced
            ? `${c.theOne} הוחזר, ולכן ההרכב לא השתנה וההוצאה השנייה היא שוב $${second.tex()}$.`
            : `${c.theOne} לא הוחזר, ולכן נשארו $${a - 1}$ ${c.aPl} מתוך $${total - 1}$, כלומר $${second.tex()}$.`,
          `מכפילים לאורך המסלול: $${first.tex()} \\cdot ${second.tex()}$.`,
        ],
        finalAnswer: `P(שני ה${c.unit} ${c.aPl}) $= ${answer.tex()}$`,
        explanation: 'בעץ הסתברויות מכפילים לאורך ענף ומחברים בין ענפים מקבילים.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 3 · pr-tables — a two-way table
// ---------------------------------------------------------------------------

type Table = { ab: number; aB: number; Ab: number; AB: number; total: number };

function drawTable(rng: Rng, scale: number): Table | null {
  const ab = rng.int(2, scale);
  const aB = rng.int(2, scale);
  const Ab = rng.int(2, scale);
  const AB = rng.int(2, scale);
  const total = ab + aB + Ab + AB;
  if (total < 20) return null;
  return { ab, aB, Ab, AB, total };
}

/** Markdown table — rendered by MathText, same as the authored bank uses. */
function tableMd(t: Table, rowA: string, rowNotA: string, colB: string, colNotB: string): string {
  return [
    `| | ${colB} | ${colNotB} | סה"כ |`,
    '|---|---|---|---|',
    `| ${rowA} | $${t.ab}$ | $${t.aB}$ | $${t.ab + t.aB}$ |`,
    `| ${rowNotA} | $${t.Ab}$ | $${t.AB}$ | $${t.Ab + t.AB}$ |`,
    `| סה"כ | $${t.ab + t.Ab}$ | $${t.aB + t.AB}$ | $${t.total}$ |`,
  ].join('\n');
}

const prTable: GenTemplate = {
  id: 'pr-table-marginal',
  distractorTags: [null, 'sample-space', 'formula-mismatch', 'sample-space'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'pr-tables',
  title: 'קריאת טבלה דו-ממדית',
  skill: 'counting',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const t = drawTable(rng, difficulty === 'easy' ? 12 : 30);
    if (!t) return null;

    const colTotal = t.ab + t.Ab;
    const joint = new Frac(t.ab, t.total);
    const marginal = new Frac(colTotal, t.total);
    const conditional = new Frac(t.ab, colTotal);
    const rowTotal = t.ab + t.aB;
    const wrongRow = new Frac(t.ab, rowTotal);

    if (new Set([joint.tex(), marginal.tex(), conditional.tex(), wrongRow.tex()]).size !== 4) {
      return null;
    }

    return mcq({
      question: `הטבלה מתארת $${t.total}$ תלמידים לפי שתי תכונות:\n\n${tableMd(t, 'מרכיבים משקפיים', 'לא מרכיבים משקפיים', 'נוסעים באוטובוס', 'לא נוסעים באוטובוס')}\n\nבוחרים תלמיד אחד באקראי. מה ההסתברות שהוא גם מרכיב משקפיים וגם נוסע באוטובוס?`,
      answers: [tex(joint), tex(conditional), tex(marginal), tex(wrongRow)],
      correct: 0,
      distractorNotes: [
        '',
        `זוהי ההסתברות המותנית להרכיב משקפיים בהינתן שהתלמיד נוסע באוטובוס, כלומר חלוקה ב-$${colTotal}$. השאלה בוחרת מכלל $${t.total}$ התלמידים, ולכן המכנה הוא סך הכול.`,
        'זוהי ההסתברות לנסוע באוטובוס בלבד, סכום עמודה שלמה. השאלה מבקשת את התא שבו שתי התכונות מתקיימות יחד.',
        `כאן החלוקה היא בסכום השורה, $${rowTotal}$, כלומר בהינתן שהתלמיד מרכיב משקפיים. גם זו הסתברות מותנית ולא הסתברות של "וגם".`,
      ],
      hint: 'בשאלת "וגם" בוחרים מכלל האוכלוסייה. מה צריך להופיע במכנה?',
      solution: {
        steps: [
          '**הכלל:** מבוקשת הסתברות של "וגם" כשבוחרים אחד מכלל האוכלוסייה, ולכן לוקחים מהטבלה את התא שבו שתי התכונות מתקיימות יחד ומחלקים בסך הכול, כלומר $P(A \\cap B) = \\dfrac{n(A \\cap B)}{n}$.',
          `התא שבו שתי התכונות מתקיימות יחד הוא $${t.ab}$.`,
          `סך כל התלמידים הוא $${t.total}$, ולכן מחלקים בו.`,
        ],
        finalAnswer: `P(מרכיב משקפיים וגם נוסע באוטובוס) $= ${joint.tex()}$`,
        explanation: 'תא בטבלה חלקי סך הכול הוא הסתברות של "וגם"; חלוקה בשוליים היא כבר הסתברות מותנית.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 4 · pr-conditional — narrowing the sample space
// ---------------------------------------------------------------------------

const prConditional: GenTemplate = {
  id: 'pr-conditional-table',
  distractorTags: [null, 'sample-space', 'sample-space', 'condition-ignored'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'pr-conditional',
  title: 'הסתברות מותנית מתוך טבלה',
  skill: 'conditional',
  difficulties: ['mid', 'hard'],
  build(rng, difficulty) {
    const t = drawTable(rng, difficulty === 'hard' ? 35 : 20);
    if (!t) return null;

    const colTotal = t.ab + t.Ab;
    if (colTotal < 5) return null;

    const answer = new Frac(t.ab, colTotal);
    const joint = new Frac(t.ab, t.total);
    const rowTotal = t.ab + t.aB;
    const reversed = new Frac(t.ab, rowTotal);
    const marginal = new Frac(rowTotal, t.total);

    const opts = [answer, joint, reversed, marginal];
    if (new Set(opts.map((f) => f.tex())).size !== 4) return null;

    return mcq({
      question: `הטבלה מתארת $${t.total}$ עובדים בחברה:\n\n${tableMd(t, 'עברו את המבחן', 'לא עברו את המבחן', 'השתתפו בהכשרה', 'לא השתתפו בהכשרה')}\n\nנבחר עובד באקראי והתברר שהוא השתתף בהכשרה. מה ההסתברות שהוא עבר את המבחן?`,
      answers: opts.map(tex),
      correct: 0,
      distractorNotes: [
        '',
        `כאן המכנה נשאר $${t.total}$. הנתון שהעובד השתתף בהכשרה מצמצם את מרחב המדגם לאותם $${colTotal}$ עובדים בלבד, והם המכנה החדש.`,
        `כאן התנאי התהפך: זוהי ההסתברות שעובד השתתף בהכשרה בהינתן שהוא עבר את המבחן. הנתון הוא ההכשרה, ולכן היא זו שמצמצמת את המכנה.`,
        'זוהי ההסתברות לעבור את המבחן בלי שום תנאי. הנתון על ההכשרה לא נוצל.',
      ],
      hint: `הנתון "השתתף בהכשרה" מצמצם את מי שבכלל נספר. כמה עובדים נשארו במרחב המדגם?`,
      solution: {
        steps: [
          '**הכלל:** נתון שמאורע אחד כבר קרה ומבוקשת הסתברות של מאורע אחר, ולכן משתמשים בהסתברות מותנית $P(A|B) = \\dfrac{P(A \\cap B)}{P(B)}$, שמצמצמת את מרחב המדגם לשורה או לעמודה של הנתון בלבד.',
          `הנתון הוא ההשתתפות בהכשרה, ולכן סופרים רק את העמודה הזו: $${colTotal}$ עובדים.`,
          `מתוכם עברו את המבחן $${t.ab}$, ולכן מחלקים אותם בגודל העמודה.`,
        ],
        finalAnswer: `P(עבר את המבחן בהינתן שהשתתף בהכשרה) $= ${answer.tex()}$`,
        explanation: 'הסתברות מותנית מחליפה את המכנה במרחב המדגם המצומצם שהנתון יוצר.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 5 · pr-bernoulli — the binomial distribution
// ---------------------------------------------------------------------------

const P_VALUES: [number, number][] = [[1, 2], [1, 3], [1, 4], [1, 5], [2, 5], [3, 10], [1, 10], [2, 3], [3, 4], [7, 10]];

const prBernoulliExact: GenTemplate = {
  id: 'pr-bernoulli-exact',
  distractorTags: [null, 'dropped-factor', 'exponent-slip', 'exponent-slip'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'pr-bernoulli',
  title: 'התפלגות בינומית — בדיוק k הצלחות',
  skill: 'substitution',
  difficulties: ['mid', 'hard'],
  build(rng, difficulty) {
    const [pn, pd] = rng.pick(P_VALUES);
    const p = new Frac(pn, pd);
    const q = p.comp();
    const n = rng.int(difficulty === 'hard' ? 7 : 5, difficulty === 'hard' ? 12 : 8);
    const k = rng.int(2, n - 2);

    const answer = new Frac(choose(n, k)).mul(p.pow(k)).mul(q.pow(n - k));
    const noCoef = p.pow(k).mul(q.pow(n - k));                       // dropped C(n,k)
    const swapped = new Frac(choose(n, k)).mul(p.pow(n - k)).mul(q.pow(k)); // swapped exponents
    const wrongPow = new Frac(choose(n, k)).mul(p.pow(k)).mul(q.pow(n));    // used n, not n-k

    const opts = [answer, noCoef, swapped, wrongPow];
    if (!valid(...opts)) return null;
    const shown = opts.map((f) => `$${dec(f)}$`);
    if (new Set(shown).size !== 4) return null;

    return mcq({
      question: `ניסוי שהסתברות ההצלחה בו היא $${p.tex()}$ חוזר על עצמו $${n}$ פעמים, באופן בלתי תלוי. מה ההסתברות שיתקבלו בדיוק $${k}$ הצלחות? עגל לארבע ספרות אחרי הנקודה.`,
      answers: shown,
      correct: 0,
      distractorNotes: [
        '',
        `כאן חסר המקדם $\\binom{${n}}{${k}} = ${choose(n, k)}$. זוהי ההסתברות לסדר אחד מסוים של הצלחות וכישלונות, ויש $${choose(n, k)}$ סדרים כאלה.`,
        `החזקות התחלפו: $p$ קיבל $${n - k}$ ו$q$ קיבל $${k}$. מספר ההצלחות הוא $${k}$, ולכן הוא זה שנכנס לחזקה של $p$.`,
        `החזקה של $q$ כאן היא $${n}$ במקום $${n - k}$. מספר הכישלונות הוא $${n} - ${k} = ${n - k}$, כי סך החזקות חייב להיות מספר הניסויים.`,
      ],
      hint: `כמה כישלונות יש כשיש $${k}$ הצלחות מתוך $${n}$ ניסויים? ובכמה סדרים שונים הם יכולים להופיע?`,
      solution: {
        steps: [
          '**הכלל:** הניסוי חוזר מספר קבוע של פעמים באופן בלתי תלוי ולכל חזרה שתי תוצאות בלבד, וזוהי בדיוק התפלגות בינומית, ולכן מציבים בנוסחה $P(X=k) = \\binom{n}{k} p^k (1-p)^{n-k}$.',
          `כאן $n = ${n}$, $k = ${k}$, $p = ${p.tex()}$ ולכן $1 - p = ${q.tex()}$, ומספר הכישלונות הוא $${n} - ${k} = ${n - k}$.`,
          `$\\binom{${n}}{${k}} = ${choose(n, k)}$, ולכן מציבים $${choose(n, k)} \\cdot (${p.tex()})^{${k}} \\cdot (${q.tex()})^{${n - k}}$.`,
        ],
        finalAnswer: `P(בדיוק ${k} הצלחות) $= ${answer.tex()} \\approx ${dec(answer)}$`,
        explanation: 'בהתפלגות בינומית סכום החזקות שווה תמיד למספר הניסויים.',
      },
    });
  },
};

/**
 * Framings for "לפחות אחת".
 *
 * The maths of this template has only two free parameters (`p` and `n`), which
 * is not enough variety on its own — sixty seeds produced nine distinct
 * questions and the gate rejected it. A repair path that serves the same
 * sentence with a different number in it is the failure this whole module
 * exists to remove, so the SCENARIO is a parameter too.
 */
const AT_LEAST_SCENARIOS = [
  {
    setup: (n: number) => `שחקן קולע ל${n} זריקות עונשין.`,
    success: 'קליעה',
    trial: 'זריקה',
    trials: 'זריקות',
    atLeastOne: 'יקלע לפחות פעם אחת',
    event: 'לפחות קליעה אחת',
  },
  {
    setup: (n: number) => `מכונה מייצרת ${n} פריטים.`,
    success: 'פריט פגום',
    trial: 'ייצור',
    trials: 'פריטים',
    atLeastOne: 'לפחות פריט אחד יהיה פגום',
    event: 'לפחות פריט אחד פגום',
  },
  {
    setup: (n: number) => `מטילים קובייה הוגנת ${n} פעמים.`,
    success: 'הצלחה',
    trial: 'הטלה',
    trials: 'הטלות',
    atLeastOne: 'תתקבל לפחות הצלחה אחת',
    event: 'לפחות הצלחה אחת',
  },
  {
    setup: (n: number) => `נשלחות ${n} הודעות ללקוחות.`,
    success: 'מענה',
    trial: 'הודעה',
    trials: 'הודעות',
    atLeastOne: 'לפחות לקוח אחד יענה',
    event: 'לפחות מענה אחד',
  },
] as const;

/**
 * "לפחות אחד" — the complement, in the one place students most reliably try to
 * sum the terms instead. The correct answer is one line; the wrong path is five.
 */
const prAtLeastOne: GenTemplate = {
  id: 'pr-bernoulli-at-least-one',
  distractorTags: [null, 'complement-skipped', 'partial-answer', 'complement-skipped'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'pr-bernoulli',
  title: 'לפחות הצלחה אחת — דרך המשלים',
  skill: 'complement',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const [pn, pd] = rng.pick(P_VALUES.filter(([n, d]) => n / d <= 0.5));
    const p = new Frac(pn, pd);
    const q = p.comp();
    const n = rng.int(difficulty === 'easy' ? 3 : 5, difficulty === 'hard' ? 12 : 8);

    const answer = q.pow(n).comp();
    const noneAtAll = q.pow(n);                      // answered P(X = 0)
    const exactlyOne = new Frac(n).mul(p).mul(q.pow(n - 1));
    // Raised the SUCCESS probability instead of the failure probability. The
    // obvious fourth distractor is `n · p`, but that exceeds 1 for most draws,
    // and requiring every option to be a legal probability then rejected the
    // whole draw — which is what collapsed this template's variety to 19
    // questions in 60 seeds. This mistake is just as common and stays in range.
    const wrongBase = p.pow(n).comp();

    const opts = [answer, noneAtAll, exactlyOne, wrongBase];
    if (!valid(...opts)) return null;
    const shown = opts.map((f) => `$${dec(f)}$`);
    if (new Set(shown).size !== 4) return null;

    const sc = rng.pick(AT_LEAST_SCENARIOS);

    return mcq({
      question: `${sc.setup(n)} ההסתברות ל${sc.success} בכל ${sc.trial} היא $${p.tex()}$, וה${sc.trials} בלתי תלויים זה בזה. מה ההסתברות ש${sc.atLeastOne}? עגל לארבע ספרות אחרי הנקודה.`,
      answers: shown,
      correct: 0,
      distractorNotes: [
        '',
        `זוהי ההסתברות שאף ${sc.trial} לא תצליח, כלומר המאורע המשלים. נשאר לחסר אותה מ-$1$.`,
        `זוהי ההסתברות להצלחה אחת בדיוק. "לפחות אחת" כולל גם שתיים, שלוש וכן הלאה עד $${n}$.`,
        `כאן הועלתה בחזקה הסתברות ההצלחה $${p.tex()}$ במקום הסתברות הכישלון $${q.tex()}$. המאורע המשלים ל"לפחות אחת" הוא שכל ה${sc.trials} נכשלים, ולכן מה שמועלה בחזקה הוא הכישלון.`,
      ],
      hint: 'מהו המאורע המשלים ל"לפחות אחת"? הוא דורש חישוב אחד בלבד.',
      solution: {
        steps: [
          '**הכלל:** מבוקשת הסתברות של "לפחות אחת", שהיא איחוד של הרבה מקרים, ולכן עוברים למאורע המשלים "אף אחת" שהוא מקרה יחיד, ומשתמשים ב$P(X \\ge 1) = 1 - P(X = 0)$.',
          `הסתברות הכישלון ב${sc.trial} בודדת היא $1 - ${p.tex()} = ${q.tex()}$.`,
          `כל $${n}$ ה${sc.trials} נכשלים בהסתברות $(${q.tex()})^{${n}} = ${noneAtAll.tex()}$.`,
          'מחסרים מ-$1$.',
        ],
        finalAnswer: `P(${sc.event}) $= ${answer.tex()} \\approx ${dec(answer)}$`,
        explanation: '"לפחות אחד" כמעט תמיד קצר יותר דרך המשלים: מחשבים את ההסתברות שאף חזרה לא הצליחה, ומחסרים אותה מ-$1$.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 6 · pr-tree (hard) — total probability, the Bayes set-up
// ---------------------------------------------------------------------------

const prTotalProbability: GenTemplate = {
  id: 'pr-total-probability',
  distractorTags: [null, 'partial-answer', 'formula-mismatch', 'dropped-factor'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'pr-tree',
  title: 'הסתברות כוללת על פני שני מסלולים',
  skill: 'conditional',
  difficulties: ['hard'],
  build(rng) {
    const share = new Frac(rng.int(2, 8), 10);
    const rate1 = new Frac(rng.int(1, 9), 10);
    const rate2 = new Frac(rng.int(1, 9), 10);
    if (rate1.eq(rate2)) return null;

    const branch1 = share.mul(rate1);
    const branch2 = share.comp().mul(rate2);
    const answer = branch1.add(branch2);
    const onlyOne = branch1;
    const averaged = rate1.add(rate2).div(new Frac(2));
    const summedRates = rate1.add(rate2);

    const opts = [answer, onlyOne, averaged, summedRates];
    if (!valid(...opts)) return null;
    if (new Set(opts.map((f) => f.tex())).size !== 4) return null;

    const pct = (f: Frac) => `${Math.round(f.value * 100)}\\%`;

    return mcq({
      question: `מפעל מייצר נורות בשני קווי ייצור. קו א מייצר $${pct(share)}$ מהנורות והשאר מיוצר בקו ב. בקו א $${pct(rate1)}$ מהנורות תקינות, ובקו ב $${pct(rate2)}$ מהנורות תקינות. בוחרים נורה באקראי מכלל התוצרת. מה ההסתברות שהיא תקינה?`,
      answers: opts.map(tex),
      correct: 0,
      distractorNotes: [
        '',
        'זהו הענף של קו א בלבד. נורה תקינה יכולה להגיע גם מקו ב, ולכן מחברים את שני הענפים.',
        'זהו ממוצע פשוט של שני האחוזים. הקווים אינם מייצרים כמויות שוות, ולכן כל קו נכנס לחישוב לפי המשקל שלו בתוצרת.',
        `זהו סכום שני האחוזים בלי המשקלות. תוצאה כזו יכולה לעבור את $1$, וזה סימן מיידי שהחישוב שגוי.`,
      ],
      hint: 'שני מסלולים בעץ מובילים אל "נורה תקינה". מה עושים לאורך כל מסלול, ומה עושים ביניהם?',
      solution: {
        steps: [
          '**הכלל:** המאורע יכול להתרחש בכמה מסלולים זרים בעץ, ולכן משתמשים בנוסחת ההסתברות הכוללת $P(A) = P(A|B) \\cdot P(B) + P(A|\\bar B) \\cdot P(\\bar B)$, כלומר מכפילים לאורך כל מסלול ומחברים בין המסלולים.',
          `מסלול קו א: $${share.tex()} \\cdot ${rate1.tex()} = ${branch1.tex()}$.`,
          `מסלול קו ב: חלקו בתוצרת הוא $1 - ${share.tex()} = ${share.comp().tex()}$, ולכן $${share.comp().tex()} \\cdot ${rate2.tex()} = ${branch2.tex()}$.`,
          'מחברים את שני המסלולים.',
        ],
        finalAnswer: `P(הנורה תקינה) $= ${answer.tex()}$`,
        explanation: 'הסתברות כוללת: מכפילים לאורך כל ענף, מחברים בין ענפים מקבילים.',
      },
    });
  },
};

export const PROBABILITY_TEMPLATES: GenTemplate[] = [
  prUnion,
  prCounting,
  prTwoDraws,
  prTable,
  prConditional,
  prBernoulliExact,
  prAtLeastOne,
  prTotalProbability,
];
