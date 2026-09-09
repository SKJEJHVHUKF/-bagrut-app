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
import { ANGLES_R4, CONGRUENCE_R4 } from './round4';
import { SIMILARITY_R4, THALES_R4, CIRCLE_R4 } from './round4b';
import { SHAPES_R4, METHOD_R4, MIXED_R4 } from './round4c';

/** Stage sub-topic id → the questions appended to that stage. */
export const GEO_EXTRA: Record<string, PracticeQuestion[]> = {
  'eg-angles': [...ANGLES, ...ANGLES_EXAM, ...ANGLES_R4],
  'eg-congruence': [...CONGRUENCE, ...CONGRUENCE_EXAM, ...CONGRUENCE_R4],
  'eg-similarity': [...SIMILARITY, ...SIMILARITY_EXAM, ...SIMILARITY_R4],
  'eg-thales': [...THALES, ...THALES_EXAM, ...THALES_R4],
  'eg-circle': [...CIRCLE, ...CIRCLE_EXAM, ...CIRCLE_R4],
  'eg-shapes': [...SHAPES, ...SHAPES_R4],
  'eg-method': [...METHOD, ...METHOD_EXAM, ...METHOD_R4],
  'eg-mixed': [...MIXED, ...MIXED_EXAM, ...MIXED_R4],
};
