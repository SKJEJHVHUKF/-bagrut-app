/**
 * test-derive-expected.ts — the derived grade must never be wrong.
 *
 *   npx tsx scripts/test-derive-expected.ts
 *
 * FREE. Content plus two pure functions.
 *
 * ============================================================
 * THE ONLY FAILURE THAT MATTERS HERE
 * ============================================================
 * A derived spec that grades a CORRECT student as wrong. That is worse than
 * paying for the turn, worse than saying nothing, and it happens silently —
 * the student sees a confident "לא, נסה שוב" and has no way to argue.
 *
 * So this runs the derivation over EVERY question in the curriculum and, for
 * each one it accepts, grades the authored final answer against the derived
 * spec. If a question's own answer does not pass its own derived spec, the
 * derivation is wrong about that question and the whole thing fails.
 *
 * The named traps below are the three shapes the first version got wrong on
 * real content. They are asserted by name so nobody re-loosens a rule and
 * rediscovers them in production.
 */

import { deriveExpected } from '../lib/derive-expected';
import { checkAnswer } from '../lib/answer-check';
import { getLesson, allLessonKeys } from '../content/lessons';

let failed = 0;
const ok = (cond: boolean, name: string) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  x   ${name}`); }
};

const withAnswer = (finalAnswer: string) => ({ solution: { finalAnswer } });

console.log('\n=== the three shapes that must stay REFUSED ===\n');
// Each of these was ACCEPTED by the first version, on real content.
const traps: Array<[string, string]> = [
  ['$x_1 = 3, \\; x_2 = 4$', 'two answers in one island — grading the last one fails a student who typed the first'],
  ['$x^2 - 5x + 6 = 0$', 'that is the equation, not its answer'],
  ['$-3 < x < 3$', 'an interval is not a value'],
  ['$m = 4$ או $m = -2$', 'the word "או" announces two answers'],
  ['שני פתרונות: $(3, 4)$ ו-$(4, 3)$', 'two ordered pairs'],
  ['אין פתרון ממשי', 'prose, not a value'],
  ['$x < -1$ או $x \\ge 2$', 'two intervals'],
  ['$x = 3$ ו-$y = 4$', 'two islands, two answers'],
  // ⚠️ FOUND BY THE SELF-GRADE SWEEP, NOT BY IMAGINATION. It cleared every
  // rule — one island, one equals, a name on the left — and latexToMathjs
  // turned it into "2*pm sqrt(5)", which parses. Either root would have been
  // graded against nonsense.
  ['$x = 2 \\pm \\sqrt{5}$', 'plus-minus is two answers wearing one symbol'],
];
for (const [fa, why] of traps) {
  ok(deriveExpected(withAnswer(fa)) === null, `refused: "${fa}" — ${why}`);
}

console.log('\n=== and the shapes that must be ACCEPTED ===\n');
for (const [fa, want] of [
  ['$x = 4$', '4'],
  ['$m = 5$', '5'],
  ['$BC = 12.36$', '12.36'],
  ['$S_4 = 80$', '80'],
] as const) {
  const spec = deriveExpected(withAnswer(fa));
  ok(
    spec?.kind === 'value' && String((spec as { value: unknown }).value).includes(want),
    `accepted: "${fa}" → ${String((spec as { value?: unknown })?.value ?? 'null')}`,
  );
}

console.log('\n=== an authored spec always wins, including `manual` ===\n');
ok(
  deriveExpected({ expected: { kind: 'manual' }, solution: { finalAnswer: '$x = 4$' } }) === null,
  'a `manual` question is never overridden — the author said it cannot be graded',
);
ok(
  deriveExpected({ expected: { kind: 'value', value: '7' }, solution: { finalAnswer: '$x = 4$' } }) === null,
  'an existing spec is never second-guessed',
);

console.log('\n=== EVERY question in the curriculum grades its own answer ===\n');
// ⚠️ THE ASSERTION THAT EARNS THIS FILE. A derived spec that its own authored
// answer fails is a spec that will fail a correct student.
type Q = Record<string, unknown>;
const all: Q[] = [];
for (const { subject, topic } of allLessonKeys()) {
  const walk = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== 'object') return;
    const o = n as Q;
    if (typeof o.id === 'string' && typeof o.question === 'string') all.push({ ...o, __topic: topic });
    for (const v of Object.values(o)) walk(v);
  };
  walk(getLesson(subject, topic));
}

const perTopic = new Map<string, number>();
let derived = 0;
let selfFail = 0;
for (const q of all) {
  const spec = deriveExpected(q);
  if (!spec) continue;
  derived++;
  perTopic.set(String(q.__topic), (perTopic.get(String(q.__topic)) ?? 0) + 1);

  const own = String((spec as { value: unknown }).value);
  const verdict = checkAnswer(own, spec);
  if (verdict.verdict !== 'correct') {
    selfFail++;
    if (selfFail <= 5) {
      console.log(`  x   ${String(q.id)} (${String(q.__topic)}): derived "${own}" does not grade itself as correct`);
    }
  }
}
ok(selfFail === 0, `all ${derived} derived specs grade their own value as correct (${selfFail} failures)`);

console.log('\n=== coverage ===\n');
const authored = all.filter((q) => (q.expected as { kind?: string } | undefined)?.kind).length;
for (const [topic, n] of [...perTopic.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${topic.padEnd(22)} +${String(n).padStart(4)} gradable`);
}
console.log(
  `\n  ${authored} authored + ${derived} derived = ${authored + derived} of ${all.length} ` +
    `(${(((authored + derived) / all.length) * 100).toFixed(0)}%) gradable with no model call`,
);
console.log(`  ${all.length - authored - derived} still go to the model, deliberately.\n`);

console.log(
  failed === 0
    ? 'OK derive-expected: nothing is graded that could be graded wrong\n'
    : `FAILED: ${failed}\n`,
);
process.exitCode = failed === 0 ? 0 : 1;
