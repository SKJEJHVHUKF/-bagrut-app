/**
 * test-attempt.ts — the trust boundary in front of `public.attempts`.
 *
 *   npx tsx scripts/test-attempt.ts
 *
 * WHY THIS EXISTS
 * lib/attempt-row is the only thing standing between a posted JSON body and a
 * permanent, append-only row that a teacher will later be shown and act on. Its
 * failure modes are all quiet ones:
 *
 *   - a field renamed on one side of the map (subTopicId → sub_topic_id) makes
 *     a column go null for every student at once, and nothing throws;
 *   - a wrong `repeat` mapping lets replayed questions into ACCURACY, so
 *     re-doing a cleared rung raises a student's numbers on the teacher's board;
 *   - a device clock set to 2038 pins a row at the top of every "recent" list
 *     forever, and one set to 1970 hides it below every window;
 *   - a body that is missing `correct` writing `false` instead of being
 *     rejected turns "no answer" into "wrong answer" — the exact lie the whole
 *     table exists to prevent.
 *
 * So what is pinned here is the mapping, the rejects, and the clock clamp.
 */

import { attemptRow } from '../lib/attempt-row';

let checks = 0;
let failures = 0;
function assert(cond: boolean, msg: string) {
  checks++;
  if (cond) {
    console.log(`PASS  ${msg}`);
  } else {
    failures++;
    console.log(`FAIL  ${msg}`);
  }
}

const USER = '00000000-0000-4000-8000-000000000001';
const NOW = Date.UTC(2026, 8, 2, 12, 0, 0);

// ---- the happy path: every field lands in its column ----------------------
const full = attemptRow(
  {
    ts: NOW - 5000,
    subject: 'math',
    topic: 'סדרות',
    subTopicId: 'seq-arith',
    questionId: 'alg-003',
    source: 'drill',
    difficulty: 'mid',
    correct: false,
    repeat: true,
    hintUsed: true,
    selfReported: false,
    kind: 'open',
    chosenIndex: 2,
    optionCount: 4,
    answerDiagnosis: { kind: 'sign-flip', note: 'הפך סימן' },
  },
  USER,
  NOW
);

assert(full !== null, 'a complete event builds a row');
assert(full?.user_id === USER, 'user_id comes from the caller, not the body');
assert(full?.topic === 'סדרות', 'topic maps through');
assert(full?.sub_topic_id === 'seq-arith', 'subTopicId → sub_topic_id');
assert(full?.question_id === 'alg-003', 'questionId → question_id');
assert(full?.is_repeat === true, 'repeat → is_repeat, so replays stay out of accuracy');
assert(full?.hint_used === true, 'hintUsed → hint_used');
assert(full?.self_reported === false, 'selfReported false survives (it is not "missing")');
assert(full?.chosen_index === 2 && full?.option_count === 4, 'MCQ choice + option count map through');
assert(
  (full?.diagnosis as { kind?: string })?.kind === 'sign-flip',
  'answerDiagnosis → diagnosis, which is what makes a student card say WHERE he went wrong'
);
assert(full?.ts === NOW - 5000, 'a sane client timestamp is kept');

// ---- a user_id in the body cannot win --------------------------------------
const forged = attemptRow(
  { topic: 'סדרות', source: 'quiz', correct: true, user_id: 'someone-else' },
  USER,
  NOW
);
assert(forged?.user_id === USER, 'a user_id posted in the body is ignored');

// ---- the sources that are never measurements -------------------------------
// fix / scan / thinking are activity, never accuracy (NEVER_MEASURED in
// lib/results.ts). They must still be ACCEPTED — dropping them would put a hole
// in the activity history, which is what "has not logged in for 9 days" reads.
for (const source of ['fix', 'scan', 'thinking']) {
  assert(
    attemptRow({ topic: 'סדרות', source, correct: true }, USER, NOW) !== null,
    `source "${source}" is accepted — it is activity, not a measurement`
  );
}

// ---- the three rejects -----------------------------------------------------
assert(attemptRow({ source: 'quiz', correct: true }, USER, NOW) === null, 'no topic → rejected');
assert(attemptRow({ topic: 'x', correct: true }, USER, NOW) === null, 'no source → rejected');
assert(
  attemptRow({ topic: 'x', source: 'quiz' }, USER, NOW) === null,
  'a missing `correct` is rejected, never defaulted to false'
);
assert(
  attemptRow({ topic: 'x', source: 'quiz', correct: 'yes' }, USER, NOW) === null,
  'a truthy STRING is not a boolean answer'
);
assert(
  attemptRow({ topic: 'x', source: 'homework', correct: true }, USER, NOW) === null,
  'an unknown source is rejected rather than stored as a new vocabulary word'
);
assert(attemptRow(null, USER, NOW) === null, 'a null body is rejected');
assert(attemptRow('{}', USER, NOW) === null, 'a string body is rejected');

// ---- what degrades instead of rejecting ------------------------------------
const sparse = attemptRow({ topic: 'סדרות', source: 'quiz', correct: true }, USER, NOW);
assert(sparse !== null, 'an event from an older client, with only the three required fields, is kept');
assert(
  sparse?.subject === 'math5',
  'a missing subject defaults to math5 — the key the content and the practice routes actually use'
);
assert(
  sparse?.sub_topic_id === null && sparse?.difficulty === null && sparse?.diagnosis === null,
  'absent optional fields are null, not undefined — a jsonb column will not take undefined'
);
assert(sparse?.is_repeat === false && sparse?.hint_used === false, 'absent booleans are false, not null');
assert(
  attemptRow({ topic: 'x', source: 'quiz', correct: true, difficulty: 'brutal' }, USER, NOW)
    ?.difficulty === null,
  'an unknown difficulty is dropped, not stored — the attempt itself is still real'
);

// ---- the clock: the dedupe key rides on ts, so it cannot be absurd ---------
assert(
  attemptRow({ topic: 'x', source: 'quiz', correct: true, ts: 2145916800000 }, USER, NOW)?.ts === NOW,
  'a clock set to 2038 is replaced by the server clock, not trusted to the top of every recent list'
);
assert(
  attemptRow({ topic: 'x', source: 'quiz', correct: true, ts: 0 }, USER, NOW)?.ts === NOW,
  'a clock at the epoch is replaced, not left below every time window'
);
assert(
  attemptRow({ topic: 'x', source: 'quiz', correct: true, ts: NaN }, USER, NOW)?.ts === NOW,
  'NaN never reaches a bigint column'
);
assert(
  attemptRow({ topic: 'x', source: 'quiz', correct: true, ts: NOW + 5 * 60 * 1000 }, USER, NOW)?.ts ===
    NOW + 5 * 60 * 1000,
  'a few minutes of ordinary clock skew is tolerated, not flattened'
);

// ---- caps -------------------------------------------------------------------
const long = attemptRow(
  { topic: 'א'.repeat(500), source: 'quiz', correct: true, subject: 'ב'.repeat(500) },
  USER,
  NOW
);
assert((long?.topic.length ?? 0) <= 160, 'an oversized topic is clamped, not stored whole');
assert((long?.subject.length ?? 0) <= 40, 'an oversized subject is clamped');
assert(
  attemptRow(
    { topic: 'x', source: 'quiz', correct: true, answerDiagnosis: { note: 'x'.repeat(5000) } },
    USER,
    NOW
  )?.diagnosis === null,
  'a diagnosis over the cap is dropped while the attempt is still recorded'
);
assert(
  attemptRow({ topic: '   ', source: 'quiz', correct: true }, USER, NOW) === null,
  'a whitespace-only topic is empty, not a topic'
);

// ============================================================
console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
