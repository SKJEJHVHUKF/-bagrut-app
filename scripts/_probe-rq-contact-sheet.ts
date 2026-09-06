/** Every figure in the מנה ושורש track on one page, so they can be LOOKED at.
 *  A figure whose numbers check out can still be unreadable — labels on top of
 *  each other, a curve leaving the frame, a caption describing another picture.
 *  Writes public/_rq-figs.html; open it on the dev server and screenshot.
 *  Run: npx tsx scripts/_probe-rq-contact-sheet.ts */
import { writeFileSync } from 'fs';
import { getLesson } from '../content/lessons';
import type { PracticeQuestion } from '../content/lessons/types';

const STAGES = ['rq-domain', 'rq-intersections', 'rq-asymptotes', 'rq-derivative', 'rq-sketch', 'rq-transformations', 'rq-integral', 'rq-bagrut-mixed'];
const L = getLesson('math5', 'פונקציות');
if (!L) throw new Error('no lesson');

type Fig = { id: string; svg: string; viewBox: string; caption: string };
const figs: Fig[] = [];

const take = (id: string, diagrams: unknown[] | undefined) => {
  for (const [i, d] of (diagrams ?? []).entries()) {
    const dd = d as { type?: string; svg?: string; viewBox?: string; caption?: string };
    if (dd.type === 'custom' && dd.svg) figs.push({ id: `${id}#${i}`, svg: dd.svg, viewBox: dd.viewBox ?? '0 0 300 260', caption: dd.caption ?? '' });
  }
};

for (const id of STAGES) {
  const st = (L.subTopics ?? []).find((s) => s.id === id);
  if (!st) continue;
  for (const step of st.lesson ?? []) take(`${id}/lesson`, (step as { diagrams?: unknown[] }).diagrams);
  for (const q of (st.questions ?? []) as PracticeQuestion[]) take(q.id, q.solution?.diagrams as unknown[] | undefined);
  for (const b of (L.bagrutQuestions ?? []).filter((x) => x.subTopicId === id)) {
    take(b.id, b.diagrams as unknown[] | undefined);
    for (const p of b.parts ?? []) take(`${b.id}/${p.label}`, p.diagrams as unknown[] | undefined);
  }
}

const cells = figs
  .map(
    (f) => `<figure><svg viewBox="${f.viewBox}" width="300" height="260" direction="ltr" xmlns="http://www.w3.org/2000/svg">${f.svg}</svg>
<figcaption><b>${f.id}</b><br>${(f.caption || '(no caption)').replace(/</g, '&lt;').slice(0, 120)}</figcaption></figure>`,
  )
  .join('\n');

writeFileSync(
  'public/_rq-figs.html',
  `<!doctype html><meta charset="utf-8"><title>rq figures</title>
<style>body{background:#F8FAFC;font:12px system-ui;margin:12px;direction:rtl}
main{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:14px}
figure{margin:0;background:#fff;border:1px solid #E2E8F0;border-radius:8px;padding:6px}
figcaption{font-size:10.5px;color:#334155;margin-top:4px;line-height:1.35}</style>
<h1>${figs.length} figures — מנה ושורש</h1><main>${cells}</main>`,
  'utf8',
);
console.log(`${figs.length} figure(s) → public/_rq-figs.html`);
for (const f of figs) console.log(`   ${f.id}`);
