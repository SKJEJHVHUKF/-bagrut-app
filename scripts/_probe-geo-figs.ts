import { math5EuclideanGeometry as G } from '../content/lessons/math5/euclidean-geometry';
import { getBagrutQuestionsForSubTopic } from '../content/lessons';
const st = G.subTopics.find((s) => s.id === 'eg-angles')!;
const has = (s?: string) => (s && s.includes('```geo') ? 'FIG ' : '--- ');
console.log('== lesson steps (teach) ==');
(st.lesson ?? []).forEach((l, i) => {
  console.log(` ${has(l.teach)} step${i} "${l.title}"`);
  if (l.example) console.log(`   ${has(l.example.problem)} example`);
  if (l.drill) console.log(`   ${has(l.drill.question)} drill ${l.drill.id}`);
});
console.log('== questions ==');
(st.questions ?? []).forEach((q) => console.log(` ${has(q.question)} ${q.id} [${q.difficulty}] ${q.question.replace(/\n/g,' ').slice(0,70)}`));
console.log('== bagrut ==');
for (const b of getBagrutQuestionsForSubTopic('math5','גיאומטריה אוקלידית','eg-angles'))
  console.log(` ${has(b.context ?? '')} ${b.id} ctx | parts: ${b.parts.map((p:any)=>has(p.question)).join('')}`);
