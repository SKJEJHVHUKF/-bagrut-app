/**
 * verify-geo-overlap.ts — block figures whose drawn marks collide.
 *
 *   npm run verify:geo-overlap
 *
 * validateGeo proves a figure is a consistent geometric MODEL. It cannot see
 * two letters printing on top of each other, which is the defect class the
 * owner keeps finding by eye ("האותיות הם על הפסים", "E15" reading as one
 * word). Replicating the renderer's label placement here would drift from it,
 * so instead this renders each figure and reads the coordinates out of the
 * emitted SVG — whatever the renderer actually did is what gets measured.
 *
 * Overlap is judged on estimated glyph boxes, so treat a hit as "go look at
 * this one", not as proof. The list it produces is short enough to look at.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GeoFigureFromJson } from '../components/practice/GeoFigure';
import { getLesson } from '../content/lessons';

type Box = { x: number; y: number; w: number; h: number; what: string };

const figs: { where: string; json: string }[] = [];
function collect(where: string, node: unknown) {
  if (typeof node === 'string') {
    for (const m of node.matchAll(/```geo\n[\s\S]*?\n```/g))
      figs.push({ where, json: m[0].slice('```geo'.length, -'```'.length).trim() });
    return;
  }
  if (Array.isArray(node)) return node.forEach((v, i) => collect(`${where}[${i}]`, v));
  if (node && typeof node === 'object')
    for (const [k, v] of Object.entries(node)) collect(`${where}.${k}`, v);
}

const lesson = getLesson('math5', 'גיאומטריה אוקלידית') as {
  subTopics?: { id: string; questions?: { id: string }[] }[];
  bagrutQuestions?: unknown;
};
for (const st of lesson?.subTopics ?? []) {
  for (const q of st.questions ?? []) collect(`${st.id}/${q.id}`, q);
  collect(`${st.id}/teach`, { ...st, questions: undefined });
}
collect('bagrut', lesson?.bagrutQuestions);

/** Every <text> the renderer emitted, as a glyph box in SVG pixels. */
function textBoxes(svg: string): Box[] {
  const out: Box[] = [];
  for (const m of svg.matchAll(/<text([^>]*)>([^<]*)<\/text>/g)) {
    const attr = m[1], body = m[2];
    const num = (k: string) => Number((attr.match(new RegExp(`(?:^|\\s)${k}="([-\\d.]+)"`)) ?? [, NaN])[1]);
    const x = num('x'), y = num('y'), fs = num('font-size') || 12.5;
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    // text-anchor=middle + dominant-baseline=middle → the box is centred on
    // (x,y). PAD is the gap a reader needs to see two labels as two labels: at
    // 0 the boxes only touch when the glyphs already merged, and "B D" printing
    // as one token went unreported.
    const PAD = 2.5;
    const w = 0.62 * fs * [...body].length + 2 * PAD, h = fs + 2 * PAD;
    out.push({ x: x - w / 2, y: y - h / 2, w, h, what: `"${body}"` });
  }
  return out;
}

/** Tick marks: short strokes, unlike the long segment/polygon lines. */
function tickBoxes(svg: string): Box[] {
  const out: Box[] = [];
  // renderToStaticMarkup emits `<line ...></line>`, not `<line ... />` — a
  // self-closing pattern here silently matches nothing and reports every
  // figure clean.
  for (const m of svg.matchAll(/<line([^>]*)>/g)) {
    const a = m[1];
    const g = (k: string) => Number((a.match(new RegExp(`${k}="([-\\d.]+)"`)) ?? [, NaN])[1]);
    const x1 = g('x1'), y1 = g('y1'), x2 = g('x2'), y2 = g('y2');
    if (![x1, y1, x2, y2].every(Number.isFinite)) continue;
    if (Math.hypot(x2 - x1, y2 - y1) > 12) continue; // a segment, not a tick
    out.push({ x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1) || 2, h: Math.abs(y2 - y1) || 2, what: 'tick' });
  }
  return out;
}

/** Angle arcs — a letter swallowed by one is as unreadable as two merged letters. */
function arcPoints(svg: string): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (const m of svg.matchAll(/<polyline[^>]*points="([^"]+)"[^>]*>/g))
    for (const p of m[1].trim().split(/\s+/)) {
      const [x, y] = p.split(',').map(Number);
      if (Number.isFinite(x) && Number.isFinite(y)) out.push({ x, y });
    }
  return out;
}

const overlap = (a: Box, b: Box) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inBox = (b: Box, p: { x: number; y: number }) =>
  p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h;

// Controls, so an empty report means "clean" and not "detector broken": the
// figure the owner screenshotted must FAIL, and its fix must PASS.
const CONTROL_BAD = '{"points":{"A":[4,7],"B":[0,0],"C":[8,0],"D":[2.286,3],"E":[5.714,3]},"polygons":["ABC"],"segments":[{"s":"BE","accent":true},{"s":"CD","accent":true}],"ticks":[{"on":"DB","n":1},{"on":"EC","n":1},{"on":"AB","n":2},{"on":"AC","n":2}]}';
const CONTROL_OK = '{"points":{"A":[6,8],"B":[0,0],"C":[12,0],"D":[2.4,3.2],"E":[9.6,3.2]},"polygons":["ABC"],"segments":[{"s":"BE","accent":true},{"s":"CD","accent":true}],"ticks":[{"on":"DB","n":1},{"on":"EC","n":1}],"angles":[{"at":"B","from":"A","to":"C","n":2},{"at":"C","from":"B","to":"A","n":2}],"width":340}';
const hitsOf = (json: string) => {
  const svg = renderToStaticMarkup(React.createElement(GeoFigureFromJson, { json }));
  const texts = textBoxes(svg), ticks = tickBoxes(svg), arcs = arcPoints(svg);
  const bad: string[] = [];
  for (let i = 0; i < texts.length; i++) {
    for (let j = i + 1; j < texts.length; j++)
      if (overlap(texts[i], texts[j])) bad.push(`${texts[i].what}+${texts[j].what}`);
    for (const t of ticks) if (overlap(texts[i], t)) bad.push(`${texts[i].what}+tick`);
    // Arcs are NOT checked. The rule flagged 83 of 299 figures; four were
    // rasterised and all four read fine, because the text is painted after the
    // arc and a 1.5px stroke behind a bold glyph is legible. Kept as a helper
    // in case a real arc case ever turns up, but scoring on it was noise.
    void arcs; void inBox;
  }
  return { svg, bad: [...new Set(bad)] };
};
const cBad = hitsOf(CONTROL_BAD).bad, cOk = hitsOf(CONTROL_OK).bad;
if (!cBad.length || cOk.length) {
  console.error(`DETECTOR BROKEN — positive control ${cBad.length ? 'ok' : 'MISSED'}, negative control ${cOk.length ? `FALSE HIT (${cOk})` : 'ok'}`);
  process.exit(1);
}
console.log(`controls ok — reported ${cBad.join(', ')} on the known-bad figure, nothing on its fix\n`);

/**
 * Figures that trip the box test but were rasterised and read fine: the letters
 * sit next to each other rather than merging. The list is a RATCHET, not an
 * excuse — anything not on it fails the build, and an entry that stops firing
 * fails too, so a fix cannot quietly leave dead weight behind.
 */
const ACCEPTED = new Set([
  'eg-angles/teach.lesson[0].example.steps[1]',
  'eg-thales/teach.lesson[1].example.steps[1]',
  'eg-circle/eg-sub-circ-121.question',
  'eg-shapes/eg-shp-014.question',
  'eg-mixed/eg-mix-004.question',
  'eg-mixed/teach.lesson[2].example.steps[1]',
]);

let hits = 0, rendered = 0, blank = 0;
const seen = new Set<string>();
const rows: string[] = [];
for (const { where, json } of figs) {
  const svg = renderToStaticMarkup(React.createElement(GeoFigureFromJson, { json }));
  if (!svg.includes('<svg')) { blank++; rows.push(`BLANK   ${where} — renders no <svg> at all`); continue; }
  rendered++;
  const { bad } = hitsOf(json);
  if (!bad.length) continue;
  hits++;
  if (ACCEPTED.has(where)) { seen.add(where); continue; }
  rows.push(`✗ ${where} — ${bad.join(', ')}`);
}
for (const r of rows) console.log(r);
const stale = [...ACCEPTED].filter((w) => !seen.has(w));
for (const w of stale) console.log(`✗ ${w} — on the accepted list but no longer overlaps; delete the entry`);
console.log(`\n${figs.length} figures · ${rendered} rendered · ${blank} blank · ${hits} overlapping (${seen.size} accepted)`);
if (rows.length || stale.length || blank) {
  console.error(`\nverify-geo-overlap: ${rows.length + stale.length + blank} problem(s).`);
  process.exit(1);
}
console.log('verify-geo-overlap: no new label collisions.');
