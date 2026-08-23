// Self-check for lib/geo-figure.ts — the validator must ACCEPT a correct sketch
// and REJECT each kind of lie a figure can tell. Run: npx tsx scripts/test-geo-figure.ts
import { checkGeoFences, validateGeo, type GeoSpec } from '../lib/geo-figure';

let fails = 0;
const ok = (name: string, cond: boolean) => { if (!cond) { fails++; console.error(`FAIL ${name}`); } };

// A right triangle ABC with the altitude CH to the hypotenuse — the classic.
const good: GeoSpec = {
  points: { A: [0, 0], B: [8, 0], C: [2, 3.4641016], H: [2, 0], O: [4, 0] },
  polygons: ['ABC'],
  segments: ['CH', { s: 'OC', dashed: true }],
  circles: [{ center: 'O', r: 4, on: ['A', 'B', 'C'] }],
  right: [{ at: 'H', from: 'C', to: 'B' }, { at: 'C', from: 'A', to: 'B' }],
  angles: [{ at: 'B', from: 'A', to: 'C', label: '30°' }],
  labels: [{ on: 'AH', text: '2' }, { on: 'HB', text: '6' }],
  ticks: [{ on: 'OA', n: 1 }, { on: 'OB', n: 1 }],
  parallel: [{ on: 'AB' }, { on: 'AB' }],
};
ok('valid figure passes', validateGeo(good).length === 0);

const bad = (patch: Partial<GeoSpec>, re: RegExp, name: string) => ok(name, validateGeo({ ...good, ...patch }).some((e) => re.test(e)));
bad({ right: [{ at: 'A', from: 'B', to: 'C' }] }, /right-angle mark at A/, 'wrong right angle rejected');
bad({ angles: [{ at: 'B', from: 'A', to: 'C', label: '40°' }] }, /labelled 40° but measures/, 'wrong angle label rejected');
bad({ circles: [{ center: 'O', r: 4, on: ['H'] }] }, /H is not on the circle/, 'point off circle rejected');
bad({ parallel: [{ on: 'AB' }, { on: 'CH' }] }, /not parallel/, 'non-parallel chevrons rejected');
bad({ ticks: [{ on: 'AH', n: 1 }, { on: 'HB', n: 1 }] }, /not equal/, 'unequal ticks rejected');
bad({ labels: [{ on: 'AH', text: '2' }, { on: 'HB', text: '5' }] }, /not to one scale/, 'off-scale lengths rejected');
bad({ segments: ['CX'] }, /unknown point "X"/, 'unknown point rejected');
bad({ segments: ['ABC'] }, /exactly 2 points/, '3-letter segment rejected');
bad({ points: { ...good.points, d: [1, 1] } }, /point name "d"/, 'lowercase name rejected');
ok('non-numeric labels are free', validateGeo({ ...good, angles: [{ at: 'B', from: 'A', to: 'C', label: 'α' }], labels: [{ on: 'AB', text: 'x' }] }).length === 0);

const text = 'נתון משולש.\n\n```geo\n' + JSON.stringify(good) + '\n```\n\nוגם\n\n```geo\n{"points":{"A":[0,0]}}\n```\n\n```geo\n{bad json\n```';
const errs = checkGeoFences(text);
ok('fence #1 clean, #2 too few points, #3 bad JSON', errs.length === 2 && /geo#2: .*at least 2/.test(errs[0]) && /geo#3: invalid JSON/.test(errs[1]));

// --- the rendered SVG must be hydration-stable -----------------------------
// Math.cos/sin/hypot are implementation-defined in ECMAScript, so an unrounded
// coordinate can differ between Node and the browser in its last digit. React
// then reports "a tree hydrated but some attributes … didn't match" and leaves
// the client value in place (measured: 83.13314837617413 vs …566 on an angle
// arc). Every number the component emits must therefore be rounded — assert it
// on the real markup so nobody reintroduces a raw float.
async function renderCheck() {
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { GeoFigure } = await import('../components/practice/GeoFigure');
  const { createElement } = await import('react');

  const rich: GeoSpec = {
    ...good,
    angles: [{ at: 'B', from: 'A', to: 'C', label: '30°', n: 2 }],
    parallel: [{ on: 'AB' }, { on: 'AB' }],
    labels: [{ on: 'AH', text: '2' }, { on: 'HB', text: '6' }, { at: 'C', text: 'משיק' }],
  };
  const html = renderToStaticMarkup(createElement(GeoFigure, { spec: rich }));
  const longs = [...html.matchAll(/\d+\.\d{3,}/g)].map((m) => m[0]);
  ok(`no coordinate carries >2 decimals (found ${longs.length}: ${longs.slice(0, 3).join(' ')})`, longs.length === 0);
  ok('the figure actually rendered', /<svg/.test(html) && /<polyline/.test(html) && /<polygon/.test(html));
  // Same input twice must give byte-identical markup (no Date/random/iteration order).
  ok('render is deterministic', renderToStaticMarkup(createElement(GeoFigure, { spec: rich })) === html);

  if (fails) process.exit(1);
  console.log('test-geo-figure: all checks passed');
}
renderCheck();
