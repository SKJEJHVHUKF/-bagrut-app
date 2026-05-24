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
  /** Optional inline diagrams (SVG-rendered) shown beneath the body.
   *  Used heavily by geometry lessons; ignored elsewhere. */
  diagrams?: DiagramSpec[];
};

// ============================================================
// DiagramSpec — declarative SVG diagrams for geometry lessons.
// ============================================================
//
// A discriminated union of geometric primitives. The component
// `<DiagramRenderer>` in components/practice/DiagramRenderer.tsx
// switches on `type` and produces the SVG. The lesson author writes
// data; styling and rendering live in the component.
//
// All diagrams render as a captioned <figure> with consistent
// stroke/fill conventions matching the app's dark theme.

export type DiagramSpec =
  /** A triangle. Vertices labeled (default A, B, C). Optional right-
   *  angle marker at one vertex; congruent-side tick marks. */
  | {
      type: 'triangle';
      vertices?: [string, string, string];
      rightAngle?: 'A' | 'B' | 'C';
      /** Tick counts per side: [AB, BC, CA]. Equal counts = equal sides. */
      sideTicks?: [number, number, number];
      /** Mark equal angles by vertex name, e.g. ['A','B'] = ∠A ≅ ∠B. */
      equalAngles?: string[];
      /** Optional side labels (a, b, c) drawn at the midpoint of each side.
       *  Order matches sides opposite to vertices: [opp A, opp B, opp C]
       *  = [BC, CA, AB]. Used for sine/cosine theorems. */
      sideLabels?: [string, string, string];
      caption?: string;
    }
  /** Two triangles drawn side-by-side, showing congruence or similarity. */
  | {
      type: 'twoTriangles';
      relation: 'congruent' | 'similar';
      labels?: { left: [string, string, string]; right: [string, string, string] };
      caption?: string;
    }
  /** Two parallel lines cut by a transversal — for Thales theorem etc. */
  | {
      type: 'parallelTransversal';
      labels?: { lines: [string, string]; transversal: string };
      /** Points on each line where the transversal crosses, optional. */
      crossPoints?: [string, string];
      caption?: string;
    }
  /** A circle with optional center, radius, chord, tangent, or
   *  inscribed angle. */
  | {
      type: 'circle';
      showCenter?: boolean;
      centerLabel?: string;
      radiusTo?: string;
      chord?: { from: string; to: string };
      tangent?: { at: string };
      inscribedAngle?: { vertex: string; arc: [string, string] };
      caption?: string;
    }
  /** A regular polygon inscribed in a circle. */
  | {
      type: 'polygonInscribed';
      sides: number;
      caption?: string;
    }
  /** Unit circle with optional quadrant signs, special angles, and a
   *  highlighted angle. Used heavily in trigonometry. */
  | {
      type: 'unitCircle';
      /** Show ±/− labels in each quadrant for a chosen function. */
      showQuadrantSigns?: 'sin' | 'cos' | 'tan' | 'all';
      /** Highlight a specific angle (in degrees) with a radius + arc. */
      highlightAngle?: number;
      /** Show tick marks at 30°, 45°, 60°, 90° etc. */
      showSpecialAngles?: boolean;
      caption?: string;
    }
  /** A parallelogram with optional diagonals drawn. */
  | {
      type: 'parallelogram';
      withDiagonals?: boolean;
      labels?: [string, string, string, string];
      caption?: string;
    }
  /** Escape hatch — pass raw SVG body content directly. */
  | {
      type: 'custom';
      svg: string;
      viewBox?: string;
      caption?: string;
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
// BagrutQuestionPart — single sub-part of a bagrut question.
// ============================================================
//
// The field naming uses snake_case for `answer_type` and `final_answer`
// to stay compatible with `components/practice/QuestionPartCard` which
// was originally built to consume the API response shape. The static
// data passes through the same component untouched.

export type BagrutQuestionPart = {
  /** Section label — "א", "ב", "ג", "ד" (Hebrew) or "a"/"b"/"c" (English). */
  label: string;
  /** The sub-question text. */
  prompt: string;
  /** How the student is expected to answer (controls the input widget). */
  answer_type: 'number' | 'expression' | 'text';
  /** Exactly 3 hints, escalating from gentle to almost-the-answer. */
  hints: string[];
  solution: {
    steps: string[];
    final_answer: string;
  };
};

// ============================================================
// StaticBagrutQuestion — a full multi-part bagrut question.
// ============================================================
//
// Equivalent to what `/api/practice-bagrut` used to generate at runtime,
// but stored statically per topic. The exercise page reads from the
// lesson's bank and renders without any API call.

export type StaticBagrutQuestion = {
  /** Unique within the lesson, e.g. "alg-bag-001". */
  id: string;
  difficulty: 'easy' | 'mid' | 'hard';
  /** Shared setup for all sub-parts. Empty string if not needed. */
  context: string;
  /** Short sub-topic tag (e.g. "פונקציה ריבועית" or "אינטגרל מסוים"). */
  topic_tag?: string;
  /** 3-4 progressive sub-parts. Each is independently answerable. */
  parts: BagrutQuestionPart[];
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

  /** Multi-part bagrut questions — the "תרגול מהיר" route serves a
   *  random one from this bank instead of calling /api/practice. */
  bagrutQuestions?: StaticBagrutQuestion[];
};
