/**
 * pacing.ts — turns the exam date into a concrete "what to do today". The
 * countdown alone (daysUntilBagrut) told the student nothing actionable; this
 * derives how many core rungs remain, the pace needed to finish before the
 * exam (minus a revision buffer), and a suggested daily question target. Pure,
 * client-side, no AI — the message is templated Hebrew.
 */

import { CORE_LEVELS, type RoadmapLevel } from '@/lib/roadmap-levels';
import { isLevelCleared } from '@/lib/roadmap-progress';
import { daysUntilBagrut, type StudyPlan } from '@/lib/study-plan';
import type { RoadmapNode } from '@/types/roadmap';

/** Days reserved at the end for pure revision (don't schedule new material into them). */
export const REVISION_BUFFER_DAYS = 14;

export type PacingStatus = 'no-date' | 'ahead' | 'on-track' | 'behind' | 'done';

export type Pacing = {
  daysLeft: number;
  /** Days left to learn NEW material (days minus the revision buffer). */
  studyDaysLeft: number;
  remainingCoreRungs: number;
  totalCoreRungs: number;
  rungsPerDay: number;
  /** Suggested questions-per-day goal derived from the pace. */
  todayTarget: number;
  status: PacingStatus;
  message: string;
};

type TopicGroup = { topic: string; nodes: RoadmapNode[] };

function countCoreRungs(
  mainTopics: TopicGroup[],
  levelsBySub: Record<string, RoadmapLevel[]>,
): { total: number; remaining: number } {
  let total = 0;
  let remaining = 0;
  for (const mt of mainTopics) {
    for (const node of mt.nodes) {
      for (const level of levelsBySub[node.subId] ?? []) {
        if (!CORE_LEVELS.includes(level.kind)) continue;
        total++;
        if (!isLevelCleared(node.topic, node.subId, level.kind)) remaining++;
      }
    }
  }
  return { total, remaining };
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function computePacing(
  mainTopics: TopicGroup[],
  levelsBySub: Record<string, RoadmapLevel[]>,
  plan: StudyPlan | null,
): Pacing {
  const { total, remaining } = countCoreRungs(mainTopics, levelsBySub);

  if (remaining === 0 && total > 0) {
    return {
      daysLeft: plan ? daysUntilBagrut(plan) : 0,
      studyDaysLeft: 0,
      remainingCoreRungs: 0,
      totalCoreRungs: total,
      rungsPerDay: 0,
      todayTarget: 10,
      status: 'done',
      message: 'סיימת את כל שלבי הליבה! 🎉 עכשיו הזמן לחזרה יומית ולרמות האתגר.',
    };
  }

  if (!plan || !plan.bagrutDate) {
    return {
      daysLeft: 0,
      studyDaysLeft: 0,
      remainingCoreRungs: remaining,
      totalCoreRungs: total,
      rungsPerDay: 0,
      todayTarget: 10,
      status: 'no-date',
      message: 'הוסף תאריך בגרות בתוכנית שלך כדי לקבל יעד יומי מותאם.',
    };
  }

  const daysLeft = daysUntilBagrut(plan);
  const studyDaysLeft = Math.max(1, daysLeft - REVISION_BUFFER_DAYS);
  const rungsPerDay = Math.ceil(remaining / studyDaysLeft);
  const todayTarget = clamp(rungsPerDay * 5, 5, 40);

  let status: PacingStatus;
  if (rungsPerDay <= 2) status = 'ahead';
  else if (rungsPerDay <= 5) status = 'on-track';
  else status = 'behind';

  const message =
    status === 'ahead'
      ? `אתה בקצב מצוין — ${remaining} שלבים ב-${daysLeft} ימים. ${rungsPerDay} שלבים ביום מספיקים בגדול.`
      : status === 'on-track'
        ? `בקצב טוב — ${rungsPerDay} שלבים ביום ותסיים בזמן, עם שבועיים לחזרה לפני הבגרות.`
        : `צריך להאיץ — ${remaining} שלבים ב-${daysLeft} ימים = ${rungsPerDay} ביום. בוא נתחיל היום.`;

  return {
    daysLeft,
    studyDaysLeft,
    remainingCoreRungs: remaining,
    totalCoreRungs: total,
    rungsPerDay,
    todayTarget,
    status,
    message,
  };
}
