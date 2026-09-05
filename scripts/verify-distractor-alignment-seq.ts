/**
 * verify-distractor-alignment-seq.ts — cq-seq-L2-02, the one distractor note
 * whose named mistake landed on a DIFFERENT option.
 *
 * WHY THIS EXISTS. `verify-distractors` checks STRUCTURE and says so in its own
 * header: it cannot tell that note i describes option i, and it calls a
 * misaligned array worse than no array, "because the student is confidently
 * told about a mistake they did not make". This is one such case, found by
 * re-deriving the arithmetic rather than by reading:
 *
 *   question   a1 = -48, d = 4, where is the first POSITIVE term?  (answer 14)
 *   note on 12 blamed "a_n = -48 + 4n" (n instead of n-1) — but that slip
 *              gives 13, not 12, and the note then "verified" itself with
 *              -48 + 11*4, which is the CORRECT formula.
 *
 * What really produces 12 is counting the JUMPS from -48 up to zero
 * (48 : 4 = 12) and reporting that as a place; twelve jumps land on place 13,
 * where the term is 0, and zero is not positive.
 *
 * Every number below is COMPUTED from the question's own data — a check whose
 * two sides are the same literal proves nothing.
 *
 * Run: npx tsx scripts/verify-distractor-alignment-seq.ts
 */
import { getConceptQuestions, CONCEPT_LEVELS, conceptBankEntries } from '../content/concept-quiz';

const a1 = -48, d = 4;
const a = (n: number) => a1 + (n - 1) * d;      // the correct general term
const shifted = (n: number) => a1 + d * n;      // the n-instead-of-(n-1) slip

let pass = 0, fail = 0;
const check = (label: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++;
  else fail++;
  if (!ok) console.log(`  FAIL ${label} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
};

const firstPositive = (f: (n: number) => number) =>
  [...Array(40).keys()].map((i) => i + 1).find((n) => f(n) > 0);

// --- the maths behind each option, re-derived from a1 and d ---
check('correct answer is place 14', firstPositive(a), 14);
check('a(13) = 0, the boundary trap', a(13), 0);
check('a(12) = -4, still negative', a(12), -4);
check('a(14) = 4, the first positive', a(14), 4);
check('48 / d = 12 jumps', Math.abs(a1) / d, 12);
check('12 jumps land on place 13', a(1 + 12), 0);
// the mistake the OLD note named lands on 13 — this is the defect that was fixed
check('the n-instead-of-(n-1) slip gives 13, NOT 12', firstPositive(shifted), 13);
check('the shifted formula at 12 is 0, so it could not verify 12 either', shifted(12), 0);

// --- the notes as they now stand ---
const q = conceptBankEntries()
  .filter((e) => e.subject === 'math5' && e.topic === 'סדרות')
  .flatMap((e) => CONCEPT_LEVELS.flatMap((l) => getConceptQuestions(e.subject, e.topic, l)))
  .find((x) => x.id === 'cq-seq-L2-02');
if (!q) {
  console.log('cq-seq-L2-02 not found — the question was renamed or removed');
  process.exit(1);
}

const notes = q.distractorNotes ?? [];
check('four options', q.answers?.length, 4);
check('correct index is 14', q.answers?.[q.correct as number], '$14$');
check('note on the correct option is empty', notes[q.correct as number], '');
check('note[0] no longer blames the n-vs-(n-1) substitution', /הוצב \$a_n=-48\+4n\$/.test(notes[0] ?? ''), false);
check('note[0] names the jump count', /48:4=12/.test(notes[0] ?? ''), true);
check('note[0] says the jumps land on place 13', /a_\{13\}=0/.test(notes[0] ?? ''), true);
check('why_wrong bullet for 12 matches the note', /48:4=12/.test(q.explanation?.why_wrong ?? ''), true);
check('why_wrong no longer blames the substitution for 12', /\$12\$: הוצב \$n\$ במקום/.test(q.explanation?.why_wrong ?? ''), false);
for (const [i, n] of notes.entries()) {
  if (i === q.correct) continue;
  check(`note[${i}] is substantive`, (n ?? '').length > 20, true);
}

console.log(`cq-seq-L2-02 distractor alignment: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
