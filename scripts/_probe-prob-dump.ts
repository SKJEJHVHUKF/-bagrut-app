// Probe: every הסתברות track question, grouped by stage and rung, so the new
// ones can be calibrated against the CURRENT ceiling rather than guessed.
// Run: npx tsx scripts/_probe-prob-dump.ts [stageId]
import { getLesson } from '../content/lessons';

const TOPIC = 'הסתברות';
const only = process.argv[2];
const L = getLesson('math5', TOPIC)!;
const STAGES = ['pr-basics', 'pr-tree', 'pr-tables', 'pr-bernoulli', 'pr-conditional', 'pr-practice'];

for (const st of L.subTopics ?? []) {
  if (!STAGES.includes(st.id)) continue;
  if (only && st.id !== only) continue;
  console.log(`\n${'='.repeat(80)}\n## ${st.id} — ${st.title}`);
  console.log(`${st.tagline ?? ''}`);
  console.log(`teach steps: ${(st.lesson ?? []).map((s) => s.title).join(' · ')}`);
  for (const d of ['easy', 'mid', 'hard'] as const) {
    console.log(`\n--- ${d} ---`);
    for (const q of (st.questions ?? []).filter((x) => x.difficulty === d)) {
      console.log(`[${q.kind}] ${q.id}  (${q.solution?.steps?.length ?? 0} steps)`);
      console.log(`   Q: ${q.question.replace(/\n/g, ' ')}`);
      if (q.answers) console.log(`   options: ${q.answers.join('  |  ')}`);
      console.log(`   A: ${q.solution?.finalAnswer ?? ''}`);
    }
  }
}
