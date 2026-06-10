// ============================================================
// Learning-path content schema — "לימוד מ-0".
// ============================================================
//
// This is the RICH, pedagogically-complete topic format. Unlike the
// legacy `Lesson` type (content/lessons/types.ts), where most fields are
// optional "during migration", EVERY section here is REQUIRED and most
// lists are non-empty by construction. The goal is structural: it should
// be a TypeScript ERROR to ship a topic that skips a pedagogical stage.
//
// A LearningPath turns a topic from a "summary document" into a guided
// route that takes a student who knows NOTHING up to a full bagrut
// question. The eight sections, in fixed order:
//
//   1. prerequisites      — what to know first (+ a refresher of each)
//   2. intuition          — WHY the topic exists, before any symbols
//   3. concepts           — the topic broken into small "atoms"
//   4. guidedExamples     — every step explains WHY, not just what
//   5. pitfalls           — where students actually fail
//   6. practice           — three graded levels (single → combined → bagrut)
//   7. formulaSheet       — quick review before a test
//   8. comprehensionCheck — short mastery gate before the next topic
//
// Rendering: served statically (zero AI cost). All hints, solutions and
// reasoning live in this data — nothing is generated at runtime. Math is
// authored as LaTeX inside `$...$` / `$$...$$` and rendered with KaTeX via
// <MathText>. Hebrew is RTL; keep the bidi rules from the style guide.
//
// We reuse two primitives from the legacy schema so authors have one
// vocabulary for formulas and diagrams across the whole app.

import type { Formula, DiagramSpec } from '../lessons/types';

export type { Formula, DiagramSpec };

// ------------------------------------------------------------
// NonEmpty<T> — a list that the compiler guarantees has ≥1 item.
// Authoring `[]` where a NonEmpty is expected is a type error, which
// is exactly the "hard to create incomplete content" guarantee we want.
// ------------------------------------------------------------
export type NonEmpty<T> = [T, ...T[]];

// ------------------------------------------------------------
// Shared building blocks
// ------------------------------------------------------------

/** A worked solution: ordered steps, a crisp final answer, and a short
 *  "why this works" gloss. Steps are markdown+LaTeX, one idea per step. */
export type Solution = {
  /** Ordered reasoning, one idea per entry. Rendered one-by-one. */
  steps: NonEmpty<string>;
  /** The answer in bold, succinct form. */
  finalAnswer: string;
  /** 1-2 sentences naming the principle behind the solution. */
  explanation: string;
};

/** A pointer used by "if you got stuck here, go back to…". `conceptId`
 *  must match a `ConceptAtom.id` in the SAME path, so the UI can deep-link
 *  (scroll) to that atom. */
export type ReviewRef = {
  /** The `ConceptAtom.id` to send the student back to. */
  conceptId: string;
  /** Display label, e.g. "מושג 4 — הצגה קוטבית". */
  label: string;
};

// ============================================================
// §1 — Prerequisites
// ============================================================
//
// Each prerequisite carries its OWN refresher so a motivated student can
// stay on the page, plus an optional link to the full topic if the
// refresher isn't enough.

export type Prerequisite = {
  /** Short name of the required knowledge, e.g. "נוסחת השורשים". */
  title: string;
  /** A 1-3 sentence refresher (markdown+LaTeX). Enough to keep going. */
  refresher: string;
  /** Optional one-line self-test: "do you actually remember this?" */
  selfCheck?: string;
  /** Optional pointer to the topic to learn first if the refresher
   *  wasn't enough. Renders as a link into /practice or /learn. */
  link?: { subject: string; topic: string; label: string };
};

// ============================================================
// §2 — Intuitive introduction (the "why")
// ============================================================
//
// Comes BEFORE any formula. The job of this section is motivation and a
// mental picture — keep symbols to a minimum.

export type IntuitionSection = {
  /** The motivating problem in plain language — what wall does this knock
   *  down? Ideally a question the student can feel. */
  hook: string;
  /** 2-4 short paragraphs building the intuitive/graphic picture. */
  body: string;
  /** "By the end of this path you'll be able to…" — sets the target. */
  payoff: string;
  /** Optional visual that carries the intuition (e.g. a Gauss plane). */
  diagrams?: DiagramSpec[];
};

// ============================================================
// §3 — Concept atoms (build the concepts step-by-step)
// ============================================================
//
// One topic → several small "atoms". Each atom is presented in a FIXED
// pedagogical order: plain-language first, THEN the formal statement
// (always justified, never thrown), THEN the simplest possible example,
// and an optional visual.

export type ConceptAtom = {
  /** Stable slug. Used as a scroll anchor and as the target of
   *  `ReviewRef.conceptId` from practice questions. e.g. "polar-form". */
  id: string;
  /** Atom title — may contain inline math. */
  title: string;
  /** Plain-language explanation FIRST. No formula yet — build the idea. */
  plain: string;
  /** The formal definition / formula, WITH its justification or
   *  derivation. A formula must be motivated or demonstrated here. */
  formal: string;
  /** The smallest possible worked example that shows the atom in action. */
  simplestExample: {
    problem: string;
    /** Short, fully worked — this is a demonstration, not a drill. */
    solution: string;
  };
  /** Optional "where this comes from" — an extra sentence of derivation. */
  whyItWorks?: string;
  /** Optional visual shown beneath the atom. */
  diagrams?: DiagramSpec[];
};

// ============================================================
// §4 — Guided solved examples
// ============================================================
//
// Every step says WHAT we do AND WHY. Each example opens with a
// "how do I know which method to use" note, because choosing the method
// is the skill students lack most. Examples climb from trivial to hard.

export type GuidedStep = {
  /** What we do in this step (the move). May contain math. */
  action: string;
  /** WHY we do it — the reasoning a student must internalise. */
  why: string;
};

export type GuidedExample = {
  id: string;
  /** Difficulty climbs across the array: start `trivial`, end `hard`. */
  difficulty: 'trivial' | 'easy' | 'mid' | 'hard';
  problem: string;
  /** "How do I recognise that THIS method is the right one here?" —
   *  the meta-skill of method selection, stated before the steps. */
  methodChoice: string;
  /** Steps, each pairing the move with its reason. Revealed one-by-one. */
  steps: NonEmpty<GuidedStep>;
  answer: string;
  diagrams?: DiagramSpec[];
};

// ============================================================
// §5 — Common mistakes and traps
// ============================================================

export type Pitfall = {
  /** The misconception / error, stated the way a student would do it. */
  mistake: string;
  /** Why it's wrong and what to do instead. */
  correction: string;
  /** Optional link back to the atom that prevents this mistake. */
  relatedConceptId?: string;
};

// ============================================================
// §6 — Graded practice (three levels)
// ============================================================
//
// level1: one concept, almost a copy of an example.
// level2: two concepts combined.
// level3: a full, multi-part bagrut question.
//
// Every question/part carries GRADUAL hints (revealed one at a time), a
// full reasoned solution, and an optional "go back to section X".

/** A single-answer practice question. Discriminated on `kind` so that an
 *  MCQ is forced to carry its options and correct index. */
type GradedQuestionBase = {
  id: string;
  question: string;
  /** Hints from gentle nudge to almost-the-answer. Revealed one-by-one. */
  hints: NonEmpty<string>;
  solution: Solution;
  /** "If you got stuck here — revisit this atom." */
  reviewIfStuck?: ReviewRef;
  diagrams?: DiagramSpec[];
};

export type GradedQuestion =
  | (GradedQuestionBase & {
      kind: 'mcq';
      /** Four-ish options; the renderer labels them א/ב/ג/ד. */
      answers: NonEmpty<string>;
      /** Index into `answers` of the correct option. */
      correct: number;
    })
  | (GradedQuestionBase & { kind: 'open' });

/** One sub-part of a full bagrut question (level 3). */
export type BagrutPart = {
  /** Section label — "א", "ב", "ג", … */
  label: string;
  prompt: string;
  /** Gradual hints, revealed one at a time. */
  hints: NonEmpty<string>;
  solution: { steps: NonEmpty<string>; finalAnswer: string };
  reviewIfStuck?: ReviewRef;
  diagrams?: DiagramSpec[];
};

/** A complete multi-part bagrut question — the level-3 target. */
export type BagrutQuestion = {
  id: string;
  /** Shared setup for all sub-parts. */
  context: string;
  parts: NonEmpty<BagrutPart>;
  /** Question-level figure(s) every part can reference. */
  diagrams?: DiagramSpec[];
};

export type GradedPractice = {
  /** Single concept — almost a copy of a guided example. */
  level1: NonEmpty<GradedQuestion>;
  /** Two concepts combined. */
  level2: NonEmpty<GradedQuestion>;
  /** Full bagrut questions, multi-part. */
  level3: NonEmpty<BagrutQuestion>;
};

// ============================================================
// §7 — Quick summary / formula sheet
// ============================================================

export type FormulaSheet = {
  /** Cheat-sheet bullets for a last-minute scan before a test. */
  quickReview: NonEmpty<string>;
  /** The formulas that matter, with their variables explained. */
  formulas: NonEmpty<Formula>;
};

// ============================================================
// §8 — Comprehension check (mastery gate)
// ============================================================
//
// Short MCQs that confirm the student is ready for the next topic. Graded
// instantly; each carries a one-line explanation shown after answering.

export type CheckQuestion = {
  id: string;
  question: string;
  answers: NonEmpty<string>;
  correct: number;
  /** Shown after the student answers — why this is the right option. */
  explanation: string;
};

// ============================================================
// LearningPath — the full topic package.
// ============================================================
//
// All sections required. Authoring tooling (and the compiler) will refuse
// a path that is missing a pedagogical stage.

export type LearningPath = {
  /** Subject key, e.g. 'math5'. Matches the legacy lesson subject. */
  subject: string;
  /** Topic key, e.g. 'מספרים מרוכבים'. MUST equal the lesson topic so the
   *  two systems line up and links resolve. */
  topic: string;
  title: string;
  /** One-line "what this path is" for cards/headers (~40-70 chars). */
  tagline: string;
  /** Rough minutes to complete the whole path — sets expectations. */
  estimatedMinutes: number;

  prerequisites: NonEmpty<Prerequisite>; // §1
  intuition: IntuitionSection; // §2
  concepts: NonEmpty<ConceptAtom>; // §3
  guidedExamples: NonEmpty<GuidedExample>; // §4
  pitfalls: NonEmpty<Pitfall>; // §5
  practice: GradedPractice; // §6
  formulaSheet: FormulaSheet; // §7
  comprehensionCheck: NonEmpty<CheckQuestion>; // §8
};

// ------------------------------------------------------------
// Section identifiers — the fixed pedagogical order. Used by the view to
// render sections and by lib/learn-progress to track per-section
// completion. Keep this in sync with the order above.
// ------------------------------------------------------------
export const PATH_SECTIONS = [
  { id: 'prerequisites', title: 'דרישות קדם', emoji: '🎒' },
  { id: 'intuition', title: 'למה זה קיים', emoji: '💡' },
  { id: 'concepts', title: 'בניית המושגים', emoji: '🧱' },
  { id: 'examples', title: 'דוגמאות מודרכות', emoji: '🧭' },
  { id: 'pitfalls', title: 'טעויות נפוצות', emoji: '⚠️' },
  { id: 'practice', title: 'תרגול מדורג', emoji: '🎯' },
  { id: 'formula-sheet', title: 'דף נוסחאות', emoji: '📋' },
  { id: 'check', title: 'בדיקת הבנה', emoji: '✅' },
] as const;

export type PathSectionId = (typeof PATH_SECTIONS)[number]['id'];
