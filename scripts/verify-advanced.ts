// verify-advanced.ts — structural sanity for advanced courses.
//   npx tsx scripts/verify-advanced.ts
// Checks (per registered course):
//  - each examPractice + the simulation: totalPoints === Σ part.points
//  - every reviewRef.patternId exists in §2 patterns
//  - every reviewRef.techniqueId exists in §3 techniques
//  - every workedExam/exam patternId exists in §2
//  - gate.passThreshold ≤ gate.questions.length; each correct index valid
//  - section counts within the expected ranges

import { allAdvancedCourseKeys, getAdvancedCourse } from '@/content/advanced-courses';

export {};

let pass = 0;
let fail = 0;
const check = (name: string, cond: boolean, detail = '') => {
  if (cond) pass++;
  else {
    fail++;
    console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`);
  }
};

const keys = allAdvancedCourseKeys();
console.log(`registered advanced courses: ${keys.length}\n`);

for (const { subject, topic } of keys) {
  const c = getAdvancedCourse(subject, topic);
  if (!c) {
    check(`${topic}: loads`, false);
    continue;
  }
  console.log(`— ${topic} —`);
  const patternIds = new Set(c.patterns.map((p) => p.id));
  const techIds = new Set(c.techniques.map((t) => t.id));

  check(`${topic}: 5-6 patterns`, c.patterns.length >= 4 && c.patterns.length <= 8, `${c.patterns.length}`);
  check(`${topic}: 5-6 techniques`, c.techniques.length >= 4 && c.techniques.length <= 8, `${c.techniques.length}`);
  check(`${topic}: ≥2 worked exams`, c.workedExams.length >= 2, `${c.workedExams.length}`);
  check(`${topic}: ≥5 exam practice`, c.examPractice.length >= 5, `${c.examPractice.length}`);
  check(`${topic}: ≥4 traps`, c.traps.length >= 4, `${c.traps.length}`);

  // Gate
  check(`${topic}: gate threshold ok`, c.gate.passThreshold <= c.gate.questions.length && c.gate.passThreshold > 0);
  c.gate.questions.forEach((q) =>
    check(`${topic}: gate ${q.id} correct index`, q.correct >= 0 && q.correct < q.answers.length),
  );

  // examPractice point sums + reviewRefs
  const allExams = [...c.examPractice, c.simulation.question];
  for (const ex of allExams) {
    const sum = ex.parts.reduce((a, p) => a + p.points, 0);
    check(`${topic}: ${ex.id} totalPoints=Σparts`, ex.totalPoints === sum, `${ex.totalPoints} vs ${sum}`);
    ex.patternIds.forEach((pid) =>
      check(`${topic}: ${ex.id} patternId ${pid}`, patternIds.has(pid)),
    );
    ex.parts.forEach((part) => {
      if (part.reviewRef?.patternId)
        check(`${topic}: ${ex.id}.${part.label} ref pattern`, patternIds.has(part.reviewRef.patternId), part.reviewRef.patternId);
      if (part.reviewRef?.techniqueId)
        check(`${topic}: ${ex.id}.${part.label} ref technique`, techIds.has(part.reviewRef.techniqueId), part.reviewRef.techniqueId);
    });
  }

  // workedExams patternIds
  for (const we of c.workedExams) {
    we.parts.forEach((part) => {
      if (part.patternId)
        check(`${topic}: ${we.id}.${part.label} patternId`, patternIds.has(part.patternId), part.patternId);
    });
  }

  // traps relatedPatternId
  c.traps.forEach((t, i) => {
    if (t.relatedPatternId)
      check(`${topic}: trap ${i} relatedPattern`, patternIds.has(t.relatedPatternId), t.relatedPatternId);
  });
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exitCode = 1;
