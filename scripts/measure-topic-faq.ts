/**
 * measure-topic-faq.ts — the whole-topic bank, on a screen with no exercise.
 *
 *   npx tsx scripts/measure-topic-faq.ts
 *
 * FREE. Content plus pure functions.
 *
 * ============================================================
 * THE TWO NUMBERS, AND ONLY ONE OF THEM IS GOOD NEWS
 * ============================================================
 * FIRES  — a phrasing the bank answers instead of the model. This is the money.
 * WRONG  — a phrasing answered by an entry from a DIFFERENT unit than the one
 *          it was authored on, where the answer is not actually general.
 *
 * The second is the one that decides. `answerFromFaq` stage 2 rejected a
 * topic-wide pool at 26.8% fires / 5.6% unsafe, because a student looking at an
 * exercise who is told about a different one stops trusting the tutor. This
 * measures the same widening on the screen where there IS no exercise — and it
 * has to clear the same bar to ship.
 *
 * The corpus is the bank's own phrasings, which were authored as CONTENT and
 * not tuned to this matcher, so they are a fair test of it.
 */

import { answerTopicFaq } from '../lib/tutor-faq';
import type { TutorFaqBank } from '../content/tutor-faq/types';

const TOPICS = ['probability', 'sequences', 'trigonometry', 'geometry'];
const HEB: Record<string, string> = {
  probability: 'הסתברות',
  sequences: 'סדרות',
  trigonometry: 'טריגונומטריה',
  geometry: 'גיאומטריה אוקלידית',
};

(async () => {
  console.log('\ntopic-wide FAQ, with NO exercise on screen\n');
  console.log('topic            asked   fired    %      from another unit   its own');

  let allAsked = 0;
  let allFired = 0;
  let allForeign = 0;

  for (const key of TOPICS) {
    let bank: TutorFaqBank;
    try {
      bank = (await import(`../content/tutor-faq/math5/${key}`)).default as TutorFaqBank;
    } catch {
      continue;
    }
    const topic = HEB[key];

    // Only the kinds this path can serve — asking it about a `where-from`
    // phrasing and calling the refusal a miss would measure nothing.
    const asks: Array<{ text: string; unit: string }> = [];
    for (const [unit, list] of Object.entries(bank)) {
      for (const f of list) {
        if (!['concept', 'mistake', 'check'].includes(f.kind)) continue;
        asks.push({ text: f.q, unit });
        for (const alt of f.alts.slice(0, 2)) asks.push({ text: alt, unit });
      }
    }
    if (!asks.length) continue;

    let fired = 0;
    let foreign = 0;
    for (const a of asks) {
      const hit = await answerTopicFaq(a.text, topic);
      if (!hit) continue;
      fired++;
      // The id is `<unit>#<n>`; a hit from another unit is the widening at work.
      const from = String(hit.faqId).split('#')[0];
      if (from !== a.unit) foreign++;
    }
    allAsked += asks.length;
    allFired += fired;
    allForeign += foreign;
    console.log(
      `  ${topic.padEnd(16)} ${String(asks.length).padStart(5)} ${String(fired).padStart(7)}` +
        `  ${((fired / asks.length) * 100).toFixed(1).padStart(5)}%` +
        `  ${String(foreign).padStart(12)}      ${String(fired - foreign).padStart(6)}`,
    );
  }

  // ---- and the pool Itay asked for: EVERY bank, no topic named ----
  //
  // WARNING: THIS IS THE NUMBER THAT DECIDES, not the reach. With one bank a
  // wrong hit is at least about the right subject. With four banks pooled, a
  // question about sequences can be answered from the trigonometry bank, and
  // that is a confident answer about the wrong mathematics — the failure this
  // whole layer is fenced against.
  console.log('\n\nALL BANKS AT ONCE — the pool when the message names no topic\n');
  console.log('topic            asked   fired    %     answered from ANOTHER TOPIC');
  let wideAsked = 0;
  let wideFired = 0;
  let wideWrongTopic = 0;
  for (const key of TOPICS) {
    let bank: TutorFaqBank;
    try {
      bank = (await import(`../content/tutor-faq/math5/${key}`)).default as TutorFaqBank;
    } catch {
      continue;
    }
    const topic = HEB[key];
    const asks: string[] = [];
    for (const list of Object.values(bank)) {
      for (const f of list) {
        if (!['concept', 'mistake', 'check'].includes(f.kind)) continue;
        asks.push(f.q);
      }
    }
    if (!asks.length) continue;

    // The id prefix identifies the bank an entry was authored in.
    const ownPrefixes = new Set(Object.keys(bank).map((u) => u.split('-')[0]));
    let fired = 0;
    let wrongTopic = 0;
    for (const text of asks) {
      const hit = await answerTopicFaq(text, null);
      if (!hit) continue;
      fired++;
      const prefix = String(hit.faqId).split('-')[0];
      if (!ownPrefixes.has(prefix)) wrongTopic++;
    }
    wideAsked += asks.length;
    wideFired += fired;
    wideWrongTopic += wrongTopic;
    console.log(
      `  ${topic.padEnd(16)} ${String(asks.length).padStart(5)} ${String(fired).padStart(7)}` +
        `  ${((fired / asks.length) * 100).toFixed(1).padStart(5)}%` +
        `  ${String(wrongTopic).padStart(20)}`,
    );
  }
  console.log(
    `\n  ${wideFired} of ${wideAsked} answered with no model call ` +
      `(${((wideFired / Math.max(1, wideAsked)) * 100).toFixed(1)}%), ` +
      `${wideWrongTopic} of them from the WRONG TOPIC ` +
      `(${((wideWrongTopic / Math.max(1, wideFired)) * 100).toFixed(1)}% of hits).`,
  );
  console.log('  The sub-topic fence was rejected at 5.6% wrong. That is the bar.\n');

  console.log(
    `\n  ${allFired} of ${allAsked} phrasings answered without the model ` +
      `(${((allFired / Math.max(1, allAsked)) * 100).toFixed(1)}%).`,
  );
  console.log(
    `  ${allForeign} of those came from a different unit than they were authored on ` +
      `(${((allForeign / Math.max(1, allFired)) * 100).toFixed(1)}% of hits).`,
  );
  console.log('\n  ⚠️ A cross-unit hit is NOT automatically wrong here — that is the whole');
  console.log('  point of a topic-wide pool, and every entry in it is a concept/mistake/');
  console.log('  check answer with no exercise-specific wording (BOUND_TO_ITS_EXERCISE');
  console.log('  drops those). It is reported because it is the number that would have');
  console.log('  been dangerous WITH an exercise on screen, and the reader deserves to');
  console.log('  see it rather than be told it does not matter.\n');
})();
