// Probe: the הסתברות track as a student climbs it. Per stage and per rung,
// how many questions there are AND objective proxies for how hard they are —
// solution steps, distinct formulas invoked, whether the question carries a
// parameter, a conditional, a multi-stage setup or a "how many / prove" ask.
// The owner's requirement is that difficulty genuinely RISES with the rung, so
// it has to be measured, not asserted.
// Run: npx tsx scripts/_probe-prob-ladder.ts
import { getLesson } from '../content/lessons';
import { buildSubTopicLevels } from '../lib/roadmap-levels';
import { getTrack } from '../content/tracks';
import type { PracticeQuestion } from '../content/lessons/types';

const TOPIC = 'הסתברות';
const L = getLesson('math5', TOPIC);
if (!L) throw new Error('no lesson');

const topic = getTrack('571').topics.find((t) => t.title === TOPIC);
const tiles = (topic?.tiles ?? []).map((t) => ('subId' in t ? (t as { subId: string }).subId : `[${(t as { kind: string }).kind}]`));
console.log(`track tiles (${tiles.length}): ${tiles.join(' → ')}\n`);

/** Crude but honest difficulty proxies, all derived from the authored content. */
function shape(q: PracticeQuestion) {
  const text = `${q.question} ${(q.solution?.steps ?? []).join(' ')}`;
  return {
    steps: q.solution?.steps?.length ?? 0,
    // a question that needs more than one named rule is doing more work
    rules: new Set(
      [
        /משלים/.test(text) && 'complement',
        /מותנ|בהינתן|בידיעה/.test(text) && 'conditional',
        /בלתי[- ]תלוי|תלויים/.test(text) && 'independence',
        /בינומי|ניסויים חוזרים|בדיוק \$?\d/.test(text) && 'binomial',
        /עץ|ענף/.test(text) && 'tree',
        /טבלה|דו[- ]ממדית/.test(text) && 'table',
        /תוחלת/.test(text) && 'expectation',
        /צירופ|עצרת|\\binom/.test(text) && 'combinatorics',
        /בלי החזרה|ללא החזרה/.test(text) && 'no-replacement',
        /לפחות|לכל היותר/.test(text) && 'at-least',
      ].filter(Boolean) as string[],
    ).size,
    param: /פרמטר|\bp\b|נסמן|משתנה/.test(q.question) ? 1 : 0,
    ask: /כמה|מצא את מספר/.test(q.question) ? 'count'
      : /הוכח|נמק|הסבר מדוע|האם/.test(q.question) ? 'justify'
      : /חשב|מצא|מהי|מהו/.test(q.question) ? 'compute' : 'other',
    gradable: q.expected && (q.expected as { kind: string }).kind !== 'manual' ? 1 : 0,
  };
}

let total = 0;
const perRung: Record<string, { n: number; steps: number[]; rules: number[] }> = {};
for (const st of L.subTopics ?? []) {
  const levels = buildSubTopicLevels('math5', TOPIC, st);
  const qs = st.questions ?? [];
  total += qs.length;
  const onTrack = tiles.includes(st.id) ? '★' : ' ';
  const byDiff = (d: string) => qs.filter((q) => q.difficulty === d);
  const line = (['easy', 'mid', 'hard'] as const).map((d) => {
    const g = byDiff(d);
    if (!g.length) return `${d} —`;
    const sh = g.map(shape);
    const avg = (xs: number[]) => (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1);
    perRung[d] ??= { n: 0, steps: [], rules: [] };
    perRung[d].n += g.length;
    perRung[d].steps.push(...sh.map((s) => s.steps));
    perRung[d].rules.push(...sh.map((s) => s.rules));
    return `${d} ${String(g.length).padStart(2)} (${avg(sh.map((s) => s.steps))} steps, ${avg(sh.map((s) => s.rules))} rules)`;
  }).join(' | ');
  const rungs = levels.map((l) => l.emoji).join('');
  console.log(`${onTrack} ${st.id.padEnd(22)} ${String(qs.length).padStart(2)}q  ${line}   ${rungs}`);
}

console.log(`\nTOTAL ${total} questions in ${(L.subTopics ?? []).length} sub-topics`);
console.log('\n--- does difficulty actually rise with the rung? ---');
const avg = (xs: number[]) => (xs.reduce((a, b) => a + b, 0) / xs.length);
for (const d of ['easy', 'mid', 'hard'] as const) {
  const p = perRung[d];
  if (!p) continue;
  console.log(`${d.padEnd(5)} n=${String(p.n).padStart(3)}  avg steps ${avg(p.steps).toFixed(2)}  avg rules ${avg(p.rules).toFixed(2)}`);
}
console.log('\nlesson-level questions (not on any rung):', (L.questions ?? []).length);
console.log('bagrut questions:', (L.bagrutQuestions ?? []).length);
