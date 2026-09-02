/**
 * test-school.ts — the join code, and what a teacher may point at.
 *
 *   npx tsx scripts/test-school.ts
 *
 * WHY THIS EXISTS
 * Two things stand between a teacher and a class that silently does not work:
 *
 *   lib/join-code — read aloud in a room and typed by thirty people at once. If
 *   `normalize` does not fold O onto zero, a third of the class "cannot join"
 *   and the teacher blames the app, in front of them.
 *
 *   lib/focus-target — a focus naming a topic that does not exist does not
 *   throw. It creates a task that can never reach 100%, and the STUDENT is the
 *   one who looks like he did not do it. The catalogue check is the only thing
 *   that stops a typo becoming a child's problem.
 */

import {
  normalizeJoinCode,
  isValidJoinCode,
  formatJoinCode,
  generateJoinCode,
  JOIN_CODE_LENGTH,
} from '../lib/join-code';
import { validateFocus, focusCatalogue, describeFocus, RUNG_LABEL } from '../lib/focus-target';

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

/** The 500-sample loop below would otherwise print 1,500 identical lines.
 *  Collect failures and report each property once. */
const onceFailed = new Set<string>();
function assert_once(cond: boolean, msg: string) {
  if (!cond) onceFailed.add(msg);
}

// ============================================================
// The join code survives a classroom
// ============================================================
{
  assert(normalizeJoinCode('k7m4pq') === 'K7M4PQ', 'lowercase is folded — nobody types in caps');
  assert(normalizeJoinCode('K7M-4PQ') === 'K7M4PQ', 'the display dash is stripped on the way back in');
  assert(normalizeJoinCode(' K7M 4PQ ') === 'K7M4PQ', 'spaces from a copy-paste are stripped');
  assert(
    normalizeJoinCode('O7M4PQ') === '07M4PQ',
    'a letter O typed for a zero still joins the class — this is the one that breaks a lesson'
  );
  assert(normalizeJoinCode('I7M4PQ') === '17M4PQ', 'an I typed for a one still joins');
  assert(normalizeJoinCode('l7m4pq') === '17M4PQ', 'and so does a lowercase l');

  assert(isValidJoinCode('K7M-4PQ'), 'the display form validates');
  assert(!isValidJoinCode('K7M4P'), 'five characters is not a code');
  assert(!isValidJoinCode('K7M4PQZ2'), 'eight characters is not a code');
  assert(!isValidJoinCode(''), 'empty is not a code');
  assert(!isValidJoinCode('!!!!!!'), 'punctuation is not a code');
  assert(formatJoinCode('K7M4PQ') === 'K7M-4PQ', 'the dash is added for display only');
  assert(
    normalizeJoinCode(formatJoinCode('K7M4PQ')) === 'K7M4PQ',
    'format then normalize is the identity — one spelling ever reaches the database'
  );

  const seen = new Set<string>();
  for (let i = 0; i < 500; i++) {
    const c = generateJoinCode();
    assert_once(c.length === JOIN_CODE_LENGTH, 'every generated code is the right length');
    assert_once(isValidJoinCode(c), 'every generated code validates');
    assert_once(!/[ILOU]/.test(c), 'no generated code contains I, L, O or U');
    seen.add(c);
  }
  assert(seen.size >= 495, `500 codes produced ${seen.size} distinct values — no obvious clustering`);
}

for (const msg of [
  'every generated code is the right length',
  'every generated code validates',
  'no generated code contains I, L, O or U',
]) {
  assert(!onceFailed.has(msg), msg + ' (500 samples)');
}

// ============================================================
// The catalogue is real content, not a hand-kept list
// ============================================================
const catalogue = focusCatalogue();
{
  assert(catalogue.length > 0, 'the catalogue is not empty — a teacher has something to point at');

  const withSubs = catalogue.filter((c) => c.subTopics.length > 0);
  assert(withSubs.length > 0, 'at least one topic has authored sub-topics');

  const everyRungReal = withSubs.every((c) =>
    c.subTopics.every((s) => s.rungs.every((r) => r in RUNG_LABEL))
  );
  assert(everyRungReal, 'every offered rung is one the app knows how to render');

  const noEmptyOffer = withSubs.every((c) => c.subTopics.every((s) => s.rungs.length > 0));
  assert(
    noEmptyOffer,
    'no sub-topic is offered with zero rungs — that would send a class at an empty screen'
  );
}

// ============================================================
// Validation: a typo is refused, in words a teacher can act on
// ============================================================
{
  const real = catalogue.find((c) => c.subTopics.length > 0)!;
  const sub = real.subTopics[0];
  const rung = sub.rungs[0];

  const whole = validateFocus({ topic: real.topic });
  assert(whole.ok, 'a whole topic is a legal target');

  const scoped = validateFocus({ topic: real.topic, subTopicId: sub.id, rung });
  assert(scoped.ok, 'topic + sub-topic + a rung that exists is legal');
  assert(
    scoped.ok && scoped.target.rung === rung && scoped.target.subTopicId === sub.id,
    'and comes back normalised, ready to write'
  );

  const badTopic = validateFocus({ topic: 'נושא שלא קיים' });
  assert(!badTopic.ok, 'a topic that is not in the content is refused');
  assert(
    !badTopic.ok && /לא קיים בתוכן/.test(badTopic.reason),
    'and the reason names what is wrong, in Hebrew, to the teacher'
  );

  const badSub = validateFocus({ topic: real.topic, subTopicId: 'no-such-sub' });
  assert(!badSub.ok, 'a sub-topic that does not belong to the topic is refused');

  const badRung = validateFocus({ topic: real.topic, subTopicId: sub.id, rung: 'impossible' });
  assert(!badRung.ok, 'a rung that does not exist is refused');

  const rungWithoutSub = validateFocus({ topic: real.topic, rung });
  assert(
    !rungWithoutSub.ok,
    'a rung without a sub-topic is refused rather than silently dropped — the teacher asked for a level'
  );

  const missingRung = (['learn', 'easy', 'mid', 'hard', 'ghost', 'bagrut'] as const).find(
    (r) => !sub.rungs.includes(r)
  );
  if (missingRung) {
    const r = validateFocus({ topic: real.topic, subTopicId: sub.id, rung: missingRung });
    assert(!r.ok, 'a rung this sub-topic has no content for is refused');
  } else {
    assert(true, '(this sub-topic has every rung — nothing to refuse)');
  }

  assert(validateFocus({}).ok === false, 'an empty selection is refused');
  assert(validateFocus({ topic: '   ' }).ok === false, 'whitespace is not a topic');
}

// ============================================================
// One wording, everywhere
// ============================================================
{
  const d = describeFocus({ topic: 'סדרות', subTopicId: 'seq-arith', rung: 'mid' }, 'סדרה חשבונית');
  assert(d === 'סדרות · סדרה חשבונית · ביסוס', 'the description reads as the roadmap words it');
  assert(
    describeFocus({ topic: 'סדרות', subTopicId: null, rung: null }) === 'סדרות',
    'a whole-topic focus describes as just the topic'
  );
}

// ============================================================
console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.log(`${failures} FAILURE(S)`);
  process.exit(1);
}
