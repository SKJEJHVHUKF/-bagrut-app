// Run the REAL ladder builder over the five בעיות קיצון stages and print what a
// student actually gets on each rung. Every other gate in this repo says "0
// errors", which only means nothing it examined failed; this one proves the
// content reaches the UI. On the previous track it was the ONLY check that
// caught a stage whose 🌱 חימום rung silently did not exist, because the stage
// had no `easy` questions — tsc and five gates were green at the time.
//
// It also asserts the track topic holds exactly these five tiles in the owner's
// order and nothing else (his instruction, 2026-08-30).
//
// Run: npx tsx scripts/_probe-ext-ladder.ts
import { getBagrutQuestions, getSubTopic } from '../content/lessons';
import { buildSubTopicLevels } from '../lib/roadmap-levels';
import { getTrack } from '../content/tracks';
import { leaksAnswer } from '../lib/help-ladder';

const TOPIC = 'חשבון דיפרנציאלי';
const STAGES = ['ext-base', 'ext-target', 'ext-extremum', 'ext-substitute', 'ext-bagrut'];

let bad = 0;
for (const id of STAGES) {
  const st = getSubTopic('math5', TOPIC, id);
  if (!st) {
    console.log(`x ${id} — not found`);
    bad++;
    continue;
  }
  const levels = buildSubTopicLevels('math5', TOPIC, st);
  const rungs = levels.map((l) => `${l.emoji}${l.title}`).join(' ');
  const steps = st.lesson?.length ?? 0;
  const drills = (st.lesson ?? []).filter((s) => s.drill).length;
  const figs =
    (st.lesson ?? []).filter((s) => s.diagrams?.length).length +
    (st.lesson ?? []).filter((s) => /```geo|```probtree/.test(s.teach)).length;
  const bag = levels.find((l) => l.kind === 'bagrut')?.bagrut.length ?? 0;
  const by = (d: string) => st.questions.filter((q) => q.difficulty === d).length;
  console.log(
    `${id.padEnd(15)} ${String(steps).padStart(2)} steps · ${drills} drills · ${figs} figs · ` +
      `${by('easy')}/${by('mid')}/${by('hard')} e-m-h · ${bag} bagrut -> ${rungs}`,
  );
  for (const need of ['learn', 'easy', 'mid', 'hard', 'ghost', 'bagrut']) {
    if (!levels.some((l) => l.kind === need)) {
      console.log(`   x missing rung: ${need}`);
      bad++;
    }
  }
}

// ---------------------------------------------------------------------------
// The authoring contract, scoped to these five stages.
//
// verify-rule-lines only REQUIRES the "**הכלל:**" opening on the topics listed
// in its REQUIRE_FULL set, and חשבון דיפרנציאלי is not one of them — the older
// derivative modules predate the rule and would fail the moment it were added.
// So the repo will validate these lines but never notice a missing one here.
// That is exactly the shape of gap that ships: a green gate that was not
// looking at the thing you changed.
// ---------------------------------------------------------------------------
const RULE = '**הכלל:**';
const ids = new Set<string>();
let contract = 0;
const fail = (what: string) => {
  console.log(`   x ${what}`);
  contract++;
};

for (const id of STAGES) {
  const st = getSubTopic('math5', TOPIC, id);
  if (!st) continue;
  const drills = (st.lesson ?? []).map((s) => s.drill).filter((d) => d !== undefined);
  for (const q of [...st.questions, ...drills]) {
    if (ids.has(q.id)) fail(`duplicate question id ${q.id}`);
    ids.add(q.id);
    const step0 = q.solution.steps[0] ?? '';
    if (!step0.includes(RULE)) fail(`${q.id}: solution does not open with ${RULE}`);
    if (leaksAnswer(step0, q.solution.finalAnswer)) fail(`${q.id}: the rule line leaks the answer`);
    if (q.answerLabels && q.expected?.kind === 'set' && q.answerLabels.length !== q.expected.values.length) {
      fail(`${q.id}: ${q.answerLabels.length} answer labels vs ${q.expected.values.length} expected values`);
    }
    if (q.kind === 'mcq' && (q.answers?.length !== 4 || q.correct === undefined)) {
      fail(`${q.id}: an MCQ needs 4 answers and a correct index`);
    }
  }
}

// The owner asked for this term specifically, on the previous track and again here.
for (const id of STAGES) {
  const st = getSubTopic('math5', TOPIC, id);
  if (st && JSON.stringify(st).includes('כלל השרשרת')) {
    fail(`${id}: uses "כלל השרשרת" — the owner asked for "כפול הנגזרת הפנימית"`);
  }
}

for (const b of getBagrutQuestions('math5', TOPIC).filter((q) => STAGES.includes(q.subTopicId ?? ''))) {
  for (const p of b.parts) {
    if (p.hints.length !== 3) fail(`${b.id} part ${p.label}: ${p.hints.length} hints, expected 3`);
  }
}
if (contract > 0) bad += contract;
console.log(`\nauthoring contract: ${contract === 0 ? 'clean' : contract + ' problem(s)'} over ${ids.size} questions`);

const topic = getTrack('571').topics.find((t) => t.id === 'extremum-problems');
if (!topic) {
  console.log('x extremum-problems is not on the 571 track');
  bad++;
} else {
  const ids = topic.tiles.map((t) => ('subId' in t ? t.subId : `[${t.kind}] ${t.title}`));
  console.log(`\ntrack tiles: ${ids.length}`);
  if (ids.join(',') !== STAGES.join(',')) {
    console.log(`   x tiles are not exactly the five levels in order: ${ids.join(', ')}`);
    bad++;
  }
}

console.log(
  bad === 0
    ? '\nOK — five stages, full ladder each, and the track holds only them'
    : `\nFAILED — ${bad} problem(s)`,
);
process.exit(bad === 0 ? 0 : 1);
