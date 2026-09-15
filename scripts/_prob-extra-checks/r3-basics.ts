/**
 * Round-3 re-derivation for pr-basics: practice pr-x-bas-301…332 and bagrut
 * prob-bag-x-bas-02…21. Every published value is READ from the live lesson
 * (checkLive / dLive / wLive); every `got` is computed here from the statement,
 * by brute force over the sample space wherever it is small.
 *
 *   npx tsx scripts/_prob-extra-checks/r3-basics.ts
 *   PLANT=pr-x-bas-305 npx tsx scripts/_prob-extra-checks/r3-basics.ts   (must fail on that ref only)
 */
import { create, all } from 'mathjs';
import { getLesson } from '../../content/lessons';
import { enumerate, check, summary } from './_lib';
import { checkLive, reviewedByHand, coverage } from './_live';

const math = create(all, { number: 'number' });
const lesson = getLesson('math5', 'הסתברות');
const num = (s: string) =>
  Number(math.evaluate(s.replace(/\$/g, '').replace(/\\d?frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)').replace(/\\d?frac(\d)(\d)/g, '($1)/($2)').trim()));
const q = (id: string) => {
  for (const st of lesson?.subTopics ?? []) {
    const f = st.questions?.find((x) => x.id === id);
    if (f) return f;
  }
  throw new Error(`no question ${id}`);
};
/** MCQ option `i` (1..3) must be the value the mistake in its note produces. */
const dLive = (id: string, i: number, got: number) => check(`${id} distractor ${i}`, got, num(q(id).answers![i]));
/** wrongAnswers[i] must be the value(s) the mistake in its note produces. */
const wLive = (id: string, i: number, got: number | number[]) => {
  const vals = (q(id).wrongAnswers![i].value).split(',').map(num);
  const g = Array.isArray(got) ? got : [got];
  if (vals.length !== g.length) return check(`${id} wrong ${i} length`, NaN, NaN);
  vals.forEach((v, k) => check(`${id} wrong ${i}[${k}]`, g[k], v, 1e-9));
};
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
/** all 0/1 vectors of length n with independent success probs ps */
const bern = (ps: number[], pred: (v: number[]) => boolean) => {
  let t = 0;
  for (let m = 0; m < 1 << ps.length; m++) {
    const v = ps.map((_, i) => (m >> i) & 1);
    if (pred(v)) t += v.reduce((acc, b, i) => acc * (b ? ps[i] : 1 - ps[i]), 1);
  }
  return t;
};
/** weighted categorical product over independent draws */
const cat = <T>(dists: [T, number][][], pred: (o: T[]) => boolean) => {
  let t = 0;
  const walk = (i: number, acc: T[], w: number) => {
    if (i === dists.length) return void (pred(acc) && (t += w));
    for (const [v, p] of dists[i]) walk(i + 1, [...acc, v], w * p);
  };
  walk(0, [], 1);
  return t;
};
/** scan a grid for the parameter value(s) satisfying f(x)=target */
const solve = (f: (x: number) => number, target: number, lo = 0, hi = 1, step = 1e-4) => {
  const out: number[] = [];
  for (let x = lo; x <= hi + 1e-12; x += step) {
    const r = Math.round(x * 1e4) / 1e4;
    if (Math.abs(f(r) - target) < 1e-9) out.push(r);
  }
  return out;
};

// ============================ practice: easy ============================
{ // 301 — letters of מתמטיקה, P(מ)
  const word = [...'מתמטיקה'];
  const got = enumerate([word], ([c]) => c === 'מ');
  checkLive('301', 'pr-x-bas-301', got);
  const distinct = new Set(word);
  dLive('pr-x-bas-301', 1, 1 / word.length);
  dLive('pr-x-bas-301', 2, 2 / distinct.size);
  dLive('pr-x-bas-301', 3, 1 / distinct.size);
}
{ // 302 — 40 bulbs, P(defective)=0.15 → count
  const got = range(0, 40).filter((k) => Math.abs(k / 40 - 0.15) < 1e-12)[0];
  checkLive('302', 'pr-x-bas-302', got);
  wLive('pr-x-bas-302', 0, 15);
  wLive('pr-x-bas-302', 1, 40 - got);
}
{ // 303 — blood types A or B
  const d: [string, number][] = [['O', 0.38], ['A', 0.34], ['B', 0.2], ['AB', 1 - 0.38 - 0.34 - 0.2]];
  checkLive('303', 'pr-x-bas-303', cat([d], ([t]) => t === 'A' || t === 'B'));
  dLive('pr-x-bas-303', 1, 0.34 * 0.2);
  dLive('pr-x-bas-303', 2, cat([d], ([t]) => t === 'AB'));
  dLive('pr-x-bas-303', 3, cat([d], ([t]) => t === 'O' || t === 'AB'));
}
{ // 304 — 3-digit code, one random try
  const digits = range(0, 9);
  checkLive('304', 'pr-x-bas-304', enumerate([digits, digits, digits], ([a, b, c]) => a === 4 && b === 1 && c === 7));
  wLive('pr-x-bas-304', 0, 0.1 * 3);
  wLive('pr-x-bas-304', 1, 1 / (3 * 10));
}
{ // 305 — neither late
  const got = bern([0.2, 0.1], (v) => v[0] === 0 && v[1] === 0);
  checkLive('305', 'pr-x-bas-305', got);
  dLive('pr-x-bas-305', 1, bern([0.2, 0.1], (v) => v[0] === 1 && v[1] === 1));
  dLive('pr-x-bas-305', 2, 1 - 0.2 - 0.1);
  dLive('pr-x-bas-305', 3, 1 - got);
}
{ // 306 — two wheels
  const a = enumerate([range(1, 8)], ([s]) => s <= 3), b = enumerate([range(1, 12)], ([s]) => s <= 5);
  checkLive('306', 'pr-x-bas-306', [a, b]);
  if (!(b > a)) check('306 wheel B better', 0, 1);
  wLive('pr-x-bas-306', 0, [3 / 5, 5 / 7]);
  wLive('pr-x-bas-306', 1, [0.375, 0.42]);
  if (Math.abs(0.42 - b) < 1e-7) check('306 rounded wrong must differ', 0, 1);
}
{ // 307 — same number 1..5
  const got = enumerate([range(1, 5), range(1, 5)], ([x, y]) => x === y);
  checkLive('307', 'pr-x-bas-307', got);
  wLive('pr-x-bas-307', 0, enumerate([range(1, 5), range(1, 5)], ([x, y]) => x === 3 && y === 3));
  wLive('pr-x-bas-307', 1, 1 - got);
}
{ // 308 — P(no rain) = 3 P(rain)
  const got = solve((x) => 1 - x - 3 * x, 0)[0];
  checkLive('308', 'pr-x-bas-308', got);
  wLive('pr-x-bas-308', 0, 3 * got);
  wLive('pr-x-bas-308', 1, 1 / 3); // the equation 3x = 1 solved: x = 1/3
}
{ // 309 — balcony (1..5) or even, 12 rooms
  const r = range(1, 12);
  checkLive('309', 'pr-x-bas-309', enumerate([r], ([n]) => n <= 5 || n % 2 === 0));
  dLive('pr-x-bas-309', 1, 5 / 12 + 6 / 12);
  dLive('pr-x-bas-309', 2, enumerate([r], ([n]) => n <= 5 && n % 2 === 0));
  dLive('pr-x-bas-309', 3, enumerate([r], ([n]) => n > 5 && n % 2 === 1));
}
{ // 310 — 5 of 20 songs, two picks with replacement
  const s = range(1, 20);
  checkLive('310', 'pr-x-bas-310', enumerate([s, s], ([a, b]) => a <= 5 && b <= 5));
  wLive('pr-x-bas-310', 0, 0.25 + 0.25);
  wLive('pr-x-bas-310', 1, enumerate([s], ([a]) => a <= 5));
}
{ // 311 — die 1,2,2,3,3,3 twice, sum 6
  const f = [1, 2, 2, 3, 3, 3];
  checkLive('311', 'pr-x-bas-311', enumerate([f, f], ([a, b]) => a + b === 6));
  dLive('pr-x-bas-311', 1, 1 / 36);
  dLive('pr-x-bas-311', 2, enumerate([f], ([a]) => a === 3));
  dLive('pr-x-bas-311', 3, (1 / 3) * (1 / 3));
}
{ // 312 — smallest bag with P(red)=0.35
  const got = range(1, 200).find((n) => range(0, n).some((k) => Math.abs(k / n - 0.35) < 1e-12))!;
  checkLive('312', 'pr-x-bas-312', got);
  wLive('pr-x-bas-312', 0, 100);
  wLive('pr-x-bas-312', 1, 0.35 * got);
}
{ // 313 — day 3 or later
  const later = 1 - 0.4 - 0.35 - 0.2;
  checkLive('313', 'pr-x-bas-313', 0.2 + later);
  wLive('pr-x-bas-313', 0, 0.2);
  wLive('pr-x-bas-313', 1, 0.4 + 0.35);
  wLive('pr-x-bas-313', 2, 0.2 * later);
}
// ============================ practice: mid ============================
{ // 314 — at least one alarm
  const got = bern([0.9, 0.8], (v) => sum(v) >= 1);
  checkLive('314', 'pr-x-bas-314', got);
  dLive('pr-x-bas-314', 1, bern([0.9, 0.8], (v) => sum(v) === 2));
  dLive('pr-x-bas-314', 2, 1 - got);
  dLive('pr-x-bas-314', 3, bern([0.9, 0.8], (v) => sum(v) === 1));
}
{ // 315 — red 1..4, blue 1..6: sum>7 or equal
  const R = range(1, 4), B = range(1, 6);
  checkLive('315', 'pr-x-bas-315', enumerate([R, B], ([r, b]) => r + b > 7 || r === b));
  wLive('pr-x-bas-315', 0, enumerate([R, B], ([r, b]) => r + b > 7) + enumerate([R, B], ([r, b]) => r === b));
  wLive('pr-x-bas-315', 1, enumerate([R, B], ([r, b]) => r + b > 7));
  wLive('pr-x-bas-315', 2, enumerate([R, B], ([r, b]) => r + b > 7 && r === b));
}
{ // 316 — exactly one on time
  const got = bern([0.85, 0.9], (v) => sum(v) === 1);
  checkLive('316', 'pr-x-bas-316', got);
  wLive('pr-x-bas-316', 0, bern([0.85, 0.9], (v) => sum(v) === 2));
  wLive('pr-x-bas-316', 1, bern([0.85, 0.9], (v) => v[0] === 1 && v[1] === 0));
  wLive('pr-x-bas-316', 2, 0.15 + 0.1);
}
{ // 317 — 9 blue, P(black)=0.25 → b; same colour twice with replacement
  const b = range(0, 100).find((k) => Math.abs(k / (9 + k) - 0.25) < 1e-12)!;
  const pen = [...Array(9).fill('כ'), ...Array(b).fill('ש')];
  const same = enumerate([pen, pen], ([x, y]) => x === y);
  checkLive('317', 'pr-x-bas-317', [b, same]);
  wLive('pr-x-bas-317', 0, [b, enumerate([pen, pen], ([x, y]) => x === 'כ' && y === 'כ')]);
  wLive('pr-x-bas-317', 1, [b, 1 - same]);
  wLive('pr-x-bas-317', 2, [9 + b, same]);
}
{ // 318 — route A vs B, no stop
  const a = bern([0.75, 0.6], (v) => sum(v) === 2), bb = bern([0.8, 0.8, 0.8], (v) => sum(v) === 3);
  checkLive('318', 'pr-x-bas-318', [a, bb]);
  wLive('pr-x-bas-318', 0, [a, 0.2 ** 3]);
  wLive('pr-x-bas-318', 1, [a, 1 - 0.2 * 3]);
}
{ // 319 — cancelled if rain or sick
  const held = bern([0.3, 0.25], (v) => sum(v) === 0);
  checkLive('319', 'pr-x-bas-319', [held, 1 - held]);
  wLive('pr-x-bas-319', 0, [1 - (0.3 + 0.25), 0.3 + 0.25]);
  wLive('pr-x-bas-319', 1, [1 - 0.3 * 0.25, 0.3 * 0.25]);
}
{ // 320 — choc = 2 vanilla, strawberry 0.4; two customers same flavour
  const x = solve((v) => v + 2 * v + 0.4, 1)[0];
  const d: [string, number][] = [['v', x], ['c', 2 * x], ['s', 0.4]];
  const same = cat([d, d], ([a, b]) => a === b);
  checkLive('320', 'pr-x-bas-320', same);
  wLive('pr-x-bas-320', 0, 1 - same);
  wLive('pr-x-bas-320', 1, cat([d, d], ([a, b]) => a === 'c' && b === 'c'));
  wLive('pr-x-bas-320', 2, 3 * (1 / 3) * (1 / 3));
}
{ // 321 — two decks 1..8, Omer higher
  const D = range(1, 8);
  checkLive('321', 'pr-x-bas-321', enumerate([D, D], ([o, n]) => o > n));
  const tie = enumerate([D, D], ([o, n]) => o === n);
  dLive('pr-x-bas-321', 1, 0.5);
  dLive('pr-x-bas-321', 2, 1 - tie);
  dLive('pr-x-bas-321', 3, tie);
}
// ============================ practice: hard ============================
{ // 322 — pq=0.24, (1-p)(1-q)=0.14, p>q
  let p = NaN, qq = NaN;
  for (let a = 1; a <= 999; a++) for (let b = 1; b < a; b++) {
    const P = a / 1000, Q = b / 1000;
    if (Math.abs(P * Q - 0.24) < 1e-9 && Math.abs((1 - P) * (1 - Q) - 0.14) < 1e-9) { p = P; qq = Q; }
  }
  const one = bern([p, qq], (v) => sum(v) === 1);
  checkLive('322', 'pr-x-bas-322', [p, qq, one]);
  wLive('pr-x-bas-322', 0, [qq, p, one]);
  wLive('pr-x-bas-322', 1, [p, qq, 0.24 + 0.14]);
  wLive('pr-x-bas-322', 2, [p, qq, bern([p, qq], (v) => v[0] === 1 && v[1] === 0)]);
}
{ // 323 — exactly one of (0.6, p): min over p, and p from 0.48
  const f = (p: number) => bern([0.6, p], (v) => sum(v) === 1);
  const grid = range(0, 1000).map((i) => f(i / 1000));
  const min = Math.min(...grid);
  const p = solve(f, 0.48)[0];
  checkLive('323', 'pr-x-bas-323', [min, p]);
  if (!(0.3 < min)) check('323 0.3 infeasible', 0, 1);
  const g = (p: number) => 0.6 * p + 0.4 * (1 - p);
  wLive('pr-x-bas-323', 0, [Math.min(g(0), g(1)), solve(g, 0.48)[0]]);
  wLive('pr-x-bas-323', 1, [Math.min(0, 0.6), solve((p) => 0.6 * p, 0.48)[0]]);
  wLive('pr-x-bas-323', 2, [Math.max(...grid), p]);
  reviewedByHand('pr-x-bas-323', 'the "not possible" claim: min of 0.6-0.2p on [0,1] is 0.4 > 0.3, now graded as a labelled box');
}
{ // 324 — dogs 0.4 of x; +10 dogs → 0.6; exactly one dog in two picks
  const x = range(1, 500).find((n) => Math.abs((0.4 * n + 10) / (n + 10) - 0.6) < 1e-12)!;
  const pd = (0.4 * x + 10) / (x + 10);
  const one = bern([pd, pd], (v) => sum(v) === 1);
  checkLive('324', 'pr-x-bas-324', [x, one]);
  wLive('pr-x-bas-324', 0, [x, pd * pd]);
  wLive('pr-x-bas-324', 1, [x, pd * (1 - pd)]);
  wLive('pr-x-bas-324', 2, [x + 10, one]);
}
{ // 325 — 3 boxes of 3 figures
  const F = ['ל', 'נ', 'ד'];
  const noLion = enumerate([F, F, F], (o) => !o.includes('ל'));
  const diff = enumerate([F, F, F], (o) => new Set(o).size === 3);
  const two = enumerate([F, F, F], (o) => new Set(o).size === 2);
  checkLive('325', 'pr-x-bas-325', [noLion, diff, two]);
  if (!(two > diff)) check('325 two kinds more likely', 0, 1);
  wLive('pr-x-bas-325', 0, [1 / 27, diff, two]);
  wLive('pr-x-bas-325', 1, [noLion, 1 / 27, two]);
  wLive('pr-x-bas-325', 2, [noLion, diff, 1 - diff]);
}
{ // 326 — two wheels same colour; rounds for P(at least one win) > 0.9
  const w1: [string, number][] = [['r', 0.5], ['b', 0.3], ['g', 0.2]], w2: [string, number][] = [['r', 0.4], ['b', 0.4], ['g', 0.2]];
  const win = cat([w1, w2], ([a, b]) => a === b);
  const minN = (p: number, t: number) => range(1, 100).find((n) => 1 - (1 - p) ** n > t)!;
  checkLive('326', 'pr-x-bas-326', [win, minN(win, 0.9)]);
  wLive('pr-x-bas-326', 0, [win, minN(win, 0.9) - 1]);
  wLive('pr-x-bas-326', 1, [0.5 * 0.4, minN(0.2, 0.9)]);
  wLive('pr-x-bas-326', 2, [win, range(1, 100).find((n) => n * win > 0.9)!]);
}
{ // 327 — alternate Yael(0.4)/Omer(p), 4 throws, tie 0.09
  const game = (p: number) => {
    const ps = [0.4, p, 0.4, p];
    let y = 0, o = 0, miss = 1;
    ps.forEach((h, i) => { (i % 2 ? (o += miss * h) : (y += miss * h)); miss *= 1 - h; });
    return { y, o, tie: miss };
  };
  const p = solve((v) => game(v).tie, 0.09)[0];
  const g = game(p);
  checkLive('327', 'pr-x-bas-327', [p, g.y, g.o]);
  wLive('pr-x-bas-327', 0, [p, 0.4, 0.6 * p]);
  const pw = solve((v) => 0.6 * (1 - v), 0.09)[0];
  wLive('pr-x-bas-327', 1, [pw, game(pw).y, game(pw).o]);
  wLive('pr-x-bas-327', 2, [p, g.y, 1 - g.y]);
}
{ // 328 — pump AND (filter or filter)
  const flow = (pump: number) => bern([pump, 0.8, 0.8], (v) => v[0] === 1 && v[1] + v[2] >= 1);
  const p = solve(flow, 0.9408)[0];
  checkLive('328', 'pr-x-bas-328', [flow(0.95), p]);
  wLive('pr-x-bas-328', 0, [0.95 * 0.8, 0.9408 / 0.8]);
  wLive('pr-x-bas-328', 1, [0.95 * 0.8 * 0.8, 0.9408 / 0.64]);
  wLive('pr-x-bas-328', 2, [flow(0.95), 0.9408]);
}
{ // 329 — darts: ring = 2 inner, both miss 0.01; at least 7 points
  const x = solve((v) => (1 - 3 * v) ** 2, 0.01, 0, 1 / 3)[0];
  const d = (v: number): [number, number][] => [[5, v], [2, 2 * v], [0, 1 - 3 * v]];
  const atl7 = (v: number) => cat([d(v), d(v)], ([a, b]) => a + b >= 7);
  checkLive('329', 'pr-x-bas-329', [x, atl7(x)]);
  wLive('pr-x-bas-329', 0, [x, cat([d(x), d(x)], ([a, b]) => a + b === 7)]);
  wLive('pr-x-bas-329', 1, [x, x * x + x * 2 * x]);
  const xw = solve((v) => 1 - 3 * v, 0.01, 0, 1 / 3)[0];
  wLive('pr-x-bas-329', 2, [xw, atl7(xw)]);
}
{ // 330 — suppliers 0.1, 0.2, x; none late 0.576; exactly one late
  const x = solve((v) => bern([0.1, 0.2, v], (s) => sum(s) === 0), 0.576)[0];
  const one = bern([0.1, 0.2, x], (s) => sum(s) === 1);
  checkLive('330', 'pr-x-bas-330', [x, one]);
  if (!(one > 0.35)) check('330 above 0.35', 0, 1);
  wLive('pr-x-bas-330', 0, [x, 0.1 + 0.2 + x]);
  wLive('pr-x-bas-330', 1, [x, 1 - 0.576]);
  wLive('pr-x-bas-330', 2, [1 - x, one]);
}
{ // 331 — best of three
  const series = (w: number) => bern([w, w, w], (v) => v[0] + v[1] === 2 || (v[0] + v[1] === 1 && v[2] === 1));
  const n = series(0.6), l = series(0.3);
  checkLive('331', 'pr-x-bas-331', [n, l]);
  if (!(n > 0.6 && l < 0.3)) check('331 comparison', 0, 1);
  wLive('pr-x-bas-331', 0, [0.36, 0.09]);
  wLive('pr-x-bas-331', 1, [0.36 + 0.6 * 0.4 * 0.6, 0.09 + 0.3 * 0.7 * 0.3]);
}
{ // 332 — pool x, 4 prob questions, two days at least one 0.64; add a for ≥ 0.84
  const x = range(5, 200).find((n) => Math.abs(1 - (1 - 4 / n) ** 2 - 0.64) < 1e-12)!;
  const add = range(0, 100).find((a) => 1 - ((x - 4) / (x + a)) ** 2 >= 0.84 - 1e-12)!;
  checkLive('332', 'pr-x-bas-332', [x, add]);
  wLive('pr-x-bas-332', 0, [x, range(0, 100).find((a) => 1 - ((10 - 4 - a) / 10) ** 2 >= 0.84 - 1e-12)!]);
  wLive('pr-x-bas-332', 1, [x, add - 1]);
  if (!(1 - (6 / 14) ** 2 < 0.84)) check('332 four not enough', 0, 1);
  wLive('pr-x-bas-332', 2, [x, range(0, 100).find((a) => 1 - ((x - 4) / (x + a)) ** 2 > 0.84 + 1e-12)!]);
}
{ // 333 — escape room: exit if (puzzle1 AND puzzle2) OR bonus; 0.9, 0.8, 0.5 independent
  const ps = [0.9, 0.8, 0.5];
  const exit = (v: number[]) => (v[0] && v[1]) || v[2];
  checkLive('333', 'pr-x-bas-333', [bern(ps, (v) => !!exit(v)), bern(ps, (v) => !!exit(v) && !v[2])]);
  // wrong 0: added the two ways; wrong 1: second box = both first puzzles only; wrong 2: at least one of three
  wLive('pr-x-bas-333', 0, [bern(ps, (v) => !!(v[0] && v[1])) + ps[2], bern(ps, (v) => !!exit(v) && !v[2])]);
  wLive('pr-x-bas-333', 1, [bern(ps, (v) => !!exit(v)), bern(ps, (v) => !!(v[0] && v[1]))]);
  wLive('pr-x-bas-333', 2, [bern(ps, (v) => sum(v) >= 1), bern(ps, (v) => !!exit(v) && !v[2])]);
}

// ============================ bagrut ============================
const B = 'prob-bag-x-bas-';
{ // 02 — deuce, p>0.5, P(back to deuce after 2)=0.42
  const p = solve((v) => 2 * v * (1 - v), 0.42).find((v) => v > 0.5)!;
  checkLive('02א', `${B}02/א`, p);
  const d = 2 * p * (1 - p);
  // brute force 4 points: first pair back to deuce, second pair decisive
  checkLive('02ב', `${B}02/ב`, cat([[[1, p], [0, 1 - p]], [[1, p], [0, 1 - p]], [[1, p], [0, 1 - p]], [[1, p], [0, 1 - p]]] as [number, number][][], (o) => o[0] !== o[1] && o[2] === o[3]));
  checkLive('02ג', `${B}02/ג`, p * p + d * p * p);
  checkLive('02ד', `${B}02/ד`, 2 * range(1, 50).find((k) => 1 - d ** k > 0.99)!);
  const maxTie = Math.max(...range(0, 1000).map((i) => 2 * (i / 1000) * (1 - i / 1000)));
  if (!(maxTie < 0.55)) check('02ה', 0, 1);
  reviewedByHand(`${B}02/ה`, 'max of 2q(1-q) over [0,1] is 0.5 < 0.55, so not possible');
}
{ // 03 — x-sided die, P(at least one 1 in two)=0.19
  const x = range(2, 100).find((n) => Math.abs(1 - ((n - 1) / n) ** 2 - 0.19) < 1e-12)!;
  const F = range(1, x);
  checkLive('03א', `${B}03/א`, x);
  const prod = enumerate([F, F], ([a, b]) => (a * b) % 5 === 0);
  const s15 = enumerate([F, F], ([a, b]) => a + b >= 15);
  checkLive('03ב', `${B}03/ב`, prod);
  checkLive('03ג', `${B}03/ג`, s15);
  if (!(prod > s15)) check('03ג compare', 0, 1);
  checkLive('03ד', `${B}03/ד`, enumerate([F, F], ([a, b]) => (a * b) % 5 === 0 || a + b >= 15));
  const best = Math.max(...range(1, 200).map((m) => enumerate([range(1, m), range(1, m)], ([a, b]) => (a * b) % 5 === 0)));
  if (best > 0.36 + 1e-12) check('03ה bound', 0, 1);
  reviewedByHand(`${B}03/ה`, 'brute force m=1..200: product-divisible-by-5 never exceeds 0.36');
}
{ // 04 — relay network
  const p = solve((v) => v - v * v, 0.09).find((v) => v > 0.5)!;
  checkLive('04א', `${B}04/א`, p);
  const arrive = (ps: number[]) => bern(ps, (v) => (v[0] && v[1]) || v[2] || (ps.length > 3 && v[3]) ? true : false);
  checkLive('04ב', `${B}04/ב`, arrive([p, p, p]));
  checkLive('04ג', `${B}04/ג`, bern([p, p, p], (v) => (v[0] && v[1] ? 1 : 0) + v[2] === 1));
  checkLive('04ד', `${B}04/ד`, [arrive([p, p, 0.95]), arrive([p, p, p, p])]);
  checkLive('04ה', `${B}04/ה`, solve((r) => arrive([p, p, r]), arrive([p, p, p, p]))[0]);
}
{ // 05 — seeds
  const p = solve((v) => 2 * v * (1 - v) - 3 * v * v, 0, 0.01)[0];
  checkLive('05א', `${B}05/א`, p);
  const four = [p, p, p, p];
  checkLive('05ב', `${B}05/ב`, bern(four, (v) => sum(v) === 2));
  checkLive('05ג', `${B}05/ג`, bern(four, (v) => sum(v) === 1));
  const tray = (n: number) => (1 - (1 - p) ** n) ** 2;
  checkLive('05ד', `${B}05/ד`, range(1, 50).find((n) => tray(n) > 0.8)!);
  const q1 = solve((v) => 2 * v * (1 - v) - 3 * v * v, 0, 0.01), q2 = solve((v) => 2 * v * (1 - v) - 3 * (1 - v) ** 2, 0, 0, 0.99);
  if (q1.some((v) => q2.includes(v))) check('05ה', 0, 1);
  reviewedByHand(`${B}05/ה`, 'first condition gives q=0.4, second q=0.6 (grid scan, q≠0,1): no common q');
}
{ // 06 — survey stops when both answers seen; P(>3 calls)=0.28, x>50
  const p = solve((v) => v ** 3 + (1 - v) ** 3, 0.28).find((v) => v > 0.5)!;
  checkLive('06א', `${B}06/א`, 100 * p);
  const D: [number, number][] = [[1, p], [0, 1 - p]];
  const stopAt = (o: number[]) => { for (let i = 1; i < o.length; i++) if (o[i] !== o[0]) return i + 1; return 99; };
  checkLive('06ב', `${B}06/ב`, cat([D, D, D, D, D], (o) => stopAt(o) === 3));
  checkLive('06ג', `${B}06/ג`, cat([D, D, D, D, D], (o) => stopAt(o) <= 4 && o[stopAt(o) - 1] === 1));
  checkLive('06ד', `${B}06/ד`, cat([D, D, D, D, D], (o) => stopAt(o) <= 4));
  // smallest planned number of calls n with P(stop within n) > 0.99, by brute force over n answers
  const within = (n: number) => cat(Array(n).fill(D), (o) => stopAt(o) <= n);
  checkLive('06ה', `${B}06/ה`, range(2, 14).find((n) => within(n) > 0.99)!);
}
{ // 07 — football: win = 2 draw, P(no points in 2) = 0.16
  const loss = solve((v) => v * v, 0.16)[0];
  const t = (1 - loss) / 3, w = 2 * t;
  checkLive('07א', `${B}07/א`, [w, t]);
  const G: [number, number][] = [[3, w], [1, t], [0, loss]];
  checkLive('07ב', `${B}07/ב`, cat([G, G], (o) => sum(o) >= 4));
  checkLive('07ג', `${B}07/ג`, cat([G, G, G], (o) => sum(o) === 4));
  const more = cat([G, G, G], (o) => sum(o) > 4), less = cat([G, G, G], (o) => sum(o) < 4);
  checkLive('07ד', `${B}07/ד`, [more, less]);
  checkLive('07ה', `${B}07/ה`, Math.max(...range(0, 9).filter((k) => cat([G, G, G], (o) => sum(o) >= k) >= 0.3)));
}
{ // 08 — alarm: camera 0.7 OR both detectors p; P=0.943
  const alarm = (c: number, p: number) => bern([c, p, p], (v) => v[0] === 1 || v[1] + v[2] === 2);
  const p = solve((v) => alarm(0.7, v), 0.943)[0];
  checkLive('08א', `${B}08/א`, p);
  checkLive('08ב', `${B}08/ב`, bern([0.7, p, p], (v) => (v[0] === 1 || v[1] + v[2] === 2) && sum(v) < 3));
  checkLive('08ג', `${B}08/ג`, bern([0.7, p, p], (v) => sum(v) === 2));
  const newRule = (c: number) => bern([c, p, p], (v) => sum(v) >= 2);
  checkLive('08ד', `${B}08/ד`, newRule(0.7));
  if (!(newRule(0.7) < 0.943)) check('08ד compare', 0, 1);
  checkLive('08ה', `${B}08/ה`, solve(newRule, 0.954)[0]);
}
{ // 09 — sailing: wind 0.75 AND no rain; P=0.6
  const p = solve((v) => 0.75 * (1 - v), 0.6)[0];
  checkLive('09א', `${B}09/א`, p);
  const s = 0.75 * (1 - p);
  checkLive('09ב', `${B}09/ב`, bern([s, s, s], (v) => sum(v) >= 2));
  checkLive('09ג', `${B}09/ג`, bern([p, p, p, p], (v) => v.some((r, i) => r && v[i + 1])));
  checkLive('09ד', `${B}09/ד`, bern([s, s, s, s], (v) => sum(v) >= 3));
  // day = (wind, rain) independent; points: sail 2, wind+rain 1, no wind 0
  const W: [number, number][] = [[1, 0.75], [0, 0.25]], R: [number, number][] = [[1, p], [0, 1 - p]];
  const pts = (o: number[]) => [0, 1, 2].reduce((acc, d) => acc + (o[2 * d] ? (o[2 * d + 1] ? 1 : 2) : 0), 0);
  checkLive('09ה', `${B}09/ה`, cat([W, R, W, R, W, R], (o) => pts(o) >= 5));
}
{ // 10 — two fishermen, up to 3 hours
  const p = solve((v) => 0.6 * (1 - v), 0.15)[0];
  checkLive('10א', `${B}10/א`, p);
  const H: [string, number][] = [['A', 0.6 * (1 - p)], ['G', 0.4 * p], ['T', 0.6 * p], ['N', 0.4 * (1 - p)]];
  const res = (o: string[]) => o.find((h) => h !== 'N') ?? 'N';
  const avi = cat([H, H, H], (o) => res(o) === 'A'), gil = cat([H, H, H], (o) => res(o) === 'G');
  checkLive('10ב', `${B}10/ב`, avi);
  checkLive('10ג', `${B}10/ג`, cat([H, H, H], (o) => res(o) === 'T'));
  checkLive('10ד', `${B}10/ד`, gil / avi);
  checkLive('10ה', `${B}10/ה`, solve((a) => a * (1 - p) - (1 - a) * p, 0)[0]);
}
{ // 11 — two dice, immediate win at sum ≥ x (1/6), else repeat same sum
  const D6 = range(1, 6);
  const x = range(2, 12).find((k) => Math.abs(enumerate([D6, D6], ([a, b]) => a + b >= k) - 1 / 6) < 1e-12)!;
  checkLive('11א', `${B}11/א`, x);
  const game = (k: number) => {
    const second = enumerate([D6, D6, D6, D6], ([a, b, c, d]) => a + b < k && a + b === c + d);
    return { second, total: enumerate([D6, D6], ([a, b]) => a + b >= k) + second };
  };
  checkLive('11ב', `${B}11/ב`, game(x).second);
  checkLive('11ג', `${B}11/ג`, game(x).total);
  checkLive('11ד', `${B}11/ד`, game(x - 1).total);
  const totals = range(2, 13).map((k) => game(k).total);
  if (totals.some((t) => Math.abs(t - 1 / 3) < 1e-12)) check('11ה', 0, 1);
  reviewedByHand(`${B}11/ה`, 'brute force every threshold 2..13: no total equals exactly 1/3');
}
{ // 12 — three friends, minute 1..x, P(all ≤ 4)=0.064
  const x = range(4, 100).find((n) => Math.abs((4 / n) ** 3 - 0.064) < 1e-12)!;
  checkLive('12א', `${B}12/א`, x);
  const M = range(1, x);
  checkLive('12ב', `${B}12/ב`, enumerate([M, M, M], (o) => Math.max(...o) === 7));
  checkLive('12ג', `${B}12/ג`, enumerate([M, M, M], (o) => Math.min(...o) === 4));
  const k = range(1, x).find((kk) => enumerate([M, M, M], (o) => Math.max(...o) <= kk) >= 0.5)!;
  checkLive('12ד', `${B}12/ד`, k);
  checkLive('12ה', `${B}12/ה`, enumerate([M, M, M], (o) => o.filter((m) => m <= k).length === 2));
}
{ // 13 — judges 0.8, 0.5, p; P(3 stars) = 6 P(0)
  const p = solve((v) => 0.8 * 0.5 * v - 6 * 0.2 * 0.5 * (1 - v), 0)[0];
  checkLive('13א', `${B}13/א`, p);
  const dana = [0.8, 0.5, p], eli = [0.5, 0.5, 0.5];
  checkLive('13ב', `${B}13/ב`, bern(dana, (v) => sum(v) >= 2));
  const both = [...dana, ...eli];
  checkLive('13ג', `${B}13/ג`, bern(both, (v) => sum(v.slice(0, 3)) === sum(v.slice(3))));
  checkLive('13ד', `${B}13/ד`, [bern(both, (v) => sum(v.slice(0, 3)) > sum(v.slice(3))), bern(both, (v) => sum(v.slice(0, 3)) < sum(v.slice(3)))]);
  // new rule: judge 1 star = 2 points, others 1 each, advance with >= 3 points
  const pts3 = (ps: number[]) => bern(ps, (v) => 2 * v[0] + v[1] + v[2] >= 3);
  const dNew = pts3(dana), eNew = pts3(eli);
  checkLive('13ה', `${B}13/ה`, [dNew, eNew]);
  const dropD = bern(dana, (v) => sum(v) >= 2) - dNew, dropE = bern(eli, (v) => sum(v) >= 2) - eNew;
  if (!(dropE > dropD)) check('13ה Eli drops more', dropE, dropD);
}
{ // 14 — x branches, 0.3 each, P(at least one)=0.7599
  const x = range(1, 30).find((n) => Math.abs(1 - 0.7 ** n - 0.7599) < 1e-9)!;
  checkLive('14א', `${B}14/א`, x);
  const br = Array(x).fill(0.3);
  checkLive('14ב', `${B}14/ב`, [bern(br, (v) => sum(v) === 1), bern(br, (v) => sum(v) >= 2)]);
  checkLive('14ג', `${B}14/ג`, bern(br, (v) => v.indexOf(1) === 2));
  // she scans 1→4, he scans 4→1; each stops at first copy or at his/her last branch
  const stopF = (v: number[]) => (v.indexOf(1) === -1 ? 3 : v.indexOf(1));
  const stopB = (v: number[]) => (v.lastIndexOf(1) === -1 ? 0 : v.lastIndexOf(1));
  checkLive('14ד', `${B}14/ד`, bern(br, (v) => stopF(v) === stopB(v)));
  const opt1 = bern([0.3, 0.3, 0.3], (v) => sum(v) >= 1);
  const opt2 = (u: number) => bern([u, 0.3, 0.3], (v) => sum(v) >= 1);
  if (!(opt2(0.55) > opt1)) check('14ה option 2 better', opt2(0.55), opt1);
  checkLive('14ה', `${B}14/ה`, [opt1, opt2(0.55), range(0, 1000).map((i) => i / 1000).find((u) => opt2(u) >= opt1 - 1e-12)!]);
}
{ // 15 — chips ok 0.7, minor x, severe 0.3-x < x; P(same category of two) = 0.54
  const x = solve((v) => 0.49 + v * v + (0.3 - v) ** 2, 0.54, 0, 0.3).find((v) => v > 0.3 - v)!;
  checkLive('15א', `${B}15/א`, [x, 0.3 - x]);
  const C: [string, number][] = [['ok', 0.7], ['minor', x], ['severe', 0.3 - x]];
  const box = (o: string[]) => (o.includes('severe') ? 'throw' : o.every((c) => c === 'ok') ? 'full' : 'disc');
  const disc = cat([C, C], (o) => box(o) === 'disc'), thr = cat([C, C], (o) => box(o) === 'throw');
  checkLive('15ב', `${B}15/ב`, [disc, thr]);
  const full = cat([C, C], (o) => box(o) === 'full');
  const BX: [string, number][] = [['full', full], ['disc', disc], ['throw', thr]];
  checkLive('15ג', `${B}15/ג`, cat([BX, BX], ([a, b]) => a !== b));
  checkLive('15ד', `${B}15/ד`, [(1 - 0.2 - 0.05) ** 2, (1 - 0.1 - 0.1) ** 2]);
  const disc3 = cat([C, C, C], (o) => box(o) === 'disc');
  checkLive('15ה', `${B}15/ה`, disc3);
  if (!(disc3 > disc)) check('15ה compare', 0, 1);
}
{ // 16 — blood compatibility
  const can = (patient: string, donor: string) => donor === 'O' || donor === patient || patient === 'AB';
  const pop = (a: number): [string, number][] => [['O', 0.4], ['B', 0.15], ['A', a], ['AB', 0.45 - a]];
  const match = (a: number) => cat([pop(a), pop(a)], ([pt, dn]) => can(pt, dn));
  const a = solve(match, 0.605, 0, 0.45).find((v) => 0.45 - v < Math.min(0.4, 0.15, v))!;
  checkLive('16א', `${B}16/א`, 100 * a);
  const P = pop(a);
  checkLive('16ב', `${B}16/ב`, cat([P, P], ([d1, d2]) => can('B', d1) || can('B', d2)));
  checkLive('16ג', `${B}16/ג`, cat([P, P], ([u, v]) => can(u, v) && can(v, u)));
  checkLive('16ד', `${B}16/ד`, cat([P, P], ([d1, d2]) => (can('A', d1) ? 1 : 0) + (can('B', d2) ? 1 : 0) === 1));
  reviewedByHand(`${B}16/ה`, 'every patient accepts O: P(match) = Σ P(type)·P(ok|type) ≥ 0.4·1');
}
{ // 17 — debate bracket
  const beat: Record<string, number> = { AB: 0.6, AD: 0.9, CD: 0.7, BC: 0.4, BD: 0.6 };
  const pr = (x: string, y: string, AC: number) => { const b = { ...beat, AC }; return b[x + y] ?? 1 - b[y + x]; };
  const champ = (team: string, AC: number, s1: [string, string] = ['A', 'B'], s2: [string, string] = ['C', 'D']) => {
    let t = 0;
    for (const w1 of s1) for (const w2 of s2) {
      const pw = pr(w1, s1.find((z) => z !== w1)!, AC) * pr(w2, s2.find((z) => z !== w2)!, AC);
      if (w1 === team) t += pw * pr(w1, w2, AC);
      if (w2 === team) t += pw * pr(w2, w1, AC);
    }
    return t;
  };
  const p = solve((v) => champ('A', v), 0.372)[0];
  checkLive('17א', `${B}17/א`, p);
  checkLive('17ב', `${B}17/ב`, champ('C', p));
  checkLive('17ג', `${B}17/ג`, [champ('B', p), champ('D', p)]);
  checkLive('17ד', `${B}17/ד`, [champ('A', p, ['A', 'B'], ['C', 'D']), champ('A', p, ['A', 'C'], ['B', 'D']), champ('A', p, ['A', 'D'], ['B', 'C'])]);
  reviewedByHand(`${B}17/ה`, 's·(r f1 + (1-r) f2) > 0.5·0.5 whenever s, f1, f2 > 0.5');
}
{ // 18 — servers
  const Aq = (p: number): [number, number][] => [[20, p], [50, 1 - p]];
  const Bq: [number, number][] = [[30, 1]], Cq: [number, number][] = [[10, 0.3], [40, 0.7]];
  const p = solve((v) => cat([Aq(v), Cq], ([a, c]) => c < a), 0.58)[0];
  checkLive('18א', `${B}18/א`, p);
  checkLive('18ב', `${B}18/ב`, cat([Aq(p), Cq], ([a, c]) => Math.min(a, c) <= 20));
  checkLive('18ג', `${B}18/ג`, [cat([Aq(p), Bq], ([a, b]) => a < b), cat([Bq, Cq], ([b, c]) => b < c)]);
  const fastest = (i: number) => cat([Aq(p), Bq, Cq], (o) => o[i] === Math.min(...o));
  checkLive('18ד', `${B}18/ד`, [fastest(0), fastest(1), fastest(2)]);
  const ok = range(0, 1000).map((i) => i / 1000).filter((v) => cat([Aq(v), Bq], ([a, b]) => a < b) > 0.5 && cat([Aq(v), Cq], ([a, c]) => a < c) > 0.5);
  if (!(Math.abs(ok[0] - 0.715) < 1e-9 && ok[ok.length - 1] === 1 && ok.length === 286)) check('18ה p in (5/7,1]', ok[0], 0.715);
  reviewedByHand(`${B}18/ה`, 'grid: both comparisons > 0.5 exactly for 5/7 < p <= 1 (contiguous)');
}
{ // 19 — light switch, parity
  const on = (ps: number[]) => bern(ps, (v) => sum(v) % 2 === 1);
  const p = solve((v) => on([0.2, 0.3, v]), 0.44)[0];
  checkLive('19א', `${B}19/א`, p);
  const L = on([0.2, 0.3, p]);
  checkLive('19ב', `${B}19/ב`, L * L + (1 - L) * (1 - L));
  checkLive('19ג', `${B}19/ג`, solve((v) => on([0.2, 0.3, p, v]), 0.5)[0]);
  const mx = Math.max(...range(0, 100).map((i) => on([0.2, 0.3, p, i / 100])));
  if (!(mx < 0.6)) check('19ד', 0, 1);
  reviewedByHand(`${B}19/ד`, 'scan q: P(on) = 0.44 + 0.12q peaks at 0.56 < 0.6');
  if (range(0, 20).some((i) => Math.abs(on([i / 20, 0.5, 0.37]) - 0.5) > 1e-12)) check('19ה', 0, 1);
  reviewedByHand(`${B}19/ה`, 'r·0.5 + (1-r)·0.5 = 0.5; spot-checked numerically for other probabilities');
}
{ // 20 — robot walk on 0..4, absorbing ends, max 4 seconds
  const walk = (start: number, p: number) => {
    const end: Record<number, number> = {};
    const go = (pos: number, t: number, w: number) => {
      if (pos === 0 || pos === 4 || t === 4) return void (end[pos] = (end[pos] ?? 0) + w);
      go(pos + 1, t + 1, w * p); go(pos - 1, t + 1, w * (1 - p));
    };
    go(start, 0, 1);
    return end;
  };
  const p = solve((v) => 2 * v * (1 - v), 0.48).find((v) => v > 0.5)!;
  checkLive('20א', `${B}20/א`, p);
  const w2 = walk(2, p);
  checkLive('20ב', `${B}20/ב`, [w2[4], w2[0]]);
  checkLive('20ג', `${B}20/ג`, w2[2]);
  if ((w2[1] ?? 0) + (w2[3] ?? 0) > 0) check('20ג parity', 0, 1);
  const w1 = walk(1, p);
  checkLive('20ד', `${B}20/ד`, [w1[4], w1[0]]);
  checkLive('20ה', `${B}20/ה`, w2[4] / w2[0]);
}
{ // 21 — scratch cards: 10 = 2·50; P(10,10) = 0.09
  const t = solve((v) => v * v, 0.09)[0];
  checkLive('21א', `${B}21/א`, [t, t / 2, 1 - t - t / 2]);
  const card = (b: number, ten = t): [number, number][] => [[0, 1 - ten - b], [10, ten], [50, b]];
  const C = card(t / 2);
  checkLive('21ב', `${B}21/ב`, cat([C, C], (o) => sum(o) >= 50));
  checkLive('21ג', `${B}21/ג`, cat([C, C], (o) => sum(o) >= 20 && sum(o) <= 60));
  const b = solve((v) => cat([card(v, 0.3), card(v, 0.3)], (o) => sum(o) >= 50), 0.36, 0, 0.7)[0];
  checkLive('21ד', `${B}21/ד`, [b, cat([card(b, 0.3), card(b, 0.3)], (o) => sum(o) >= 20 && sum(o) <= 60)]);
  const prop1: [number, number][] = [[0, 0.55], [10, 0.25], [50, 0.2]];
  const prop2: [number, number][] = [[0, 1 - t - t / 2], [10, t], [60, t / 2]];
  const g1 = cat([prop1, prop1], (o) => sum(o) >= 60), g2 = cat([prop2, prop2], (o) => sum(o) >= 60);
  checkLive('21ה', `${B}21/ה`, [g1, g2]);
  if (!(g2 > g1)) check('21ה proposal 2 larger', g2, g1);
}

coverage('pr-basics');
summary('pr-basics r3');
