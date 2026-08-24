/**
 * topic-cards.ts — find the authored card that answers a question about the
 * TOPIC, and refuse when none does.
 *
 * ============================================================
 * THE MATCHER IS BORROWED, ON PURPOSE
 * ============================================================
 * `lib/tutor-faq.ts` already holds a Hebrew matcher that was tuned against a
 * held-out corpus: final-letter folding, clitic prefixes, maths synonyms, IDF
 * weighting, a threshold AND a margin over the runner-up. Writing a second one
 * here would mean re-earning all of that, and the two would drift.
 *
 * A card's `aliases` are exactly the shape that matcher indexes — one entry,
 * many phrasings — so the cards are fed to it as if they were FAQ entries.
 *
 * ============================================================
 * WHAT A CARD MAY AND MAY NOT ANSWER
 * ============================================================
 * A card is a general answer, and that is correct ONLY for a question about
 * the topic. `next_step`, `why_this_step` and `what_to_do_here` are questions
 * about the exercise, and a card served for one of them would be the exact
 * failure the cross-question reuse measurement exists to prevent: something
 * true, about something else. The caller enforces this; the guard here is a
 * second lock on the same door.
 */

import { buildCorpusIdf, buildFaqIndex, matchFaq } from '@/lib/tutor-faq';
import type { TopicCard } from '@/content/topic-cards/types';
import type { CanonicalIntent } from '@/lib/tutor-intent';

/**
 * ⚠️ Higher than the FAQ's own threshold (0.5), and deliberately.
 *
 * Inside one question's FAQ the candidates are ten entries about the same
 * exercise, so a near miss is still nearly right. Here the candidates are
 * fifteen DIFFERENT IDEAS, and a near miss means handing a student the card on
 * disjoint events when they asked about independence — two ideas the content
 * itself describes as opposites.
 */
export const CARD_THRESHOLD = 0.62;

/**
 * The intents a topic card is allowed to answer.
 *
 * Everything absent from this list is a question about the exercise, and a
 * general card is the wrong answer to it however well it scores.
 */
const CARD_INTENTS = new Set<CanonicalIntent>([
  // The one that NAMES its subject, and the reason the cards exist.
  'concept',
  'how_it_works',
  'explain',
  'give_table',
  'didnt_understand',
]);

export function cardCanAnswer(intent: CanonicalIntent | null): boolean {
  return intent !== null && CARD_INTENTS.has(intent);
}

export type CardMatch = { card: TopicCard; score: number };

/** Punctuation out, final letters folded, spaces collapsed. Just enough for
 *  two spellings of the same sentence to compare equal — no stopwords removed,
 *  because here the small words are the distinction. */
function canonicalizeForCards(s: string): string {
  return String(s ?? '')
    .replace(/[?!.,:;"'`׳״()[\]{}]/g, ' ')
    .replace(/[ךםןףץ]/g, (c) => ({ ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' })[c] ?? c)
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cards keyed by topic, loaded once. */
const banks = new Map<string, TopicCard[]>();

export async function loadTopicCards(topic: string): Promise<TopicCard[]> {
  if (banks.has(topic)) return banks.get(topic)!;
  let cards: TopicCard[] = [];
  try {
    if (topic === 'הסתברות') {
      cards = (await import('@/content/topic-cards/math5/probability')).default;
    }
  } catch {
    cards = [];
  }
  const approved = cards.filter((c) => c.approved);
  banks.set(topic, approved);
  return approved;
}

/**
 * The card for this message, or null.
 *
 * Null is the common and correct outcome: fifteen cards cannot cover a
 * subject, and a matcher that always finds something is a matcher that is
 * guessing.
 */
export async function matchTopicCard(
  message: string,
  topic: string,
  intent: CanonicalIntent | null,
): Promise<CardMatch | null> {
  if (!cardCanAnswer(intent)) return null;
  const cards = await loadTopicCards(topic);
  if (cards.length === 0) return null;

  // ---- exact alias first -------------------------------------------
  //
  // ⚠️ The borrowed matcher's stopword list was tuned for a per-question FAQ,
  // where the candidates all concern one exercise and the frame words carry no
  // information. Here they DO: `וגם` is a stopword there and is the entire
  // distinction between two cards here, and `מה זה בלי החזרה` reduces to a
  // single content token, below the two-token floor.
  //
  // Measured: four of six card phrasings matched, and the two that missed were
  // verbatim aliases. An authored alias matching word for word is not a guess,
  // so it does not go through a scorer at all.
  const asked = canonicalizeForCards(message);
  if (asked) {
    for (const c of cards) {
      if (c.aliases.some((a) => canonicalizeForCards(a) === asked)) {
        return { card: c, score: 1 };
      }
    }
  }

  // Shaped as FAQ entries so the tuned matcher can index them unchanged.
  const asFaq = cards.map((c) => ({
    id: c.id,
    kind: 'concept' as const,
    q: c.aliases[0] ?? c.id,
    alts: c.aliases.slice(1),
    a: c.shortExplanation,
  }));
  const idf = buildCorpusIdf(asFaq.flatMap((f) => [f.q, ...f.alts]));
  const hit = matchFaq(buildFaqIndex(asFaq, { idf }), message, {
    threshold: CARD_THRESHOLD,
    minContentMatches: 2,
  });
  if (!hit) return null;
  const card = cards.find((c) => c.id === hit.faq.id);
  return card ? { card, score: hit.score } : null;
}

/**
 * A card rendered as one tutor turn.
 *
 * The five fields are one small lesson in a fixed order, and the order is the
 * teaching: what it is, the rule, a number, the trap, and the turn handed
 * back. Opening on Hebrew because the bubble is `unicodeBidi: 'plaintext'`,
 * and a paragraph that opens on a maths island flips the whole line to LTR.
 */
export function renderTopicCard(card: TopicCard): string {
  return [
    card.shortExplanation,
    `**הכלל:** ${card.formulaOrRule}`,
    `**דוגמה קצרה:** ${card.microExample}`,
    `**הטעות הנפוצה:** ${card.commonMistake}`,
    card.followUpQuestion,
  ].join('\n\n');
}
