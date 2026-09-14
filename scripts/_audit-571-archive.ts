/** Audit: how readable is every solution in the שאלון 571 archive?
 *  Itay, 2026-09-14, on /bagruyot/archive: "הכל דחוס וממש לא מובן" — no sketches,
 *  no tables, sign tables written as prose. One row per part: the figure the part
 *  NEEDS (by its topic and wording) vs the figure it HAS, plus crowded lines.
 *  Usage: npx tsx scripts/_audit-571-archive.ts [--json out.json] */
import { writeFileSync } from 'node:fs';
import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';

const qs = ALL_PAST_BAGRUYOT.filter((q) => q.paper === '571');

/** A tall calculation island — same idea as _probe-step-density.ts. */
const isCalc = (s: string) =>
  (/\\dfrac|\\binom|\\frac/.test(s) && /=|\\cdot|\+|-/.test(s)) || /\\cdot/.test(s) || s.length > 22;

function crowdedLines(steps: string[]): number {
  let n = 0;
  for (const step of steps)
    for (const line of step.split('\n')) {
      const t = line.trim();
      if (/^\$\$[\s\S]*\$\$$/.test(t) || t.startsWith('|') || t.startsWith('{')) continue;
      const calcs = (t.match(/\$[^$\n]+\$/g) ?? []).filter(isCalc);
      if (calcs.length >= 2 || calcs.join('').length > 110) n++;
    }
  return n;
}

type Row = {
  id: string; label: string; topic: string; steps: number; crowded: number;
  has: string[]; needs: string[]; verdict: string;
};
const rows: Row[] = [];

for (const q of qs) {
  for (const p of q.parts) {
    const all = [q.context, p.prompt, ...p.solution.steps].join('\n');
    const sol = p.solution.steps.join('\n');
    const has: string[] = [];
    if (sol.includes('```signtable')) has.push('signtable');
    if (sol.includes('```probtree')) has.push('probtree');
    if (sol.includes('```geo')) has.push('geo');
    if (/\n\|.*\|\s*\n\|\s*:?-{3}/.test('\n' + sol)) has.push('table');
    if (p.diagrams?.length) has.push(`diagrams×${p.diagrams.length}`);
    if (q.diagrams?.length) has.push(`q.diagrams×${q.diagrams.length}`);

    const needs: string[] = [];
    const text = p.prompt + '\n' + sol;
    if (/טבלת סימנים|עלייה וירידה|תחומי עלייה|תחומי ירידה|נקודות? (ה)?קיצון/.test(text)) needs.push('signtable');
    if (/סקיצה|סרטטו|שרטטו|גרף/.test(p.prompt)) needs.push('graph');
    if (q.topic === 'הסתברות') needs.push(/טבלה|שכיחות|דו-ממד/.test(all) ? 'table' : 'probtree|table');
    if (q.topic === 'גיאומטריה אוקלידית' || q.topic === 'טריגונומטריה') needs.push('geo');

    const missing = needs.filter((n) => {
      if (n === 'graph') return !has.some((h) => h.includes('diagrams'));
      if (n === 'probtree|table') return !has.includes('probtree') && !has.includes('table');
      return !has.includes(n);
    });
    const crowded = crowdedLines(p.solution.steps);
    const verdict = missing.length || crowded ? `חסר: ${missing.join(',') || '—'} · דחוס: ${crowded}` : 'תקין';
    rows.push({ id: q.id, label: p.label, topic: q.topic, steps: p.solution.steps.length, crowded, has, needs, verdict });
  }
}

for (const r of rows)
  console.log(`${r.id.padEnd(16)} ${r.label.padEnd(4)} ${r.topic.padEnd(18)} steps=${String(r.steps).padStart(2)} has=[${r.has.join(',')}] needs=[${r.needs.join(',')}] → ${r.verdict}`);
const bad = rows.filter((r) => r.verdict !== 'תקין');
console.log(`\n${qs.length} questions, ${rows.length} parts, ${bad.length} need work, crowded lines ${rows.reduce((s, r) => s + r.crowded, 0)}`);
const out = process.argv.indexOf('--json');
if (out > 0) writeFileSync(process.argv[out + 1], JSON.stringify(rows, null, 2));
