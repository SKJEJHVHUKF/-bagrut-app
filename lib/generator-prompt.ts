/**
 * generator-prompt.ts — the shared prompt for routes that GENERATE exercises.
 *
 * WHY THIS IS NOT INSIDE THE ROUTE ANY MORE
 * -----------------------------------------
 * Two reasons, and the second is the expensive one.
 *
 * 1. A prompt that only exists inside a route handler cannot be measured. The
 *    model behind these routes is a cost decision worth ~50% of the app's API
 *    bill, and the repo's rule is that such decisions are MEASURED, not picked
 *    (see lib/mathscan/cost.ts on what an estimate-in-a-comment cost last time).
 *    scripts/measure-generator.ts imports this module, so the number it reports
 *    is about the prompt that actually ships.
 *
 * 2. The route carried its own three-line paraphrase of the math formatting
 *    rules. lib/agents/prompts.ts already owns those, and its version knows
 *    things the paraphrase did not: that Hebrew inside `$...$` renders reversed
 *    because KaTeX has no bidi, and that Israeli bagrut uses `cis` in degrees
 *    rather than `re^{iθ}`. Every agent in this app now shares ONE copy — the
 *    same argument lib/mathscan/tutor-prompt.ts makes for the tutor side.
 */

import { MATH_FORMAT_RULES } from '@/lib/agents/prompts';
import { SELF_CHECK_SCHEMA } from '@/lib/verify-generated';

/**
 * ⛔ DO NOT ADD `cache_control` HERE. MEASURED, and the answer was no.
 *
 * `npm run measure:cachefit` (2026-08-17, free token counting):
 *   MATH_FORMAT_RULES — the only genuinely stable prefix —  566 tokens
 *   full prompt, across topics                         1,928-1,936 tokens
 *   full prompt, across all 7 subjects                  1,379-1,926 tokens
 *   claude-haiku-4-5 minimum cacheable prefix                4,096 tokens
 *
 * Every candidate prefix is far under the minimum, where a `cache_control`
 * marker is a SILENT no-op — no error, no saving, and a very convincing line in
 * a report about a 90% reduction that never happened. The generator prompt is
 * also output-dominated (~1,300 output tokens against ~1,900 input), so even a
 * working cache would have moved ~11% of this route's cost.
 *
 * The lever that DID matter was the model tier plus the question pool — see
 * GENERATOR_MODEL in lib/agents/config.ts and `npm run pool:coverage`.
 *
 * If this prompt ever grows past 4,096 tokens, re-run the script before
 * assuming that changed.
 */

// ============================================================
// Subjects
// ============================================================

/** Subject keys match /api/questions so the /practice page can share the map.
 *  Prompts here are tuned for ONE deep problem instead of five shallow ones. */
export const SUBJECTS: Record<string, { name: string; buildPrompt: (topic: string) => string }> = {
  math5: {
    name: 'מתמטיקה 5 יח׳',
    buildPrompt: (t) =>
      `אתה מורה פרטי למתמטיקה ברמת 5 יחידות לבגרות בישראל. תייצר תרגיל בגרות אחד אמיתי וברמה גבוהה בנושא: ${t}. תרגיל אחד מעמיק, לא מספר תרגילים.`,
  },
  math4: {
    name: 'מתמטיקה 4 יח׳',
    buildPrompt: (t) =>
      `אתה מורה פרטי למתמטיקה ברמת 4 יחידות לבגרות בישראל. תייצר תרגיל בגרות אחד ברמה הולמת ל-4 יחידות בנושא: ${t}. תרגיל אחד מעמיק.`,
  },
  physics: {
    name: 'פיזיקה',
    buildPrompt: (t) =>
      `אתה מורה לפיזיקה 5 יחידות לבגרות. תייצר תרגיל בגרות אחד אמיתי בנושא: ${t}. תרגיל אחד מעמיק עם חישובים.`,
  },
  english: {
    name: 'אנגלית',
    buildPrompt: (t) =>
      `You are an English Bagrut teacher (5 units). Generate ONE deep practice exercise about: ${t}. One in-depth question, not a list. Question and solution in English.`,
  },
  history: {
    name: 'היסטוריה',
    buildPrompt: (t) =>
      `אתה מורה להיסטוריה לבגרות. תייצר שאלת תרגול אחת מעמיקה בנושא: ${t}. שאלה אחת שדורשת ניתוח, לא רב-ברירה.`,
  },
  bible: {
    name: 'תנ"ך',
    buildPrompt: (t) =>
      `אתה מורה לתנ"ך לבגרות. תייצר שאלת תרגול אחת מעמיקה בנושא: ${t}. שאלה שדורשת ניתוח פסוקים/מסרים.`,
  },
  chem: {
    name: 'כימיה',
    buildPrompt: (t) =>
      `אתה מורה לכימיה 5 יחידות לבגרות. תייצר תרגיל בגרות אחד בנושא: ${t}. תרגיל אחד עם חישובים/ניתוח.`,
  },
};

/** Subjects whose answers are arithmetic, and therefore where a mechanical
 *  self-check is meaningful. Asking a תנ"ך exercise for a mathjs identity would
 *  produce noise, so those subjects are not asked for one at all. */
export const CHECKABLE_SUBJECTS = new Set(['math5', 'math4', 'physics', 'chem']);

export type Difficulty = 'easier' | 'normal' | 'harder';

export const DIFFICULTY_HINT: Record<Difficulty, string> = {
  easier: 'התרגיל צריך להיות ברמה קלה יחסית — מתאים לתלמיד שעוד מתחיל את הנושא.',
  normal: 'התרגיל צריך להיות ברמה ממוצעת — לב הבגרות, לא הכי קל ולא הכי קשה.',
  harder: 'התרגיל צריך להיות מאתגר — שאלה בונוס ברמת קושי גבוהה לבגרות.',
};

// ============================================================
// Prompt
// ============================================================

/**
 * The self-check instruction. Only added for CHECKABLE_SUBJECTS.
 *
 * The wording matters more than it looks. "Apply the substitution yourself"
 * is what makes the check verifiable at all: a check that comes back as
 * `x^2-5x+6 = 0` still contains a free variable, so lib/verify-generated can
 * only mark it `unverifiable` and we learn nothing about the model's answer.
 */
const SELF_CHECK_INSTRUCTION = `
- self_check: בדיקות מכניות שמערכת אלגברה ממוחשבת תריץ על התשובה שלך.
  זו לא הצגה לתלמיד — זו בקרת איכות על החשבון שלך.
  לכל בדיקה: claim (מה נבדק, בעברית), expr (הביטוי לחישוב), equals (הערך הצפוי).
  ⚠️ בצע את ההצבה בעצמך. אסור שיישאר משתנה חופשי בתוך expr.
     נכון:  { claim: "הצבת x=2 במשוואה", expr: "2^2 - 5*2 + 6", equals: "0" }
     שגוי:  { claim: "המשוואה", expr: "x^2 - 5*x + 6", equals: "0" }
  ⚠️ טריגונומטריה: כתוב את היחידה במפורש — "cos(60 deg)", לא "cos(60)".
     בלי היחידה זה מתפרש כרדיאנים ומקבל ערך אחר לגמרי.
  ⚠️ equals: העדף ערך מדויק ("sqrt(3)/2", "0") על מעוגל. אם אתה מעגל —
     עגל נכון, ואל תשרשר ערך מעוגל לתוך בדיקה הבאה.
  אם לתרגיל אין זהות מספרית לבדוק (הוכחה, מקום גאומטרי) — החזר מערך ריק.`;

/**
 * Builds the full generator prompt.
 *
 * `seed` is injected by the caller rather than generated here: Date.now() and
 * Math.random() would make this function non-deterministic, and a measurement
 * script that cannot replay the same prompt twice cannot compare two models on
 * equal terms.
 */
export function buildGeneratorPrompt(args: {
  subject: string;
  topic: string;
  difficulty: Difficulty;
  seed: string;
}): string {
  const subjectInfo = SUBJECTS[args.subject];
  if (!subjectInfo) throw new Error(`unknown subject: ${args.subject}`);
  const checkable = CHECKABLE_SUBJECTS.has(args.subject);

  return `${subjectInfo.buildPrompt(args.topic)}

מטרה: ליצור תרגיל בגרות אחד מעמיק עם מערכת רמזים והסבר צעד-אחר-צעד.

${DIFFICULTY_HINT[args.difficulty]}

${MATH_FORMAT_RULES}

מבנה התשובה:
- problem: ניסוח התרגיל. שאלה אחת ברורה, אמיתית, ברמת בגרות. עם LaTeX אם רלוונטי.
- concept: מה התרגיל בודק? איזה כלל/נוסחה/עיקרון? משפט אחד.
- hints: בדיוק 3 רמזים פרוגרסיביים, מהקצר והעדין לכי מפורש:
  1) רמז 1: כיוון כללי — לאיזה כלי / נוסחה לפנות. בלי לחשוף את הפתרון.
  2) רמז 2: צעד ראשון קונקרטי — מה לעשות קודם. מתחיל להראות דרך.
  3) רמז 3: כמעט פתרון — מציג את המבנה של הפתרון, רק לא מסכם את התשובה הסופית.
- solution.steps: 3 עד 6 צעדים מסודרים שמובילים מהשאלה לתשובה הסופית.
  כל צעד עומד בפני עצמו — משפט אחד, מקסימום שניים. עם LaTeX לכל החישוב.
  הצעד האחרון חייב לכלול את התשובה הסופית בצורה ברורה.
- final_answer: התשובה הסופית בלבד, מנוסחת בקצרה. אם זה ערך מספרי — הערך. אם זה אי-שוויון — האי-שוויון. אם זה הוכחה — מסקנה.
- remember: טיפ זכירה אחד קצר. דרך לזכור את העיקרון הזה לבגרות.${checkable ? SELF_CHECK_INSTRUCTION : ''}

שפה: עברית ברורה (אנגלית רק אם המקצוע אנגלית).

🎯 קריטי: רק תרגיל אחד! לא חמישה. לא רב-ברירה.

מזהה גיוון: ${args.seed} (השתמש בו כדי לוודא שאתה לא חוזר על תרגילים זהים בין סבבים).`;
}

// ============================================================
// Schema
// ============================================================

/** The response shape. `self_check` is only required for CHECKABLE_SUBJECTS —
 *  see `buildExerciseSchema`. */
export function buildExerciseSchema(subject: string) {
  const checkable = CHECKABLE_SUBJECTS.has(subject);
  return {
    type: 'object',
    properties: {
      problem: { type: 'string' },
      concept: { type: 'string' },
      hints: { type: 'array', items: { type: 'string' } },
      solution: {
        type: 'object',
        properties: { steps: { type: 'array', items: { type: 'string' } } },
        required: ['steps'],
        additionalProperties: false,
      },
      final_answer: { type: 'string' },
      remember: { type: 'string' },
      ...(checkable ? { self_check: SELF_CHECK_SCHEMA } : {}),
    },
    required: [
      'problem', 'concept', 'hints', 'solution', 'final_answer', 'remember',
      ...(checkable ? ['self_check'] : []),
    ],
    additionalProperties: false,
  };
}
