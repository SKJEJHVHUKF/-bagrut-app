/**
 * test-phrasing-variants.ts — the same question, said another way, for free.
 *
 *   npx tsx scripts/test-phrasing-variants.ts
 *
 * FREE. No model, no network, no database.
 *
 * ============================================================
 * WHAT IS BEING PROVED
 * ============================================================
 * Itay's requirement: a question answered by the model for ONE student must be
 * answered locally for the NEXT student who asks it in different words — and
 * producing those other words must not itself cost API.
 *
 * So this asserts the whole path with no library and no network: generate the
 * phrasings, index them the way `findLearnedAnswer` does, and fire re-wordings
 * at it. If this passes, the only thing between it and production is the table.
 *
 * ============================================================
 * THE NUMBER THAT MATTERS IS THE SECOND ONE
 * ============================================================
 * Right answers went 3 → 5 → 13 across three designs. Wrong answers are the
 * ones that decide: serving "למה מחלקים ב-12" the answer about dividing by 3 is
 * worse than paying for the call, because it explains an arithmetic step that
 * is not this student's, fluently. Every threshold and every screen here exists
 * to keep that column at zero.
 */

import { expandPhrasing, foreignNumber } from '../lib/phrasing-variants';
import { LIBRARY_THRESHOLD } from '../lib/tutor-answer-library';
import { buildFaqIndex, buildCorpusIdf, matchFaq } from '../lib/tutor-faq';
import type { TutorFaq } from '../content/tutor-faq/types';

let failed = 0;
const ok = (cond: boolean, name: string) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  x   ${name}`); }
};

console.log('\n=== the variants are grammar, not invention ===\n');
{
  const v = expandPhrasing('למה מחלקים ב3');
  ok(v.includes('למה לחלק ב3'), 'the infinitive form');
  ok(v.includes('מדוע מחלקים ב3'), 'the other opener');
  ok(v.includes('למה מחלקים בשלוש'), 'the digit written as a word');
  ok(!v.includes('למה מחלקים ב3'), 'never the original itself');
  ok(v.length <= 8, `capped (${v.length})`);
  // Deterministic: the same input twice must give the same list, or a row
  // regenerated tomorrow stops matching the row stored today.
  ok(
    expandPhrasing('למה מחלקים ב3').join('|') === expandPhrasing('למה מחלקים ב3').join('|'),
    'deterministic across calls',
  );
}
ok(expandPhrasing('').length === 0, 'an empty question expands to nothing');
ok(expandPhrasing('מה זה הפרש בסדרה').length === 0, 'a question with no known verb expands to nothing, rather than guessing');

console.log('\n=== a number the student named that the stored question did not ===\n');
ok(foreignNumber('למה מחלקים ב12', 'למה מחלקים ב3') === '12', 'a different divisor is foreign');
ok(foreignNumber('מאיפה הגיע ה99', 'מאיפה הגיע ה60') === '99', 'a different value is foreign');
ok(foreignNumber('למה מחלקים ב3', 'למה מחלקים ב3') === null, 'the same number is not');
ok(foreignNumber('למה צריך לחלק בשלוש', 'למה מחלקים ב3 למה מחלקים בשלוש') === null,
   'a number word is not foreign to its own digit');
ok(foreignNumber('למה מחלקים', 'למה מחלקים ב3') === null,
   'a question that names NO number is not foreign — only what the student adds counts');

console.log('\n=== the whole path, exactly as findLearnedAnswer runs it ===\n');
const stored = [
  'למה מחלקים ב3', 'מאיפה הגיע ה60', 'מה זה הפרש בסדרה', 'איך יודעים שזה נכון',
  'למה הטבלה בנויה ככה', 'מה קורה אם ההפרש שלילי', 'למה לא מחסרים', 'למה מכפילים ב3',
  'מה זה מנה בסדרה', 'מאיפה הגיע ה12', 'איך פותרים את זה', 'מה זה סכום אינסופי',
  'למה המקום חייב לצאת שלם', 'מה זה כלל נסיגה',
];
const entries: TutorFaq[] = stored.map((q, i) => ({
  id: `x#${i}`, kind: 'concept', q, alts: expandPhrasing(q), a: `תשובה ${i}`,
}));
const idf = buildCorpusIdf(entries.map((e) => [e.q, ...e.alts].join(' ')));
const index = buildFaqIndex(entries, { idf });

const find = (msg: string): string | null => {
  const hit = matchFaq(index, msg, { threshold: LIBRARY_THRESHOLD, minContentMatches: 1 });
  if (!hit) return null;
  if (foreignNumber(msg, [hit.faq.q, ...hit.faq.alts].join(' '))) return null;
  return entries.find((e) => e.a === hit.faq.a)?.q ?? null;
};

const cases: Array<[string, string | null]> = [
  // the same question, re-worded — these are the saved calls
  ['למה צריך לחלק בשלוש', 'למה מחלקים ב3'],
  ['מדוע מחלקים ב3', 'למה מחלקים ב3'],
  ['מאיפה יצא המספר 60', 'מאיפה הגיע ה60'],
  ['מה זה ההפרש של הסדרה', 'מה זה הפרש בסדרה'],
  ['איך אני בודק שזה נכון', 'איך יודעים שזה נכון'],
  ['למה בונים את הטבלה כך', 'למה הטבלה בנויה ככה'],
  ['מה יקרה כשההפרש הוא שלילי', 'מה קורה אם ההפרש שלילי'],
  ['למה מכפילים בשלוש', 'למה מכפילים ב3'],
  // ⚠️ and the ones that must come back with NOTHING
  ['למה מחלקים ב12', null],
  ['למה מחלקים ב7', null],
  ['מאיפה הגיע ה99', null],
  ['מה זה נגזרת', null],
  ['מתי הבגרות', null],
];
let right = 0, wrong = 0, missed = 0;
for (const [probe, want] of cases) {
  const got = find(probe);
  if (got === want) { right++; console.log(`  ok  "${probe}" → ${got ?? 'nothing'}`); }
  else if (got === null) { missed++; console.log(`  –   "${probe}" → nothing (wanted ${want})`); }
  else { wrong++; failed++; console.log(`  x   "${probe}" → ${got}  WANTED ${want ?? 'nothing'}`); }
}
console.log(`\n  right ${right}/${cases.length} · wrong ${wrong} · missed ${missed}`);
ok(wrong === 0, 'nothing was served the wrong answer — the column that decides');
ok(right >= 11, `at least 11 of ${cases.length} right (got ${right})`);

console.log(
  failed === 0
    ? '\nOK phrasings: the next student gets it free, and never gets the wrong one\n'
    : `\nFAILED: ${failed}\n`,
);
process.exitCode = failed === 0 ? 0 : 1;
