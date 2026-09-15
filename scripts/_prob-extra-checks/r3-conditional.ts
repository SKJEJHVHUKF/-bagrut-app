/**
 * r3-conditional.ts — adversarial re-derivation of the pr-conditional round-3 items:
 * practice pr-x-cnd-301…320 and bagrut prob-bag-x-cnd-02…15.
 *
 * Never P(A|B) = P(A∩B)/P(B) on the author's numbers. Every conditional is COUNTED:
 * a table becomes a population of individuals, a tree becomes the weighted list of
 * its full paths (a product of independent/branch distributions), draws without
 * replacement go through drawNoReplacement, stopping processes are enumerated as
 * long sequences with the stop index read off each. A conditional is then
 * weight(A and B) / weight(B) summed over those outcomes. Unknowns are found by
 * scanning a grid until the stated condition holds.
 *
 *   npx tsx scripts/_prob-extra-checks/r3-conditional.ts
 *   PLANT=pr-x-cnd-305 npx tsx scripts/_prob-extra-checks/r3-conditional.ts → fails on that ref only
 */
import { check, drawNoReplacement, summary } from './_lib';
import { checkLive, reviewedByHand, coverage } from './_live';

type W<T> = [T, number][];
/** all tuples of independent stages, weight = product */
function prod<T>(ds: W<T>[]): W<T[]> {
  let out: W<T[]> = [[[], 1]];
  for (const d of ds) out = out.flatMap(([t, w]) => d.map(([v, p]) => [[...t, v], w * p] as [T[], number]));
  return out;
}
const rep = <T,>(d: W<T>, n: number) => prod(Array.from({ length: n }, () => d));
const Pw = <T,>(s: W<T>, f: (t: T) => boolean) => s.reduce((a, [t, w]) => a + (f(t) ? w : 0), 0);
const cond = <T,>(s: W<T>, a: (t: T) => boolean, b: (t: T) => boolean) => Pw(s, (t) => a(t) && b(t)) / Pw(s, b);
const near = (a: number, b: number, t = 1e-9) => Math.abs(a - b) < t;
/** first grid value k/den, k in [lo,hi], where pred holds */
const scan = (lo: number, hi: number, den: number, pred: (x: number) => boolean) => {
  for (let k = lo; k <= hi; k++) if (pred(k / den)) return k / den;
  return NaN;
};
const bern = (p: number): W<number> => [[1, p], [0, 1 - p]];
const sum = (t: number[]) => t.reduce((a, b) => a + b, 0);
type Ind = Record<string, string | number>;
/** population: [individual, head count] */
const cnt = (p: [Ind, number][], f: (i: Ind) => boolean) => p.reduce((s, [i, c]) => s + (f(i) ? c : 0), 0);

// ============================ practice · easy ============================
{ // 301 — shelter count table, picked a cat, P(adopted)
  const pop: [Ind, number][] = [[{ a: 'dog', ad: 1 }, 30], [{ a: 'dog', ad: 0 }, 20], [{ a: 'cat', ad: 1 }, 12], [{ a: 'cat', ad: 0 }, 18]];
  const cat = (i: Ind) => i.a === 'cat', ad = (i: Ind) => i.ad === 1;
  checkLive('301', 'pr-x-cnd-301', cnt(pop, (i) => cat(i) && ad(i)) / cnt(pop, cat));
  check('301 d 0.15', cnt(pop, (i) => cat(i) && ad(i)) / cnt(pop, () => true), 0.15);
  check('301 d 2/7', cnt(pop, (i) => cat(i) && ad(i)) / cnt(pop, ad), 2 / 7);
  check('301 d 0.525', cnt(pop, ad) / cnt(pop, () => true), 0.525);
}
{ // 302 — prob table ×100, P(H|E) and P(E|H)
  const pop: [Ind, number][] = [[{ e: 1, h: 1 }, 16], [{ e: 1, h: 0 }, 24], [{ e: 0, h: 1 }, 9], [{ e: 0, h: 0 }, 51]];
  const E = (i: Ind) => i.e === 1, H = (i: Ind) => i.h === 1, both = (i: Ind) => E(i) && H(i);
  const a = cnt(pop, both) / cnt(pop, E), b = cnt(pop, both) / cnt(pop, H);
  checkLive('302', 'pr-x-cnd-302', [a, b]);
  check('302 w swap', b, 0.64); check('302 w cell', cnt(pop, both) / 100, 0.16); check('302 w row twice', a, 0.4);
}
{ // 303 — 10000 cars, "מבין" rates are data, ask the cell non-electric & charging
  const pop: [Ind, number][] = [[{ e: 1, t: 1 }, 2500 * 0.64], [{ e: 1, t: 0 }, 2500 * 0.36], [{ e: 0, t: 1 }, 7500 * 0.04], [{ e: 0, t: 0 }, 7500 * 0.96]];
  checkLive('303', 'pr-x-cnd-303', cnt(pop, (i) => i.e === 0 && i.t === 1) / 10000);
  check('303 w 0.04', cnt(pop, (i) => i.e === 0 && i.t === 1) / cnt(pop, (i) => i.e === 0), 0.04);
  check('303 w 0.01', 0.04 * (cnt(pop, (i) => i.e === 1) / 10000), 0.01);
  check('303 w 0.19', cnt(pop, (i) => i.t === 1) / 10000, 0.19);
}
{ // 304 — tree with unknown second branch x, path 0.52 given
  const x = scan(0, 10000, 10000, (x) => near(Pw(prod<number>([bern(0.65), bern(x)]), ([s, w]) => s === 1 && w === 1), 0.52));
  const t = prod<number>([bern(0.65), bern(x)]);
  checkLive('304', 'pr-x-cnd-304', cond(t, ([, w]) => w === 1, ([s]) => s === 1));
  check('304 d path', Pw(t, ([s, w]) => s === 1 && w === 1), 0.52);
  check('304 d 0.338', 0.65 * 0.52, 0.338); check('304 d 0.13', Pw(t, ([s, w]) => s === 1 && w === 0), 0.13);
}
{ // 305 — 10000 parcels, late → warehouse B (backwards)
  const pop: [Ind, number][] = [[{ w: 'A', l: 1 }, 300], [{ w: 'A', l: 0 }, 5700], [{ w: 'B', l: 1 }, 600], [{ w: 'B', l: 0 }, 3400]];
  const B = (i: Ind) => i.w === 'B', L = (i: Ind) => i.l === 1;
  checkLive('305', 'pr-x-cnd-305', cnt(pop, (i) => B(i) && L(i)) / cnt(pop, L));
  check('305 w 0.06', cnt(pop, (i) => B(i) && L(i)) / 10000, 0.06);
  check('305 w 0.15', cnt(pop, (i) => B(i) && L(i)) / cnt(pop, B), 0.15);
  check('305 w 0.4', cnt(pop, B) / 10000, 0.4);
}
{ // 306 — 1000 strawberries, cell noon & not fresh
  const pop: [Ind, number][] = [[{ m: 1, f: 1 }, 630], [{ m: 1, f: 0 }, 70], [{ m: 0, f: 1 }, 180], [{ m: 0, f: 0 }, 120]];
  checkLive('306', 'pr-x-cnd-306', cnt(pop, (i) => i.m === 0 && i.f === 0) / 1000);
  check('306 w 0.4', cnt(pop, (i) => i.m === 0 && i.f === 0) / cnt(pop, (i) => i.m === 0), 0.4);
  check('306 w 0.18', cnt(pop, (i) => i.m === 0 && i.f === 1) / 1000, 0.18);
  check('306 w 0.19', cnt(pop, (i) => i.f === 0) / 1000, 0.19);
}
{ // 307 — 400 evenings; compare P(jam|game) with P(game|jam)
  const pop: [Ind, number][] = [[{ g: 1, j: 1 }, 80], [{ g: 1, j: 0 }, 20], [{ g: 0, j: 1 }, 90], [{ g: 0, j: 0 }, 210]];
  const a = cnt(pop, (i) => i.g === 1 && i.j === 1) / cnt(pop, (i) => i.g === 1);
  const b = cnt(pop, (i) => i.g === 1 && i.j === 1) / cnt(pop, (i) => i.j === 1);
  check('307 P(jam|game)', a, 0.8); check('307 P(game|jam)', b, 8 / 17); check('307 a>b', a > b ? 1 : 0, 1);
  check('307 d 0.89', 80 / 90, 0.2 / 0.225);
  reviewedByHand('pr-x-cnd-307', 'correct option: P(jam|game)=0.8 > P(game|jam)=8/17 by counting 400 evenings; distractor values match their notes');
}
{ // 308 — two darts p=0.4 independent, given ≥1 hit, P(second missed)
  const s = rep(bern(0.4), 2);
  const B = (t: number[]) => sum(t) >= 1;
  checkLive('308', 'pr-x-cnd-308', cond(s, (t) => t[1] === 0, B));
  check('308 w 0.6', Pw(s, (t) => t[1] === 0), 0.6);
  check('308 w 0.24', Pw(s, (t) => t[1] === 0 && B(t)), 0.24);
  check('308 w 1/3', s.filter(([t]) => B(t) && t[1] === 0).length / s.filter(([t]) => B(t)).length, 1 / 3);
}
{ // 309 — seeds p=0.6, given at least one sprouted, P(both)
  const s = rep(bern(0.6), 2), ge1 = (t: number[]) => sum(t) >= 1, both = (t: number[]) => sum(t) === 2;
  checkLive('309', 'pr-x-cnd-309', cond(s, both, ge1));
  check('309 d .6 (known seed fixed: P(other)|first)', cond(s, both, (t) => t[0] === 1), 0.6);
  check('309 d .36', Pw(s, both), 0.36);
  check('309 d 1/3', s.filter(([t]) => both(t)).length / s.filter(([t]) => ge1(t)).length, 1 / 3);
}
{ // 310 — 3 tests fail 0.1, given ≤1 failure
  const s = rep(bern(0.1), 3), le1 = (t: number[]) => sum(t) <= 1;
  checkLive('310', 'pr-x-cnd-310', [cond(s, (t) => sum(t) === 0, le1), cond(s, (t) => sum(t) === 1, le1)]);
  check('310 w .729', Pw(s, (t) => sum(t) === 0), 0.729); check('310 w .243', Pw(s, (t) => sum(t) === 1), 0.243);
}
{ // 311 — 100 visitors, independence test
  const pop: [Ind, number][] = [[{ c: 1, m: 1 }, 12], [{ c: 1, m: 0 }, 28], [{ c: 0, m: 1 }, 18], [{ c: 0, m: 0 }, 42]];
  const pmc = cnt(pop, (i) => i.c === 1 && i.m === 1) / cnt(pop, (i) => i.c === 1);
  check('311 P(M|C)=P(M)', pmc, cnt(pop, (i) => i.m === 1) / 100);
  check('311 d P(C|M)=0.4=P(C)', cnt(pop, (i) => i.c === 1 && i.m === 1) / cnt(pop, (i) => i.m === 1), cnt(pop, (i) => i.c === 1) / 100);
  reviewedByHand('pr-x-cnd-311', 'correct option "כן": counted P(M|C)=12/40=0.3=P(M); option 3 note (division by 0.3 gives P(C|M)=0.4=P(C)) verified');
}
{ // 312 — find P(student)=x with 18% students-supporters and 45% of students support
  const x = scan(0, 100, 100, (x) => near(10000 * x * 0.45, 1800, 1e-6));
  checkLive('312', 'pr-x-cnd-312', x);
  check('312 w', 0.18 * 0.45, 0.081); check('312 w2', 0.18 + 0.45, 0.63);
}
{ // 313 — count winners by group
  const pop: [Ind, number][] = [[{ g: 1, w: 1 }, 60 * 0.15], [{ g: 1, w: 0 }, 60 * 0.85], [{ g: 0, w: 1 }, 190 * 0.1], [{ g: 0, w: 0 }, 190 * 0.9]];
  checkLive('313', 'pr-x-cnd-313', cnt(pop, (i) => i.w === 1));
  check('313 w 25', 250 * 0.1, 25); check('313 w 9', cnt(pop, (i) => i.g === 1 && i.w === 1), 9); check('313 w 62.5', 250 * 0.25, 62.5);
}
{ // 314 — two dice, product 12, a six somewhere
  const d = [1, 2, 3, 4, 5, 6].map((v) => [v, 1 / 6] as [number, number]);
  const s = prod([d, d]), m = (t: number[]) => t[0] * t[1] === 12;
  checkLive('314', 'pr-x-cnd-314', cond(s, (t) => t.includes(6), m));
  check('314 w 1/18', Pw(s, (t) => t.includes(6) && m(t)), 1 / 18);
  check('314 w 11/36', Pw(s, (t) => t.includes(6)), 11 / 36);
  check('314 w .25', cond(s, (t) => t[0] === 6, m), 0.25);
}
// ============================ practice · mid ============================
{ // 315 — 4 free throws p=0.6
  const s = rep(bern(0.6), 4), e2 = (t: number[]) => sum(t) === 2, f = (t: number[]) => t[0] === 1;
  checkLive('315', 'pr-x-cnd-315', [cond(s, e2, f), Pw(s, e2)]);
  check('315 dependent: P(E|F) != P(E)', near(cond(s, e2, f), Pw(s, e2)) ? 0 : 1, 1);
  check('315 product P(F)P(E)', Pw(s, f) * Pw(s, e2), 0.20736); check('315 w .1728', Pw(s, (t) => e2(t) && f(t)), 0.1728);
  check('315 w .288 (3 throws)', Pw(rep(bern(0.6), 3), (t) => sum(t) === 1), 0.288);
  reviewedByHand('pr-x-cnd-315', 'independence verdict: counted P(E|F)=0.288 vs P(E)=0.3456, so dependent, as the final answer states');
}
{ // 316 — 5 questions p=0.8, pass ≥4; P(pass), P(first wrong | pass)
  const s = rep(bern(0.8), 5), pass = (t: number[]) => sum(t) >= 4, fw = (t: number[]) => t[0] === 0;
  checkLive('316', 'pr-x-cnd-316', [Pw(s, pass), cond(s, fw, pass)]);
  check('316 w .2', Pw(s, fw), 0.2);
  check('316 w 1/5', cond(s, fw, (t) => sum(t) === 4), 1 / 5);
  check('316 w .08192', Pw(s, (t) => fw(t) && pass(t)), 0.08192);
}
{ // 317 — P(exactly one | at least one) = 4/7, find p
  const ratio = (p: number) => { const s = rep(bern(p), 2); return cond(s, (t) => sum(t) === 1, (t) => sum(t) >= 1); };
  const p = scan(1, 999, 1000, (p) => near(ratio(p), 4 / 7));
  checkLive('317', 'pr-x-cnd-317', p);
  const q = 3 / 7; // the note's value, plugged into the mistaken model (at-least written as 2p)
  check('317 w 3/7 solves 2p-model', (2 * q * (1 - q)) / (2 * q), 4 / 7); check('317 w .4', 1 - p, 0.4);
}
{ // 318 — 10000 messages, backwards both ways
  const pop: [Ind, number][] = [[{ s: 1, f: 1 }, 1800], [{ s: 1, f: 0 }, 200], [{ s: 0, f: 1 }, 400], [{ s: 0, f: 0 }, 7600]];
  const S = (i: Ind) => i.s === 1;
  const a = cnt(pop, (i) => S(i) && i.f === 1) / cnt(pop, (i) => i.f === 1), b = cnt(pop, (i) => S(i) && i.f === 0) / cnt(pop, (i) => i.f === 0);
  checkLive('318', 'pr-x-cnd-318', [a, b]);
  check('318 w .18', cnt(pop, (i) => S(i) && i.f === 1) / 10000, 0.18); check('318 w .02', cnt(pop, (i) => S(i) && i.f === 0) / 10000, 0.02);
  check('318 w 2/11', cnt(pop, (i) => !S(i) && i.f === 1) / cnt(pop, (i) => i.f === 1), 2 / 11);
}
{ // 319 — heat days, unknown x, then backwards
  const x = scan(0, 1000, 1000, (x) => near(400 * 0.7 + 600 * x, 520, 1e-6));
  const sold = [[1, 400 * 0.7], [0, 600 * x]] as const;
  checkLive('319', 'pr-x-cnd-319', [x, sold[0][1] / (sold[0][1] + sold[1][1])]);
  check('319 w .28', 280 / 1000, 0.28); check('319 w .24', (600 * x) / 1000, 0.24);
}
{ // 320 — 3 winners of 10, no replacement; independence
  const urn = [...Array(3).fill('W'), ...Array(7).fill('L')];
  const pAB = drawNoReplacement(urn, 2, (q) => q[0] === 'W' && q[1] === 'W');
  const pA = drawNoReplacement(urn, 2, (q) => q[0] === 'W');
  const pB = drawNoReplacement(urn, 2, (q) => q[1] === 'W');
  check('320 P(B|A)', pAB / pA, 2 / 9); check('320 P(B)', pB, 0.3); check('320 P(A∩B)', pAB, 1 / 15);
  check('320 dependent', near(pAB, pA * pB) ? 1 : 0, 0);
  reviewedByHand('pr-x-cnd-320', 'correct option "לא": counted urn draws P(B|A)=2/9 ≠ P(B)=0.3; distractor 3 value 0.09 ≠ P(A∩B)=1/15 verified');
}
// ============================ practice · hard ============================
{ // 321 — 2 arrows per round, P(round ≥1 hit)=0.75 → p; 4 rounds; given exactly 3 good rounds, P(exactly 3 hits)
  const round = (p: number) => rep(bern(p), 2);
  const p = scan(1, 999, 1000, (p) => near(Pw(round(p), (t) => sum(t) >= 1), 0.75));
  const arrows = rep(bern(p), 8); // rounds = pairs (0,1),(2,3),(4,5),(6,7)
  const good = (t: number[]) => [0, 2, 4, 6].filter((i) => t[i] + t[i + 1] >= 1).length;
  checkLive('321', 'pr-x-cnd-321', [p, Pw(arrows, (t) => good(t) === 3), cond(arrows, (t) => sum(t) === 3, (t) => good(t) === 3)]);
  const pw = scan(1, 999, 1000, (q) => near(q + q, 0.75)), gw = Pw(rep(bern(0.75), 4), (t) => sum(t) === 3);
  // w1 carries p=0.375 forward with the given P(good)=0.75 as the denominator
  check('321 w1 p', pw, 0.375); check('321 w1 c', Math.pow(Pw(round(pw), (t) => sum(t) === 1) / 0.75, 3), 125 / 512);
  check('321 w2 no coefficient', gw / 4, 27 / 256);
  check('321 w3 unconditional one-hit per round', Math.pow(Pw(round(p), (t) => sum(t) === 1), 3), 1 / 8);
}
// ============================ moved shipped questions (not in coverage) ============================
{ // pr-x-tab-104 — workers: car 45%, dining 60%, both 30%
  const pop: [Ind, number][] = [[{ r: 1, d: 1 }, 30], [{ r: 1, d: 0 }, 45 - 30], [{ r: 0, d: 1 }, 60 - 30], [{ r: 0, d: 0 }, 100 - 45 - 60 + 30]];
  const nr = (i: Ind) => i.r === 0, nd = (i: Ind) => i.d === 0;
  checkLive('104', 'pr-x-tab-104', [cnt(pop, (i) => nr(i) && nd(i)) / 100, cnt(pop, (i) => nr(i) && nd(i)) / cnt(pop, nr), cnt(pop, (i) => i.r === 1 && i.d === 1) / cnt(pop, (i) => i.d === 1)]);
  check('104 w1 independence cell', 0.55 * 0.4, 0.22); check('104 w1 b', 0.22 / 0.55, 0.4); check('104 w1 c', (0.45 * 0.6) / 0.6, 0.45);
  check('104 w2 b', cnt(pop, (i) => nr(i) && nd(i)) / cnt(pop, nd), 0.625); check('104 w2 c', cnt(pop, (i) => i.r === 1 && i.d === 1) / cnt(pop, (i) => i.r === 1), 2 / 3);
  check('104 w3 c', cnt(pop, (i) => i.r === 1 && i.d === 1) / 100, 0.3);
}
{ // pr-x-tab-202 — library 150, one missing cell; (א) P(young|digital) (ב) P(digital|young)
  const pop: [Ind, number][] = [[{ y: 1, g: 1 }, 45], [{ y: 1, g: 0 }, 30], [{ y: 0, g: 1 }, 15], [{ y: 0, g: 0 }, 75 - 15]];
  const a = cnt(pop, (i) => i.y === 1 && i.g === 1) / cnt(pop, (i) => i.g === 1);
  const b = cnt(pop, (i) => i.y === 1 && i.g === 1) / cnt(pop, (i) => i.y === 1);
  check('202 a', a, 0.75); check('202 b', b, 0.6); check('202 column closes', cnt(pop, (i) => i.g === 0), 90);
  check('202 d2 cell/total', 45 / 150, 0.3);
  reviewedByHand('pr-x-tab-202', 'option 0 "(א) 0.75; (ב) 0.6" matches counted a, b; distractors: both 0.75, both 0.3 (cell/150), swapped 0.6/0.75');
}
{ // pr-x-tab-207 — club 100: gym × pool 30/20/20/30
  const pop: [Ind, number][] = [[{ a: 1, b: 1 }, 30], [{ a: 1, b: 0 }, 20], [{ a: 0, b: 1 }, 20], [{ a: 0, b: 0 }, 30]];
  const PA = cnt(pop, (i) => i.a === 1) / 100, PB = cnt(pop, (i) => i.b === 1) / 100, PAB = cnt(pop, (i) => i.a === 1 && i.b === 1) / 100;
  check('207 a P(A|B)', PAB / PB, 0.6); check('207 b P(B|A)', PAB / PA, 0.6);
  check('207 c dependent', near(PAB, PA * PB) ? 0 : 1, 1); check('207 product', PA * PB, 0.25);
  check('207 d3 cell/100', PAB, 0.3);
  reviewedByHand('pr-x-tab-207', 'option 0: (א) 0.6 (ב) 0.6, dependent since P(A∩B)=0.3 ≠ 0.25; options 1-2 wrong reasons for "independent", option 3 divides by 100');
}

// ============================ bagrut ============================
{ // 02 — suitcases, three-stage tree with x
  type O = { c: number; n: number; l: number };
  const tree = (x: number): W<O> => {
    const out: W<O> = [];
    out.push([{ c: 0, n: 0, l: 1 }, 0.75 * 0.04], [{ c: 0, n: 0, l: 0 }, 0.75 * 0.96]);
    out.push([{ c: 1, n: 1, l: 1 }, 0.25 * x]);
    out.push([{ c: 1, n: 0, l: 1 }, 0.25 * (1 - x) * 0.04], [{ c: 1, n: 0, l: 0 }, 0.25 * (1 - x) * 0.96]);
    return out;
  };
  const L = (o: O) => o.l === 1, C = (o: O) => o.c === 1;
  const x = scan(0, 10000, 10000, (x) => near(Pw(tree(x), L), 0.1));
  checkLive('02א', 'prob-bag-x-cnd-02/א', x);
  checkLive('02ב', 'prob-bag-x-cnd-02/ב', cond(tree(x), C, L));
  checkLive('02ג', 'prob-bag-x-cnd-02/ג', [cond(tree(x), (o) => o.n === 1, L), cond(tree(x), (o) => C(o) && o.n === 0, L)]);
  let mn = 1; for (let k = 0; k <= 1000; k++) mn = Math.min(mn, cond(tree(k / 1000), C, L));
  check('02ד min P(C|L) over x', mn, 0.25); check('02ד min > 0.2', mn > 0.2 ? 1 : 0, 1);
  reviewedByHand('prob-bag-x-cnd-02/ד', 'P(C|L) scanned over x in [0,1]: minimum 0.25 at x=0, so below 20% is impossible');
  const x2 = scan(0, 1200, 1200, (x) => near(cond(tree(x), C, L), 0.5));
  checkLive('02ה', 'prob-bag-x-cnd-02/ה', [x2, cond(tree(x2), C, (o) => !L(o))]);
}
{ // 03 — car wash counts, independence gives x; then without replacement
  const table = (x: number): [Ind, number][] => [[{ s: 1, w: 1 }, x], [{ s: 1, w: 0 }, 16], [{ s: 0, w: 1 }, 36], [{ s: 0, w: 0 }, x]];
  const x = scan(1, 200, 1, (x) => { const t = table(x); const N = cnt(t, () => true); return cnt(t, (i) => i.s === 1 && i.w === 1) * N === cnt(t, (i) => i.s === 1) * cnt(t, (i) => i.w === 1); });
  checkLive('03א', 'prob-bag-x-cnd-03/א', x);
  const t = table(x);
  checkLive('03ב', 'prob-bag-x-cnd-03/ב', [cnt(t, (i) => i.s === 1 && i.w === 1) / cnt(t, (i) => i.s === 1), cnt(t, (i) => i.s === 1 && i.w === 1) / cnt(t, (i) => i.w === 1)]);
  const urn = t.flatMap(([i, c]) => Array(c).fill(`${i.s}${i.w}`) as string[]);
  const bothS = drawNoReplacement(urn, 2, (q) => q[0][0] === '1' && q[1][0] === '1');
  const bothS1W = drawNoReplacement(urn, 2, (q) => q[0][0] === '1' && q[1][0] === '1' && (q[0][1] === '1') !== (q[1][1] === '1'));
  checkLive('03ג', 'prob-bag-x-cnd-03/ג', bothS1W / bothS);
  // ד: P(S)=0.4, P(W)=0.6, P(!S|W)=0.2 → forced cell S∩!W
  const sw = 0.6 - 0.6 * 0.2; check('03ד cell S∩!W negative', 0.4 - sw < 0 ? 1 : 0, 1);
  reviewedByHand('prob-bag-x-cnd-03/ד', 'forced table has S∩W=0.48 > P(S)=0.4, cell S∩!W=-0.08: impossible');
  let mn = 1; for (let k = 0; k <= 400; k++) { const c = k / 1000; const cells = [c, 0.4 - c, 0.6 - c, 1 - 0.4 - 0.6 + c]; if (cells.every((v) => v >= -1e-12)) mn = Math.min(mn, (0.6 - c) / 0.6); }
  checkLive('03ה', 'prob-bag-x-cnd-03/ה', mn);
}
{ // 04 — 3D printer, p from two days, backwards, 6-day Bernoulli
  const day = (p: number): W<string> => [['Af', 0.5 * 0.1], ['Ao', 0.5 * 0.9], ['Bf', 0.5 * p], ['Bo', 0.5 * (1 - p)]];
  const fail = (d: string) => d[1] === 'f';
  const p = scan(0, 1000, 1000, (p) => near(Pw(rep(day(p), 2), (t) => !t.some(fail)), 0.64));
  checkLive('04א', 'prob-bag-x-cnd-04/א', p);
  checkLive('04ב', 'prob-bag-x-cnd-04/ב', cond(day(p), (d) => d === 'Bf', fail));
  const wk = rep(day(p), 6), nf = (t: string[]) => t.filter(fail).length;
  checkLive('04ג', 'prob-bag-x-cnd-04/ג', Pw(wk, (t) => nf(t) <= 1));
  checkLive('04ד', 'prob-bag-x-cnd-04/ד', cond(wk, (t) => t.filter(fail).every((d) => d === 'Bf'), (t) => nf(t) === 2));
}
{ // 05 — recycling in three neighbourhoods, 10000 families
  const pop = (x: number, yB = 0.4): [Ind, number][] => [
    [{ n: 'A', r: 1 }, 2400], [{ n: 'A', r: 0 }, 600], [{ n: 'B', r: 1 }, 4500 * yB], [{ n: 'B', r: 0 }, 4500 * (1 - yB)],
    [{ n: 'C', r: 1 }, 25 * x], [{ n: 'C', r: 0 }, 2500 - 25 * x]];
  const R = (i: Ind) => i.r === 1;
  const x = scan(0, 100, 1, (x) => { const p = pop(x); return near(cnt(p, (i) => i.n === 'C' && R(i)) / cnt(p, R), 0.25); });
  checkLive('05א', 'prob-bag-x-cnd-05/א', x);
  const p = pop(x);
  checkLive('05ב', 'prob-bag-x-cnd-05/ב', [cnt(p, (i) => i.n === 'B' && !R(i)) / cnt(p, (i) => !R(i)), cnt(p, (i) => i.n === 'B' && !R(i)) / cnt(p, (i) => i.n === 'B')]);
  const indep = (n: string) => near(cnt(p, (i) => i.n === n && R(i)) * 10000, cnt(p, (i) => i.n === n) * cnt(p, R), 1e-6);
  check('05ג C indep', indep('C') ? 1 : 0, 1); check('05ג A dep', indep('A') ? 1 : 0, 0);
  reviewedByHand('prob-bag-x-cnd-05/ג', 'counted: C×R cell equals product of margins (independent), A×R does not (dependent)');
  const fam: W<Ind> = p.map(([i, c]) => [i, c / 10000]);
  const pair = prod([fam, fam]);
  checkLive('05ד', 'prob-bag-x-cnd-05/ד', cond(pair, ([a, b]) => a.n !== b.n, ([a, b]) => R(a) && R(b)));
  const y = scan(0, 100, 100, (y) => near(cnt(pop(x, y), R), 6500, 1e-6));
  const p2 = pop(x, y);
  checkLive('05ה', 'prob-bag-x-cnd-05/ה', [y, cnt(p2, (i) => i.n === 'C' && R(i)) / cnt(p2, R)]);
}
{ // 06 — fishing until one of each; sequences of 14 fish
  const p = scan(501, 999, 1000, (p) => near(Pw(rep(bern(p), 2), (t) => t[0] !== t[1]), 0.42));
  checkLive('06א', 'prob-bag-x-cnd-06/א', p);
  const seqs = rep(bern(p), 14);
  const stop = (t: number[]) => { for (let i = 1; i < t.length; i++) if (t[i] !== t[0]) return i + 1; return Infinity; };
  checkLive('06ב', 'prob-bag-x-cnd-06/ב', Pw(seqs, (t) => stop(t) === 4));
  checkLive('06ג', 'prob-bag-x-cnd-06/ג', cond(seqs, (t) => t[3] === 0, (t) => stop(t) === 4));
  checkLive('06ד', 'prob-bag-x-cnd-06/ד', cond(seqs, (t) => t[0] === 1, (t) => stop(t) <= 3));
  let n = 1; while (!(Pw(seqs, (t) => stop(t) <= n) > 0.95)) n++;
  checkLive('06ה', 'prob-bag-x-cnd-06/ה', n);
}
{ // 07 — door to door
  const house = (p: number): W<string> => [['buy', p * 0.25], ['open', p * 0.75], ['shut', 1 - p]];
  const p = scan(0, 1000, 1000, (p) => near(Pw(rep(house(p), 3), (t) => t.some((h) => h !== 'shut')), 0.784));
  checkLive('07א', 'prob-bag-x-cnd-07/א', p);
  checkLive('07ב', 'prob-bag-x-cnd-07/ב', cond(house(p), (h) => h === 'open', (h) => h !== 'buy'));
  const four = rep(house(p), 4), buys = (t: string[]) => t.filter((h) => h === 'buy').length;
  checkLive('07ג', 'prob-bag-x-cnd-07/ג', Pw(four, (t) => buys(t) === 1));
  checkLive('07ד', 'prob-bag-x-cnd-07/ד', cond(four, (t) => t.filter((h) => h !== 'shut').length === 2, (t) => buys(t) === 1));
  const other: W<string> = [['buy', 0.5 * 0.3], ['open', 0.5 * 0.7], ['shut', 0.5]];
  const first = Pw(four, (t) => buys(t) >= 1), second = Pw(rep(other, 3), (t) => t.includes('buy'));
  check('07ה first', first, 0.3439); check('07ה other', second, 0.385875);
  reviewedByHand('prob-bag-x-cnd-07/ה', 'enumerated: 4 houses first area 0.3439 < 3 houses other area 0.385875, answer "other" correct');
}
{ // 08 — park visitors: brute-force the table from three conditional facts
  let T = { s: NaN, e: NaN, c: NaN };
  for (let s = 1; s < 100; s++) for (let e = 1; e < 100; e++) for (let c = 0; c <= Math.min(s, e); c++)
    if (c * 10 === e * 6 && c * 4 === s * 3 && (e - c) * 3 === 100 - s) T = { s: s / 100, e: e / 100, c: c / 100 };
  checkLive('08א', 'prob-bag-x-cnd-08/א', T.e);
  const cell: W<Ind> = [[{ s: 1, e: 1 }, T.c], [{ s: 1, e: 0 }, T.s - T.c], [{ s: 0, e: 1 }, T.e - T.c], [{ s: 0, e: 0 }, 1 - T.s - T.e + T.c]];
  checkLive('08ב', 'prob-bag-x-cnd-08/ב', [cond(cell, (i) => i.s === 1, (i) => i.e === 0), cond(cell, (i) => i.e === 0, (i) => i.s === 1)]);
  const pair = prod([cell, cell]);
  checkLive('08ג', 'prob-bag-x-cnd-08/ג', cond(pair, ([a, b]) => a.e === 1 && b.e === 1, ([a, b]) => (a.s as number) + (b.s as number) === 1));
  let U = { s: NaN, e: NaN };
  for (let s = 1; s < 100; s++) for (let e = 1; e < 100; e++) { const c = (s * e) / 100; if (near(c * 10, e * 6, 1e-9) && near(c * 4, s * 3, 1e-9)) U = { s: s / 100, e: e / 100 }; }
  checkLive('08ד', 'prob-bag-x-cnd-08/ד', [U.e, 1 - U.s - U.e + U.s * U.e]);
  const pS = cond(cell, (i) => i.s === 1, (i) => i.e === 1);
  const five = rep(bern(pS), 5);
  checkLive('08ה', 'prob-bag-x-cnd-08/ה', cond(five, (t) => t[0] === 1, (t) => sum(t) >= 4));
}
{ // 09 — café orders
  const pastry = 400 - 200 - 120, mornP = 0.75 * pastry;
  const k = scan(0, 120, 1, (k) => 120 + k + mornP === 240);
  checkLive('09א', 'prob-bag-x-cnd-09/א', k);
  const pop = (m: number): [Ind, number][] => [[{ t: 'M', o: 'H' }, 120], [{ t: 'M', o: 'C' }, k], [{ t: 'M', o: 'P' }, mornP],
    [{ t: 'A', o: 'H' }, 80], [{ t: 'A', o: 'C' }, 120 - k], [{ t: 'A', o: 'P' }, m]];
  const p = pop(pastry - mornP);
  check('09 table closes', cnt(p, () => true), 400);
  checkLive('09ב', 'prob-bag-x-cnd-09/ב', [cnt(p, (i) => i.t === 'M' && i.o !== 'H') / cnt(p, (i) => i.o !== 'H'), cnt(p, (i) => i.t === 'A' && i.o === 'P') / cnt(p, (i) => i.t === 'A' && i.o !== 'H')]);
  let found = 0;
  for (let m = 0; m <= 2000; m++) { const q = pop(m); const N = cnt(q, () => true); if (cnt(q, (i) => i.t === 'M' && i.o === 'P') * N === cnt(q, (i) => i.t === 'M') * cnt(q, (i) => i.o === 'P')) found++; }
  check('09ג no integer m', found, 0);
  reviewedByHand('prob-bag-x-cnd-09/ג', 'scanned integer m 0..2000: no table makes morning and pastry-only independent (real solution 140/3)');
  const aft: W<string> = [['H', 80 / 160], ['C', 60 / 160], ['P', 20 / 160]];
  const three = rep(aft, 3);
  checkLive('09ד', 'prob-bag-x-cnd-09/ד', cond(three, (t) => t.filter((o) => o === 'C').length === 2, (t) => t.filter((o) => o !== 'P').length >= 2));
}
{ // 10 — two repair labs
  const x = scan(0, 100, 1, (x) => near(0.95 * x + 0.75 * (100 - x), 83, 1e-9));
  checkLive('10א', 'prob-bag-x-cnd-10/א', x);
  const pop: [Ind, number][] = [[{ l: 'A', ok: 1 }, 72 + 14], [{ l: 'A', ok: 0 }, 8 + 6], [{ l: 'B', ok: 1 }, 0.95 * x + 0.75 * (100 - x)], [{ l: 'B', ok: 0 }, 0.05 * x + 0.25 * (100 - x)]];
  checkLive('10ב', 'prob-bag-x-cnd-10/ב', cnt(pop, (i) => i.l === 'B' && i.ok === 0) / cnt(pop, (i) => i.ok === 0));
  check('10ג screen', 0.95 > 72 / 80 ? 1 : 0, 1); check('10ג battery', 0.75 > 14 / 20 ? 1 : 0, 1); check('10ג overall', 86 / 100 > 83 / 100 ? 1 : 0, 1);
  reviewedByHand('prob-bag-x-cnd-10/ג', 'Simpson: lab B better per fault type (0.95>0.9, 0.75>0.7), lab A better overall (0.86>0.83) due to fault mix');
  const s = scan(0, 100, 1, (s) => (0.95 * s + 0.75 * (100 - s)) / 100 > 0.86 + 1e-12);
  checkLive('10ד', 'prob-bag-x-cnd-10/ד', s);
}
{ // 11 — music app hidden mode
  const songs = (x: number, n: number): W<[string, ...number[]]> => {
    const a = rep(bern(0.5), n).map(([t, w]) => [['A', ...t], 0.75 * w] as [[string, ...number[]], number]);
    const b = rep(bern(x), n).map(([t, w]) => [['B', ...t], 0.25 * w] as [[string, ...number[]], number]);
    return [...a, ...b];
  };
  const x = scan(0, 1000, 1000, (x) => near(Pw(songs(x, 2), (t) => t[1] === 1 && t[2] === 1), 0.21));
  checkLive('11א', 'prob-bag-x-cnd-11/א', x);
  const s3 = songs(x, 3), T2 = (t: (string | number)[]) => t[1] === 1 && t[2] === 1;
  checkLive('11ב', 'prob-bag-x-cnd-11/ב', cond(s3, (t) => t[0] === 'A', T2));
  checkLive('11ג', 'prob-bag-x-cnd-11/ג', cond(s3, (t) => t[3] === 1, T2));
  checkLive('11ד', 'prob-bag-x-cnd-11/ד', cond(s3, (t) => t[0] === 'B', (t) => (t[1] as number) + (t[2] as number) + (t[3] as number) === 1));
}
{ // 12 — keys
  const urn = (k: number) => [...Array(k).fill('O'), ...Array(12 - k).fill('N')] as string[];
  const x = scan(0, 12, 1, (k) => near(drawNoReplacement(urn(k), 2, (q) => q.includes('O')), 5 / 11));
  checkLive('12א', 'prob-bag-x-cnd-12/א', x);
  checkLive('12ב', 'prob-bag-x-cnd-12/ב', drawNoReplacement(urn(x), 3, (q) => q[0] === 'N' && q[1] === 'N' && q[2] === 'O'));
  const G = drawNoReplacement(urn(x), 3, (q) => q.includes('O')), FG = drawNoReplacement(urn(x), 3, (q) => q[0] === 'O');
  checkLive('12ג', 'prob-bag-x-cnd-12/ג', FG / G);
  let best = -1; for (let k = 0; k <= 12; k++) if (drawNoReplacement(urn(k), 3, (q) => !q.includes('O')) > 0.5) best = k;
  checkLive('12ד', 'prob-bag-x-cnd-12/ד', best);
}
{ // 13 — solar lamps
  const p = scan(1, 1000, 1000, (p) => { const s = rep(bern(p), 4); return near(Pw(s, (t) => sum(t) === 3), Pw(s, (t) => sum(t) === 4)); });
  checkLive('13א', 'prob-bag-x-cnd-13/א', p);
  const s4 = rep(bern(p), 4);
  checkLive('13ב', 'prob-bag-x-cnd-13/ב', cond(s4, (t) => sum(t) === 3, (t) => sum(t) >= 2));
  let n = 2; while (!(Pw(rep(bern(p), n), (t) => sum(t) >= 2) > 0.99)) n++;
  checkLive('13ג', 'prob-bag-x-cnd-13/ג', n);
  const a = Pw(s4, (t) => sum(t) >= 2), b = Pw(rep(bern(0.9), 3), (t) => sum(t) >= 2);
  check('13ד four', a, 0.9728); check('13ד three', b, 0.972); check('13ד four wins', a > b ? 1 : 0, 1);
  reviewedByHand('prob-bag-x-cnd-13/ד', 'enumerated: 4 lamps at p=0.8 give 0.9728 > 3 lamps at 0.9 give 0.972');
}
{ // 14 — spinner points
  const sp = (r: number): W<number> => [[3, r], [1, 0.3], [0, 0.7 - r]];
  const r = scan(0, 700, 1000, (r) => near(Pw(rep(sp(r), 2), (t) => sum(t) >= 3), 0.36));
  checkLive('14א', 'prob-bag-x-cnd-14/א', r);
  const s3 = rep(sp(r), 3), reds = (t: number[]) => t.filter((v) => v === 3).length;
  checkLive('14ב', 'prob-bag-x-cnd-14/ב', Pw(s3, (t) => sum(t) === 4));
  checkLive('14ג', 'prob-bag-x-cnd-14/ג', cond(s3, (t) => t[0] === 3, (t) => sum(t) === 4));
  checkLive('14ד', 'prob-bag-x-cnd-14/ד', cond(s3, (t) => reds(t) === 2, (t) => sum(t) >= 6));
  const stop3 = (t: number[]) => t[0] < 3 && t[0] + t[1] < 3 && sum(t) >= 3;
  checkLive('14ה', 'prob-bag-x-cnd-14/ה', cond(s3, (t) => t[2] === 3, stop3));
}
{ // 15 — online store returns, population of 10000 orders
  const build = (sh: number, shRet: number, x: number): [Ind, number][] => [
    [{ t: 'S', r: 1 }, sh * shRet], [{ t: 'S', r: 0 }, sh * (1 - shRet)],
    [{ t: 'C', r: 1 }, 5000 * x / 100], [{ t: 'C', r: 0 }, 5000 * (1 - x / 100)],
    [{ t: 'A', r: 1 }, (5000 - sh) * 0.2], [{ t: 'A', r: 0 }, (5000 - sh) * 0.8]];
  let sol = { sh: NaN, x: NaN };
  for (let sh = 0; sh <= 5000; sh += 100) for (let x = 0; x <= 100; x++) {
    const p = build(sh, 0.3, x);
    if (near(cnt(p, (i) => i.t === 'S' && i.r === 1), 1200, 1e-6) && near(cnt(p, (i) => i.t === 'S' && i.r === 1) / cnt(p, (i) => i.r === 1), 0.6)) sol = { sh, x };
  }
  checkLive('15א', 'prob-bag-x-cnd-15/א', sol.x);
  const p = build(sol.sh, 0.3, sol.x);
  checkLive('15ב', 'prob-bag-x-cnd-15/ב', [cnt(p, (i) => i.t === 'S' && i.r === 0) / cnt(p, (i) => i.r === 0), cnt(p, (i) => i.t !== 'S' && i.r === 1) / cnt(p, (i) => i.t !== 'S')]);
  const defect: Record<string, number> = { S: 0.5, C: 0.2, A: 0 };
  const defPop = (q: [Ind, number][]) => q.filter(([i]) => i.r === 1).map(([i, c]) => [i, c * defect[i.t as string]] as [Ind, number]);
  checkLive('15ג', 'prob-bag-x-cnd-15/ג', cnt(defPop(p), (i) => i.t === 'S') / cnt(defPop(p), () => true));
  const y = scan(0, 100, 1, (y) => { const q = build(sol.sh, y / 100, sol.x); return near(cnt(q, (i) => i.t === 'S' && i.r === 1) * 2, cnt(q, (i) => i.r === 1), 1e-6); });
  const q = build(sol.sh, y / 100, sol.x);
  checkLive('15ד', 'prob-bag-x-cnd-15/ד', [y, cnt(defPop(q), (i) => i.t === 'S') / cnt(defPop(q), () => true)]);
}

coverage('pr-conditional');
summary('pr-conditional r3');
