/**
 * cognition/next-step.ts — one arbiter for "what should I do now?".
 *
 * The app already had three answers to that question and no way to choose
 * between them: lib/roadmap-resume (where you stopped), lib/review (what is
 * due), lib/results.weakestSubTopics (where you are weak). All three were
 * rendered as separate cards, which pushes the arbitration onto a 17-year-old
 * at 11pm. This module scores every candidate on one scale and returns a single
 * recommendation plus at most two runners-up.
 *
 * It never invents a destination — every href points at a route that already
 * exists (`/roadmap/<subId>?level=<kind>`, `/roadmap/review`).
 *
 * Pure. Everything it needs about the rest of the app (due count, resume point)
 * is passed in, so the whole thing is unit-testable with a fixed clock.
 */

import type { Misconception, Skill } from '@/content/cognition/types';
import type {
  MisconceptionState,
  NextStep,
  SkillMastery,
  WeakestLink,
} from './types';

/** Base priority per candidate kind. Repairing a broken foundation outranks
 *  everything, because practising on top of it wastes the student's evening. */
const PRIORITY = {
  'prereq-repair': 100,
  'misconception-drill': 80,
  'review-due': 60,
  'continue-ladder': 40,
  consolidate: 20,
  start: 5,
} as const;

/** What the engine needs to know about the rest of the app. */
export type NextStepContext = {
  /** From lib/review.dueCount(). */
  dueCount: number;
  /** From lib/roadmap-resume.getResumePoint(), already turned into a link. */
  resume: { href: string; title: string } | null;
};

function ladderHref(subTopicId: string, level?: string): string {
  const base = `/roadmap/${encodeURIComponent(subTopicId)}`;
  return level ? `${base}?level=${level}` : base;
}

export function buildCandidates(
  skills: Skill[],
  misconceptionCatalog: Misconception[],
  mastery: SkillMastery[],
  misconceptions: MisconceptionState[],
  weakestLink: WeakestLink | null,
  ctx: NextStepContext,
): NextStep[] {
  const skillById = new Map(skills.map((s) => [s.id, s]));
  const masteryById = new Map(mastery.map((m) => [m.skillId, m]));
  const out: NextStep[] = [];

  const topMisconception = misconceptions.find(
    (m) => m.status === 'active' || m.status === 'suspected',
  );
  const topCatalog = topMisconception
    ? misconceptionCatalog.find((m) => m.id === topMisconception.id) ?? null
    : null;

  /**
   * When the strongest misconception sits ON the broken prerequisite, the two
   * are not competing recommendations — they are the same finding at different
   * resolutions, and the misconception is the sharper one ("argument without
   * the quadrant correction" beats "go back to the argument lesson"). Letting
   * them race produced a card whose headline blamed the prerequisite while its
   * button offered something else; a diagnosis and a prescription that disagree
   * read as a bug even when both are individually right. So: emit one
   * candidate, worded from the misconception, carrying the prerequisite's
   * priority.
   */
  const explainsBreak =
    !!weakestLink &&
    !!topCatalog &&
    (topCatalog.skill === weakestLink.rootSkill ||
      topCatalog.rootSkill === weakestLink.rootSkill);

  // 1 · Repair the broken prerequisite.
  if (weakestLink && !explainsBreak) {
    const root = skillById.get(weakestLink.rootSkill);
    const rootMastery = masteryById.get(weakestLink.rootSkill);
    if (root) {
      // A deeper hole and a firmer belief in it both raise urgency.
      const severity = (1 - (rootMastery?.p ?? 0.5)) * (rootMastery?.confidence ?? 0.5);
      out.push({
        kind: 'prereq-repair',
        score: PRIORITY['prereq-repair'] * severity,
        title: `חזור אל: ${root.title}`,
        reason: `${weakestLink.childTitle} נשען על ${root.title}, וזה מה שעדיין לא יציב.`,
        href: ladderHref(root.subTopicId, 'learn'),
        skillId: root.id,
      });
    }
  }

  // 2 · Drill the live misconception.
  if (topMisconception && topCatalog) {
    const mc = topCatalog;
    out.push({
      kind: explainsBreak ? 'prereq-repair' : 'misconception-drill',
      score:
        (explainsBreak ? PRIORITY['prereq-repair'] : PRIORITY['misconception-drill']) *
        topMisconception.weight,
      title: `תרגול ממוקד: ${mc.title}`,
      reason: explainsBreak
        ? `${weakestLink!.childTitle} נשען על ${weakestLink!.rootTitle}, וזו בדיוק הנקודה שנשברת שם — ${topMisconception.hits} מתוך ${topMisconception.opportunities} פעמים.`
        : `נפלת בזה ${topMisconception.hits} מתוך ${topMisconception.opportunities} פעמים שנתקלת בו.`,
      href: ladderHref(mc.remedy.subTopicId, mc.remedy.level),
      skillId: mc.skill,
      misconceptionId: mc.id,
    });
  }

  // 3 · Clear the spaced-repetition queue.
  if (ctx.dueCount > 0) {
    out.push({
      kind: 'review-due',
      score: PRIORITY['review-due'] * Math.min(1, ctx.dueCount / 10),
      title: `חזרה יומית — ${ctx.dueCount} שאלות`,
      reason: 'שאלות שכבר פגשת וחזרו למועד בדיקה. זה מה ששומר על מה שכבר למדת.',
      href: '/roadmap/review',
      skillId: undefined,
    });
  }

  // 4 · Keep climbing.
  if (ctx.resume) {
    out.push({
      kind: 'continue-ladder',
      score: PRIORITY['continue-ladder'],
      title: ctx.resume.title,
      reason: 'המשך מהמקום שבו עצרת.',
      href: ctx.resume.href,
    });
  }

  // 5 · Refresh something solid that has gone quiet.
  const stale = mastery
    .filter((m) => m.state === 'mastered' && m.observations >= 3)
    .sort((a, b) => a.lastTs - b.lastTs)[0];
  if (stale) {
    const skill = skillById.get(stale.skillId);
    if (skill) {
      out.push({
        kind: 'consolidate',
        score: PRIORITY.consolidate * (1 - stale.p),
        title: `רענון קצר: ${skill.title}`,
        reason: 'שלטת בזה, ולא נגעת בזה כבר זמן מה.',
        href: ladderHref(skill.subTopicId, 'mid'),
        skillId: skill.id,
      });
    }
  }

  return out;
}

/**
 * Rank the candidates. The tie-break chain is fully deterministic — score, then
 * the fixed priority of the kind, then the href — so the same state always
 * yields the same recommendation. A recommendation that reshuffles on reload
 * reads as broken even when every individual answer is defensible.
 */
export function rankCandidates(candidates: NextStep[]): NextStep[] {
  return [...candidates].sort(
    (a, b) =>
      b.score - a.score ||
      PRIORITY[b.kind] - PRIORITY[a.kind] ||
      a.href.localeCompare(b.href),
  );
}

/** The fallback when there is nothing to go on at all. */
export function startStep(firstHref: string | null): NextStep {
  return {
    kind: 'start',
    score: PRIORITY.start,
    title: 'התחל את המסלול',
    reason: 'עוד לא ענית מספיק שאלות בנושא הזה כדי שאדע מה חזק ומה חלש.',
    href: firstHref ?? '/roadmap',
  };
}

export function chooseNextStep(
  candidates: NextStep[],
  fallbackHref: string | null,
): { nextStep: NextStep; alternates: NextStep[] } {
  const ranked = rankCandidates(candidates);
  if (ranked.length === 0) {
    return { nextStep: startStep(fallbackHref), alternates: [] };
  }
  return { nextStep: ranked[0], alternates: ranked.slice(1, 3) };
}
