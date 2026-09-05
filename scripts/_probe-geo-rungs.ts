import { buildSubTopicLevels } from '../lib/roadmap-levels';
import { math5EuclideanGeometry as G } from '../content/lessons/math5/euclidean-geometry';

const TOPIC = 'גיאומטריה אוקלידית';
let spanning = 0, subs = 0;
for (const st of G.subTopics ?? []) {
  const levels = buildSubTopicLevels('math5', TOPIC, st);
  const drill = levels.filter((l) => ['easy','mid','hard'].includes(l.kind));
  const tplByRung = new Map<string, Set<string>>();
  console.log(`\n### ${st.id}`);
  for (const l of drill) {
    const gen = l.questions.filter((q) => q.id.startsWith('gen:'));
    const tpls = new Set(gen.map((q) => q.id.split(':')[1]));
    tplByRung.set(l.kind, tpls);
    console.log(`  ${l.title.padEnd(6)} (${l.kind}) authored=${l.questions.length - gen.length} generated=${gen.length} [${[...tpls].join(', ')}]`);
  }
  subs++;
  const seen = new Map<string, string>();
  for (const [kind, tpls] of tplByRung)
    for (const t of tpls) {
      if (seen.has(t)) { console.log(`  ⚠️ TEMPLATE SPANS RUNGS: ${t} in ${seen.get(t)} and ${kind}`); spanning++; }
      else seen.set(t, kind);
    }
}
console.log(`\n=== ${subs} sub-topics, ${spanning} templates spanning two rungs ===`);
