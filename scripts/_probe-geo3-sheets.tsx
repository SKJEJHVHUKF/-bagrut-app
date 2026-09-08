/**
 * _probe-geo3-sheets.tsx — rasterise the geometry figures into contact sheets.
 *
 *   npx tsx scripts/_probe-geo3-sheets.tsx [filter]
 *
 * The geo validator proves a figure is a consistent geometric MODEL; it cannot
 * see a label sitting on top of a point marker or a figure that renders
 * off-canvas. Those are the defects the owner reported, so the figures have to
 * be looked at. sharp rasterises each <svg> and tiles them 3-across.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mkdirSync } from 'fs';
import sharp from 'sharp';
import { GeoFigureFromJson } from '../components/practice/GeoFigure';
import { getSubTopic, getLesson } from '../content/lessons';

const FILTER = process.argv[2] ?? '';
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

// Walk EVERY stage. A hard-coded list of five silently skipped eg-congruence,
// which is where the owner found a label sitting on a tick mark.
const lesson = getLesson('math5', 'גיאומטריה אוקלידית') as {
  subTopics?: { id: string; questions?: { id: string }[] }[];
  bagrutQuestions?: unknown;
};
for (const st of lesson?.subTopics ?? []) {
  // name each question's figures by its own id so `[filter]` can be a question id
  for (const q of st.questions ?? []) collect(`${st.id}/${q.id}`, q);
  collect(`${st.id}/teach`, { ...st, questions: undefined });
}
collect('bagrut', lesson?.bagrutQuestions);

const wanted = FILTER.split(',').filter(Boolean);
const picked = figs.filter((f) => !wanted.length || wanted.some((w) => f.where.includes(w)));
console.log(`${picked.length} figures match "${FILTER}"`);

const COLS = 3;
const CELL_W = 420;
const CELL_H = 320;
const PER_SHEET = COLS * 3;

async function main() {
  mkdirSync('scratch', { recursive: true });
  for (let s = 0; s * PER_SHEET < picked.length; s++) {
    const slice = picked.slice(s * PER_SHEET, (s + 1) * PER_SHEET);
    const rows = Math.ceil(slice.length / COLS);
    const tiles = await Promise.all(
      slice.map(async ({ where, json }, i) => {
        const svg = renderToStaticMarkup(React.createElement(GeoFigureFromJson, { json }));
        if (!svg.includes('<svg')) throw new Error(`${where} renders NO <svg> — the figure is invisible in the app:\n${json}`);
        const only = svg.slice(svg.indexOf('<svg'), svg.lastIndexOf('</svg>') + 6);
        const png = await sharp(Buffer.from(only))
          .resize(CELL_W - 20, CELL_H - 40, { fit: 'inside', background: '#fff' })
          .flatten({ background: '#ffffff' })
          .png()
          .toBuffer();
        const meta = await sharp(png).metadata();
        const label = `<svg width="${CELL_W}" height="18" xmlns="http://www.w3.org/2000/svg"><text x="4" y="13" font-family="monospace" font-size="11" fill="#334155">#${s * PER_SHEET + i} ${where}</text></svg>`;
        return {
          png,
          label: Buffer.from(label),
          w: meta.width ?? 0,
          h: meta.height ?? 0,
          col: i % COLS,
          row: Math.floor(i / COLS),
        };
      }),
    );
    const sheet = sharp({
      create: {
        width: COLS * CELL_W,
        height: rows * CELL_H,
        channels: 3,
        background: '#f8fafc',
      },
    }).composite(
      tiles.flatMap((t) => [
        { input: t.label, left: t.col * CELL_W, top: t.row * CELL_H + 2 },
        {
          input: t.png,
          left: t.col * CELL_W + Math.floor((CELL_W - t.w) / 2),
          top: t.row * CELL_H + 22 + Math.floor((CELL_H - 30 - t.h) / 2),
        },
      ]),
    );
    const out = `scratch/geo-sheet-${(FILTER || 'all').replace(/[^\w.-]/g, '_')}-${s}.png`;
    await sheet.png().toFile(out);
    console.log(out);
  }
}

main();
