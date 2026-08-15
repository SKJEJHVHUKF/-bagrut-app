/**
 * tutor-local.ts — answering the student from material that is already written.
 *
 * ============================================================
 * WHY THIS EXISTS
 * ============================================================
 * The overwhelming majority of what a student asks a tutor mid-exercise is one
 * of a handful of things: "give me a hint", "where do I start", "why is my
 * answer wrong", "just show me". Every one of those already has an authored,
 * human-verified answer sitting in the content:
 *
 *   question.hint                 the authored one-line nudge
 *   question.solution.steps       the worked solution, step by step
 *   question.solution.explanation why it works
 *   question.distractorNotes[i]   why THAT specific wrong option is wrong —
 *                                 one per distractor, written as a real
 *                                 misconception
 *   subTopic.formulas             the formulas for this module
 *   subTopic.keyPoints            the "must remember" bullets
 *
 * Sending those to an API to be paraphrased costs money on every turn and can
 * only make them worse: the model can drift, the authored text cannot. So this
 * module answers first, and the API is the FALLBACK for the genuinely novel
 * question ("why do we multiply by 2 here?") rather than the default path.
 *
 * ============================================================
 * THE RULE
 * ============================================================
 * Answer locally ONLY on an explicit, unambiguous match. Every uncertain case
 * returns null and falls through to the real tutor. A wrong canned answer is
 * far more expensive than the API call it saved — it costs the student's trust
 * in a screen that is supposed to be the authority.
 *
 * Nothing here calls an API, and nothing here generates text: every string
 * returned is either authored content or a fixed Hebrew connective around it.
 */

import { buildHelpLadder } from '@/lib/help-ladder';
import type { TutorFocus } from '@/lib/tutor-presence';

export type LocalAnswerKind =
  | 'why-wrong'
  | 'hint'
  | 'first-step'
  | 'full'
  | 'formulas'
  | 'key-points';

export type LocalAnswer = {
  /** Markdown + LaTeX, ready to render with the same pipeline as a reply. */
  text: string;
  kind: LocalAnswerKind;
};

/** Normalise a Hebrew message for matching: strip punctuation and final forms. */
function norm(s: string): string {
  return s
    .replace(/[?!.,:;"'׳״\-–—()[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const has = (t: string, ...words: string[]) => words.some((w) => t.includes(w));

/**
 * What the student is asking for, or null when it isn't one of the known asks.
 *
 * Deliberately keyword-based rather than clever. A classifier here would be a
 * second model call, which is the cost this whole module exists to avoid — and
 * the ambiguous cases are supposed to fall through to the tutor anyway, so a
 * blunt matcher that abstains often is exactly the right instrument.
 *
 * Order matters: the more specific intents are tested first, because "למה
 * התשובה שלי שגויה" contains both "למה" and "תשובה".
 */
export function classifyAsk(message: string): LocalAnswerKind | null {
  const t = norm(message);

  // "why is MY answer wrong" — needs the possessive/past-tense marker, so a
  // general "למה זה ככה" is NOT captured here and reaches the real tutor.
  if (
    has(t, 'למה טעיתי', 'למה זה שגוי', 'למה התשובה שלי', 'מה הטעות שלי', 'איפה טעיתי') ||
    (has(t, 'למה') && has(t, 'שגוי', 'שגויה', 'לא נכון', 'לא נכונה', 'טעות', 'טעיתי'))
  ) {
    return 'why-wrong';
  }

  if (has(t, 'רמז', 'תרמז', 'רמזים')) return 'hint';

  if (has(t, 'מאיפה מתחילים', 'איך מתחילים', 'מאיפה להתחיל', 'הצעד הראשון', 'איך ניגשים', 'מאיפה מתחילה'))
    return 'first-step';

  if (has(t, 'נוסחה', 'נוסחא', 'נוסחאות', 'איזה נוסחה', 'איזו נוסחה')) return 'formulas';

  if (has(t, 'מה חשוב', 'מה לזכור', 'מה צריך לזכור', 'סיכום', 'עיקרי דברים')) return 'key-points';

  // The explicit give-up. Kept last among the specific asks so "תראה לי רמז"
  // resolves to a hint rather than to the whole solution.
  if (
    has(t, 'תראה לי את הפתרון', 'הפתרון המלא', 'תפתור', 'תראה לי איך', 'פתרון מלא', 'תפתרי') ||
    (has(t, 'פתרון') && has(t, 'תראה', 'תן', 'רוצה'))
  ) {
    return 'full';
  }

  // Plain "I'm stuck" — the caller decides which rung to serve based on how
  // much help was already given, so this maps to the gentlest one.
  if (has(t, 'תקוע', 'תקועה', 'לא מצליח', 'לא מצליחה', 'נתקעתי', 'לא מבין', 'לא מבינה', 'לא הבנתי'))
    return 'hint';

  return null;
}

/**
 * Try to answer from authored content.
 *
 * @param alreadyServed the kinds already served for THIS question, so asking
 *   for a hint twice walks down the ladder instead of repeating itself — the
 *   same escalation lib/help-ladder gives through its buttons.
 */
export function answerLocally(
  message: string,
  focus: TutorFocus | null,
  alreadyServed: LocalAnswerKind[] = [],
): LocalAnswer | null {
  const q = focus?.question;
  const subTopic = focus?.subTopic;
  let ask = classifyAsk(message);
  if (!ask) return null;

  // ---- why is MY answer wrong: the authored per-distractor note ----------
  // This is the single highest-value case. Every MCQ distractor in the bank was
  // written as a specific misconception with a note explaining it, and until
  // now that note was shown once and thrown away.
  if (ask === 'why-wrong') {
    const idx = focus?.chosenIndex;
    const note =
      q && typeof idx === 'number' ? q.distractorNotes?.[idx]?.trim() : undefined;
    if (note) {
      return {
        kind: 'why-wrong',
        text: `${note}\n\nרוצה לנסות שוב מכאן, או שנעבור על הצעד הראשון יחד?`,
      };
    }
    // No authored note for that option → the tutor should actually think.
    return null;
  }

  // ---- module-level asks: formulas and key points ------------------------
  if (ask === 'formulas') {
    const fs = subTopic?.formulas ?? [];
    if (!fs.length) return null;
    // `note` carries the "when do I use this" line where it was authored —
    // the part a student actually needs, and the part a paraphrase loses.
    const body = fs
      .map((f) => `- **${f.name}** — $${f.latex}$${f.note ? ` — ${f.note}` : ''}`)
      .join('\n');
    return {
      kind: 'formulas',
      text: `הנוסחאות של "${subTopic!.title}":\n\n${body}`,
    };
  }

  if (ask === 'key-points') {
    const kps = subTopic?.keyPoints ?? [];
    if (!kps.length) return null;
    return {
      kind: 'key-points',
      text: `מה שחשוב לזכור ב"${subTopic!.title}":\n\n${kps.map((k) => `- ${k}`).join('\n')}`,
    };
  }

  // ---- the help ladder: hint → first step → full solution ----------------
  if (!q) return null;

  // buildHelpLadder is the existing, tested derivation — including its rule
  // that a first-step which would leak the final answer is replaced by the
  // sub-topic's key points instead. Reusing it means this module cannot
  // disagree with the "למד אותי" buttons on the same screen.
  const ladder = buildHelpLadder(q, subTopic ?? null);

  // Escalate along the LADDER'S OWN rungs, not a list of our own.
  //
  // Two things this fixes. A question with no authored `hint` has no 'hint'
  // rung at all, and asking for the exact kind returned null — the student got
  // silence (well, an API call) even though a perfectly good "how to start"
  // was sitting right there. And a second "אני עדיין תקוע" must not re-serve
  // what was already given. Walking the ladder's real tiers does both, and
  // keeps the gradation the content author chose: where a first step would
  // leak the answer the ladder substitutes key-points, and we inherit that
  // rather than deciding it again here.
  if (ask === 'hint' || ask === 'first-step') {
    const tier = ladder.tiers.find((t) => t.body.length && !alreadyServed.includes(t.kind));
    if (tier) return { kind: tier.kind as LocalAnswerKind, text: tier.body.join('\n\n') };
    // Every graded rung has been spent. The ladder itself ends at the full
    // solution, so that is the honest next move rather than a refusal.
    ask = 'full';
  }

  if (ask === 'full') {
    const steps = q.solution.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
    const why = q.solution.explanation ? `\n\n**למה זה עובד:** ${q.solution.explanation}` : '';
    return {
      kind: 'full',
      text: `${steps}\n\n**התשובה: ${q.solution.finalAnswer}**${why}`,
    };
  }

  const tier = ladder.tiers.find((t) => t.kind === ask);
  if (!tier || !tier.body.length) return null;
  return { kind: ask, text: tier.body.join('\n\n') };
}
