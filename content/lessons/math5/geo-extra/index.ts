// ============================================================
// גאומטריה אוקלידית — EXTRA practice questions per stage
// ============================================================
//
// Itay, 2026-09-07: "אני רוצה שתרכיב את כל השאלות בגאומטריה שיהיו הרבה יותר
// שאלות לתרגול בכל נושא ונושא שם ובכל רמה, חשוב שהרמת קושי בשאלות תהיה
// הדרגתית."
//
// The eight stages shipped with 2–6 questions per rung, and `verify-geo-ladder`
// measured the consequence: eg-mixed had NO חימום rung at all, eg-shapes' אתגר
// rung scored BELOW its own ביסוס rung, and eight hard questions shared a
// signature with a lower-rung question in the same stage.
//
// Each stage's additions live in their own file here rather than inside the
// 5,000-line stage files, so the reviewed baseline is never touched ("אל תשנה
// את התוכן אלא תוסיף") and a stage can be widened without re-reading the rest.
//
// Ids: `<stage prefix>-1NN`. House rules are the repo's usual ones and are
// enforced by the gates that already run in `npm run check`
// (verify-content, check-tichon-notation, verify-rule-lines, verify-specs);
// `scripts/verify-geo-ladder.ts` enforces that the rungs actually climb.

import type { PracticeQuestion } from '../../types';
import { EXTRA as MIXED } from './mixed';
import { EXTRA as METHOD } from './method';
import { EXTRA as ANGLES } from './angles';
import { EXTRA as CIRCLE } from './circle';
import { EXTRA as CONGRUENCE } from './congruence';
import { EXTRA as SHAPES } from './shapes';
import {
  ANGLES_EXAM,
  CONGRUENCE_EXAM,
  SIMILARITY_EXAM,
  THALES_EXAM,
  CIRCLE_EXAM,
  METHOD_EXAM,
  MIXED_EXAM,
} from './exam-style';
import { EXTRA as SIMILARITY } from './similarity';
import { EXTRA as THALES } from './thales';

/** Stage sub-topic id → the questions appended to that stage. */
export const GEO_EXTRA: Record<string, PracticeQuestion[]> = {
  'eg-angles': [...ANGLES, ...ANGLES_EXAM],
  'eg-congruence': [...CONGRUENCE, ...CONGRUENCE_EXAM],
  'eg-similarity': [...SIMILARITY, ...SIMILARITY_EXAM],
  'eg-thales': [...THALES, ...THALES_EXAM],
  'eg-circle': [...CIRCLE, ...CIRCLE_EXAM],
  'eg-shapes': SHAPES,
  'eg-method': [...METHOD, ...METHOD_EXAM],
  'eg-mixed': [...MIXED, ...MIXED_EXAM],
};
