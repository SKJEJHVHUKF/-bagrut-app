/**
 * _prob20-stage-brief.ts — everything an author must know about ONE הסתברות stage
 * before writing for it, without reading 170 KB of TypeScript:
 *
 *   npx tsx scripts/_prob20-stage-brief.ts pr-tables            the stage in full
 *   npx tsx scripts/_prob20-stage-brief.ts pr-tables --earlier  + what the earlier stages teach
 *
 * Prints the lesson (every teach paragraph, every example and drill statement),
 * then every question already on the ladder (statement + expected, no solution),
 * then every bagrut question (context + part prompts). Round-3 authors read this
 * to learn the stage's tools and to avoid writing a question the student has met.
 */
import { getLesson } from '../content/lessons';

const TOPIC = 'הסתברות';
const stageId = process.argv[2];
const L = getLesson('math5', TOPIC);
const stages = L?.subTopics ?? [];
const idx = stages.findIndex((s) => s.id === stageId);
if (!L || idx < 0) {
  console.error(`usage: npx tsx scripts/_prob20-stage-brief.ts <${stages.map((s) => s.id).join('|')}> [--earlier]`);
  process.exit(2);
}
const flat = (s: string | undefined) => (s ?? '').replace(/\n{2,}/g, '\n').trim();

if (process.argv.includes('--earlier')) {
  console.log('######## EARLIER STAGES — the tools a student already has ########');
  for (const st of stages.slice(0, idx)) {
    const lesson = (st.lesson ?? []) as unknown as { title?: string }[];
    console.log(`\n=== ${st.id} · ${st.title}\n${flat((st as unknown as { summary?: string }).summary).slice(0, 900)}`);
    console.log(`steps: ${lesson.map((x, i) => `${i + 1}. ${x.title}`).join(' | ')}`);
  }
  console.log('\n######## THIS STAGE ########');
}

const st = stages[idx];
console.log(`\n=== ${st.id} · ${st.title}\n${flat((st as unknown as { summary?: string }).summary)}`);
type Step = { title?: string; teach?: string; example?: { problem?: string; answer?: string }; drill?: { id?: string; question?: string } };
((st.lesson ?? []) as unknown as Step[]).forEach((s, i) => {
  console.log(`\n--- lesson step ${i + 1}: ${s.title}\n${flat(s.teach)}`);
  if (s.example?.problem) console.log(`[example] ${flat(s.example.problem)}\n[example answer] ${flat(s.example.answer)}`);
  if (s.drill?.question) console.log(`[drill ${s.drill.id}] ${flat(s.drill.question)}`);
});

console.log(`\n######## QUESTIONS ALREADY ON THE LADDER (${(st.questions ?? []).length}) ########`);
for (const d of ['easy', 'mid', 'hard'] as const) {
  const qs = (st.questions ?? []).filter((q) => q.difficulty === d);
  console.log(`\n--- ${d} (${qs.length})`);
  for (const q of qs) console.log(`[${q.id} · ${q.kind}] ${flat(q.question)}  ⇒ ${JSON.stringify(q.expected ?? { correct: q.answers?.[q.correct ?? 0] })}`);
}

const bag = (L.bagrutQuestions ?? []).filter((b) => b.subTopicId === st.id);
console.log(`\n######## BAGRUT QUESTIONS ON THE 🎓 RUNG (${bag.length}) ########`);
for (const b of bag) {
  console.log(`\n[${b.id}] ${b.topic_tag ?? ''}\n${flat(b.context)}`);
  for (const p of b.parts) console.log(`  (${p.label}) ${flat(p.prompt)}  ⇒ ${JSON.stringify(p.expected)}`);
}
