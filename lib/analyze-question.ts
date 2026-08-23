/**
 * analyze-question.ts — read a maths question, decide what to do with it, and
 * do as much of it as possible without a model.
 *
 * ============================================================
 * WHAT THIS IS, AND WHAT IT DELIBERATELY IS NOT
 * ============================================================
 * This is a COMPOSITION layer. Almost nothing here is new logic:
 *
 *   repairOcrText / extractMathSegments  lib/mathscan/ocr/normalize.ts
 *   classifyProblem                      lib/mathscan/solve/classify.ts
 *   topicForDomain / checkScope          lib/mathscan/levels.ts
 *   isParseable / latexToMathjs          lib/mathscan/solve/parse.ts
 *   MathEngine                           lib/math-engine.ts
 *   checkAnswer (via MathEngine)         lib/answer-check.ts
 *   leaksAnswer                          lib/help-ladder.ts
 *
 * The four things it genuinely adds are `difficulty`, `deterministicEligible`,
 * the honest `confidence` roll-up, and the two-rung hint derivation. Everything
 * else is plumbing that already existed and had no single front door.
 *
 * ⚠️ IT IS NOT A SECOND CHAT ROUTER. `routeMessage` (lib/tutor-router.ts)
 * decides what a student's MESSAGE means — ack, ask, typed answer, open
 * question — and runs client-side before any network call. This file decides
 * what a QUESTION is. They answer different questions and neither replaces the
 * other; the tutor calls routeMessage, the scan pipeline and /api/analyze call
 * this.
 *
 * ⚠️ IT IS NOT A SECOND HINT SYSTEM. `buildHelpLadder` already derives a
 * graded ladder for any authored PracticeQuestion, and five content schemas
 * carry authored `hints: string[]`. Those are richer than anything derivable
 * from raw text and MUST win when the caller has a question id. The hints here
 * are the fallback for input that has no authored content at all — a photo, a
 * pasted exercise — and they are derived from the deterministic solution
 * steps, then screened with the same `leaksAnswer` predicate the content gate
 * uses, so rung 1 cannot contain the answer.
 *
 * ============================================================
 * THE COST CONTRACT
 * ============================================================
 * Nothing in this file can call a model. `requiresLLM` is a REPORT: the caller
 * decides whether to pay. The only network hop possible is to /api/math/solve
 * (SymPy, in-repo, $0), and only when the input is already known to be
 * deterministically solvable.
 *
 * A test reads this file's own source and fails if a path to a model appears.
 */

import { classifyProblem } from '@/lib/mathscan/solve/classify';
import {
  repairOcrText,
  extractMathSegments,
  hasHebrewInsideMath,
  unbalancedDollars,
} from '@/lib/mathscan/ocr/normalize';
import { latexToMathjs, isParseable, splitRelation } from '@/lib/mathscan/solve/parse';
import { topicForDomain, checkScope } from '@/lib/mathscan/levels';
import { MathEngine, type MathEngineResult } from '@/lib/math-engine';
import { leaksAnswer } from '@/lib/help-ladder';
import { getTopicMapping } from '@/content/bagrut-curriculum';
import type { MathDomain, ProblemKind, SolveStep, UnitLevel } from '@/lib/mathscan/types';
import type { AnswerDiagnosis } from '@/lib/answer-check';

// ============================================================
// Input
// ============================================================

export type AnalyzeMode = 'hint' | 'solve' | 'validate' | 'explain' | 'auto';

export type StudentContext = {
  /** 3, 4 or 5 units. Only 5 has authored topics today, so anything else
   *  yields `topic: null` rather than a topic the student has no lesson for. */
  level?: UnitLevel;
  knownWeakTopics?: string[];
  recentMistakes?: string[];
};

export type AnalyzeInput = {
  /** The question text, Hebrew prose included. The Hebrew IS the signal — it
   *  carries the instruction verb that decides what to DO. */
  question: string;
  studentAnswer?: string;
  requestedMode?: AnalyzeMode;
  studentContext?: StudentContext;
  /** Overall budget for the whole analysis, including the SymPy hop. */
  timeoutMs?: number;
};

// ============================================================
// Output
// ============================================================

export type AnalyzeStatus = 'ok' | 'partial' | 'unsupported';

/** `ProblemKind` verbatim, plus the one value it has no word for. Reusing the
 *  existing union rather than declaring a parallel one keeps this comparable
 *  with everything the scan pipeline already emits. */
export type QuestionType = ProblemKind | 'not-math';

export type MathEngineAction = 'solve' | 'validate' | 'simplify' | 'none';

export type NextStep = 'hint1' | 'hint2' | 'solve' | 'ask_clarification';

/**
 * The six values are `AnswerDiagnosis['kind']` passed through UNCHANGED — the
 * same strings lib/answer-check.ts already produces and lib/tutor-presence.ts
 * already transports. The two extras are cases that file deliberately does not
 * diagnose:
 *
 *   'rounding'    the value is right but the student truncated it. answer-check
 *                 uses an ABSOLUTE tolerance of 1e-7, so 3.14 for π is graded
 *                 wrong with no diagnosis at all. Naming it here does not
 *                 change grading — it only lets the tutor say "your method was
 *                 right, you rounded too early" instead of a bare ✗.
 *   'unreadable'  the typed answer could not be parsed. NOT the same as wrong,
 *                 and must never be shown to the student as wrong.
 */
export type MistakeType = AnswerDiagnosis['kind'] | 'rounding' | 'unreadable';

export type DerivedHint = {
  tier: 'hint1' | 'hint2';
  text: string;
  /** 'template' = keyed off questionType/domain, no numbers from the answer.
   *  'first-step' = the first real step of the deterministic solution. */
  source: 'template' | 'first-step';
};

export type QuestionAnalysis = {
  status: AnalyzeStatus;
  normalizedQuestion: string;
  questionType: QuestionType;
  /** Canonical Hebrew topic key, byte-for-byte as content/bagrut-curriculum.ts
   *  spells it, or null. Never a guess: null means "not confidently known". */
  topic: string | null;
  /** English kebab sub-topic slug. Almost always null — a sub-topic cannot be
   *  told from raw text without the authored content, and inventing one sends
   *  the student to the wrong lesson. */
  subtopic: string | null;
  /** 1–5. A STRUCTURAL estimate, not a pedagogical one. See `estimateDifficulty`. */
  difficulty: 1 | 2 | 3 | 4 | 5;
  requiredAction: string;
  variables: string[];
  deterministicEligible: boolean;
  mathEngineAction: MathEngineAction;
  /** 0–1, how sure we are the question was READ correctly. Never rounded up. */
  confidence: number;
  detectedMistakeType: MistakeType | null;
  recommendedNextStep: NextStep;
  requiresLLM: boolean;
  warnings: string[];

  // ---- additive: everything above is the agreed contract, everything below
  // ---- is what makes the result usable without a second round trip.

  /** Machine-facing branch of maths, from the existing classifier. */
  domain: MathDomain;
  /** The maths, separated from the prose and normalised for mathjs. */
  normalizedExpressions: string[];
  /** Hebrew instruction words that drove the classification — the audit trail
   *  for why this was called an integral rather than a derivative. */
  cues: string[];
  /** True for a multi-section bagrut question (א, ב, ג …). Such a question is
   *  never one deterministic problem. */
  multiPart: boolean;
  /** Present only when the engine actually ran. */
  solution: {
    engine: string;
    answerLatex: string;
    answerValues: string[];
    /** Substituted back and checked — not "the engine said so". */
    verified: boolean;
    steps: SolveStep[];
  } | null;
  /** Present only when a studentAnswer was supplied AND could be judged. */
  verdict: { isCorrect: boolean } | null;
  /** Derived rungs. Empty when nothing safe could be derived. */
  hints: DerivedHint[];
};

// ============================================================
// Limits
// ============================================================

/** Long enough for a full multi-part bagrut question, short enough that a
 *  hostile payload cannot make mathjs chew. Matches MAX_QUESTION_LEN in
 *  lib/agents/config.ts so the two boundaries cannot drift apart. */
export const MAX_QUESTION_CHARS = 2000;
export const MAX_ANSWER_CHARS = 300;
/** The SymPy hop alone allows 12s (engine-sympy.ts TIMEOUT_MS). */
const DEFAULT_TIMEOUT_MS = 15_000;

/** Kinds a deterministic engine can actually finish. Mirrors the DETERMINISTIC
 *  list in lib/math-engine.ts on purpose — that file owns the engine chain,
 *  this one owns the routing decision, and a kind that is in one and not the
 *  other is a bug in whichever was edited last. Asserted in the tests. */
const DETERMINISTIC_KINDS: ProblemKind[] = [
  'equation',
  'inequality',
  'system',
  'simplify',
  'evaluate',
  'derivative',
  'integral',
  'definite-integral',
  'limit',
];

// ============================================================
// Hebrew, human-facing strings
// ============================================================

const ACTION_HE: Record<QuestionType, string> = {
  equation: 'לפתור את המשוואה ולמצוא את הנעלם',
  inequality: 'לפתור את אי השוויון ולתאר את תחום הפתרון',
  system: 'לפתור את מערכת המשוואות ולמצוא את כל הנעלמים',
  simplify: 'לפשט את הביטוי',
  evaluate: 'לחשב את הערך המספרי',
  derivative: 'לגזור את הפונקציה',
  integral: 'למצוא פונקציה קדומה',
  'definite-integral': 'לחשב אינטגרל מסוים בין הגבולות הנתונים',
  limit: 'לחשב את הגבול',
  unknown: 'לא ברור מה נדרש בשאלה',
  'not-math': 'אין כאן שאלה מתמטית לפתור',
};

/**
 * Rung 1: names the METHOD, never a number from the answer.
 *
 * These are written as prose with plain ASCII maths rather than LaTeX islands:
 * the result is consumed by callers we do not control, and a bare `-` next to
 * a Hebrew word renders as a minus sign in RTL.
 */
const APPROACH_HE: Partial<Record<ProblemKind, string>> = {
  equation:
    'זו משוואה. המטרה היא לבודד את הנעלם: מעבירים את כל האיברים שמכילים אותו לאגף אחד, ואת המספרים לאגף השני.',
  inequality:
    'זה אי שוויון. פותרים אותו כמו משוואה, עם כלל אחד נוסף: כפל או חילוק במספר שלילי הופך את כיוון הסימן.',
  system:
    'זו מערכת משוואות. בוחרים שיטה, הצבה או חיבור וחיסור, ומבודדים נעלם אחד מתוך אחת המשוואות לפני שממשיכים.',
  simplify:
    'זה תרגיל פישוט. לפני שפותחים סוגריים כדאי לחפש גורם משותף או נוסחת כפל מקוצר, כי בדרך כלל הם מקצרים את הדרך.',
  evaluate: 'זה חישוב ערך. מציבים את הנתונים ופועלים לפי סדר פעולות החשבון.',
  derivative:
    'זו שאלת גזירה. השלב הראשון הוא לזהות את מבנה הפונקציה, מכפלה, מנה או הרכבה, ורק אז לבחור את כלל הגזירה המתאים.',
  integral:
    'זו שאלת אינטגרל. מחפשים את הפונקציה שהנגזרת שלה היא הביטוי שנתון, ולא שוכחים את קבוע האינטגרציה.',
  'definite-integral':
    'זה אינטגרל מסוים. קודם מוצאים פונקציה קדומה, ורק אחר כך מציבים את הגבול העליון פחות הגבול התחתון.',
  limit:
    'זו שאלת גבול. מציבים קודם כל; אם מתקבל ביטוי לא מוגדר, מפרקים לגורמים או מצמצמים ומנסים שוב.',
};

/** A second sentence, only where the branch of maths genuinely changes the
 *  first move. Silence is better than a generic filler sentence. */
const DOMAIN_NOTE_HE: Partial<Record<MathDomain, string>> = {
  sequences:
    'בסדרה חשבונית האיבר הכללי הוא a1 ועוד (n פחות 1) כפול d, ובסדרה הנדסית הוא a1 כפול q בחזקת (n פחות 1). קודם מזהים איזו משתי הסדרות זו.',
  trigonometry:
    'שימו לב לתחום שבו מחפשים את הפתרון, ולכך שבבגרות העבודה היא במעלות ולא ברדיאנים.',
  statistics: 'כדאי לסמן את המאורעות באותיות ולכתוב מה נתון לפני שמציבים בנוסחה.',
  'analytic-geometry':
    'כמעט תמיד מתחילים משיפוע או ממשוואת ישר או מעגל. כדאי לרשום את הנקודות הנתונות בצד.',
  complex: 'כדאי להחליט מראש אם נוח יותר לעבוד בצורה אלגברית או בצורה קוטבית.',
};

// ============================================================
// The entry point
// ============================================================

export async function analyzeQuestion(input: AnalyzeInput): Promise<QuestionAnalysis> {
  const warnings: string[] = [];
  const mode: AnalyzeMode = input.requestedMode ?? 'auto';
  const level: UnitLevel = input.studentContext?.level ?? 5;

  // ---- 0. input hygiene -------------------------------------------------
  const raw = typeof input.question === 'string' ? input.question.trim() : '';
  if (!raw) return unsupported('', 'no question text supplied');
  if (raw.length > MAX_QUESTION_CHARS) {
    return unsupported(raw.slice(0, 120), `question exceeds ${MAX_QUESTION_CHARS} characters`);
  }

  const typedAnswer =
    typeof input.studentAnswer === 'string' ? input.studentAnswer.trim().slice(0, MAX_ANSWER_CHARS) : '';

  // ---- 1. normalise -----------------------------------------------------
  // OCR repair first (glyph-level), then the maths runs are pulled out of the
  // prose, then each run is converted to something mathjs can read. Doing this
  // in any other order loses the Hebrew instruction or mangles the maths.
  const normalizedQuestion = repairOcrText(raw);
  const segments = extractMathSegments(normalizedQuestion);
  const expressions = segments.length > 0 ? segments : fallbackExpressions(normalizedQuestion);
  const normalizedExpressions = expressions.map((e) => latexToMathjs(e).trim()).filter(Boolean);

  if (unbalancedDollars(normalizedQuestion) !== 0) {
    warnings.push('unbalanced math delimiters — the transcription may be truncated');
  }
  if (hasHebrewInsideMath(normalizedQuestion)) {
    // Hebrew inside a math island is the signature of a bad OCR pass. Left
    // alone it becomes SymPy variables and produces a confident answer to a
    // question nobody asked.
    warnings.push('Hebrew letters inside a math expression — the transcription is unreliable');
  }

  // ---- 2. classify ------------------------------------------------------
  const problem = classifyProblem({ text: normalizedQuestion, expressions });

  // ⚠️ "no expressions" is NOT the same as "not maths", and collapsing the two
  // gets both halves wrong in opposite directions.
  //
  //   "ספר לי בדיחה"            no expressions, no maths vocabulary → not maths.
  //                             A model has no better answer than we do, and
  //                             sending it one is a paid call for nothing.
  //   "הוכח שהסדרה מתכנסת"      no expressions, but the vocabulary is squarely
  //                             maths — a proof. No deterministic engine can
  //                             touch it, and it is precisely what a model IS
  //                             for. Filing it as junk silently drops a real
  //                             question on the floor.
  //
  // `domain` separates them for free: classifyProblem scores it from
  // vocabulary alone, with no expression required.
  const isMathsProse = problem.domain !== 'unknown' || problem.cues.length > 0;
  const questionType: QuestionType =
    problem.kind === 'unknown' && normalizedExpressions.length === 0 && !isMathsProse
      ? 'not-math'
      : problem.kind;

  if (questionType === 'not-math') {
    return {
      ...unsupported(normalizedQuestion, 'no mathematical expression found'),
      cues: problem.cues,
      warnings: [...warnings, 'no mathematical expression found'],
    };
  }

  if (normalizedExpressions.length === 0) {
    warnings.push('a maths question with no expression to compute — prose reasoning is required');
  }

  // ---- 3. topic ---------------------------------------------------------
  const rawTopic = topicForDomain(problem.domain, level, problem.kind);
  // Assert at the boundary. `topicForDomain` draws from a list that is supposed
  // to mirror the curriculum byte-for-byte, and the Hebrew spellings differ by
  // a single yod between two topics (גיאומטריה אוקלידית vs גאומטריה אנליטית).
  // A drifted string resolves to nothing SILENTLY all the way to the tutor, so
  // it is better to return null and say why.
  let topic: string | null = rawTopic;
  if (rawTopic && !getTopicMapping(rawTopic)) {
    warnings.push(`topic "${rawTopic}" is not in the curriculum — dropped rather than passed on`);
    topic = null;
  }
  if (!topic && level !== 5) {
    warnings.push(`unit level ${level} has no authored topics yet`);
  }

  const scope = checkScope(problem.kind, problem.domain, level);
  if (!scope.inScope) warnings.push(scope.reason);

  // ---- 4. can a deterministic engine finish this? -----------------------
  const parseable =
    normalizedExpressions.length > 0 && normalizedExpressions.every(parseableExpression);
  if (normalizedExpressions.length > 0 && !parseable) {
    warnings.push('at least one expression could not be parsed');
  }

  // Parsing is not the same as being maths. mathjs reads `cat /etc/passwd` as
  // a perfectly valid division of three variables and the engine "solves" it
  // to `cat/etc/passwd` — nothing executes, but a confident solution to a
  // shell command is exactly the failure the brief names: do not attempt to
  // solve text that is not a valid mathematical expression.
  const prose = prosePosingAsMaths(normalizedExpressions, problem.variables);
  if (parseable && prose) warnings.push(prose);

  const deterministicEligible =
    DETERMINISTIC_KINDS.includes(problem.kind) &&
    parseable &&
    !prose &&
    !problem.multiPart &&
    !hasHebrewInsideMath(normalizedQuestion);

  if (problem.multiPart && DETERMINISTIC_KINDS.includes(problem.kind)) {
    warnings.push('multi-part question — analyse each section separately');
  }

  const mathEngineAction: MathEngineAction = !deterministicEligible
    ? 'none'
    : typedAnswer && mode !== 'solve' && mode !== 'hint'
      ? 'validate'
      : problem.kind === 'simplify'
        ? 'simplify'
        : 'solve';

  // ---- 5. confidence ----------------------------------------------------
  const confidence = rollUpConfidence(problem.confidence, {
    unknownKind: problem.kind === 'unknown',
    unparseable: normalizedExpressions.length > 0 && !parseable,
    noTopic: topic === null,
    hebrewInMath: hasHebrewInsideMath(normalizedQuestion),
    outOfScope: !scope.inScope,
  });

  // ---- 6. run the engine, if it is worth running ------------------------
  let engineResult: MathEngineResult | null = null;
  if (mathEngineAction !== 'none' && mode !== 'explain') {
    engineResult = await withTimeout(
      mathEngineAction === 'validate'
        ? MathEngine.validate(typedAnswer, {
            expression: normalizedExpressions,
            variable: problem.variables[0],
          })
        : mathEngineAction === 'simplify'
          ? MathEngine.simplify(normalizedExpressions[0], { variable: problem.variables[0] })
          : MathEngine.solve(normalizedExpressions, { variable: problem.variables[0] }),
      input.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    );
    if (!engineResult) warnings.push('the maths engine did not answer in time');
    else warnings.push(...engineResult.warnings);
  }

  const solution =
    engineResult && engineResult.success
      ? {
          engine: engineResult.engine,
          answerLatex: engineResult.result,
          answerValues: engineResult.values,
          verified: engineResult.isExact,
          steps: engineResult.steps,
        }
      : null;

  // ---- 7. the student's answer -----------------------------------------
  const verdict =
    engineResult && engineResult.isCorrect !== null ? { isCorrect: engineResult.isCorrect } : null;

  const detectedMistakeType = typedAnswer
    ? diagnoseMistake(typedAnswer, engineResult, verdict)
    : null;

  // ---- 8. hints ---------------------------------------------------------
  const hints = deriveHints(problem.kind, problem.domain, solution, warnings);

  // ---- 9. what should happen next --------------------------------------
  const requiresLLM = decideRequiresLLM({
    mode,
    confidence,
    deterministicEligible,
    solved: solution !== null,
    hints: hints.length,
    multiPart: problem.multiPart,
    outOfScope: !scope.inScope,
  });

  const recommendedNextStep = decideNextStep({
    mode,
    confidence,
    typedAnswer: Boolean(typedAnswer),
    verdict,
    detectedMistakeType,
    hints,
  });

  const status: AnalyzeStatus = !scope.inScope
    ? 'unsupported'
    : deterministicEligible && (solution !== null || mathEngineAction === 'none')
      ? 'ok'
      : deterministicEligible && solution === null
        ? 'partial'
        : 'partial';

  return {
    status,
    normalizedQuestion,
    questionType,
    topic,
    subtopic: null, // see the type comment: never guessed from raw text
    difficulty: estimateDifficulty(problem.kind, problem.domain, normalizedExpressions, problem.variables, problem.multiPart),
    requiredAction: ACTION_HE[questionType] ?? ACTION_HE.unknown,
    variables: problem.variables,
    deterministicEligible,
    mathEngineAction,
    confidence,
    detectedMistakeType,
    recommendedNextStep,
    requiresLLM,
    warnings: dedupe(warnings),

    domain: problem.domain,
    normalizedExpressions,
    cues: problem.cues,
    multiPart: problem.multiPart,
    solution,
    verdict,
    hints,
  };
}

// ============================================================
// Pieces
// ============================================================

function unsupported(normalizedQuestion: string, reason: string): QuestionAnalysis {
  return {
    status: 'unsupported',
    normalizedQuestion,
    questionType: 'not-math',
    topic: null,
    subtopic: null,
    difficulty: 1,
    requiredAction: ACTION_HE['not-math'],
    variables: [],
    deterministicEligible: false,
    mathEngineAction: 'none',
    confidence: 0,
    detectedMistakeType: null,
    recommendedNextStep: 'ask_clarification',
    // An unsupported input is NOT automatically a model's problem. "solve my
    // homework please" with no maths in it has no good model answer either,
    // and defaulting to true here would turn every junk payload into a paid
    // call — the exact leak this file exists to close.
    requiresLLM: false,
    warnings: [reason],
    domain: 'unknown',
    normalizedExpressions: [],
    cues: [],
    multiPart: false,
    solution: null,
    verdict: null,
    hints: [],
  };
}

/**
 * Does this parse as maths while obviously not being maths? Returns the reason,
 * or null when it looks like a genuine expression.
 *
 * mathjs is permissive by design: every bare word becomes a Symbol, so
 * `cat /etc/passwd` is a valid division and `foo bar` is a valid product. That
 * permissiveness is what let a shell command come back with a "solution", and
 * it is the same shape of bug as Hebrew prose becoming SymPy variables — a
 * confident answer to a question nobody asked.
 *
 * Two signals, both cheap:
 *   - characters that appear in code and never in a bagrut expression
 *   - two or more multi-letter "variables". Exam maths names its unknowns
 *     x, y, t, a₁ — one long identifier might be an OCR artefact, but two is
 *     prose wearing an expression's clothes.
 *
 * ponytail: a heuristic, not a grammar. It runs only to DISQUALIFY, so its
 * failure mode is handing something to the caller as `requiresLLM` — the safe
 * direction.
 */
function prosePosingAsMaths(expressions: string[], variables: string[]): string | null {
  const joined = expressions.join(' ');
  if (/__|['"`;\\]|\bimport\b|\bsystem\b|\beval\b|\bexec\b/.test(joined)) {
    return 'the expression contains code syntax, not mathematics';
  }
  const wordy = variables.filter((v) => v.replace(/[_\d]/g, '').length >= 3);
  if (wordy.length >= 2) {
    return `not a mathematical expression — "${wordy.slice(0, 3).join('", "')}" are words, not unknowns`;
  }
  return null;
}

/**
 * Can mathjs read this, EACH SIDE SEPARATELY?
 *
 * ⚠️ `isParseable('2*x + 3 = 11')` is FALSE. mathjs reads `=` as assignment,
 * so a perfectly ordinary bagrut equation fails to parse as one expression —
 * and a naive whole-string check therefore declares every equation, system and
 * inequality in the app undeterministic, routes them all to a model, and looks
 * like nothing more than a slightly cautious classifier while doing it. That is
 * the single most expensive bug this file could have shipped.
 *
 * classify.ts splits relations for exactly the same reason (see its `--- variables ---`
 * block); this is the same rule applied to the parse check.
 */
function parseableExpression(expression: string): boolean {
  const relation = splitRelation(expression);
  if (relation) return isParseable(relation.lhs) && isParseable(relation.rhs);
  return isParseable(expression);
}

/**
 * No `$…$` delimiters anywhere — common for a pasted exercise. Take the lines
 * that look like maths rather than giving up: a line qualifies when it holds a
 * relation or an operator AND a digit or a single Latin letter.
 */
function fallbackExpressions(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line || line.length > 200) return false;
      const hasMathish = /[=<>+\-*/^√∫]/.test(line);
      const hasOperand = /[0-9]|(?:^|[^A-Za-z])[a-zA-Z](?:[^A-Za-z]|$)/.test(line);
      return hasMathish && hasOperand;
    })
    .map((line) =>
      // Strip the Hebrew instruction that so often shares the line with the
      // maths ("פתור את המשוואה: 2x+3=11"), keeping the maths after the colon.
      line.includes(':') && /[א-ת]/.test(line.split(':')[0]) ? line.split(':').slice(1).join(':').trim() : line,
    )
    .filter(Boolean)
    .slice(0, 6);
}

/**
 * Start from the classifier's own confidence and only ever go DOWN.
 *
 * Every multiplier below is a reason to doubt that the question was READ
 * correctly, which is a different thing from whether the answer is right —
 * `solution.verified` covers that. Conflating the two is how a guess reaches a
 * student wearing the clothes of a fact.
 */
function rollUpConfidence(
  base: number,
  flags: {
    unknownKind: boolean;
    unparseable: boolean;
    noTopic: boolean;
    hebrewInMath: boolean;
    outOfScope: boolean;
  },
): number {
  let c = base;
  if (flags.unknownKind) c *= 0.5;
  if (flags.unparseable) c *= 0.5;
  if (flags.hebrewInMath) c *= 0.4;
  if (flags.noTopic) c *= 0.85;
  if (flags.outOfScope) c *= 0.7;
  return Math.round(Math.max(0, Math.min(1, c)) * 100) / 100;
}

/**
 * A STRUCTURAL estimate on 1–5. It counts what makes a question long, not what
 * makes it conceptually hard — a one-line question can be brutal and this will
 * call it a 1. It is honest about that rather than pretending to judge
 * pedagogy, and it is deterministic, which is what makes it free.
 *
 * ponytail: structural only. Swap for the authored `difficulty` whenever the
 * caller has a question id — authored beats derived every time.
 */
function estimateDifficulty(
  kind: ProblemKind,
  domain: MathDomain,
  expressions: string[],
  variables: string[],
  multiPart: boolean,
): 1 | 2 | 3 | 4 | 5 {
  let score = 1;
  const joined = expressions.join(' ');

  if (maxDegree(joined) >= 2) score += 1;
  if (variables.length >= 2) score += 1;
  if (multiPart) score += 1;
  if (kind === 'system' || kind === 'definite-integral' || kind === 'limit' || kind === 'integral') {
    score += 1;
  }
  if (domain === 'complex' || domain === 'vectors' || domain === 'trigonometry') score += 1;
  // A fraction with an unknown in the denominator, a root, or a log all add a
  // domain-of-definition step that students routinely lose marks on.
  if (/sqrt|√|log|ln|\/\s*\(?[a-zA-Z]/.test(joined)) score += 1;

  return Math.max(1, Math.min(5, score)) as 1 | 2 | 3 | 4 | 5;
}

/** Highest explicit exponent in the expression. `x^2` and `x²` both count. */
function maxDegree(expression: string): number {
  let best = 0;
  for (const m of expression.matchAll(/\^\s*\{?\s*(\d+)/g)) best = Math.max(best, Number(m[1]));
  if (/[²]/.test(expression)) best = Math.max(best, 2);
  if (/[³]/.test(expression)) best = Math.max(best, 3);
  return best;
}

/**
 * Name the mistake when its SHAPE names itself, and stay silent otherwise.
 *
 * The six structural diagnoses come straight from lib/answer-check.ts —
 * unchanged strings, so a consumer that already renders them keeps working.
 * 'rounding' is added here because answer-check compares with an ABSOLUTE
 * tolerance of 1e-7 and therefore cannot tell "wrong method" from "right
 * method, truncated at two decimals".
 */
function diagnoseMistake(
  typedAnswer: string,
  engineResult: MathEngineResult | null,
  verdict: { isCorrect: boolean } | null,
): MistakeType | null {
  if (!engineResult) return null;
  if (engineResult.diagnosis) return engineResult.diagnosis.kind;
  if (verdict === null) {
    // No verdict at all means the answer could not be read. That is NOT wrong,
    // and a caller that renders it as wrong is punishing a typo.
    return engineResult.warnings.some((w) => /could not read/i.test(w)) ? 'unreadable' : null;
  }
  if (verdict.isCorrect) return null;

  // ponytail: plain-decimal comparison only — it catches 3.14 for π and 0.33
  // for 1/3, which is the case that actually happens. A rounded answer written
  // as an expression is not detected; widen only if the misses show up.
  const typed = Number(typedAnswer.replace(',', '.').trim());
  if (!Number.isFinite(typed)) return null;
  for (const value of engineResult.values) {
    const exact = numericValue(value);
    if (exact === null) continue;
    const scale = Math.max(1, Math.abs(exact));
    const off = Math.abs(exact - typed) / scale;
    if (off > 0 && off < 0.005) return 'rounding';
  }
  return null;
}

/**
 * The engine's own answer as a number, or null.
 *
 * `Number('1/3')` is NaN, and the engine legitimately returns exact fractions —
 * so a bare `Number()` here silently skipped every fractional answer and the
 * rounding check could only ever fire on integers, which is the one case where
 * rounding does not happen. Deliberately NOT an evaluator: this parses a
 * literal and a simple ratio, nothing else, so no engine output and certainly
 * no student input can reach anything that executes.
 */
function numericValue(value: string): number | null {
  // The engine wraps exact fractions in parentheses — the linear solver returns
  // the string "(1/3)", not "1/3". Measured, not assumed: without this strip
  // the ratio branch below never fired once in practice.
  let raw = String(value ?? '').trim();
  while (raw.startsWith('(') && raw.endsWith(')')) raw = raw.slice(1, -1).trim();

  const direct = Number(raw);
  if (Number.isFinite(direct)) return direct;
  const ratio = raw.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
  if (ratio) {
    const denominator = Number(ratio[2]);
    if (denominator !== 0) return Number(ratio[1]) / denominator;
  }
  return null;
}

/**
 * Rung 1 names the method; rung 2 shows the first real move.
 *
 * Rung 2 is screened with `leaksAnswer` — the SAME predicate the content gate
 * (`npm run verify:help`) uses, not a private copy, so a hint that would fail
 * the gate in authored content also fails here.
 *
 * ⚠️ `leaksAnswer` returns false for any answer under 4 normalised characters,
 * deliberately, to avoid false positives. So a short numeric answer can slip
 * through it — the explicit `includes` check below is the backstop for exactly
 * that case, and it is why rung 2 is dropped rather than trimmed.
 */
function deriveHints(
  kind: ProblemKind,
  domain: MathDomain,
  solution: QuestionAnalysis['solution'],
  warnings: string[],
): DerivedHint[] {
  const hints: DerivedHint[] = [];

  const approach = APPROACH_HE[kind];
  if (approach) {
    const note = DOMAIN_NOTE_HE[domain];
    hints.push({ tier: 'hint1', text: note ? `${approach} ${note}` : approach, source: 'template' });
  }

  if (!solution || solution.steps.length === 0) return hints;

  // 'restate' is the question read back — it is not a hint.
  const firstMove = solution.steps.find((s) => s.kind !== 'restate' && s.latex);
  if (!firstMove?.latex) return hints;

  const finalAnswer = solution.answerLatex || solution.answerValues.join(', ');
  const normalised = firstMove.latex.replace(/\s+/g, '');
  const answerBare = finalAnswer.replace(/\s+/g, '');
  const wouldLeak =
    leaksAnswer(firstMove.latex, finalAnswer) ||
    (answerBare.length > 0 && normalised.includes(answerBare));

  if (wouldLeak) {
    warnings.push('the first solution step already contains the answer — hint 2 withheld');
    return hints;
  }

  hints.push({
    tier: 'hint2',
    text: `הצעד הראשון הוא: ${firstMove.latex}`,
    source: 'first-step',
  });
  return hints;
}

/**
 * `requiresLLM` is the only door to a paid call, so every condition here has to
 * earn its place. The default is FALSE: a question the engine handled, or one
 * we can hint at from templates, is finished without a model.
 */
function decideRequiresLLM(f: {
  mode: AnalyzeMode;
  confidence: number;
  deterministicEligible: boolean;
  solved: boolean;
  hints: number;
  multiPart: boolean;
  outOfScope: boolean;
}): boolean {
  // An explicit request for a personalised explanation is the one case the
  // brief names outright, and the one thing templates genuinely cannot do.
  if (f.mode === 'explain') return true;
  // Out of syllabus: there is a ready Hebrew sentence for this and no reason
  // to pay a model to repeat it.
  if (f.outOfScope) return false;
  // We do not trust our own reading of the question.
  if (f.confidence < 0.5) return true;
  // A multi-part bagrut question needs prose reasoning across sections.
  if (f.multiPart) return true;
  // Nothing deterministic to offer AND nothing to hint with.
  if (!f.deterministicEligible && f.hints === 0) return true;
  // The engine was eligible but came back empty.
  if (f.deterministicEligible && !f.solved && f.hints === 0) return true;
  return false;
}

function decideNextStep(f: {
  mode: AnalyzeMode;
  confidence: number;
  typedAnswer: boolean;
  verdict: { isCorrect: boolean } | null;
  detectedMistakeType: MistakeType | null;
  hints: DerivedHint[];
}): NextStep {
  if (f.confidence < 0.4) return 'ask_clarification';
  if (f.mode === 'solve') return 'solve';

  if (f.typedAnswer) {
    if (f.verdict?.isCorrect) return 'solve'; // right answer → show the full working
    // A named mistake means we can point at the specific move that went wrong,
    // which is rung 2's job. An unnamed one gets the gentler rung.
    if (f.detectedMistakeType && f.detectedMistakeType !== 'unreadable') {
      return f.hints.some((h) => h.tier === 'hint2') ? 'hint2' : 'hint1';
    }
    if (f.detectedMistakeType === 'unreadable') return 'ask_clarification';
    return 'hint1';
  }

  if (f.mode === 'hint') return 'hint1';
  return f.hints.length > 0 ? 'hint1' : 'solve';
}

/** Resolves to null on timeout rather than rejecting — a slow engine is an
 *  outcome to report, not an exception to leak. */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<null>((resolve) => {
        timer = setTimeout(() => resolve(null), ms);
      }),
    ]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function dedupe(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

export const __testables = {
  prosePosingAsMaths,
  parseableExpression,
  estimateDifficulty,
  maxDegree,
  rollUpConfidence,
  fallbackExpressions,
  diagnoseMistake,
  deriveHints,
  decideRequiresLLM,
  decideNextStep,
  DETERMINISTIC_KINDS,
  splitRelation,
};
