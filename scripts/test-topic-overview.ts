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

import { topicOverview, chooseTopicPrompt } from '../lib/topic-overview';
import { isVagueAsk } from '../lib/resolve-topic';
import { readFileSync } from 'node:fs';
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

  console.log('\n=== the app\'s own idle button is answered without the model ===\n');
  {
    // ⚠️ READ OUT OF THE COMPONENT, not retyped here. IDLE_PROMPTS is what the
    // student actually taps; a test that hardcodes its own copy of the string
    // passes forever while the button says something else and bills for it.
    const src = readFileSync('components/tutor/TutorBubble.tsx', 'utf8');
    const line = src.match(/const IDLE_PROMPTS = \[([^\]]*)\]/)?.[1] ?? '';
    const prompts = [...line.matchAll(/'([^']+)'/g)].map((m) => m[1]);
    ok(prompts.length === 2, `found the app's idle prompts (${prompts.length})`);
    // The first is lib/tutor-plan-answer's; only the second is ours.
    ok(isVagueAsk(prompts[1] ?? ''), `the button "${prompts[1]}" is matched`);

    for (const msg of ['תסביר לי משהו מהחומר', 'תסביר לי משהו', 'תלמד אותי משהו', 'משהו מהחומר']) {
      ok(isVagueAsk(msg), `"${msg}" → local`);
    }
    // ⚠️ THE ANCHOR. Once a topic is named the message is no longer vague, and
    // answering it with a menu of topics ignores what the student just said.
    for (const msg of ['תסביר לי משהו מהחומר על הסתברות', 'תסביר לי מה זה הסתברות מותנית', 'תסביר']) {
      ok(!isVagueAsk(msg), `"${msg}" is NOT vague`);
    }
  }

  console.log('\n=== and the menu it offers leads somewhere free ===\n');
  {
    const menu = chooseTopicPrompt();
    const items = menu.split('\n').filter((l) => l.startsWith('\u00b7 ')).map((l) => l.slice(2).trim());
    ok(items.length === topics.length, `it names all ${topics.length} topics (${items.length})`);
    // ⚠️ THE ROUND TRIP, AND THE ONLY ASSERTION THAT MATTERS. A menu whose
    // items land back on the model is a free reply that buys a paid one.
    const dead: string[] = [];
    for (const it of items) if (!(await topicOverview(it))) dead.push(it);
    ok(dead.length === 0, dead.length === 0 ? 'every item picked back is answered locally' : `dead ends: ${dead.join(', ')}`);
    ok(menu.trim().endsWith('?'), 'it ends by asking, not by listing');
  }

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
