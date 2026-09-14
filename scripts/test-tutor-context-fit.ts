/**
 * test-tutor-context-fit.ts — the tutor model sees the WHOLE question and the WHOLE solution.
 *
 *   npx tsx scripts/test-tutor-context-fit.ts
 *
 * FREE. No model call. Renders the focus brief for every practice question and
 * every lesson bagrut part exactly as the bubble does (renderFocusContext; a
 * part's question text from partQuestionText) and fails when:
 *   1. the question text is cut — for a part, its own prompt included;
 *   2. any authored solution step is cut;
 *   3. the longest brief, with every optional block at its largest, plus the
 *      student snapshot would not fit MAX_CONTEXT_LEN. The server truncates
 *      from the END, so an overflow silently evicts the snapshot.
 *
 * WHY THIS EXISTS
 * Until 2026-09-14 the caps were 600 / 1200. 172 of 2,143 practice solutions
 * lost steps — the long, bagrut-level mixed questions where a student most
 * needs help — and for 24 lesson bagrut parts the givens filled all 600 chars,
 * so the part being asked about never reached the model. Nothing failed: the
 * model just re-solved those questions from scratch, and got some wrong.
 *
 * A new question longer than the caps fails HERE. Raise FOCUS_QUESTION_CAP /
 * FOCUS_SOLUTION_CAP and MAX_CONTEXT_LEN together — never one of them.
 */

import { allLessonKeys, getLesson } from '../content/lessons';
import type { BagrutQuestionPart, PracticeQuestion } from '../content/lessons/types';
import {
  renderFocusContext,
  partAsQuestion,
  partQuestionText,
  FOCUS_QUESTION_CAP,
  FOCUS_SOLUTION_CAP,
} from '../lib/tutor-presence';
import { stripFigureFences } from '../lib/geo-figure';
import { MAX_CONTEXT_LEN } from '../lib/agents/config';
import { SNAPSHOT_MAX_LEN } from '../lib/tutor-context';

let checks = 0;
let failures = 0;
function assert(cond: boolean, msg: string) {
  checks++;
  if (cond) console.log(`PASS  ${msg}`);
  else {
    failures++;
    console.log(`FAIL  ${msg}`);
  }
}

// ---- the corpus: every practice question and every lesson bagrut question ----
type Bagrut = { id: string; context?: string; parts: BagrutQuestionPart[] };
const practice = new Map<string, PracticeQuestion>();
const bagrut = new Map<string, Bagrut>();
function walk(v: unknown, seen = new Set<unknown>()) {
  if (!v || typeof v !== 'object' || seen.has(v)) return;
  seen.add(v);
  const o = v as Record<string, unknown>;
  const steps = (o.solution as { steps?: unknown } | undefined)?.steps;
  if (typeof o.id === 'string' && typeof o.question === 'string' && Array.isArray(steps)) {
    practice.set(o.id, o as unknown as PracticeQuestion);
  }
  if (typeof o.id === 'string' && Array.isArray(o.parts) && typeof o.context === 'string') {
    bagrut.set(o.id, o as unknown as Bagrut);
  }
  for (const child of Object.values(o)) walk(child, seen);
}
for (const { subject, topic } of allLessonKeys()) walk(getLesson(subject, topic));

// Sanity: a walker that found nothing would pass every check below.
assert(practice.size > 1500, `the walk found the practice corpus (${practice.size} questions)`);
assert(bagrut.size > 100, `the walk found the lesson bagrut questions (${bagrut.size})`);

// ---- 1 + 2: nothing is cut ----
const cutQuestion: string[] = [];
const cutSteps: string[] = [];
let longest = { id: '', len: 0 };

function check(id: string, questionText: string, question: PracticeQuestion) {
  const brief = renderFocusContext({ where: 'gate', questionText, question } as never);
  if (!brief.includes(`q: ${questionText}`)) cutQuestion.push(id);
  const steps = question.solution?.steps ?? [];
  if (steps.some((s, i) => !brief.includes(`${i + 1}. ${stripFigureFences(s)}`))) cutSteps.push(id);
  if (brief.length > longest.len) longest = { id, len: brief.length };
}

for (const q of practice.values()) check(q.id, q.question, q);
let partCount = 0;
for (const b of bagrut.values()) {
  for (const part of b.parts) {
    partCount++;
    check(`${b.id}/${part.label}`, partQuestionText(b.context, part), partAsQuestion(part, { questionId: b.id }));
  }
}

assert(
  cutQuestion.length === 0,
  `every question text reaches the model whole (${practice.size} questions + ${partCount} parts; cut: ${cutQuestion.slice(0, 5).join(', ') || 'none'})`
);
assert(
  cutSteps.length === 0,
  `every solution step reaches the model (cut: ${cutSteps.slice(0, 5).join(', ') || 'none'})`
);

// ---- 3: the worst case still leaves the snapshot in ----
// The corpus's longest brief, then every optional block at its largest: a long
// wrong/correct answer (cut to 80 each), a full REVEALED list, STUCK, and three
// AUTHORED entries at their caps.
const worst = (() => {
  const all = [...practice.values()];
  const q =
    all.find((x) => x.id === longest.id) ??
    (() => {
      const [bid, label] = longest.id.split('/');
      const b = bagrut.get(bid)!;
      const part = b.parts.find((p) => p.label === label)!;
      return partAsQuestion(part, { questionId: bid });
    })();
  const questionText =
    practice.get(longest.id)?.question ??
    (() => {
      const [bid, label] = longest.id.split('/');
      const b = bagrut.get(bid)!;
      return partQuestionText(b.context, b.parts.find((p) => p.label === label)!);
    })();
  return renderFocusContext(
    { where: 'gate', questionText, question: q, wrongAnswer: 'x'.repeat(200), correctAnswer: 'y'.repeat(200) } as never,
    {
      revealed: Array.from({ length: 10 }, () => 'first-step'),
      stuck: true,
      candidates: Array.from({ length: 5 }, () => ({ q: 'q'.repeat(300), a: 'a'.repeat(800) })),
    }
  );
})();
const total = worst.length + 2 + SNAPSHOT_MAX_LEN;
assert(
  total <= MAX_CONTEXT_LEN,
  `the longest brief (${longest.id}, ${worst.length} chars with every optional block) + snapshot ${SNAPSHOT_MAX_LEN} = ${total} ≤ MAX_CONTEXT_LEN ${MAX_CONTEXT_LEN}`
);
assert(
  FOCUS_QUESTION_CAP < MAX_CONTEXT_LEN && FOCUS_SOLUTION_CAP < MAX_CONTEXT_LEN,
  'each focus cap is below the whole-context cap'
);

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
