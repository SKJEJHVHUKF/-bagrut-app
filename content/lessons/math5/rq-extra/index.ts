// ============================================================
// פונקציות מנה ושורש — EXTRA practice questions per stage
// ============================================================
//
// The eight stage sub-topics in ../functions-root-quotient.ts shipped with
// 6–10 practice questions each (2–5 per rung). The owner asked (2026-09-03) to
// widen every rung, so each stage gets a file of ADDITIONAL questions here,
// merged into `ROOT_QUOTIENT_STAGES` at module load. Keeping them apart from
// the 7,000-line stage file lets eight authors work in parallel and keeps the
// reviewed baseline untouched ("אל תשנה את התוכן אלא תוסיף").
//
// Ids: `rq-sub-<stage>-1NN` (the originals are 001–010). Same house rules as
// the stage file; scripts/_rq-extra-check.ts <stage> enforces them per file,
// scripts/verify-rq-extra.ts re-derives every number.

import type { PracticeQuestion } from '../../types';
import { EXTRA as DOMAIN } from './domain';
import { EXTRA as INTERSECTIONS } from './intersections';
import { EXTRA as ASYMPTOTES } from './asymptotes';
import { EXTRA as DERIVATIVE } from './derivative';
import { EXTRA as SKETCH } from './sketch';
import { EXTRA as TRANSFORMATIONS } from './transformations';
import { EXTRA as INTEGRAL } from './integral';
import { EXTRA as BAGRUT_MIXED } from './bagrut-mixed';

/** Stage sub-topic id → the questions appended to that stage. */
export const RQ_EXTRA: Record<string, PracticeQuestion[]> = {
  'rq-domain': DOMAIN,
  'rq-intersections': INTERSECTIONS,
  'rq-asymptotes': ASYMPTOTES,
  'rq-derivative': DERIVATIVE,
  'rq-sketch': SKETCH,
  'rq-transformations': TRANSFORMATIONS,
  'rq-integral': INTEGRAL,
  'rq-bagrut-mixed': BAGRUT_MIXED,
};
