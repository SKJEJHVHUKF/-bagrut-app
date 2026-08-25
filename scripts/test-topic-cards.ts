/**
 * test-topic-cards.ts — every card is reachable, and none steals another's ask.
 *
 *   npx tsx scripts/test-topic-cards.ts
 *
 * FREE. No model, no network.
 *
 * ============================================================
 * THE TWO FAILURES A CARD BANK HAS
 * ============================================================
 *   UNREACHABLE  a card nobody can get to. Costs a model call per ask and is
 *                invisible: the tutor simply answers as if the card were not
 *                written. Ten cards were written for סדרות and five of the
 *                twelve realistic paraphrases reached none of them until the
 *                short alias forms were added.
 *   THEFT        one card answering another's question. Worse, because it is
 *                confident: a student asking about the ratio gets the card on
 *                the difference and both are true sentences about sequences.
 *
 * Both grow with the bank, which is why this is a gate and not a one-off.
 */

import { loadTopicCards, matchTopicCard } from '../lib/topic-cards';

let failed = 0;
const ok = (cond: boolean, name: string) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  x   ${name}`); }
};

const TOPICS = ['הסתברות', 'סדרות'];

/** Phrasings a student would type that are NOT copied from any alias list. */
const PARAPHRASES: Record<string, Array<[string, string]>> = {
  סדרות: [
    ['מה זאת המנה', 'seq-ratio-q'],
    ['מה זה q', 'seq-ratio-q'],
    ['איך מחשבים את המנה של סדרה', 'seq-ratio-q'],
    ['מה זה אינדקס', 'seq-index-n'],
    ['מה המשמעות של n', 'seq-index-n'],
    ['איך יודעים אם סדרה חשבונית', 'seq-arithmetic-vs-geometric'],
    ['מתי קיים סכום אינסופי', 'seq-infinite-sum'],
    ['למה n לא יכול להיות שבר', 'seq-n-must-be-integer'],
    ['מה זה S של עשר', 'seq-sum-notation'],
    ['מה זה הפרש שלילי', 'seq-difference-d'],
    ['מה זה סדרה יורדת', 'seq-increasing-decreasing'],
    ['מה זה נוסחה רקורסיבית', 'seq-recursive-rule'],
  ],
};

/** Asks that belong to no card at all, in any topic. */
const NEGATIVES = ['רמז', 'מה השלב הבא', 'מה זה נגזרת', 'תראה לי את הפתרון', 'למה טעיתי'];

(async () => {
  for (const topic of TOPICS) {
    const cards = await loadTopicCards(topic);
    console.log(`\n=== ${topic} · ${cards.length} cards ===\n`);
    ok(cards.length > 0, `the bank loads`);

    // ---- every card is reachable by every one of its own aliases ----
    for (const card of cards) {
      let reached = 0;
      for (const alias of card.aliases) {
        const m = await matchTopicCard(alias, topic, 'concept');
        if (m?.card.id === card.id) reached++;
      }
      ok(
        reached === card.aliases.length,
        `${card.id}: all ${card.aliases.length} aliases reach it (${reached})`,
      );
    }

    // ---- no two cards claim the same alias ----
    const seen = new Map<string, string>();
    for (const card of cards) {
      for (const alias of card.aliases) {
        const owner = seen.get(alias);
        if (owner && owner !== card.id) {
          failed++;
          console.log(`  x   "${alias}" is claimed by both ${owner} and ${card.id}`);
        }
        seen.set(alias, card.id);
      }
    }
    ok(true, `no alias is claimed twice (${seen.size} distinct aliases)`);

    // ---- real paraphrases, which is the harder half ----
    for (const [probe, want] of PARAPHRASES[topic] ?? []) {
      const m = await matchTopicCard(probe, topic, 'concept');
      ok(m?.card.id === want, `"${probe}" → ${want}${m?.card.id === want ? '' : ` (got ${m?.card.id ?? 'nothing'})`}`);
    }

    // ---- and the asks no card may answer ----
    for (const probe of NEGATIVES) {
      const m = await matchTopicCard(probe, topic, 'concept');
      ok(m === null, `"${probe}" reaches no card${m ? ` (got ${m.card.id})` : ''}`);
    }

    // ---- an exercise intent must never be served a card ----
    for (const intent of ['next_step', 'why_this_step', 'what_to_do_here'] as const) {
      const m = await matchTopicCard(cards[0]?.aliases[0] ?? 'מה זה', topic, intent);
      ok(m === null, `intent ${intent} is never served a card`);
    }
  }

  console.log(
    failed === 0
      ? '\nOK topic cards: each reachable, none stealing, none serving an exercise ask\n'
      : `\nFAILED: ${failed}\n`,
  );
  process.exit(failed === 0 ? 0 : 1);
})();
