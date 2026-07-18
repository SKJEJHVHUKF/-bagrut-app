/**
 * verify-concept.ts — structural check for the static concept-quiz bank.
 * (Answer-correctness is verified by hand; this catches shape mistakes.)
 *
 *   npx tsx scripts/verify-concept.ts
 */
import { CONCEPT_582 } from '../content/concept-quiz/582';

const FIELDS = ['why_correct', 'why_wrong', 'concept', 'remember'] as const;

let problems = 0;
let count = 0;
const ids = new Set<string>();

for (const [topic, qs] of Object.entries(CONCEPT_582)) {
  if (!Array.isArray(qs) || qs.length === 0) {
    console.log(`FAIL topic "${topic}": no questions`);
    problems++;
    continue;
  }
  for (const q of qs) {
    count++;
    if (ids.has(q.id)) {
      console.log(`FAIL ${q.id}: duplicate id`);
      problems++;
    }
    ids.add(q.id);
    if (!Array.isArray(q.answers) || q.answers.length !== 4) {
      console.log(`FAIL ${q.id}: must have exactly 4 answers`);
      problems++;
    }
    if (typeof q.correct !== 'number' || q.correct < 0 || q.correct > 3) {
      console.log(`FAIL ${q.id}: correct index out of range (${q.correct})`);
      problems++;
    }
    if (!q.question || q.question.trim().length === 0) {
      console.log(`FAIL ${q.id}: empty question`);
      problems++;
    }
    for (const f of FIELDS) {
      if (!q.explanation?.[f] || q.explanation[f].trim().length === 0) {
        console.log(`FAIL ${q.id}: missing explanation.${f}`);
        problems++;
      }
    }
  }
}

console.log(`\n${count} concept questions checked, ${problems} problems.`);
process.exit(problems > 0 ? 1 : 0);
