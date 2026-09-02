// ============================================================
// פונקציות טריגונומטריות — the numbered levels, assembled
// ============================================================
//
// One file per level (the owner's numbering IS the deliverable), assembled here
// and spread into `math5Trigonometry.subTopics` so `resolveRoadmapNode` finds
// them without any further registration.
//
// 🔑 ANGLE MEASURE IS NOT UNIFORM ACROSS THIS TRACK, by mathematical necessity:
//   רמת בסיס  משוואות וזהויות        DEGREES  — nothing here differentiates
//   רמה 1+    חקירה, נגזרת, אינטגרל  RADIANS  — (sin x)' = cos x holds only there
// This mirrors the owner's 2026-07-28 split recorded in CLAUDE.md, and
// `scripts/verify-trig-angles.ts` is the gate. The base level's last teach step
// hands the switch over explicitly, so a student meets it as a stated rule
// rather than as a contradiction between two levels.

import type { SubTopic } from '../../types';
import { TF_EQUATIONS } from './tf-equations';
import { TF_DOMAIN } from './tf-domain';
import { TF_DERIVATIVE } from './tf-derivative';
import { TF_INVESTIGATION } from './tf-investigation';
import { TF_INTEGRAL } from './tf-integral';
import { TF_BAGRUT } from './tf-bagrut';

export const TF_STAGES: SubTopic[] = [TF_EQUATIONS, TF_DOMAIN, TF_DERIVATIVE, TF_INVESTIGATION, TF_INTEGRAL, TF_BAGRUT];

export { TF_EQUATIONS, TF_DOMAIN, TF_DERIVATIVE, TF_INVESTIGATION, TF_INTEGRAL, TF_BAGRUT };
