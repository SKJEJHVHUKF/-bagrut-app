// Builds the 17 missing ```geo figures for eg-angles and validates every one
// against the REAL validator before anything is pasted into content.
// Throwaway authoring aid (underscore prefix) — not part of the gate.

import { writeFileSync } from 'node:fs';
import { validateGeo, parseGeo } from '../lib/geo-figure';

const r = (n: number) => Number(n.toFixed(5));
const D2R = Math.PI / 180;

/** Two lines crossing at O; ∠AOC = theta. */
function cross(theta: number, angles: string, width = 300) {
  const a = (180 - theta) * D2R;
  const C: [number, number] = [r(5 * Math.cos(a)), r(5 * Math.sin(a))];
  const pts = `"O":[0,0],"A":[-5,0],"B":[5,0],"C":[${C[0]},${C[1]}],"D":[${-C[0]},${-C[1]}]`;
  return `{"points":{${pts}},"segments":["AB","CD"],"angles":[${angles}],"width":${width}}`;
}

/** AB ∥ CD (y=4 and y=-2) cut by a transversal at M and N; ∠BMN = theta. */
function par(theta: number, opts: { angles?: string; extraPts?: string; extraSegs?: string; parallel?: boolean } = {}) {
  const t = theta * D2R;
  const nx = r(6 / Math.tan(t));
  const ex = r(3.4641016 * Math.cos(t));
  const ey = r(3.4641016 * Math.sin(t));
  const pts =
    `"A":[-7,4],"B":[7,4],"C":[-7,-2],"D":[7,-2],"M":[0,4],"N":[${nx},-2],` +
    `"E":[${-ex},${r(4 + ey)}],"F":[${r(nx + ex)},${r(-2 - ey)}]` +
    (opts.extraPts ? ',' + opts.extraPts : '');
  const segs = '"AB","CD","EF"' + (opts.extraSegs ? ',' + opts.extraSegs : '');
  const parallel = opts.parallel === false ? '' : '"parallel":[{"on":"AB","n":1},{"on":"CD","n":1}],';
  const angles = opts.angles ? `"angles":[${opts.angles}],` : '';
  return `{"points":{${pts}},"segments":[${segs}],${parallel}${angles}"hidden":["E","F"],"width":320}`;
}

const FIGS: Record<string, string> = {
  // ---- lesson step 0: two intersecting lines ----
  'step0.example': cross(126, '{"at":"O","from":"A","to":"C","label":"126°"},{"at":"O","from":"C","to":"B","label":"?"},{"at":"O","from":"B","to":"D","label":"?"},{"at":"O","from":"D","to":"A","label":"?"}'),
  'drill-001': cross(38, '{"at":"O","from":"A","to":"C","label":"38°"},{"at":"O","from":"C","to":"B","label":"?"}'),

  // ---- lesson step 1: right angle split by a ray ----
  'step1.example': (() => {
    const c = 27 * D2R;
    return `{"points":{"O":[0,0],"A":[6,0],"D":[-6,0],"B":[0,6],"C":[${r(6 * Math.cos(c))},${r(6 * Math.sin(c))}]},"segments":["AD","OB","OC"],"right":[{"at":"O","from":"A","to":"B"}],"angles":[{"at":"O","from":"A","to":"C","label":"27°"},{"at":"O","from":"C","to":"B","label":"?"}],"width":300}`;
  })(),
  'drill-002': (() => {
    const by = r(6 * Math.tan(34 * D2R));
    return `{"points":{"C":[0,0],"A":[6,0],"B":[0,${by}]},"polygons":["ABC"],"right":[{"at":"C","from":"A","to":"B"}],"angles":[{"at":"A","from":"C","to":"B","label":"34°"},{"at":"B","from":"C","to":"A","label":"?"}],"width":280}`;
  })(),

  // ---- lesson step 2 + 3: reuse the shapes already proven in the solutions ----
  'step2.example': par(60, { angles: '{"at":"M","from":"B","to":"N","label":"60°"}' }),
  'drill-003': par(60),
  'step3.example': '{"points":{"A":[0,0],"B":[3,0],"C":[7,0],"D":[10,0]},"segments":["AD"],"ticks":[{"on":"AC","n":1},{"on":"BD","n":1}],"width":320}',
  'drill-004': '{"points":{"A":[0,0],"B":[3,0],"C":[7,0],"D":[10,0]},"segments":["AD"],"ticks":[{"on":"AB","n":1},{"on":"CD","n":1}],"width":320}',

  // ---- questions ----
  'eg-ang-001': cross(70, '{"at":"O","from":"A","to":"C","label":"70°"},{"at":"O","from":"B","to":"D","label":"?"}'),
  'eg-ang-002': par(48, { angles: '{"at":"M","from":"B","to":"N","label":"48°"},{"at":"N","from":"M","to":"C","label":"?"}' }),
  'eg-ang-003': '{"points":{"A":[0,0],"D":[13,0],"B":[12,0],"C":[17,0]},"segments":["AC"],"labels":[{"on":"AB","text":"12"},{"on":"BC","text":"5"},{"on":"DC","text":"4"}],"width":340}',
  // NO parallel chevrons: that the lines are parallel is the CONCLUSION the
  // question asks for, so the figure must not assert it. Only the equal pair of
  // corresponding angles is marked.
  'eg-ang-004': par(60, { parallel: false, angles: '{"at":"M","from":"B","to":"N","n":1},{"at":"N","from":"D","to":"F","n":1}' }),
  'eg-ang-005': par(85, { angles: '{"at":"M","from":"B","to":"N","label":"3x+10"},{"at":"N","from":"M","to":"D","label":"5x-30"}' }),
  'eg-ang-006': cross(110, '{"at":"O","from":"A","to":"C","label":"x+40"},{"at":"O","from":"C","to":"B","label":"x"}'),
  'eg-ang-007': '{"points":{"A":[0,0],"B":[3,0],"E":[8,0],"F":[11,0]},"segments":["AF"],"ticks":[{"on":"AE","n":1},{"on":"BF","n":1}],"width":340}',
  // Bisectors of the two co-interior angles meet at K. ∠MKN = 90° is what the
  // student must PROVE, so it is deliberately NOT marked on the figure.
  'eg-ang-008': par(60, {
    extraPts: '"K":[5.19615,1]',
    extraSegs: '"MK","NK"',
    angles:
      '{"at":"M","from":"B","to":"K","n":1},{"at":"M","from":"K","to":"N","n":1},' +
      '{"at":"N","from":"M","to":"K","n":2},{"at":"N","from":"K","to":"D","n":2}',
  }),
  // Equal-arc marks only: the two sizes are what the student has to find.
  'eg-ang-009': cross(116, '{"at":"O","from":"A","to":"C","n":2},{"at":"O","from":"B","to":"D","n":2},{"at":"O","from":"C","to":"B","n":1},{"at":"O","from":"D","to":"A","n":1}'),
};

let bad = 0;
for (const [k, json] of Object.entries(FIGS)) {
  let errs: string[];
  try {
    errs = validateGeo(parseGeo(json));
  } catch (e) {
    errs = [`invalid JSON — ${(e as Error).message}`];
  }
  if (errs.length) {
    bad++;
    console.log(`❌ ${k}`);
    errs.forEach((e) => console.log(`     ${e}`));
    console.log(`     ${json}`);
  } else {
    console.log(`✅ ${k}`);
  }
}
console.log(`\n${Object.keys(FIGS).length} figures, ${bad} invalid`);
if (!bad) {
  writeFileSync('scripts/_angle-figs.json', JSON.stringify(FIGS, null, 2));
  console.log('wrote scripts/_angle-figs.json');
}
