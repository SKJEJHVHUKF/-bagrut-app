/** One measurement of a topic's practice content, on the axes the owner has
 *  complained about across three topics now:
 *
 *    formula   — does every solution name the rule it applies?
 *    leap      — does a step announce a result without showing the move?
 *    crowded   — does a line carry two calculations?
 *    stem      — do a question's parts share a line? is a label a sentence?
 *    off-style — does the question ask something a bagrut never asks?
 *    ladder    — does each rung actually score above the one below it?
 *
 *  Run: npx tsx scripts/_probe-topic-health.ts <topic> [--ids]                */
import { getLesson } from '../content/lessons';
import type { PracticeQuestion } from '../content/lessons/types';

const TOPIC = process.argv[2] ?? 'סדרות';
const L = getLesson('math5', TOPIC);
if (!L) throw new Error(`no lesson for ${TOPIC}`);

const OFF_STYLE: [string, RegExp][] = [
  ['count-the-errors', /כמה טעויות|מספר הטעויות|כמה שגיאות/],
  ['which-claim-is-true', /איזו (?:מן ה)?טענה נכונה|איזו מהטענות|מה נכון(?: על| לגבי)?\s*\?|איזו קביעה/],
  ['student-said-mcq', /(?:תלמיד|תלמידה) (?:כתב|כתבה|טען|טענה|חישב|חישבה)[^?]*\?/],
  ['what-if', /ומה אם|מה יקרה אם|אילו היה/],
  ['compare-two-claims', /מה גדול יותר|איזו .* גדולה|כדאי|עדיף/],
];
const CLAIMS = [/הסכום הוא|הפרש הוא|המנה היא|a_?n ?=|S_?n ?=/, /ומכאן \$?[a-z]\$? ?=|מקבלים ש?\$?[a-z]\$? ?=/];
const SHOWS = /מציבים|מחלקים|כופלים|מחסרים|מחברים|מעלים|מצמצמים|פותחים|מעבירים|לפי הנוסחה|לפי הכלל|פותרים|מכנסים/;

const tall = (line: string) =>
  (line.match(/\$[^$\n]+\$/g) ?? []).filter(
    (s) => (/\\dfrac|\\frac|\\sqrt|\\sum/.test(s) && /=|\\cdot|\+|-/.test(s)) || /\\cdot/.test(s) || s.length > 22,
  ).length;

type Row = { stage: string; id: string; why: string; detail: string };
const rows: Row[] = [];
let total = 0;
const rung: Record<string, number[]> = { easy: [], mid: [], hard: [] };

for (const st of L.subTopics ?? []) {
  for (const q of (st.questions ?? []) as PracticeQuestion[]) {
    total++;
    const steps = q.solution?.steps ?? [];
    const text = steps.join('\n');
    rung[q.difficulty]?.push(steps.length);

    if (!/\*\*הנוסחה:\*\*/.test(text)) rows.push({ stage: st.id, id: q.id, why: 'no-formula-line', detail: '' });
    for (const s of steps) {
      const plain = s.replace(/\$\$[\s\S]*?\$\$/g, ' ');
      if (/^\*\*(?:הנוסחה|ההצבה|הכלל):\*\*/.test(s.trim())) continue;
      if (CLAIMS.some((re) => re.test(plain)) && !SHOWS.test(plain)) {
        rows.push({ stage: st.id, id: q.id, why: 'leap', detail: s.replace(/\s+/g, ' ').slice(0, 70) });
        break;
      }
    }
    for (const line of text.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('```') || t.startsWith('$$') || t.startsWith('|')) continue;
      if (tall(t) >= 2) { rows.push({ stage: st.id, id: q.id, why: 'crowded-line', detail: t.slice(0, 60) }); break; }
    }
    const stem = q.question ?? '';
    const parts = [...stem.matchAll(/(?:^|\s)([אבגדה])\.\s/g)].map((m) => m[1]);
    if (parts.length >= 2 && stem.split('\n').length < parts.length) rows.push({ stage: st.id, id: q.id, why: 'parts-on-one-line', detail: parts.join(',') });
    for (const [i, lab] of (q.answerLabels ?? []).entries()) {
      if (lab.replace(/\$[^$]*\$/g, '').length > 28) rows.push({ stage: st.id, id: q.id, why: 'long-answer-label', detail: `[${i}] ${lab.slice(0, 40)}` });
    }
    const off = OFF_STYLE.find(([, re]) => re.test(stem));
    if (off) rows.push({ stage: st.id, id: q.id, why: `off-style:${off[0]}`, detail: stem.slice(0, 60) });
  }
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const by = new Map<string, number>();
for (const r of rows) by.set(r.why.split(':')[0], (by.get(r.why.split(':')[0]) ?? 0) + 1);

console.log(`${TOPIC}: ${(L.subTopics ?? []).length} stages · ${total} questions · ${rows.length} finding(s)`);
console.log(`steps per question by rung: easy ${mean(rung.easy).toFixed(1)} · mid ${mean(rung.mid).toFixed(1)} · hard ${mean(rung.hard).toFixed(1)}`);
console.log(`questions per rung: easy ${rung.easy.length} · mid ${rung.mid.length} · hard ${rung.hard.length}`);
for (const [k, v] of [...by].sort((a, b) => b[1] - a[1])) console.log(`   ${k.padEnd(20)} ${v}`);
if (process.argv.includes('--ids')) {
  console.log('');
  for (const r of rows) console.log(`   ${r.stage.padEnd(18)} ${r.id.padEnd(20)} ${r.why.padEnd(24)} ${r.detail}`);
}
