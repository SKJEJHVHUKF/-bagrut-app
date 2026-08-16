/* eslint-disable */
// throwaway audit script — delete after use
import { allLessonKeys, getLesson } from '../content/lessons';
import type { PracticeQuestion } from '../content/lessons/types';
import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';
import { MATH5_CURRICULUM } from '../content/bagrut-curriculum';

type Row = {
  topic: string;
  subTopics: number;
  qTop: number;
  qSub: number;
  drills: number;
  lessonSteps: number;
  open: number;
  openExpected: number;
  openManual: number;
  openAuto: number;
  steps: number;
  packed3: number;
  oneStep: number;
  oneStepMidHard: number;
};

const rows: Row[] = [];
let allQ = 0;

for (const { subject, topic } of allLessonKeys()) {
  const L = getLesson(subject, topic)!;
  const r: Row = { topic, subTopics: L.subTopics?.length ?? 0, qTop: 0, qSub: 0, drills: 0, lessonSteps: 0, open: 0, openExpected: 0, openManual: 0, openAuto: 0, steps: 0, packed3: 0, oneStep: 0, oneStepMidHard: 0 };
  const qs: PracticeQuestion[] = [];
  for (const q of L.questions ?? []) { qs.push(q); r.qTop++; }
  for (const st of L.subTopics ?? []) {
    for (const q of st.questions ?? []) { qs.push(q); r.qSub++; }
    for (const s of st.lesson ?? []) {
      r.lessonSteps++;
      if (s.drill) { qs.push(s.drill); r.drills++; }
    }
  }
  for (const q of qs) {
    allQ++;
    if (q.kind === 'open') {
      r.open++;
      if (q.expected) {
        r.openExpected++;
        if (q.expected.kind === 'manual') r.openManual++; else r.openAuto++;
      }
    }
    const st = q.solution?.steps ?? [];
    r.steps += st.length;
    for (const s of st) {
      const groups = (s.match(/\$[^$]+\$/g) ?? []).length;
      if (groups >= 3) r.packed3++;
    }
    if (st.length === 1) { r.oneStep++; if (q.difficulty !== 'easy') r.oneStepMidHard++; }
  }
  rows.push(r);
}

console.log('TOPIC | subT | qTop | qSub | drills | lessonSteps | open | exp | manual | auto | steps | packed3 | 1step | 1step(mid/hard)');
for (const r of rows) {
  console.log([r.topic, r.subTopics, r.qTop, r.qSub, r.drills, r.lessonSteps, r.open, r.openExpected, r.openManual, r.openAuto, r.steps, r.packed3, r.oneStep, r.oneStepMidHard].join(' | '));
}
const sum = (f: (r: Row) => number) => rows.reduce((a, r) => a + f(r), 0);
console.log('TOTALS questions=', allQ, 'open=', sum(r => r.open), 'expected=', sum(r => r.openExpected), 'manual=', sum(r => r.openManual), 'auto=', sum(r => r.openAuto), 'steps=', sum(r => r.steps), 'packed3=', sum(r => r.packed3), '1step=', sum(r => r.oneStep), 'drills=', sum(r => r.drills));

// past bagruyot topic histogram + curriculum key check
const keys = new Set(Object.keys(MATH5_CURRICULUM as any));
const hist: Record<string, number> = {};
for (const s of ALL_PAST_BAGRUYOT as any[]) {
  for (const q of s.questions ?? []) hist[q.topic] = (hist[q.topic] ?? 0) + 1;
}
console.log('\nPAST-BAGRUT topics (total q =', Object.values(hist).reduce((a, b) => a + b, 0), ')');
for (const [t, n] of Object.entries(hist).sort((a, b) => b[1] - a[1])) {
  console.log(`${keys.has(t) ? 'OK  ' : 'MISS'} ${t} = ${n}`);
}
console.log('sessions=', (ALL_PAST_BAGRUYOT as any[]).length, (ALL_PAST_BAGRUYOT as any[]).map(s => `${s.id ?? s.session}:${s.paper ?? ''}`).join(', '));
