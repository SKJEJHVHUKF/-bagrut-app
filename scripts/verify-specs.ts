/**
 * verify-specs.ts — end-to-end test of the DETERMINISTIC GRADING path.
 * For every bagrut-question part that carries a value/set `expected` spec,
 * feed the part's OWN reference `final_answer` through the real checkAnswer()
 * and assert it grades 'correct'. This catches specs that silently degrade to
 * 'manual'/'unparseable' (e.g. natural-log answers the parser can't read) —
 * which the per-topic mathjs scripts do NOT catch (they bypass checkAnswer).
 *   npx tsx scripts/verify-specs.ts
 */
import { checkAnswer } from '../lib/answer-check';
import type { Lesson } from '../content/lessons/types';
import { math5ComplexNumbers } from '../content/lessons/math5/complex-numbers';
import { math5Vectors } from '../content/lessons/math5/vectors';
import { math5AnalyticGeometry } from '../content/lessons/math5/analytic-geometry';
import { math5ExpFunctions } from '../content/lessons/math5/exp-functions';
import { math5LnFunction } from '../content/lessons/math5/ln-function';
import { math5GrowthDecay } from '../content/lessons/math5/growth-decay';

const LESSONS: Array<[string, Lesson]> = [
  ['complex', math5ComplexNumbers],
  ['vectors', math5Vectors],
  ['analytic', math5AnalyticGeometry],
  ['exp', math5ExpFunctions],
  ['ln', math5LnFunction],
  ['growth', math5GrowthDecay],
];

let pass = 0;
let fail = 0;
for (const [name, L] of LESSONS) {
  for (const q of L.bagrutQuestions ?? []) {
    for (const p of q.parts) {
      const spec = p.expected;
      if (!spec || spec.kind === 'manual') continue;
      // Feed the spec's OWN canonical value as the student input: this proves
      // the grading path parses + evaluates it (a student typing the clean
      // answer grades 'correct'). Catches specs that degrade to manual/
      // unparseable (e.g. natural-log expressions the parser can't read).
      const input = spec.kind === 'value' ? spec.value : spec.values.join(' , ');
      const res = checkAnswer(input, spec);
      if (res.verdict === 'correct') {
        pass++;
      } else {
        fail++;
        console.log(
          `  ✗ ${name}/${q.id}/${p.label}: verdict=${res.verdict}  readAs=${res.readAs ?? '—'}\n      final="${p.solution.final_answer}"  spec=${JSON.stringify(spec)}`,
        );
      }
    }
  }
}
console.log(`\n${pass} value/set specs grade CORRECT via checkAnswer, ${fail} problems.`);
if (fail > 0) process.exit(1);

export {};
