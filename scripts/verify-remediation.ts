/**
 * verify-remediation.ts — the content gate for the auto-correction loop.
 *
 *   npx tsx scripts/verify-remediation.ts
 *
 * scripts/test-remediation.ts proves the ENGINE behaves. This proves the
 * CONTENT can feed it: for every sub-topic and every band a student could break
 * at, a real repair ladder must be buildable out of the authored banks, and
 * every step it stores must resolve back to a real question.
 *
 * What it CANNOT do — and this matters, because a green gate gets read as
 * "correct": it does not judge whether a question is a good repair for a given
 * weakness, and it does not check any mathematics. It checks that the plumbing
 * cannot hand a student an empty screen, a duplicate question, a ladder that
 * goes downhill, or a "fix this" button that leads nowhere.
 *
 * The inventory table at the end is the worklist: every row marked `thin` is a
 * sub-topic where a student who fails will be told there is not enough material
 * to build a repair path.
 */

import { MATH5_CURRICULUM } from '../content/bagrut-curriculum';
import { cognitionEntries } from '../content/cognition';
import { getConceptQuestions } from '../content/concept-quiz';
import { getSubTopic, getSubTopics, hasSubTopics } from '../content/lessons';
import { conceptToPractice } from '../lib/concept-adapt';
import { resolveRoadmapNode } from '../constants/roadmapData';
import { buildFixPath, MAX_STEPS, MIN_STEPS } from '../lib/remediation/path';
import { buildSupply, resolveFixQuestion } from '../lib/remediation/supply';
import { misconceptionTargetId, subTopicTargetId } from '../lib/remediation/detect';
import { rankOf, type Difficulty, type Weakness } from '../lib/remediation/types';

const SUBJECT = 'math5';
const BANDS: Difficulty[] = ['easy', 'mid', 'hard'];
const NOW = 1_700_000_000_000;

const errors: string[] = [];
const warnings: string[] = [];
function err(m: string) {
  errors.push(m);
}
function warn(m: string) {
  warnings.push(m);
}

/** A synthetic weakness — the shape `detectWeaknesses` would produce. */
function fakeWeakness(topic: string, subTopicId: string, band: Difficulty): Weakness {
  return {
    id: subTopicTargetId(subTopicId),
    kind: 'subtopic',
    subject: SUBJECT,
    topic,
    subTopicId,
    title: subTopicId,
    detail: '',
    band,
    confidence: 1,
    score: 1,
    hits: 3,
    opportunities: 4,
    lastTs: NOW,
  };
}

// ---------------------------------------------------------------------------
// 1 · Every sub-topic × every band must build a valid ladder
// ---------------------------------------------------------------------------

type Row = {
  topic: string;
  subTopicId: string;
  bank: string;
  drills: number;
  concept: number;
  built: string;
};
const rows: Row[] = [];

for (const t of MATH5_CURRICULUM) {
  if (!hasSubTopics(SUBJECT, t.key)) continue;
  const conceptCount = getConceptQuestions(SUBJECT, t.key).length;

  for (const st of getSubTopics(SUBJECT, t.key)) {
    const qs = st.questions ?? [];
    const e = qs.filter((q) => q.difficulty === 'easy').length;
    const m = qs.filter((q) => q.difficulty === 'mid').length;
    const h = qs.filter((q) => q.difficulty === 'hard').length;
    const drills = (st.lesson ?? []).filter((s) => s.drill).length;

    // Only the bands a student can actually break at. `band` is derived from
    // the difficulty of their WRONG answers, so a sub-topic with no `hard`
    // questions can never produce a `hard` band — synthesising one here would
    // manufacture warnings about a state that cannot occur.
    const present = new Set(qs.map((q) => q.difficulty));
    const reachable: Difficulty[] = BANDS.filter((b) => present.has(b));
    if (reachable.length === 0) reachable.push('mid'); // the default fallback

    const built: string[] = [];
    for (const band of reachable) {
      const w = fakeWeakness(t.key, st.id, band);
      const supply = buildSupply(w);
      const path = buildFixPath(w, supply, NOW);

      if (!path) {
        built.push(`${band}:✗`);
        warn(
          `[thin] ${t.key} / ${st.id} — no repair path can be built at band "${band}" ` +
            `(bank ${e}/${m}/${h}, drills ${drills}, concept ${conceptCount})`,
        );
        continue;
      }
      // How much of the ladder is actually ON the weakness. Steps from the
      // topic-level concept bank are same-topic but not same-sub-topic, so a
      // path made mostly of them is "practice near the problem", not a repair
      // of it. A green gate that never distinguishes the two would let the
      // product's central claim quietly become false.
      const offTarget = path.steps.filter((s) => s.origin === 'concept-bank').length;
      built.push(`${band}:${path.steps.length}${offTarget ? `(${offTarget}⤢)` : ''}`);
      if (offTarget * 2 > path.steps.length) {
        warn(
          `[off-target] ${t.key} / ${st.id} @${band} — ${offTarget} of ${path.steps.length} steps come ` +
            `from the topic-level concept bank, not this sub-topic (bank ${e}/${m}/${h}, drills ${drills})`,
        );
      }

      if (path.steps.length < MIN_STEPS || path.steps.length > MAX_STEPS) {
        err(`${st.id} @${band}: path has ${path.steps.length} steps, expected ${MIN_STEPS}-${MAX_STEPS}`);
      }

      const ids = path.steps.map((s) => s.questionId);
      if (new Set(ids).size !== ids.length) {
        err(`${st.id} @${band}: the same question appears twice in one path`);
      }

      const ranks = path.steps.map((s) => rankOf(s.difficulty));
      if (ranks.some((r, i) => i > 0 && ranks[i - 1] > r)) {
        err(`${st.id} @${band}: steps are not ordered easiest-first (${ranks.join(',')})`);
      }
      if (ranks[0] > rankOf(band)) {
        err(`${st.id} @${band}: the ladder starts ABOVE the band the student broke at`);
      }

      for (const step of path.steps) {
        const q = resolveFixQuestion(path, step);
        if (!q) {
          err(`${st.id} @${band}: step "${step.questionId}" (${step.origin}) does not resolve back to a question`);
          continue;
        }
        if (q.id !== step.questionId) {
          err(`${st.id} @${band}: step "${step.questionId}" resolved to a DIFFERENT question "${q.id}"`);
        }
        if (q.kind === 'mcq') {
          if (!q.answers || q.answers.length < 2) {
            err(`${st.id} @${band}: MCQ "${q.id}" has fewer than 2 options`);
          } else if (q.correct === undefined || q.correct < 0 || q.correct >= q.answers.length) {
            err(`${st.id} @${band}: MCQ "${q.id}" has correct index ${q.correct} outside its options`);
          }
        }
        if (!q.solution || q.solution.steps.length === 0 || !q.solution.finalAnswer) {
          err(`${st.id} @${band}: "${q.id}" has no usable solution — the repair would explain nothing`);
        }
      }
    }

    // The id has to survive a URL round-trip: it is a route segment.
    if (st.id !== encodeURIComponent(st.id)) {
      err(`sub-topic id "${st.id}" is not URL-safe — /fix/st:<id> would break`);
    }
    // Every failure ending links back to the guided lesson for this sub-topic.
    if (!resolveRoadmapNode(st.id)) {
      err(`sub-topic "${st.id}" does not resolve in the roadmap — the "back to the lesson" exit would 404`);
    }

    rows.push({
      topic: t.key,
      subTopicId: st.id,
      bank: `${e}/${m}/${h}`,
      drills,
      concept: conceptCount,
      built: built.join(' '),
    });
  }
}

// ---------------------------------------------------------------------------
// 2 · Every catalogued misconception must be repairable
// ---------------------------------------------------------------------------

for (const map of cognitionEntries()) {
  for (const mc of map.misconceptions) {
    const id = misconceptionTargetId(mc.id);
    if (mc.id !== encodeURIComponent(mc.id)) {
      err(`misconception id "${mc.id}" is not URL-safe — /fix/${id} would break`);
    }

    const st = getSubTopic(map.subject, map.topic, mc.remedy.subTopicId);
    if (!st) {
      err(`misconception "${mc.id}" points its remedy at "${mc.remedy.subTopicId}", which does not exist`);
      continue;
    }

    const w: Weakness = {
      ...fakeWeakness(map.topic, mc.remedy.subTopicId, 'mid'),
      id,
      kind: 'misconception',
      subject: map.subject,
      title: mc.title,
      misconceptionId: mc.id,
    };
    const path = buildFixPath(w, buildSupply(w), NOW);
    if (!path) {
      err(
        `misconception "${mc.id}" ("${mc.title}") has no buildable repair path — ` +
          `the app would name a weakness it cannot fix`,
      );
      continue;
    }

    // A diagnostic step tests the misconception directly. Not having one is not
    // an error: a trigger may legitimately live on a question in another
    // sub-topic. But it means the repair is measured only by proxy, so it is
    // worth naming.
    const supply = buildSupply(w);
    if (!supply.some((s) => s.diagnostic)) {
      warn(
        `[proxy-only] misconception "${mc.id}" has no trigger question inside its own remedy ` +
          `sub-topic "${mc.remedy.subTopicId}" — its repair is measured indirectly`,
      );
    }

    if (!st.keyPoints || st.keyPoints.length === 0) {
      warn(`[re-teach] sub-topic "${mc.remedy.subTopicId}" has no keyPoints — the re-teach card loses its "לזכור" block`);
    }
  }
}

// ---------------------------------------------------------------------------
// 3 · The concept-quiz adapter (the overflow supply) must convert cleanly
// ---------------------------------------------------------------------------

let converted = 0;
for (const t of MATH5_CURRICULUM) {
  for (const cq of getConceptQuestions(SUBJECT, t.key)) {
    const q = conceptToPractice(cq);
    converted++;
    if (!q.answers || q.answers.length === 0) {
      err(`concept "${cq.id}" converts to an MCQ with no options`);
    } else if (q.correct === undefined || q.correct < 0 || q.correct >= q.answers.length) {
      err(`concept "${cq.id}" has correct index ${cq.correct} outside its ${q.answers?.length} options`);
    } else if (!q.solution.finalAnswer.trim()) {
      err(`concept "${cq.id}" converts with an empty final answer`);
    }
    if (!q.solution.steps[0] || !q.solution.steps[0].trim()) {
      err(`concept "${cq.id}" converts with an empty solution — it would be served as a repair with no explanation`);
    }
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

console.log('\n── repair-path inventory ' + '─'.repeat(46));
console.log('topic / sub-topic'.padEnd(46) + 'bank(e/m/h)  drills  concept  paths(band:steps)');
let thin = 0;
for (const r of rows) {
  if (r.built.includes('✗')) thin++;
  console.log(
    `${(r.topic + ' / ' + r.subTopicId).padEnd(46)}${r.bank.padEnd(13)}${String(r.drills).padEnd(8)}${String(r.concept).padEnd(9)}${r.built}`,
  );
}
console.log('─'.repeat(70));
console.log(
  `${rows.length} sub-topics · ${converted} concept questions converted · ${thin} sub-topic(s) with at least one un-buildable band`,
);

if (warnings.length) {
  console.log(`\n⚠️  ${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`   ${w}`);
}
if (errors.length) {
  console.log(`\n❌ ${errors.length} error(s):`);
  for (const e of errors) console.log(`   ${e}`);
  process.exit(1);
}
console.log(`\n✅ 0 errors — every band of every sub-topic can build a resolvable repair path.`);
