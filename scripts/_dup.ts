import { buildMatchIndex, findMatch } from '../lib/mathscan/match';
import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';
import { allLessonKeys, getLesson } from '../content/lessons';

type E = { id: string; topic: string; text: string };
function corpus(): E[] {
  const out: E[] = [];
  for (const q of ALL_PAST_BAGRUYOT)
    out.push({ id: q.id, topic: q.topic, text: [q.context, ...q.parts.map(p => p.prompt)].filter(Boolean).join(' ') });
  for (const { subject, topic } of allLessonKeys()) {
    if (subject !== 'math5') continue;
    const l = getLesson(subject, topic);
    if (!l) continue;
    for (const q of l.questions ?? []) out.push({ id: q.id, topic, text: q.question });
    for (const s of l.subTopics ?? []) for (const q of s.questions ?? []) out.push({ id: q.id, topic, text: q.question });
    for (const q of l.bagrutQuestions ?? []) out.push({ id: q.id, topic, text: [q.context, ...q.parts.map(p => p.prompt)].filter(Boolean).join(' ') });
  }
  return out;
}

const all = corpus();
// Pick a long entry that matches cleanly today.
const target = all.find(e => e.text.length > 140 && e.text.length < 400)!;
const query = target.text.replace(/\sqrt/g, 'N').replace(/\$/g, '');

const clean = findMatch(buildMatchIndex(all), query, { topicHint: target.topic });
// Now simulate a SECOND student's scan of the same question landing as its own
// row: same content, one character different, different id.
const dupe: E = { id: target.id + '-dup', topic: target.topic, text: target.text.replace('את', 'אתt') };
const withDupe = findMatch(buildMatchIndex([...all, dupe]), query, { topicHint: target.topic });

console.log('target                :', target.id);
console.log('bank WITHOUT duplicate:', clean ? `HIT ${clean.entry.id} score=${clean.score.toFixed(3)} margin=${clean.margin.toFixed(3)}` : 'MISS');
console.log('bank WITH duplicate   :', withDupe ? `HIT ${withDupe.entry.id} score=${withDupe.score.toFixed(3)} margin=${withDupe.margin.toFixed(3)}` : 'MISS  <-- retrieval broken by growth');
