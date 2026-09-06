/** Probe: across the whole מנה ושורש track — every question in the eight stages
 *  AND every part of their bagrut questions — how many solutions name the
 *  formula they use, draw what they say they draw, and read one move per line?
 *  Itay, 2026-09-06: "שבכל תשובה יהיה מוסבר גם באיזו נוסחה בדיוק השתמשו",
 *  "איפה שצריך יהיו טבלאות ושרטוטים", "שהתשובות יהיו מובנות ולא דחוסות". */
import { getLesson } from '../content/lessons';
import type { PracticeQuestion } from '../content/lessons/types';

const STAGES = ['rq-domain', 'rq-intersections', 'rq-asymptotes', 'rq-derivative', 'rq-sketch', 'rq-transformations', 'rq-integral', 'rq-bagrut-mixed'];
const L = getLesson('math5', 'פונקציות');
if (!L) throw new Error('no lesson');

type Row = { stage: string; total: number; noFormula: string[]; noFigure: string[]; noTable: string[]; crowded: string[] };
const rows: Row[] = [];

function crowded(text: string): boolean {
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('```') || t.startsWith('$$') || t.startsWith('|')) continue;
    const tall = (t.match(/\$[^$\n]+\$/g) ?? []).filter(
      (s) => (/\\dfrac|\\frac|\\sqrt|\\int/.test(s) && /=|\\cdot|\+|-/.test(s)) || /\\cdot/.test(s) || s.length > 22,
    );
    if (tall.length >= 2) return true;
  }
  return false;
}

for (const id of STAGES) {
  const st = (L.subTopics ?? []).find((s) => s.id === id);
  if (!st) continue;
  const row: Row = { stage: id, total: 0, noFormula: [], noFigure: [], noTable: [], crowded: [] };
  const items: { id: string; steps: string[]; diagrams: unknown[] }[] = [];
  for (const q of (st.questions ?? []) as PracticeQuestion[]) {
    items.push({ id: q.id, steps: q.solution?.steps ?? [], diagrams: q.solution?.diagrams ?? [] });
  }
  for (const b of (L.bagrutQuestions ?? []).filter((x) => x.subTopicId === id)) {
    for (const p of b.parts ?? []) items.push({ id: `${b.id}/${p.label}`, steps: p.solution?.steps ?? [], diagrams: p.diagrams ?? [] });
  }
  for (const it of items) {
    row.total++;
    const text = it.steps.join('\n');
    if (!/\*\*הנוסחה:\*\*/.test(text)) row.noFormula.push(it.id);
    if (/סקיצה|סרטט|שרטט|גרף הפונקציה|הגרף של/.test(text) && !it.diagrams.length) row.noFigure.push(it.id);
    if (/טבלת סימנים|טבלה/.test(text) && !/^\s*\|.*\|\s*$/m.test(text)) row.noTable.push(it.id);
    if (crowded(text)) row.crowded.push(it.id);
  }
  rows.push(row);
}

const sum = (f: (r: Row) => number) => rows.reduce((a, r) => a + f(r), 0);
console.log('stage                total  no-formula  no-figure  no-table  crowded');
for (const r of rows) {
  console.log(
    `${r.stage.padEnd(20)} ${String(r.total).padStart(5)} ${String(r.noFormula.length).padStart(11)} ${String(r.noFigure.length).padStart(10)} ${String(r.noTable.length).padStart(9)} ${String(r.crowded.length).padStart(8)}`,
  );
}
console.log(`${'TOTAL'.padEnd(20)} ${String(sum((r) => r.total)).padStart(5)} ${String(sum((r) => r.noFormula.length)).padStart(11)} ${String(sum((r) => r.noFigure.length)).padStart(10)} ${String(sum((r) => r.noTable.length)).padStart(9)} ${String(sum((r) => r.crowded.length)).padStart(8)}`);

if (process.argv.includes('--ids')) {
  for (const r of rows) {
    console.log(`\n${r.stage}`);
    if (r.noFormula.length) console.log(`  no formula: ${r.noFormula.join(' ')}`);
    if (r.noFigure.length) console.log(`  no figure:  ${r.noFigure.join(' ')}`);
    if (r.noTable.length) console.log(`  no table:   ${r.noTable.join(' ')}`);
    if (r.crowded.length) console.log(`  crowded:    ${r.crowded.join(' ')}`);
  }
}
