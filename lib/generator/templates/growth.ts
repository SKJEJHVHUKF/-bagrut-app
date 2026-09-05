/**
 * generator/templates/growth.ts — parameterised repair questions for
 * גדילה ודעיכה (the model N(t) = N0·e^{kt}, sub-topics `gd-*`).
 *
 * Same contract as functions.ts: `**הכלל:**` opens every solution and never
 * contains the answer, no Hebrew inside `$…$`, every distractor is a NAMED
 * mistake with a note, and `build` is pure in (rng, difficulty).
 *
 * Numeric conventions of this topic: k is written as a decimal in the model
 * (`e^{0.05t}`), exact answers use `\ln` on screen and mathjs `log` in
 * `expected`. Every evaluated exponent is a small integer (|kt| ≤ 4) so the
 * answer is `N0·e^n`, never a rounded decimal.
 */

import { mcq, open } from './shared';
import type { GenTemplate } from '../types';

const TOPIC = 'גדילה ודעיכה';
const SUBJECT = 'math5';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Rates whose reciprocal is an integer, so `n / k` is a whole number of time units. */
const RATES = [0.02, 0.04, 0.05, 0.1, 0.2, 0.25, 0.5] as const;
const N0S = [50, 100, 200, 250, 300, 400, 500, 800, 1000, 1200, 1500, 2000] as const;

/** `e`, `e^{2}`, `e^{-3}` — the exponent as students write it. */
const ePow = (n: number) => (n === 1 ? 'e' : `e^{${n}}`);

/** `N0 e^{n}` as an option string: `$100e$`, `$500e^{2}$`. */
const nE = (N0: number, n: number) => `$${N0}${ePow(n)}$`;

type Ctx = { noun: string; unit: string };
const GROWTH_CTX: Ctx[] = [
  { noun: 'אוכלוסיית חיידקים בתרבית', unit: 'שעות' },
  { noun: 'אוכלוסיית עיר', unit: 'שנים' },
  { noun: 'אוכלוסיית דגים באגם', unit: 'חודשים' },
];
const DECAY_CTX: Ctx[] = [
  { noun: 'כמות של חומר רדיואקטיבי', unit: 'שנים' },
  { noun: 'כמות של תרופה בדם', unit: 'שעות' },
];

// ---------------------------------------------------------------------------
// 1 · gd-model — substituting t in the model
// ---------------------------------------------------------------------------

const evalModel: GenTemplate = {
  id: 'gd-eval-model',
  distractorTags: [null, 'dropped-factor', 'formula-mismatch', 'dropped-factor'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'gd-model',
  title: 'הצבת זמן במודל הגדילה',
  skill: 'substitution',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const decay = difficulty === 'hard';
    const n = difficulty === 'easy' ? 1 : rng.int(1, 3);
    const k = rng.pick(RATES);
    const t = Math.round(n / k);
    const N0 = rng.pick(N0S);
    const ctx = rng.pick(decay ? DECAY_CTX : GROWTH_CTX);
    const sgn = decay ? -1 : 1;
    const kt = `${decay ? '-' : ''}${k}t`;

    const right = nE(N0, sgn * n);
    const forgotT = `$${N0}e^{${decay ? '-' : ''}${k}}$`;
    const naive = `$${decay ? N0 / 2 : 2 * N0}$`;
    const forgotK = `$${N0}e^{${decay ? '-' : ''}${t}}$`;

    return mcq({
      question: `${ctx.noun} ${decay ? 'דועכת' : 'גדלה'} לפי $N(t) = ${N0}\\,e^{${kt}}$ ($t$ ב${ctx.unit}). מה גודלה אחרי $${t}$ ${ctx.unit}?`,
      answers: [right, forgotT, naive, forgotK],
      correct: 0,
      distractorNotes: [
        '',
        `הקצב $${k}$ נשאר לבדו במעריך בלי הכפלה בזמן. במודל $e^{kt}$ המעריך הוא מכפלה, ולכן אחרי $${t}$ ${ctx.unit} המעריך הוא $${sgn * k} \\cdot ${t} = ${sgn * n}$; זה שנכתב הוא הגודל אחרי יחידת זמן אחת.`,
        decay
          ? `זו הנחה שהכמות פשוט התחצתה. חצייה קורית רק כאשר $e^{${kt}} = \\dfrac{1}{2}$, ואין סיבה שזה יקרה דווקא אחרי $${t}$ ${ctx.unit}; ההצבה נותנת $${N0}e^{${-n}}$.`
          : `זו הנחה שהכמות פשוט הוכפלה. הכפלה קורית רק כאשר $e^{${kt}} = 2$, ואין סיבה שזה יקרה דווקא אחרי $${t}$ ${ctx.unit}; ההצבה נותנת $${N0}${ePow(n)}$.`,
        `הזמן הוצב במעריך אבל הקצב $${k}$ נשמט. המעריך הוא $kt$, כלומר $${sgn * k} \\cdot ${t}$, ולא $t$ לבדו.`,
      ],
      hint: 'חשב קודם את המעריך כולו, קצב כפול זמן, ורק אחר כך כתוב את החזקה.',
      solution: {
        steps: [
          '**הכלל:** מבוקש הגודל בזמן נתון, ולכן מציבים את הזמן במקום $t$ במודל $N(t) = N_0 e^{kt}$, והמעריך הוא מכפלת הקצב בזמן.',
          `**ההצבה:** $N(${t}) = ${N0}\\,e^{${sgn * k} \\cdot ${t}}$.`,
          `מחשבים את המעריך: $${sgn * k} \\cdot ${t} = ${sgn * n}$, ולכן $N(${t}) = ${N0}${ePow(sgn * n)}$.`,
        ],
        finalAnswer: right,
        explanation: 'המעריך הוא קצב כפול זמן; כשהוא יוצא שלם התשובה נשארת מדויקת בצורה של חזקה של e.',
      },
    });
  },
};

const findK: GenTemplate = {
  id: 'gd-find-k',
  wrongAnswerTags: ['exponent-slip', 'dropped-factor'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'gd-model',
  title: 'מציאת קצב הגדילה משתי מדידות',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    const m = rng.pick([2, 3, 4, 5, 6, 8, 9, 10]);
    const decay = difficulty === 'mid';
    const ctx = rng.pick(decay ? DECAY_CTX : GROWTH_CTX);

    if (difficulty === 'hard') {
      // Two readings, neither at t = 0: N(ta) = N0·m^j, N(tb) = N0·m^{j+1}.
      const d = rng.int(2, 6);
      const j = rng.int(1, 2);
      const ta = d * j;
      const tb = ta + d;
      const N0 = rng.pick([10, 20, 50, 100]);
      const Na = N0 * m ** j;
      const Nb = Na * m;
      return open({
        question: `${ctx.noun} גדלה לפי $N(t) = N_0 e^{kt}$ ($t$ ב${ctx.unit}). ידוע כי $N(${ta}) = ${Na}$ וכי $N(${tb}) = ${Nb}$. מצא את $k$.`,
        expected: { kind: 'value', value: `log(${m})/${d}` },
        wrongAnswers: [
          {
            value: `${m}/${d}`,
            note: `המנה $${m}$ הושוותה ישירות למעריך. מהמשוואה $e^{${d}k} = ${m}$ מורידים את המעריך בלוגריתם: $${d}k = \\ln ${m}$, ולא $${d}k = ${m}$.`,
          },
          {
            value: `log(${Nb})/${d}`,
            note: `הלוגריתם נלקח על המדידה השנייה בלי לחלק בראשונה. חלוקת שתי המשוואות מבטלת את $N_0$ ומשאירה $e^{${d}k} = \\dfrac{${Nb}}{${Na}} = ${m}$.`,
          },
        ],
        hint: 'חלק את המשוואה של הזמן המאוחר במשוואה של הזמן המוקדם. הגודל ההתחלתי מתקצר.',
        solution: {
          steps: [
            '**הכלל:** כשנתונות שתי מדידות ואף אחת אינה בזמן אפס, מחלקים את שתי המשוואות זו בזו כדי לבטל את $N_0$, ואת המעריך שנשאר מורידים בלוגריתם טבעי.',
            `**ההצבה:** $N_0 e^{${ta}k} = ${Na}$ ו-$N_0 e^{${tb}k} = ${Nb}$.`,
            `מחלקים: $e^{${tb}k - ${ta}k} = \\dfrac{${Nb}}{${Na}}$, כלומר $e^{${d}k} = ${m}$.`,
            `לוקחים $\\ln$: $${d}k = \\ln ${m}$, ולכן $k = \\dfrac{\\ln ${m}}{${d}}$.`,
          ],
          finalAnswer: `$k = \\dfrac{\\ln ${m}}{${d}}$`,
          explanation: 'חלוקת המשוואות משאירה רק את הפרש הזמנים במעריך.',
        },
      });
    }

    const t1 = rng.int(2, 12);
    const N0 = decay ? m * rng.pick([10, 20, 50, 100, 200]) : rng.pick(N0S);
    const N1 = decay ? N0 / m : N0 * m;
    const lnTex = `${decay ? '-' : ''}\\dfrac{\\ln ${m}}{${t1}}`;

    return open({
      question: `${ctx.noun} ${decay ? 'ירדה' : 'גדלה'} מגודל התחלתי $${N0}$ לגודל $${N1}$ תוך $${t1}$ ${ctx.unit}, לפי המודל $N(t) = N_0 e^{kt}$. מצא את $k$.`,
      expected: { kind: 'value', value: `${decay ? '-' : ''}log(${m})/${t1}` },
      wrongAnswers: [
        {
          value: `${decay ? '-' : ''}${m}/${t1}`,
          note: decay
            ? `המנה הושוותה ישירות למעריך. מהמשוואה $e^{${t1}k} = \\dfrac{1}{${m}}$ מורידים את המעריך בלוגריתם: $${t1}k = -\\ln ${m}$, ולא $${t1}k = -${m}$.`
            : `המנה $${m}$ הושוותה ישירות למעריך. מהמשוואה $e^{${t1}k} = ${m}$ מורידים את המעריך בלוגריתם: $${t1}k = \\ln ${m}$, ולא $${t1}k = ${m}$.`,
        },
        {
          value: `log(${N1})/${t1}`,
          note: `הלוגריתם נלקח על הגודל הסופי בלי לחלק קודם בגודל ההתחלתי. מחלקים ב-$${N0}$ ומקבלים $e^{${t1}k} = ${decay ? `\\dfrac{1}{${m}}` : m}$, ורק אז לוקחים $\\ln$.`,
        },
      ],
      hint: 'הצב את שני הנתונים, חלק בגודל ההתחלתי כדי לבודד את החזקה, ואז קח לוגריתם טבעי.',
      solution: {
        steps: [
          '**הכלל:** כשנתונים הגודל ההתחלתי, גודל בזמן מאוחר והזמן, מציבים במודל $N(t) = N_0 e^{kt}$, מחלקים ב-$N_0$ כדי לבודד את החזקה ומורידים את המעריך בלוגריתם טבעי.',
          `**ההצבה:** $${N0}\\,e^{${t1}k} = ${N1}$.`,
          `מחלקים ב-$${N0}$: $e^{${t1}k} = ${decay ? `\\dfrac{1}{${m}}` : m}$.`,
          `לוקחים $\\ln$: $${t1}k = ${decay ? `-\\ln ${m}` : `\\ln ${m}`}$, ולכן $k = ${lnTex}$.`,
        ],
        finalAnswer: `$k = ${lnTex}$`,
        explanation: decay
          ? 'הכמות ירדה ולכן k שלילי; הלוגריתם של שבר קטן מאחד הוא שלילי.'
          : 'החלוקה בגודל ההתחלתי מבודדת את החזקה, והלוגריתם מוריד את המעריך.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 2 · gd-time-rate — half-life and time to a target
// ---------------------------------------------------------------------------

const halfLifeK: GenTemplate = {
  id: 'gd-half-life-k',
  distractorTags: [null, 'sign-slip', 'exponent-slip', 'values-swapped'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'gd-time-rate',
  title: 'קצב הדעיכה מזמן חצי-החיים',
  skill: 'formula-choice',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const m = difficulty === 'easy' ? 2 : rng.pick([3, 4, 5, 8, 10]);
    const T = rng.pick([2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50].filter((x) => x !== m));
    const ctx = rng.pick(DECAY_CTX);

    const right = `$-\\dfrac{\\ln ${m}}{${T}}$`;
    const given =
      m === 2
        ? `זמן חצי-החיים שלו הוא $${T}$ ${ctx.unit}`
        : `אחרי $${T}$ ${ctx.unit} נשאר $\\dfrac{1}{${m}}$ מהכמות ההתחלתית`;

    return mcq({
      question: `${ctx.noun} דועכת לפי $N(t) = N_0 e^{kt}$, ו${given}. מהו $k$?`,
      answers: [right, `$\\dfrac{\\ln ${m}}{${T}}$`, `$-\\dfrac{${m}}{${T}}$`, `$-\\dfrac{\\ln ${T}}{${m}}$`],
      correct: 0,
      distractorNotes: [
        '',
        `הסימן נשמט. עם $k$ חיובי מתקבל $N(${T}) = N_0 e^{\\ln ${m}} = ${m}N_0$, כלומר הכמות גדלה פי $${m}$ במקום לקטון; בדעיכה $k$ תמיד שלילי.`,
        `המשוואה $e^{${T}k} = \\dfrac{1}{${m}}$ נקראה כאילו $${T}k = -${m}$. המעריך יורד רק בלוגריתם: $${T}k = \\ln\\dfrac{1}{${m}} = -\\ln ${m}$.`,
        `הלוגריתם הופעל על הזמן $${T}$ במקום על הפקטור $${m}$, והזמן והפקטור התחלפו במקומותיהם. הזמן נשאר במכנה, והלוגריתם פועל על היחס בין הכמויות.`,
      ],
      hint: `כתוב את התנאי $N(${T}) = \\dfrac{N_0}{${m}}$, חלק ב-$N_0$ וקח לוגריתם טבעי.`,
      solution: {
        steps: [
          '**הכלל:** כשנתון כמה זמן לוקח לכמות לרדת לחלק קבוע מעצמה, מציבים את התנאי במודל $N(t) = N_0 e^{kt}$, מחלקים ב-$N_0$ ומורידים את המעריך בלוגריתם טבעי, והסימן יוצא שלילי כי זו דעיכה.',
          `**ההצבה:** $N_0 e^{${T}k} = \\dfrac{N_0}{${m}}$, ולכן $e^{${T}k} = \\dfrac{1}{${m}}$.`,
          `לוקחים $\\ln$: $${T}k = \\ln\\dfrac{1}{${m}} = -\\ln ${m}$.`,
          `מחלקים ב-$${T}$: $k = -\\dfrac{\\ln ${m}}{${T}}$.`,
        ],
        finalAnswer: right,
        explanation: 'לוגריתם של שבר קטן מאחד הוא שלילי, ולכן קצב הדעיכה שלילי.',
      },
    });
  },
};

const timeToTarget: GenTemplate = {
  id: 'gd-time-to-target',
  wrongAnswerTags: ['exponent-slip', 'dropped-factor'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'gd-time-rate',
  title: 'הזמן עד שהכמות מגיעה לערך נתון',
  skill: 'equation-solving',
  difficulties: ['easy', 'mid', 'hard'],
  build(rng, difficulty) {
    if (difficulty === 'hard') {
      // Rate given as "multiplies by a every b units": k = ln a / b.
      const a = rng.pick([2, 3, 4, 5]);
      const m = rng.pick([2, 3, 4, 5, 6, 8, 9, 10].filter((x) => x !== a));
      // m/a = ln m / ln a exactly for (2,4)/(4,2): the "forgot ln" answer would be right.
      if (Math.abs(m / a - Math.log(m) / Math.log(a)) < 1e-9) return null;
      const b = rng.int(2, 12);
      const ctx = rng.pick(GROWTH_CTX);
      return open({
        question: `${ctx.noun} גדלה לפי $N(t) = N_0 e^{kt}$ וגודלה מוכפל פי $${a}$ כל $${b}$ ${ctx.unit}. תוך כמה ${ctx.unit} יגדל הגודל פי $${m}$?`,
        expected: { kind: 'value', value: `${b}*log(${m})/log(${a})` },
        wrongAnswers: [
          {
            value: `${b}*${m}/${a}`,
            note: `הפקטורים $${m}$ ו-$${a}$ הושוו ישירות למעריכים בלי לוגריתם. מ-$e^{${b}k} = ${a}$ מקבלים $k = \\dfrac{\\ln ${a}}{${b}}$, ומ-$e^{kt} = ${m}$ מקבלים $kt = \\ln ${m}$.`,
          },
          {
            value: `log(${m})/log(${a})`,
            note: `הזמן $${b}$ נשמט. הקצב הוא $k = \\dfrac{\\ln ${a}}{${b}}$ ולא $\\ln ${a}$, ולכן כשמחלקים בו הזמן $${b}$ עולה למונה.`,
          },
        ],
        hint: 'מצא קודם את k מהנתון על ההכפלה, ואז פתור את המשוואה עם הפקטור המבוקש.',
        solution: {
          steps: [
            '**הכלל:** כשהקצב לא נתון במפורש, מוצאים אותו קודם מהנתון על ההכפלה בעזרת לוגריתם טבעי, ואז פותרים את המשוואה של הפקטור המבוקש עם אותו לוגריתם.',
            `**שלב א:** $N_0 e^{${b}k} = ${a}N_0$, ולכן $${b}k = \\ln ${a}$ ו-$k = \\dfrac{\\ln ${a}}{${b}}$.`,
            `**שלב ב:** $N_0 e^{kt} = ${m}N_0$, ולכן $kt = \\ln ${m}$.`,
            `מחלקים ב-$k$: $t = \\dfrac{\\ln ${m}}{k} = \\dfrac{${b}\\ln ${m}}{\\ln ${a}}$.`,
          ],
          finalAnswer: `$t = \\dfrac{${b}\\ln ${m}}{\\ln ${a}}$`,
          explanation: 'שני הלוגריתמים נשארים כביטוי מדויק; אין צורך לעגל.',
        },
      });
    }

    const decay = difficulty === 'mid';
    const k = rng.pick(RATES);
    const m = rng.pick([2, 3, 4, 5, 6, 8, 9, 10]);
    const N0 = decay ? m * rng.pick([10, 20, 50, 100, 200]) : rng.pick(N0S);
    const N1 = decay ? N0 / m : N0 * m;
    // ln(N1) = ln(m) exactly when N1 = m: the "forgot to divide" answer would be right.
    if (N1 === m) return null;
    const ctx = rng.pick(decay ? DECAY_CTX : GROWTH_CTX);
    const kt = `${decay ? '-' : ''}${k}t`;

    return open({
      question: `${ctx.noun} ${decay ? 'דועכת' : 'גדלה'} לפי $N(t) = ${N0}\\,e^{${kt}}$ ($t$ ב${ctx.unit}). תוך כמה ${ctx.unit} ${decay ? 'תרד הכמות ל' : 'יגיע הגודל ל'}-$${N1}$?`,
      expected: { kind: 'value', value: `log(${m})/${k}` },
      wrongAnswers: [
        {
          value: `${m}/${k}`,
          note: decay
            ? `המנה הושוותה למעריך בלי לוגריתם. מ-$e^{-${k}t} = \\dfrac{1}{${m}}$ מקבלים $-${k}t = -\\ln ${m}$, ורק אז מחלקים בקצב.`
            : `המנה $${m}$ הושוותה למעריך בלי לוגריתם. מ-$e^{${k}t} = ${m}$ מקבלים $${k}t = \\ln ${m}$, ורק אז מחלקים בקצב.`,
        },
        {
          value: `log(${N1})/${k}`,
          note: `הלוגריתם נלקח על הגודל המבוקש בלי לחלק קודם ב-$${N0}$. אחרי החלוקה מקבלים $e^{${kt}} = ${decay ? `\\dfrac{1}{${m}}` : m}$, ועל זה לוקחים $\\ln$.`,
        },
      ],
      hint: 'השווה את המודל לגודל המבוקש, חלק בגודל ההתחלתי, קח לוגריתם טבעי וחלק בקצב.',
      solution: {
        steps: [
          '**הכלל:** כשמבוקש הזמן, משווים את המודל $N(t) = N_0 e^{kt}$ לגודל המבוקש, מחלקים ב-$N_0$ כדי לבודד את החזקה ומורידים את המעריך בלוגריתם טבעי.',
          `**ההצבה:** $${N0}\\,e^{${kt}} = ${N1}$.`,
          `מחלקים ב-$${N0}$: $e^{${kt}} = ${decay ? `\\dfrac{1}{${m}}` : m}$.`,
          decay
            ? `לוקחים $\\ln$: $-${k}t = -\\ln ${m}$, ולכן $t = \\dfrac{\\ln ${m}}{${k}}$.`
            : `לוקחים $\\ln$: $${k}t = \\ln ${m}$, ולכן $t = \\dfrac{\\ln ${m}}{${k}}$.`,
        ],
        finalAnswer: `$t = \\dfrac{\\ln ${m}}{${k}}$`,
        explanation: decay
          ? 'שני הסימנים השליליים מתקצרים, והזמן יוצא חיובי כפי שצריך.'
          : 'הזמן הוא הלוגריתם של פקטור הגדילה חלקי הקצב.',
      },
    });
  },
};

// ---------------------------------------------------------------------------
// 3 · gd-applications — continuous interest and cooling
// ---------------------------------------------------------------------------

const PRINCIPALS = [1000, 2000, 2500, 4000, 5000, 8000, 10000, 12000, 20000] as const;

const continuousInterest: GenTemplate = {
  id: 'gd-continuous-interest',
  distractorTags: [null, 'formula-mismatch', 'dropped-factor', 'formula-mismatch'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'gd-applications',
  title: 'סכום שנצבר בריבית רציפה',
  skill: 'substitution',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    const n = difficulty === 'easy' ? 1 : rng.int(1, 3);
    // r in percent; t = 100n / r must be a whole number of years, at most 60.
    const rs = [2, 4, 5, 10, 20, 25].filter((r) => (100 * n) % r === 0 && (100 * n) / r <= 60);
    const r = rng.pick(rs);
    const t = (100 * n) / r;
    const P = rng.pick(PRINCIPALS);
    const dec = r / 100;

    const right = nE(P, n);
    return mcq({
      question: `קרן של $${P}$ ש"ח מופקדת בריבית רציפה של $${r}\\%$ לשנה, לפי $A = P e^{rt}$. מה יהיה הסכום אחרי $${t}$ שנים?`,
      answers: [right, `$${P}e^{${r * t}}$`, `$${P}e^{${dec}}$`, `$${P * (1 + n)}$`],
      correct: 0,
      distractorNotes: [
        '',
        `האחוזים הוצבו כמספר שלם. בנוסחה $r$ הוא הריבית כשבר עשרוני, כלומר $${dec}$ ולא $${r}$, ולכן המעריך הוא $${dec} \\cdot ${t} = ${n}$ ולא $${r * t}$.`,
        `הריבית נשארה לבדה במעריך בלי הכפלה בזמן. המעריך הוא $rt = ${dec} \\cdot ${t} = ${n}$; מה שנכתב הוא הסכום אחרי שנה אחת.`,
        `זו ריבית פשוטה, $P(1 + rt)$, שבה הריבית מתווספת כל שנה על הקרן בלבד. ריבית רציפה מצטברת דרך $e^{rt}$, והסכום הוא $${P}${ePow(n)}$, גדול יותר.`,
      ],
      hint: 'הפוך את האחוזים לשבר עשרוני, וחשב את המעריך, ריבית כפול זמן, לפני שאתה כותב את החזקה.',
      solution: {
        steps: [
          '**הכלל:** ריבית רציפה היא מודל הגדילה $A = P e^{rt}$, שבו $r$ הוא הריבית השנתית כשבר עשרוני ו-$t$ הזמן בשנים, ולכן מציבים את הזמן ומחשבים את המעריך.',
          `הריבית כשבר עשרוני: $r = \\dfrac{${r}}{100} = ${dec}$.`,
          `**ההצבה:** $A = ${P}\\,e^{${dec} \\cdot ${t}} = ${P}${ePow(n)}$.`,
        ],
        finalAnswer: right,
        explanation: 'המעריך הוא ריבית עשרונית כפול שנים; כשהוא יוצא שלם התשובה נשארת חזקה מדויקת של e.',
      },
    });
  },
};

const cooling: GenTemplate = {
  id: 'gd-cooling-next-reading',
  wrongAnswerTags: ['formula-mismatch', 'partial-answer'],
  subject: SUBJECT,
  topic: TOPIC,
  subTopicId: 'gd-applications',
  title: 'חוק הצינון: הטמפרטורה במדידה הבאה',
  skill: 'substitution',
  difficulties: ['easy', 'mid'],
  build(rng, difficulty) {
    // Excess over room temperature shrinks by the factor p/q every t1 minutes:
    // D0 = q²c, D1 = pqc, D2 = p²c keep every temperature an integer.
    const [p, q] = difficulty === 'easy' ? [1, 2] : rng.pick([[1, 3], [2, 3], [3, 4], [1, 4], [3, 5], [2, 5]]);
    const c = rng.pick([3, 4, 5, 6, 8, 10, 12, 15, 20].filter((x) => q * q * x <= 90));
    const Ts = rng.pick([15, 18, 20, 22, 24, 25]);
    const D0 = q * q * c;
    const D1 = p * q * c;
    const D2 = p * p * c;
    const T0 = Ts + D0;
    const T1 = Ts + D1;
    const T2 = Ts + D2;
    const t1 = rng.pick([5, 8, 10, 12, 15, 20, 30]);
    const t2 = 2 * t1;
    const linear = T1 - (T0 - T1);

    return open({
      question: `גוף בטמפרטורה של $${T0}$ מעלות מונח בחדר שטמפרטורתו $${Ts}$ מעלות, ומתקרר לפי חוק הצינון $T(t) = T_s + (T_0 - T_s)e^{kt}$. אחרי $${t1}$ דקות טמפרטורת הגוף היא $${T1}$ מעלות. מה תהיה טמפרטורת הגוף אחרי $${t2}$ דקות?`,
      expected: { kind: 'value', value: String(T2) },
      wrongAnswers: [
        {
          value: String(linear),
          note: `הירידה הראשונה, $${T0 - T1}$ מעלות, הופחתה שוב כאילו הקירור קווי. בחוק הצינון מה שקבוע הוא הפקטור שבו מתכווץ ההפרש מטמפרטורת החדר, לא מספר המעלות.`,
        },
        {
          value: String(D2),
          note: `זהו ההפרש מטמפרטורת החדר אחרי $${t2}$ דקות, לא הטמפרטורה עצמה. צריך להוסיף בחזרה את $${Ts}$ מעלות של החדר.`,
        },
      ],
      hint: 'עבוד עם ההפרש מטמפרטורת החדר. באיזה פקטור הוא התכווץ במדידה הראשונה? אותו פקטור פועל שוב.',
      solution: {
        steps: [
          '**הכלל:** בחוק הצינון ההפרש בין הגוף לחדר הוא שדועך מעריכית, ולכן עוברים להפרשים, ובזמן כפול הפקטור $e^{kt}$ מועלה בריבוע.',
          `ההפרש ההתחלתי: $T_0 - T_s = ${T0} - ${Ts} = ${D0}$. אחרי $${t1}$ דקות: $${T1} - ${Ts} = ${D1}$.`,
          `**ההצבה:** $${D0}\\,e^{${t1}k} = ${D1}$, ולכן $e^{${t1}k} = \\dfrac{${D1}}{${D0}} = \\dfrac{${p}}{${q}}$.`,
          `אחרי $${t2}$ דקות: $e^{${t2}k} = \\left(e^{${t1}k}\\right)^2 = \\dfrac{${p * p}}{${q * q}}$, ולכן ההפרש הוא $${D0} \\cdot \\dfrac{${p * p}}{${q * q}} = ${D2}$.`,
          `הטמפרטורה: $T(${t2}) = ${Ts} + ${D2} = ${T2}$.`,
        ],
        finalAnswer: `$T(${t2}) = ${T2}$ מעלות`,
        explanation: 'ההפרש מהחדר מתכווץ באותו פקטור בכל פרק זמן שווה; את הטמפרטורה מקבלים בהוספת טמפרטורת החדר בחזרה.',
      },
    });
  },
};

export const GROWTH_TEMPLATES: GenTemplate[] = [
  evalModel,
  findK,
  halfLifeK,
  timeToTarget,
  continuousInterest,
  cooling,
];
