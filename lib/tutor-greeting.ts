/**
 * tutor-greeting.ts — the tutor opens the conversation instead of waiting.
 *
 * A private tutor who says nothing until spoken to is a search box. The empty
 * state used to show four fixed suggestions that were identical for a student
 * on day one and a student three weeks in with six reviews overdue.
 *
 * ⚠️ THIS FILE MAKES NO API CALL AND MUST NEVER MAKE ONE.
 * Every line is assembled from templates over state the app already holds
 * (results log, review queue, study plan, lib/cognition). That buys three
 * things an LLM greeting cannot: it costs $0 on a screen that renders on every
 * single visit, it appears instantly with no spinner, and it CANNOT hallucinate
 * a fact about the student — the same reasoning as lib/mathscan/explain.ts.
 *
 * The greeting degrades one field at a time: every signal is independently
 * guarded, so a student with no plan, no results and no cognition map still
 * gets a valid (if generic) greeting rather than a crash on an empty screen.
 */

import { totalStats } from '@/lib/results';
import { dueCount } from '@/lib/review';
import { getPlan, daysUntilBagrut } from '@/lib/study-plan';
import { resolveCognitive } from '@/lib/tutor-context';
import { buildTodayPlan } from '@/lib/daily-plan-client';
import { getPatternProfile, topPattern, TAG_INFO } from '@/lib/patterns';

/** A destination lib/cognition already chose. We never invent one here. */
export type GreetingAction = { label: string; href: string; reason: string };

/** Today's work, in the tutor's voice. Null until the student has a study plan. */
export type TodayBrief = {
  /** "12 דקות · 2 משימות" — the commitment, stated before it is asked for. */
  summary: string;
  /** The ONE thing to start with. A teacher names a first move, not a menu. */
  first: { title: string; why: string; href: string; minutes: number };
  /** How far the predicted grade is from the target, when both are known. */
  goalLine: string | null;
  /** Tasks beyond the first — counted, not listed. */
  more: number;
};

export type TutorGreeting = {
  headline: string;
  /** Short factual chips: "6 שאלות ממתינות לחזרה". */
  chips: string[];
  /** The one Hebrew sentence from lib/cognition, or null when evidence is thin. */
  insight: string | null;
  /**
   * The one mistake that keeps coming back ACROSS topics, or null.
   *
   * Distinct from `insight`, which lib/cognition scopes to the current topic.
   * This is the thing a human tutor notices that a per-topic view structurally
   * cannot: the same slip in סדרות, in הסתברות and in the bagrut paper is one
   * problem, and until it is named the student repairs it three times.
   *
   * It points at /report rather than opening a conversation. The full "what to
   * do about it" is written once, there; a chat prompt would either duplicate
   * it or fall through to the API on a screen that renders on every visit.
   */
  pattern: { label: string; sentence: string; href: string } | null;
  /** 2–4 opening lines, the personal ones first. */
  prompts: string[];
  action: GreetingAction | null;
  /**
   * What a real teacher opens with: "today we're doing X, it takes 12 minutes,
   * and here is why it matters for your grade."
   *
   * Built from lib/daily-plan — the same engine /my-plan renders — so the tutor
   * cannot give a second opinion that contradicts the plan page. $0.
   */
  today: TodayBrief | null;
};

/** Fallbacks, used to top the list up to MAX_PROMPTS — and exported so the
 *  empty state can render something on the first paint, before the mount
 *  effect has read localStorage. One copy, so the two can't drift. */
export const GENERIC_PROMPTS = [
  'הסבר לי על מספרים מרוכבים',
  'תפתור איתי בעיה בנגזרות',
  'מה ההבדל בין סדרה חשבונית להנדסית?',
  'תעזור לי להבין אינטגרלים',
];

const MAX_PROMPTS = 4;
const DAY_MS = 86_400_000;

/** Same floor as the tutor brief — see MIN_OBSERVATIONS in tutor-context. */
const MIN_OBSERVATIONS = 3;

export function buildTutorGreeting(
  subject: string,
  topic: string,
  now: number = Date.now(),
): TutorGreeting {
  const chips: string[] = [];
  const personal: string[] = [];
  let insight: string | null = null;
  let pattern: TutorGreeting['pattern'] = null;
  let action: GreetingAction | null = null;
  let today: TodayBrief | null = null;

  // --- how long has he been gone -----------------------------------------
  let attempts = 0;
  let daysAway = 0;
  try {
    const st = totalStats(subject);
    attempts = st.attempts;
    if (st.lastTs > 0) daysAway = Math.floor((now - st.lastTs) / DAY_MS);
  } catch {
    /* skip */
  }

  const headline =
    attempts === 0
      ? 'נעים להכיר'
      : daysAway >= 3
        ? 'טוב לראות אותך שוב'
        : 'נמשיך מאיפה שעצרנו';

  if (attempts > 0 && daysAway >= 2) chips.push(`${daysAway} ימים מהתרגול האחרון`);

  // --- the review backlog -------------------------------------------------
  try {
    const due = dueCount(now);
    if (due > 0) {
      chips.push(`${due} שאלות ממתינות לחזרה`);
      personal.push('בוא נעבור על מה שממתין לי לחזרה');
    }
  } catch {
    /* skip */
  }

  // --- the deadline -------------------------------------------------------
  try {
    const plan = getPlan();
    if (plan?.bagrutDate) {
      const d = daysUntilBagrut(plan);
      if (d >= 0) chips.push(`${d} ימים לבגרות`);
    }
  } catch {
    /* skip */
  }

  // --- what the cognitive layer already worked out ------------------------
  try {
    const cog = resolveCognitive(subject, topic);
    if (cog && cog.totalObservations >= MIN_OBSERVATIONS) {
      insight = cog.insight;
      action = {
        label: cog.nextStep.title,
        href: cog.nextStep.href,
        reason: cog.nextStep.reason,
      };

      const live = cog.misconceptions.find(
        (m) => m.status === 'active' || m.status === 'suspected',
      );
      // "את X" and not a ב/ל prefix on purpose: the titles are a mix of
      // definite and indefinite, and gluing a preposition on produces
      // *בההצגה — the bug lib/cognition/insight.ts needed hePrefix for.
      if (live) personal.push(`למה אני ממשיך לטעות את אותה טעות — ${live.title}?`);
      if (cog.weakestLink) {
        personal.push(`תסביר לי מההתחלה את ${cog.weakestLink.rootTitle}`);
      }
    }
  } catch {
    /* skip */
  }

  // --- the mistake that keeps coming back, across topics -------------------
  // Independently guarded like every other block: a pattern failure must not
  // cost the student their greeting.
  try {
    const top = topPattern(getPatternProfile(subject, now));
    if (top) {
      const info = TAG_INFO[top.tag];
      pattern = {
        label: info.label,
        sentence:
          `שמתי לב שהטעות "${info.label}" חוזרת אצלך ב-${top.spread} תתי-נושא ` +
          `(${top.topics.map((t) => t.topic).join(', ')}), ${top.hits} פעמים בסך הכול.`,
        href: '/report',
      };
    }
  } catch {
    /* skip */
  }

  // --- today's work, in one sentence and one button ------------------------
  // Placed after the cognitive block so a plan failure cannot cost the insight.
  try {
    const plan = buildTodayPlan();
    const first = plan?.tasks[0];
    if (plan && first) {
      const count = plan.tasks.length;
      today = {
        summary: `${plan.totalMinutes} דקות · ${count === 1 ? 'משימה אחת' : `${count} משימות`}`,
        first: { title: first.title, why: first.why, href: first.href, minutes: first.minutes },
        goalLine: plan.goal.headline,
        more: Math.max(0, count - 1),
      };
      // The day's first task outranks the topic-level next step: it already
      // weighed reviews, weaknesses and pacing against the exam date, which
      // `nextStep` — scoped to one topic — cannot see.
      action = { label: first.title, href: first.href, reason: first.why };
    }
  } catch {
    /* skip */
  }

  if (topic) personal.push(`תעזור לי עם ${topic}`);

  const prompts = [...new Set([...personal, ...GENERIC_PROMPTS])].slice(0, MAX_PROMPTS);

  return { headline, chips, insight, pattern, prompts, action, today };
}
