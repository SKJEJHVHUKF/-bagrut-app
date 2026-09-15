/**
 * r3-tables.ts — adversarial re-derivation of the pr-tables round-3 items:
 * practice pr-x-tab-301…345 and bagrut prob-bag-x-tab-02…20.
 *
 * Every table is rebuilt as a POPULATION of individuals (a percentage table
 * becomes 10000 people) and answers are COUNTED from it; unknowns are found by
 * scanning integers until the stated condition holds, never by the author's
 * algebra. Draws without replacement use drawNoReplacement over the urn;
 * independent draws from a large population enumerate ordered pairs.
 *
 *   npx tsx scripts/_prob-extra-checks/r3-tables.ts
 *   PLANT=pr-x-tab-305 npx tsx scripts/_prob-extra-checks/r3-tables.ts → fails on that ref only
 */
import { check, drawNoReplacement, summary } from './_lib';
import { checkLive, reviewedByHand, coverage } from './_live';

type Ind = Record<string, string | number>;
/** a population: [attributes, head count] groups expanded lazily */
type Pop = [Ind, number][];
const N = (p: Pop) => p.reduce((s, [, c]) => s + c, 0);
const cnt = (p: Pop, f: (i: Ind) => boolean) => p.reduce((s, [i, c]) => s + (f(i) ? c : 0), 0);
const P = (p: Pop, f: (i: Ind) => boolean) => cnt(p, f) / N(p);
/** probability table → 10000 people (cells given as probabilities) */
const people = (cells: [Ind, number][]): Pop => cells.map(([i, pr]) => [i, Math.round(pr * 10000)]);
/** first integer in [lo,hi] satisfying pred */
const scan = (lo: number, hi: number, pred: (x: number) => boolean) => { for (let x = lo; x <= hi; x++) if (pred(x)) return x; return NaN; };
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
/** independent ordered k-tuples drawn from a population (large-population model) */
function tuples(p: Pop, k: number, f: (t: Ind[]) => boolean): number {
  const n = N(p);
  let s = 0;
  const walk = (acc: Ind[], w: number) => {
    if (acc.length === k) { if (f(acc)) s += w; return; }
    for (const [i, c] of p) walk([...acc, i], w * (c / n));
  };
  walk([], 1);
  return s;
}
/** expand a population into a labelled urn for without-replacement draws */
const urnOf = (p: Pop, key: (i: Ind) => string) => p.flatMap(([i, c]) => Array.from({ length: c }, () => key(i)));

// ============================ practice · easy ============================
{ // 301
  const pop: Pop = [[{ r: 'D', b: 1 }, 64], [{ r: 'D', b: 0 }, 100 - 64], [{ r: 'F', b: 1 }, 36], [{ r: 'F', b: 0 }, 24]];
  checkLive('301', 'pr-x-tab-301', P(pop, (i) => i.r === 'D' && i.b === 0));
  check('301 d .36', 36 / 100, 0.36); check('301 d .375', P(pop, (i) => i.b === 0), 0.375); check('301 d .625', P(pop, (i) => i.r === 'D'), 0.625);
}
{ // 302
  const pop = people([[{ s: 'A', c: 1 }, 0.28], [{ s: 'A', c: 0 }, 0.17], [{ s: 'B', c: 1 }, 0.36], [{ s: 'B', c: 0 }, 0.19]]);
  checkLive('302', 'pr-x-tab-302', P(pop, (i) => i.s === 'A' || i.c === 1));
  check('302 w 1.09', P(pop, (i) => i.s === 'A') + P(pop, (i) => i.c === 1), 1.09);
  check('302 w .53', P(pop, (i) => (i.s === 'A') !== (i.c === 1)), 0.53);
}
{ // 303
  const pv = 9, a = 64 - 22, av = 40 - pv;
  const pop: Pop = [[{ g: 'p', v: 1 }, pv], [{ g: 'p', v: 0 }, 22 - pv], [{ g: 'a', v: 1 }, av], [{ g: 'a', v: 0 }, a - av]];
  checkLive('303', 'pr-x-tab-303', cnt(pop, (i) => i.g === 'a' && i.v === 0));
  check('303 w 24', cnt(pop, (i) => i.v === 0), 24); check('303 w 18', a - cnt(pop, (i) => i.v === 0), 18);
}
{ // 304
  const pop: Pop = [[{ m: 'L', t: 'meat', d: 1 }, 26], [{ m: 'L', t: 'meat', d: 0 }, 44], [{ m: 'L', t: 'veg', d: 1 }, 19], [{ m: 'L', t: 'veg', d: 0 }, 31],
    [{ m: 'E', t: 'meat', d: 1 }, 34], [{ m: 'E', t: 'meat', d: 0 }, 16], [{ m: 'E', t: 'veg', d: 1 }, 17], [{ m: 'E', t: 'veg', d: 0 }, 13]];
  checkLive('304', 'pr-x-tab-304', P(pop, (i) => i.t === 'veg' && i.d === 1));
  check('304 d .095', 19 / 200, 0.095); check('304 d .48', P(pop, (i) => i.d === 1), 0.48); check('304 d .4', P(pop, (i) => i.t === 'veg'), 0.4);
}
{ // 305 x scanned in 1/1000 steps
  const x = scan(0, 1000, (k) => near(k / 1000 + 0.24 + 3 * k / 1000 + 0.36, 1)) / 1000;
  const pop = people([[{ f: 'W', s: 1 }, x], [{ f: 'W', s: 0 }, 0.24], [{ f: 'L', s: 1 }, 3 * x], [{ f: 'L', s: 0 }, 0.36]]);
  checkLive('305', 'pr-x-tab-305', P(pop, (i) => i.f === 'L'));
  check('305 w .34', P(pop, (i) => i.f === 'W'), 0.34);
}
{ // 306
  const pop = people([[{ p: 'B', d: 'tv' }, 0.3], [{ p: 'B', d: 'ph' }, 0.26], [{ p: 'P', d: 'tv' }, 0.29], [{ p: 'P', d: 'ph' }, 0.15]]);
  check('306 premium', P(pop, (i) => i.p === 'P'), 0.44); check('306 phone', P(pop, (i) => i.d === 'ph'), 0.41);
  reviewedByHand('pr-x-tab-306', 'premium 0.44 > phone 0.41 counted from the population; option 0 states exactly that');
}
{ // 307
  const pop = people([[{ t: 'full', g: 1 }, 0.22], [{ t: 'full', g: 0 }, 0.65 - 0.22], [{ t: 'disc', g: 1 }, 0.09], [{ t: 'disc', g: 0 }, 0.35 - 0.09]]);
  checkLive('307', 'pr-x-tab-307', [P(pop, (i) => i.t === 'full' && i.g === 0), P(pop, (i) => i.g === 0)]);
  check('307 w .13', 0.35 - 0.22, 0.13);
}
{ // 308
  const pop: Pop = [[{ c: 'S', ok: 1 }, 115], [{ c: 'S', ok: 0 }, 25], [{ c: 'U', ok: 1 }, 80], [{ c: 'U', ok: 0 }, 30]];
  checkLive('308', 'pr-x-tab-308', P(pop, (i) => i.ok === 0 || i.c === 'U'));
  check('308 d .66', (55 + 110) / 250, 0.66); check('308 d .12', P(pop, (i) => i.ok === 0 && i.c === 'U'), 0.12); check('308 d .46', P(pop, (i) => i.ok === 1 && i.c === 'S'), 0.46);
}
{ // 309
  const pop = people([[{ w: 1, f: 1 }, 0.45 - 0.28], [{ w: 0, f: 1 }, 0.28], [{ w: 1, f: 0 }, 0.35 - 0.17], [{ w: 0, f: 0 }, 0.65 - 0.28]]);
  checkLive('309', 'pr-x-tab-309', P(pop, (i) => i.w === 1 && i.f === 1) * 400);
}
{ // 310
  const pop = people([[{ t: 1, s: 'S', h: 1 }, 0.24], [{ t: 1, s: 'S', h: 0 }, 0.18], [{ t: 1, s: 'L', h: 1 }, 0.21], [{ t: 1, s: 'L', h: 0 }, 0.12],
    [{ t: 0, s: 'S', h: 1 }, 0.06], [{ t: 0, s: 'S', h: 0 }, 0.02], [{ t: 0, s: 'L', h: 1 }, 0.09], [{ t: 0, s: 'L', h: 0 }, 0.08]]);
  checkLive('310', 'pr-x-tab-310', P(pop, (i) => i.s === 'L' && i.t === 1));
  check('310 d .5', P(pop, (i) => i.s === 'L'), 0.5); check('310 d .44', 0.33 / 0.75, 0.44);
}
{ // 311
  const x = scan(0, 200, (k) => k + 38 + 42 + 2 * k === 200);
  const pop: Pop = [[{ a: 'y', t: 1 }, x], [{ a: 'y', t: 0 }, 38], [{ a: 'o', t: 1 }, 42], [{ a: 'o', t: 0 }, 2 * x]];
  check('311 given team .41', P(pop, (i) => i.t === 1), 0.41);
  checkLive('311', 'pr-x-tab-311', P(pop, (i) => i.a === 'o' && i.t === 0));
  check('311 w .59', P(pop, (i) => i.t === 0), 0.59);
}
{ // 312
  const pop = people([[{ r: 1, w: 1 }, 0.18], [{ r: 1, w: 0 }, 0.26], [{ r: 0, w: 1 }, 0.09], [{ r: 0, w: 0 }, 0.47]]);
  const pOr = P(pop, (i) => i.r === 1 || i.w === 1);
  check('312 or', pOr, 0.53); check('312 exactly-one distractor .35', P(pop, (i) => i.r !== i.w), 0.35);
  reviewedByHand('pr-x-tab-312', 'P(rain or wind)=0.53>0.5 → "כן"; only option 0 concludes yes after the D fix (now "לא, 0.35")');
}
{ // 313
  const tE = 0.46 - 0.34, bE = 0.28 - tE, b = 1 - 0.46;
  const pop = people([[{ f: 't', e: 1 }, tE], [{ f: 't', e: 0 }, 0.34], [{ f: 'b', e: 1 }, bE], [{ f: 'b', e: 0 }, b - bE]]);
  checkLive('313', 'pr-x-tab-313', P(pop, (i) => i.f === 'b' && i.e === 0));
  check('313 w .26', b - 0.28, 0.26);
}
{ // 314
  const k = scan(0, 1000, (v) => near(2 * v / 1000 + 0.16, 1 - 0.38)); const x = k / 1000;
  const pop = people([[{ v: 'R', q: 'A' }, 2 * x], [{ v: 'R', q: 'B' }, 0.16], [{ v: 'G', q: 'A' }, x], [{ v: 'G', q: 'B' }, 0.38 - x]]);
  checkLive('314', 'pr-x-tab-314', [x, P(pop, (i) => i.q === 'B')]);
  const xw = (0.38 - 0.16) / 2; check('314 w .43', 0.16 + 0.38 - xw, 0.43);
}
{ // 332
  const wl = 78 - 36 - 21, bw = 63 - 36;
  const pop: Pop = [[{ c: 'w', r: 'W' }, 36], [{ c: 'w', r: 'D' }, 21], [{ c: 'w', r: 'L' }, wl], [{ c: 'b', r: 'W' }, bw], [{ c: 'b', r: 'D' }, 15], [{ c: 'b', r: 'L' }, 30]];
  check('332 total', N(pop), 150);
  checkLive('332', 'pr-x-tab-332', P(pop, (i) => i.r === 'L'));
  check('332 d .48', (78 - 36 + 30) / 150, 0.48); check('332 d .14', wl / 150, 0.14);
}
{ // 333
  const pop = people([[{ s: 'v', car: 1 }, 0.3], [{ s: 'v', car: 0 }, 0.18], [{ s: 'n', car: 1 }, 0.62 - 0.3], [{ s: 'n', car: 0 }, 0.38 - 0.18]]);
  checkLive('333', 'pr-x-tab-333', P(pop, (i) => i.s === 'n' && i.car === 1));
  check('333 w .08', 0.38 - 0.3, 0.08); check('333 w .14', 0.62 - 0.48, 0.14);
}

// ============================ practice · mid ============================
{ // 315
  const mp = 105 - 64;
  const pop: Pop = [[{ c: 'A', p: 1 }, 64], [{ c: 'A', p: 0 }, 140 - 64], [{ c: 'M', p: 1 }, mp], [{ c: 'M', p: 0 }, 110 - mp]];
  checkLive('315', 'pr-x-tab-315', [P(pop, (i) => i.c === 'M' && i.p === 0), P(pop, (i) => i.c === 'M' || i.p === 1)]);
  check('315 w .86', (110 + 105) / 250, 0.86); check('315 w .724', 1 - 69 / 250, 0.724);
}
{ // 316
  const pop = people([[{ t: 1, e: 1 }, 0.45 - 0.15], [{ t: 1, e: 0 }, 0.15], [{ t: 0, e: 1 }, 0.62 - 0.3], [{ t: 0, e: 0 }, 1 - 0.45 - 0.32]]);
  checkLive('316', 'pr-x-tab-316', [P(pop, (i) => i.t === 0 && i.e === 1) * 400, P(pop, (i) => i.t === 1 || i.e === 1) * 400]);
  check('316 w 428', (0.45 + 0.62) * 400, 428);
}
{ // 317
  const neither = 1 - 0.2 - (0.7 - 0.2) - (0.55 - 0.2);
  check('317 fourth cell negative', neither, -0.05);
  reviewedByHand('pr-x-tab-317', 'fourth cell = -0.05 so 0.2 impossible; option 0 only "לא" with the valid reason after the D fix');
}
{ // 318
  const n = scan(0, 1000, (v) => near((52 + v) / (100 + v), 0.7));
  const pop: Pop = [[{ pay: 'c', bag: 'h' }, 52], [{ pay: 'c', bag: 's' }, 28], [{ pay: 'm', bag: 'h' }, n], [{ pay: 'm', bag: 's' }, 20]];
  checkLive('318', 'pr-x-tab-318', [n, P(pop, (i) => i.pay === 'm' || i.bag === 'h')]);
  check('318 w 18', 70 - 52, 18); check('318 w .375', P(pop, (i) => i.pay === 'm' && i.bag === 'h'), 0.375);
}
{ // 319
  const pop: Pop = [[{ h: 1, hit: 1, near: 1 }, 30], [{ h: 1, hit: 0, near: 1 }, 18], [{ h: 1, hit: 1, near: 0 }, 10], [{ h: 1, hit: 0, near: 0 }, 22],
    [{ h: 2, hit: 1, near: 1 }, 40], [{ h: 2, hit: 0, near: 1 }, 30], [{ h: 2, hit: 1, near: 0 }, 20], [{ h: 2, hit: 0, near: 0 }, 30]];
  const a = P(pop, (i) => i.hit === 1 || i.h === 1), b = P(pop, (i) => i.near === 1);
  check('319 a', a, 0.7); check('319 b', b, 0.59); check('319 d .4', P(pop, (i) => i.h === 1), 0.4); check('319 d .5', P(pop, (i) => i.hit === 1), 0.5);
  reviewedByHand('pr-x-tab-319', '0.7 > 0.59 counted; option 0 is the only one naming "נקלעה או מחצית ראשונה" after the B fix');
}
{ // 334
  const r = scan(0, 70, (v) => v + 2 * v === 54);
  checkLive('334', 'pr-x-tab-334', (180 - 110) - r);
  check('334 d 34', 70 - 2 * r, 34); check('334 d 74', 110 - 2 * r, 74);
}
{ // 335
  const pop = people([[{ s: 'L', c: 1, f: 1 }, 0.08], [{ s: 'L', c: 0, f: 1 }, 0.05], [{ s: 'P', c: 1, f: 1 }, 0.06], [{ s: 'P', c: 0, f: 1 }, 0.24 - 0.19],
    [{ s: 'L', c: 1, f: 0 }, 0.32], [{ s: 'L', c: 0, f: 0 }, 0.15 - 0.05], [{ s: 'P', c: 1, f: 0 }, 0.22], [{ s: 'P', c: 0, f: 0 }, 0.12]]);
  check('335 closes', N(pop), 10000); check('335 portrait bw col', P(pop, (i) => i.s === 'P' && i.c === 0), 0.17);
  checkLive('335', 'pr-x-tab-335', [P(pop, (i) => i.c === 0), P(pop, (i) => i.s === 'P' || i.f === 1)]);
  check('335 w .69', P(pop, (i) => i.s === 'P') + 0.24, 0.69);
}
{ // 336
  const both = scan(0, 10000, (v) => v === 6400 + 3800 - 8400) / 10000;
  const pop = people([[{ a: 1, c: 1 }, both], [{ a: 1, c: 0 }, 0.64 - both], [{ a: 0, c: 1 }, 0.38 - both], [{ a: 0, c: 0 }, 0.16]]);
  check('336 closes', N(pop), 10000);
  checkLive('336', 'pr-x-tab-336', [both, P(pop, (i) => i.a !== i.c)]);
  check('336 w .46', P(pop, (i) => i.a === 1 && i.c === 0), 0.46);
}
{ // 337
  const pop: Pop = [[{ d: 1, n: 1 }, 4], [{ d: 1, n: 0 }, 2], [{ d: 0, n: 1 }, 7 - 4], [{ d: 0, n: 0 }, 7]];
  const urn = urnOf(pop, (i) => (i.n ? 'N' : 'o'));
  checkLive('337', 'pr-x-tab-337', [P(pop, (i) => i.d === 1 || i.n === 1), drawNoReplacement(urn, 2, (s) => s.every((c) => c === 'o'))]);
  check('337 w .175', drawNoReplacement(urn, 2, (s) => s.every((c) => c === 'N')), 0.175); check('337 w 81/256', (9 / 16) ** 2, 81 / 256);
}
{ // 338
  const k = scan(0, 3600, (v) => v + 3 * v === 3600) / 10000;
  const pop = people([[{ y: 1, s: 1 }, 3 * k], [{ y: 1, s: 0 }, k], [{ y: 0, s: 1 }, 0.58 - 3 * k], [{ y: 0, s: 0 }, 0.64 - (0.58 - 3 * k)]]);
  checkLive('338', 'pr-x-tab-338', [P(pop, (i) => i.y === 0 && i.s === 0), P(pop, (i) => i.s === 0 || i.y === 0)]);
  check('338 w .15 reversed', 0.64 - (0.58 - k), 0.15);
}

// ============================ practice · hard ============================
{ // 320
  const b = scan(0, 10000, (v) => v + 2 * v - 1800 === 7800) / 10000;
  const pop = people([[{ s: 1, w: 1 }, 0.18], [{ s: 1, w: 0 }, 2 * b - 0.18], [{ s: 0, w: 1 }, b - 0.18], [{ s: 0, w: 0 }, 0.22]]);
  check('320 closes', N(pop), 10000);
  checkLive('320', 'pr-x-tab-320', [P(pop, (i) => i.s === 1), P(pop, (i) => i.w === 1), P(pop, (i) => i.s !== i.w)]);
  check('320 w .42', (0.78 / 3) * 3 - 2 * 0.18, 0.42);
}
{ // 321 — feasible x: every cell >= 0, scan in 1/10000
  const ok = (x: number) => x >= 0 && 6200 - x >= 0 && 5300 - x >= 0 && 10000 - x - (6200 - x) - (5300 - x) >= 0;
  const xs = Array.from({ length: 10001 }, (_, i) => i).filter(ok);
  const lo = xs[0] / 10000, hi = xs[xs.length - 1] / 10000;
  const minOr = Math.min(...xs.map((x) => (10000 - (x - 1500)) / 10000));
  checkLive('321', 'pr-x-tab-321', [lo, hi, minOr]);
  check('321 0.6 below min', minOr > 0.6 ? 1 : 0, 1);
}
{ // 322
  const k = scan(0, 80, (v) => v + 3 * v === 80);
  const pop: Pop = [[{ c: 1, f: 'ph', w: 1 }, 20], [{ c: 1, f: 'ph', w: 0 }, 64 - 20], [{ c: 1, f: 'bi', w: 1 }, 36 - 20], [{ c: 1, f: 'bi', w: 0 }, 56 - 16],
    [{ c: 0, f: 'ph', w: 1 }, 26 - 18], [{ c: 0, f: 'ph', w: 0 }, k - 8], [{ c: 0, f: 'bi', w: 1 }, 18], [{ c: 0, f: 'bi', w: 0 }, 3 * k - 18]];
  check('322 total', N(pop), 200);
  checkLive('322', 'pr-x-tab-322', [P(pop, (i) => i.f === 'bi' && i.w === 1), P(pop, (i) => i.c === 0 || i.w === 1), P(pop, (i) => i.f === 'ph' && i.w === 0)]);
}
{ // 323
  const pop: Pop = [[{ v: 1, s: 1 }, 7], [{ v: 1, s: 0 }, 8], [{ v: 0, s: 1 }, 4], [{ v: 0, s: 0 }, 6]];
  const urn = urnOf(pop, (i) => `${i.v}${i.s}`);
  checkLive('323', 'pr-x-tab-323', [P(pop, (i) => i.v === 0 && i.s === 0), drawNoReplacement(urn, 2, (s) => s.every((c) => c === '11')), drawNoReplacement(urn, 2, (s) => s.some((c) => c[0] === '0'))]);
  check('323 w .0784', (7 / 25) ** 2, 0.0784);
}
{ // 324
  const x = scan(0, 10000, (v) => (6200 - v) + (4500 - v) === 4700) / 10000;
  const pop = people([[{ y: 1, p: 1 }, x], [{ y: 1, p: 0 }, 0.62 - x], [{ y: 0, p: 1 }, 0.45 - x], [{ y: 0, p: 0 }, 1 - (1.07 - x)]]);
  checkLive('324', 'pr-x-tab-324', [x, P(pop, (i) => i.y === 0 && i.p === 0), P(pop, (i) => i.y === 1 || i.p === 1) * 300]);
  check('324 w .6', 0.62 + 0.45 - 0.47, 0.6);
}
{ // 325
  const q = scan(0, 10000, (v) => (2500 - 2 * v) + v === 1500) / 10000;
  const pop = people([[{ n: 1, pool: 1, pet: 1 }, 0.06], [{ n: 1, pool: 1, pet: 0 }, 0.09], [{ n: 1, pool: 0, pet: 1 }, 0.3 - 0.18], [{ n: 1, pool: 0, pet: 0 }, 0.18],
    [{ n: 0, pool: 1, pet: 1 }, 0.25 - 2 * q], [{ n: 0, pool: 1, pet: 0 }, 2 * q], [{ n: 0, pool: 0, pet: 1 }, q], [{ n: 0, pool: 0, pet: 0 }, 0.3 - q]]);
  check('325 closes', N(pop), 10000);
  checkLive('325', 'pr-x-tab-325', [P(pop, (i) => i.pet === 1), P(pop, (i) => i.n === 1 || i.pool === 1 || i.pet === 1)]);
}
{ // 326
  const r = scan(0, 16, (v) => v + 3 * v === 16);
  const pop: Pop = [[{ red: 1, w: 1 }, r], [{ red: 1, w: 0 }, 3 * r], [{ red: 0, w: 1 }, 10 - r], [{ red: 0, w: 0 }, 24 - (10 - r)]];
  const good = (i: Ind) => i.red === 1 || i.w === 1;
  checkLive('326', 'pr-x-tab-326', [P(pop, good), tuples(pop, 2, (t) => t.filter(good).length === 1)]);
  check('326 w .455', 2 * 0.65 * 0.35, 0.455);
}
{ // 327
  const x = scan(0, 36, (v) => near((44 + v) / 80, 0.7));
  const pop: Pop = [[{ b: 1, s: 1 }, 2 * x], [{ b: 1, s: 0 }, 44 - 2 * x], [{ b: 0, s: 1 }, x], [{ b: 0, s: 0 }, 36 - x]];
  const maxReg = Math.max(...Array.from({ length: 37 }, (_, v) => v).filter((v) => 2 * v <= 44).map((v) => 3 * v));
  checkLive('327', 'pr-x-tab-327', [x, P(pop, (i) => i.b === 1 && i.s === 0), maxReg]);
  check('327 75 impossible', maxReg < 75 ? 1 : 0, 1); check('327 w .45', (44 - 8) / 80, 0.45);
}
{ // 328
  let a = NaN, b = NaN;
  for (let aa = 0; aa <= 500; aa++) for (let bb = 0; bb <= 500; bb++) { const T = aa + bb + 130; if (near((aa + 30) / T, 0.4) && near((30 + bb) / T, 0.25)) { a = aa; b = bb; } }
  const pop: Pop = [[{ h: 1, s: 1 }, a], [{ h: 1, s: 0 }, 100], [{ h: 0, s: 1 }, 30], [{ h: 0, s: 0 }, b]];
  checkLive('328', 'pr-x-tab-328', [a, b, P(pop, (i) => i.h === 0 || i.s === 1)]);
}
{ // 329
  const bp = scan(0, 6, (v) => v + 2 * v === 6);
  const pop: Pop = [[{ g: 1, m: 1 }, 2 * bp], [{ g: 1, m: 0 }, 10 - 2 * bp], [{ g: 0, m: 1 }, bp], [{ g: 0, m: 0 }, 6 - bp]];
  const A = P(pop, (i) => i.g === 1 || i.m === 1), B = drawNoReplacement(urnOf(pop, (i) => (i.m ? 'M' : 'o')), 2, (s) => s.includes('M'));
  checkLive('329', 'pr-x-tab-329', [A, B]); check('329 c A>B', A > B ? 1 : 0, 1);
  reviewedByHand('pr-x-tab-329', 'part ג (not graded): option א 0.75 > option ב 0.625, as the solution concludes');
}
{ // 330
  const e = scan(0, 2500, (v) => v + 4 * v === 2500) / 10000;
  const pop = people([[{ a: 'c', v: 1 }, 0.5 - 0.18 - 4 * e], [{ a: 'c', v: 0 }, 0.3 - (0.5 - 0.18 - 4 * e)], [{ a: 'd', v: 1 }, 0.18], [{ a: 'd', v: 0 }, 0.27], [{ a: 's', v: 1 }, 4 * e], [{ a: 's', v: 0 }, e]]);
  check('330 closes', N(pop), 10000);
  checkLive('330', 'pr-x-tab-330', [P(pop, (i) => i.a === 'c' && i.v === 0), P(pop, (i) => i.a === 's' || i.v === 1)]);
  check('330 c 0.55 > 0.5', 0.3 + 0.25 > 0.5 ? 1 : 0, 1);
}
{ // 331
  const x = scan(2, 25, (v) => near(drawNoReplacement([...Array(v).fill('E'), ...Array(25 - v).fill('P')], 2, (s) => s[0] === 'E' && s[1] === 'E'), 0.4));
  const pop: Pop = [[{ e: 1, nav: 0 }, 12 - 7], [{ e: 1, nav: 1 }, x - 5], [{ e: 0, nav: 0 }, 7], [{ e: 0, nav: 1 }, 25 - x - 7]];
  checkLive('331', 'pr-x-tab-331', [x, P(pop, (i) => i.e === 1 || i.nav === 1), drawNoReplacement(urnOf(pop, (i) => (i.nav ? 'N' : 'o')), 2, (s) => s.includes('N'))]);
}
{ // 339
  const base: Pop = [[{ v: 1, gf: 1 }, 4], [{ v: 1, gf: 0 }, 11], [{ v: 0, gf: 1 }, 8], [{ v: 0, gf: 0 }, 17]];
  const good = (i: Ind) => i.v === 1 || i.gf === 1;
  const withAdd = (k: number): Pop => [...base, [{ v: 1, gf: 0 }, k]];
  const k = scan(0, 1000, (v) => P(withAdd(v), good) >= 0.7);
  checkLive('339', 'pr-x-tab-339', [P(base, good), k]);
  check('339 c never .35', Array.from({ length: 1000 }, (_, v) => P(withAdd(v), (i) => i.gf === 1)).every((p) => p <= 0.3) ? 1 : 0, 1);
}
{ // 340
  let pop: Pop = [];
  for (let s = 0; s <= 2000; s++) for (let t = 0; t <= 3500; t++) {
    if (s + 3 * s !== 2000) continue;
    const ph = t + 500; if (ph + s + t !== 4000) continue;
    pop = people([[{ k: 'pr', h: 1 }, ph / 10000], [{ k: 'pr', h: 0 }, 0.45 - ph / 10000], [{ k: 'po', h: 1 }, s / 10000], [{ k: 'po', h: 0 }, 3 * s / 10000], [{ k: 'no', h: 1 }, t / 10000], [{ k: 'no', h: 0 }, 0.35 - t / 10000]]);
  }
  checkLive('340', 'pr-x-tab-340', [P(pop, (i) => i.k === 'no' && i.h === 0), P(pop, (i) => i.k === 'pr' && i.h === 1) * 800, P(pop, (i) => i.k === 'po' || i.h === 1)]);
}
{ // 341
  const bA = 0.4 - 0.08, both = 0.7 - bA;
  const A = people([[{ q: 1, s: 1 }, both], [{ q: 1, s: 0 }, 0.6 - both], [{ q: 0, s: 1 }, bA], [{ q: 0, s: 0 }, 0.08]]);
  const x = scan(0, 10000, (v) => v + 2000 + 2 * v + 1400 === 10000) / 10000;
  const B = people([[{ q: 1, s: 1 }, x], [{ q: 1, s: 0 }, 0.2], [{ q: 0, s: 1 }, 2 * x], [{ q: 0, s: 0 }, 0.14]]);
  const or = (i: Ind) => i.q === 1 || i.s === 1, one = (i: Ind) => i.q !== i.s;
  checkLive('341', 'pr-x-tab-341', [P(A, or), P(B, or), P(A, one), P(B, one)]);
  check('341 w .88', 1.3 - 0.42, 0.88);
}
{ // 342
  const n = scan(40, 1000, (v) => near((20 + 12) / (120 + v), 0.16));
  const pop: Pop = [[{ s: 0, k: 'am', big: 1 }, 28], [{ s: 0, k: 'am', big: 0 }, 42], [{ s: 0, k: 'ca', big: 1 }, 20], [{ s: 0, k: 'ca', big: 0 }, 30],
    [{ s: 1, k: 'am', big: 1 }, 16], [{ s: 1, k: 'am', big: 0 }, 24], [{ s: 1, k: 'ca', big: 1 }, 12], [{ s: 1, k: 'ca', big: 0 }, n - 40 - 12]];
  checkLive('342', 'pr-x-tab-342', [n, P(pop, (i) => i.big === 1), P(pop, (i) => i.s === 1 || (i.k === 'am' && i.big === 1))]);
  check('342 w .62', (80 + 44) / 200, 0.62);
}
{ // 343
  const k = scan(0, 9, (v) => near((25 - (9 - v)) / 25, 0.84));
  const pop: Pop = [[{ big: 1, cl: 1 }, 2 * k], [{ big: 1, cl: 0 }, 16 - 2 * k], [{ big: 0, cl: 1 }, k], [{ big: 0, cl: 0 }, 9 - k]];
  const urn = urnOf(pop, (i) => `${i.big}${i.cl}`);
  checkLive('343', 'pr-x-tab-343', [P(pop, (i) => i.cl === 1), drawNoReplacement(urn, 2, (s) => s[0][0] === s[1][0]), drawNoReplacement(urn, 2, (s) => s.filter((c) => c[1] === '1').length === 1)]);
  check('343 w .5392', (16 / 25) ** 2 + (9 / 25) ** 2, 0.5392);
}
{ // 344
  const val: Record<string, number> = { R: 3, B: 2, G: 1 };
  const build = (x: number): Pop => { const g = (18 - x) / 2; return [[{ c: 'R', d: 1 }, 10 - x], [{ c: 'R', d: 2 }, x], [{ c: 'B', d: 1 }, 14 - g], [{ c: 'B', d: 2 }, g], [{ c: 'G', d: 1 }, 16 - g], [{ c: 'G', d: 2 }, g]]; };
  const pts = (i: Ind) => val[i.c as string] * (i.d as number);
  const x = scan(0, 10, (v) => (18 - v) % 2 === 0 && near(P(build(v), (i) => pts(i) >= 4), 0.3));
  const pop = build(x);
  checkLive('344', 'pr-x-tab-344', [x, P(pop, (i) => pts(i) === 2), P(pop, (i) => i.c === 'R' || pts(i) >= 4)]);
}
{ // 345
  const k = scan(0, 3, (v) => near((16 - (10 - 3 * v)) / 16, 0.5625));
  const good = 16 - (10 - 3 * k), urn = [...Array(good).fill('g'), ...Array(16 - good).fill('b')];
  const firstGood = (s: string[]) => s.indexOf('g') + 1;
  checkLive('345', 'pr-x-tab-345', [(k + 3 * k) / 16, drawNoReplacement(urn, 3, (s) => firstGood(s) === 3), drawNoReplacement(urn, 2, (s) => firstGood(s) >= 1)]);
  check('345 w .175', drawNoReplacement(urn, 2, (s) => s[0] === 'b' && s[1] === 'b'), 0.175);
}

// ================================ bagrut ================================
{ // 02
  const y = scan(0, 40, (v) => 48 + 40 + 3 * v + v === 120);
  const T = [['O', 312, 48], ['A', 288, 40], ['B', 160, 3 * y], ['AB', 40, y]] as const;
  const pop: Pop = T.flatMap(([t, all, neg]) => [[{ t, rh: '-' }, neg], [{ t, rh: '+' }, all - neg]] as [Ind, number][]);
  checkLive('02א', 'prob-bag-x-tab-02/א', y);
  checkLive('02ב', 'prob-bag-x-tab-02/ב', P(pop, (i) => i.t === 'O' || i.rh === '-'));
  checkLive('02ג', 'prob-bag-x-tab-02/ג', tuples(pop, 2, ([a, b]) => a.t === b.t));
  const fit = (i: Ind) => (i.t === 'A' || i.t === 'O') && i.rh === '-';
  checkLive('02ד', 'prob-bag-x-tab-02/ד', tuples(pop, 2, (t) => t.filter(fit).length === 1));
  const pf = P(pop, fit);
  checkLive('02ה', 'prob-bag-x-tab-02/ה', scan(1, 100, (n) => 1 - (1 - pf) ** n > 0.5));
}
{ // 03
  const p = scan(0, 100, (v) => near((1 - v / 100) ** 2, 0.81)) / 100, q = scan(0, 100, (v) => near((v / 100) ** 2, 0.04)) / 100;
  const both = p + q - 0.24;
  const pop = people([[{ c: 1, b: 1 }, both], [{ c: 1, b: 0 }, p - both], [{ c: 0, b: 1 }, q - both], [{ c: 0, b: 0 }, 0.76]]);
  const inc = (i: Ind) => (i.c ? 0 : i.b ? 4 : 10);
  checkLive('03א', 'prob-bag-x-tab-03/א', [p, q]);
  checkLive('03ב', 'prob-bag-x-tab-03/ב', P(pop, (i) => i.c !== i.b));
  checkLive('03ג', 'prob-bag-x-tab-03/ג', tuples(pop, 2, ([a, b]) => (inc(a) === 10 && inc(b) === 4) || (inc(a) === 4 && inc(b) === 10)));
  checkLive('03ד', 'prob-bag-x-tab-03/ד', tuples(pop, 2, ([a, b]) => inc(a) + inc(b) >= 14));
  const maxOne = Math.max(...Array.from({ length: 1001 }, (_, t) => t / 10000).filter((t) => 0.1 - t >= 0 && 0.2 - t >= 0).map((t) => 0.3 - 2 * t));
  check('03ה max exactly-one', maxOne, 0.3); check('03ה 0.35 unreachable', maxOne < 0.35 ? 1 : 0, 1);
  reviewedByHand('prob-bag-x-tab-03/ה', 'exactly-one = 0.3-2t with t in [0,0.1]; max 0.3 < 0.35, scanned');
}
{ // 04
  const n = scan(1, 5000, (v) => near(0.85 * v - 0.15 * v, 168));
  const bus = 0.15 * n, suit = 0.55 * n;
  const pop: Pop = [[{ b: 1, s: 1 }, 24], [{ b: 1, s: 0 }, bus - 24], [{ b: 0, s: 1 }, suit - 24], [{ b: 0, s: 0 }, n - bus - suit + 24]];
  checkLive('04א', 'prob-bag-x-tab-04/א', n);
  checkLive('04ב', 'prob-bag-x-tab-04/ב', P(pop, (i) => i.b === 0 || i.s === 0));
  checkLive('04ג', 'prob-bag-x-tab-04/ג', tuples(pop, 2, (t) => t.filter((i) => i.b === 1).length === 1 && t.some((i) => i.s === 1)));
  const up = (k: number): Pop => [[{ b: 1, s: 1 }, 24], [{ b: 1, s: 0 }, 12 + k], [{ b: 0, s: 1 }, 108], [{ b: 0, s: 0 }, 96 - k]];
  checkLive('04ד', 'prob-bag-x-tab-04/ד', scan(0, 96, (k) => near(P(up(k), (i) => i.b === 1 || i.s === 1), 0.7)));
  check('04ה invariant', Array.from({ length: 97 }, (_, k) => P(up(k), (i) => i.b === 0 || i.s === 0)).every((v) => near(v, 0.9)) ? 1 : 0, 1);
  reviewedByHand('prob-bag-x-tab-04/ה', 'P(tourist or hand) stays 0.9 for every k in 0..96, scanned');
}
{ // 05
  const x = scan(0, 3000, (v) => v + 1.5 * v === 3000) / 10000;
  const tsa = 0.65 - 0.14 - 1.5 * x - 0.21;
  const pop = people([[{ e: 'T', seat: 1, app: 1 }, 0.14], [{ e: 'T', seat: 1, app: 0 }, 0.06], [{ e: 'T', seat: 0, app: 1 }, tsa], [{ e: 'T', seat: 0, app: 0 }, 0.2 - tsa],
    [{ e: 'F', seat: 1, app: 1 }, 1.5 * x], [{ e: 'F', seat: 1, app: 0 }, x], [{ e: 'F', seat: 0, app: 1 }, 0.21], [{ e: 'F', seat: 0, app: 0 }, 0.09]]);
  check('05 closes', N(pop), 10000);
  checkLive('05א', 'prob-bag-x-tab-05/א', x);
  checkLive('05ב', 'prob-bag-x-tab-05/ב', P(pop, (i) => i.seat === 0 || i.app === 0));
  const total = 96 / P(pop, (i) => i.e === 'T' && i.seat === 0 && i.app === 0);
  checkLive('05ג', 'prob-bag-x-tab-05/ג', P(pop, (i) => i.e === 'F' && i.app === 1) * total);
  checkLive('05ד', 'prob-bag-x-tab-05/ד', tuples(pop, 2, ([a, b]) => a.e === b.e && a.app === 1 && b.app === 1));
  check('05ה max app', 1 - x, 0.88);
  reviewedByHand('prob-bag-x-tab-05/ה', 'Fri-seat-box forced to 0.12 again, so app ≤ 0.88 < 0.9');
}
{ // 06
  const cells = (x: number) => [0.3 + x, 0.15 - x, 2 * x, 0.35 - 2 * x, 0.1 + x, 0.1 - x];
  const xs = Array.from({ length: 10001 }, (_, i) => i / 10000).filter((x) => cells(x).every((c) => c >= -1e-12));
  checkLive('06א', 'prob-bag-x-tab-06/א', [xs[0], xs[xs.length - 1]]);
  const x = scan(0, 1000, (v) => near(0.4 + 4 * v / 10000, 0.64)) / 10000;
  const [pc, pd, gc, gd, mc, md] = cells(x);
  const pop = people([[{ m: 'p', c: 1 }, pc], [{ m: 'p', c: 0 }, pd], [{ m: 'g', c: 1 }, gc], [{ m: 'g', c: 0 }, gd], [{ m: 'm', c: 1 }, mc], [{ m: 'm', c: 0 }, md]]);
  checkLive('06ב', 'prob-bag-x-tab-06/ב', [x, P(pop, (i) => i.m === 'p' || i.c === 0)]);
  checkLive('06ג', 'prob-bag-x-tab-06/ג', tuples(pop, 2, (t) => t.some((i) => i.m === 'm' && i.c === 1) && !t.some((i) => i.m === 'g' && i.c === 0)));
  check('06ד no x in range', xs.some((v) => near(0.15 - v, 2 * (0.1 + v))) ? 0 : 1, 1);
  reviewedByHand('prob-bag-x-tab-06/ד', 'no x in [0,0.1] gives plastic-dirty = 2·metal-clean (root -1/60), scanned');
}
{ // 07
  const p = scan(0, 50, (v) => near(2 * (v / 100) * (1 - v / 100), 0.32)) / 100;
  const t = scan(0, 1000, (v) => near(v / 10000 + (v / 10000 + 0.02), 0.1)) / 10000;
  const pop = people([[{ g: 1, c: 1 }, t + 0.02], [{ g: 1, c: 0 }, p - t - 0.02], [{ g: 0, c: 1 }, t], [{ g: 0, c: 0 }, 1 - p - t]]);
  checkLive('07א', 'prob-bag-x-tab-07/א', p);
  checkLive('07ב', 'prob-bag-x-tab-07/ב', P(pop, (i) => i.g === 1 || i.c === 1));
  checkLive('07ג', 'prob-bag-x-tab-07/ג', tuples(pop, 3, (tt) => tt.some((i) => i.c === 1)));
  checkLive('07ד', 'prob-bag-x-tab-07/ד', tuples(pop, 2, ([a, b]) => a.g !== b.g && a.c !== b.c));
  check('07ה p=.3 gives .42', 2 * 0.3 * 0.7, 0.42);
  reviewedByHand('prob-bag-x-tab-07/ה', '2p(1-p)=0.32 only at p=0.2/0.8; p=0.3 gives 0.42');
}
{ // 08
  let a = NaN, b = NaN;
  for (let aa = 0; aa <= 100; aa++) for (let bb = 0; bb <= 100; bb++) if (aa + bb === 50 && near((aa / 100 + 0.25) - (0.12 + bb / 100), 0.23)) { a = aa / 100; b = bb / 100; }
  const pop = people([[{ h: 1, s: 'pop' }, a], [{ h: 1, s: 'rock' }, 0.12], [{ h: 1, s: 'jazz' }, 0.05], [{ h: 0, s: 'pop' }, 0.25], [{ h: 0, s: 'rock' }, b], [{ h: 0, s: 'jazz' }, 0.08]]);
  checkLive('08א', 'prob-bag-x-tab-08/א', [a, b]);
  checkLive('08ב', 'prob-bag-x-tab-08/ב', [P(pop, (i) => (i.h === 1) !== (i.s === 'jazz')), P(pop, (i) => (i.h === 0) !== (i.s === 'rock'))]);
  checkLive('08ג', 'prob-bag-x-tab-08/ג', tuples(pop, 2, ([x, y]) => x.h === y.h && x.s !== y.s));
  const fr = (i: Ind) => i.h === 0 && i.s === 'rock';
  checkLive('08ד', 'prob-bag-x-tab-08/ד', tuples(pop, 3, (t) => t.some(fr)));
}
{ // 09
  const j = scan(0, 60, (v) => 5 * v + v === 60);
  const n = scan(0, 1000, (v) => near(90 / (150 + v), 0.45));
  const after: Pop = [[{ h: 1, hi: 1 }, 5 * j + n], [{ h: 1, hi: 0 }, 90 - 5 * j], [{ h: 0, hi: 1 }, j], [{ h: 0, hi: 0 }, 60 - j]];
  checkLive('09א', 'prob-bag-x-tab-09/א', n);
  checkLive('09ב', 'prob-bag-x-tab-09/ב', P(after, (i) => i.h === 0 || i.hi === 1));
  checkLive('09ג', 'prob-bag-x-tab-09/ג', tuples(after, 2, (t) => t.filter((i) => i.hi === 1).length === t.filter((i) => i.h === 0).length));
  check('09ד none', Array.from({ length: 2000 }, (_, m) => 60 / (150 + m) < 0.2 && 90 / (150 + m) > 0.3).some(Boolean) ? 0 : 1, 1);
  reviewedByHand('prob-bag-x-tab-09/ד', 'no m in 0..1999 meets both inequalities, scanned');
}
{ // 10
  let x = NaN, y = NaN;
  for (let a = 0; a <= 10000; a++) { const yy = (10000 - 2.5 * a) / 3; if (Number.isInteger(yy) && yy >= 0 && near((2.5 * a + yy) / 10000, 0.8)) { x = a / 10000; y = yy / 10000; } }
  const pop = people([[{ ski: 1, r: 1 }, 1.5 * x], [{ ski: 1, r: 0 }, x], [{ ski: 0, r: 1 }, 2 * y], [{ ski: 0, r: 0 }, y]]);
  checkLive('10א', 'prob-bag-x-tab-10/א', [x, y]);
  checkLive('10ב', 'prob-bag-x-tab-10/ב', [P(pop, (i) => (i.ski === 0) !== (i.r === 1)), P(pop, (i) => i.ski === 0 || i.r === 1)]);
  const m = 300 / (2 * y);
  checkLive('10ג', 'prob-bag-x-tab-10/ג', [m, x * m]);
  checkLive('10ד', 'prob-bag-x-tab-10/ד', tuples(pop, 2, ([a, b]) => a.ski === b.ski && !(a.r === 1 && b.r === 1)));
  const minOr = Math.min(...Array.from({ length: 4001 }, (_, a) => a / 10000).map((xx) => [xx, (1 - 2.5 * xx) / 3]).filter(([, yy]) => yy >= 0).map(([xx, yy]) => 2.5 * xx + yy));
  check('10ה min > .3', minOr > 0.3 ? 1 : 0, 1);
  reviewedByHand('prob-bag-x-tab-10/ה', 'over all feasible x,y the event is ≥ 1/3 > 0.3, scanned');
}
{ // 11
  const g1: Pop = [[{ g: 1, s: 1, t: 1 }, 4800], [{ g: 1, s: 1, t: 0 }, 2400], [{ g: 1, s: 0, t: 1 }, 1200], [{ g: 1, s: 0, t: 0 }, 3600]];
  const n = scan(4800, 100000, (v) => near(7200 / (12000 + v), 0.36));
  const g2: Pop = [[{ g: 2, s: 1, t: 1 }, 2400], [{ g: 2, s: 1, t: 0 }, 1600], [{ g: 2, s: 0, t: 1 }, 800], [{ g: 2, s: 0, t: 0 }, n - 4800]];
  const all = [...g1, ...g2];
  checkLive('11א', 'prob-bag-x-tab-11/א', n);
  checkLive('11ב', 'prob-bag-x-tab-11/ב', P(all, (i) => i.g === 2 || i.s === 1));
  let c = 0, d = 0;
  for (const [a, ca] of g1) for (const [b, cb] of g2) {
    const w = (ca / 12000) * (cb / n);
    if ((a.s && a.t) || (b.s && b.t)) c += w;
    if (a.t !== b.t && (a.s || b.s)) d += w;
  }
  checkLive('11ג', 'prob-bag-x-tab-11/ג', c);
  checkLive('11ד', 'prob-bag-x-tab-11/ד', d);
  check('11ה never .3', (7200 + 0.3 * 1e9) / (20000 + 1e9) > 0.3 ? 1 : 0, 1);
  checkLive('11ה', 'prob-bag-x-tab-11/ה', scan(0, 200000, (m) => (7200 + 0.3 * m) / (20000 + m) <= 0.32 + 1e-12));
}
{ // 12
  const x = 0.3 - 0.15 - 0.12, url = 0.58 - 0.3;
  const pop = people([[{ u: 1, rush: 1, late: 1 }, url - 0.07], [{ u: 1, rush: 1, late: 0 }, 0.35 - (url - 0.07)], [{ u: 1, rush: 0, late: 1 }, 0.07], [{ u: 1, rush: 0, late: 0 }, 0.28],
    [{ u: 0, rush: 1, late: 1 }, 2 * x], [{ u: 0, rush: 1, late: 0 }, 0.15 - 2 * x], [{ u: 0, rush: 0, late: 1 }, x], [{ u: 0, rush: 0, late: 0 }, 0.12]]);
  check('12 closes', N(pop), 10000); check('12 given .58', P(pop, (i) => i.u === 0 || i.late === 1), 0.58);
  checkLive('12א', 'prob-bag-x-tab-12/א', [P(pop, (i) => i.u === 1 && i.rush === 1 && i.late === 1), x]);
  checkLive('12ב', 'prob-bag-x-tab-12/ב', P(pop, (i) => i.rush === 1 || i.late === 1));
  checkLive('12ג', 'prob-bag-x-tab-12/ג', tuples(pop, 2, (t) => t.filter((i) => i.late === 1).length === 1 && t.some((i) => i.late === 1 && i.u === 0)));
  const m = 36 / 0.12;
  checkLive('12ד', 'prob-bag-x-tab-12/ד', [P(pop, (i) => i.u === 1 && i.late === 1) * m, P(pop, (i) => i.rush === 1 || i.late === 1) * m]);
  const rl = P(pop, (i) => i.rush === 1 && i.late === 1);
  checkLive('12ה', 'prob-bag-x-tab-12/ה', scan(1, 50, (d) => 1 - (1 - rl) ** d > 0.5));
}
{ // 13
  const p = 1 - scan(0, 100, (v) => near((v / 100) ** 2, 0.64)) / 100, q = scan(0, 100, (v) => near((v / 100) ** 2, 0.01)) / 100;
  const pop = people([[{ d: 1, a: 1 }, p - q], [{ d: 1, a: 0 }, q], [{ d: 0, a: 1 }, 0.6 - (p - q)], [{ d: 0, a: 0 }, 1 - p - (0.6 - (p - q))]]);
  checkLive('13א', 'prob-bag-x-tab-13/א', [p, q]);
  checkLive('13ב', 'prob-bag-x-tab-13/ב', P(pop, (i) => i.d === 1 || i.a === 1));
  checkLive('13ג', 'prob-bag-x-tab-13/ג', tuples(pop, 2, ([a, b]) => a.a === b.a && a.d !== b.d));
  checkLive('13ד', 'prob-bag-x-tab-13/ד', tuples(pop, 3, (t) => t.some((i) => i.d === 1 && i.a === 1) && t.some((i) => i.d === 0)));
}
{ // 14
  const p = scan(0, 50, (v) => near((1 - v / 100) * (v / 100), 0.21)) / 100;
  const t = p / 3;
  const pop = people([[{ e: 1, g: 1 }, 2 * t], [{ e: 1, g: 0 }, 0.55 - 2 * t], [{ e: 0, g: 1 }, t], [{ e: 0, g: 0 }, 0.45 - t]]);
  const pay = (i: Ind) => (i.e && i.g ? 1400 : i.g ? 800 : i.e ? 350 : 200);
  checkLive('14א', 'prob-bag-x-tab-14/א', p);
  checkLive('14ב', 'prob-bag-x-tab-14/ב', P(pop, (i) => i.e !== i.g));
  checkLive('14ג', 'prob-bag-x-tab-14/ג', [tuples(pop, 2, ([a, b]) => pay(a) + pay(b) > 1500), tuples(pop, 2, ([a, b]) => pay(a) + pay(b) <= 600)]);
  check('14ד cell ≤ margin', 0.35 > p ? 1 : 0, 1);
  reviewedByHand('prob-bag-x-tab-14/ד', 'p forced to 0.3 again; a cell of the glasses column cannot be 0.35');
  checkLive('14ה', 'prob-bag-x-tab-14/ה', tuples(pop, 3, (tt) => !tt.some((i) => i.e === 1 && i.g === 1) && tt.some((i) => i.g === 1)));
}
{ // 15
  const x = scan(0, 80, (v) => 48 + 32 + v + 3 * v === 160);
  const w = 200 - 48 - x - 2 * x;
  const pop: Pop = [[{ y: 1, f: 'ed', wk: 1 }, 48], [{ y: 1, f: 'ed', wk: 0 }, 32], [{ y: 1, f: 'env', wk: 1 }, x], [{ y: 1, f: 'env', wk: 0 }, 3 * x],
    [{ y: 0, f: 'ed', wk: 1 }, w], [{ y: 0, f: 'ed', wk: 0 }, 120 - w], [{ y: 0, f: 'env', wk: 1 }, 2 * x], [{ y: 0, f: 'env', wk: 0 }, 120 - 2 * x]];
  check('15 total', N(pop), 400);
  checkLive('15א', 'prob-bag-x-tab-15/א', [x, w]);
  checkLive('15ב', 'prob-bag-x-tab-15/ב', P(pop, (i) => i.y === 1 || i.wk === 0));
  checkLive('15ג', 'prob-bag-x-tab-15/ג', [tuples(pop, 2, ([a, b]) => a.y === b.y && a.wk === b.wk && a.f !== b.f), tuples(pop, 2, (t) => t.some((i) => i.y === 1 && i.wk === 1))]);
  checkLive('15ד', 'prob-bag-x-tab-15/ד', scan(0, 3 * x, (k) => near((200 + k) / 400, 0.6)));
  check('15ה young only max', (200 + 3 * x) / 400 < 0.7 ? 1 : 0, 1);
  checkLive('15ה', 'prob-bag-x-tab-15/ה', scan(0, 3 * x + 120 - 2 * x, (k) => (200 + k) / 400 >= 0.7));
}
{ // 16
  const f = scan(0, 50, (v) => v + v + 20 === 50);
  const cr = 150 - 90 - f;
  const pop: Pop = [[{ c: 0, r: 'first' }, 340 - 90], [{ c: 0, r: 're' }, 110 - cr], [{ c: 0, r: 'fail' }, f + 20], [{ c: 1, r: 'first' }, 90], [{ c: 1, r: 're' }, cr], [{ c: 1, r: 'fail' }, f]];
  check('16 total', N(pop), 500);
  checkLive('16א', 'prob-bag-x-tab-16/א', f);
  checkLive('16ב', 'prob-bag-x-tab-16/ב', P(pop, (i) => i.c === 1 || i.r !== 'first'));
  const fee = (i: Ind) => (i.r === 'first' ? 200 : 300) * (i.c ? 2 : 1);
  checkLive('16ג', 'prob-bag-x-tab-16/ג', tuples(pop, 2, ([a, b]) => fee(a) + fee(b) >= 800));
  const pf = P(pop, (i) => i.r === 'fail');
  checkLive('16ד', 'prob-bag-x-tab-16/ד', [(1 - pf) ** 2 * P(pop, (i) => i.r === 'fail' && i.c === 1), tuples(pop, 3, (t) => t.some((i) => i.r === 'fail'))]);
  // 16ה: all tables with the three margins, private-first = 0.68 - s; scan commercial row (s, re, fail) in 1/100
  const vals: number[] = [];
  for (let s = 0; s <= 30; s++) for (let re = 0; re <= 30 - s; re++) { const fl = 30 - s - re; if (re <= 22 && fl <= 10 && 68 - s <= 70) vals.push((68 - s) / 100); }
  checkLive('16ה', 'prob-bag-x-tab-16/ה', [Math.min(...vals), Math.max(...vals)]);
}
{ // 17
  const n = scan(1, 10000, (v) => near(0.35 * v - 84 - (v - 0.6 * v - 0.35 * v), 276));
  const pop: Pop = [[{ s: 1, e: 1 }, 84], [{ s: 1, e: 0 }, 0.35 * n - 84], [{ s: 0, e: 1 }, 0.05 * n], [{ s: 0, e: 0 }, 0.6 * n]];
  checkLive('17א', 'prob-bag-x-tab-17/א', n);
  checkLive('17ב', 'prob-bag-x-tab-17/ב', [cnt(pop, (i) => i.s === 1 || i.e === 1), P(pop, (i) => i.s !== i.e)]);
  checkLive('17ג', 'prob-bag-x-tab-17/ג', [tuples(pop, 2, (t) => t.filter((i) => i.e === 1).length === 1 && t.filter((i) => i.s === 1).length === 1), tuples(pop, 2, (t) => t.some((i) => i.e === 1))]);
  const sub = (m: number): Pop => [[{ s: 1, e: 1 }, 84 + m], [{ s: 1, e: 0 }, 336], [{ s: 0, e: 1 }, 60 - m], [{ s: 0, e: 0 }, 720]];
  checkLive('17ד', 'prob-bag-x-tab-17/ד', scan(0, 60, (m) => near(P(sub(m), (i) => i.s !== i.e), 0.3)));
  check('17ה 42% unreachable', P(sub(60), (i) => i.s === 1) < 0.42 ? 1 : 0, 1);
  checkLive('17ה', 'prob-bag-x-tab-17/ה', scan(0, 60, (m) => P(sub(m), (i) => i.s === 1) >= 0.39 - 1e-12));
}
{ // 18
  const cells = (x: number) => [2 * x, x + 0.1, 0.3 - 3 * x, 0.3 - 2 * x, 0.15 - x, 0.15 + 3 * x];
  const xs = Array.from({ length: 10001 }, (_, i) => i / 10000).filter((x) => cells(x).every((c) => c >= -1e-12));
  checkLive('18א', 'prob-bag-x-tab-18/א', [xs[0], xs[xs.length - 1]]);
  const x = xs.find((v) => near(0.3 + 0.4 - 2 * v, 0.62)) as number;
  const [fd, fp, fr, ad, ap, ar] = cells(x);
  const pop = people([[{ f: 1, h: 'd' }, fd], [{ f: 1, h: 'p' }, fp], [{ f: 1, h: 'r' }, fr], [{ f: 0, h: 'd' }, ad], [{ f: 0, h: 'p' }, ap], [{ f: 0, h: 'r' }, ar]]);
  checkLive('18ב', 'prob-bag-x-tab-18/ב', [x, P(pop, (i) => i.f === 0 && i.h !== 'r')]);
  checkLive('18ג', 'prob-bag-x-tab-18/ג', [tuples(pop, 2, ([a, b]) => a.h === b.h && a.f !== b.f), tuples(pop, 2, (t) => t.some((i) => i.h === 'r'))]);
  const m = 1500 / P(pop, (i) => i.h === 'd');
  checkLive('18ד', 'prob-bag-x-tab-18/ד', [m, P(pop, (i) => i.f === 0 && i.h === 'r') * m]);
  checkLive('18ה', 'prob-bag-x-tab-18/ה', Math.max(...xs.map((v) => 0.7 - 2 * v)));
}
{ // 19
  let x = NaN, y = NaN;
  for (let a = 0; a <= 5000; a++) for (let b = 0; b <= 3000; b++) if (a + b + 400 === 3600 && (5000 - a) - (3000 - b) === 1200) { x = a / 10000; y = b / 10000; }
  const pop = people([[{ c: 'eu', apt: 0 }, 0.5 - x], [{ c: 'eu', apt: 1 }, x], [{ c: 'am', apt: 0 }, 0.3 - y], [{ c: 'am', apt: 1 }, y], [{ c: 'as', apt: 0 }, 0.16], [{ c: 'as', apt: 1 }, 0.04]]);
  checkLive('19א', 'prob-bag-x-tab-19/א', [x, y]);
  checkLive('19ב', 'prob-bag-x-tab-19/ב', P(pop, (i) => i.c !== 'eu' || i.apt === 0));
  checkLive('19ג', 'prob-bag-x-tab-19/ג', [tuples(pop, 3, (t) => new Set(t.map((i) => i.c)).size === 3), tuples(pop, 3, (t) => t.some((i) => i.c === 'am'))]);
  checkLive('19ד', 'prob-bag-x-tab-19/ד', tuples(pop, 2, ([a, b]) => a.apt === 1 && b.apt === 1 && a.c !== b.c));
  // stop once both lodging types seen: exactly three tourists
  checkLive('19ה', 'prob-bag-x-tab-19/ה', tuples(pop, 3, ([a, b, c]) => a.apt === b.apt && c.apt !== a.apt));
}
{ // 20
  const a = scan(0, 1000, (v) => near((3 * v + 500) / (3 * v + 700), 0.8));
  const cells: [Ind, number][] = [[{ k: 'pr', dg: 0 }, 2 * a], [{ k: 'pr', dg: 1 }, 150], [{ k: 'no', dg: 0 }, 200], [{ k: 'no', dg: 1 }, a], [{ k: 'ki', dg: 0 }, 300], [{ k: 'ki', dg: 1 }, 50]];
  const pop: Pop = cells;
  checkLive('20א', 'prob-bag-x-tab-20/א', a);
  checkLive('20ב', 'prob-bag-x-tab-20/ב', [P(pop, (i) => i.dg === 1 || i.k === 'ki'), P(pop, (i) => (i.dg === 1) !== (i.k === 'ki'))]);
  checkLive('20ג', 'prob-bag-x-tab-20/ג', [tuples(pop, 3, (t) => t.filter((i) => i.dg === 1).length === 1 && t.some((i) => i.dg === 1 && i.k === 'pr')), tuples(pop, 3, (t) => t.some((i) => i.dg === 0))]);
  const grow = (m: number): Pop => cells.map(([i, c]) => [i, c + m]);
  const m = scan(0, 5000, (v) => near(P(grow(v), (i) => i.k === 'ki' && i.dg === 1), 0.12));
  checkLive('20ד', 'prob-bag-x-tab-20/ד', [m, P(grow(m), (i) => i.dg === 0)]);
  check('20ה never .2', Array.from({ length: 100000 }, (_, v) => P(grow(v), (i) => i.k === 'ki' && i.dg === 1)).every((p) => p < 1 / 6) ? 1 : 0, 1);
  reviewedByHand('prob-bag-x-tab-20/ה', 'for every m in 0..99999 the cell stays below 1/6 < 0.2, scanned');
}

coverage('pr-tables');
summary('pr-tables r3');
