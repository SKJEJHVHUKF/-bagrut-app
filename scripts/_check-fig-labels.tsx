// A geo figure can be a VALID model and still render with two labels on top of
// each other. This reads the actual rendered SVG and reports any pair of <text>
// anchors closer than a legible gap, plus anything drawn outside the viewBox.

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GeoFigure } from '../components/practice/GeoFigure';
import { parseGeo, GEO_FENCE } from '../lib/geo-figure';
import { math5EuclideanGeometry } from '../content/lessons/math5/euclidean-geometry';

// EVERY string in the topic that can hold a figure. The first version of this
// script looked only at question / drill / example.problem text, which silently
// skipped `teach` and every `solution.steps` — i.e. most of the figures in the
// lessons, and all of the ones in worked solutions.
const items: [string, string][] = [];
const add = (label: string, text?: string) => {
  if (text?.includes('```geo')) items.push([label, text]);
};
for (const st of math5EuclideanGeometry.subTopics ?? []) {
  (st.lesson ?? []).forEach((l, n) => {
    add(`${st.id}/step${n}.teach`, l.teach);
    add(`${st.id}/step${n}.example.problem`, l.example?.problem);
    (l.example?.steps ?? []).forEach((s: string, i: number) => add(`${st.id}/step${n}.example.steps[${i}]`, s));
    if (l.drill) {
      add(l.drill.id, l.drill.question);
      (l.drill.solution?.steps ?? []).forEach((s: string, i: number) => add(`${l.drill!.id}.steps[${i}]`, s));
    }
  });
  (st.questions ?? []).forEach((q) => {
    add(q.id, q.question);
    (q.solution?.steps ?? []).forEach((s: string, i: number) => add(`${q.id}.steps[${i}]`, s));
  });
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

  // Self-check the MEASUREMENT, not just the figure (claude-4f's suggestion).
  // The regex needs `x` before `y` and no nested <tspan>, so a change to how
  // GeoFigure emits text would make labels unmeasurable — and their collisions
  // structurally unreportable, i.e. this script would go quiet rather than red.
  // Asserting the count per figure turns the one-off 320/320 audit into a
  // guarantee that re-runs forever.
  const tagCount = (svg.match(/<text[\s>]/g) ?? []).length;
  if (tagCount !== texts.length) {
    problems++;
    console.log(`❌ ${label}: MEASUREMENT GAP — ${tagCount} <text> tags but only ${texts.length} parsed; the regex no longer matches GeoFigure's output`);
    continue;
  }

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
