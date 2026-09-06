/**
 * _render-new-geo.tsx — render the new geometry questions through the app's OWN
 * MathText and check what a student would actually see.
 *
 *   npx tsx scripts/_render-new-geo.tsx
 *
 * WHY not the browser. The Browser pane reports a 0×0 viewport in this session,
 * so getBoundingClientRect returns zero for every element and screenshots come
 * back blank; driving the runner through it stalled twice. This renders the same
 * component tree the page renders, so it catches the things that actually break
 * on screen: a ```geo fence that does not become an <svg>, a KaTeX island that
 * fails to parse, a markdown table that stays as pipes, and an answer spec whose
 * box count does not match the number of quantities asked for.
 *
 * What it cannot see: client-only layout and anything that depends on the
 * browser. Those need the live page, and the parts of it I could reach — the
 * deployed circle rung, which went from 2 questions to 5 — rendered clean.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MathText } from '../components/practice/MathText';
import { math5EuclideanGeometry as G } from '../content/lessons/math5/euclidean-geometry';
import type { PracticeQuestion } from '../content/lessons/types';

const NEW = [
  'eg-sub-circ-007', 'eg-sub-circ-008', 'eg-sub-circ-009', 'eg-sub-circ-010',
  'eg-shp-009', 'eg-shp-015', 'eg-shp-016',
  'eg-ang-011', 'eg-ang-012',
  'eg-sub-sim-010', 'eg-sub-thales-009', 'eg-sub-cong-013',
];

const found = new Map<string, PracticeQuestion>();
for (const st of G.subTopics ?? []) for (const q of st.questions ?? []) if (NEW.includes(q.id)) found.set(q.id, q);

const render = (s: string) => renderToStaticMarkup(React.createElement(MathText, null, s));
const strip = (h: string) => h.replace(/<[^>]+>/g, '');

let bad = 0;
const fail = (id: string, why: string) => { bad++; console.log(`  ❌ ${id} — ${why}`); };

for (const id of NEW) {
  const q = found.get(id);
  if (!q) { fail(id, 'question not found'); continue; }

  const fenceCount = (q.question.match(/```geo/g) ?? []).length;
  const stepFences = (q.solution?.steps ?? []).join('\n').match(/```geo/g)?.length ?? 0;
  const tableSteps = (q.solution?.steps ?? []).filter((s) => /\n\s*\|/.test(s)).length;

  const qHtml = render(q.question);
  const sHtml = (q.solution?.steps ?? []).map(render).join('\n');
  const all = qHtml + sHtml;
  const visible = strip(all);

  const notes: string[] = [];
  // 1. every geo fence became a drawing, and no JSON reached the screen.
  // Count only GeoFigure's own <svg role="img">: KaTeX draws \sqrt with an
  // inline <svg> of its own, so a bare /<svg/ count reports two figures for a
  // question that has one figure and one square root. That is the detector
  // being wrong about what it is looking at, not the content.
  const svgs = (all.match(/<svg[^>]*role="img"/g) ?? []).length;
  if (svgs !== fenceCount + stepFences) notes.push(`${fenceCount + stepFences} fence(s) but ${svgs} <svg>`);
  if (visible.includes('{"points"')) notes.push('raw figure JSON is VISIBLE on screen');
  if (visible.includes('```')) notes.push('a code fence leaked as text');
  // 2. KaTeX parsed every island
  if (/katex-error/.test(all)) notes.push('KaTeX failed to parse an island');
  const katex = (all.match(/class="katex/g) ?? []).length;
  if (katex === 0) notes.push('no KaTeX rendered at all');
  // 3. claim-reason tables became tables, not pipes
  const tables = (all.match(/<table/g) ?? []).length;
  if (tableSteps && tables < tableSteps) notes.push(`${tableSteps} table step(s) but ${tables} <table>`);
  if (/\|\s*#\s*\|/.test(visible)) notes.push('a markdown table stayed as raw pipes');
  // 4. the answer spec matches what the question asks for
  const vals = q.expected?.kind === 'set' ? (q.expected.values?.length ?? 0) : 1;
  const labels = q.answerLabels?.length ?? 0;
  if (vals > 1 && labels !== vals) notes.push(`${vals} expected value(s) but ${labels} answerLabels`);
  // 5. Itay's rule: the solution opens by naming the rule
  if (!/הכלל/.test(q.solution?.steps?.[0] ?? '')) notes.push('solution does not open with **הכלל:**');
  // 6. no Hebrew inside a KaTeX island (renders reversed / breaks)
  for (const isl of q.question.match(/\$[^$\n]+\$/g) ?? []) {
    if (/[֐-׿]/.test(isl)) { notes.push(`Hebrew inside KaTeX: ${isl.slice(0, 30)}`); break; }
  }

  if (notes.length) { bad++; console.log(`  ❌ ${id}\n${notes.map((n) => `       ${n}`).join('\n')}`); }
  else console.log(`  ✅ ${id.padEnd(20)} ${svgs} figure(s), ${katex} math island(s), ${tables} table(s), ${labels || vals} answer box(es)`);
}

console.log(`\n${NEW.length} question(s) rendered, ${bad} with a problem`);
if (bad) process.exit(1);
