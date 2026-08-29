// Throwaway probe: run the REAL ladder builder over the eight מנה ושורש stages
// and print what a student would actually get on each rung. A gate that says
// "0 errors" only means nothing it examined failed — this proves the content
// reaches the UI. It also asserts the track topic holds those eight tiles and
// NOTHING else, which is what the owner asked for (2026-08-29).
// Run: npx tsx scripts/_probe-rq-ladder.ts
import { getSubTopic } from '../content/lessons';
import { buildSubTopicLevels } from '../lib/roadmap-levels';
import { getTrack } from '../content/tracks';

const TOPIC = 'פונקציות';
const STAGES = [
  'rq-domain',
  'rq-intersections',
  'rq-asymptotes',
  'rq-derivative',
  'rq-sketch',
  'rq-transformations',
  'rq-integral',
  'rq-bagrut-mixed',
];

let bad = 0;
for (const id of STAGES) {
  const st = getSubTopic('math5', TOPIC, id);
  if (!st) {
    console.log(`✗ ${id} — not found`);
    bad++;
    continue;
  }
  const levels = buildSubTopicLevels('math5', TOPIC, st);
  const rungs = levels.map((l) => `${l.emoji}${l.title}`).join(' ');
  const steps = st.lesson?.length ?? 0;
  const drills = (st.lesson ?? []).filter((s) => s.drill).length;
  const figs = (st.lesson ?? []).filter((s) => s.diagrams?.length).length;
  const bag = levels.find((l) => l.kind === 'bagrut')?.bagrut.length ?? 0;
  const qs = st.questions.length;
  console.log(
    `${id.padEnd(20)} ${String(steps).padStart(2)} steps · ${drills} drills · ` +
      `${figs} figs · ${String(qs).padStart(2)} questions · ${bag} bagrut → ${rungs}`,
  );
  // The rungs that must exist for the ladder to be a ladder at all.
  for (const need of ['learn', 'easy', 'mid', 'hard', 'ghost', 'bagrut']) {
    if (!levels.some((l) => l.kind === need)) {
      console.log(`   ✗ missing rung: ${need}`);
      bad++;
    }
  }
}

// The track topic must hold these eight and nothing else — no leftover module
// from חשבון דיפרנציאלי / אינטגרלי whose examples are full of sin, cos and e^x.
const topic = getTrack('571').topics.find((t) => t.id === 'functions-rational-root');
if (!topic) {
  console.log('✗ functions-rational-root is not on the 571 track');
  bad++;
} else {
  const ids = topic.tiles.map((t) => ('subId' in t ? t.subId : `[${t.kind}] ${t.title}`));
  const extra = ids.filter((i) => !STAGES.includes(i));
  console.log(`\ntrack tiles: ${ids.length}`);
  if (extra.length) {
    console.log(`   ✗ tiles that are NOT one of the eight levels: ${extra.join(', ')}`);
    bad++;
  }
  if (ids.join(',') !== STAGES.join(',')) {
    console.log(`   ✗ tile order does not match the owner's level order`);
    bad++;
  }
}

console.log(
  bad === 0
    ? '\n✅ eight stages, full ladder each, and the track holds only them'
    : `\n❌ ${bad} problem(s)`,
);
process.exit(bad === 0 ? 0 : 1);
