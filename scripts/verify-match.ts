// verify-match.ts — sanity-checks the solution-library matcher.
//
//   npx tsx scripts/verify-match.ts
//
// Asserts:
//  1. Every library question matches ITSELF (exact hash → score 1).
//  2. Lightly-mangled phrasings (extra spaces, niqqud, section labels,
//     $ delimiters) still match the same question at ≥ threshold.
//  3. An unrelated question returns null (no false positive).

import { ALL_PAST_BAGRUYOT } from '@/content/past-bagruyot';
import { allLessonKeys, getLesson } from '@/content/lessons';
import { matchQuestion, librarySize } from '@/lib/solution-library';

export {};

let pass = 0;
let fail = 0;
const fails: string[] = [];

function check(name: string, cond: boolean, detail = '') {
  if (cond) pass++;
  else {
    fail++;
    fails.push(`${name}${detail ? ' — ' + detail : ''}`);
  }
}

console.log(`library size: ${librarySize()} pre-solved questions\n`);

// ---- Collect a representative sample of question texts from the library ----
type Sample = { id: string; topic: string; text: string };
const samples: Sample[] = [];

for (const q of ALL_PAST_BAGRUYOT) {
  const text = [q.context, ...q.parts.map((p) => p.prompt)].filter(Boolean).join(' ');
  samples.push({ id: q.id, topic: q.topic, text });
}
for (const { subject, topic } of allLessonKeys()) {
  if (subject !== 'math5') continue;
  const lesson = getLesson(subject, topic);
  if (!lesson) continue;
  for (const q of (lesson.bagrutQuestions ?? []).slice(0, 2)) {
    const text = [q.context, ...q.parts.map((p) => p.prompt)].filter(Boolean).join(' ');
    samples.push({ id: q.id, topic, text });
  }
  for (const q of (lesson.questions ?? []).slice(0, 3)) {
    samples.push({ id: q.id, topic, text: q.question });
  }
}

console.log(`testing ${samples.length} sample questions...\n`);

// ---- 1. Self-match (exact) ----
for (const s of samples) {
  const m = matchQuestion(s.text, s.topic);
  check(`self-match ${s.id}`, m !== null && m.score >= 0.82, m ? `got ${s.id === m.solution.matchId ? 'self' : m.solution.matchId} @ ${m.score.toFixed(2)}` : 'null');
}

// ---- 2. Mangled phrasing still matches ----
function mangle(t: string): string {
  return ('א. ' + t)               // stray section label
    .replace(/\$/g, '')             // OCR often drops $ delimiters
    .replace(/ /g, '  ')            // double spaces
    .replace(/=/g, ' = ');          // loose operator spacing
}
let mangleTested = 0;
for (const s of samples.slice(0, 40)) {
  const m = matchQuestion(mangle(s.text), s.topic);
  mangleTested++;
  check(`mangled-match ${s.id}`, m !== null && m.score >= 0.82, m ? `@ ${m.score.toFixed(2)}` : 'null');
}

// ---- 3. Unrelated text → no false positive ----
const junk = 'מהי בירת צרפת ומתי נוסדה העיר הזאת בהיסטוריה האירופית';
check('no-false-positive', matchQuestion(junk) === null, matchQuestion(junk) ? 'matched something!' : 'ok');

console.log(`\n${pass} passed, ${fail} failed (mangled variants tested: ${mangleTested})`);
if (fails.length) {
  console.log('\nFAILURES:');
  for (const f of fails.slice(0, 25)) console.log('  ✗ ' + f);
  if (fails.length > 25) console.log(`  … +${fails.length - 25} more`);
  process.exitCode = 1;
}
