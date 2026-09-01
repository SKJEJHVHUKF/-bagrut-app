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
 * list of questions this app can already answer for free. So a bare topic name
 * comes back as a short menu of them, and every item the student then picks is
 * another local answer. A dead end becomes a fork with free branches.
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
 * The first alias is the phrasing the card was written to answer, so it is
 * both the shortest label and one that is guaranteed to hit the card if the
 * student sends it back. Trimmed of a leading "מה זה" so the menu reads as a
 * list of subjects rather than a list of questions.
 */
function label(alias: string): string {
  return alias
    // ⚠️ ONLY "מה זה". Stripping "איך" as well turned "איך קוראים עץ הסתברות"
    // into "קוראים עץ הסתברות" — a fragment, in a list a student is meant to
    // read at a glance. A list item may be a question; it may not be a broken
    // one.
    .replace(/^\s*(?:מה\s*זה|מה\s*זו)\s*/, '')
    .trim();
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
