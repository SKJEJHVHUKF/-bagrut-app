/**
 * test-topic-overview.ts — a bare topic name gets an answer, from every topic.
 *
 *   npx tsx scripts/test-topic-overview.ts
 *
 * FREE. Content plus one pure function.
 *
 * The message this covers is "הסתברות" — one word, sent straight after the
 * tutor asked which topic the student is on. Four of them in one measured
 * session, every one a model call, because the fifteen authored probability
 * cards cover the ideas INSIDE probability and none covers probability itself.
 *
 * ⚠️ THE ASSERTION THAT MATTERS IS COVERAGE ACROSS ALL FIFTEEN TOPICS. Two have
 * cards. If this only worked for those, it would answer the two topics a
 * student is least likely to be lost in and leave the other thirteen paying.
 */

import { topicOverview } from '../lib/topic-overview';
import { MATH5_CURRICULUM } from '../content/bagrut-curriculum';

let failed = 0;
const ok = (cond: boolean, name: string) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  x   ${name}`); }
};

(async () => {
  console.log('\n=== every topic in the curriculum answers a bare name ===\n');
  const topics = MATH5_CURRICULUM.map((t) => String((t as { key?: unknown }).key ?? '')).filter(Boolean);
  const missing: string[] = [];
  for (const t of topics) {
    const out = await topicOverview(t);
    if (!out) missing.push(t);
  }
  ok(
    missing.length === 0,
    missing.length === 0
      ? `all ${topics.length} topics have something authored to say`
      : `no overview for: ${missing.join(', ')}`,
  );

  console.log('\n=== and what it says is usable ===\n');
  const prob = await topicOverview('הסתברות');
  ok(!!prob && prob.includes('הסתברות'), 'it names the topic');
  ok(!!prob && prob.split('\n').filter((l) => l.startsWith('· ')).length >= 3, 'it offers at least three things to pick');
  // ⚠️ A CARD ALIAS, VERBATIM-ENOUGH TO COME BACK AND HIT THE CARD. The menu is
  // only worth anything if picking an item lands on a free answer.
  ok(!!prob && /מותנית|החזרה|משלים/.test(prob), 'the options are the app\'s own card subjects');
  ok(!!prob && prob.trim().endsWith('?'), 'it ends by asking, not by listing');
  // A wall of LaTeX is what the lesson summary would have produced, and is the
  // reason this does not use it.
  ok(!!prob && (prob.match(/\$/g) ?? []).length <= 2, 'it is not a formula sheet');

  console.log('\n=== and it refuses when there is nothing authored ===\n');
  ok((await topicOverview('')) === null, 'no topic → null');
  ok((await topicOverview('ביולוגיה')) === null, 'a topic this app does not teach → null');

  console.log(
    failed === 0
      ? '\nOK topic overview: a named topic always has a local answer\n'
      : `\nFAILED: ${failed}\n`,
  );
  process.exitCode = failed === 0 ? 0 : 1;
})();
