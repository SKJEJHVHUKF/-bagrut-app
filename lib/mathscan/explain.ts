// ============================================================
// mathscan/explain.ts — the Hebrew explanation, generated for $0.
// ============================================================
//
// This is the file that makes "almost zero cost" true rather than
// aspirational. Once the CAS has produced a STRUCTURED result — this step
// was a discriminant, that one was the quadratic formula — the Hebrew that
// describes it is a lookup, not a generation. No model writes these
// sentences, so an explanation costs nothing, renders instantly, is
// identical every time, and cannot hallucinate a step the solver didn't
// take.
//
// It follows the same content rules the hand-authored lessons are held to
// (CLAUDE.md #5/#6 and STYLE_GUIDE.md), because a student cannot tell which
// screen they are on and shouldn't have to:
//
//   1. CLEAN-STACKED — one mathematical result per step; Hebrew appears only
//      as a short leading label, never sandwiched between two `$…$`.
//   2. HEBREW OUTSIDE THE MATH — always. KaTeX has no bidi, so Hebrew inside
//      `$…$` renders reversed. Every template below puts the Hebrew in
//      `title` and the maths in `content`, which structurally prevents it.
//   3. NO STEP SKIPPING — the solver emits a step per move and the explainer
//      renders all of them; it never summarises two moves into one line.
//   4. WHY, NOT JUST WHAT — each label says what the move accomplishes
//      ("כדי לבודד את הנעלם"), not only what was done.

import type {
  ClassifiedProblem,
  Explanation,
  ExplanationDepth,
  ExplainedStep,
  MathDomain,
  ProblemKind,
  SolveOutcome,
  SolveStep,
} from './types';

// ------------------------------------------------------------
// Headlines — "what kind of question is this"
// ------------------------------------------------------------

const KIND_HEADLINE: Record<ProblemKind, string> = {
  equation: 'משוואה — מוצאים את הערכים שמקיימים אותה',
  inequality: 'אי-שוויון — מוצאים את תחום הערכים שמקיים אותו',
  system: 'מערכת משוואות — מוצאים את הזוג שמקיים את שתיהן',
  simplify: 'פישוט ביטוי — כותבים אותו בצורה הפשוטה ביותר',
  evaluate: 'חישוב ערך — מציבים ומחשבים',
  derivative: 'גזירה — מוצאים את פונקציית הנגזרת',
  integral: 'אינטגרל לא מסוים — מוצאים את הפונקציה הקדומה',
  'definite-integral': 'אינטגרל מסוים — מחשבים את הערך בין שני גבולות',
  limit: 'גבול — בודקים לאן הפונקציה שואפת',
  unknown: 'שאלה במתמטיקה',
};

const DOMAIN_LABEL: Record<MathDomain, string> = {
  algebra: 'אלגברה',
  geometry: 'גיאומטריה',
  trigonometry: 'טריגונומטריה',
  calculus: 'חשבון דיפרנציאלי ואינטגרלי',
  statistics: 'הסתברות וסטטיסטיקה',
  sequences: 'סדרות',
  'analytic-geometry': 'גאומטריה אנליטית',
  vectors: 'וקטורים',
  complex: 'מספרים מרוכבים',
  unknown: 'מתמטיקה',
};

export function domainLabel(domain: MathDomain): string {
  return DOMAIN_LABEL[domain] ?? DOMAIN_LABEL.unknown;
}

// ------------------------------------------------------------
// Step labels
// ------------------------------------------------------------

/**
 * The Hebrew label for each step kind. Context-sensitive where the same
 * mechanical move means different things — `move-terms` in an equation is
 * "העברת אגפים", in an inequality it is the move that later forces the sign
 * flip, and calling both by the same name loses the point of the step.
 */
function labelFor(step: SolveStep, problem: ClassifiedProblem): string {
  switch (step.kind) {
    case 'restate':
      return 'הנתון';
    case 'domain':
      return 'תחום הגדרה';
    case 'move-terms':
      return problem.kind === 'inequality'
        ? 'מעבירים הכול לאגף אחד'
        : 'מעבירים הכול לאגף אחד ומשווים לאפס';
    case 'expand':
      return 'פותחים סוגריים';
    case 'factor':
      return 'מפרקים לגורמים';
    case 'coefficients':
      return 'מזהים את המקדמים';
    case 'discriminant':
      return 'מחשבים את הדיסקרימיננטה';
    case 'apply-formula':
      return 'מציבים בנוסחה';
    case 'substitute':
      return 'מציבים';
    case 'simplify':
      return 'מפשטים';
    case 'differentiate':
      return 'גוזרים';
    case 'integrate':
      return 'מבצעים אינטגרציה';
    case 'evaluate-bounds':
      return 'מציבים את גבולות האינטגרציה';
    case 'solve-linear':
      return step.data?.flipped ? 'מחלקים במספר שלילי — והסימן מתהפך' : 'מבודדים את הנעלם';
    case 'roots':
      return 'מוצאים את נקודות האיפוס';
    case 'verify':
      return 'בדיקה — מציבים חזרה';
    case 'conclude':
      return 'תשובה סופית';
    default:
      return 'שלב';
  }
}

/**
 * The "why" sentence under a step. Returns '' when the maths speaks for
 * itself — an explanation that narrates every line ("כאן חיסרנו 3") reads as
 * noise and trains a student to skim.
 */
function reasonFor(step: SolveStep, problem: ClassifiedProblem): string {
  switch (step.kind) {
    case 'move-terms':
      return problem.kind === 'inequality'
        ? 'כך נשאר ביטוי אחד שצריך לבדוק מתי הוא חיובי או שלילי.'
        : 'משוואה מול אפס היא הצורה שממנה אפשר לפרק לגורמים או להציב בנוסחת השורשים.';
    case 'coefficients':
      return 'זיהוי נכון של המקדמים הוא מה שמונע טעות סימן בנוסחה.';
    case 'discriminant': {
      const value = Number(step.data?.discriminant ?? NaN);
      if (!Number.isFinite(value)) return 'הדיסקרימיננטה קובעת כמה פתרונות ממשיים יש.';
      if (value > 0) return 'הדיסקרימיננטה חיובית, ולכן יש שני פתרונות ממשיים שונים.';
      if (value === 0) return 'הדיסקרימיננטה מתאפסת, ולכן יש פתרון ממשי אחד (שורש כפול).';
      return 'הדיסקרימיננטה שלילית, ולכן אין פתרון ממשי.';
    }
    case 'domain':
      return 'לפני שפותרים חייבים לדעת מתי הביטוי בכלל מוגדר — פתרון שנופל מחוץ לתחום נפסל.';
    case 'solve-linear':
      return step.data?.flipped
        ? 'זו הטעות הנפוצה ביותר באי-שוויונים: חלוקה במספר שלילי הופכת את כיוון הסימן.'
        : '';
    case 'evaluate-bounds':
      return 'האינטגרל המסוים הוא ההפרש בין ערך הפונקציה הקדומה בגבול העליון לבין ערכה בגבול התחתון.';
    case 'verify':
      return 'הצבה חוזרת היא הדרך היחידה לוודא שלא נפלה טעות סימן בדרך.';
    case 'roots':
      return 'נקודות האיפוס מחלקות את ציר המספרים לתחומים, ובכל תחום הסימן קבוע.';
    default:
      return '';
  }
}

// ------------------------------------------------------------
// Assembly
// ------------------------------------------------------------

/**
 * Turn a solved outcome into a Hebrew explanation at the requested depth.
 *
 *   hint    — the first real move only, and NEVER the answer. A hint that
 *             leaks the result is not a hint.
 *   partial — everything up to (but excluding) the conclusion.
 *   full    — every step plus the final answer.
 */
export function explainSolution(
  outcome: SolveOutcome,
  problem: ClassifiedProblem,
  depth: ExplanationDepth
): Explanation {
  const headline = KIND_HEADLINE[problem.kind] ?? KIND_HEADLINE.unknown;

  if (outcome.status !== 'solved') {
    return {
      depth,
      headline,
      steps: [
        {
          title: 'לא הצלחנו לפתור את זה מקומית',
          content: 'השאלה הזו דורשת פתרון מלא — אפשר לשלוח אותה לפתרון מתקדם.',
        },
      ],
      source: 'template',
    };
  }

  const all = outcome.steps;
  const conclusionIndex = all.findIndex((s) => s.kind === 'conclude');
  const body = conclusionIndex === -1 ? all : all.slice(0, conclusionIndex);

  if (depth === 'hint') {
    return { depth, headline, steps: buildHint(body, problem), source: 'template' };
  }

  const visible = depth === 'partial' ? body : all;
  const steps: ExplainedStep[] = visible
    .filter((step) => step.kind !== 'conclude')
    .map((step) => toExplainedStep(step, problem));

  if (depth === 'partial') {
    steps.push({
      title: 'מכאן ממשיכים לבד',
      content: 'נסה להשלים את החישוב האחרון בעצמך — ואם נתקעת, פתח את הפתרון המלא.',
    });
    return { depth, headline, steps, source: 'template' };
  }

  return {
    depth,
    headline,
    steps,
    finalAnswer: formatFinalAnswer(outcome, problem),
    source: 'template',
  };
}

function toExplainedStep(step: SolveStep, problem: ClassifiedProblem): ExplainedStep {
  const reason = reasonFor(step, problem);
  // The maths goes on its own line, and the Hebrew "why" on the next — a
  // Hebrew clause on the SAME line as a long LaTeX chain is what makes RTL
  // output read jumbled, which is why the app's own steps are clean-stacked.
  const content = step.latex
    ? reason
      ? `$$${step.latex}$$\n\n${reason}`
      : `$$${step.latex}$$`
    : reason;
  return { title: labelFor(step, problem), content };
}

/**
 * A hint: the first substantive move, stated as a direction rather than a
 * result. `restate` is skipped — telling a student their own question back
 * is not help.
 */
function buildHint(body: SolveStep[], problem: ClassifiedProblem): ExplainedStep[] {
  const first = body.find((s) => s.kind !== 'restate') ?? body[0];
  const opening = openingMove(problem);

  const steps: ExplainedStep[] = [{ title: 'הכיוון', content: opening }];
  if (first && first.latex && first.kind !== 'conclude') {
    steps.push({
      title: 'הצעד הראשון',
      content: `$$${first.latex}$$`,
    });
  }
  steps.push({
    title: 'מה עכשיו',
    content: 'נסה להמשיך מכאן. אם זה עדיין לא מסתדר — יש כפתור לפתרון חלקי, ורק אחריו הפתרון המלא.',
  });
  return steps;
}

/** The one-sentence strategy for this kind of question — the thing a tutor
 *  says before touching the page. */
function openingMove(problem: ClassifiedProblem): string {
  switch (problem.kind) {
    case 'equation':
      return 'מעבירים הכול לאגף אחד כך שבאגף השני יישאר אפס, ואז בודקים אם אפשר לפרק לגורמים או להשתמש בנוסחת השורשים.';
    case 'inequality':
      return 'מעבירים הכול לאגף אחד, מוצאים את נקודות האיפוס, ורק אז קובעים בכל תחום אם הביטוי חיובי או שלילי.';
    case 'system':
      return 'בוחרים נעלם אחד לסלק — בשיטת ההצבה או בשיטת החיבור והחיסור.';
    case 'derivative':
      return 'מזהים את מבנה הפונקציה (סכום, מכפלה, מנה או פונקציה מורכבת) ובוחרים את כלל הגזירה המתאים.';
    case 'integral':
    case 'definite-integral':
      return 'מזהים איזו נוסחת אינטגרציה מתאימה, ולא שוכחים לחלק בנגזרת הפנימית כשיש ביטוי לינארי בפנים.';
    case 'simplify':
      return 'מחפשים גורם משותף או זהות שמאפשרת לצמצם.';
    case 'evaluate':
      return 'מציבים את הנתונים ומחשבים לפי סדר פעולות החשבון.';
    default:
      return 'מתחילים מלזהות מה נתון ומה צריך למצוא.';
  }
}

/**
 * The final answer line.
 *
 * `answerLatex` may be plain Hebrew ("אין פתרון ממשי") rather than maths, so
 * it is only wrapped in `$…$` when it actually contains maths — wrapping the
 * Hebrew would render it reversed. It may also carry the two branches of an
 * inequality separated by `|`, which become two `$…$` runs joined by a
 * Hebrew "או" OUTSIDE the delimiters.
 */
function formatFinalAnswer(outcome: SolveOutcome, problem: ClassifiedProblem): string {
  if (outcome.status !== 'solved') return '';
  const raw = outcome.answerLatex.trim();
  if (!raw) return '';

  if (containsHebrew(raw)) return raw;

  if (raw.includes('|')) {
    const parts = raw
      .split('|')
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.map((p) => `$${p}$`).join(' או ');
  }

  const prefix =
    problem.kind === 'integral'
      ? 'הפונקציה הקדומה: '
      : problem.kind === 'derivative'
        ? 'הנגזרת: '
        : '';
  return `${prefix}$${raw}$`;
}

function containsHebrew(text: string): boolean {
  return /[֐-׿]/.test(text);
}

/**
 * Wrap a streamed markdown solution.
 *
 * No parsing into steps: the model was asked for a readable document with
 * `## סעיף א` headings, and chopping that back into numbered cards is what
 * made a real multi-section solution read as an undifferentiated wall.
 */
export function explanationFromMarkdown(
  markdown: string,
  problem: ClassifiedProblem | null
): Explanation {
  return {
    depth: 'full',
    headline: problem ? (KIND_HEADLINE[problem.kind] ?? KIND_HEADLINE.unknown) : KIND_HEADLINE.unknown,
    markdown,
    steps: [],
    source: 'ai',
  };
}

/** Adapt a library/AI solution (already Hebrew prose) into the same shape,
 *  so the result screen renders one component regardless of source. */
export function explanationFromSteps(
  steps: { title: string; content: string }[],
  finalAnswer: string,
  problem: ClassifiedProblem | null,
  source: Explanation['source']
): Explanation {
  return {
    depth: 'full',
    headline: problem ? (KIND_HEADLINE[problem.kind] ?? KIND_HEADLINE.unknown) : KIND_HEADLINE.unknown,
    steps: steps.map((s) => ({ title: s.title, content: s.content })),
    finalAnswer,
    source,
  };
}

export const __testables = { labelFor, reasonFor, formatFinalAnswer, buildHint };
