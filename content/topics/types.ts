// Types for the rich per-topic study content (the "topic-schema" format).
//
// One topic = one JSON file under content/topics/<topicId>.json, authored by
// hand and validated against this shape, then rendered by <TopicView> in
// components/topic/. This is a richer, JSON-based successor to the older
// hand-written TypeScript Lesson modules under content/lessons/ — it makes the
// pedagogy explicit: plain-language intuition, a WHY for every solution step,
// named common mistakes, the exam connection, and progressive-hint practice.
//
// ── MATH CONVENTION ────────────────────────────────────────────────────────
// Every mathematical expression inside a string field is written as inline
// LaTeX delimited by $...$  (e.g.  "הנגזרת $f'(x) = 2x$").  The renderer pipes
// every string through <MathText> (remark-math + KaTeX), so markdown works too
// and each math run is isolated LTR inside the RTL Hebrew flow.
//
// The ONE exception is `Formula.latex`, which is RAW LaTeX with NO delimiters
// (the renderer wraps it as display math itself).

export type TopicContent = {
  /** kebab-case slug; also the JSON filename and the URL segment. */
  topicId: string;
  title: string;
  /** Subject key, e.g. "math-5units". */
  subject: string;
  /** Israeli bagrut exam-form code, e.g. "582". */
  examForm: string;
  /** Rough time-on-task for the whole topic, in minutes. */
  estimatedMinutes: number;

  prerequisites: Prerequisite[];
  intuition: Intuition;
  formalDefinition: FormalDefinition;
  keyConcepts: KeyConcept[];
  workedExamples: WorkedExample[];
  commonMistakes: CommonMistake[];
  examConnection: ExamConnection;
  practice: PracticeProblem[];
};

/** A topic the student should already know; links to that topic's own page. */
export type Prerequisite = {
  label: string;
  /** topicId of the prerequisite topic (used to build the link). */
  topicId: string;
};

/** Plain-language "why this works" before any formalism. */
export type Intuition = {
  text: string;
  /** Optional real-world analogy that makes the idea tangible. */
  analogy?: string;
};

export type FormalDefinition = {
  text: string;
  formulas: Formula[];
};

/** A named formula. NOTE: `latex` is RAW LaTeX with NO $...$ delimiters. */
export type Formula = {
  name: string;
  latex: string;
  explanation: string;
};

export type KeyConcept = {
  /** stable id; referenced by PracticeProblem.relatedConcept. */
  id: string;
  term: string;
  explanation: string;
  whyItMatters: string;
};

export type WorkedExample = {
  id: string;
  /** 1–5 difficulty; drives the difficulty-dots badge. */
  difficulty: number;
  problem: string;
  steps: WorkedStep[];
  answer: string;
};

/** One step of a worked solution: WHAT we do (`action`) and WHY (`why`). */
export type WorkedStep = {
  action: string;
  why: string;
};

export type CommonMistake = {
  mistake: string;
  fix: string;
};

export type ExamConnection = {
  text: string;
  /** Phrases in the exam wording that signal this topic is in play. */
  triggerWords: string[];
};

export type PracticeProblem = {
  id: string;
  difficulty: number;
  /** id of the KeyConcept this drills (KeyConcept.id). */
  relatedConcept: string;
  problem: string;
  /** Revealed ONE AT A TIME, in order, in the practice UI. */
  hints: string[];
  solution: PracticeSolution;
};

export type PracticeSolution = {
  /** Each entry is one stacked line of the worked solution. */
  steps: string[];
  answer: string;
};
