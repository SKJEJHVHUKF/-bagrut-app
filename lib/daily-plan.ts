/**
 * daily-plan.ts — "what do I do today, and why does it get me to my goal?"
 *
 * This builds NOTHING new. Every engine it needs already exists and is already
 * trusted somewhere in the app:
 *
 *   lib/pacing        how many rungs a day to finish before the exam
 *   lib/prediction    the predicted grade, and points-per-10%-accuracy per topic
 *   lib/remediation   the ranked repairable weaknesses
 *   lib/review        how many spaced-repetition cards are due
 *   lib/roadmap-resume where the student stopped climbing
 *
 * What was missing is the TARGET. Without it the app can compute "you are at
 * 68" and "trigonometry is worth 8 points" but can never say "you are 12 short
 * and this is 8 of them" — which is the only sentence that makes a study plan
 * feel like a plan instead of a list.
 *
 * PURE: everything comes in as arguments, including the clock. The browser
 * wrapper lives in the page.
 */

import type { Pacing } from '@/lib/pacing';
import type { OverallPrediction, TopicImpact } from '@/lib/prediction';
import type { Weakness } from '@/lib/remediation/types';
import { TARGET_SCORE, type TargetGrade } from '@/lib/study-plan';

/** Rough minutes per task, used only to fit the day — never shown as a promise. */
const MINUTES = { fix: 12, review: 8, climb: 15, drill: 10 } as const;

export type DailyTaskKind = 'fix' | 'review' | 'climb' | 'drill';

export type DailyTask = {
  kind: DailyTaskKind;
  title: string;
  /** One sentence tying this task to the goal. Never generic encouragement. */
  why: string;
  href: string;
  minutes: number;
};

export type GoalState = {
  target: TargetGrade | null;
  /** The numeric bar, or null for 'boost'. */
  targetScore: number | null;
  predicted: number | null;
  /** targetScore − predicted, when both exist. Negative means already there. */
  gap: number | null;
  /** Hebrew, one line. Null when there is nothing honest to say yet. */
  headline: string | null;
};

export type DailyPlan = {
  goal: GoalState;
  tasks: DailyTask[];
  totalMinutes: number;
  /** Tasks that did not fit today's time budget. */
  deferred: number;
};

export type BuildDailyPlanInput = {
  target: TargetGrade | null;
  minutesPerDay: number | null;
  prediction: OverallPrediction | null;
  /** Topic ROI, strongest lever first (lib/prediction.topImpactTopics). */
  impact: TopicImpact[];
  weaknesses: Weakness[];
  dueCount: number;
  resume: { href: string; title: string } | null;
  pacing: Pacing | null;
};

/** Minutes assumed when the student has not said how long they have. */
export const DEFAULT_MINUTES_PER_DAY = 30;

function buildGoal(
  target: TargetGrade | null,
  prediction: OverallPrediction | null,
): GoalState {
  const targetScore = target ? TARGET_SCORE[target] : null;
  const predicted = prediction?.score ?? null;
  const gap = targetScore !== null && predicted !== null ? targetScore - predicted : null;

  let headline: string | null = null;
  if (predicted === null) {
    // No prediction yet means too few answers. Saying "you are 40 points short"
    // to someone who has answered three questions is a lie with a number on it.
    headline = target ? 'ענה על עוד כמה שאלות ואוכל להגיד לך כמה חסר ליעד.' : null;
  } else if (gap === null) {
    headline = `הציון החזוי שלך כרגע: ${predicted}. כל שיפור נספר.`;
  } else if (gap > 0) {
    headline = `אתה ${gap} נקודות מתחת ליעד: ${predicted} מול ${targetScore}.`;
  } else {
    headline = `אתה כבר על היעד (${predicted} מול ${targetScore}), עכשיו מייצבים.`;
  }

  return { target, targetScore, predicted, gap, headline };
}

/**
 * Today's ordered tasks.
 *
 * The order is the opinion: repair a broken idea before drilling on top of it,
 * clear the memory queue before it grows, then climb. That is the same priority
 * lib/cognition/next-step.ts already uses; this version adds the goal, which
 * changes only the WHY text and how much drilling gets scheduled — never the
 * order, and never what is available. A goal narrows attention; it must not
 * lock content the student may still need.
 */
export function buildDailyPlan(input: BuildDailyPlanInput): DailyPlan {
  const goal = buildGoal(input.target, input.prediction);
  const budget = input.minutesPerDay ?? DEFAULT_MINUTES_PER_DAY;
  const candidates: DailyTask[] = [];

  // 1 · Repair. A weakness left in place quietly caps everything built on it.
  const w = input.weaknesses[0];
  if (w) {
    const pts = input.impact.find((t) => t.topic === w.topic)?.gainPer10;
    candidates.push({
      kind: 'fix',
      title: `מסלול תיקון: ${w.title}`,
      why: pts
        ? `${w.topic} שווה ${pts} נקודות לכל 10% שיפור, וזאת הנקודה שנשברת שם.`
        : `זו הטעות החוזרת שלך ב${w.topic}.`,
      href: `/fix/${encodeURIComponent(w.id)}`,
      minutes: MINUTES.fix,
    });
  }

  // 2 · Retention. Cheap, and the only thing that stops last month's work rotting.
  if (input.dueCount > 0) {
    candidates.push({
      kind: 'review',
      title: `חזרה יומית — ${input.dueCount} שאלות`,
      why: 'שאלות שכבר פגשת וחזרו למועד בדיקה. זה מה ששומר על מה שלמדת.',
      href: '/roadmap/review',
      minutes: MINUTES.review,
    });
  }

  // 3 · Keep climbing, at the pace the exam date demands.
  if (input.resume) {
    candidates.push({
      kind: 'climb',
      title: input.resume.title,
      why:
        input.pacing && input.pacing.status !== 'no-date' && input.pacing.status !== 'done'
          ? `נשארו ${input.pacing.remainingCoreRungs} שלבי ליבה ב-${input.pacing.daysLeft} ימים — ${input.pacing.rungsPerDay} ביום מחזיקים אותך בקצב.`
          : 'המשך מהמקום שבו עצרת.',
      href: input.resume.href,
      minutes: MINUTES.climb,
    });
  }

  // 4 · The goal's own lever: the topic where accuracy buys the most points.
  //     Only worth scheduling when there IS a gap to close.
  const lever = input.impact.find((t) => t.gainPer10 > 0 && !input.weaknesses.some((x) => x.topic === t.topic));
  if (lever && (goal.gap === null || goal.gap > 0)) {
    candidates.push({
      kind: 'drill',
      title: `תרגול ממוקד: ${lever.topic}`,
      why: `${lever.gainPer10} נקודות לכל 10% דיוק — המנוף הכי גדול שלך כרגע.`,
      href: `/quiz?topic=${encodeURIComponent(lever.topic)}`,
      minutes: MINUTES.drill,
    });
  }

  // Fit the day. Tasks are already in priority order, so truncation drops the
  // least valuable — but at least one task always survives, because a plan that
  // schedules nothing is worse than one that overruns by four minutes.
  const tasks: DailyTask[] = [];
  let spent = 0;
  for (const t of candidates) {
    if (tasks.length > 0 && spent + t.minutes > budget) break;
    tasks.push(t);
    spent += t.minutes;
  }

  return {
    goal,
    tasks,
    totalMinutes: spent,
    deferred: candidates.length - tasks.length,
  };
}
