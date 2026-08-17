/**
 * daily-plan-client.ts — the browser wrapper around buildDailyPlan.
 *
 * `lib/daily-plan` is deliberately pure: every engine comes in as an argument,
 * including the clock. That is the right shape, but it means each caller has to
 * assemble six inputs — roadmap, per-sub-topic levels, resume point, prediction,
 * impact table, weaknesses, due count and pacing — which is ~30 lines of setup
 * with several traps in it (the impact table must be fetched UNCAPPED; a limit
 * of 5 silently degrades any task about a weakness ranked 6th or lower).
 *
 * `/my-plan` had that assembly inline, and it was the only page in the app that
 * knew what the student should do today. Everywhere the student actually LANDS
 * — the roadmap, the tutor bubble — showed pieces of the same answer, computed
 * separately and phrased differently.
 *
 * So the assembly moved here. One copy, one set of traps, and the tutor can
 * open the day with the same plan the plan page shows rather than a second
 * opinion that disagrees with it.
 *
 * ⚠️ Browser only — reads localStorage. Call it from an effect, never during
 * render. $0: no API call, all of it is arithmetic over the local event log.
 */

import { buildDailyPlan, type DailyPlan } from '@/lib/daily-plan';
import { getPlan, getPaper } from '@/lib/study-plan';
import { DEFAULT_PAPER } from '@/constants/roadmapData';
import { getTrack } from '@/content/tracks';
import { trackLevelsBySub, trackMainTopics } from '@/lib/track';
import { getResumePoint } from '@/lib/roadmap-resume';
import { predictOverall, topImpactTopics } from '@/lib/prediction';
import { getWeaknesses } from '@/lib/remediation';
import { dueCount } from '@/lib/review';
import { computePacing } from '@/lib/pacing';

/**
 * Today's plan, or null when there is no study plan yet (a visitor who has not
 * onboarded has no target and no paper, and inventing one would be a guess).
 *
 * Every failure is swallowed: this feeds a greeting, and a greeting that throws
 * takes down the screen the student just opened.
 */
export function buildTodayPlan(): DailyPlan | null {
  try {
    const plan = getPlan();
    if (!plan) return null;

    const paper = getPaper() ?? DEFAULT_PAPER;
    // The study track (content/tracks) — the same tree the /roadmap pages walk,
    // so "next step" here and there agree.
    const tree = getTrack(paper);
    const mainTopics = trackMainTopics(tree);
    const levelsBySub = trackLevelsBySub(tree);

    const resume = getResumePoint(mainTopics, levelsBySub);

    return buildDailyPlan({
      target: plan.targetGrade ?? null,
      minutesPerDay: plan.minutesPerDay ?? null,
      prediction: predictOverall('math5'),
      // ⚠️ UNCAPPED on purpose. The table does two jobs: picking the best lever
      // only needs the head, but looking up "how many points is the topic I'm
      // weak in worth" needs all of it. Capped at 5, that lookup missed any
      // weakness ranked 6th or lower and the task fell back to generic wording.
      impact: topImpactTopics('math5', 100),
      weaknesses: getWeaknesses('math5'),
      dueCount: dueCount(),
      resume: resume ? { href: resume.href, title: resume.title } : null,
      pacing: computePacing(mainTopics, levelsBySub, plan),
    });
  } catch {
    return null;
  }
}
