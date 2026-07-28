/**
 * verify-concept.ts — structural check for the static concept-quiz bank.
 *
 * ⚠️ THIS SCRIPT CANNOT TELL YOU AN ANSWER IS RIGHT. It checks shape only.
 * "84/84 passed" has never meant the mathematics is correct — every `correct`
 * index still has to be re-derived by hand. Don't cite a green run here as
 * evidence of accuracy.
 *
 * It now also enforces the teaching contract, because the bank failed it
 * badly: an audit found only 1 of 84 questions whose `why_wrong` addressed all
 * three distractors and 48 that addressed none, so a student who picked the
 * "wrong wrong answer" was handed an explanation of a mistake they didn't make.
 *   - distractorNotes must exist, be 4 long, and be non-empty for every option
 *     other than `correct`
 *   - why_correct must actually explain (>= 60 chars), not just assert
 *
 *   npx tsx scripts/verify-concept.ts
 */
import { CONCEPT_571 } from '../content/concept-quiz/571';
import { CONCEPT_582 } from '../content/concept-quiz/582';

const FIELDS = ['why_correct', 'why_wrong', 'concept', 'remember'] as const;
const MIN_WHY_CORRECT = 60;

let problems = 0;
let count = 0;
const ids = new Set<string>();

// One shared id namespace across both papers so a copy-paste collision is caught.
const ALL = { ...CONCEPT_571, ...CONCEPT_582 };

for (const [topic, qs] of Object.entries(ALL)) {
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

    // A takeaway under 60 chars is an assertion, not an explanation.
    if (q.explanation?.why_correct && q.explanation.why_correct.trim().length < MIN_WHY_CORRECT) {
      console.log(
        `FAIL ${q.id}: why_correct too thin (${q.explanation.why_correct.trim().length} < ${MIN_WHY_CORRECT}) — "${q.explanation.why_correct}"`,
      );
      problems++;
    }

    // Per-option notes: one per answer, filled for every distractor.
    const notes = (q as { distractorNotes?: string[] }).distractorNotes;
    if (!Array.isArray(notes) || notes.length !== 4) {
      console.log(`FAIL ${q.id}: distractorNotes must be an array of 4 (one per answer)`);
      problems++;
    } else {
      for (let i = 0; i < 4; i++) {
        if (i === q.correct) continue;
        if (!notes[i] || notes[i].trim().length < 20) {
          console.log(
            `FAIL ${q.id}: distractorNotes[${i}] missing/too short for answer "${q.answers?.[i]}"`,
          );
          problems++;
        }
      }
    }
  }
}

console.log(`\n${count} concept questions checked, ${problems} problems.`);
process.exit(problems > 0 ? 1 : 0);
