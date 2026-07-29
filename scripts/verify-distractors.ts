/**
 * verify-distractors.ts — per-option "why your answer was wrong" coverage.
 *   npx tsx scripts/verify-distractors.ts            report only, exit 0
 *   npx tsx scripts/verify-distractors.ts --strict    fail if anything is missing
 *   npx tsx scripts/verify-distractors.ts --file=vectors.ts   one file
 *
 * WHY
 * The quiz and the roadmap runner both render `distractorNotes[chosenIndex]`
 * so a student who picks a wrong option is told why THAT option is wrong.
 * The wiring has existed for a while; the data had not been written. A survey
 * found 484 of 485 lesson-bank MCQs with no notes at all, so the feature was
 * dead everywhere outside the concept-quiz bank.
 *
 * WHAT IT CAN AND CANNOT CHECK
 * It checks STRUCTURE: an array as long as `answers`, empty at `correct`,
 * substantive everywhere else. It CANNOT check that note i actually describes
 * option i — a misaligned array is worse than no array at all, because the
 * student is confidently told about a mistake they did not make. Alignment has
 * to be spot-checked by reading. Do not treat a green run as proof of quality.
 */
import { getLesson, allLessonKeys } from '@/content/lessons';

const STRICT = process.argv.includes('--strict');
const ONLY = process.argv.find((a) => a.startsWith('--file='))?.slice(7);
const MIN_NOTE = 20;

// CLAUDE.md #2: never-touch, so its gaps must not block the gate.
const EXCLUDED = new Set(['סטטיסטיקה']);

type Q = {
  id?: string;
  kind?: string;
  answers?: string[];
  correct?: number;
  distractorNotes?: (string | undefined)[];
};

type Row = { topic: string; mcq: number; ok: number; problems: string[] };
const rows: Row[] = [];

for (const { subject, topic } of allLessonKeys()) {
  if (ONLY && !topic.includes(ONLY)) {
    // --file= matches on the topic name fragment too; keep it forgiving.
  }
  const lesson = getLesson(subject, topic);
  if (!lesson) continue;

  const pool: Q[] = [
    ...((lesson.questions ?? []) as Q[]),
    ...((lesson.subTopics ?? []).flatMap((st) => [
      ...((st.questions ?? []) as Q[]),
      ...(((st.lesson ?? []).map((s) => s.drill).filter(Boolean) as unknown) as Q[]),
    ]) as Q[]),
  ];

  const row: Row = { topic, mcq: 0, ok: 0, problems: [] };
  for (const q of pool) {
    if (q.kind !== 'mcq') continue;
    row.mcq++;
    const answers = q.answers ?? [];
    const notes = q.distractorNotes;
    const id = q.id ?? '(no id)';

    if (!Array.isArray(notes)) {
      row.problems.push(`${id}: no distractorNotes`);
      continue;
    }
    if (notes.length !== answers.length) {
      row.problems.push(`${id}: ${notes.length} notes for ${answers.length} answers`);
      continue;
    }
    let bad = false;
    // A note sitting on the CORRECT option is the dangerous failure: the UI
    // shows notes only on a wrong answer, so a note there means the array is
    // very likely shifted, and every other note is describing the wrong option.
    if (typeof q.correct === 'number' && notes[q.correct] && String(notes[q.correct]).trim()) {
      row.problems.push(`${id}: note present at the CORRECT index ${q.correct} — array is probably misaligned`);
      bad = true;
    }
    for (let i = 0; i < answers.length; i++) {
      if (i === q.correct) continue;
      const n = notes[i];
      if (!n || String(n).trim().length < MIN_NOTE) {
        row.problems.push(`${id}: distractorNotes[${i}] missing/short for "${String(answers[i]).slice(0, 30)}"`);
        bad = true;
      }
    }
    if (!bad) row.ok++;
  }
  rows.push(row);
}

rows.sort((a, b) => b.mcq - a.mcq);

let totalMcq = 0;
let totalOk = 0;
let blockingProblems = 0;

console.log('coverage  ok/mcq   topic');
for (const r of rows) {
  if (r.mcq === 0) continue;
  const excluded = EXCLUDED.has(r.topic);
  totalMcq += excluded ? 0 : r.mcq;
  totalOk += excluded ? 0 : r.ok;
  if (!excluded) blockingProblems += r.problems.length;
  const pct = r.mcq ? Math.round((r.ok / r.mcq) * 100) : 100;
  console.log(
    `${String(pct).padStart(7)}%  ${String(r.ok).padStart(3)}/${String(r.mcq).padEnd(3)}  ${r.topic}${excluded ? '   [excluded — never-touch]' : ''}`,
  );
}

const misaligned = rows.flatMap((r) => r.problems.filter((p) => p.includes('CORRECT index')));
if (misaligned.length) {
  console.log(`\n🔴 ${misaligned.length} likely-misaligned array(s) — these actively mislead students:`);
  misaligned.slice(0, 20).forEach((p) => console.log(`   ${p}`));
}

console.log(
  `\n${totalOk}/${totalMcq} MCQs fully covered (${totalMcq - totalOk} remaining), ${blockingProblems} problem(s).`,
);
if (STRICT && blockingProblems > 0) process.exit(1);

export {};
