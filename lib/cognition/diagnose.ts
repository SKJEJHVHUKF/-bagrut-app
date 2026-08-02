/**
 * cognition/diagnose.ts — find the WEAKEST LINK in the prerequisite graph.
 *
 * This is the module that produces the product's headline claim: not "you are
 * weak at complex roots" (which the old per-sub-topic accuracy could already
 * say, badly) but "the thing that is actually broken is one step upstream of
 * where you are failing".
 *
 * The rule is deliberately conservative. A prerequisite is only named as the
 * root cause when we have real evidence about IT — not merely an absence of
 * evidence — and when it is clearly weaker than the skill the student is
 * currently attempting. Naming a prerequisite we know nothing about would be
 * guessing dressed up as a diagnosis.
 *
 * Pure; the clock is a parameter.
 */

import type { Skill, SkillId } from '@/content/cognition/types';
import { MIN_CONFIDENCE } from './trace';
import type { SkillMastery, WeakestLink } from './types';

const DAY = 24 * 60 * 60 * 1000;

/** How recent an attempt must be for a skill to count as "currently being learned". */
export const RECENT_WINDOW_DAYS = 14;
/** The prerequisite must be this much weaker than the skill above it. */
export const MIN_GAP = 0.15;
/** We must actually know something about the prerequisite before blaming it.
 *  Same bar the classifier uses, so "fragile" and "blameable" can't disagree. */
export const MIN_ROOT_CONFIDENCE = MIN_CONFIDENCE;

/** Prerequisites of `skillId`, up to `maxDepth` hops upstream. Cycle-safe. */
export function ancestors(
  skills: Skill[],
  skillId: SkillId,
  maxDepth = 2,
): SkillId[] {
  const bySkill = new Map(skills.map((s) => [s.id, s]));
  const seen = new Set<SkillId>([skillId]);
  const out: SkillId[] = [];
  let frontier = [skillId];

  for (let depth = 0; depth < maxDepth && frontier.length > 0; depth++) {
    const next: SkillId[] = [];
    for (const id of frontier) {
      for (const p of bySkill.get(id)?.prereqs ?? []) {
        if (seen.has(p)) continue;
        seen.add(p);
        out.push(p);
        next.push(p);
      }
    }
    frontier = next;
  }
  return out;
}

/** Depth of a skill in the graph — used only to break ties toward the root. */
function depthOf(skills: Skill[], id: SkillId): number {
  return ancestors(skills, id, 8).length;
}

/**
 * The single most informative prerequisite break, or null.
 *
 * Candidates are skills the student has attempted recently and not yet
 * mastered. For each, we look upstream for a prerequisite that is `fragile`,
 * that we have enough evidence about, and that sits at least MIN_GAP below the
 * skill being attempted. The biggest gap wins; ties go to the deeper root, so
 * the student is sent to the earliest thing that is broken rather than to the
 * middle of the chain.
 */
export function findWeakestLink(
  skills: Skill[],
  mastery: SkillMastery[],
  now: number,
): WeakestLink | null {
  const byId = new Map(mastery.map((m) => [m.skillId, m]));
  const titleOf = new Map(skills.map((s) => [s.id, s.title]));
  const recentCutoff = now - RECENT_WINDOW_DAYS * DAY;

  let best: (WeakestLink & { rootDepth: number }) | null = null;

  for (const skill of skills) {
    const child = byId.get(skill.id);
    if (!child || child.observations === 0) continue;
    if (child.lastTs < recentCutoff) continue;
    if (child.state === 'mastered') continue;

    for (const rootId of ancestors(skills, skill.id, 2)) {
      const root = byId.get(rootId);
      if (!root) continue;
      if (root.state !== 'fragile') continue;
      if (root.confidence < MIN_ROOT_CONFIDENCE) continue;

      const gap = child.p - root.p;
      if (gap < MIN_GAP) continue;

      const rootDepth = depthOf(skills, rootId);
      const better =
        !best ||
        gap > best.gap + 1e-9 ||
        (Math.abs(gap - best.gap) <= 1e-9 && rootDepth > best.rootDepth);
      if (better) {
        best = {
          childSkill: skill.id,
          childTitle: titleOf.get(skill.id) ?? skill.id,
          rootSkill: rootId,
          rootTitle: titleOf.get(rootId) ?? rootId,
          gap,
          rootDepth,
        };
      }
    }
  }

  if (!best) return null;
  const { rootDepth: _rootDepth, ...link } = best;
  void _rootDepth;
  return link;
}

/** Skills the student is actively working on right now, weakest first. */
export function activeSkills(mastery: SkillMastery[], now: number): SkillMastery[] {
  const cutoff = now - RECENT_WINDOW_DAYS * DAY;
  return mastery
    .filter((m) => m.observations > 0 && m.lastTs >= cutoff)
    .sort((a, b) => a.p - b.p || a.skillId.localeCompare(b.skillId));
}

/**
 * Skills that were solid and have decayed since — the "you knew this in March"
 * case. Requires real past evidence, so a skill nobody ever tested never shows
 * up here.
 */
export function stagnantSkills(
  mastery: SkillMastery[],
  now: number,
  minIdleDays = 21,
): SkillMastery[] {
  const cutoff = now - minIdleDays * DAY;
  return mastery
    .filter((m) => m.observations >= 3 && m.lastTs > 0 && m.lastTs < cutoff)
    .sort((a, b) => a.lastTs - b.lastTs);
}
