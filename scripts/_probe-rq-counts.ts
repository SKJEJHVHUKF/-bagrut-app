// Throwaway: how many questions sit on each rung of each מנה ושורש stage,
// and what shape they are (mcq/open, hint, expected, wrongAnswers, figures).
// Run: npx tsx scripts/_probe-rq-counts.ts
import { getSubTopic } from '../content/lessons';

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

let total = 0;
const tally = { easy: 0, mid: 0, hard: 0, mcq: 0, open: 0, hint: 0, exp: 0, wrong: 0, dist: 0, fig: 0 };
for (const id of STAGES) {
  const st = getSubTopic('math5', TOPIC, id);
  if (!st) continue;
  const qs = st.questions ?? [];
  total += qs.length;
  const c = (d: string) => qs.filter((q) => q.difficulty === d).length;
  const k = (x: string) => qs.filter((q) => q.kind === x).length;
  tally.easy += c('easy'); tally.mid += c('mid'); tally.hard += c('hard');
  tally.mcq += k('mcq'); tally.open += k('open');
  tally.hint += qs.filter((q) => q.hint).length;
  tally.exp += qs.filter((q) => q.expected).length;
  tally.wrong += qs.filter((q) => q.wrongAnswers?.length).length;
  tally.dist += qs.filter((q) => q.distractorNotes?.length).length;
  tally.fig += qs.filter((q) => q.solution.diagrams?.length).length;
  console.log(
    `${id.padEnd(20)} total ${String(qs.length).padStart(2)} | easy ${c('easy')} mid ${c('mid')} hard ${c('hard')} | ` +
      `mcq ${k('mcq')} open ${k('open')} | hint ${qs.filter((q) => q.hint).length} ` +
      `expected ${qs.filter((q) => q.expected).length} wrongAns ${qs.filter((q) => q.wrongAnswers?.length).length} ` +
      `distrNotes ${qs.filter((q) => q.distractorNotes?.length).length} solFig ${qs.filter((q) => q.solution.diagrams?.length).length}`,
  );
}
console.log(`\nTOTAL ${total} questions`, tally);
