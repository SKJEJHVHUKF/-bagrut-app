/**
 * concept-quiz/types.ts — the shape of the static "בוחן מושגים" banks.
 *
 * Moved out of the old 582.ts (which both defined the type AND held content)
 * so the 14 per-topic files under math5/ share one definition.
 */

/**
 * The three rungs the STUDENT picks on the /quiz home screen.
 *
 *   1 — מושגי בסיס        one definition or rule, at most one substitution;
 *                          answerable in the head in well under 30 seconds
 *   2 — תרגול מתקדם יותר  two chained steps, or one step plus a condition/case;
 *                          under ~90 seconds with scratch paper
 *   3 — ברמת בגרות        a genuine bagrut situation — the kind that would be a
 *                          סעיף in a real 571/572 question — 3-4 chained steps,
 *                          whose answer happens to be a single offerable object
 *
 * This REPLACES the old `difficulty: 'easy' | 'mid' | 'hard'` on this bank.
 * ONE ordinal axis, deliberately: with two, "this is level 2 — is it mid or
 * hard?" has no answer, and 14 parallel authoring agents would each answer it
 * differently. Level 3 is also semantically more than "hard" — it names the
 * exam, which is what the student is actually choosing.
 */
export type ConceptLevel = 1 | 2 | 3;

export const CONCEPT_LEVELS: ConceptLevel[] = [1, 2, 3];

/**
 * Bridge to the app-wide difficulty vocabulary. `lib/results.ts`
 * (`ResultEvent.difficulty`), `lib/adaptive.ts` (`pickQuestions` / `TIER_MIX`)
 * and the lesson banks all speak easy/mid/hard; this is the ONLY place the two
 * vocabularies meet.
 *
 * The mapping is the identity of the migration that introduced `level`, so the
 * answer history already recorded in students' localStorage — and the predicted
 * grade derived from it on /insights — stays comparable across the change.
 */
export const LEVEL_DIFFICULTY: Record<ConceptLevel, 'easy' | 'mid' | 'hard'> = {
  1: 'easy',
  2: 'mid',
  3: 'hard',
};

export const DIFFICULTY_LEVEL: Record<'easy' | 'mid' | 'hard', ConceptLevel> = {
  easy: 1,
  mid: 2,
  hard: 3,
};

/**
 * Student-facing copy for each level. One source of truth, so the picker chip,
 * the loading strip, the in-quiz badge and the results header can never
 * disagree with each other.
 *
 * `perSession` differs by level on purpose: a level-3 question is a real bagrut
 * sub-question that wants paper and a few minutes, so five of them stops being
 * the "quick warm-up" this screen promises.
 */
export const LEVEL_META: Record<
  ConceptLevel,
  { title: string; short: string; blurb: string; emoji: string; perSession: number }
> = {
  1: {
    title: 'רמה 1',
    short: 'בסיס',
    blurb: 'מושגי יסוד — הגדרות, תחומי הגדרה, כללי גזירה. כל שאלה נפתרת בראש.',
    emoji: '1️⃣',
    perSession: 5,
  },
  2: {
    title: 'רמה 2',
    short: 'בינוני',
    blurb: 'יישום — שני צעדים, או כלל על קלט לא שגרתי. דף טיוטה מומלץ.',
    emoji: '2️⃣',
    perSession: 5,
  },
  3: {
    title: 'רמה 3',
    short: 'בגרות',
    blurb: 'ברמת בגרות — שאלה בסגנון הבחינה, כמה צעדים. קח דף ועט.',
    emoji: '3️⃣',
    perSession: 4,
  },
};

export type ConceptQuestion = {
  /**
   * Legacy ids are `cq-<slug>-<n>`; new ones are `cq-<slug>-L<level>-<nn>`.
   *
   * NEVER change an existing id. `lib/results.ts` dedupes on
   * `${source}:${questionId}` and `lib/mistakes.ts` rows key on it, both in
   * localStorage — a rename would silently mark every already-answered question
   * as a fresh first attempt, shifting per-topic accuracy and therefore the
   * predicted grade shown on /insights, and orphaning existing /errors rows.
   */
  id: string;
  level: ConceptLevel;
  question: string;
  answers: string[]; // exactly 4
  correct: number; // 0-3
  /**
   * ONE nudge the student may ASK for before answering. Names the rule or the
   * first move; must NOT contain the answer. Same field name and role as
   * `PracticeQuestion.hint` in content/lessons/types.ts — deliberately the same
   * convention rather than a new one.
   */
  hint?: string;
  /**
   * One entry PER ANSWER, same indices as `answers`. The slot at `correct` is
   * unused (write ''). The quiz shows the entry matching the option the student
   * actually picked, so a wrong answer is explained on its own terms.
   *
   * This exists because `explanation.why_wrong` is a single string for the whole
   * question: it can only ever describe one mistake, so a student who picked a
   * different distractor got an explanation of someone else's error. An audit of
   * the bank found only 1 of 84 questions whose why_wrong addressed all three
   * distractors, and 48 that addressed none.
   */
  distractorNotes?: string[];
  explanation: {
    why_correct: string;
    /** Kept as the general "why the others fail" summary; the per-option
     *  reason now lives in `distractorNotes`. */
    why_wrong: string;
    concept: string;
    remember: string;
  };
};

/** One topic's bank inside one subject. */
export type ConceptTopicBank = {
  /** Topic name. For subject 'math5' this must equal a `MATH5_CURRICULUM[].key`
   *  — the registry is keyed `${subject}:${topic}`, and a one-character
   *  mismatch (e.g. 'גיאומטריה' vs 'גאומטריה') makes the whole file
   *  unservable. Guarded by scripts/verify-concept.ts. */
  topic: string;
  /** The id prefix every question in this file carries, e.g. 'alg' for
   *  `cq-alg-…`. Guarded, so a copy-pasted question from another topic is
   *  caught instead of silently living in the wrong file. */
  slug: string;
  questions: ConceptQuestion[];
};
