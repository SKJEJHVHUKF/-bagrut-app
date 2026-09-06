/** Probe: what does a REAL bagrut question on a quotient or root function ask?
 *  Itay: "מותאם להביא את התלמיד להצליח בשאלות בגרות בנושא הזה" — so the ruler is
 *  the archive, not a prior. Prints every archived question whose function is a
 *  quotient or a root, with its parts, so the ladder can be built backwards.
 *  Run: npx tsx scripts/_probe-bagrut-rq.ts [--full] */
import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';

const FULL = process.argv.includes('--full');
/** A quotient with x downstairs, or a root of an expression in x. */
const isRQ = (s: string) =>
  /\\d?frac\s*\{[^}]*\}\s*\{[^}]*x[^}]*\}/.test(s) || /\\sqrt\s*(\[[^\]]*\])?\s*\{[^}]*x/.test(s) || /\\sqrt\s*x/.test(s);

let n = 0;
const partCounts: number[] = [];
const asks = new Map<string, number>();
const ASK_PATTERNS: [string, RegExp][] = [
  ['תחום הגדרה', /תחום ההגדרה|תחום הגדרה/],
  ['אסימפטוטות', /אסימפטוט/],
  ['נקודות קיצון', /קיצון|מקסימום|מינימום/],
  ['עלייה/ירידה', /עולה|יורדת|תחומי עלייה/],
  ['חיתוך עם הצירים', /חיתוך עם הציר|נקודות החיתוך/],
  ['סרטוט/סקיצה', /סרטט|סרטטו|סקיצה|שרטט/],
  ['שטח/אינטגרל', /שטח|אינטגרל|הקדומה|פונקציה קדומה/],
  ['משיק', /משיק/],
  ['פרמטר', /נתון ש.*\ba\b|הפרמטר|מצאו את הערך של [a-z]|עבור אילו ערכים/],
  ['הצבה/הוכחה', /הוכיחו|הראו כי/],
  ['גרף הנגזרת', /גרף הנגזרת|f\s*['׳]\s*\(x\)|f''/],
];

for (const q of ALL_PAST_BAGRUYOT) {
  const text = [q.body ?? '', ...(q.parts ?? []).map((p) => p.prompt ?? '')].join(' ');
  if (!isRQ(text)) continue;
  n++;
  partCounts.push((q.parts ?? []).length);
  for (const [name, re] of ASK_PATTERNS) if (re.test(text)) asks.set(name, (asks.get(name) ?? 0) + 1);
  console.log('='.repeat(76));
  console.log(`${q.id}  ·  ${q.topic}  ·  ${(q.parts ?? []).length} parts`);
  console.log((q.body ?? '').replace(/\s+/g, ' ').slice(0, FULL ? 2000 : 300));
  for (const p of q.parts ?? []) {
    console.log(`   ${p.label ?? '?'}. ${(p.prompt ?? '').replace(/\s+/g, ' ').slice(0, FULL ? 800 : 190)}`);
  }
}

console.log('\n' + '='.repeat(76));
console.log(`${n} archived question(s) on a quotient or root function`);
console.log(`parts per question: ${partCounts.join(', ')}`);
console.log('what they ask:');
for (const [k, v] of [...asks].sort((a, b) => b[1] - a[1])) console.log(`   ${k.padEnd(18)} ${v}/${n}`);
