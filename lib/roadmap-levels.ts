/**
 * roadmap-levels.ts — the graded LEVEL LADDER inside a single sub-topic.
 *
 * Each sub-topic milestone in the roadmap is climbed as an ordered ladder of
 * up to 5 rungs, escalating in difficulty. The rungs are DERIVED from the
 * existing content (no duplication):
 *
 *   📖 לומדים  (learn)  — the guided lesson steps + formulas + worked example
 *   🌱 חימום   (easy)   — the sub-topic's `easy` practice questions
 *   ⚡ ביסוס   (mid)    — the `mid` questions (standard bagrut level)
 *   🔥 אתגר    (hard)   — the `hard` questions
 *   🎓 בגרות   (bagrut) — the tagged multi-part bagrut question(s)
 *
 * A rung with no content is skipped (robust to sparse sub-topics), but every
 * authored 582 sub-topic currently has all five. This module is PURE — no
 * storage, no React — so it can run on server or client and be unit-tested.
 */

import type {
  PracticeQuestion,
  StaticBagrutQuestion,
  SubTopic,
} from '@/content/lessons/types';
import { getBagrutQuestionsForSubTopic } from '@/content/lessons';
import { getGhostReplaysForSubTopic } from '@/content/ghost-replay';
import type { GhostReplay } from '@/content/ghost-replay/types';

export type RoadmapLevelKind = 'learn' | 'easy' | 'mid' | 'hard' | 'ghost' | 'bagrut';

export type RoadmapLevel = {
  kind: RoadmapLevelKind;
  /** 0-based rung position within the sub-topic (empty tiers are skipped). */
  index: number;
  /** Short Hebrew name — "לומדים" / "חימום" / "ביסוס" / "אתגר" / "בגרות". */
  title: string;
  /** One-line description of what the rung is. */
  subtitle: string;
  emoji: string;
  /** XP awarded the FIRST time this rung is cleared. */
  xp: number;
  /** Practice questions for easy/mid/hard rungs (empty otherwise). */
  questions: PracticeQuestion[];
  /** Multi-part bagrut question(s) for the bagrut rung (empty otherwise). */
  bagrut: StaticBagrutQuestion[];
  /** Guided thinking walkthrough(s) for the ghost rung (empty otherwise). */
  ghost: GhostReplay[];
};

/** XP per rung — harder rungs are worth more, giving a real "progression". */
const XP: Record<RoadmapLevelKind, number> = {
  learn: 10,
  easy: 15,
  mid: 25,
  hard: 40,
  ghost: 45,
  bagrut: 60,
};

/**
 * The rungs that count toward "node complete" (unlocks the next sub-topic and
 * syncs to the legacy progress stores). Learn + easy + mid = core competence;
 * the hard + bagrut rungs are optional MASTERY on top, so a student is never
 * blocked from advancing by the single hardest question. This preserves the
 * gentle climb the product is built around.
 */
export const CORE_LEVELS: RoadmapLevelKind[] = ['learn', 'easy', 'mid'];

/** Build the ordered level ladder for one sub-topic from its content. */
export function buildSubTopicLevels(
  subject: string,
  topic: string,
  st: SubTopic,
): RoadmapLevel[] {
  const steps = st.lesson ?? [];
  const qs = st.questions ?? [];
  const easy = qs.filter((q) => q.difficulty === 'easy');
  const mid = qs.filter((q) => q.difficulty === 'mid');
  const hard = qs.filter((q) => q.difficulty === 'hard');
  const bag = getBagrutQuestionsForSubTopic(subject, topic, st.id);
  const ghost = getGhostReplaysForSubTopic(subject, topic, st.id);

  const levels: RoadmapLevel[] = [];
  const add = (
    kind: RoadmapLevelKind,
    title: string,
    subtitle: string,
    emoji: string,
    payload: Partial<Pick<RoadmapLevel, 'questions' | 'bagrut' | 'ghost'>> = {},
  ) => {
    levels.push({
      kind,
      index: levels.length,
      title,
      subtitle,
      emoji,
      xp: XP[kind],
      questions: payload.questions ?? [],
      bagrut: payload.bagrut ?? [],
      ghost: payload.ghost ?? [],
    });
  };

  if (steps.length > 0) {
    add('learn', 'לומדים', 'מבינים את הרעיון — שלב אחר שלב', '📖');
  }
  if (easy.length > 0) {
    add('easy', 'חימום', `${easy.length} תרגילי פתיחה קלים`, '🌱', { questions: easy });
  }
  if (mid.length > 0) {
    add('mid', 'ביסוס', `${mid.length} תרגילים ברמת בגרות`, '⚡', { questions: mid });
  }
  if (hard.length > 0) {
    add('hard', 'אתגר', `${hard.length} תרגילים מאתגרים`, '🔥', { questions: hard });
  }
  // AFTER the challenge rung on purpose: a ghost replay re-walks a question the
  // student has already fought with. Placed earlier it would be a worked
  // solution handed over in advance — precisely what it exists to replace.
  if (ghost.length > 0) {
    add('ghost', 'חשיבה', 'איך חושבים על השאלה — צעד אחר צעד, בלי פתרון מוכן', '🧠', { ghost });
  }
  if (bag.length > 0) {
    add('bagrut', 'בגרות', 'שאלת בגרות אמיתית ורב-שלבית', '🎓', { bagrut: bag });
  }

  return levels;
}

// Pass/fail + stars now live in lib/roadmap-mastery.ts (a rung can no longer be
// "cleared" with zero correct answers). This module only builds the ladder.
