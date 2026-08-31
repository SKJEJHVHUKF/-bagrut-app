// Run the REAL ladder builder over the new eg-angles stage (רמה 0 בגיאומטריה)
// and over eg-congruence, and print what a student actually gets on each rung.
// Every other gate says "0 errors", which only means nothing it examined failed;
// this one proves the content reaches the UI. On an earlier track it was the
// ONLY check that caught a stage whose 🌱 חימום rung silently did not exist,
// because the stage had no `easy` questions while six gates stayed green.
//
// It also freezes the two corrections the owner asked for on 2026-08-30:
//   · every lesson step in eg-congruence carries a drill (there were none)
//   · nothing in eg-congruence mentions a circle (מעגל is taught at רמה 5)
//
// Run: npx tsx scripts/_probe-geo-angles-ladder.ts
import { getBagrutQuestions, getSubTopic } from '../content/lessons';
import { buildSubTopicLevels } from '../lib/roadmap-levels';
import { getTrack } from '../content/tracks';
import { leaksAnswer } from '../lib/help-ladder';

const TOPIC = 'גיאומטריה אוקלידית';
const STAGES = ['eg-angles', 'eg-congruence'];
/** eg-angles is the first stage of the whole topic and has no ghost replay yet;
 *  ghost is optional in buildSubTopicLevels, so it is not required here. */
const REQUIRED_RUNGS = ['learn', 'easy', 'mid', 'hard', 'bagrut'];

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
    (st.lesson ?? []).filter((s) => /```geo/.test(s.teach)).length;
  const bag = levels.find((l) => l.kind === 'bagrut')?.bagrut.length ?? 0;
  const by = (d: string) => st.questions.filter((q) => q.difficulty === d).length;
  console.log(
    `${id.padEnd(15)} ${String(steps).padStart(2)} steps · ${drills} drills · ${figs} figs · ` +
      `${by('easy')}/${by('mid')}/${by('hard')} e-m-h · ${bag} bagrut -> ${rungs}`,
  );
  for (const need of REQUIRED_RUNGS) {
    if (!levels.some((l) => l.kind === need)) {
      console.log(`   x missing rung: ${need}`);
      bad++;
    }
  }
  // Owner: "אין שם בכלל תרגול" — every taught step must end in a try-it-yourself.
  if (drills !== steps) {
    console.log(`   x ${steps - drills} lesson step(s) without a drill`);
    bad++;
  }
}

// ---------------------------------------------------------------------------
// The authoring contract for these stages.
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

// Owner, 2026-08-30: no circles before רמה 5. A congruence challenge that leans
// on "all radii are equal" tests a tool the student has not been given.
for (const id of STAGES) {
  const st = getSubTopic('math5', TOPIC, id);
  if (!st) continue;
  const blob = JSON.stringify(st);
  if (blob.includes('מעגל') || blob.includes('"circles"') || blob.includes('רדיוס')) {
    fail(`${id}: mentions a circle — מעגל is taught later in the track`);
  }
}

for (const b of getBagrutQuestions('math5', TOPIC).filter((q) => STAGES.includes(q.subTopicId ?? ''))) {
  for (const p of b.parts) {
    if (p.hints.length !== 3) fail(`${b.id} part ${p.label}: ${p.hints.length} hints, expected 3`);
    if (!(p.solution.steps[0] ?? '').includes(RULE)) fail(`${b.id} part ${p.label}: no rule line`);
  }
}
if (contract > 0) bad += contract;
console.log(`\nauthoring contract: ${contract === 0 ? 'clean' : contract + ' problem(s)'} over ${ids.size} questions`);

// eg-angles must be the FIRST tile of the geometry topic on the 571 track.
const topic = getTrack('571').topics.find((t) => t.id === 'geometry');
if (!topic) {
  console.log('x the geometry topic is not on the 571 track');
  bad++;
} else {
  const first = topic.tiles[0];
  const firstId = first && 'subId' in first ? first.subId : '(not a ladder tile)';
  console.log(`\nfirst geometry tile: ${firstId}`);
  if (firstId !== 'eg-angles') {
    console.log('   x eg-angles is not the first tile of the geometry track');
    bad++;
  }
}

console.log(
  bad === 0
    ? '\nOK — full ladder on both stages, a drill on every step, and no circles before רמה 5'
    : `\nFAILED — ${bad} problem(s)`,
);
process.exit(bad === 0 ? 0 : 1);
