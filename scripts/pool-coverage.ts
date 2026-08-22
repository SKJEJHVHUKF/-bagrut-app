/**
 * pool-coverage.ts — which quiz buckets actually reach a paid API call?
 *
 *   npm run pool:coverage
 *   npm run pool:coverage -- --subject math5
 *
 * FREE. Reads the static banks and Supabase; spends nothing on Anthropic.
 *
 * WHY THE QUESTION IS "REACHES THE API", NOT "IS THE POOL FULL"
 * ------------------------------------------------------------
 * The first version of this script reported the pool alone — "0/52 buckets
 * warm, $16.70 to fill" — and that number was misleading, because the pool is
 * the THIRD thing the quiz page tries, not the first. app/quiz/page.tsx serves,
 * in order:
 *
 *   1. the static concept bank for that topic AND level   (content/concept-quiz)
 *   2. the static lesson MCQ bank for that topic           (content/lessons)
 *   3. /api/questions → the Supabase pool → a live generation
 *
 * A bucket with an authored bank never gets past step 1. So the only buckets
 * worth a single cent of pool generation are the ones with NO static coverage —
 * and a report that cannot see steps 1-2 will happily recommend spending money
 * on topics that are already free. This one looks at all three layers and
 * reports the gap that is real.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { createClient } from '@supabase/supabase-js';
import { MATH5_CURRICULUM } from '@/content/bagrut-curriculum';
import { hasConceptBank, conceptLevelCounts, CONCEPT_LEVELS } from '@/content/concept-quiz';
import { hasQuestionBank, getQuestions } from '@/content/lessons';

const argv = process.argv.slice(2);
const argOf = (flag: string) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
};
const SUBJECT = argOf('--subject') ?? 'math5';

/** Measured per-row cost, from scripts/generate-pool.ts's own estimate. */
const COST_PER_ROW = 0.03;
/** Rows per bucket that count as warm, for the buckets that DO reach the API. */
const TARGET = 10;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

type Bucket = {
  topic: string;
  level: 1 | 2 | 3;
  /** Step 1 — questions in the static concept bank at this level. */
  concept: number;
  /** Step 2 — MCQs in the static lesson bank (any level; the page band-matches
   *  and falls back to a tier mix rather than to the API). */
  lessonMcq: number;
  /** Step 3 — rows in the Supabase pool for this bucket. */
  pool: number;
  weight: string;
  appearsIn: string;
};

(async () => {
  const { data, error } = await supabase
    .from('question_pool')
    .select('topic, kind')
    .eq('subject', SUBJECT);
  if (error) {
    console.error('Supabase error:', error.message);
    process.exit(1);
  }
  const poolCounts = new Map<string, number>();
  for (const row of data ?? []) {
    const key = `${row.topic} ${row.kind}`;
    poolCounts.set(key, (poolCounts.get(key) ?? 0) + 1);
  }

  const inScope = MATH5_CURRICULUM.filter((t) => t.weight !== 'out-of-scope');
  const buckets: Bucket[] = [];
  for (const t of inScope) {
    const counts = conceptLevelCounts(SUBJECT, t.key);
    const lessonMcq = hasQuestionBank(SUBJECT, t.key)
      ? getQuestions(SUBJECT, t.key).filter((q) => q.kind === 'mcq').length
      : 0;
    for (const level of CONCEPT_LEVELS) {
      buckets.push({
        topic: t.key,
        level,
        concept: hasConceptBank(SUBJECT, t.key, level) ? counts[level] : 0,
        lessonMcq,
        pool: poolCounts.get(`${t.key} concept-l${level}`) ?? 0,
        weight: t.weight,
        appearsIn: t.appearsIn,
      });
    }
  }

  const reachesApi = buckets.filter((b) => b.concept === 0 && b.lessonMcq === 0);
  const thin = buckets.filter((b) => b.concept > 0 && b.concept < 8);
  const viaLessons = buckets.filter((b) => b.concept === 0 && b.lessonMcq > 0);

  console.log(`\n=== quiz coverage — subject "${SUBJECT}" ===\n`);
  console.log(`  in-scope topics              ${inScope.length}`);
  console.log(`  topic x level buckets        ${buckets.length}`);
  console.log(`  served by concept bank       ${buckets.filter((b) => b.concept > 0).length}`);
  console.log(`  served by lesson MCQ bank    ${viaLessons.length}  (concept bank missing at that level)`);
  console.log(`  REACH THE API                ${reachesApi.length}`);
  console.log(`  pool rows (step 3)           ${data?.length ?? 0}`);

  if (thin.length) {
    console.log(`\n  thin concept banks (< 8 questions — students will see repeats):`);
    for (const b of thin) {
      console.log(`    ${b.topic.padEnd(22)} L${b.level}  ${b.concept} questions`);
    }
  }
  if (viaLessons.length) {
    console.log(`\n  falling through to the lesson bank (free, but level is approximate):`);
    for (const b of viaLessons) {
      console.log(`    ${b.topic.padEnd(22)} L${b.level}  ${b.lessonMcq} lesson MCQs`);
    }
  }

  if (!reachesApi.length) {
    console.log(`\n  ✅ NOTHING REACHES THE API. Every in-scope bucket is answered from static\n` +
      `     content. Pool generation would cost money to fill a layer that is never\n` +
      `     read — do not run generate-pool for ${SUBJECT}.\n`);
    return;
  }

  const gaps = reachesApi
    .map((b) => ({ ...b, need: Math.max(0, TARGET - b.pool) }))
    .filter((b) => b.need > 0)
    .sort((a, b) => a.topic.localeCompare(b.topic) || a.level - b.level);
  const cost = gaps.reduce((s, g) => s + g.need * COST_PER_ROW, 0);

  console.log(`\n  buckets that reach the API and have a cold pool: ${gaps.length}  (~$${cost.toFixed(2)} to warm)\n`);
  console.log('  ' + 'topic'.padEnd(22) + 'level  pool   why it matters');
  console.log('  ' + '-'.repeat(64));
  for (const g of gaps) {
    console.log(`  ${g.topic.padEnd(22)} L${g.level}     ${String(g.pool).padEnd(6)} ${g.weight}, ${g.appearsIn}`);
  }
  console.log(`\n  The cheaper fix is usually to AUTHOR a concept bank for the topic — it is\n` +
    `  free, verified by npm run verify:concept, and served before the pool.\n`);
  for (const g of gaps.slice(0, 6)) {
    console.log(`    npm run generate-pool -- ${SUBJECT} "${g.topic}" concept ${g.need}   # level ${g.level}`);
  }
  console.log();
})();
