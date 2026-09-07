// Screen-space label-collision scan over every geometry ```geo fence.
// parseGeo gives math coords; GeoFigure maps them into a fixed-width viewport,
// so two points closer than ~0.13 of the drawing's diagonal end up with their
// bold single-letter labels on top of each other.
import { parseGeo } from '../lib/geo-figure';
import { getSubTopic, getLesson } from '../content/lessons';

const figs: { where: string; json: string }[] = [];
function collect(where: string, node: unknown) {
  if (typeof node === 'string') {
    for (const m of node.matchAll(/```geo\n[\s\S]*?\n```/g))
      figs.push({ where, json: m[0].slice(6, -3).trim() });
    return;
  }
  if (Array.isArray(node)) return node.forEach((v, i) => collect(`${where}[${i}]`, v));
  if (node && typeof node === 'object') for (const [k, v] of Object.entries(node)) collect(`${where}.${k}`, v);
}
for (const id of ['eg-similarity', 'eg-thales', 'eg-circle', 'eg-method', 'eg-mixed'])
  collect(id, getSubTopic('math5', 'גיאומטריה אוקלידית', id));
collect('bagrut', (getLesson('math5', 'גיאומטריה אוקלידית') as { bagrutQuestions?: unknown })?.bagrutQuestions);

let hits = 0;
for (const { where, json } of figs) {
  const spec = parseGeo(json);
  const hidden = new Set(spec.hidden ?? []);
  const pts = Object.entries(spec.points).filter(([n]) => !hidden.has(n));
  const xs = pts.map(([, p]) => p[0]);
  const ys = pts.map(([, p]) => p[1]);
  const diag = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
  if (!diag) continue;
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i][1][0] - pts[j][1][0], pts[i][1][1] - pts[j][1][1]);
      if (d / diag < 0.13) {
        hits++;
        console.log(`⚠ ${where}: labels ${pts[i][0]} and ${pts[j][0]} are ${(100 * d / diag).toFixed(1)}% of the diagonal apart`);
      }
    }
}
console.log(`\n${figs.length} figures scanned · ${hits} label pair(s) too close`);
