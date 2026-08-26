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
import { conceptAsQuestion, partAsQuestion } from '../lib/tutor-presence';
import type { PracticeQuestion, SubTopic } from '../content/lessons/types';

const ONLY = process.argv[2];

type Row = {
  topic: string;
  source: string;
  total: number;
  covered: number;
  sampleMissing: string[];
  /** Share of the six built-in asks this source answers from authored content. */
  ladder: number;
};

/**
 * The six recurring asks lib/tutor-local answers WITHOUT the bank.
 *
 * ⚠️ REPORTING ONLY THE BANK IS WHAT HID A CRASH AS A CONTENT GAP.
 * /quiz sat at 0/46 on both topics and was read for months as "nobody authored
 * this screen". It was not: /quiz renders ConceptQuestion, which has no
 * `solution` field, so every consumer threw on `q.solution.steps` — the six
 * built-in asks were dying too, and the bank column cannot see that because it
 * only counts ids. The ladder column below is measured by RUNNING answerLocally,
 * so a screen that throws reports 0% here and the two numbers disagree loudly.
 */
const ASKS = [
  'תן לי רמז',
  'מאיפה מתחילים?',
  'למה התשובה שלי שגויה?',
  'תראה לי את הפתרון',
  'באיזו נוסחה משתמשים כאן?',
  'מה הכי חשוב לדעת פה לבגרות?',
];

/** Fraction of `ASKS` answered locally, across the given questions. */
function ladderShare(
  topic: string,
  questions: { question: PracticeQuestion; subTopic?: SubTopic | null }[],
): number {
  if (!questions.length) return 0;
  let served = 0;
  let total = 0;
  for (const { question, subTopic } of questions) {
    const wrongIdx = (question.distractorNotes ?? []).findIndex((n) => !!n && n.trim());
    for (const ask of ASKS) {
      total++;
      try {
        if (
          answerLocally(ask, {
            where: topic,
            topic,
            questionText: question.question,
            question,
            ...(subTopic ? { subTopic } : {}),
            ...(wrongIdx >= 0 ? { chosenIndex: wrongIdx } : {}),
          })
        )
          served++;
      } catch {
        /* a throw is a 0 for this ask — that is the whole point of measuring it */
      }
    }
  }
  return total ? served / total : 0;
}

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

    // Each source contributes BOTH its ids (for the bank column) and the
    // question objects AS THE SCREEN PUBLISHES THEM (for the ladder column).
    // The mapping matters: a bagrut part and a /quiz question each reach the
    // tutor through an adapter, and measuring the raw shape would measure
    // something no screen ever sends.

    // --- source 1: lesson sub-topic questions (the ladder / QuestionRunnerCard)
    const subQ: string[] = [];
    const subObjs: { question: PracticeQuestion; subTopic?: SubTopic | null }[] = [];
    for (const st of L.subTopics ?? [])
      for (const q of st.questions ?? []) {
        subQ.push(q.id);
        subObjs.push({ question: q, subTopic: st });
      }
    // --- source 2: bagrut parts (StaticBagrutExerciseView / QuestionPartCard)
    const parts: string[] = [];
    const partObjs: { question: PracticeQuestion; subTopic?: SubTopic | null }[] = [];
    for (const b of L.bagrutQuestions ?? [])
      for (const p of b.parts ?? []) {
        parts.push(`${b.id}/${p.label}`);
        partObjs.push({ question: partAsQuestion(p, { questionId: b.id }) });
      }
    // --- source 3: the concept-quiz banks (/quiz) — a different content set
    const concept: string[] = [];
    const conceptObjs: { question: PracticeQuestion; subTopic?: SubTopic | null }[] = [];
    for (const e of conceptBankEntries()) {
      if (e.subject !== subject || e.topic !== topic) continue;
      for (const lvl of CONCEPT_LEVELS)
        for (const q of getConceptQuestions(subject, topic, lvl)) {
          concept.push(q.id);
          conceptObjs.push({ question: conceptAsQuestion(q) });
        }
    }

    for (const [source, ids, objs] of [
      ['lessons: sub-topic', subQ, subObjs],
      ['lessons: bagrut parts', parts, partObjs],
      ['concept-quiz (/quiz)', concept, conceptObjs],
    ] as const) {
      if (!ids.length) continue;
      const missing = ids.filter((id) => !has(id));
      rows.push({
        topic, source, total: ids.length, covered: ids.length - missing.length,
        sampleMissing: missing.slice(0, 3),
        ladder: ladderShare(topic, objs as { question: PracticeQuestion; subTopic?: SubTopic | null }[]),
      });
    }
  }

  if (!rows.length) { console.log('no topic has a FAQ bank yet'); return; }

  console.log(`\n=== what a student can open, vs what answers it ===\n`);
  console.log(
    '  ' + 'topic'.padEnd(12) + 'source'.padEnd(24) + 'ladder'.padEnd(9) + 'bank'.padEnd(12) +
      'sample uncovered ids',
  );
  console.log('  ' + '-'.repeat(96));
  let allTotal = 0, allCovered = 0;
  for (const r of rows) {
    allTotal += r.total; allCovered += r.covered;
    const pct = Math.round((r.covered / r.total) * 100);
    const lad = Math.round(r.ladder * 100);
    console.log(
      '  ' + r.topic.padEnd(12) + r.source.padEnd(24) +
      `${lad}%`.padEnd(9) +
      `${r.covered}/${r.total} (${pct}%)`.padEnd(12) + r.sampleMissing.join(', '),
    );
  }
  console.log('  ' + '-'.repeat(96));
  console.log(`  ${'TOTAL'.padEnd(36)}${''.padEnd(9)}${allCovered}/${allTotal} (${Math.round((allCovered / allTotal) * 100)}%)`);
  console.log(`
  TWO LAYERS, AND THEY MEAN DIFFERENT THINGS:

  ladder  the six built-in asks (רמז / מאיפה מתחילים / למה טעיתי / הפתרון /
          נוסחה / מה חשוב), answered by lib/tutor-local from the question's own
          authored fields. MEASURED BY RUNNING IT — a screen whose shape makes
          the tutor throw reports 0% here, which is how /quiz was finally caught
          after months of being read as an authoring gap.
  bank    everything a student asks BEYOND those six, matched against the
          authored FAQ (content/tutor-faq). Counted by id, not by running.

  ladder 0%  → the tutor is broken on that screen. Fix the code, not the content.
  bank 0%    → the six asks work, but anything else costs a model call.
`);
})();
