// A geo figure can be a VALID model and still render with two labels on top of
// each other. This reads the actual rendered SVG and reports any pair of <text>
// anchors closer than a legible gap, plus anything drawn outside the viewBox.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GeoFigure } from '../components/practice/GeoFigure';
import { parseGeo, GEO_FENCE } from '../lib/geo-figure';
import { math5EuclideanGeometry } from '../content/lessons/math5/euclidean-geometry';

// Every figure the geometry topic renders next to a question, example or drill.
const items: [string, string][] = [];
for (const st of math5EuclideanGeometry.subTopics ?? []) {
  (st.lesson ?? []).forEach((l, n) => {
    if (l.example) items.push([`${st.id}/step${n}.example`, l.example.problem]);
    if (l.drill) items.push([l.drill.id, l.drill.question]);
  });
  (st.questions ?? []).forEach((q) => items.push([q.id, q.question]));
}

/** Minimum centre-to-centre gap, in SVG user units, for two labels to be readable. */
const MIN_GAP = 13;

let problems = 0;
for (const [label, text] of items) {
  const m = [...text.matchAll(GEO_FENCE)][0];
  if (!m) { console.log(`·  ${label}: no figure`); continue; }
  const svg = renderToStaticMarkup(React.createElement(GeoFigure, { spec: parseGeo(m[1]) }));

  const vb = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/);
  const texts = [...svg.matchAll(/<text[^>]*\sx="([-\d.]+)"[^>]*\sy="([-\d.]+)"[^>]*>([^<]*)<\/text>/g)]
    .map((t) => ({ x: +t[1], y: +t[2], s: t[3] }));

  const bad: string[] = [];
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      const d = Math.hypot(texts[i].x - texts[j].x, texts[i].y - texts[j].y);
      if (d < MIN_GAP) bad.push(`"${texts[i].s}" ~ "${texts[j].s}" only ${d.toFixed(1)}u apart`);
    }
  if (vb) {
    const [, , , w, h] = vb.map(Number);
    for (const t of texts)
      if (t.x < -2 || t.y < -2 || t.x > w + 2 || t.y > h + 2)
        bad.push(`"${t.s}" at (${t.x},${t.y}) is outside the ${w}×${h} viewBox`);
  }

  if (bad.length) { problems++; console.log(`❌ ${label} (${texts.length} labels)`); bad.forEach((b) => console.log(`     ${b}`)); }
  else console.log(`✅ ${label} — ${texts.length} labels, min gap ok`);
}
console.log(`\n${items.length} figures, ${problems} with a legibility problem`);
