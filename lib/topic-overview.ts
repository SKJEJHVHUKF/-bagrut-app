/**
 * topic-overview.ts — the answer to a student who names a topic and nothing else.
 *
 * ============================================================
 * THE MESSAGE NOBODY COULD ANSWER
 * ============================================================
 * The tutor is instructed to ask "על איזה נושא אתה עובד עכשיו?" whenever no
 * screen names one. The student answers "הסתברות". One word, and until now
 * every single one of them reached the model — measured on a real session, four
 * consecutive turns and $0.0325, none of them local.
 *
 * ⚠️ AND IT WAS NOT A MATCHING PROBLEM. Probability has fifteen authored Topic
 * Cards and every one of them is excellent: conditional probability, with and
 * without replacement, the complement rule, "at least one". Not one of them
 * answers "what is probability" — because nobody writes a card for the whole
 * topic, they write cards for the ideas inside it. The bare topic name had
 * nothing to match against, and no amount of loosening a threshold would have
 * changed that.
 *
 * ============================================================
 * WHAT IT ANSWERS WITH, AND WHY NOT THE LESSON SUMMARY
 * ============================================================
 * `lesson.summary` exists for all fifteen topics and is the obvious candidate.
 * It is also a formula sheet — "$P(A) = \dfrac{|A|}{|\Omega|}$ • $P(A^c) = 1 -
 * P(A)$" — dense reference material that answers a student's "הסתברות" with a
 * wall of LaTeX. Correct, and not a tutor.
 *
 * The cards themselves are the better answer, because the list of cards IS the
 * list of questions this app has already written answers for. So a bare topic
 * name comes back as a short menu of them.
 *
 * ⚠️ THE FORK WAS A CLAIM BEFORE IT WAS A FACT, AND IT TOOK TWO FIXES.
 *
 * This comment used to say "every item the student then picks is another local
 * answer — a dead end becomes a fork with free branches", and nobody had
 * measured it. MEASURED (npm run measure:topiccards): **0 of 25 menu items
 * landed on their own card.** Two independent reasons, and neither was the
 * menu itself:
 *
 *   1. `renderTopicCard` has exactly one caller — lib/tutor-compiler — and the
 *      compiler sat behind `tutorFlag('compiler')`, which was off for everyone.
 *      With it off NOTHING could serve a card, whatever the label said. The
 *      rollout was approved on the numbers and the default is now on.
 *   2. `label()` below stripped the leading "מה זה", and the residue fell under
 *      the matcher's content-word floor. It no longer strips anything.
 *
 * With both fixed: **20 of 25**. The five that still miss are phrasings the
 * matcher does not reach, which is a matcher question and not a menu one.
 *
 * A third guard sits in the chain, not here: `ChainState.overviewFor`. Card
 * subjects resolve to their own topic and leave only filler behind, so each one
 * is itself a bare topic name — without it, picking an item off the menu
 * returned the identical menu.
 *
 * Topics with no cards yet fall back to the authored formula NAMES — still the
 * shape of the topic, still no model call, and it is why this covers all
 * fifteen rather than the two that have cards.
 */

import { loadTopicCards } from '@/lib/topic-cards';
import { getLesson } from '@/content/lessons';
import { MATH5_CURRICULUM } from '@/content/bagrut-curriculum';

/** How many options to name. More than this reads as a table of contents. */
const MAX_OPTIONS = 6;

/**
 * The first alias is the phrasing the card was written to answer, so sending it
 * back is guaranteed to reach that card.
 *
 * ⚠️ NOTHING IS STRIPPED, AND THE TIDIER VERSION COST NINE FREE ANSWERS.
 *
 * This used to remove a leading "מה זה", so the menu read as a list of subjects
 * — "עם החזרה" — instead of a list of questions. It reads better and it breaks
 * the menu: the residue drops under the matcher's two-content-word floor, so
 * the item stops matching the card it was taken from. MEASURED with the
 * compiler on, over the 25 approved cards:
 *
 *     stripped label   11/25 answered free
 *     full alias       20/25 answered free
 *
 * Every single difference went the same way, and not one item was answered by
 * the stripped form and lost by the full one. A menu item that reads a little
 * longer but actually answers beats a tidy one that goes to the model.
 */
function label(alias: string): string {
  return alias.trim();
}

/**
 * The reply to "תסביר לי משהו מהחומר" — a topic to choose from.
 *
 * ⚠️ THIS IS ONE OF THE APP'S OWN BUTTONS. `IDLE_PROMPTS` in TutorBubble offers
 * exactly two prompts when there is no question on screen. The first,
 * "על מה כדאי לי לעבוד עכשיו", is answered locally by lib/tutor-plan-answer.
 * The second was billed EVERY TIME — twice in one measured session — for a
 * reply that can only be "which topic?", because with no topic named there is
 * nothing else to say.
 *
 * The model's version of that reply costs ~$0.002 and asks the same question.
 * This one asks it with the list attached, so the next message is a topic name
 * and lands on `topicOverview` for free.
 *
 * Deliberately NOT in the general FAQ bank: the topic list has to come from the
 * curriculum, and a bank entry is a fixed string that would rot the day a topic
 * is added.
 */
export function chooseTopicPrompt(): string {
  const names = MATH5_CURRICULUM.map((t) => String((t as { key?: unknown }).key ?? '')).filter(Boolean);
  return (
    'בשמחה. אלה הנושאים שאני מכיר:\n\n' +
    names.map((n) => `\u00b7 ${n}`).join('\n') +
    // ⚠️ ENDS ON THE QUESTION, same rule as topicOverview below: a card that
    // ends in a full stop ends the conversation. The friendlier closing line
    // goes BEFORE the ask, not after it.
    '\n\nאפשר לבחור אחד, ואפשר פשוט לכתוב לי מה לא ברור. במה נתחיל?'
  );
}

/**
 * A short overview of `topic`, or null when there is nothing authored to say.
 *
 * Never invents: everything here is a card alias or a formula name that a
 * person wrote. Returns null rather than a generic sentence, because a generic
 * sentence about a topic is exactly what the model is for.
 */
export async function topicOverview(topic: string): Promise<string | null> {
  const t = (topic ?? '').trim();
  if (!t) return null;

  let options: string[] = [];
  try {
    const cards = await loadTopicCards(t);
    options = cards
      .filter((c) => c.approved && c.aliases?.length)
      .map((c) => label(c.aliases[0]))
      .filter(Boolean);
  } catch {
    /* a topic with no cards — the formulas below carry it */
  }

  if (options.length === 0) {
    try {
      const lesson = getLesson('math5', t) as unknown as { formulas?: Array<{ name?: string }> };
      options = (lesson?.formulas ?? [])
        .map((f) => (f.name ?? '').trim())
        .filter(Boolean);
    } catch {
      /* nothing authored for this topic at all */
    }
  }

  if (options.length === 0) return null;

  const shown = options.slice(0, MAX_OPTIONS);
  const more = options.length - shown.length;

  return (
    `ב${t} אני יכול לעבור איתך על:\n\n` +
    shown.map((o) => `· ${o}`).join('\n') +
    (more > 0 ? `\n\nועוד ${more}.` : '') +
    // ⚠️ ENDS ON THE QUESTION. The codebase's own rule for a Topic Card — "a
    // card that ends in a full stop ends the conversation" — and the first
    // version of this closed with "אפשר גם פשוט לכתוב לי מה לא ברור." instead,
    // which is friendlier and stops the student dead.
    `\n\nאפשר לבחור מהרשימה, ואפשר פשוט לכתוב לי מה לא ברור. על מה נתחיל?`
  );
}
