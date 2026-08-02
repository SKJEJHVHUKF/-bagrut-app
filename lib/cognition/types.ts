/**
 * cognition/types.ts — the derived (never stored) cognitive state.
 *
 * Nothing here is persisted. The whole state is a pure function of the existing
 * answer log (lib/results.ts), the static catalog (content/cognition) and the
 * clock — see lib/cognition/index.ts `buildCognitiveState`. That property is
 * deliberate: there is no sixth localStorage store to migrate, no way for a
 * cached diagnosis to drift out of sync with the evidence behind it, and a
 * synthetic student can be replayed through the exact same code path the app
 * uses.
 */

import type { MisconceptionId, SkillId } from '@/content/cognition/types';
import type { ResultSource } from '@/lib/results';

export type { MisconceptionId, SkillId };

/** One answer, resolved against the catalog. Derived from a ResultEvent. */
export type Observation = {
  ts: number;
  skillId: SkillId;
  correct: boolean;
  kind: 'mcq' | 'open';
  /** MCQ option count — sets the BKT guess parameter. */
  optionCount?: number;
  /** The hint was revealed before the counted attempt. */
  hintUsed?: boolean;
  /** Open questions: the student graded themselves rather than being graded. */
  selfReported?: boolean;
  /** A re-answer of a question already seen (weaker evidence). */
  isReplay?: boolean;
  source: ResultSource;
  /** Set when the chosen distractor matched a catalog trigger. */
  misconceptionId?: MisconceptionId;
};

export type MasteryState = 'unknown' | 'fragile' | 'developing' | 'mastered';

export type SkillMastery = {
  skillId: SkillId;
  /** The catalog's Hebrew title, copied in so the insight templates and the UI
   *  never have to carry the skill list around just to render a name. */
  title: string;
  /** P(skill is known), after time decay. 0..1 */
  p: number;
  state: MasteryState;
  /** Raw number of observations in the window. */
  observations: number;
  /** Recency-weighted observation count — drives `confidence`. */
  effectiveN: number;
  /** How much we KNOW, as opposed to how good they are. 0..1 */
  confidence: number;
  lastTs: number;
  trend: 'up' | 'flat' | 'down';
};

export type MisconceptionStatus = 'resolved' | 'fading' | 'suspected' | 'active';

export type MisconceptionState = {
  id: MisconceptionId;
  skillId: SkillId;
  title: string;
  insight: string;
  hits: number;
  /** Questions answered where this misconception's distractor was on offer. */
  opportunities: number;
  /** Laplace-smoothed, recency-weighted hit rate. 0..1 */
  rate: number;
  /** Ranking strength: rate × recency × status factor. 0..1 */
  weight: number;
  lastHitTs: number;
  status: MisconceptionStatus;
};

/** A prerequisite that is weaker than the skill currently being attempted. */
export type WeakestLink = {
  childSkill: SkillId;
  childTitle: string;
  rootSkill: SkillId;
  rootTitle: string;
  /** p(child) − p(root). Bigger = a sharper break. */
  gap: number;
};

export type NextStepKind =
  | 'prereq-repair'
  | 'misconception-drill'
  | 'review-due'
  | 'continue-ladder'
  | 'consolidate'
  | 'start';

export type NextStep = {
  kind: NextStepKind;
  score: number;
  /** Hebrew, imperative — the button label. */
  title: string;
  /** Hebrew — why this and not something else. */
  reason: string;
  /** An EXISTING route. The engine never invents a destination. */
  href: string;
  skillId?: SkillId;
  misconceptionId?: MisconceptionId;
};

export type CognitiveState = {
  subject: string;
  topic: string;
  skills: SkillMastery[];
  /** Sorted by `weight`, strongest first. */
  misconceptions: MisconceptionState[];
  weakestLink: WeakestLink | null;
  nextStep: NextStep;
  /** Up to 2 runners-up, for a "or instead" affordance. */
  alternates: NextStep[];
  /** The one Hebrew sentence. `null` when the evidence is too thin to claim. */
  insight: string | null;
  /** Share of catalog skills with any evidence at all. 0..1 */
  coverage: number;
  /** Total observations the state was built from. */
  totalObservations: number;
  updatedAt: number;
};
