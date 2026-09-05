// Probe: which SHIPPED questions sit on a rung they do not belong to?
// Two independent authoring agents reported the same thing — a question labelled
// `hard` that is really a mid question, dragging its rung's average down. The
// owner's complaint is exactly this, so list every case with its numbers before
// touching anything.
// Run: npx tsx scripts/_probe-prob-mislabelled.ts
import { getLesson } from '../content/lessons';
import type { PracticeQuestion } from '../content/lessons/types';

// Reuse the gate's model rather than a second copy of it.
const MECHANISMS: [string, RegExp][] = [
  ['complement', /משלים|לא קורה|אף פעם לא|1 ?- ?P|אחד פחות/],
  ['conditional', /מותנ|בהינתן|בידיעה ש|ידוע ש.*מה ההסתברות/],
  ['independence', /בלתי[- ]תלוי|תלויים זה בזה|אינם תלויים/],
  ['binomial', /ברנולי|בינומ|ניסויים חוזרים|\\binom|nCr|בדיוק \$?\d+ (?:פעמים|הצלחות)/],
  ['tree', /עץ|ענף|מסלול/],
  ['table', /טבלה|תא|שוליים|דו[- ]ממדית/],
  ['expectation', /תוחלת/],
  ['combinatorics', /צירופ|עצרת|כמה דרכים|סידור/],
  ['no-replacement', /בלי החזרה|ללא החזרה|אינו מוחזר|לא מחזירים/],
  ['at-least', /לפחות|לכל היותר|לפחות אחד/],
  ['union', /או .* או|איחוד|לפחות אחד מהם/],
  ['total-probability', /הסתברות שלמה|נוסחת ההסתברות השלמה|מפצלים למקרים/],
];
const mech = (q: PracticeQuestion) => {
  const t = `${q.question} ${(q.solution?.steps ?? []).join(' ')}`;
  return MECHANISMS.filter(([, re]) => re.test(t)).map(([n]) => n);
};
const shapeOf = (q: PracticeQuestion) => {
  const t = q.question;
  if (/כמה .*(?:כדורים|תלמידים|פריטים|ניסויים|פעמים|צריך)|מצא את מספר|מהו מספר/.test(t)) return 'count';
  if (/מצא את [^.]*\b[a-zA-Z]\b|מהו הערך של|נתון ש.*מצא את/.test(t)) return 'find-parameter';
  if (/הוכח|נמק|הסבר מדוע|האם .*\?/.test(t)) return 'justify';
  if (/מה גדול יותר|כדאי|עדיף|השווה/.test(t)) return 'compare';
  if (/תלמיד (?:כתב|טען|חישב)|מה הטעות|כמה טעויות/.test(t)) return 'find-the-error';
  if (/ומה אם|אילו היה/.test(t)) return 'what-if';
  return 'compute';
};
const score = (q: PracticeQuestion) => {
  const m = mech(q), s = shapeOf(q);
  return (q.solution?.steps?.length ?? 0)
    + m.length * 2.5
    + (s === 'find-parameter' || /\bx\b|\bp\b|נעלם|פרמטר/.test(q.question) ? 3 : 0)
    + (/בהינתן ש|ידוע ש/.test(q.question) && /מאיזו|מאיזה|הגיע מ|הייתה|היה|הראשון|המכונה|הקופסה|הכד/.test(q.question) ? 4 : 0)
    + (s === 'justify' || s === 'compare' ? 2 : 0)
    + (s === 'find-the-error' ? 2 : 0);
};

const STAGES = ['pr-basics', 'pr-tree', 'pr-tables', 'pr-bernoulli', 'pr-conditional', 'pr-practice'];
const L = getLesson('math5', 'הסתברות')!;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

let flagged = 0;
for (const st of L.subTopics ?? []) {
  if (!STAGES.includes(st.id)) continue;
  // shipped questions only — the new ones carry the pr-x- prefix
  const shipped = (st.questions ?? []).filter((q) => !q.id.startsWith('pr-x-'));
  const rung = (d: string) => shipped.filter((q) => q.difficulty === d);
  const mean = { easy: avg(rung('easy').map(score)), mid: avg(rung('mid').map(score)), hard: avg(rung('hard').map(score)) };
  const rows: string[] = [];
  for (const q of rung('hard')) {
    const s = score(q);
    if (s < mean.mid) { rows.push(`   hard  ${q.id.padEnd(22)} ${s.toFixed(1)} < mid mean ${mean.mid.toFixed(1)}  [${mech(q).join(',') || '—'}] ${shapeOf(q)}`); flagged++; }
  }
  for (const q of rung('mid')) {
    const s = score(q);
    if (s < mean.easy) { rows.push(`   mid   ${q.id.padEnd(22)} ${s.toFixed(1)} < easy mean ${mean.easy.toFixed(1)}  [${mech(q).join(',') || '—'}] ${shapeOf(q)}`); flagged++; }
  }
  if (rows.length) {
    console.log(`\n${st.id}  (easy ${mean.easy.toFixed(1)} · mid ${mean.mid.toFixed(1)} · hard ${mean.hard.toFixed(1)})`);
    rows.forEach((r) => console.log(r));
    console.log(`   rung sizes: easy ${rung('easy').length} · mid ${rung('mid').length} · hard ${rung('hard').length}`);
  }
}
console.log(`\n${flagged} shipped question(s) sit on a rung above where their own difficulty puts them.`);
