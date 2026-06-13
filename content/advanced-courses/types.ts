// ============================================================
// Advanced-course content schema — "קורס מתקדם" (רמת בגרות).
// ============================================================
//
// EXTENDS the learning-path system (content/learning-paths) — does not
// replace it. An AdvancedCourse lives ALONGSIDE the base LearningPath of
// the same topic, linked by the shared (subject, topic) key. The base
// course teaches CONCEPTS; the advanced course teaches HOW TO SOLVE FULL
// BAGRUT QUESTIONS — pattern recognition, multi-part decomposition,
// combining concepts, scoring, and time management.
//
// Like the base schema: every section is REQUIRED, lists are NonEmpty,
// and exam questions are forced by the type system to carry parts,
// per-part hints, a scoring rubric (points + deductions) and a target
// time. Shipping an incomplete course is a compile error.
//
// The seven sections, in fixed order:
//   1. gate          — entry check (3-4 base-course questions + referrals)
//   2. patterns      — the 3-6 recurring bagrut question templates
//   3. techniques    — advanced techniques the base course didn't cover
//   4. workedExams   — full exam questions decomposed "thinking aloud"
//   5. examPractice  — full multi-part questions w/ rubric + target time
//   6. traps         — exam-level traps that fail GOOD students
//   7. simulation    — one timed, hint-less question; pass = topic done

import type { DiagramSpec, NonEmpty, AnswerSpec } from '../learning-paths/types';

export type { DiagramSpec, NonEmpty };

// ------------------------------------------------------------
// Cross-links
// ------------------------------------------------------------

/** Pointer back into the BASE learning path of the same topic. Used by
 *  gate referrals ("חזור לחלק X בקורס הבסיס"). `conceptId` deep-links to
 *  a ConceptAtom anchor; `sectionId` to a PATH_SECTIONS anchor. */
export type BaseCourseRef = {
  sectionId?: string;
  conceptId?: string;
  /** Display label, e.g. "מושג 4 — הצגה קוטבית". */
  label: string;
};

/** Pointer to a pattern/technique INSIDE this advanced course. Used by
 *  exam-practice parts ("נתקעת? חזור לתבנית/טכניקה X"). */
export type AdvancedRef = {
  patternId?: string;
  techniqueId?: string;
  label: string;
};

// ============================================================
// §1 — Entry gate
// ============================================================
//
// Short MCQ check drawn from the base course. Failing a question shows a
// targeted referral to the exact base-course concept. The student may not
// proceed without passing (or explicitly choosing "skip — I know the
// basics"). Pass threshold lives in `passThreshold`.

export type GateQuestion = {
  id: string;
  question: string;
  answers: NonEmpty<string>;
  /** Index into `answers` of the correct option. Author it FIRST (0);
   *  the UI shuffles deterministically. */
  correct: number;
  explanation: string;
  /** Where to review in the BASE course if this was missed. */
  reviewRef: BaseCourseRef;
};

export type EntryGate = {
  /** 3-4 questions from base-course material. */
  questions: NonEmpty<GateQuestion>;
  /** Minimum correct answers to pass (e.g. 3 of 4). */
  passThreshold: number;
};

// ============================================================
// §2 — Question-pattern map
// ============================================================
//
// The recurring bagrut "templates" of this topic. The most-missing skill:
// students know the material but don't recognize what the question WANTS.

export type QuestionPattern = {
  /** Slug — anchor target (#pattern-<id>) for reviewRef links. */
  id: string;
  name: string;
  /** Trigger phrases — how to RECOGNIZE this pattern from the wording. */
  recognition: NonEmpty<string>;
  /** The general solution strategy, step by step. */
  strategy: NonEmpty<string>;
  /** Where it appears: which שאלון, which part of the question, frequency. */
  whereItAppears: string;
  /** Optional mini worked example (collapsed by default in the UI). */
  example?: { problem: string; solution: string };
};

// ============================================================
// §3 — Advanced techniques
// ============================================================

export type AdvancedTechnique = {
  /** Slug — anchor target (#technique-<id>). */
  id: string;
  title: string;
  /** When you reach for this technique. */
  when: string;
  /** The technique itself, explained (markdown+LaTeX). */
  body: string;
  workedExample: {
    problem: string;
    steps: NonEmpty<string>;
    answer: string;
  };
  diagrams?: DiagramSpec[];
};

// ============================================================
// §4 — Worked exams ("thinking aloud")
// ============================================================
//
// Full bagrut-style questions where every part is DECODED, not just
// solved: what it really asks, how earlier parts feed it, which pattern
// it is, and what the grader wants to see for full credit.

export type WorkedExamPart = {
  label: string;
  prompt: string;
  /** Decoding the wording — what this part REALLY asks. */
  whatItReallyAsks: string;
  /** How earlier parts serve this one. Omit for the first part. */
  buildsOn?: string;
  /** Which pattern this is (QuestionPattern.id). */
  patternId?: string;
  /** Fully reasoned solution steps. */
  steps: NonEmpty<string>;
  finalAnswer: string;
  /** What the grader looks for — how to WRITE it for full credit. */
  graderNotes: string;
};

export type WorkedExam = {
  id: string;
  /** e.g. "שאלה משולבת בסגנון קיץ" */
  title: string;
  context: string;
  parts: NonEmpty<WorkedExamPart>;
  diagrams?: DiagramSpec[];
};

// ============================================================
// §5 — Exam-level practice
// ============================================================
//
// Full multi-part questions at real exam difficulty, ordered by the
// patterns of §2. EVERY field below is mandatory by design: per-part
// hints, full solution, points, deductions, and a question-level target
// time. This is the rubric-and-clock layer the base course doesn't have.

export type ExamPart = {
  label: string;
  prompt: string;
  /** Gradual hints for THIS part (not one hint for the whole question). */
  hints: NonEmpty<string>;
  solution: {
    steps: NonEmpty<string>;
    finalAnswer: string;
  };
  /** Points this part is worth in the rubric. */
  points: number;
  /** What loses points here — the rubric's deduction lines. */
  deductions: NonEmpty<string>;
  /** Machine-checkable answer spec for free deterministic ($0) grading of
   *  the typed answer. value/set where checkable; kind:'manual' for proof,
   *  geometric description, "find all n", or compound multi-answer parts. */
  expected?: AnswerSpec;
  /** "נתקעת כאן? חזור לתבנית/טכניקה X." */
  reviewRef?: AdvancedRef;
  diagrams?: DiagramSpec[];
};

export type ExamQuestion = {
  id: string;
  /** The pattern(s) this question drills — orders §5 by §2. */
  patternIds: NonEmpty<string>;
  context: string;
  parts: NonEmpty<ExamPart>;
  /** Target solving time in minutes (exam time management). */
  targetMinutes: number;
  /** Total points — must equal the sum of part points (author-verified). */
  totalPoints: number;
  diagrams?: DiagramSpec[];
};

// ============================================================
// §6 — Exam-level traps
// ============================================================
//
// Not beginner mistakes — the ones that fail GOOD students: forgotten
// substitution constraints, domains, parameter edge cases, incomplete
// proof phrasing.

export type ExamTrap = {
  /** The trap, stated concretely. */
  trap: string;
  /** What it costs in grading. */
  consequence: string;
  /** The habit that avoids it. */
  avoid: string;
  relatedPatternId?: string;
};

// ============================================================
// §7 — Final simulation
// ============================================================
//
// One full question in exam mode: countdown timer, NO hints, solutions
// revealed only at the end. Passing marks the topic as mastered at
// bagrut level.

export type FinalSimulation = {
  /** Countdown length in minutes. */
  timeLimitMinutes: number;
  /** Shown before starting — what to expect and the rules. */
  brief: string;
  /** The exam question. Its `hints` are NOT shown in simulation mode. */
  question: ExamQuestion;
};

// ============================================================
// AdvancedCourse — the full package.
// ============================================================

export type AdvancedCourse = {
  /** Must match the base LearningPath + Lesson keys exactly. */
  subject: string;
  topic: string;
  title: string;
  tagline: string;
  estimatedMinutes: number;

  gate: EntryGate; // §1
  patterns: NonEmpty<QuestionPattern>; // §2
  techniques: NonEmpty<AdvancedTechnique>; // §3
  workedExams: NonEmpty<WorkedExam>; // §4
  examPractice: NonEmpty<ExamQuestion>; // §5
  traps: NonEmpty<ExamTrap>; // §6
  simulation: FinalSimulation; // §7
};

// ------------------------------------------------------------
// Section identifiers — fixed order, used by the view + progress lib.
// ------------------------------------------------------------
export const ADVANCED_SECTIONS = [
  { id: 'gate', title: 'שער כניסה', emoji: '🚪' },
  { id: 'patterns', title: 'מפת סוגי השאלות', emoji: '🗺️' },
  { id: 'techniques', title: 'טכניקות מתקדמות', emoji: '🛠️' },
  { id: 'worked-exams', title: 'בגרויות מפורקות', emoji: '🔍' },
  { id: 'exam-practice', title: 'תרגול ברמת בגרות', emoji: '📝' },
  { id: 'traps', title: 'מלכודות בגרות', emoji: '🪤' },
  { id: 'simulation', title: 'סימולציית סיום', emoji: '⏱️' },
] as const;

export type AdvancedSectionId = (typeof ADVANCED_SECTIONS)[number]['id'];
