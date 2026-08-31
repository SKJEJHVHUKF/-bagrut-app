/**
 * test-general-faq.ts — the topic-free bank, and the fence around it.
 *
 *   npx tsx scripts/test-general-faq.ts
 *
 * FREE. Content plus pure functions.
 *
 * ============================================================
 * WHAT IS ACTUALLY BEING GUARDED
 * ============================================================
 * Itay asked for two things in one sentence: a bank for questions that belong
 * to no topic, and separate entry points "כך שהבנקים לא מתערבבים וכך הוא לא
 * יקבל תשובה אחרת".
 *
 * The second is the risky half. Three pools now exist:
 *
 *   answerFromFaq    the question's own unit, then its sub-topic   (needs a question)
 *   answerTopicFaq   the whole topic                               (no question)
 *   answerGeneralFaq no topic at all                               (no question)
 *
 * A general answer about study method served to a student staring at an
 * exercise is exactly the "תשובה אחרת" he means. So this asserts the FENCES,
 * not just the hits.
 */

import { answerTopicFaq, answerGeneralFaq } from '../lib/tutor-faq';
import { GENERAL_FAQ } from '../content/tutor-faq/general';

let failed = 0;
const ok = (cond: boolean, name: string) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  x   ${name}`); }
};

(async () => {
  console.log('\n=== the general bank answers what it was written for ===\n');
  for (const [msg, id] of [
    ['איך כדאי ללמוד למתמטיקה', 'how-to-study'],
    ['מה לעשות כשאני נתקע בשאלה', 'stuck'],
    ['מה יש בדף הנוסחאות', 'formula-sheet'],
    ['איך יודעים באיזו נוסחה להשתמש', 'read-question'],
    ['למה אני עושה טעויות טיפשיות', 'mistakes'],
    ['כמה זמן ביום צריך לתרגל', 'time'],
    ['מקבלים נקודות על דרך גם בלי תשובה סופית', 'partial-credit'],
    ['איך עובדת האפליקציה הזאת', 'app-how'],
    ['אפשר לסמוך על התשובות שלך', 'verified'],
    ['איך בודקים שהתשובה נכונה', 'check-answer'],
  ] as const) {
    const hit = await answerGeneralFaq(msg);
    ok(hit?.faqId === `general#${id}`, `"${msg}" → ${id} (got ${hit?.faqId ?? 'null'})`);
  }

  console.log('\n=== and refuses what belongs to a topic or to a question ===\n');
  // ⚠️ THE FENCE. A general answer about method is the wrong answer to a
  // question about maths, and it would be delivered with the same confidence.
  for (const msg of [
    'מה זה הסתברות מותנית',
    'איך מחשבים סטיית תקן',
    'מאיפה הגיע ה-60 בשלב השני',
    'למה כאן מכפילים ולא מחברים',
    'תן לי רמז לשאלה הזאת',
  ]) {
    const hit = await answerGeneralFaq(msg);
    ok(hit === null, `"${msg}" → null`);
  }

  console.log('\n=== the topic bank stays inside its topic ===\n');
  {
    // Taken from the bank itself rather than invented: a test that guesses at
    // content measures the guess.
    const bank = (await import('../content/tutor-faq/math5/probability')).default as Record<string, Array<{ kind: string; q: string }>>;
    const sample = Object.values(bank).flat().find((f) => f.kind === 'concept');
    const hit = sample ? await answerTopicFaq(sample.q, 'הסתברות') : null;
    ok(hit !== null, `a probability concept question from the bank is answered (${sample?.q ?? 'none'})`);
    // ⚠️ CHECKED AGAINST THE BANK'S OWN UNIT KEYS, not a prefix I invented.
    // The first version asserted `startsWith('prob')` and failed on
    // `cq-prob-L1-01#1` — an entry from the concept-quiz units, which live in
    // this same bank. The assertion was wrong, the code was right, and a
    // guessed prefix is exactly how a test ends up measuring the guess.
    const units = new Set(Object.keys(bank));
    ok(
      hit === null || units.has(String(hit.faqId).split('#')[0]),
      `and the entry comes from that bank (${hit?.faqId ?? '-'})`,
    );
  }
  {
    // ⚠️ A TOPIC IS REQUIRED. Without one this must not fall back to "some
    // bank" — that is precisely the mixing Itay asked to prevent.
    const hit = await answerTopicFaq('מה זה הסתברות מותנית', '');
    ok(hit === null, 'with no topic, the topic bank answers nothing at all');
  }

  console.log('\n=== the bank itself is well-formed ===\n');
  {
    const ids = GENERAL_FAQ.map((f) => f.id);
    ok(new Set(ids).size === ids.length, `all ${ids.length} ids are unique`);
    ok(GENERAL_FAQ.every((f) => f.alts.length >= 3), 'every entry carries at least 3 alternate phrasings');
    ok(GENERAL_FAQ.every((f) => f.a.trim().length > 80), 'no entry is a one-liner');
    // ⚠️ NOTHING PERSONAL AND NOTHING DATED. This bank is keyed to nothing, so
    // an entry that is true for one student or one month is served to everyone,
    // forever. See the file header.
    const dated = GENERAL_FAQ.filter((f) => /\b20\d\d\b|במאי|ביוני|בקיץ|מועד [אב]'/.test(f.a));
    ok(dated.length === 0, dated.length === 0 ? 'no entry names a date or a מועד' : `dated: ${dated.map((f) => f.id).join(', ')}`);
    const personal = GENERAL_FAQ.filter((f) => /הציון שלך|היעד שלך|התוכנית שלך|נותרו לך/.test(f.a));
    ok(personal.length === 0, personal.length === 0 ? 'no entry claims to know this student' : `personal: ${personal.map((f) => f.id).join(', ')}`);
  }

  console.log(
    failed === 0
      ? '\nOK general faq: answers what it owns, refuses what it does not\n'
      : `\nFAILED: ${failed}\n`,
  );
  process.exitCode = failed === 0 ? 0 : 1;
})();
