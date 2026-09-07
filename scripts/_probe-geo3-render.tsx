/**
 * _probe-geo3-render.tsx — render every ```geo fence this round added or
 * changed through the app's OWN MathText, and write them to one HTML page so
 * the pictures can be LOOKED AT, not just validated.
 *
 *   npx tsx scripts/_probe-geo3-render.tsx   →  scratch/geo-round3.html
 *
 * The validator proves a figure is a consistent geometric MODEL. It cannot see
 * a label colliding with a point marker, a figure that renders off-canvas, or a
 * fence that never became an <svg> at all — which is exactly the class of defect
 * the owner reported this round.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { writeFileSync, mkdirSync } from 'fs';
import { GeoFigureFromJson } from '../components/practice/GeoFigure';
import { getSubTopic, getLesson } from '../content/lessons';

type Fig = { where: string; fence: string };
const figs: Fig[] = [];

function collect(where: string, node: unknown) {
  if (typeof node === 'string') {
    for (const m of node.matchAll(/```geo\n[\s\S]*?\n```/g)) figs.push({ where, fence: m[0] });
    return;
  }
  if (Array.isArray(node)) return node.forEach((v, i) => collect(`${where}[${i}]`, v));
  if (node && typeof node === 'object')
    for (const [k, v] of Object.entries(node)) collect(`${where}.${k}`, v);
}

for (const id of ['eg-similarity', 'eg-thales', 'eg-circle', 'eg-method', 'eg-mixed'])
  collect(id, getSubTopic('math5', 'גיאומטריה אוקלידית', id));
const lesson = getLesson('math5', 'גיאומטריה אוקלידית') as { bagrutQuestions?: unknown };
collect('bagrut', lesson?.bagrutQuestions);

let noSvg = 0;
const cards = figs
  .map(({ where, fence }, i) => {
    const json = fence.slice('```geo'.length, -'```'.length).trim();
    const html = renderToStaticMarkup(React.createElement(GeoFigureFromJson, { json }));
    if (!html.includes('<svg')) {
      noSvg++;
      console.log(`❌ ${where} — fence did not become an <svg>`);
    }
    return `<figure><figcaption>#${i} · ${where}</figcaption>${html}</figure>`;
  })
  .join('\n');

mkdirSync('scratch', { recursive: true });
writeFileSync(
  'scratch/geo-round3.html',
  `<!doctype html><meta charset="utf-8"><title>geo round 3</title>
<style>
 body{background:#FDFDFB;color:#0F172A;font:13px system-ui;margin:0;padding:16px;direction:rtl}
 figure{display:inline-block;margin:0 8px 16px;padding:8px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;vertical-align:top}
 figcaption{direction:ltr;text-align:left;font:11px ui-monospace;color:#475569;margin-bottom:4px}
 svg{display:block}
</style>
${cards}`,
  'utf8',
);
console.log(`\n${figs.length} geo fences rendered · ${noSvg} produced no <svg>`);
console.log('open scratch/geo-round3.html');
