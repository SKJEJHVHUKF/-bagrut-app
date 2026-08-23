/**
 * check-faq-coverage.ts — of the questions a student can actually be sitting
 * on, how many have a FAQ bank behind them?
 *
 *   npx tsx scripts/check-faq-coverage.ts [topic]
 *
 * FREE, read-only.
 *
 * WHY THIS IS NOT scripts/pool-coverage.ts's JOB
 * ----------------------------------------------
 * The bank was authored from `content/lessons` — the audit script walks
 * sub-topic questions, top-level questions and bagrut parts. But a student
 * reaches questions from THREE separate content sets, and the other two were
 * never in the audit:
 *
 *   content/lessons      sub-topic + bagrut  → what the bank covers
 *   content/concept-quiz the /quiz banks     → NOT covered
 *   generated (/practice, /questions)        → cannot be covered, they are new
 *
 * A bank measured against its own source always reads 100%. Measured against
 * what a student opens, it reads whatever it reads — and that is the number
 * that decides how often the tutor still pays for a model call.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { getLesson, allLessonKeys } from '../content/lessons';
import { conceptBankEntries, getConceptQuestions, CONCEPT_LEVELS } from '../content/concept-quiz';
import { loadFaqBank } from '../content/tutor-faq';

const ONLY = process.argv[2];

type Row = { topic: string; source: string; total: number; covered: number; sampleMissing: string[] };

(async () => {
  const rows: Row[] = [];

  for (const { subject, topic } of allLessonKeys()) {
    if (subject !== 'math5') continue;
    if (ONLY && topic !== ONLY) continue;
    const bank = await loadFaqBank(subject, topic);
    if (!bank) continue; // no bank authored for this topic at all
    const has = (id: string) => (bank[id]?.length ?? 0) > 0;

    const L = getLesson(subject, topic);
    if (!L) continue;

    // --- source 1: lesson sub-topic questions (the ladder / QuestionRunnerCard)
    const subQ: string[] = [];
    for (const st of L.subTopics ?? []) for (const q of st.questions ?? []) subQ.push(q.id);
    // --- source 2: bagrut parts (StaticBagrutExerciseView / QuestionPartCard)
    const parts: string[] = [];
    for (const b of L.bagrutQuestions ?? []) for (const p of b.parts ?? []) parts.push(`${b.id}/${p.label}`);
    // --- source 3: the concept-quiz banks (/quiz) — a different content set
    const concept: string[] = [];
    for (const e of conceptBankEntries()) {
      if (e.subject !== subject || e.topic !== topic) continue;
      for (const lvl of CONCEPT_LEVELS) for (const q of getConceptQuestions(subject, topic, lvl)) concept.push(q.id);
    }

    for (const [source, ids] of [
      ['lessons: sub-topic', subQ],
      ['lessons: bagrut parts', parts],
      ['concept-quiz (/quiz)', concept],
    ] as const) {
      if (!ids.length) continue;
      const missing = ids.filter((id) => !has(id));
      rows.push({
        topic, source, total: ids.length, covered: ids.length - missing.length,
        sampleMissing: missing.slice(0, 3),
      });
    }
  }

  if (!rows.length) { console.log('no topic has a FAQ bank yet'); return; }

  console.log(`\n=== what a student can open, vs what the bank covers ===\n`);
  console.log('  ' + 'topic'.padEnd(12) + 'source'.padEnd(24) + 'covered'.padEnd(12) + 'sample uncovered ids');
  console.log('  ' + '-'.repeat(88));
  let allTotal = 0, allCovered = 0;
  for (const r of rows) {
    allTotal += r.total; allCovered += r.covered;
    const pct = Math.round((r.covered / r.total) * 100);
    console.log(
      '  ' + r.topic.padEnd(12) + r.source.padEnd(24) +
      `${r.covered}/${r.total} (${pct}%)`.padEnd(12) + r.sampleMissing.join(', '),
    );
  }
  console.log('  ' + '-'.repeat(88));
  console.log(`  ${'TOTAL'.padEnd(36)}${allCovered}/${allTotal} (${Math.round((allCovered / allTotal) * 100)}%)`);
  console.log(`\n  Anything at 0% is a screen where EVERY tutor question past the six`);
  console.log(`  built-in asks costs a model call, no matter how good the bank is.\n`);
})();
