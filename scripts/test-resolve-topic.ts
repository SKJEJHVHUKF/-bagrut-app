/**
 * test-resolve-topic.ts — a wrong topic is worse than no topic.
 *
 *   npx tsx scripts/test-resolve-topic.ts
 *
 * FREE. One pure function and the curriculum.
 *
 * Resolving the WRONG topic grounds the tutor in one subject's verified
 * material while the student asks about another — a confident wrong answer.
 * Resolving NONE costs a model call with the generic map. So every assertion
 * here is asymmetric: a miss is acceptable, a mis-resolve is a failure.
 */

import { resolveTopic, TOPIC_PHRASES } from '../lib/resolve-topic';
import { MATH5_CURRICULUM } from '../content/bagrut-curriculum';

let failed = 0;
const ok = (cond: boolean, name: string) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  x   ${name}`); }
};

console.log('\n=== the real messages this was built for ===\n');
// Verbatim from the trace, 2026-08-31 14:23-14:29, $0.0461 for seven turns.
for (const [msg, want] of [
  ['בכלל עובד על הסתברות', 'הסתברות'],
  ['שליפה עם החזרה', 'הסתברות'],
  ['תסביר את הסתברות', 'הסתברות'],
  ['מה זה סדרה הנדסית', 'סדרות'],
  ['איך משתמשים במשפט הסינוסים', 'טריגונומטריה'],
  ['מה זו נגזרת', 'חשבון דיפרנציאלי'],
  ['איך מחשבים סטיית תקן', 'סטטיסטיקה'],
] as const) {
  ok(resolveTopic(msg) === want, `"${msg}" → ${want} (got ${resolveTopic(msg)})`);
}

console.log('\n=== and everything it must REFUSE ===\n');
for (const msg of [
  'תסביר משהו מהחומר',
  'אה הבנתי',
  'על מה כדאי לעבוד עכשיו',
  'לא יודע מה התשובה',
  'איזה תרגיל כדי לתרגל',
  '',
  // ⚠️ TWO TOPICS IS A COMPARISON, and neither one's material grounds it.
  'מה ההבדל בין סדרות להסתברות',
  'איך קשור סינוס לנגזרת',
]) {
  ok(resolveTopic(msg) === null, `"${msg}" → null`);
}

console.log('\n=== every phrase resolves to exactly ONE topic ===\n');
// ⚠️ THE ASSERTION THAT KEEPS THE LIST HONEST. A phrase that appears in two
// topics' vocabularies silently resolves to whichever sorts first, which is a
// mis-resolve wearing the mask of a match. "פונקציה" is absent for this reason;
// this fails the moment somebody adds it.
{
  const seen = new Map<string, string>();
  const clashes: string[] = [];
  for (const { topic, phrase } of TOPIC_PHRASES) {
    const prev = seen.get(phrase);
    if (prev && prev !== topic) clashes.push(`"${phrase}" claimed by both ${prev} and ${topic}`);
    else seen.set(phrase, topic);
  }
  ok(clashes.length === 0, clashes.length === 0 ? 'no phrase is claimed by two topics' : clashes.join(' · '));

  // And no phrase may be a substring of a DIFFERENT topic's phrase, which is
  // the same bug one level down: "מעריכית" inside "פונקציה מעריכית" is fine,
  // "סינוס" inside "משפט הסינוסים" is fine — both are the same topic. Across
  // topics it is not.
  const cross: string[] = [];
  for (const a of TOPIC_PHRASES) {
    for (const b of TOPIC_PHRASES) {
      if (a.topic === b.topic || a.phrase === b.phrase) continue;
      if (b.phrase.includes(a.phrase)) cross.push(`"${a.phrase}" (${a.topic}) sits inside "${b.phrase}" (${b.topic})`);
    }
  }
  ok(cross.length === 0, cross.length === 0 ? 'no phrase hides inside another topic\'s phrase' : cross.slice(0, 3).join(' · '));
}

console.log('\n=== a resolved topic is a REAL topic ===\n');
// A key that no lesson knows is worse than null: it would ask for grounding
// that does not exist and quietly get none.
{
  const keys = new Set(MATH5_CURRICULUM.map((t) => String((t as { key?: unknown }).key ?? '')));
  const bad = [...new Set(TOPIC_PHRASES.map((p) => p.topic))].filter((t) => !keys.has(t));
  ok(bad.length === 0, bad.length === 0 ? 'every phrase points at a curriculum key' : `unknown topics: ${bad.join(', ')}`);
}

console.log(
  failed === 0
    ? '\nOK resolve-topic: certain or silent, never wrong\n'
    : `\nFAILED: ${failed}\n`,
);
process.exitCode = failed === 0 ? 0 : 1;
