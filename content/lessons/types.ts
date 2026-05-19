// Types for the static study-lesson content.
//
// Lessons are authored by hand in TypeScript modules under
// content/lessons/<subject>/<topic>.ts and served by the lesson page
// at /practice/[subject]/[topic]. They cover the same subject keys as
// /api/practice and /api/questions.
//
// Lessons now ALSO bundle a static question bank — the quiz route
// and the "quick practice" exercise serve from this bank instead of
// calling Claude. This is the static-first migration: zero AI cost
// for educational content, instant page loads, deterministic quality.

export type ConceptBlock = {
  title: string;
  body: string;
};

export type FormulaVariable = {
  sym: string;
  meaning: string;
};

export type Formula = {
  name: string;
  latex: string;
  variables: FormulaVariable[];
  note?: string;
};

export type WorkedExample = {
  difficulty: 'easy' | 'mid' | 'hard';
  problem: string;
  steps: string[];
  answer: string;
};

// ============================================================
// PracticeQuestion — single entry in the static question bank.
// ============================================================
//
// kind='mcq': multiple-choice. Must include `answers` (4 options) and
//             `correct` (index 0-3). Used by /quiz (instant grading).
// kind='open': free-form answer. The student types a response; we
//              reveal `solution` on demand. Optional `/api/check-answer`
//              call compares student input to `solution.finalAnswer`.

export type PracticeQuestion = {
  /** Unique within the lesson, e.g. "alg-001". */
  id: string;
  difficulty: 'easy' | 'mid' | 'hard';
  kind: 'mcq' | 'open';

  /** Question text — markdown + LaTeX, rendered by MathText. */
  question: string;

  /** MCQ-only: four answer options. */
  answers?: string[];
  /** MCQ-only: index of the correct option in `answers`. */
  correct?: number;

  /** Optional single hint shown before the student opens the full solution. */
  hint?: string;

  solution: {
    /** Step-by-step solution — one sentence per step, LaTeX-aware. */
    steps: string[];
    /** The final answer in bold, succinct form. */
    finalAnswer: string;
    /** Brief "why this works" — 1-2 sentences. */
    explanation: string;
  };
};

// ============================================================
// Lesson — the full topic package.
// ============================================================
//
// Every field is required EXCEPT `summary`, `examTips`, and `questions`
// remain optional during the migration so older lesson files keep
// compiling. Once all topics are migrated, we'll flip these to required.

export type Lesson = {
  subject: string;
  topic: string;
  title: string;
  intro: string;
  concepts: ConceptBlock[];
  formulas: Formula[];
  examples: WorkedExample[];
  pitfalls: string[];

  /** 5-7 must-remember bullets. Optional during migration. */
  summary?: string[];

  /** 3-5 exam-strategy tips (common-mistake patterns, shortcuts,
   *  what the grader is looking for). Optional during migration. */
  examTips?: string[];

  /** Static question bank — quiz and quick-exercise serve from here.
   *  Optional during migration. */
  questions?: PracticeQuestion[];
};
