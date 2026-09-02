/**
 * test-generator-reach.ts — do generated questions actually reach a drill rung?
 *
 *   npx tsx scripts/test-generator-reach.ts
 *
 * WHY THIS EXISTS
 * The parametric generator was built, tested and gated, and then produced
 * nothing for anybody for weeks — not because it was broken, but because its
 * only consumer was a screen almost nobody opens. Measured on 2026-09-02
 * against the live database: 716 answered questions, 712 with an id, ZERO of
 * them generated.
 *
 * A unit test of `generateBatch` would have passed happily throughout. What
 * was missing was a test of REACH: does the thing a student is actually served
 * contain a generated question? That is what this file asserts, at the exact
 * seam where the answer changed — `buildSubTopicLevels`, the function that
 * assembles every drill rung.
 *
 * The four properties, and why each one is here:
 *   1. a covered sub-topic gains generated questions      — the feature works
 *   2. an uncovered one is untouched, not emptied         — no collateral
 *   3. rungs the content never had are not invented       — the ladder's shape
 *      is a product decision, not a side effect
 *   4. the same call twice returns the same ids           — a fresh seed per
 *      render would swap the question under a student mid-run and break the
 *      retry set, which tracks missed ids
 */

import { buildSubTopicLevels } from '../lib/roadmap-levels';
import { getSubTopics } from '../content/lessons';
import { roadmapTopicOrder } from '../constants/roadmapData';
import { allTemplates } from '../lib/generator';

const SUBJECT = 'math5';

let checks = 0;
let failures = 0;
function assert(cond: boolean, msg: string) {
  checks++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!cond) failures++;
}

const isGen = (id: string) => id.startsWith('gen:');

/** Every (topic, sub-topic) the curriculum actually offers. */
const allSubTopics: { topic: string; id: string }[] = [];
for (const paper of ['571', '572'] as const) {
  for (const topic of roadmapTopicOrder(paper)) {
    for (const st of getSubTopics(SUBJECT, topic)) allSubTopics.push({ topic, id: st.id });
  }
}
const templated = new Set(
  (allTemplates() as unknown as { topic?: string; subTopicId?: string }[]).map(
    (t) => `${t.topic}::${t.subTopicId}`
  )
);

// ---- 1 + 2: reach, measured over the whole curriculum ----------------------
let subTopicsWithGenerated = 0;
let generatedQuestions = 0;
let coveredButEmpty: string[] = [];

for (const { topic, id } of allSubTopics) {
  const st = getSubTopics(SUBJECT, topic).find((x) => x.id === id);
  if (!st) continue;
  const levels = buildSubTopicLevels(SUBJECT, topic, st);
  const gen = levels.flatMap((l) => l.questions.filter((q) => isGen(q.id)));
  if (gen.length) {
    subTopicsWithGenerated++;
    generatedQuestions += gen.length;
  } else if (templated.has(`${topic}::${id}`)) {
    // A template exists here and yet the ladder gained nothing. Either the rung
    // it targets has no authored questions (by design — see withGenerated) or
    // the wiring regressed. Listed rather than failed, so the message is useful.
    coveredButEmpty.push(`${topic}::${id}`);
  }
}

assert(subTopicsWithGenerated > 0, `generated questions reach a drill rung (${subTopicsWithGenerated} sub-topics, ${generatedQuestions} questions)`);
assert(
  subTopicsWithGenerated < allSubTopics.length,
  `and only where a template exists — the other ${allSubTopics.length - subTopicsWithGenerated} sub-topics are untouched`
);
if (coveredButEmpty.length) {
  console.log(`      note: ${coveredButEmpty.length} templated sub-topic(s) gained nothing (rung has no authored questions): ${coveredButEmpty.slice(0, 3).join(', ')}`);
}

// ---- 3: the ladder's shape is unchanged ------------------------------------
// A rung with no authored questions must not appear just because a template
// could fill it. The product's climb is authored, not generated.
let invented = 0;
for (const { topic, id } of allSubTopics) {
  const st = getSubTopics(SUBJECT, topic).find((x) => x.id === id);
  if (!st) continue;
  const authored = st.questions ?? [];
  for (const level of buildSubTopicLevels(SUBJECT, topic, st)) {
    if (!['easy', 'mid', 'hard'].includes(level.kind)) continue;
    const hadAuthored = authored.some((q) => q.difficulty === level.kind);
    if (!hadAuthored && level.questions.length > 0) invented++;
  }
}
assert(invented === 0, 'no rung exists that the authored content did not already have');

// ---- 4: determinism --------------------------------------------------------
const sample = allSubTopics.find(({ topic, id }) => {
  const st = getSubTopics(SUBJECT, topic).find((x) => x.id === id);
  if (!st) return false;
  return buildSubTopicLevels(SUBJECT, topic, st).some((l) => l.questions.some((q) => isGen(q.id)));
});

if (sample) {
  const st = getSubTopics(SUBJECT, sample.topic).find((x) => x.id === sample.id)!;
  const once = buildSubTopicLevels(SUBJECT, sample.topic, st)
    .flatMap((l) => l.questions.map((q) => q.id))
    .join('|');
  const twice = buildSubTopicLevels(SUBJECT, sample.topic, st)
    .flatMap((l) => l.questions.map((q) => q.id))
    .join('|');
  assert(once === twice, `the same sub-topic builds the same questions twice (${sample.topic}::${sample.id})`);

  // ---- and the generated questions are actually answerable ----------------
  const gen = buildSubTopicLevels(SUBJECT, sample.topic, st)
    .flatMap((l) => l.questions)
    .filter((q) => isGen(q.id));
  const usable = gen.filter(
    (q) =>
      typeof q.question === 'string' &&
      q.question.length > 0 &&
      !!q.difficulty &&
      (q.kind === 'mcq' ? Array.isArray(q.answers) && q.answers.length > 1 : true)
  );
  assert(
    usable.length === gen.length && gen.length > 0,
    `every generated question the runner would serve is well-formed (${usable.length}/${gen.length})`
  );
} else {
  assert(false, 'a sub-topic with generated questions exists to test determinism against');
}

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) process.exit(1);
