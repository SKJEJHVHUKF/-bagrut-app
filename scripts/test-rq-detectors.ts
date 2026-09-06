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

/** Kept in sync with scripts/_rq-extra-check.ts — each entry is [name, regex,
 *  a string that MUST match (inflected, the way content is really written),
 *  a string that must NOT]. */
const CASES: [string, RegExp, string[], string[]][] = [
  ['domain', /תחום ההגדרה|תחום הגדרה|מוגדרת עבור|מכנה שונה מ|ביטוי שתחת השורש|אי[- ]שוויון/,
    ['מצאו את תחום ההגדרה', 'תחום הגדרה של שורש'], ['הפונקציה עולה']],
  ['vertical-asymptote', /אסימפטוט\S*\s+\S*אנכי|מאפסי המכנה/,
    ['אסימפטוטה אנכית', 'האסימפטוטה האנכית', 'האסימפטוטות האנכיות'], ['אסימפטוטה אופקית']],
  ['horizontal-asymptote', /אסימפטוט\S*\s+\S*אופקי|כאשר \$?x\$? שואף|שואף לאינסוף/,
    ['אסימפטוטה אופקית', 'האסימפטוטה האופקית'], ['אסימפטוטה אנכית']],
  ['quotient-rule', /כלל\s+\S*מנה|נגזרת\s+(?:של\s+)?\S*מנה|u'v ?- ?uv'/,
    ['כלל המנה', 'נגזרת מנה', 'נגזרת של מנה', 'הנגזרת של המנה'], ['נגזרת שורש']],
  ['chain-rule', /נגזרת\s+(?:של\s+)?\S*שורש|נגזרת\s+\S*פנימית|\\dfrac\{1\}\{2\\sqrt/,
    ['נגזרת שורש', 'הנגזרת הפנימית', 'כופלים בנגזרת הפנימית'], ['נגזרת מנה']],
  ['extremum', /נקוד\S*\s+\S*קיצון|מקסימום|מינימום|מאפסים את הנגזרת/,
    ['נקודת קיצון', 'נקודות הקיצון', 'נקודת הקיצון'], ['נקודת חיתוך']],
  ['sign-table', /טבלת\s+\S*סימנים|סימן\s+\S*נגזרת|טבלה של סימנים/,
    ['טבלת סימנים', 'טבלת הסימנים', 'סימן הנגזרת'], ['טבלת ערכים כללית']],
  ['transformation', /הזזה|שיקוף|מתיחה|הזזת גרף|(?<!\p{L})g\(x\) ?= ?f\(/u,
    ['הזזה של הגרף', 'שיקוף', 'g(x) = f(x-3)'], ['הפונקציה יורדת']],
  ['integral', /אינטגרל|פונקציה קדומה|הקדומה|שטח הכלוא|\\int/,
    ['הפונקציה הקדומה', 'שטח הכלוא', 'אינטגרל מסוים'], ['שיפוע המשיק']],
  ['tangent', /משיק|שיפוע המשיק|משוואת המשיק/, ['המשיק לגרף', 'משוואת המשיק'], ['אסימפטוטה']],
  ['second-derivative', /נגזרת שנייה|נקודת פיתול|קמור|קעור/, ['נקודת פיתול', 'נגזרת שנייה'], ['נגזרת ראשונה']],
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
