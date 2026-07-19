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

export type RoadmapLevelKind = 'learn' | 'easy' | 'mid' | 'hard' | 'bagrut';

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
};

/** XP per rung — harder rungs are worth more, giving a real "progression". */
const XP: Record<RoadmapLevelKind, number> = {
  learn: 10,
  easy: 15,
  mid: 25,
  hard: 40,
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

  const levels: RoadmapLevel[] = [];
  const add = (
    kind: RoadmapLevelKind,
    title: string,
    subtitle: string,
    emoji: string,
    questions: PracticeQuestion[],
    bagrut: StaticBagrutQuestion[],
  ) => {
    levels.push({ kind, index: levels.length, title, subtitle, emoji, xp: XP[kind], questions, bagrut });
  };

  if (steps.length > 0) {
    add('learn', 'לומדים', 'מבינים את הרעיון — שלב אחר שלב', '📖', [], []);
  }
  if (easy.length > 0) {
    add('easy', 'חימום', `${easy.length} תרגילי פתיחה קלים`, '🌱', easy, []);
  }
  if (mid.length > 0) {
    add('mid', 'ביסוס', `${mid.length} תרגילים ברמת בגרות`, '⚡', mid, []);
  }
  if (hard.length > 0) {
    add('hard', 'אתגר', `${hard.length} תרגילים מאתגרים`, '🔥', hard, []);
  }
  if (bag.length > 0) {
    add('bagrut', 'בגרות', 'שאלת בגרות אמיתית ורב-שלבית', '🎓', [], bag);
  }

  return levels;
}

/**
 * Stars (1-3) for a cleared rung, from first-pass accuracy. The `learn` rung
 * (no grading) always earns 3. Practice/bagrut rungs: perfect → 3, at least
 * half → 2, otherwise 1 (a rung is never worth 0 stars once completed —
 * finishing is progress).
 */
export function computeStars(kind: RoadmapLevelKind, score: number, total: number): number {
  if (kind === 'learn' || total <= 0) return 3;
  const ratio = score / total;
  if (ratio >= 0.999) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
}
