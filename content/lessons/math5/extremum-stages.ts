// ============================================================
// בעיות קיצון — the five stages of the 571 track
// ============================================================
//
// The owner specified this breakdown himself (2026-08-30), and the stage
// boundaries are the point of it: the four things a student gets stuck on are
// four SEPARATE things, and the old single `optimization` module made them look
// like one. His words, verbatim:
//
//   רמת בסיס: לדעת איך לגזור פונקציית מנה ושורש
//   רמה 1: ללמוד לבנות פונקציית מטרה בגיאומטריה ובגרפים
//   רמה 2: לדעת למצוא מינימום\מקסימום בעזרת גזירה ונגזרת שנייה
//   רמה 3: הצבה בפונקציית המטרה ומציאת הגודל המקסימלי מינימלי
//   רמה 4: תרגול בעיות קיצון ברמה של שאלות בגרות
//
// Each stage owns exactly its own step and refuses the next one's job — רמה 1
// builds the target function and does not differentiate it, רמה 2 finds x and
// does not produce the area. That is deliberate: the half-mark most students
// lose is the gap between stage 2 and stage 3, and a module that blurs them
// cannot teach the difference.
//
// Split across five files only so they could be authored and adversarially
// re-derived in parallel, one agent per file — same reason סדרות is split into
// sequences-arithmetic / sequences-geometric.
//
// Spread into `derivatives.ts` (topic חשבון דיפרנציאלי); the track tiles live in
// content/tracks/paper-571.ts, and the superseded `optimization` module is listed
// in EXCLUDED_571.

import type { StaticBagrutQuestion, SubTopic } from '../types';
import { EXT_BAGRUT_BASE, EXT_STAGE_BASE } from './extremum-stage-base';
import { EXT_BAGRUT_1, EXT_STAGE_1 } from './extremum-stage-1';
import { EXT_BAGRUT_2, EXT_STAGE_2 } from './extremum-stage-2';
import { EXT_BAGRUT_3, EXT_STAGE_3 } from './extremum-stage-3';
import { EXT_BAGRUT_4, EXT_STAGE_4 } from './extremum-stage-4';

/** In track order. The ladder's "current" highlight follows this order. */
export const EXTREMUM_STAGES: SubTopic[] = [
  EXT_STAGE_BASE,
  EXT_STAGE_1,
  EXT_STAGE_2,
  EXT_STAGE_3,
  EXT_STAGE_4,
];

/** Each question carries `subTopicId` of its own stage — without it the 🎓 rung
 *  of that stage does not exist at all. */
export const EXTREMUM_BAGRUT: StaticBagrutQuestion[] = [
  ...EXT_BAGRUT_BASE,
  ...EXT_BAGRUT_1,
  ...EXT_BAGRUT_2,
  ...EXT_BAGRUT_3,
  ...EXT_BAGRUT_4,
];
