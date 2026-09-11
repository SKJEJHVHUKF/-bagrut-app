/** POSITIVE tests for every detector in the מנה ושורש difficulty gate.
 *
 *  A detector that matches nothing is invisible: the gate stays green, the
 *  question simply scores lower, and it then gets blamed for restating an
 *  easier one. Six detectors in this repo shipped that way — five missing the
 *  definite article (האסימפטוטה האופקית), one written as `\\bg\(` which is a
 *  literal backslash and matched no content at all.
 *
 *  🔴 `\b` is NOT a fix for a Hebrew false positive: it is a boundary between
 *  \w ([A-Za-z0-9_]) and non-\w, and a Hebrew letter is not \w — so /\bאו\b/
 *  matches NOTHING, and the "fix" turns a false positive into a silent zero.
 *  Use /(?<!\p{L})WORD(?!\p{L})/u. Measured with claude-d9, 2026-09-06.
 *
 *  Run: npx tsx scripts/test-rq-detectors.ts
 */

import { MECHANISMS } from './_rq-mechanisms';

/** Each entry is [detector name, strings that MUST match (inflected, the way
 *  content is really written), strings that must NOT]. The regex is LOOKED UP
 *  in scripts/_rq-mechanisms.ts, never copied: this file used to carry its own
 *  hand-synced copy of every pattern, so it could pass while the gate drifted. */
const BY_NAME = new Map(MECHANISMS);
const R = (name: string): RegExp => {
  const re = BY_NAME.get(name);
  if (!re) throw new Error(`no detector named "${name}" in scripts/_rq-mechanisms.ts`);
  return re;
};
const CASES: [string, RegExp, string[], string[]][] = [
  ['domain', R('domain'), ['מצאו את תחום ההגדרה', 'תחום הגדרה של שורש'], ['הפונקציה עולה']],
  ['vertical-asymptote', R('vertical-asymptote'),
    ['אסימפטוטה אנכית', 'האסימפטוטה האנכית', 'האסימפטוטות האנכיות'], ['אסימפטוטה אופקית']],
  ['horizontal-asymptote', R('horizontal-asymptote'), ['אסימפטוטה אופקית', 'האסימפטוטה האופקית'], ['אסימפטוטה אנכית']],
  ['quotient-rule', R('quotient-rule'), ['כלל המנה', 'נגזרת מנה', 'נגזרת של מנה', 'הנגזרת של המנה'], ['נגזרת שורש']],
  ['chain-rule', R('chain-rule'), ['נגזרת שורש', 'הנגזרת הפנימית', 'כופלים בנגזרת הפנימית'], ['נגזרת מנה']],
  ['extremum', R('extremum'), ['נקודת קיצון', 'נקודות הקיצון', 'נקודת הקיצון'], ['נקודת חיתוך']],
  ['sign-table', R('sign-table'), ['טבלת סימנים', 'טבלת הסימנים', 'סימן הנגזרת'], ['טבלת ערכים כללית']],
  ['transformation', R('transformation'), ['הזזה של הגרף', 'שיקוף', 'g(x) = f(x-3)'], ['הפונקציה יורדת']],
  ['integral', R('integral'), ['הפונקציה הקדומה', 'שטח הכלוא', 'אינטגרל מסוים'], ['שיפוע המשיק']],
  ['tangent', R('tangent'), ['המשיק לגרף', 'משוואת המשיק'], ['אסימפטוטה']],
  ['second-derivative', R('second-derivative'), ['נקודת פיתול', 'נגזרת שנייה'], ['נגזרת ראשונה']],
  // Thinking-section moves (2026-09-11). Every must-NOT string is a real false
  // positive the corpus probe found, so a loosened pattern fails here first.
  ['parity', R('parity'),
    ['הפונקציה אי-זוגית', 'זוגית, אי-זוגית, או אף אחת', 'הפונקציה **אי-זוגית**', 'הפונקציה הזוגית', 'הגרף סימטרי ביחס לראשית', '**זוגיות:**'],
    ['בחזקה אי-זוגית', 'ואת זוגיות $n$', 'מספר זוגי']],
  ['solution-count', R('solution-count'),
    ['לכמה פתרונות יש למשוואה', 'מספר הפתרונות של המשוואה', 'יש בדיוק נקודה משותפת אחת עם ציר $x$', 'הישר האופקי חותך', 'ישר אופקי חותך ענף',
      'שבעבורו הישר $y=k$ חותך את גרף הפונקציה ב-3 נקודות'],
    ['מקבלים שני פתרונות: $x = 0$', 'מצאו את נקודות החיתוך']],
  ['absolute', R('absolute'),
    ['$g(x) = |f(x)|$', 'הערך המוחלט של $f$', '$g(x) = \\big|f(x) - 0.4\\big|$'],
    ['$S = \\left|\\int_a^b f(x)\\, dx\\right|$', 'הערך המוחלט של האינטגרל', 'לוקחים ערך מוחלט מכל חלק', 'ערך מוחלט עם פרמטר']],
  ['built-from-f', R('built-from-f'),
    ['$g(x) = \\dfrac{1}{f(x)}$', '$g(x) = \\dfrac{1}{\\big(f(x)\\big)^2}$', '$h(x)=f(x)\\cdot g(x)$', "$g'(x)=f(x)$", '$g(x) = \\sqrt{f(x)}$', '$g(x)=\\big(f(x)\\big)^2$',
      "$g(x)=\\sqrt{a\\cdot f'(x)}$", "$h(x) = g(x)\\cdot g'(x)$"],
    ['$g(x) = f(x - 5)$', "$f'(x) = 2x - 6$"]],
];

/** The trap itself, asserted so nobody "fixes" a Hebrew pattern with \b again. */
const BOUNDARY_TRAP: [string, RegExp, boolean][] = [
  ['/או/ fires inside מאותו (the false positive)', /או/, true],
  ['/\\bאו\\b/ matches a standalone או', /\bאו\b/, false],
  ['Unicode lookaround matches a standalone או', /(?<!\p{L})או(?!\p{L})/u, true],
];

let bad = 0;
for (const [name, re, must, mustNot] of CASES) {
  for (const s of must) {
    if (!re.test(s)) { bad++; console.log(`✗ ${name}: does NOT match "${s}" — it should`); }
  }
  for (const s of mustNot) {
    if (re.test(s)) { bad++; console.log(`✗ ${name}: matches "${s}" — it should not`); }
  }
}
if (BOUNDARY_TRAP[0][1].test('מאותו') !== BOUNDARY_TRAP[0][2]) { bad++; console.log('✗ the bare-או false positive no longer reproduces'); }
if (BOUNDARY_TRAP[1][1].test('בחר או השאר') !== BOUNDARY_TRAP[1][2]) { bad++; console.log('✗ /\\bאו\\b/ unexpectedly matched — the \\b trap has changed'); }
if (BOUNDARY_TRAP[2][1].test('בחר או השאר') !== BOUNDARY_TRAP[2][2]) { bad++; console.log('✗ the Unicode lookaround failed on a standalone או'); }

console.log(bad ? `\n${bad} detector problem(s)` : `\n✅ ${CASES.length} detectors match their inflected forms, and the \\b trap is pinned`);
process.exit(bad ? 1 : 0);
