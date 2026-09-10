// ============================================================
// סדרות — הרחבת סולם הקושי (2026-09-10)
// ============================================================
//
// Itay: "כמו שהרחבת את השאלות בעליית רמה בצורה הדרגתית בפונקציית מנה ושורש
// ובהסתברות — כך גם בסדרות. חשוב מאוד שהשאלות לא יתמקדו על דבר אחד או 2 אלא
// שיגעו בכל הנקודות, שבסוף תלמידים יגיעו מוכנים לכל שאלת בגרות."
//
// WHY THIS WAVE EXISTS, measured rather than assumed. The six archived שאלון
// 571 questions (2022–2026) were run through the ladder gate's own detectors.
// Five of the six OPEN with the same move — a second sequence defined out of a
// given one, proved geometric, its ratio expressed via $q$ — and across our 158
// questions that move measured **zero**. So did "הביעו", the archive's dominant
// verb for it. What the bank did train was two things, over and over: 25
// questions on recovering $n$ from a sum and 27 on the convergence condition.
// That is precisely "התמקדו על דבר אחד או 2", and it is what this wave fixes.
//
// Every item here is ORIGINAL (מתכונת-style, authored — never transcribed from
// a real exam; the IP boundary in CLAUDE.md is firm). Additive layer: the
// arrays are appended to the existing stage questions in `math5Sequences`, and
// nothing existing was changed.
//
// Guarded by `npm run verify:seq-ladder` (rung gradient, per-rung floor of 6,
// exam-move coverage, exam-reach) and `npm run test:seq-detectors`.
import type { PracticeQuestion, SubTopic } from '../../types';
import { AR_GENERAL_R3, AR_RECURSION_R3, AR_POSITIONS_R3, AR_PRACTICE_R3 } from './arithmetic';
import { GE_GENERAL_R3, GE_PROOF_SUM_R3 } from './geometric';
import { GE_INFINITE_R3, GE_PRACTICE_R3 } from './infinite';
import { APPLICATIONS_R3, INDUCTION_R3 } from './applied';

/** Stage sub-topic id → the questions appended to that stage. */
export const SEQ_EXTRA: Record<string, PracticeQuestion[]> = {
  'ar-general-term': AR_GENERAL_R3,
  'ar-recursion-sums': AR_RECURSION_R3,
  'ar-positions-sums': AR_POSITIONS_R3,
  'ar-practice': AR_PRACTICE_R3,
  'ge-general-term': GE_GENERAL_R3,
  'ge-proof-sum': GE_PROOF_SUM_R3,
  'ge-infinite': GE_INFINITE_R3,
  'ge-practice': GE_PRACTICE_R3,
  'sequences-applications': APPLICATIONS_R3,
  induction: INDUCTION_R3,
};

/** Append this wave to a stage. The ladder groups by `difficulty`, so order
 *  within a rung is authoring order: reviewed baseline first, widening second. */
export const withSeqExtra = (s: SubTopic): SubTopic => {
  const extra = SEQ_EXTRA[s.id] ?? [];
  return extra.length ? { ...s, questions: [...(s.questions ?? []), ...extra] } : s;
};
