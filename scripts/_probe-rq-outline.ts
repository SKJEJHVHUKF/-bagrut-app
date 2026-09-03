// Throwaway: compact outline of the 8 מנה ושורש stages — what each teaches and
// what its existing questions already cover — so new questions extend rather
// than repeat. Run: npx tsx scripts/_probe-rq-outline.ts
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

for (const id of STAGES) {
  const st = getSubTopic('math5', TOPIC, id);
  if (!st) continue;
  console.log(`\n${'='.repeat(78)}\n## ${id} — ${st.title}\n${st.tagline ?? ''}`);
  console.log(`keyPoints:`);
  for (const k of st.keyPoints ?? []) console.log(`  - ${k}`);
  console.log(`lesson steps:`);
  for (const s of st.lesson ?? []) {
    console.log(`  · ${s.title}`);
    if (s.formulas?.length) for (const f of s.formulas) console.log(`      ƒ ${f.latex ?? f.name}`);
  }
  console.log(`existing questions:`);
  for (const q of st.questions ?? []) {
    console.log(`  [${q.difficulty}/${q.kind}] ${q.id}: ${q.question.replace(/\n/g, ' ').slice(0, 150)}`);
  }
}
