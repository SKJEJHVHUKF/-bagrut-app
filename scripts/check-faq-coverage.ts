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
import { answerLocally } from '../lib/tutor-local';
import type { TutorFocus } from '../lib/tutor-presence';

const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: () => {}, removeItem: () => {} },
};
(globalThis as unknown as { localStorage: unknown }).localStorage = (
  globalThis as unknown as { window: { localStorage: unknown } }
).window.localStorage;

const ONLY = process.argv[2];

type Row = { topic: string; source: string; total: number; covered: number; sampleMissing: string[] };

/** The SECOND layer. The bank answers arbitrary phrasings; the local ladder
 *  answers the built-in asks from the question object itself. They are
 *  independent, and reporting only the bank is what let /quiz read as 0% while
 *  the real cause was a crash in the ladder — a difference between a
 *  five-character fix and authoring 92 units. */
const LADDER_ASKS = [
  'תן לי רמז',
  'למה התשובה שלי שגויה?',
  'תסביר לי את השאלה הזאת מההתחלה',
  'מה הכי חשוב לדעת פה לבגרות?',
];
type LadderSet = { topic: string; source: string; questions: unknown[] };

(async () => {
  const rows: Row[] = [];
  const ladderSets: LadderSet[] = [];

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
    const subObjs: unknown[] = [];
    for (const st of L.subTopics ?? []) for (const q of st.questions ?? []) { subQ.push(q.id); subObjs.push(q); }
    // --- source 2: bagrut parts (StaticBagrutExerciseView / QuestionPartCard)
    const parts: string[] = [];
    for (const b of L.bagrutQuestions ?? []) for (const p of b.parts ?? []) parts.push(`${b.id}/${p.label}`);
    // --- source 3: the concept-quiz banks (/quiz) — a different content set
    const concept: string[] = [];
    const conceptObjs: unknown[] = [];
    for (const e of conceptBankEntries()) {
      if (e.subject !== subject || e.topic !== topic) continue;
      for (const lvl of CONCEPT_LEVELS)
        for (const q of getConceptQuestions(subject, topic, lvl)) { concept.push(q.id); conceptObjs.push(q); }
    }
    ladderSets.push(
      { topic, source: 'lessons: sub-topic', questions: subObjs },
      { topic, source: 'concept-quiz (/quiz)', questions: conceptObjs },
    );

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
  console.log(`  built-in asks costs a model call, no matter how good the bank is.`);

  // ===== layer 2: the local ladder =====
  console.log(`\n=== and what the LOCAL LADDER answers, from the question object ===\n`);
  console.log('  ' + 'topic'.padEnd(12) + 'source'.padEnd(24) + 'served'.padEnd(14) + 'notes');
  console.log('  ' + '-'.repeat(88));
  let lTotal = 0;
  let lServed = 0;
  let threw = 0;
  for (const set of ladderSets) {
    if (!set.questions.length) continue;
    let served = 0;
    let total = 0;
    const errors = new Set<string>();
    for (const q of set.questions) {
      const focus = {
        where: set.source,
        topic: set.topic,
        questionText: (q as { question?: string }).question,
        question: q,
        wrongAnswer: (q as { answers?: string[] }).answers?.[0],
        chosenIndex: 0,
      } as unknown as TutorFocus;
      for (const ask of LADDER_ASKS) {
        total++;
        try {
          if (answerLocally(ask, focus, [])?.text?.trim()) served++;
        } catch (e) {
          threw++;
          errors.add(e instanceof Error ? e.message : String(e));
        }
      }
    }
    lTotal += total;
    lServed += served;
    console.log(
      '  ' + set.topic.padEnd(12) + set.source.padEnd(24) +
      `${served}/${total} (${Math.round((served / total) * 100)}%)`.padEnd(14) +
      (errors.size ? `THREW: ${[...errors][0].slice(0, 40)}` : ''),
    );
  }
  console.log('  ' + '-'.repeat(88));
  console.log(`  ${'TOTAL'.padEnd(36)}${lServed}/${lTotal} (${Math.round((lServed / lTotal) * 100)}%)`);
  if (threw) {
    console.log(`\n  ⚠️  ${threw} asks THREW. A throw is invisible to a coverage count — from`);
    console.log(`     outside it looks exactly like "no answer available", which reads as a`);
    console.log(`     content gap and sends someone off to author units that already work.\n`);
  } else {
    console.log(`\n  Nothing threw. The two layers are INDEPENDENT: a 0% above is a genuine`);
    console.log(`  authoring gap only when the same row is healthy here. /quiz read 0% for`);
    console.log(`  months while the real cause was a crash in this layer.\n`);
  }
})();
