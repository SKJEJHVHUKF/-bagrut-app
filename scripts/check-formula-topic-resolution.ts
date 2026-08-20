// One-shot check for FormulaSheet's roadmap topic resolution: every roadmap
// sub-topic id and every track topic must resolve to a lesson topic that the
// formula drawer actually lists (i.e. a registered lesson; warn when that
// lesson has no formulas — the drawer hides those topics).
// Run: npx tsx scripts/check-formula-topic-resolution.ts

import { resolveRoadmapNode, allRoadmapNodes } from '@/constants/roadmapData';
import { getTrack } from '@/content/tracks';
import { getLesson } from '@/content/lessons';
import type { BagrutPaper } from '@/content/bagrut-curriculum';

const PAPERS: BagrutPaper[] = ['571', '572'];
let fail = 0;

function lessonFormulaCount(topic: string): number | null {
  const lesson = getLesson('math5', topic);
  if (!lesson) return null;
  const seen = new Set<string>();
  lesson.formulas?.forEach((f) => seen.add(f.latex.trim()));
  lesson.subTopics?.forEach((st) => st.formulas?.forEach((f) => seen.add(f.latex.trim())));
  return seen.size;
}

// 1. /roadmap/<subId> — every ladder node resolves to a listed lesson topic.
const subIds = new Set<string>();
for (const paper of PAPERS) {
  for (const n of allRoadmapNodes(paper)) subIds.add(n.subId);
}
for (const subId of subIds) {
  const r = resolveRoadmapNode(subId);
  if (!r) {
    console.error(`FAIL /roadmap/${subId}: resolveRoadmapNode returned null`);
    fail++;
    continue;
  }
  const count = lessonFormulaCount(r.topic);
  if (count === null) {
    console.error(`FAIL /roadmap/${subId}: topic "${r.topic}" has no registered lesson`);
    fail++;
  } else if (count === 0) {
    console.warn(`warn /roadmap/${subId}: topic "${r.topic}" has 0 formulas (hidden in drawer)`);
  }
}
console.log(`checked ${subIds.size} roadmap sub-topic ids`);

// 2. /roadmap/track/<paper>/<topicId> — first ladder tile resolves the same way.
for (const paper of PAPERS) {
  for (const t of getTrack(paper).topics) {
    const tile = t.tiles.find((x) => x.kind === 'ladder');
    if (!tile) {
      console.warn(`warn track/${paper}/${t.id}: no ladder tiles (drawer opens unhighlighted)`);
      continue;
    }
    const r = resolveRoadmapNode(tile.subId);
    if (!r || lessonFormulaCount(r.topic) === null) {
      console.error(`FAIL track/${paper}/${t.id}: first tile "${tile.subId}" → ${r?.topic ?? 'null'}`);
      fail++;
    }
  }
  console.log(`checked track ${paper}: ${getTrack(paper).topics.length} topics`);
}

// 3. The user's concrete case: practicing sequences highlights a sequences topic.
const seq = resolveRoadmapNode('ar-general-term');
console.log(`ar-general-term → "${seq?.topic}" (${lessonFormulaCount(seq?.topic ?? '')} formulas)`);

if (fail) {
  console.error(`\n${fail} failures`);
  process.exit(1);
}
console.log('\nall good');
