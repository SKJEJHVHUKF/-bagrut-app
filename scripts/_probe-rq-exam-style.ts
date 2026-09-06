/** Which questions ask something a bagrut never asks?
 *
 *  Itay, 2026-09-06: "יש שם שאלות שבדרך כלל בבגרות לא שואלים — הסגנון הזה של
 *  השאלות. תחליף לסגנון שיותר התלמיד צריך לפתור כמו שבאמת נדרש ממנו בבגרות."
 *  His example was a "כמה טעויות יש כאן?" multiple-choice item.
 *
 *  The archive is the reference: 25 real quotient/root questions, whose stems
 *  are מצאו / חשבו / הוכיחו / סרטטו / קבעו / נמקו / מהו / עבור אילו ערכים.
 *  Run: npx tsx scripts/_probe-rq-exam-style.ts [--ids] */
import { getLesson } from '../content/lessons';
import type { PracticeQuestion } from '../content/lessons/types';

const ST = ['rq-domain', 'rq-intersections', 'rq-asymptotes', 'rq-derivative', 'rq-sketch', 'rq-transformations', 'rq-integral', 'rq-bagrut-mixed'];
const L = getLesson('math5', 'פונקציות');
if (!L) throw new Error('no lesson');

/** Asks the exam does not make. Each is a style, not a topic. */
const OFF_STYLE: [string, RegExp][] = [
  ['count-the-errors', /כמה טעויות|מספר הטעויות|כמה שגיאות/],
  ['which-claim-is-true', /איזו (?:מן ה)?טענה נכונה|איזו מהטענות|מה נכון(?: על| לגבי)?\?|איזו קביעה/],
  ['spot-the-error-mcq', /(?:תלמיד|תלמידה) (?:כתב|כתבה|טען|טענה|חישב|חישבה)[^?]*\?/],
  ['what-if-abstract', /ומה אם|מה יקרה אם|אילו היה/],
  ['meta-about-the-method', /איזו שיטה|מה עדיף לעשות|כיצד כדאי/],
  ['compare-two-claims', /מה גדול יותר|איזו .* גדולה|כדאי|עדיף/],
];

/** What the archive actually says. */
// The verbs the archive actually uses, including the ones a drill states
// directly (גזרו, פתרו, בדקו) and the counting/locating asks that appear inside
// real questions ("כמה נקודות קיצון", "באיזה ערך x המשיק אופקי").
const EXAM_ASK =
  /מצא|חשב|הוכיח|הראו|הראה|סרטט|שרטט|קבע|נמק|מהו|מהי|מהם|מהן|עבור אילו ערכים|רשמ|הסבירו מדוע|גזור|גזר|פתור|פתר|בדוק|בדק|כמה [^?]*יש|באיז[הו] [^?]*\?|בין אילו ערכים|מה תחום|כתוב|כתב(?:ו) את|לאיזו|איזו נקודה|איזו מהפונקציות|לאן/;

type Row = { stage: string; id: string; difficulty: string; kind: string; style: string; stem: string };
const rows: Row[] = [];
let total = 0;

for (const id of ST) {
  const st = (L.subTopics ?? []).find((s) => s.id === id);
  if (!st) continue;
  for (const q of (st.questions ?? []) as PracticeQuestion[]) {
    total++;
    const stem = q.question ?? '';
    const hit = OFF_STYLE.find(([, re]) => re.test(stem));
    if (hit) rows.push({ stage: id, id: q.id, difficulty: q.difficulty, kind: q.kind, style: hit[0], stem: stem.replace(/\s+/g, ' ').slice(0, 95) });
    else if (!EXAM_ASK.test(stem)) rows.push({ stage: id, id: q.id, difficulty: q.difficulty, kind: q.kind, style: 'no-exam-verb', stem: stem.replace(/\s+/g, ' ').slice(0, 95) });
  }
}

const byStyle = new Map<string, number>();
const byStage = new Map<string, number>();
for (const r of rows) {
  byStyle.set(r.style, (byStyle.get(r.style) ?? 0) + 1);
  byStage.set(r.stage, (byStage.get(r.stage) ?? 0) + 1);
}
console.log(`${total} questions · ${rows.length} do not ask the way the exam asks\n`);
console.log('by style:');
for (const [k, v] of [...byStyle].sort((a, b) => b[1] - a[1])) console.log(`   ${k.padEnd(22)} ${v}`);
console.log('\nby stage:');
for (const s of ST) console.log(`   ${s.padEnd(20)} ${byStage.get(s) ?? 0}`);
if (process.argv.includes('--ids')) {
  console.log('');
  for (const r of rows.sort((a, b) => a.stage.localeCompare(b.stage))) {
    console.log(`   ${r.stage.padEnd(18)} ${r.id.padEnd(18)} ${r.difficulty.padEnd(4)} ${r.kind.padEnd(4)} ${r.style.padEnd(20)} ${r.stem}`);
  }
}
