/**
 * generator/templates/sequences.ts — parameterised repair questions for סדרות.
 *
 * Every template here obeys the repo's authored-content rules, because a
 * generated question is served through the same runner, help ladder and tutor
 * as a hand-written one and a student cannot tell the difference:
 *
 *   · `solution.steps[0]` opens with `**הכלל:**` and names BOTH the formula and
 *     the trigger in the wording that selects it (feedback_rule_line_standard),
 *     and never contains the final answer (`leaksAnswer`).
 *   · a given sequence is stated as `a_1` plus `d`/`q` with the first terms
 *     spelled out, never as a bare list of numbers
 *     (feedback_sequence_given_as_a1_d).
 *   · no Hebrew inside `$…$` — KaTeX has no bidi and renders it reversed.
 *   · no maqaf or em-dash immediately before a math island; both read as a
 *     minus sign in RTL (feedback_dash_clutter_rtl).
 *   · a question asking for two quantities uses `answerLabels` aligned with
 *     `expected.values` (feedback_multi_quantity_answer_boxes).
 *
 * Distractors are not noise. Each one is a REAL mistake with a named cause, and
 * `distractorNotes` explains that cause — which is what makes a generated
 * question usable by `lib/tutor-local` for free, no-API "למה טעיתי?" feedback.
 *
 * Sub-topics with no template here (`ar-practice`, `ge-practice`, `induction`)
 * fall back to the authored bank: multi-part bagrut questions and induction
 * proofs are not parameterisable into a single-answer item without becoming
 * something other than what they teach.
 */

import type { PracticeQuestion } from '@/content/lessons/types';
import { Frac, type Rng } from '../rng';
import { mcq, open } from './shared';
import type { GenTemplate } from '../types';

const TOPIC = 'סדרות';
const SUBJECT = 'math5';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * "נתון האיבר הראשון $a_1 = 5$ וההפרש $d = 4$, כך שהסדרה נראית $5, 9, 13, 17, \ldots$"
 *
 * The spelled-out opening terms are not decoration: a student who mis-reads the
 * question as geometric catches it here, and a bare `a_1`/`d` pair gives them
 * nothing to catch it with.
 */
function arGiven(a1: number, d: number): string {
  const terms = [0, 1, 2, 3].map((k) => a1 + k * d).join(', ');
  return `נתון האיבר הראשון $a_1 = ${a1}$ וההפרש $d = ${d}$, כך שהסדרה נראית $${terms}, \\ldots$`;
}

function geGiven(a1: number, q: Frac): string {
  const terms = [0, 1, 2, 3].map((k) => new Frac(a1).mul(q.pow(k)).tex()).join(', ');
  return `נתון האיבר הראשון $a_1 = ${a1}$ והמנה $q = ${q.tex()}$, כך שהסדרה נראית $${terms}, \\ldots$`;
}

/** Non-zero integer in [lo, hi] with `avoid` excluded. */
function pickD(rng: Rng, lo: number, hi: number, avoid: number[] = []): number {
  for (let i = 0; i < 20; i++) {
    const d = rng.int(lo, hi);
    if (d !== 0 && !avoid.includes(d)) return d;
  }
  return 0;
}

const money = (n: number) => n.toLocaleString('en-US');

// ---------------------------------------------------------------------------
// 1 · ar-general-term — the general term of an arithmetic sequence
// ---------------------------------------------------------------------------

/**
 * The `n` vs `n-1` family. Every distractor below is one specific index slip,
 * which is why this template is the single best diagnostic for `index-offset`.
 */
const arNth: GenTemplate = {
  id: 'seq-ar-nth',
  distractorTags: [null, 'index-offset', 'index-offset', 'dropped-factor'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ar-general-term',
  title: 'איבר כללי בסדרה חשבונית',
  skill: 'index-offset',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const a1 = rng.int(2, 12) * (difficulty === 'easy' ? 1 : rng.chance(0.3) ? -1 : 1);
    const d = pickD(rng, difficulty === 'easy' ? 2 : -9, difficulty === 'easy' ? 9 : 11, [0, 1, -1]);
    const n = rng.int(difficulty === 'easy' ? 8 : 14, difficulty === 'easy' ? 20 : 34);

    const an = a1 + (n - 1) * d;
    const offByOne = a1 + n * d;        // multiplied d by n instead of n-1
    const oneShort = a1 + (n - 2) * d;  // stopped one term early
    const forgotA1 = (n - 1) * d;       // added the differences, dropped a_1

    const answers = [`$${an}$`, `$${offByOne}$`, `$${oneShort}$`, `$${forgotA1}$`];
    return mcq({
      question: `בסדרה חשבונית ${arGiven(a1, d)} מהו האיבר שבמקום $${n}$?`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        `כאן $d$ הוכפל ב-$${n}$ במקום ב-$${n - 1}$. מהאיבר הראשון אל האיבר שבמקום $${n}$ עושים $${n - 1}$ צעדים בלבד, ולכן התוספת היא $${n - 1} \\cdot ${d} = ${(n - 1) * d}$.`,
        `זהו $a_{${n - 1}}$, איבר אחד לפני המבוקש. השלמת הצעד החסר מוסיפה עוד $${d}$ ומגיעה אל $${an}$.`,
        `כאן נספרו ההפרשים בלבד והאיבר הראשון נשכח. הנוסחה מתחילה מ$a_1$ ומוסיפה עליו את ההפרשים, כלומר $${a1} + ${(n - 1) * d}$.`,
      ],
      hint: `כמה צעדים של $d$ יש מהאיבר הראשון אל האיבר שבמקום $${n}$? לא $${n}$.`,
      solution: {
        steps: [
          '**הכלל:** מבקשים איבר במקום מסוים כשנתונים האיבר הראשון וההפרש, ולכן מציבים ישירות בנוסחת האיבר הכללי $a_n = a_1 + (n-1)d$.',
          `נתון: האיבר הראשון $a_1 = ${a1}$ וההפרש $d = ${d}$, והמקום המבוקש הוא $n = ${n}$.`,
          `$a_{${n}} = ${a1} + (${n} - 1) \\cdot (${d}) = ${a1} + ${(n - 1) * d}$.`,
        ],
        finalAnswer: `$a_{${n}} = ${an}$`,
        explanation: 'נוסחת האיבר הכללי של סדרה חשבונית: $a_n = a_1 + (n-1)d$.',
      },
    });
  },
};

/**
 * The inverse: two terms are given and both `a_1` and `d` are asked for. Two
 * quantities, so two labelled boxes graded as an ordered tuple.
 */
const arFindD: GenTemplate = {
  id: 'seq-ar-find-d',
  wrongAnswerTags: ['index-offset', 'index-offset'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ar-general-term',
  title: 'חילוץ ההפרש והאיבר הראשון משני איברים',
  skill: 'equation-solving',
  difficulties: ['mid', 'hard'],
  build(rng, difficulty) {
    const a1 = rng.int(-8, 14);
    const d = pickD(rng, -8, 10, [0, 1, -1]);
    const m = rng.int(3, 7);
    const k = m + rng.int(difficulty === 'hard' ? 5 : 3, difficulty === 'hard' ? 13 : 8);

    const am = a1 + (m - 1) * d;
    const ak = a1 + (k - 1) * d;
    if (am === ak) return null;

    return open({
      question: `בסדרה חשבונית נתון $a_{${m}} = ${am}$ וגם $a_{${k}} = ${ak}$. מצא את ההפרש $d$ ואת האיבר הראשון $a_1$.`,
      answerLabels: ['d', 'a₁'],
      expected: { kind: 'set', values: [String(d), String(a1)] },
      wrongAnswers: [
        {
          value: String(new Frac(ak - am, k - m + 1).expr()),
          note: `חולקת ב-$${k - m + 1}$ במקום ב-$${k - m}$. בין המקום $${m}$ למקום $${k}$ יש $${k - m}$ הפרשים, כי סופרים צעדים ולא איברים.`,
        },
        {
          value: String(a1 + d),
          note: `זהו $a_2$ ולא $a_1$. אחרי שמצאת את $d$, חזרה מ$a_{${m}}$ אחורה דורשת $${m - 1}$ צעדים, לא $${m - 2}$.`,
        },
      ],
      hint: `כמה הפרשים של $d$ מפרידים בין המקום $${m}$ למקום $${k}$?`,
      solution: {
        steps: [
          '**הכלל:** נתונים שני איברים ומבוקש ההפרש, ולכן משתמשים בכך שההפרש בין שני איברים שווה למספר הצעדים ביניהם כפול $d$, כלומר $a_k - a_m = (k-m)d$.',
          `בין המקום $${m}$ למקום $${k}$ יש $${k} - ${m} = ${k - m}$ צעדים, ולכן $${ak} - (${am}) = ${k - m}d$.`,
          `$${ak - am} = ${k - m}d$, ומכאן $d = ${d}$.`,
          `כעת מציבים באיבר הידוע: $a_{${m}} = a_1 + ${m - 1}d$, כלומר $${am} = a_1 + ${m - 1} \\cdot (${d})$.`,
        ],
        finalAnswer: `$d = ${d}$, $a_1 = ${a1}$`,
        explanation: 'ההפרש בין שני איברים בסדרה חשבונית: $a_k - a_m = (k-m)d$.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 2 · ar-recursion-sums — sums, and the recursion rule
// ---------------------------------------------------------------------------

const arSum: GenTemplate = {
  id: 'seq-ar-sum',
  distractorTags: [null, 'index-offset', 'dropped-factor', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ar-recursion-sums',
  title: 'סכום איברים ראשונים בסדרה חשבונית',
  skill: 'sum-formula',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const a1 = rng.int(1, 12) * (difficulty === 'easy' ? 1 : rng.chance(0.25) ? -1 : 1);
    const d = pickD(rng, difficulty === 'easy' ? 2 : -7, difficulty === 'easy' ? 8 : 9, [0, 1, -1]);
    const n = rng.int(difficulty === 'easy' ? 6 : 10, difficulty === 'easy' ? 14 : 26);

    const an = a1 + (n - 1) * d;
    const sn = (n * (a1 + an)) / 2;
    const usedNd = (n * (2 * a1 + n * d)) / 2;      // (n-1)d written as nd
    const noHalf = n * (a1 + an);                    // forgot to halve
    const lastTermOnly = n * an;                     // n copies of the last term

    const answers = [`$${sn}$`, `$${usedNd}$`, `$${noHalf}$`, `$${lastTermOnly}$`];
    return mcq({
      question: `בסדרה חשבונית ${arGiven(a1, d)} חשב את $S_{${n}}$, סכום $${n}$ האיברים הראשונים.`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        `בתוך הסוגריים נכתב $${n}d$ במקום $(${n}-1)d$. הנוסחה סוכמת עד האיבר שבמקום $${n}$, והמרחק אליו מהאיבר הראשון הוא $${n - 1}$ צעדים.`,
        `זהו הסכום בלי החלוקה ב-$2$. הנוסחה מזווגת ראשון עם אחרון ומקבלת $${n}$ זוגות שכל אחד שווה $${a1 + an}$, ולכן חייבים לחלק בשניים.`,
        `כאן כל $${n}$ האיברים הוחלפו באיבר האחרון $a_{${n}} = ${an}$. האיברים אינם שווים זה לזה, ולכן סוכמים ממוצע של הראשון והאחרון ולא את האחרון $${n}$ פעמים.`,
      ],
      hint: 'קודם האיבר האחרון $a_n$, ורק אחר כך הסכום. איזו משתי צורות הנוסחה נוחה כאן?',
      solution: {
        steps: [
          '**הכלל:** מבוקש סכום של איברים ראשונים בסדרה חשבונית, ולכן משתמשים בנוסחת הסכום $S_n = \\dfrac{(a_1 + a_n) \\cdot n}{2}$, ומכיוון שהאיבר האחרון אינו נתון מחשבים אותו קודם לפי $a_n = a_1 + (n-1)d$.',
          `$a_{${n}} = ${a1} + (${n} - 1) \\cdot (${d}) = ${an}$.`,
          `$S_{${n}} = \\dfrac{(${a1} + ${an}) \\cdot ${n}}{2} = \\dfrac{${a1 + an} \\cdot ${n}}{2}$.`,
        ],
        finalAnswer: `$S_{${n}} = ${sn}$`,
        explanation: 'נוסחת הסכום: $S_n = \\dfrac{(a_1+a_n)n}{2}$, ובצורה השנייה $S_n = \\dfrac{(2a_1+(n-1)d)n}{2}$.',
      },
    });
  },
};

const arRecursion: GenTemplate = {
  id: 'seq-ar-recursion',
  wrongAnswerTags: ['index-offset', 'operation-swap'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ar-recursion-sums',
  title: 'מכלל נסיגה אל האיבר הכללי',
  skill: 'formula-choice',
  difficulties: ['mid', 'hard'],
  build(rng, difficulty) {
    const a1 = rng.int(-6, 12);
    const d = pickD(rng, -8, 9, [0, 1, -1]);
    const n = rng.int(difficulty === 'hard' ? 18 : 9, difficulty === 'hard' ? 40 : 22);
    const an = a1 + (n - 1) * d;
    const sign = d > 0 ? '+' : '-';
    const absD = Math.abs(d);

    // The "treated the recursion as multiplicative" wrong answer must not land
    // ON the correct one, or a student who is right is told they multiplied.
    if (a1 * d === an || a1 + n * d === an) return null;

    return open({
      question: `סדרה מוגדרת בכלל הנסיגה $a_{n+1} = a_n ${sign} ${absD}$, והאיבר הראשון שלה הוא $a_1 = ${a1}$. מצא את $a_{${n}}$.`,
      expected: { kind: 'value', value: String(an) },
      wrongAnswers: [
        {
          value: String(a1 + n * d),
          note: `כלל הנסיגה הופעל $${n}$ פעמים במקום $${n - 1}$. מ$a_1$ אל $a_{${n}}$ מפעילים אותו $${n - 1}$ פעמים בלבד.`,
        },
        {
          value: String(a1 * d),
          note: 'כלל הנסיגה כאן מוסיף בכל צעד ואינו מכפיל, ולכן הסדרה חשבונית ולא הנדסית.',
        },
      ],
      hint: 'כלל נסיגה שמוסיף מספר קבוע בכל צעד מתאר בדיוק סדרה חשבונית. מהו $d$ שלה?',
      solution: {
        steps: [
          '**הכלל:** כלל הנסיגה מוסיף בכל צעד את אותו מספר קבוע, וזו בדיוק ההגדרה של סדרה חשבונית, ולכן ההפרש הוא אותו מספר ומציבים בנוסחת האיבר הכללי $a_n = a_1 + (n-1)d$.',
          `מהכלל $a_{n+1} - a_n = ${d}$, ולכן $d = ${d}$.`,
          `$a_{${n}} = ${a1} + (${n} - 1) \\cdot (${d}) = ${a1} + ${(n - 1) * d}$.`,
        ],
        finalAnswer: `$a_{${n}} = ${an}$`,
        explanation: 'כלל נסיגה מהצורה $a_{n+1} = a_n + c$ מגדיר סדרה חשבונית שהפרשה $d = c$.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 3 · ar-positions-sums — even/odd positions
// ---------------------------------------------------------------------------

/**
 * Terms at even positions form an arithmetic sequence of their own, with first
 * term `a_2` and difference `2d`. Seeing that is the whole skill; the
 * distractors are the three ways students miss it.
 */
const arEvenPositions: GenTemplate = {
  id: 'seq-ar-even-positions',
  distractorTags: [null, 'formula-mismatch', 'index-offset', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ar-positions-sums',
  title: 'סכום איברים במקומות זוגיים',
  skill: 'sum-formula',
  difficulties: ['mid', 'hard'],
  build(rng, difficulty) {
    const a1 = rng.int(1, 10);
    const d = pickD(rng, 2, difficulty === 'hard' ? 9 : 6, [0, 1]);
    const k = rng.int(difficulty === 'hard' ? 8 : 5, difficulty === 'hard' ? 15 : 10);

    // The even-position terms: b_1 = a_2, difference 2d, k of them.
    const b1 = a1 + d;
    const bk = b1 + (k - 1) * 2 * d;
    const sum = (k * (b1 + bk)) / 2;
    const wrongD = (k * (2 * b1 + (k - 1) * d)) / 2;         // kept d instead of 2d
    const startedAtA1 = (k * (2 * a1 + (k - 1) * 2 * d)) / 2; // started from a_1
    const allTerms = (2 * k * (2 * a1 + (2 * k - 1) * d)) / 2; // summed everything

    const answers = [`$${sum}$`, `$${wrongD}$`, `$${startedAtA1}$`, `$${allTerms}$`];
    return mcq({
      question: `בסדרה חשבונית ${arGiven(a1, d)} חשב את סכום $${k}$ האיברים הראשונים שנמצאים במקומות הזוגיים, כלומר $a_2 + a_4 + \\ldots + a_{${2 * k}}$.`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        `כאן ההפרש נשאר $${d}$. בין $a_2$ ל$a_4$ מדלגים על איבר אחד, ולכן ההפרש בסדרה החדשה הוא $2d = ${2 * d}$.`,
        `הסכום התחיל מ$a_1$ ולא מ$a_2$. האיבר הראשון במקומות הזוגיים הוא $a_2 = ${b1}$.`,
        `זהו סכום כל $${2 * k}$ האיברים, הזוגיים והאי-זוגיים יחד. השאלה מבקשת רק את מחציתם.`,
      ],
      hint: 'האיברים במקומות הזוגיים מרכיבים סדרה חשבונית בפני עצמה. מהו האיבר הראשון שלה ומהו ההפרש שלה?',
      solution: {
        steps: [
          '**הכלל:** איברים שנלקחים כל שני מקומות מרכיבים בעצמם סדרה חשבונית חדשה, ולכן מזהים את האיבר הראשון שלה ואת ההפרש שלה ואז מציבים בנוסחת הסכום $S_k = \\dfrac{(2b_1 + (k-1)D)k}{2}$.',
          `האיבר הראשון בסדרה החדשה הוא $b_1 = a_2 = ${b1}$, וההפרש שלה הוא $D = 2d = ${2 * d}$, כי בין מקום זוגי למקום הזוגי שאחריו יש שני צעדים.`,
          `$S_{${k}} = \\dfrac{(2 \\cdot ${b1} + (${k} - 1) \\cdot ${2 * d}) \\cdot ${k}}{2}$.`,
        ],
        finalAnswer: `$${sum}$`,
        explanation: 'תת-סדרה של כל איבר שני בסדרה חשבונית היא חשבונית עם הפרש $2d$.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 4 · ge-general-term — geometric general term
// ---------------------------------------------------------------------------

/** Quotients kept small and exact so every term stays writable as a fraction. */
const Q_INT = [2, 3, 4, 5, -2, -3] as const;
const Q_FRAC: [number, number][] = [[1, 2], [1, 3], [2, 3], [3, 2], [1, 4], [3, 4]];

const geNth: GenTemplate = {
  id: 'seq-ge-nth',
  distractorTags: [null, 'index-offset', 'index-offset', 'operation-swap'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ge-general-term',
  title: 'איבר כללי בסדרה הנדסית',
  skill: 'index-offset',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const q = new Frac(rng.pick(Q_INT));
    const a1 = rng.int(1, 9);
    const n = difficulty === 'easy' ? rng.int(4, 6) : rng.int(6, 9);

    const an = new Frac(a1).mul(q.pow(n - 1));
    const offByOne = new Frac(a1).mul(q.pow(n));
    const oneShort = new Frac(a1).mul(q.pow(n - 2));
    const multiplied = new Frac(a1 * (n - 1)).mul(q); // treated it as arithmetic-ish

    const answers = [`$${an.tex()}$`, `$${offByOne.tex()}$`, `$${oneShort.tex()}$`, `$${multiplied.tex()}$`];
    return mcq({
      question: `בסדרה הנדסית ${geGiven(a1, q)} מהו האיבר שבמקום $${n}$?`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        `החזקה כאן היא $${n}$ במקום $${n - 1}$. מהאיבר הראשון אל האיבר שבמקום $${n}$ מכפילים ב$q$ בדיוק $${n - 1}$ פעמים.`,
        `זהו $a_{${n - 1}}$, איבר אחד לפני המבוקש. הכפלה נוספת ב-$${q.tex()}$ מגיעה אל התשובה.`,
        `כאן $q$ הוכפל במקום להיות מועלה בחזקה. בסדרה הנדסית כל צעד מכפיל, ולכן $${n - 1}$ צעדים נותנים $q^{${n - 1}}$ ולא $${n - 1}q$.`,
      ],
      hint: `בכמה צעדים של הכפלה ב$q$ מגיעים מ$a_1$ אל האיבר שבמקום $${n}$?`,
      solution: {
        steps: [
          '**הכלל:** מבקשים איבר במקום מסוים בסדרה שבה כל צעד מכפיל במספר קבוע, ולכן מציבים בנוסחת האיבר הכללי של סדרה הנדסית $a_n = a_1 \\cdot q^{\\,n-1}$.',
          `נתון: $a_1 = ${a1}$ והמנה $q = ${q.tex()}$, והמקום המבוקש הוא $n = ${n}$.`,
          `$a_{${n}} = ${a1} \\cdot (${q.tex()})^{${n - 1}}$.`,
        ],
        finalAnswer: `$a_{${n}} = ${an.tex()}$`,
        explanation: 'נוסחת האיבר הכללי של סדרה הנדסית: $a_n = a_1 q^{\\,n-1}$.',
      },
    });
  },
};

const geFindQ: GenTemplate = {
  id: 'seq-ge-find-q',
  wrongAnswerTags: ['exponent-slip', 'operation-swap'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ge-general-term',
  title: 'חילוץ המנה משני איברים',
  skill: 'equation-solving',
  difficulties: ['mid', 'hard'],
  build(rng, difficulty) {
    const q = rng.int(2, difficulty === 'hard' ? 5 : 4);
    const a1 = rng.int(2, 9);
    const gap = difficulty === 'hard' ? rng.int(3, 4) : rng.int(2, 3);
    const m = rng.int(1, 3);
    const k = m + gap;

    const am = a1 * q ** (m - 1);
    const ak = a1 * q ** (k - 1);
    if (ak > 200000) return null;
    const ratio = ak / am;

    return open({
      question: `בסדרה הנדסית עולה נתון $a_{${m}} = ${am}$ וגם $a_{${k}} = ${ak}$. מצא את המנה $q$.`,
      expected: { kind: 'value', value: String(q) },
      wrongAnswers: [
        {
          value: String(ratio),
          note: `זהו היחס $\\dfrac{a_{${k}}}{a_{${m}}} = ${ratio}$ עצמו, שהוא $q^{${gap}}$ ולא $q$. היחס נפרס על $${gap}$ צעדים, ולכן מחלצים ממנו שורש מסדר $${gap}$.`,
        },
        {
          value: String(ak - am),
          note: 'חיסור מתאים לסדרה חשבונית. בסדרה הנדסית המעבר בין איברים הוא חילוק, ולכן מחשבים יחס ולא הפרש.',
        },
      ],
      hint: `בכמה צעדים של הכפלה עוברים מהמקום $${m}$ למקום $${k}$? היחס בין האיברים שווה ל$q$ בחזקת מספר הצעדים.`,
      solution: {
        steps: [
          '**הכלל:** נתונים שני איברים בסדרה הנדסית ומבוקשת המנה, ולכן משתמשים בכך שהיחס בין שני איברים שווה ל$q$ בחזקת מספר הצעדים ביניהם, כלומר $\\dfrac{a_k}{a_m} = q^{\\,k-m}$.',
          `בין המקום $${m}$ למקום $${k}$ יש $${k} - ${m} = ${gap}$ צעדים, ולכן $\\dfrac{${ak}}{${am}} = q^{${gap}}$.`,
          `$q^{${gap}} = ${ratio}$, והסדרה עולה ולכן לוקחים את הפתרון החיובי.`,
        ],
        finalAnswer: `$q = ${q}$`,
        explanation: 'היחס בין שני איברים בסדרה הנדסית: $\\dfrac{a_k}{a_m} = q^{\\,k-m}$.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 5 · ge-proof-sum — the finite geometric sum
// ---------------------------------------------------------------------------

const geSum: GenTemplate = {
  id: 'seq-ge-sum',
  distractorTags: [null, 'dropped-factor', 'index-offset', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ge-proof-sum',
  title: 'סכום איברים ראשונים בסדרה הנדסית',
  skill: 'sum-formula',
  difficulties: ['mid', 'hard'],
  build(rng, difficulty) {
    const q = rng.int(2, difficulty === 'hard' ? 4 : 3);
    const a1 = rng.int(1, 8);
    const n = rng.int(4, difficulty === 'hard' ? 9 : 7);

    const qn = q ** n;
    const sn = (a1 * (qn - 1)) / (q - 1);
    if (!Number.isInteger(sn) || sn > 500000) return null;

    const withoutMinus = (a1 * qn) / (q - 1);            // dropped the -1 on top
    const nMinusOne = (a1 * (q ** (n - 1) - 1)) / (q - 1); // summed one term too few
    const lastTerm = a1 * q ** (n - 1);                    // gave a_n, not S_n

    // Every option must be a whole number. `withoutMinus` divides by `q-1`
    // without the `-1` on top and lands on 152917.33333333334 for some draws —
    // a float artefact that is not a mistake any student makes, and that reads
    // as a typo rather than as a wrong answer.
    if (![withoutMinus, nMinusOne, lastTerm].every(Number.isInteger)) return null;
    const answers = [`$${sn}$`, `$${withoutMinus}$`, `$${nMinusOne}$`, `$${lastTerm}$`];

    return mcq({
      question: `בסדרה הנדסית ${geGiven(a1, new Frac(q))} חשב את $S_{${n}}$, סכום $${n}$ האיברים הראשונים.`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        `במונה נכתב $q^n$ בלי החיסור של $1$. הנוסחה היא $\\dfrac{a_1(q^n - 1)}{q - 1}$, והחיסור הזה הוא מה שמסלק את האיבר שמעבר לסדרה.`,
        `החזקה במונה היא $${n - 1}$ במקום $${n}$, כלומר נסכם רק $${n - 1}$ איברים. מספר האיברים בסכום נכנס לחזקה כמו שהוא.`,
        `זהו האיבר האחרון $a_{${n}}$ ולא הסכום. השאלה מבקשת את סכום כל $${n}$ האיברים.`,
      ],
      hint: 'שים לב מה נכנס לחזקה במונה: מספר האיברים, או המקום של האחרון פחות אחד?',
      solution: {
        steps: [
          '**הכלל:** מבוקש סכום של איברים ראשונים בסדרה שבה כל צעד מכפיל במספר קבוע, ולכן משתמשים בנוסחת הסכום של סדרה הנדסית $S_n = \\dfrac{a_1(q^n - 1)}{q - 1}$, המתאימה למקרה $q \\ne 1$.',
          `נתון: $a_1 = ${a1}$, $q = ${q}$ ומספר האיברים הוא $n = ${n}$.`,
          `$S_{${n}} = \\dfrac{${a1}(${q}^{${n}} - 1)}{${q} - 1} = \\dfrac{${a1} \\cdot ${qn - 1}}{${q - 1}}$.`,
        ],
        finalAnswer: `$S_{${n}} = ${sn}$`,
        explanation: 'נוסחת הסכום ההנדסי: $S_n = \\dfrac{a_1(q^n-1)}{q-1}$ עבור $q \\ne 1$.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 6 · ge-infinite — convergence and the infinite sum
// ---------------------------------------------------------------------------

const geInfinite: GenTemplate = {
  id: 'seq-ge-infinite',
  distractorTags: [null, 'sign-slip', 'formula-mismatch', 'dropped-factor'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'ge-infinite',
  title: 'סכום סדרה הנדסית אינסופית',
  skill: 'convergence',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const [qn, qd] = rng.pick(Q_FRAC.filter(([n, d]) => n < d));
    const q = new Frac(difficulty === 'hard' && rng.chance(0.4) ? -qn : qn, qd);
    const a1 = rng.int(2, 24);

    const s = new Frac(a1).div(q.comp());
    const wrongSign = new Frac(a1).div(new Frac(1).add(q));  // 1+q instead of 1-q
    const flipped = q.comp().div(new Frac(a1));               // inverted the fraction
    const noA1 = new Frac(1).div(q.comp());                   // dropped a_1

    const answers = [`$${s.tex()}$`, `$${wrongSign.tex()}$`, `$${flipped.tex()}$`, `$${noA1.tex()}$`];
    return mcq({
      question: `בסדרה הנדסית אינסופית ${geGiven(a1, q)} חשב את סכום כל איברי הסדרה.`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        `במכנה נכתב $1 + q$ במקום $1 - q$. הנוסחה היא $S = \\dfrac{a_1}{1-q}$, והסימן שם קובע: מנה חיובית מקטינה את המכנה ולכן מגדילה את הסכום.`,
        'המונה והמכנה התהפכו. במונה יושב האיבר הראשון ובמכנה יושב $1-q$.',
        `האיבר הראשון $a_1 = ${a1}$ נשמט מהמונה. הסכום גדל פי $a_1$ ביחס לסדרה שמתחילה ב-$1$.`,
      ],
      hint: `בדוק קודם שהסדרה מתכנסת. האם $|q| < 1$ כאן? ורק אז הצב בנוסחה.`,
      solution: {
        steps: [
          '**הכלל:** מבוקש סכום של סדרה הנדסית אינסופית, ולכן בודקים תחילה שהסדרה מתכנסת בתנאי $|q| < 1$, ורק אז מציבים בנוסחת הסכום האינסופי $S = \\dfrac{a_1}{1-q}$.',
          `כאן $|q| = ${new Frac(Math.abs(q.n), q.d).tex()} < 1$, ולכן הסדרה מתכנסת ולסכום יש משמעות.`,
          `$S = \\dfrac{${a1}}{1 - (${q.tex()})} = \\dfrac{${a1}}{${q.comp().tex()}}$.`,
        ],
        finalAnswer: `$S = ${s.tex()}$`,
        explanation: 'סדרה הנדסית אינסופית מתכנסת אם ורק אם $|q| < 1$, ואז $S = \\dfrac{a_1}{1-q}$.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 7 · sequences-applications — compound interest
// ---------------------------------------------------------------------------

/**
 * The one place in the topic where the index offset has a concrete meaning:
 * the deposit is `a_1`, so after `t` years the balance is the term at position
 * `t + 1`. Writing `a_t` is the mistake, and it is worth a template of its own.
 */
const compoundInterest: GenTemplate = {
  id: 'seq-compound-interest',
  distractorTags: [null, 'index-offset', 'formula-mismatch', 'operation-swap'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'sequences-applications',
  title: 'ריבית דריבית כסדרה הנדסית',
  skill: 'substitution',
  difficulties: ['mid', 'hard'],
  build(rng, difficulty) {
    const principal = rng.int(2, 40) * 500;
    const pct = rng.pick([2, 3, 4, 5, 6, 8, 10]);
    const years = rng.int(difficulty === 'hard' ? 6 : 3, difficulty === 'hard' ? 12 : 7);
    const rate = 1 + pct / 100;

    const round2 = (x: number) => Math.round(x * 100) / 100;
    const value = round2(principal * rate ** years);
    const oneYearShort = round2(principal * rate ** (years - 1));
    const simple = round2(principal * (1 + (pct / 100) * years));
    const rateOnly = round2(principal * rate * years);

    const answers = [
      `$${money(value)}$ ש"ח`,
      `$${money(oneYearShort)}$ ש"ח`,
      `$${money(simple)}$ ש"ח`,
      `$${money(rateOnly)}$ ש"ח`,
    ];
    return mcq({
      question: `סכום של $${money(principal)}$ ש"ח הופקד בבנק בריבית שנתית של $${pct}\\%$, המצטברת בכל שנה על הסכום שהצטבר עד אליה. מה יהיה הסכום בתום $${years}$ שנים? עגל לשתי ספרות אחרי הנקודה.`,
      answers,
      correct: 0,
      distractorNotes: [
        '',
        `החזקה כאן היא $${years - 1}$ במקום $${years}$. הפיקדון הוא $a_1$, ולכן בתום $${years}$ שנים מדובר באיבר שבמקום $${years + 1}$, שהחזקה שלו היא $${years}$.`,
        `זהו חישוב של ריבית פשוטה, שבה הריבית מחושבת בכל שנה על הקרן המקורית בלבד. כאן הריבית מצטברת גם על הריבית, ולכן מכפילים בכל שנה ולא מוסיפים.`,
        `כאן מקדם הריבית הוכפל במספר השנים במקום להיות מועלה בחזקה. כל שנה מכפילה מחדש, ולכן $${years}$ שנים נותנות חזקה $${years}$ ולא מכפלה ב-$${years}$.`,
      ],
      hint: 'הפיקדון עצמו הוא האיבר הראשון בסדרה. באיזה מקום בסדרה נמצא הסכום בתום השנה האחרונה?',
      solution: {
        steps: [
          '**הכלל:** ריבית שמצטברת בכל שנה על הסכום שהצטבר עד אליה מכפילה את הסכום במספר קבוע בכל שנה, וזו בדיוק סדרה הנדסית, ולכן מציבים בנוסחה $a_n = a_1 q^{\\,n-1}$ כאשר $q$ הוא מקדם הריבית.',
          `הפיקדון הוא האיבר הראשון $a_1 = ${money(principal)}$, ומקדם הריבית הוא $q = 1 + ${pct / 100} = ${rate}$.`,
          `בתום $${years}$ שנים מדובר באיבר שבמקום $${years + 1}$, ולכן החזקה היא $${years}$ ומתקבל $${money(principal)} \\cdot ${rate}^{${years}}$.`,
        ],
        finalAnswer: `$${money(value)}$ ש"ח`,
        explanation: 'ריבית דריבית: הסכום בתום $t$ שנים הוא $P \\cdot (1+r)^t$.',
      },
    });
  },
};

export const SEQUENCES_TEMPLATES: GenTemplate[] = [
  arNth,
  arFindD,
  arSum,
  arRecursion,
  arEvenPositions,
  geNth,
  geFindQ,
  geSum,
  geInfinite,
  compoundInterest,
];
