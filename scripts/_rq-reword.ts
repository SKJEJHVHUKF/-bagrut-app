/* One-off wording sweep over the מנה ושורש track content.
 * Literal string pairs only (no regex, no $ replacement patterns —
 * a `$` in content would otherwise be re-interpreted by String.replace).
 * Usage: tsx scripts/_rq-reword.ts [--write] */
import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const PAIRS: [string, string][] = [
  // "יוצא מתחום ההגדרה" reads as an action the value performs; the owner asked
  // (2026-09-10) for the plainer "אינו נמצא בתחום". Longest patterns first.
  ['ואינו יוצא מתחום ההגדרה', 'ונמצא בתחום ההגדרה'],
  ['שיוצאים מתחום ההגדרה', 'שאינם נמצאים בתחום ההגדרה'],
  ['יוצאים מתחום ההגדרה', 'אינם נמצאים בתחום ההגדרה'],
  ['שיוצא מתחום ההגדרה', 'שאינו נמצא בתחום ההגדרה'],
  ['יוצא מתחום ההגדרה', 'אינו נמצא בתחום ההגדרה'],
  ['שיוצאים מהתחום', 'שאינם נמצאים בתחום'],
  ['יוצאים מהתחום', 'אינם נמצאים בתחום'],
  ['שיוצא מהתחום', 'שאינו נמצא בתחום'],
  ['יוצא מהתחום', 'אינו נמצא בתחום'],
  // "זוג סדור" is an academic term the owner's students do not use
  // (2026-09-10: "תחליף את המילים זוג סדור במילים נק על מערכת הצירים").
  // The first entries fix the agreement the plain swap would break.
  ['רכיבי הזוג הסדור הוחלפו', 'רכיבי הנקודה הוחלפו'],
  ['זוג סדור נרשם תמיד', 'נקודה על מערכת הצירים נרשמת תמיד'],
  ['ולכן הזוג הסדור הוא', 'ולכן הנקודה על מערכת הצירים היא'],
  ['שני זוגות סדורים', 'שתי נקודות על מערכת הצירים'],
  ['כמה זוגות סדורים', 'כמה נקודות על מערכת הצירים'],
  ['וזוג סדור', 'ונקודה על מערכת הצירים'],
  ['כזוגות סדורים', 'כנקודות על מערכת הצירים'],
  ['זוגות סדורים', 'נקודות על מערכת הצירים'],
  ['הזוג הסדור', 'הנקודה על מערכת הצירים'],
  ['כזוג סדור', 'כנקודה על מערכת הצירים'],
  ['זוג סדור', 'נקודה על מערכת הצירים'],
];

const FILES = [
  'content/lessons/math5/functions-root-quotient.ts',
  'content/ghost-replay/math5/functions.ts',
  ...globSync('content/lessons/math5/rq-extra/*.ts'),
];

const write = process.argv.includes('--write');
let total = 0;
for (const f of FILES) {
  const src = readFileSync(f, 'utf8');
  let out = src;
  let n = 0;
  for (const [from, to] of PAIRS) {
    const hits = out.split(from).length - 1;
    if (hits) {
      out = out.split(from).join(to);
      n += hits;
    }
  }
  if (n) {
    total += n;
    console.log(`${n}\t${f}`);
    if (write) writeFileSync(f, out, 'utf8');
  }
}
console.log(`${write ? 'rewrote' : 'would rewrite'} ${total} occurrence(s)`);
