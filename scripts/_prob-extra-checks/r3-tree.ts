/**
 * r3-tree.ts — adversarial re-derivation of the pr-tree round-3 items:
 * practice pr-x-tre-301…334 and bagrut prob-bag-x-tre-02…18.
 *
 * The published answer is read from the live lesson (checkLive); every `got`
 * is computed here from the STATEMENT — by an equally-likely sample space
 * (sector wheels, labelled urns, whole permutations) wherever one exists, by
 * recursion over the process for stopping games, and by bisection / integer
 * scans for unknowns instead of the author's algebra.
 *
 *   npx tsx scripts/_prob-extra-checks/r3-tree.ts            → 0 failed
 *   PLANT=pr-x-tre-305 npx tsx scripts/_prob-extra-checks/r3-tree.ts → fails on that ref only
 */
import { check, enumerate, drawNoReplacement, summary } from './_lib';
import { checkLive, reviewedByHand, coverage } from './_live';

const R = (n: number) => Array.from({ length: n }, (_, i) => i);
const urn = (...parts: [string, number][]) => parts.flatMap(([l, n]) => Array.from({ length: n }, () => l));
/** bisection on a sign change of f in [lo, hi] */
function root(f: (x: number) => number, lo: number, hi: number): number {
  let a = lo, b = hi, fa = f(a);
  if (fa * f(b) > 0) return NaN;
  for (let i = 0; i < 200; i++) {
    const m = (a + b) / 2, fm = f(m);
    if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
  }
  return (a + b) / 2;
}
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;
/** smallest / largest integer in [lo, hi] satisfying pred */
const firstInt = (lo: number, hi: number, pred: (x: number) => boolean) => { for (let x = lo; x <= hi; x++) if (pred(x)) return x; return NaN; };
const lastInt = (lo: number, hi: number, pred: (x: number) => boolean) => { for (let x = hi; x >= lo; x--) if (pred(x)) return x; return NaN; };
/** a list of weighted outcomes, for processes whose branches are not equally likely */
type W<T> = [T, number][];
const sumW = <T>(ws: W<T>, pred: (t: T) => boolean) => ws.reduce((s, [t, w]) => s + (pred(t) ? w : 0), 0);

// ============================ practice · easy ============================
{ // 301 — 80% on time; late → torn 0.3. P(late AND torn)
  const got = enumerate([R(10), R(10)], ([a, b]) => a >= 8 && b < 3);
  checkLive('301', 'pr-x-tre-301', got);
  check('301 d 0.3 bare branch', 0.3, 0.3);
  check('301 d 0.24 on-time branch × late-torn', 0.8 * 0.3, 0.24);
  check('301 d 0.1 P(torn) overall', 0.8 * 0.05 + 0.2 * 0.3, 0.1);
}
{ // 302 — 60% tomato, P(tomato and takes) = 0.45, find p
  const p = root((p) => 0.6 * p - 0.45, 0, 1);
  checkLive('302', 'pr-x-tre-302', p);
  check('302 w 0.27 multiplied instead', 0.45 * 0.6, 0.27);
}
{ // 303 — 60% dogs 0.5, cats 0.35. P(adopted)
  const got = enumerate([R(10), R(20)], ([a, b]) => (a < 6 ? b < 10 : b < 7));
  checkLive('303', 'pr-x-tre-303', got);
  check('303 d 0.3 dog path only', 0.6 * 0.5, 0.3);
  check('303 d 0.85 sum of rates', 0.5 + 0.35, 0.85);
  check('303 d 0.425 plain mean', (0.5 + 0.35) / 2, 0.425);
}
{ // 304 — wheel A gold 30%, wheel B gold 60%, one spin each. P(different colours)
  const got = enumerate([R(10), R(10)], ([a, b]) => (a < 3) !== (b < 6));
  checkLive('304', 'pr-x-tre-304', got);
  check('304 w 0.12 one path', enumerate([R(10), R(10)], ([a, b]) => a < 3 && b >= 6), 0.12);
  check('304 w 0.46 same colour', 1 - got, 0.46);
}
{ // 305 — 5 black 4 white, 3 without replacement, all white
  const u = urn(['B', 5], ['W', 4]);
  checkLive('305', 'pr-x-tre-305', drawNoReplacement(u, 3, (s) => s.every((c) => c === 'W')));
  check('305 w 64/729 with replacement', enumerate([u, u, u], (s) => s.every((c) => c === 'W')), 64 / 729);
  check('305 w 1/6 two gloves', drawNoReplacement(u, 2, (s) => s.every((c) => c === 'W')), 1 / 6);
}
{ // 306 — riddles 0.9, 0.8, 0.6 in order, failure stops
  const got = enumerate([R(10), R(10), R(10)], ([a, b, c]) => a < 9 && b < 8 && c < 6);
  checkLive('306', 'pr-x-tre-306', got);
  check('306 d 0.72', 0.9 * 0.8, 0.72);
  check('306 d 0.568 complement', 1 - got, 0.568);
}
{ // 307 — 50/30/20 mains; dessert 0.2/0.5/0.6
  const got = enumerate([R(10), R(10)], ([m, d]) => (m < 5 ? d < 2 : m < 8 ? d < 5 : d < 6));
  checkLive('307', 'pr-x-tre-307', got);
  check('307 w 0.25 two paths only', 0.5 * 0.2 + 0.3 * 0.5, 0.25);
  check('307 w 0.63 complement', 1 - got, 0.63);
}
{ // 308 — 85% bike; car on-time 0.9. P(car and late)
  const got = enumerate([R(20), R(10)], ([v, t]) => v >= 17 && t >= 9);
  checkLive('308', 'pr-x-tre-308', got);
  check('308 d 0.135 car on time', 0.15 * 0.9, 0.135);
  check('308 d 0.17 bike late', 0.85 * 0.2, 0.17);
}
{ // 309 — rain→rain 0.65, dry→rain 0.15; today rain. P(tomorrow dry, next rain)
  const next = (rain: boolean) => (rain ? 0.65 : 0.15);
  const got = (1 - next(true)) * next(false);
  checkLive('309', 'pr-x-tre-309', got);
  check('309 w 0.2275 wrong second branch', (1 - next(true)) * next(true), 0.2275);
  check('309 w 0.0975 wrong first branch', next(true) * next(false), 0.0975);
}
{ // 310 — 7 tickets 3 winners, two draws no replacement, exactly one wins
  const u = urn(['W', 3], ['L', 4]);
  const got = drawNoReplacement(u, 2, (s) => s.filter((c) => c === 'W').length === 1);
  checkLive('310', 'pr-x-tre-310', got);
  check('310 d 2/7 one order', drawNoReplacement(u, 2, (s) => s[0] === 'W' && s[1] === 'L'), 2 / 7);
  check('310 d 24/49 with replacement', enumerate([u, u], (s) => s.filter((c) => c === 'W').length === 1), 24 / 49);
  check('310 d 1/7 both win', drawNoReplacement(u, 2, (s) => s.every((c) => c === 'W')), 1 / 7);
}
{ // 311 — 5% sick; alert 0.9 / 0.1
  const got = enumerate([R(20), R(10)], ([h, t]) => (h < 1 ? t < 9 : t < 1));
  checkLive('311', 'pr-x-tre-311', got);
  check('311 w 0.045 sick path', 0.05 * 0.9, 0.045);
  check('311 w 0.5 plain mean', (0.9 + 0.1) / 2, 0.5);
}
{ // 312 — 50 screen / 30 battery / 20 software; software fix 0.7. P(software and failed)
  const got = enumerate([R(10), R(10)], ([k, f]) => k >= 8 && f >= 7);
  checkLive('312', 'pr-x-tre-312', got);
  check('312 d 0.14', 0.2 * 0.7, 0.14);
  check('312 d 0.15 screen × software-fail', 0.5 * 0.3, 0.15);
}
{ // 313 — second shot only after a make, 0.75. P(exactly one point)
  const got = enumerate([R(4), R(4)], ([a, b]) => a < 3 && b >= 3);
  checkLive('313', 'pr-x-tre-313', got);
  check('313 w 0.375 both orders', 2 * 0.75 * 0.25, 0.375);
}
{ // 314 — option A 0.6 vs option B 0.8·0.7
  const b = enumerate([R(10), R(10)], ([x, y]) => x < 8 && y < 7);
  check('314 B = 0.56 < 0.6', b, 0.56);
  check('314 A wins', Number(0.6 > b), 1);
  check('314 d 0.75 mean', (0.8 + 0.7) / 2, 0.75);
  check('314 d 0.94 at least one', 1 - 0.2 * 0.3, 0.94);
  reviewedByHand('pr-x-tre-314', 'option 0 (A, 0.6 > 0.56) is the only correct comparison; distractors 0.75/0.94/0.8 each from its named mistake');
}
// ============================ practice · mid ============================
{ // 315 — 4R 3B 2G, two without replacement, same colour
  const u = urn(['R', 4], ['B', 3], ['G', 2]);
  const got = drawNoReplacement(u, 2, ([a, b]) => a === b);
  checkLive('315', 'pr-x-tre-315', got);
  check('315 w 29/81 with replacement', enumerate([u, u], ([a, b]) => a === b), 29 / 81);
  check('315 w 1/4 no green pair', drawNoReplacement(u, 2, ([a, b]) => a === b && a !== 'G'), 1 / 4);
  check('315 w 13/18 complement', 1 - got, 13 / 18);
}
{ // 316 — deck A 2R 4B → move one to deck B (xR 2B), then draw from B; P(red)=2/3
  const pRed = (x: number) => {
    const A = urn(['R', 2], ['B', 4]);
    let hits = 0, tot = 0;
    for (const moved of A) { const B = [...urn(['R', x], ['B', 2]), moved]; for (const c of B) { tot++; if (c === 'R') hits++; } }
    return hits / tot;
  };
  checkLive('316', 'pr-x-tre-316', firstInt(0, 60, (x) => near(pRed(x), 2 / 3)));
  check('316 w 4 no transfer', firstInt(0, 60, (x) => near(x / (x + 2), 2 / 3)), 4);
  check('316 w 3 denominator x+2', firstInt(0, 60, (x) => near((2 * (x + 1) + 4 * x) / (6 * (x + 2)), 2 / 3)), 3);
}
{ // 317 — 2 hot 3 sweet, alternate, Dana first, first hot loses
  const u = urn(['H', 2], ['S', 3]);
  const danaLoses = drawNoReplacement(u, 5, (s) => s.indexOf('H') % 2 === 0);
  check('317 Ron wins = P(Dana loses) = 3/5', danaLoses, 3 / 5);
  check('317 Dana wins 2/5', 1 - danaLoses, 2 / 5);
  check('317 d loses on first draw 2/5', drawNoReplacement(u, 1, (s) => s[0] === 'H'), 2 / 5);
  check('317 d third-draw path 1/5', drawNoReplacement(u, 5, (s) => s.indexOf('H') === 2), 1 / 5);
  reviewedByHand('pr-x-tre-317', 'second player better: Ron 3/5 by full permutation count; each distractor note matches its option');
}
{ // 318 — fair coin → crate A (4 whole 2 bad) or B (3/3); two without replacement, both whole
  const a = drawNoReplacement(urn(['W', 4], ['D', 2]), 2, (s) => s.every((c) => c === 'W'));
  const b = drawNoReplacement(urn(['W', 3], ['D', 3]), 2, (s) => s.every((c) => c === 'W'));
  checkLive('318', 'pr-x-tre-318', 0.5 * a + 0.5 * b);
  check('318 w 0.6 no coin branch', a + b, 0.6);
  check('318 w 0.2 crate A only', 0.5 * a, 0.2);
}
{ // 319 — die: 6 → half-prize spinner; else 3/10 cards
  const got = enumerate([R(6), R(10)], ([d, s]) => (d === 5 ? s < 5 : s < 3));
  checkLive('319', 'pr-x-tre-319', got);
  check('319 d 4/5', 0.5 + 0.3, 4 / 5);
  check('319 d 2/5 mean', (0.5 + 0.3) / 2, 2 / 5);
  check('319 d 1/12 six path', enumerate([R(6), R(10)], ([d, s]) => d === 5 && s < 5), 1 / 12);
}
{ // 320 — 3 carp + x tilapia, with replacement, P(different) = 4/9
  const f = (x: number) => { const u = urn(['C', 3], ['T', x]); return enumerate([u, u], ([a, b]) => a !== b); };
  checkLive('320', 'pr-x-tre-320', firstInt(1, 60, (x) => near(f(x), 4 / 9)));
  check('320 w 1.5 is the other root', (6 * 1.5) / (4.5 * 4.5), 4 / 9);
  check('320 w 9 = x + 3', 6 + 3, 9);
}
{ // 321 — route A 0.8 vs train 0.9 → 0.95 / 0.3
  const b = enumerate([R(10), R(20)], ([t, a]) => (t < 9 ? a < 19 : a < 6));
  check('321 route B 0.885', b, 0.885);
  check('321 d 0.855', 0.9 * 0.95, 0.855);
  check('321 d 0.625', (0.95 + 0.3) / 2, 0.625);
  reviewedByHand('pr-x-tre-321', 'option 0 (B, 0.885 > 0.8) is right; 0.855/0.625/0.9 each from its named mistake');
}
{ // 322 — accept 0.5, 0.4, 0.2 independent; exactly two
  const got = enumerate([R(10), R(10), R(10)], ([a, b, c]) => Number(a < 5) + Number(b < 4) + Number(c < 2) === 2);
  checkLive('322', 'pr-x-tre-322', got);
  check('322 w 0.3 at least two', enumerate([R(10), R(10), R(10)], ([a, b, c]) => Number(a < 5) + Number(b < 4) + Number(c < 2) >= 2), 0.3);
  check('322 w 0.16', 0.5 * 0.4 * 0.8, 0.16);
  check('322 w 0.38 pairs without third branch', 0.5 * 0.4 + 0.5 * 0.2 + 0.4 * 0.2, 0.38);
}
{ // 333 — bread 0.7; pastry 0.4 / 0.2; two customers, exactly one pastry
  const one = enumerate([R(10), R(10)], ([br, pa]) => (br < 7 ? pa < 4 : pa < 2));
  checkLive('333', 'pr-x-tre-333', 2 * one * (1 - one));
  check('333 w 0.34', one, 0.34);
  check('333 w 0.2244 one order', one * (1 - one), 0.2244);
  check('333 w 0.4032 bread-path only', 2 * 0.28 * 0.72, 0.4032);
}
// ============================ practice · hard ============================
{ // 323 — rain→rain p, dry→rain 0.2; P(rain day after tomorrow) = 0.44
  const p = root((p) => p * p + (1 - p) * 0.2 - 0.44, 0.2, 1);
  const atLeast = 1 - (1 - p) * 0.8;
  checkLive('323', 'pr-x-tre-323', [p, atLeast]);
  check('323 w 0.32 complement', (1 - p) * 0.8, 0.32);
  check('323 w 0.84 wrong dry-dry', 1 - (1 - p) * (1 - p), 0.84);
}
{ // 324 — first serve p, second 1.5p; win 0.7 / 0.5; P(win) = 0.6
  const p = root((p) => 0.7 * p + (1 - p) * 1.5 * p * 0.5 - 0.6, 0, 2 / 3);
  checkLive('324', 'pr-x-tre-324', [p, (1 - p) * (1 - 1.5 * p)]);
  check('324 w 0.16', (1 - p) * (1 - p), 0.16);
  check('324 w 0.1', 1 - 1.5 * p, 0.1);
}
{ // 325 — urban (2 lights green 0.7) w.p. p, fast (1 light green 0.3); can P(≥1 red) = 0.8?
  const P = (p: number) => p * enumerate([R(10), R(10)], ([a, b]) => a >= 7 || b >= 7) + (1 - p) * 0.7;
  let max = -1;
  for (let i = 0; i <= 1000; i++) max = Math.max(max, P(i / 1000));
  check('325 max over p is 0.7', max, 0.7);
  check('325 P(1) = 0.51', P(1), 0.51);
  check('325 d option1 solves to negative p', Number((0.7 - 0.8) / 0.19 < 0), 1);
  check('325 d option2 sign slip reaches 0.8 at 10/19', 0.7 + 0.19 * (10 / 19), 0.8);
  check('325 d option3 0.91 = 1 − both red', 1 - 0.3 * 0.3, 0.91);
  reviewedByHand('pr-x-tre-325', 'not possible: max of P over p in [0,1] is 0.7 by grid; only option 0 has right conclusion AND right formula');
}
{ // 326 — 3 vouchers + 2 empty + x empty; two without replacement; P(both voucher) < 0.1
  const both = (x: number) => drawNoReplacement(urn(['V', 3], ['E', 2 + x]), 2, (s) => s.every((c) => c === 'V'));
  const x = firstInt(0, 40, (x) => both(x) < 0.1);
  const some = drawNoReplacement(urn(['V', 3], ['E', 2 + x]), 2, (s) => s.includes('V'));
  checkLive('326', 'pr-x-tre-326', [x, some]);
  check('326 w 9 total envelopes', x + 5, 9);
  check('326 w 5/12 both empty', 1 - some, 5 / 12);
  const xr = firstInt(0, 40, (x) => { const u = urn(['V', 3], ['E', 2 + x]); return enumerate([u, u], (s) => s.every((c) => c === 'V')) < 0.1; });
  check('326 w with replacement gives 5', xr, 5);
  check('326 w 8/15 at x=5', drawNoReplacement(urn(['V', 3], ['E', 7]), 2, (s) => s.includes('V')), 8 / 15);
}
{ // 327 — 100/200/300 points; correct 0.8/0.5/0.3
  const pts = ([a, b, c]: number[]) => (a < 8 ? 100 : 0) + (b < 5 ? 200 : 0) + (c < 3 ? 300 : 0);
  const S = [R(10), R(10), R(10)];
  checkLive('327', 'pr-x-tre-327', [enumerate(S, (o) => pts(o) >= 300), enumerate(S, (o) => pts(o) === 300)]);
  check('327 w 0.42', enumerate(S, (o) => pts(o) < 300), 0.42);
  check('327 w 0.28', 0.8 * 0.5 * 0.7, 0.28);
  check('327 w 0.03', 0.2 * 0.5 * 0.3, 0.03);
}
{ // 328 — 12 bolts x bad, up to 3 draws, stop at bad; pass ≥ 0.5; P(reject at second)
  const pass = (x: number) => drawNoReplacement(urn(['G', 12 - x], ['D', x]), 3, (s) => s.every((c) => c === 'G'));
  const x = lastInt(0, 12, (x) => pass(x) >= 0.5);
  const u = urn(['G', 12 - x], ['D', x]);
  checkLive('328', 'pr-x-tre-328', [x, drawNoReplacement(u, 2, (s) => s[0] === 'G' && s[1] === 'D')]);
  check('328 w 5/11 reject overall', 1 - pass(x), 5 / 11);
  check('328 w 1/6 reject at first', drawNoReplacement(u, 1, (s) => s[0] === 'D'), 1 / 6);
}
{ // 329 — x gold + 6 silver; gold → back + one more gold; silver kept out
  const run = (x: number) => {
    const u = urn(['G', x], ['S', 6]);
    let gg = 0, anyG = 0, tot = 0;
    u.forEach((first, i) => {
      const u2 = first === 'G' ? [...u, 'G'] : u.filter((_, j) => j !== i);
      const w = 1 / u.length / u2.length;
      for (const second of u2) { tot += w; if (first === 'G' && second === 'G') gg += w; if (first === 'G' || second === 'G') anyG += w; }
    });
    return { gg: gg / tot, anyG: anyG / tot };
  };
  const x = firstInt(1, 60, (x) => near(run(x).gg, 2 / 11));
  checkLive('329', 'pr-x-tre-329', [x, run(x).anyG]);
  check('329 w 9/11', 1 - run(x).gg, 9 / 11);
  check('329 w 16/25 silver treated with replacement', 1 - 0.6 * 0.6, 16 / 25);
}
{ // 330 — 5 dark + x milk, draw until one of each; P(stop after exactly 2) = 15/28
  const u = (x: number) => urn(['D', 5], ['M', x]);
  const x = firstInt(1, 40, (x) => near(drawNoReplacement(u(x), 2, ([a, b]) => a !== b), 15 / 28));
  const atLeast4 = drawNoReplacement(u(x), 3, ([a, b, c]) => a === b && b === c);
  checkLive('330', 'pr-x-tre-330', [x, atLeast4]);
  check('330 w 5/28 dark only', drawNoReplacement(u(x), 3, (s) => s.every((c) => c === 'D')), 5 / 28);
  check('330 w 13/28 at least three', 1 - 15 / 28, 13 / 28);
}
{ // 331 — sick p; test A 0.95/0.1; B only after A+: 0.9/0.05; both + = 3.9%
  const both = (p: number) => p * 0.95 * 0.9 + (1 - p) * 0.1 * 0.05;
  const p = root((p) => both(p) - 0.039, 0, 1);
  const onePos: W<string> = [['sA+', p * 0.95], ['sA-', p * 0.05], ['hA+', (1 - p) * 0.1], ['hA-', (1 - p) * 0.9]];
  checkLive('331', 'pr-x-tre-331', [p, sumW(onePos, (t) => t.endsWith('+'))]);
  check('331 w 0.179 everyone takes both', p * (1 - 0.05 * 0.1) + (1 - p) * (1 - 0.9 * 0.95), 0.179);
  check('331 w 0.038 sick path', p * 0.95, 0.038);
}
{ // 332 — CPU 0.9 AND (mem1 0.8 OR mem2 0.7)
  const S = [R(10), R(10), R(10)];
  const ok = ([c, m, n]: number[]) => [c < 9, m < 8, n < 7];
  checkLive('332', 'pr-x-tre-332', [enumerate(S, (o) => { const [c, m, n] = ok(o); return c && (m || n); }), enumerate(S, (o) => ok(o).filter((v) => !v).length === 1)]);
  check('332 w 0.504', 0.9 * 0.8 * 0.7, 0.504);
  check('332 w 0.342', 0.9 * 0.2 * 0.7 + 0.9 * 0.8 * 0.3, 0.342);
  check('332 w 0.94', 1 - 0.2 * 0.3, 0.94);
}
{ // 334 — two junctions; right p; wrong → return 0.5 (then right) or lost; P(summit) = 0.81
  const junction = (p: number): W<string> => [['right', p], ['back', (1 - p) * 0.5], ['lost', (1 - p) * 0.5]];
  const summit = (p: number) => { const j = junction(p); let s = 0; for (const [a, wa] of j) for (const [b, wb] of j) if (a !== 'lost' && b !== 'lost') s += wa * wb; return s; };
  const p = root((p) => summit(p) - 0.81, 0, 1);
  const j = junction(p);
  let withBack = 0, exactlyOne = 0;
  for (const [a, wa] of j) for (const [b, wb] of j) if (a !== 'lost' && b !== 'lost') {
    if (a === 'back' || b === 'back') withBack += wa * wb;
    if ((a === 'back') !== (b === 'back')) exactlyOne += wa * wb;
  }
  checkLive('334', 'pr-x-tre-334', [p, withBack]);
  check('334 w 0.36', 1 - p * p, 0.36);
  check('334 w 0.9 pass one junction', 0.5 + 0.5 * p, 0.9);
  check('334 w 0.16 exactly one return', exactlyOne, 0.16);
}

// ================================ bagrut ================================
{ // 02 — best of 3 (first to 2); P(ends after 2) = 0.52; p > 0.5
  /** win probability for Noam in game k given history (true = Noam won) */
  const series = (pGame: (hist: boolean[]) => number, pred: (hist: boolean[]) => boolean) => {
    const walk = (h: boolean[], w: number): number => {
      const n = h.filter(Boolean).length, a = h.length - n;
      if (n === 2 || a === 2) return pred(h) ? w : 0;
      const q = pGame(h);
      return walk([...h, true], w * q) + walk([...h, false], w * (1 - q));
    };
    return walk([], 1);
  };
  const p = root((p) => series(() => p, (h) => h.length === 2) - 0.52, 0.5, 1);
  checkLive('02א', 'prob-bag-x-tre-02/א', p);
  checkLive('02ב', 'prob-bag-x-tre-02/ב', series(() => p, (h) => h.filter(Boolean).length === 2));
  checkLive('02ג', 'prob-bag-x-tre-02/ג', series(() => p, (h) => { const noamWon = h.filter(Boolean).length === 2; return h[0] !== noamWon; }));
  const sticky = (h: boolean[]) => (h.length === 0 ? p : h[h.length - 1] ? 0.7 : 0.3);
  checkLive('02ד', 'prob-bag-x-tre-02/ד', series(sticky, (h) => h.filter(Boolean).length === 2));
}
{ // 03 — spinner blue 0.5 (1pt, ends turn), green p (2), red rest (3); P(≥5) = 0.16
  const turn = (g: number, r: number): W<number> => {
    const faces: W<number> = [[1, 0.5], [2, g], [3, r]];
    const out: W<number> = [];
    for (const [a, wa] of faces) { if (a === 1) { out.push([1, wa]); continue; } for (const [b, wb] of faces) out.push([a + b, wa * wb]); }
    return out;
  };
  const p = root((p) => sumW(turn(p, 0.5 - p), (s) => s >= 5) - 0.16, 0, 0.5);
  checkLive('03א', 'prob-bag-x-tre-03/א', p);
  checkLive('03ב', 'prob-bag-x-tre-03/ב', sumW(turn(p, 0.5 - p), (s) => s === 4));
  checkLive('03ג', 'prob-bag-x-tre-03/ג', sumW(turn(p, 0.5 - p), (s) => s % 2 === 1));
  checkLive('03ד', 'prob-bag-x-tre-03/ד', sumW(turn(0.2, 0.3), (s) => s >= 4));
  check('03ד old board 0.35', sumW(turn(p, 0.5 - p), (s) => s >= 4), 0.35);
}
{ // 04 — review p, auto 0.5, beta 0.4; P(reaches customers) = 0.06
  const reach = (p: number, q: number) => (1 - p) * (1 - 0.5) * (1 - q);
  const p = root((p) => reach(p, 0.4) - 0.06, 0, 1);
  checkLive('04א', 'prob-bag-x-tre-04/א', p);
  const r0 = reach(p, 0.4);
  checkLive('04ב', 'prob-bag-x-tre-04/ב', 1 - (1 - r0) ** 2);
  const q = root((q) => 1 - (1 - reach(p, q)) ** 2 - 0.0591, 0, 1); // decreasing in q: smallest q meeting ≤ is the root
  checkLive('04ג', 'prob-bag-x-tre-04/ג', q);
  const r1 = reach(p, q);
  checkLive('04ד', 'prob-bag-x-tre-04/ד', 2 * r1 * (1 - r1));
  check('04ד gap 0.0546', 2 * r0 * (1 - r0) - 2 * r1 * (1 - r1), 0.0546);
}
{ // 05 — 7 batteries x empty; stop when 2 good in hand; P(stop after 2) = 10/21
  const box = (good: number, empty: number) => urn(['G', good], ['E', empty]);
  /** index (0-based) of the draw at which the 2nd good appears */
  const stopAt = (s: string[]) => { let g = 0; for (let i = 0; i < s.length; i++) if (s[i] === 'G' && ++g === 2) return i; return -1; };
  const x = firstInt(0, 5, (x) => near(drawNoReplacement(box(7 - x, x), 7, (s) => stopAt(s) === 1), 10 / 21));
  checkLive('05א', 'prob-bag-x-tre-05/א', x);
  const b = box(7 - x, x);
  checkLive('05ב', 'prob-bag-x-tre-05/ב', drawNoReplacement(b, 7, (s) => s.slice(0, stopAt(s) + 1).filter((c) => c === 'E').length === 1));
  checkLive('05ג', 'prob-bag-x-tre-05/ג', drawNoReplacement(b, 7, (s) => s.slice(0, stopAt(s) + 1).filter((c) => c === 'E').length === 2));
  checkLive('05ד', 'prob-bag-x-tre-05/ד', drawNoReplacement(box(4, 2), 6, (s) => stopAt(s) <= 2));
  check('05ד first box 6/7', drawNoReplacement(b, 7, (s) => stopAt(s) <= 2), 6 / 7);
}
{ // 06 — top 3T 2S, bottom xT 1S; top→bottom, bottom→top, Noa picks top; P(T) = 0.624
  const sim = (x: number) => {
    let noaT = 0, back = 0, anyT = 0, tot = 0;
    const top0 = urn(['T', 3], ['S', 2]);
    top0.forEach((down, i) => {
      const top1 = top0.filter((_, j) => j !== i), bot1 = [...urn(['T', x], ['S', 1]), down];
      bot1.forEach((up, k) => {
        const bot2 = bot1.filter((_, j) => j !== k), top2 = [...top1, up];
        const w = 1 / top0.length / bot1.length;
        tot += w;
        if (up === down) back += w;
        noaT += (w * top2.filter((c) => c === 'T').length) / top2.length;
        const bothS = (top2.filter((c) => c === 'S').length / top2.length) * (bot2.filter((c) => c === 'S').length / bot2.length);
        anyT += w * (1 - bothS);
      });
    });
    return { noaT: noaT / tot, back: back / tot, anyT: anyT / tot };
  };
  const x = firstInt(0, 40, (x) => near(sim(x).noaT, 0.624));
  checkLive('06א', 'prob-bag-x-tre-06/א', x);
  checkLive('06ב', 'prob-bag-x-tre-06/ב', sim(x).back);
  checkLive('06ג', 'prob-bag-x-tre-06/ג', sim(x).anyT);
  // ד: case 1 only the boy errs (4 left on top); case 2 only the girl errs (bottom unchanged → top 6)
  const top0 = urn(['T', 3], ['S', 2]);
  let c1 = 0; top0.forEach((_, i) => { const t = top0.filter((__, j) => j !== i); c1 += t.filter((c) => c === 'T').length / t.length / top0.length; });
  const bot = urn(['T', x], ['S', 1]);
  let c2 = 0; bot.forEach((up) => { const t = [...top0, up]; c2 += t.filter((c) => c === 'T').length / t.length / bot.length; });
  check('06ד case 1 = 0.6', c1, 0.6);
  checkLive('06ד', 'prob-bag-x-tre-06/ד', Math.max(c1, c2));
}
{ // 07 — 3 lights; first green 0.6; after green 0.8 green, after red p green; P(exactly one red) = 0.272
  const lights = (p: number, indep = false): W<boolean[]> => {
    const out: W<boolean[]> = [];
    const walk = (h: boolean[], w: number) => {
      if (h.length === 3) { out.push([h, w]); return; }
      const g = indep || h.length === 0 ? 0.6 : h[h.length - 1] ? 0.8 : p;
      walk([...h, true], w * g); walk([...h, false], w * (1 - g));
    };
    walk([], 1);
    return out;
  };
  const reds = (h: boolean[]) => h.filter((v) => !v).length;
  const p = root((p) => sumW(lights(p), (h) => reds(h) === 1) - 0.272, 0, 1);
  checkLive('07א', 'prob-bag-x-tre-07/א', p);
  checkLive('07ב', 'prob-bag-x-tre-07/ב', sumW(lights(p), (h) => reds(h) >= 2));
  checkLive('07ג', 'prob-bag-x-tre-07/ג', sumW(lights(p), (h) => (!h[0] && !h[1]) || (!h[1] && !h[2])));
  checkLive('07ד', 'prob-bag-x-tre-07/ד', sumW(lights(p, true), (h) => reds(h) >= 2));
}
{ // 08 — two seeds p; keep one sprout; survives 0.75; P(surviving plant) = 0.72
  // each seed on a 100-cell grid, each survival on a 4-cell grid (0.75 = 3 of 4)
  const pot = (p: number, oldWay: boolean) => {
    const pc = Math.round(p * 100);
    const dist = [0, 0, 0];
    const tot = 100 * 100 * 16;
    for (let a = 0; a < 100; a++) for (let b = 0; b < 100; b++) for (let u = 0; u < 4; u++) for (let v = 0; v < 4; v++) {
      const sprouts = Number(a < pc) + Number(b < pc);
      const moved = oldWay ? Math.min(sprouts, 1) : sprouts;
      const survive = (moved >= 1 ? Number(u < 3) : 0) + (moved === 2 ? Number(v < 3) : 0);
      dist[survive]++;
    }
    return dist.map((d) => d / tot);
  };
  const p = root((p) => (1 - (1 - p) ** 2) * 0.75 - 0.72, 0, 1);
  check('08 p is on the percent grid', Math.abs(p * 100 - Math.round(p * 100)), 0, 1e-6);
  const old = pot(p, true), neu = pot(p, false);
  checkLive('08א', 'prob-bag-x-tre-08/א', p);
  check('08א grid reproduces 0.72', old[1], 0.72);
  checkLive('08ב', 'prob-bag-x-tre-08/ב', 2 * old[1] * old[0]);
  checkLive('08ג', 'prob-bag-x-tre-08/ג', neu[1] + neu[2]);
  let atLeast3 = 0;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (i + j >= 3) atLeast3 += neu[i] * neu[j];
  checkLive('08ד', 'prob-bag-x-tre-08/ד', atLeast3);
}
{ // 09 — shootout: blue 0.9, red p; decided if exactly one scores; ≤2 rounds then coin; P(blue r1) = 6·P(red r1)
  const round = (b: number, r: number) => ({ blue: b * (1 - r), red: (1 - b) * r, none: b * r + (1 - b) * (1 - r) });
  const p = root((p) => round(0.9, p).blue - 6 * round(0.9, p).red, 0, 1);
  checkLive('09א', 'prob-bag-x-tre-09/א', p);
  const blueWins = (r1: ReturnType<typeof round>, r2: ReturnType<typeof round>) => r1.blue + r1.none * r2.blue + r1.none * r2.none * 0.5;
  const r1 = round(0.9, p);
  checkLive('09ב', 'prob-bag-x-tre-09/ב', blueWins(r1, r1));
  const q = root((q) => r1.none * round(q, 0.4).none - 0.29, 0, 1);
  checkLive('09ג', 'prob-bag-x-tre-09/ג', q);
  checkLive('09ד', 'prob-bag-x-tre-09/ד', blueWins(r1, round(q, 0.4)));
}
{ // 10 — home 0.7, neighbour 0.5, warehouse → day 2: home p, neighbour 0.5, else back to sender
  const pkg = (p: number): W<string> => [['home', 0.7], ['nbr', 0.3 * 0.5], ['home', 0.3 * 0.5 * p], ['nbr', 0.3 * 0.5 * (1 - p) * 0.5], ['sender', 0.3 * 0.5 * (1 - p) * 0.5]];
  const wh = 0.3 * 0.5;
  checkLive('10א', 'prob-bag-x-tre-10/א', 1 - (1 - wh) ** 2);
  const p = root((p) => sumW(pkg(p), (t) => t === 'sender') - 0.03, 0, 1);
  checkLive('10ב', 'prob-bag-x-tre-10/ב', p);
  const h = sumW(pkg(p), (t) => t === 'home'), n = sumW(pkg(p), (t) => t === 'nbr');
  checkLive('10ג', 'prob-bag-x-tre-10/ג', 2 * h * n);
  let max = 0; for (let i = 0; i <= 1000; i++) max = Math.max(max, sumW(pkg(i / 1000), (t) => t === 'home'));
  check('10ד max P(home) = 0.85, never above', max, 0.85);
  reviewedByHand('prob-bag-x-tre-10/ד', 'not possible: P(home) = 0.7 + 0.15p, grid max over p in [0,1] is exactly 0.85 (reached only at p = 1)');
}
{ // 11 — forecast rain x%; rain 0.8/0.1; umbrella 0.9/0.3 (indep given forecast); P(wet) = 0.073
  const day = (f: number, uR: number, uD: number): W<[boolean, boolean]> => {
    const out: W<[boolean, boolean]> = [];
    for (const [fr, wf] of [[true, f], [false, 1 - f]] as [boolean, number][]) {
      const u = fr ? uR : uD, r = fr ? 0.8 : 0.1;
      for (const [um, wu] of [[true, u], [false, 1 - u]] as [boolean, number][]) for (const [rn, wr] of [[true, r], [false, 1 - r]] as [boolean, number][]) out.push([[um, rn], wf * wu * wr]);
    }
    return out;
  };
  const x = root((x) => sumW(day(x / 100, 0.9, 0.3), ([u, r]) => r && !u) - 0.073, 0, 100);
  checkLive('11א', 'prob-bag-x-tre-11/א', x);
  const f = x / 100;
  checkLive('11ב', 'prob-bag-x-tre-11/ב', sumW(day(f, 0.9, 0.3), ([u, r]) => u === r));
  const r = root((r) => sumW(day(f, 1, r), ([u, rn]) => rn && !u) - 0.035, 0, 1);
  checkLive('11ג', 'prob-bag-x-tre-11/ג', r);
  checkLive('11ד', 'prob-bag-x-tre-11/ד', sumW(day(f, 1, r), ([u, rn]) => u && !rn));
  check('11ד old habit 0.243', sumW(day(f, 0.9, 0.3), ([u, rn]) => u && !rn), 0.243);
}
{ // 12 — parent A 0.4; child A 0.8 | parent A, p | parent B; same = 4·different
  const fam = (p: number): W<[string, string]> => [[['A', 'A'], 0.4 * 0.8], [['A', 'B'], 0.4 * 0.2], [['B', 'A'], 0.6 * p], [['B', 'B'], 0.6 * (1 - p)]];
  const p = root((p) => sumW(fam(p), ([a, b]) => a === b) - 4 * sumW(fam(p), ([a, b]) => a !== b), 0, 1);
  checkLive('12א', 'prob-bag-x-tre-12/א', p);
  checkLive('12ב', 'prob-bag-x-tre-12/ב', sumW(fam(p), ([, c]) => c === 'A'));
  let three = 0;
  for (const [[a, c], w] of fam(p)) for (const s of ['A', 'B']) { const ws = s === c ? 0.9 : 0.1; if ([a, c, s].filter((v) => v === 'A').length >= 2) three += w * ws; }
  checkLive('12ג', 'prob-bag-x-tre-12/ג', three);
  checkLive('12ד', 'prob-bag-x-tre-12/ד', enumerate([R(10), R(10)], ([a, b]) => (a < 4) !== (b < 4)));
  check('12ד same family 0.2', sumW(fam(p), ([a, b]) => a !== b), 0.2);
}
{ // 13 — 5 choc + x oat; Yoav: choc eats, oat → back + draw again and eat
  const pickyEat = (jar: string[]): W<string[]> => {
    const out: W<string[]> = [];
    jar.forEach((c, i) => {
      const w = 1 / jar.length;
      if (c === 'C') out.push([jar.filter((_, j) => j !== i), w]);
      else jar.forEach((c2, k) => out.push([jar.filter((_, j) => j !== k), (w / jar.length)]));
    });
    return out;
  };
  const eatenChoc = (jar: string[], after: string[]) => jar.filter((c) => c === 'C').length - after.filter((c) => c === 'C').length === 1;
  const x = firstInt(1, 40, (x) => { const jar = urn(['C', 5], ['O', x]); return near(sumW(pickyEat(jar), (a) => eatenChoc(jar, a)), 0.75); });
  checkLive('13א', 'prob-bag-x-tre-13/א', x);
  const jar = urn(['C', 5], ['O', x]);
  let mich = 0, bothC = 0, mPicky = 0;
  for (const [after, w] of pickyEat(jar)) {
    const yC = eatenChoc(jar, after);
    const pc = after.filter((c) => c === 'C').length / after.length;
    mich += w * pc;
    if (yC) bothC += w * pc;
    mPicky += w * sumW(pickyEat(after), (a2) => eatenChoc(after, a2));
  }
  checkLive('13ב', 'prob-bag-x-tre-13/ב', mich);
  checkLive('13ג', 'prob-bag-x-tre-13/ג', 1 - bothC);
  checkLive('13ד', 'prob-bag-x-tre-13/ד', mPicky);
  check('13ד is below Yoav 3/4', Number(mPicky < 0.75), 1);
  check('13ד not guessable: differs from 5/10 and 17/36', Number(!near(mPicky, 0.5) && !near(mPicky, 17 / 36)), 1);
}
{ // 14 — x twin pairs; draw names until a twin pair; P(stop after exactly 3) = 2/9
  const names = (n: number) => R(n).flatMap((i) => [String(i), String(i)]);
  const firstPair = (s: string[]) => { for (let i = 1; i < s.length; i++) if (s.slice(0, i).includes(s[i])) return i + 1; return Infinity; };
  const pStopAt = (n: number, k: number) => drawNoReplacement(names(n), k, (s) => firstPair(s) === k);
  const x = firstInt(2, 8, (n) => near(pStopAt(n, 3), 2 / 9));
  checkLive('14א', 'prob-bag-x-tre-14/א', x);
  checkLive('14ב', 'prob-bag-x-tre-14/ב', drawNoReplacement(names(x), 4, (s) => firstPair(s) <= 4));
  const noPairIn = (k: number) => drawNoReplacement(names(x), k, (s) => firstPair(s) > k);
  const maxDraws = firstInt(2, 2 * x, (k) => noPairIn(k) === 0);
  checkLive('14ג', 'prob-bag-x-tre-14/ג', [maxDraws, noPairIn(maxDraws - 1)]);
  const bigger: number[] = [];
  for (let n = 2; n <= 7; n++) { const p3 = pStopAt(n, 3), p4 = n >= 2 ? pStopAt(n, 4) : 0; if (p4 > p3 + 1e-12) bigger.push(n); if (n === 3) check('14ד n=3 equal', p4, p3); }
  check('14ד P4 > P3 exactly for n = 4..7 in range', Number(bigger.join(',') === '4,5,6,7'), 1);
  reviewedByHand('prob-bag-x-tre-14/ד', 'possible iff n >= 4: brute-force stop-at-4 vs stop-at-3 for n = 2..7 gives bigger for 4..7, equal at 3, zero at 2');
}
{ // 15 — machines p < q; P(no defect) = 0.72, P(exactly one) = 0.26; inspector 0.8 / always
  let P = NaN, Q = NaN;
  for (let i = 0; i <= 100; i++) for (let j = i + 1; j <= 100; j++) {
    const p = i / 100, q = j / 100;
    if (near((1 - p) * (1 - q), 0.72) && near(p * (1 - q) + (1 - p) * q, 0.26)) { P = p; Q = q; }
  }
  checkLive('15א', 'prob-bag-x-tre-15/א', [P, Q]);
  const line = (p: number, q: number): W<string> => [['2', p * q], ['1c', p * (1 - q) * 0.8 + (1 - p) * q * 0.8], ['1s', p * (1 - q) * 0.2 + (1 - p) * q * 0.2], ['0', (1 - p) * (1 - q)]];
  checkLive('15ב', 'prob-bag-x-tre-15/ב', sumW(line(P, Q), (t) => t === '2' || t === '1c'));
  checkLive('15ג', 'prob-bag-x-tre-15/ג', [sumW(line(P, Q), (t) => t === '1s' || t === '0'), sumW(line(P, Q), (t) => t === '1s')]);
  const r = root((r) => sumW(line(P, r), (t) => t === '1s') - 0.036, 0, 1); // increasing in r: largest r meeting ≤ is the root
  checkLive('15ד', 'prob-bag-x-tre-15/ד', r);
}
{ // 16 — pairs of dogs, sick p each; one sick infects the healthy 0.5; treatment 0.8
  const p = root((p) => 1 - (1 - p) ** 2 - 0.19, 0, 1);
  checkLive('16א', 'prob-bag-x-tre-16/א', p);
  const week = (p: number) => { const d = [0, 0, 0]; d[2] += p * p; d[2] += 2 * p * (1 - p) * 0.5; d[1] += 2 * p * (1 - p) * 0.5; d[0] += (1 - p) ** 2; return d; };
  checkLive('16ב', 'prob-bag-x-tre-16/ב', week(p)[2]);
  let dev = 0; for (let i = 0; i <= 1000; i++) dev = Math.max(dev, Math.abs(week(i / 1000)[2] - i / 1000));
  check('16ג both-sick equals p on the whole grid', dev, 0);
  reviewedByHand('prob-bag-x-tre-16/ג', 'not possible: P(both sick) − p is 0 for every p on a 1001-point grid, matching the identity p² + p(1−p) = p');
  const d = week(p);
  checkLive('16ד', 'prob-bag-x-tre-16/ד', d[1] * 0.2 + d[2] * (1 - 0.8 * 0.8));
}
{ // 17 — stage A p, stage B q, one retry total; P(lose in A) = 0.04; P(win, no retry) = 0.4
  /** extraRetryIfCleanA: the version where passing A first time grants one more retry in B */
  const game = (p: number, q: number, extraRetryIfCleanA = false) => {
    let win = 0;
    const walk = (stage: number, retries: number, w: number, cleanA: boolean) => {
      if (stage === 2) { win += w; return; }
      const s = stage === 0 ? p : q;
      walk(stage + 1, retries + (stage === 0 && cleanA && extraRetryIfCleanA ? 1 : 0), w * s, cleanA);
      if (retries > 0) walk(stage, retries - 1, w * (1 - s), stage === 0 ? false : cleanA);
    };
    walk(0, 1, 1, true);
    return win;
  };
  const p = root((p) => (1 - p) ** 2 - 0.04, 0.5, 1);
  const q = root((q) => p * q - 0.4, 0, 1);
  checkLive('17א', 'prob-bag-x-tre-17/א', [p, q]);
  checkLive('17ב', 'prob-bag-x-tre-17/ב', game(p, q));
  checkLive('17ג', 'prob-bag-x-tre-17/ג', game(p, q, true));
  checkLive('17ד', 'prob-bag-x-tre-17/ד', game(p, 0.6));
  check('17ד below 17ג', Number(game(p, 0.6) < game(p, q, true)), 1);
}
{ // 18 — busy 0.3: late p; quiet: late 0.1; same evening → dishes independent given evening
  let max = 0; for (let i = 0; i <= 1000; i++) max = Math.max(max, 0.3 * (i / 1000) + 0.7 * 0.1);
  check('18א max 0.37 < 0.4', max, 0.37);
  reviewedByHand('prob-bag-x-tre-18/א', 'not possible: P(late) over a p-grid never exceeds 0.37');
  const eve = (p: number): W<number> => [[p, 0.3], [0.1, 0.7]];
  const both = (p: number) => eve(p).reduce((s, [l, w]) => s + w * l * l, 0);
  const p = root((p) => both(p) - 0.055, 0, 1);
  checkLive('18ב', 'prob-bag-x-tre-18/ב', p);
  checkLive('18ג', 'prob-bag-x-tre-18/ג', eve(p).reduce((s, [l, w]) => s + w * 2 * l * (1 - l), 0));
  const one = eve(p).reduce((s, [l, w]) => s + w * l, 0);
  checkLive('18ד', 'prob-bag-x-tre-18/ד', one * one);
}

const cov = coverage('pr-tree');
console.log(`coverage pr-tree: ${cov.refs - cov.missing}/${cov.refs} round-3 items checked, ${cov.unbound} unbound`);
summary('pr-tree r3');
