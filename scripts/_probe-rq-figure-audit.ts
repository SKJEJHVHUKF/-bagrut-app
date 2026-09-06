/** Audit every figure in the מנה ושורש track for the faults a feature check
 *  cannot see: nothing drawn, a label outside the frame, two labels printed on
 *  top of each other, unbalanced tags. Complements looking at the contact
 *  sheet — 100/100 checks passed once on a batch whose labels overlapped. */
import { getLesson } from '../content/lessons';
import type { PracticeQuestion } from '../content/lessons/types';

const ST = ['rq-domain', 'rq-intersections', 'rq-asymptotes', 'rq-derivative', 'rq-sketch', 'rq-transformations', 'rq-integral', 'rq-bagrut-mixed'];
const L = getLesson('math5', 'פונקציות');
if (!L) throw new Error('no lesson');

const figs: { id: string; svg: string; box: [number, number] }[] = [];
const take = (id: string, d: unknown[] | undefined) => {
  (d ?? []).forEach((x, i) => {
    const dd = x as { type?: string; svg?: string; viewBox?: string };
    if (dd?.type !== 'custom' || !dd.svg) return;
    // Each figure declares its own frame; assuming 300×260 for all of them
    // reported the axis letter of a wider figure as out of bounds.
    const p = (dd.viewBox ?? '0 0 300 260').trim().split(/\s+/).map(Number);
    figs.push({ id: `${id}#${i}`, svg: dd.svg, box: [p[2] || 300, p[3] || 260] });
  });
};

for (const id of ST) {
  const st = (L.subTopics ?? []).find((s) => s.id === id);
  if (!st) continue;
  for (const step of st.lesson ?? []) take(`${id}/lesson`, (step as { diagrams?: unknown[] }).diagrams);
  for (const q of (st.questions ?? []) as PracticeQuestion[]) take(q.id, q.solution?.diagrams as unknown[] | undefined);
  for (const b of (L.bagrutQuestions ?? []).filter((x) => x.subTopicId === id)) {
    for (const p of b.parts ?? []) take(`${b.id}/${p.label}`, (p.solution as { diagrams?: unknown[] }).diagrams);
  }
}

let bad = 0;
for (const f of figs) {
  const curves = (f.svg.match(/<polyline|<path/g) ?? []).length;
  // Anchor-aware: `text-anchor="end"` grows LEFT from x and `middle` centres on
  // it, so comparing bare x values reports collisions that are not there — the
  // first version of this audit chased three of those around the figure.
  const texts = [...f.svg.matchAll(/<text x="([\d.-]+)" y="([\d.-]+)"([^>]*)>([^<]*)</g)].map((m) => {
    const x = Number(m[1]);
    const w = m[4].length * 5.5;
    const anchor = /text-anchor="end"/.test(m[3]) ? 'end' : /text-anchor="middle"/.test(m[3]) ? 'middle' : 'start';
    const x0 = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
    return { x0, x1: x0 + w, y: Number(m[2]), t: m[4] };
  });
  const outside = texts.filter((t) => t.x0 < -6 || t.x1 > f.box[0] + 6 || t.y < 0 || t.y > f.box[1] + 2).map((t) => [t.x0, t.y, t.t] as const);
  let overlaps = 0;
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++) {
      const a = texts[i];
      const b = texts[j];
      if (Math.abs(a.y - b.y) < 7 && a.x0 < b.x1 - 1 && b.x0 < a.x1 - 1) overlaps++;
    }
  }
  const unbalanced = (f.svg.match(/</g) ?? []).length !== (f.svg.match(/>/g) ?? []).length;
  if (!curves || outside.length || overlaps || unbalanced) {
    bad++;
    console.log(`✗ ${f.id.padEnd(24)} curves ${curves} · outside ${outside.length} · overlapping ${overlaps}${unbalanced ? ' · UNBALANCED TAGS' : ''}`);
    for (const o of outside.slice(0, 3)) console.log(`      out of frame: "${o[2]}" at (${o[0]}, ${o[1]})`);
  }
}
console.log(`\n${figs.length} figure(s) · ${bad} with a problem`);
process.exit(bad ? 1 : 0);
