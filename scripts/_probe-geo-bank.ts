// Inventory of the WHOLE geometry practice bank, per sub-topic × rung.
//
// The ladder rungs are derived, not authored: 🌱חימום/⚡ביסוס/🔥אתגר read
// `questions[]` filtered by `difficulty`, so "how many questions does a level
// have" is a different number from "how many questions the sub-topic has".
// Printed together with the kinds, because an all-`open` rung cannot diagnose a
// misconception (that needs a chosen distractor) and an all-`mcq` rung never
// makes the student produce a line of working.
import { getLesson } from '../content/lessons';
import type { PracticeQuestion, StaticBagrutQuestion, SubTopic } from '../content/lessons/types';

const TOPIC = 'גיאומטריה אוקלידית';
const lesson = getLesson('math5', TOPIC);
const subs: SubTopic[] = lesson?.subTopics ?? [];
const bank: StaticBagrutQuestion[] = lesson?.bagrutQuestions ?? [];

const pad = (s: string | number, n: number) => String(s).padEnd(n);
const count = (qs: PracticeQuestion[], d: string) => qs.filter((q) => q.difficulty === d).length;
const mcq = (qs: PracticeQuestion[], d: string) =>
  qs.filter((q) => q.difficulty === d && q.kind === 'mcq').length;

console.log(pad('sub-topic', 18) + pad('steps', 6) + pad('drill', 6) + 'חימום   ביסוס   אתגר    בגרות  figs');
console.log('-'.repeat(80));

const tot = { easy: 0, mid: 0, hard: 0, bag: 0 };
for (const st of subs) {
  const qs = st.questions ?? [];
  const bagrut = bank.filter((b) => b.subTopicId === st.id).length;
  const figs = JSON.stringify(st).split('```geo').length - 1;
  const cell = (d: 'easy' | 'mid' | 'hard') => pad(`${count(qs, d)} (${mcq(qs, d)}mcq)`, 8);
  tot.easy += count(qs, 'easy');
  tot.mid += count(qs, 'mid');
  tot.hard += count(qs, 'hard');
  tot.bag += bagrut;
  console.log(
    pad(st.id, 18) +
      pad(st.lesson?.length ?? 0, 6) +
      pad((st.lesson ?? []).filter((s) => s.drill).length, 6) +
      cell('easy') + cell('mid') + cell('hard') + pad(bagrut, 7) + figs,
  );
}
console.log('-'.repeat(80));
console.log(
  `${pad('TOTAL', 30)}${pad(tot.easy, 8)}${pad(tot.mid, 8)}${pad(tot.hard, 8)}${pad(tot.bag, 7)}`,
);
console.log(`\npractice questions: ${subs.reduce((a, s) => a + (s.questions ?? []).length, 0)}`);
