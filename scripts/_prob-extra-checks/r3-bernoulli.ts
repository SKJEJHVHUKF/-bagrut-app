/**
 * r3-bernoulli.ts — adversarial re-derivation of the pr-bernoulli round-3 items:
 * practice pr-x-ber-301…335 and bagrut prob-bag-x-ber-02…19.
 *
 * No Bernoulli formula is re-applied here. Every answer is obtained by
 * ENUMERATING the outcome sequences (k^n of them, each weighted by the product of
 * its independent trial probabilities) or by SIMULATING a stopping process branch
 * by branch. Unknowns are found by scanning a grid of candidate values until the
 * stated condition holds (and must hold for exactly one candidate).
 *
 *   npx tsx scripts/_prob-extra-checks/r3-bernoulli.ts
 *   PLANT=pr-x-ber-305 npx tsx scripts/_prob-extra-checks/r3-bernoulli.ts → fails on that ref only
 */
import { check, summary } from './_lib';
import { checkLive, reviewedByHand, coverage } from './_live';

type Out = [string, number];
const B = (p: number): Out[] => [['S', p], ['F', 1 - p]];
const cnt = (s: string[], o: string) => s.filter((x) => x === o).length;

/** P(pred) over all sequences, position i drawn independently from dists[i] */
function seqD(dists: Out[][], pred: (s: string[]) => boolean): number {
  let tot = 0;
  const walk = (s: string[], w: number) => {
    if (s.length === dists.length) { if (pred(s)) tot += w; return; }
    for (const [o, p] of dists[s.length]) walk([...s, o], w * p);
  };
  walk([], 1);
  return tot;
}
const seq = (n: number, outs: Out[], pred: (s: string[]) => boolean) => seqD(Array(n).fill(outs), pred);

/** a process that runs trial by trial until stop(s); sequences still running at maxLen are passed with done=false */
function stopped(outs: Out[], stop: (s: string[]) => boolean, maxLen: number, pred: (s: string[], done: boolean) => boolean): number {
  let tot = 0;
  const walk = (s: string[], w: number) => {
    if (s.length > 0 && stop(s)) { if (pred(s, true)) tot += w; return; }
    if (s.length === maxLen) { if (pred(s, false)) tot += w; return; }
    for (const [o, p] of outs) walk([...s, o], w * p);
  };
  walk([], 1);
  return tot;
}

/** candidate values for an unknown probability: k/1000 and a/b with b ≤ 12 */
const CANDS = (() => {
  const set = new Map<string, number>();
  for (let k = 1; k < 1000; k++) set.set((k / 1000).toFixed(12), k / 1000);
  for (let b = 2; b <= 12; b++) for (let a = 1; a < b; a++) set.set((a / b).toFixed(12), a / b);
  return [...set.values()];
})();
/** the unique candidate satisfying f(x) = target (and cond); NaN if none or several */
function solve(f: (x: number) => number, target: number, cond: (x: number) => boolean = () => true, cands = CANDS): number {
  const hits = cands.filter((x) => cond(x) && Math.abs(f(x) - target) < 1e-9);
  return hits.length === 1 ? hits[0] : NaN;
}
const ints = (lo: number, hi: number) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

// ============================ practice · easy ============================
{ // 301 all four lights green
  checkLive('301', 'pr-x-ber-301', seq(4, B(0.6), (s) => cnt(s, 'S') === 4));
  check('301 d none green', seq(4, B(0.6), (s) => cnt(s, 'S') === 0), 0.0256);
  check('301 d at least one', seq(4, B(0.6), (s) => cnt(s, 'S') >= 1), 0.9744);
  check('301 d single light', seq(1, B(0.6), (s) => s[0] === 'S'), 0.6);
}
{ // 302 rain on exactly one of 4 days
  checkLive('302', 'pr-x-ber-302', seq(4, B(0.3), (s) => cnt(s, 'S') === 1));
  check('302 w one path', seq(4, B(0.3), (s) => s.join('') === 'SFFF'), 0.1029);
  check('302 w roles swapped', seq(4, B(0.3), (s) => cnt(s, 'F') === 1), 0.0756);
}
{ // 303 exactly 2 of 4 scratch cards win
  checkLive('303', 'pr-x-ber-303', seq(4, B(1 / 4), (s) => cnt(s, 'S') === 2));
  check('303 w one path', seq(4, B(1 / 4), (s) => s.join('') === 'SSFF'), 9 / 256);
  check('303 w p=1/2', seq(4, B(1 / 2), (s) => cnt(s, 'S') === 2), 3 / 8);
}
{ // 304 not all three flights on time
  checkLive('304', 'pr-x-ber-304', seq(3, B(0.9), (s) => cnt(s, 'S') < 3));
  check('304 d all', seq(3, B(0.9), (s) => cnt(s, 'S') === 3), 0.729);
  check('304 d none', seq(3, B(0.9), (s) => cnt(s, 'S') === 0), 0.001);
  check('304 d exactly one late', seq(3, B(0.9), (s) => cnt(s, 'F') === 1), 0.243);
}
{ // 305 expression MCQ
  reviewedByHand('pr-x-ber-305', 'option 0 is C(5,2)·0.35²·0.65³; each distractor drops or swaps exactly the component its note names');
  check('305 option 0 value = enumeration', 10 * 0.35 ** 2 * 0.65 ** 3, seq(5, B(0.35), (s) => cnt(s, 'S') === 2));
  check('305 d no coefficient = one path', 0.35 ** 2 * 0.65 ** 3, seq(5, B(0.35), (s) => s.join('') === 'SSFFF'));
}
{ // 306 exactly one of 4 eggs fails to hatch
  checkLive('306', 'pr-x-ber-306', seq(4, B(0.6), (s) => cnt(s, 'F') === 1));
  check('306 w exactly one hatches', seq(4, B(0.6), (s) => cnt(s, 'S') === 1), 0.1536);
  check('306 w one path', seq(4, B(0.6), (s) => s.join('') === 'SSSF'), 0.0864);
}
{ // 307 no phone of 3 needs a battery
  checkLive('307', 'pr-x-ber-307', seq(3, B(0.2), (s) => cnt(s, 'S') === 0));
  check('307 w all need', seq(3, B(0.2), (s) => cnt(s, 'S') === 3), 0.008);
  check('307 w at least one', seq(3, B(0.2), (s) => cnt(s, 'S') >= 1), 0.488);
}
{ // 308 more than two of 3 dishes right
  checkLive('308', 'pr-x-ber-308', seq(3, B(0.7), (s) => cnt(s, 'S') > 2));
  check('308 w at least two', seq(3, B(0.7), (s) => cnt(s, 'S') >= 2), 0.784);
  check('308 w exactly two', seq(3, B(0.7), (s) => cnt(s, 'S') === 2), 0.441);
  check('308 w none', seq(3, B(0.7), (s) => cnt(s, 'S') === 0), 0.027);
}
{ // 309 p from P(all 3 pass) = 0.216
  checkLive('309', 'pr-x-ber-309', solve((p) => seq(3, B(p), (s) => cnt(s, 'S') === 3), 0.216));
  check('309 w divided by 3', 0.216 / 3, 0.072);
}
{ // 310 exactly 2 of 3 books late
  checkLive('310', 'pr-x-ber-310', seq(3, B(0.2), (s) => cnt(s, 'S') === 2));
  check('310 d path', seq(3, B(0.2), (s) => s.join('') === 'SSF'), 0.032);
  check('310 d swapped', seq(3, B(0.2), (s) => cnt(s, 'F') === 2), 0.384);
  check('310 d at least 2', seq(3, B(0.2), (s) => cnt(s, 'S') >= 2), 0.104);
}
{ // 311 fewer than two of 4 flagged
  checkLive('311', 'pr-x-ber-311', seq(4, B(0.1), (s) => cnt(s, 'S') < 2));
  check('311 w none', seq(4, B(0.1), (s) => cnt(s, 'S') === 0), 0.6561);
  check('311 w at most 2', seq(4, B(0.1), (s) => cnt(s, 'S') <= 2), 0.9963);
  check('311 w exactly 1', seq(4, B(0.1), (s) => cnt(s, 'S') === 1), 0.2916);
}
{ // 312 parking on exactly 2 of 6 days
  checkLive('312', 'pr-x-ber-312', seq(6, B(0.5), (s) => cnt(s, 'S') === 2));
  check('312 d path', seq(6, B(0.5), (s) => s.join('') === 'SSFFFF'), 1 / 64);
  check('312 d ratio 2/6', 2 / 6, 1 / 3);
  check('312 d 6 paths', 6 * seq(6, B(0.5), (s) => s.join('') === 'SSFFFF'), 3 / 32);
}
{ // 313 exactly one of 3 gets side effects (90% do not)
  const p = 1 - 0.9;
  checkLive('313', 'pr-x-ber-313', seq(3, B(p), (s) => cnt(s, 'S') === 1));
  check('313 w p=0.9', seq(3, B(0.9), (s) => cnt(s, 'S') === 1), 0.027);
  check('313 w path', seq(3, B(p), (s) => s.join('') === 'SFF'), 0.081);
}
{ // 314 compare P(all 3) vs P(exactly 1)
  const all = seq(3, B(0.6), (s) => cnt(s, 'S') === 3), one = seq(3, B(0.6), (s) => cnt(s, 'S') === 1);
  reviewedByHand('pr-x-ber-314', 'option 0 says exactly one (0.288) beats all three (0.216); verified by enumeration below');
  check('314 all', all, 0.216); check('314 one', one, 0.288); check('314 one > all', one > all ? 1 : 0, 1);
  check('314 d path', seq(3, B(0.6), (s) => s.join('') === 'SFF'), 0.096);
  check('314 d exactly two', seq(3, B(0.6), (s) => cnt(s, 'S') === 2), 0.432);
}

// ============================ practice · mid ============================
{ // 315 n from P(no engine fails) = 0.6561, then P(exactly one fails)
  const n = solve((k) => seq(k, B(0.1), (s) => cnt(s, 'S') === 0), 0.6561, () => true, ints(1, 10));
  checkLive('315', 'pr-x-ber-315', [n, seq(n, B(0.1), (s) => cnt(s, 'S') === 1)]);
  check('315 w path', seq(n, B(0.1), (s) => s.join('') === 'SFFF'), 0.0729);
  check('315 w roles', seq(n, B(0.1), (s) => cnt(s, 'F') === 1), 0.0036);
  check('315 w at least one', seq(n, B(0.1), (s) => cnt(s, 'S') >= 1), 0.3439);
}
{ // 316 p > 0.5 from P(exactly one of 2 sharp) = 0.48
  const f = (p: number) => seq(2, B(p), (s) => cnt(s, 'S') === 1);
  checkLive('316', 'pr-x-ber-316', solve(f, 0.48, (p) => p > 0.5));
  check('316 w other root', solve(f, 0.48, (p) => p < 0.5), 0.4);
  check('316 w p(1-p)', 0.6 * 0.4, 0.24);
}
{ // 317 mango exported = passes size AND look; exactly 2 of 3
  const pe = seqD([[['P', 0.6], ['X', 0.4]], [['P', 0.5], ['X', 0.5]]], (s) => s[0] === 'P' && s[1] === 'P');
  checkLive('317', 'pr-x-ber-317', seq(3, B(pe), (s) => cnt(s, 'S') === 2));
  check('317 d path', seq(3, B(pe), (s) => s.join('') === 'SSF'), 0.063);
  check('317 d p=0.7', seq(3, B(1 - pe), (s) => cnt(s, 'S') === 2), 0.441);
  check('317 d size only', seq(3, B(0.6), (s) => cnt(s, 'S') === 2), 0.432);
}
{ // 318 cinema: 10000 viewers; voucher = adult not buying popcorn
  const child = 3000, pop = 4500, childPop = 1500;
  const adultNoPop = 10000 - child - pop + childPop;
  const p = adultNoPop / 10000;
  checkLive('318', 'pr-x-ber-318', seq(3, B(p), (s) => cnt(s, 'S') === 2));
  check('318 w adults row', seq(3, B((10000 - child) / 10000), (s) => cnt(s, 'S') === 2), 0.441);
  check('318 w path', seq(3, B(p), (s) => s.join('') === 'SSF'), 0.096);
  check('318 w no-popcorn column', seq(3, B((10000 - pop) / 10000), (s) => cnt(s, 'S') === 2), 0.408375);
}
{ // 319 three companies 0.5/0.4/0.2, exactly one acceptance
  const d = [B(0.5), B(0.4), B(0.2)];
  checkLive('319', 'pr-x-ber-319', seqD(d, (s) => cnt(s, 'S') === 1));
  check('319 w only A path', seqD(d, (s) => s.join('') === 'SFF'), 0.24);
  check('319 w at least one', seqD(d, (s) => cnt(s, 'S') >= 1), 0.76);
}
{ // 320 first fish on 3rd cast vs exactly one fish
  const first3 = seq(3, B(0.2), (s) => s.join('') === 'FFS'), one = seq(3, B(0.2), (s) => cnt(s, 'S') === 1);
  checkLive('320', 'pr-x-ber-320', [first3, one]);
  check('320 ratio 3', one / first3, 3);
  check('320 w only third cast', seq(1, B(0.2), (s) => s[0] === 'S'), 0.2);
}
{ // 321 longest chain with P(all pass) ≥ 0.5
  const ok = ints(1, 12).filter((n) => seq(n, B(0.9), (s) => cnt(s, 'S') === n) >= 0.5);
  checkLive('321', 'pr-x-ber-321', Math.max(...ok));
  check('321 w 7 fails', seq(7, B(0.9), (s) => cnt(s, 'S') === 7) < 0.5 ? 1 : 0, 1);
  check('321 w log solution', Math.log(0.5) / Math.log(0.9), 6.58, 5e-3);
}
{ // 322 springs decision (text MCQ)
  const atLeast = seq(3, B(0.5), (s) => cnt(s, 'S') >= 1);
  reviewedByHand('pr-x-ber-322', 'option 0: P(water in at least one of 3) = 0.875 < 0.9, so they do not go; enumeration below');
  check('322 at least one', atLeast, 0.875);
  check('322 d sum', 3 * 0.5, 1.5);
  check('322 d all', seq(3, B(0.5), (s) => cnt(s, 'S') === 3), 0.125);
  check('322 d exactly one', seq(3, B(0.5), (s) => cnt(s, 'S') === 1), 0.375);
}
{ // 323 bus late 1/4: exactly 3 of 4 late; and Sunday among them
  const e3 = seq(4, B(1 / 4), (s) => cnt(s, 'S') === 3);
  const sun = seq(4, B(1 / 4), (s) => cnt(s, 'S') === 3 && s[0] === 'S');
  checkLive('323', 'pr-x-ber-323', [e3, sun]);
  check('323 w path', seq(4, B(1 / 4), (s) => s.join('') === 'SSSF'), 3 / 256);
  check('323 w only Mon-Wed', seq(3, B(1 / 4), (s) => cnt(s, 'S') === 2), 9 / 64);
}

// ============================ practice · hard ============================
{ // 324 club: women 40%, swimmers 30%, men-swim = 2 × women-swim (percent grid)
  const ws = solve((x) => x + 2 * x, 0.3, () => true, ints(0, 40).map((k) => k / 100));
  const womenNoSwim = 0.4 - ws;
  checkLive('324', 'pr-x-ber-324', seq(4, B(womenNoSwim), (s) => cnt(s, 'S') === 2));
  check('324 w women row', seq(4, B(0.4), (s) => cnt(s, 'S') === 2), 0.3456);
  check('324 w swapped ratio', seq(4, B(0.4 - 2 * ws), (s) => cnt(s, 'S') === 2), 0.1536);
  check('324 w path', seq(4, B(womenNoSwim), (s) => s.join('') === 'SSFF'), 0.0441);
}
{ // 325 smallest n with P(exactly 1) > P(none), then P(≥2)
  const n = Math.min(...ints(1, 12).filter((k) => seq(k, B(1 / 4), (s) => cnt(s, 'S') === 1) > seq(k, B(1 / 4), (s) => cnt(s, 'S') === 0) + 1e-12));
  checkLive('325', 'pr-x-ber-325', [n, seq(n, B(1 / 4), (s) => cnt(s, 'S') >= 2)]);
  check('325 w n=3 equal', seq(3, B(1 / 4), (s) => cnt(s, 'S') === 1), seq(3, B(1 / 4), (s) => cnt(s, 'S') === 0));
  check('325 w n=3 at least 2', seq(3, B(1 / 4), (s) => cnt(s, 'S') >= 2), 5 / 32);
  check('325 w at least 1', seq(n, B(1 / 4), (s) => cnt(s, 'S') >= 1), 175 / 256);
  check('325 w exactly 2', seq(n, B(1 / 4), (s) => cnt(s, 'S') === 2), 27 / 128);
}
{ // 326 good day = ≥3 wins of 4; at least one good day of 2
  const day = seq(4, B(1 / 2), (s) => cnt(s, 'S') >= 3);
  checkLive('326', 'pr-x-ber-326', [day, seq(2, B(day), (s) => cnt(s, 'S') >= 1)]);
  check('326 w both days', seq(2, B(day), (s) => cnt(s, 'S') === 2), 25 / 256);
  const d3 = seq(4, B(1 / 2), (s) => cnt(s, 'S') === 3);
  check('326 w exactly 3', d3, 1 / 4); check('326 w exactly 3 → two days', seq(2, B(d3), (s) => cnt(s, 'S') >= 1), 7 / 16);
  check('326 w added days', 2 * day, 5 / 8);
}
{ // 327 football: W .5 (3 pts), D .3 (1 pt), L .2; 4 games
  const g: Out[] = [['W', 0.5], ['D', 0.3], ['L', 0.2]];
  const pts = (s: string[]) => 3 * cnt(s, 'W') + cnt(s, 'D');
  checkLive('327', 'pr-x-ber-327', [seq(4, g, (s) => pts(s) >= 8), seq(4, g, (s) => pts(s) === 7)]);
  check('327 w only ≥3 wins', seq(4, g, (s) => cnt(s, 'W') >= 3), 0.3125);
  check('327 w 6 arrangements', 6 * 0.5 ** 2 * 0.3 * 0.2, 0.09);
}
{ // 328 +2 per win, −1 per loss, 4 rounds
  const sc = (s: string[]) => 2 * cnt(s, 'S') - cnt(s, 'F');
  checkLive('328', 'pr-x-ber-328', [seq(4, B(0.4), (s) => sc(s) > 0), seq(4, B(0.4), (s) => sc(s) === 5)]);
  check('328 w at least one win', seq(4, B(0.4), (s) => cnt(s, 'S') >= 1), 0.8704);
  check('328 w more wins than losses', seq(4, B(0.4), (s) => cnt(s, 'S') > cnt(s, 'F')), 0.1792);
  check('328 w path', seq(4, B(0.4), (s) => s.join('') === 'SSSF'), 0.0384);
}
{ // 329 violin: dependent trials (0.6; after S 0.7; after F 0.5)
  let two = 0, atl2 = 0;
  const walk = (s: string[], w: number) => {
    if (s.length === 3) { const k = cnt(s, 'S'); if (k === 2) two += w; if (k >= 2) atl2 += w; return; }
    const p = s.length === 0 ? 0.6 : s[s.length - 1] === 'S' ? 0.7 : 0.5;
    walk([...s, 'S'], w * p); walk([...s, 'F'], w * (1 - p));
  };
  walk([], 1);
  checkLive('329', 'pr-x-ber-329', [two, atl2]);
  check('329 w Bernoulli p=.6 exactly 2', seq(3, B(0.6), (s) => cnt(s, 'S') === 2), 0.432);
  check('329 w Bernoulli p=.6 at least 2', seq(3, B(0.6), (s) => cnt(s, 'S') >= 2), 0.648);
  check('329 w SSS only', 0.6 * 0.7 * 0.7, 0.294);
  check('329 w SSF + SSS', 0.6 * 0.7 * 0.3 + 0.6 * 0.7 * 0.7, 0.42);
}
{ // 330 3 volunteers @0.5 (A) + 2 @0.6 (B)
  const d = [B(0.5), B(0.5), B(0.5), B(0.6), B(0.6)];
  const a = (s: string[]) => cnt(s.slice(0, 3), 'S'), b = (s: string[]) => cnt(s.slice(3), 'S');
  checkLive('330', 'pr-x-ber-330', [seqD(d, (s) => a(s) >= 2 && b(s) >= 1), seqD(d, (s) => a(s) === b(s))]);
  check('330 w both B', seqD(d, (s) => a(s) >= 2 && b(s) === 2), 0.18);
  check('330 w no zero-zero', seqD(d, (s) => a(s) === b(s) && a(s) > 0), 0.315);
  check('330 w exactly 2 from A', seqD(d, (s) => a(s) === 2 && b(s) >= 1), 0.315);
}
{ // 331 driving test until pass (0.4): pass on 3rd or 4th; at most 3 attempts
  const passed = (s: string[]) => s[s.length - 1] === 'S';
  checkLive('331', 'pr-x-ber-331', [
    stopped(B(0.4), passed, 6, (s, done) => done && (s.length === 3 || s.length === 4)),
    stopped(B(0.4), passed, 6, (s, done) => done && s.length <= 3),
  ]);
  check('331 w only 3rd', stopped(B(0.4), passed, 6, (s, done) => done && s.length === 3), 0.144);
  check('331 w fail first two', seq(2, B(0.4), (s) => cnt(s, 'F') === 2), 0.36);
  check('331 w complement itself', seq(3, B(0.4), (s) => cnt(s, 'F') === 3), 0.216);
}
{ // 332 delivery ok = on time, or late AND customer home; 4 deliveries
  const ok = seqD([[['T', 0.6], ['L', 0.4]], [['H', 0.5], ['N', 0.5]]], (s) => s[0] === 'T' || s[1] === 'H');
  const fail = 1 - ok;
  checkLive('332', 'pr-x-ber-332', [seq(4, B(fail), (s) => cnt(s, 'S') >= 1), seq(4, B(fail), (s) => cnt(s, 'S') <= 2)]);
  check('332 w late = fail ≥1', seq(4, B(0.4), (s) => cnt(s, 'S') >= 1), 0.8704);
  check('332 w late = fail ≤2', seq(4, B(0.4), (s) => cnt(s, 'S') <= 2), 0.8208);
  check('332 w none fail', seq(4, B(fail), (s) => cnt(s, 'S') === 0), 0.4096);
  check('332 w complement itself', seq(4, B(fail), (s) => cnt(s, 'S') >= 3), 0.0272);
}
{ // 333 alert if two consecutive failed builds in 4 nights
  const alert = (s: string[]) => s.some((x, i) => i > 0 && x === 'S' && s[i - 1] === 'S');
  checkLive('333', 'pr-x-ber-333', [seq(4, B(0.2), alert), seq(4, B(0.2), (s) => cnt(s, 'S') === 2 && alert(s))]);
  check('333 w at least 2', seq(4, B(0.2), (s) => cnt(s, 'S') >= 2), 0.1808);
  check('333 w exactly 2', seq(4, B(0.2), (s) => cnt(s, 'S') === 2), 0.1536);
}
{ // 334 light toggled by each press (0.3), 4 people
  const on = (s: string[]) => cnt(s, 'S') % 2 === 1;
  checkLive('334', 'pr-x-ber-334', [seq(4, B(0.3), on), seq(4, B(0.3), (s) => on(s) && cnt(s, 'S') >= 2)]);
  check('334 w ≥1', seq(4, B(0.3), (s) => cnt(s, 'S') >= 1), 0.7599);
  check('334 w ≥2', seq(4, B(0.3), (s) => cnt(s, 'S') >= 2), 0.3483);
  check('334 w exactly 1', seq(4, B(0.3), (s) => cnt(s, 'S') === 1), 0.4116);
  check('334 w 3 or 4', seq(4, B(0.3), (s) => cnt(s, 'S') >= 3), 0.0837);
}
{ // 335 10-question exam, m known for sure, the rest guessed at 1/4; pass at ≥ 8 correct
  // every question is a trial: known ones succeed with probability 1
  const pass = (m: number) => seqD([...Array(m).fill(B(1)), ...Array(10 - m).fill(B(0.25))], (s) => cnt(s, 'S') >= 8);
  const minKnown = ints(0, 10).find((m) => pass(m) > 0.5)!;
  checkLive('335', 'pr-x-ber-335', [pass(6), minKnown]);
  check('335 monotone in m', ints(0, 9).every((m) => pass(m + 1) >= pass(m)) ? 1 : 0, 1);
  check('335 w at most one guess', seqD(Array(4).fill(B(0.25)), (s) => cnt(s, 'S') <= 1), 189 / 256);
  check('335 w exactly two guesses', seqD(Array(4).fill(B(0.25)), (s) => cnt(s, 'S') === 2), 27 / 128);
  check('335 w exactly one of three', seqD(Array(3).fill(B(0.25)), (s) => cnt(s, 'S') === 1), 27 / 64);
  check('335 w m=7 real', pass(7), 37 / 64);
}

// ============================ bagrut ============================
{ // 02 penalties
  const p = solve((x) => seq(4, B(x), (s) => cnt(s, 'S') === 3) - 2 * seq(4, B(x), (s) => cnt(s, 'S') === 2), 0);
  checkLive('02א', 'prob-bag-x-ber-02/א', p);
  const b = seq(5, B(p), (s) => cnt(s, 'S') >= 4);
  checkLive('02ב', 'prob-bag-x-ber-02/ב', b);
  const miss2 = (s: string[]) => cnt(s, 'F') === 2;
  // still running at maxLen 8 ⇒ at most one miss in 8 kicks ⇒ ≥7 goals: the event holds
  checkLive('02ג', 'prob-bag-x-ber-02/ג', stopped(B(p), miss2, 8, (s) => cnt(s, 'S') >= 3));
  const six = stopped(B(p), miss2, 6, (s) => s.length >= 6);
  reviewedByHand('prob-bag-x-ber-02/ד', 'P(at least 6 kicks) equals part ב: ≥6 kicks iff at most one miss in the first 5; simulated below');
  check('02ד ≥6 kicks = ב', six, b);
}
{ // 03 coin → box → two draws with replacement
  const run = (x: number): Out[] => {
    const res: Record<string, number> = {};
    for (const [box, pb] of [['A', 0.5], ['B', 0.5]] as Out[]) {
      const r = box === 'A' ? 3 / 5 : x / 5;
      for (const [c1, p1] of [['R', r], ['W', 1 - r]] as Out[]) for (const [c2, p2] of [['R', r], ['W', 1 - r]] as Out[]) {
        const k = c1 === 'R' && c2 === 'R' ? 'RR' : c1 === 'W' && c2 === 'W' ? 'WW' : 'RW';
        res[k] = (res[k] ?? 0) + pb * p1 * p2;
      }
    }
    return Object.entries(res);
  };
  const pr = (x: number, k: string) => run(x).find(([o]) => o === k)?.[1] ?? 0;
  const x = solve((v) => pr(v, 'RR'), 0.2, () => true, ints(0, 5));
  checkLive('03א', 'prob-bag-x-ber-03/א', x);
  checkLive('03ב', 'prob-bag-x-ber-03/ב', pr(x, 'RW'));
  checkLive('03ג', 'prob-bag-x-ber-03/ג', seq(5, run(x), (s) => cnt(s, 'RR') >= 2));
  checkLive('03ד', 'prob-bag-x-ber-03/ד', seq(5, run(x), (s) => cnt(s, 'RR') === 2 && cnt(s, 'RW') === 3));
}
{ // 04 museum: subscription 0.5, sub&tour 0.3, no-sub&no-tour 0.3 (whole population); p = P(tour)
  // population of 10 equally likely visitor types built from the stated cells, p read off it
  const pop = [...Array(3).fill('ST'), ...Array(5 - 3).fill('Sx'), ...Array(3).fill('xx')]; // 5 of 10 subscribe
  while (pop.length < 10) pop.push('xT'); // the rest of the population is the one missing cell
  check('04 subscription margin', pop.filter((o) => o[0] === 'S').length / 10, 0.5);
  const share = (o: string) => pop.filter((x) => x === o).length / 10;
  const p = share('ST') + share('xT');
  const cells: Out[] = [['ST', share('ST')], ['Sx', share('Sx')], ['xT', share('xT')], ['xx', share('xx')]];
  checkLive('04א', 'prob-bag-x-ber-04/א', [p, cells[2][1]]);
  const orP = cells.filter(([o]) => o !== 'xx').reduce((a, [, v]) => a + v, 0);
  checkLive('04ב', 'prob-bag-x-ber-04/ב', seq(4, B(orP), (s) => cnt(s, 'S') >= 3));
  const v = cells[2][1];
  checkLive('04ג', 'prob-bag-x-ber-04/ג', seq(4, B(v), (s) => cnt(s, 'S') <= 1));
  checkLive('04ד', 'prob-bag-x-ber-04/ד', seq(4, cells, (s) => (s[0] === 'ST' || s[0] === 'Sx') && cnt(s, 'xT') === 2));
}
{ // 05 tasks worth 1..5 points
  const p = solve((x) => seq(5, B(x), (s) => cnt(s, 'S') === 3) - 1.5 * seq(5, B(x), (s) => cnt(s, 'S') === 2), 0);
  checkLive('05א', 'prob-bag-x-ber-05/א', p);
  const pts = (s: string[]) => s.reduce((a, o, i) => a + (o === 'S' ? i + 1 : 0), 0);
  const pass12 = seq(5, B(p), (s) => pts(s) >= 12);
  checkLive('05ב', 'prob-bag-x-ber-05/ב', pass12);
  checkLive('05ג', 'prob-bag-x-ber-05/ג', seq(5, B(p), (s) => pts(s) === 8));
  const pass4 = seq(5, B(p), (s) => cnt(s, 'S') >= 4);
  reviewedByHand('prob-bag-x-ber-05/ד', 'new rule (≥4 tasks) 0.33696 beats ≥12 points 0.26784; enumerated below');
  check('05ד ≥4 tasks', pass4, 0.33696); check('05ד new rule larger', pass4 > pass12 ? 1 : 0, 1);
}
{ // 06 birds: stop once both sexes caught
  const both = (s: string[]) => cnt(s, 'S') >= 1 && cnt(s, 'F') >= 1;
  const len = (p: number, n: number) => stopped(B(p), both, n + 1, (s, done) => done && s.length === n);
  const p = solve((x) => len(x, 3), 0.24, (x) => x > 0.5);
  checkLive('06א', 'prob-bag-x-ber-06/א', p);
  checkLive('06ב', 'prob-bag-x-ber-06/ב', len(p, 5));
  checkLive('06ג', 'prob-bag-x-ber-06/ג', stopped(B(p), both, 5, (s) => s.length >= 5));
  checkLive('06ד', 'prob-bag-x-ber-06/ד', seq(6, B(p), (s) => cnt(s, 'S') >= 2 && cnt(s, 'F') >= 2));
}
{ // 07 radio contact until success
  const hit = (s: string[]) => s[s.length - 1] === 'S';
  const at = (p: number, n: number) => stopped(B(p), hit, 8, (s, done) => done && s.length === n);
  const p = solve((x) => at(x, 1) - at(x, 2), 0.09);
  checkLive('07א', 'prob-bag-x-ber-07/א', p);
  checkLive('07ב', 'prob-bag-x-ber-07/ב', at(p, 4));
  // two evenings, no cap: total attempts = 3
  const ev: Out[] = ints(1, 4).map((n) => [String(n), at(p, n)]);
  checkLive('07ג', 'prob-bag-x-ber-07/ג', seq(2, ev, (s) => +s[0] + +s[1] === 3));
  // cap 3: stop on contact or after the 3rd attempt
  const cap: Out[] = ints(1, 3).map((n) => [String(n), stopped(B(p), (s) => hit(s) || s.length === 3, 3, (s) => s.length === n)]);
  check('07ד cap distribution sums to 1', cap.reduce((a, [, v]) => a + v, 0), 1);
  checkLive('07ד', 'prob-bag-x-ber-07/ד', seq(2, cap, (s) => +s[0] + +s[1] === 4));
}
{ // 08 3 lemons @0.8 + 2 olives @p
  const d = (p: number) => [B(0.8), B(0.8), B(0.8), B(p), B(p)];
  const p = solve((x) => seqD(d(x), (s) => cnt(s, 'F') === 1), 0.352);
  checkLive('08א', 'prob-bag-x-ber-08/א', p);
  checkLive('08ב', 'prob-bag-x-ber-08/ב', seqD(d(p), (s) => cnt(s, 'S') >= 4));
  checkLive('08ג', 'prob-bag-x-ber-08/ג', seqD(d(p), (s) => cnt(s, 'S') === 3));
  checkLive('08ד', 'prob-bag-x-ber-08/ד', seqD(d(p), (s) => cnt(s.slice(3), 'S') > cnt(s.slice(0, 3), 'S')));
  check('08ב note: one Bernoulli @0.8', seq(5, B(0.8), (s) => cnt(s, 'S') >= 4), 0.73728);
}
{ // 09 water samples
  const state = (p: number): Out[] => [['C', p], ['K', 1 - p]];
  const test = (st: string): Out[] => (st === 'C' ? [['+', 0.8], ['-', 0.2]] : [['+', 0.3], ['-', 0.7]]);
  const one = (p: number, pred: (st: string, t: string[]) => boolean, tests: number) => {
    let tot = 0;
    for (const [st, ps] of state(p)) tot += ps * seq(tests, test(st), (t) => pred(st, t));
    return tot;
  };
  const p = solve((x) => one(x, (_, t) => t[0] === '+', 1), 0.4);
  checkLive('09א', 'prob-bag-x-ber-09/א', p);
  checkLive('09ב', 'prob-bag-x-ber-09/ב', one(p, (st, t) => (st === 'C') !== (t[0] === '+'), 1));
  checkLive('09ג', 'prob-bag-x-ber-09/ג', seq(5, B(one(p, (_, t) => t[0] === '+', 1)), (s) => cnt(s, 'S') <= 1));
  const decl = one(p, (_, t) => t[0] === '+' && t[1] === '+', 2);
  checkLive('09ד', 'prob-bag-x-ber-09/ד', decl);
  checkLive('09ה', 'prob-bag-x-ber-09/ה', seq(3, B(decl), (s) => cnt(s, 'S') === 1));
}
{ // 10 weekly lottery: win 1/3 a week, season of n weeks, P(exactly one win in a season) = 32/81
  const p = 1 / 3;
  const n = solve((m) => seq(m, B(p), (s) => cnt(s, 'S') === 1), 32 / 81, () => true, ints(1, 14));
  checkLive('10א', 'prob-bag-x-ber-10/א', n);
  checkLive('10ב', 'prob-bag-x-ber-10/ב', seq(n, B(p), (s) => cnt(s, 'S') >= 2));
  checkLive('10ג', 'prob-bag-x-ber-10/ג', seq(2 * n, B(p), (s) => cnt(s, 'S') <= 2));
  checkLive('10ד', 'prob-bag-x-ber-10/ד', seq(2 * n, B(p), (s) => cnt(s.slice(0, n), 'S') >= 1 && cnt(s.slice(n), 'S') >= 1 && cnt(s, 'S') <= 2));
}
{ // 11 bolts
  const p = solve((x) => seq(4, B(x), (s) => cnt(s, 'S') === 0), 0.4096);
  checkLive('11א', 'prob-bag-x-ber-11/א', p);
  const a = seq(4, B(p), (s) => cnt(s, 'S') === 0);
  const b = seq(6, B(p), (s) => cnt(s, 'S') <= 1);
  checkLive('11ב', 'prob-bag-x-ber-11/ב', b);
  // method C played on 5 bolts (the last 3 are only looked at after exactly one defect in the first 2)
  const c = seq(5, B(p), (s) => { const d2 = cnt(s.slice(0, 2), 'S'); return d2 === 0 || (d2 === 1 && cnt(s.slice(2), 'S') === 0); });
  checkLive('11ג', 'prob-bag-x-ber-11/ג', c);
  reviewedByHand('prob-bag-x-ber-11/ד', 'rejection 1−approval: A 0.5904 > B 0.34464 > C 0.19616, so method A; checked below');
  check('11ד A rejects most', 1 - a > 1 - b && 1 - b > 1 - c ? 1 : 0, 1);
  check('11ד A reject', 1 - a, 0.5904); check('11ד B reject', 1 - b, 0.34464); check('11ד C reject', 1 - c, 0.19616);
}
{ // 12 train: rain .25, late x on rain, .2 otherwise
  const morning = (x: number): Out[] => [['RL', 0.25 * x], ['RT', 0.25 * (1 - x)], ['NL', 0.75 * 0.2], ['NT', 0.75 * 0.8]];
  const late = (o: string) => o === 'RL' || o === 'NL';
  const x = solve((v) => seq(2, morning(v), (s) => s.some(late)), 0.51);
  checkLive('12א', 'prob-bag-x-ber-12/א', x);
  checkLive('12ב', 'prob-bag-x-ber-12/ב', seq(4, morning(x), (s) => s.filter(late).length >= 2));
  checkLive('12ג', 'prob-bag-x-ber-12/ג', seq(4, morning(x), (s) => s.filter(late).length === 2 && cnt(s, 'RL') === 2));
  checkLive('12ד', 'prob-bag-x-ber-12/ד', seq(5, morning(x), (s) => cnt(s, 'RL') >= 2));
}
{ // 13 backgammon series to 3 wins
  const over = (k: number) => (s: string[]) => cnt(s, 'S') === k || cnt(s, 'F') === k;
  const p = solve((x) => stopped(B(x), over(3), 5, (s, done) => done && s.length === 3), 0.37, (x) => x > 0.5);
  checkLive('13א', 'prob-bag-x-ber-13/א', p);
  const roy3 = stopped(B(p), over(3), 5, (s) => cnt(s, 'S') === 3);
  checkLive('13ב', 'prob-bag-x-ber-13/ב', roy3);
  checkLive('13ג', 'prob-bag-x-ber-13/ג', stopped(B(p), over(3), 5, (s, done) => done && s.length === 4));
  const gal2 = stopped(B(p), over(2), 3, (s) => cnt(s, 'F') === 2);
  reviewedByHand('prob-bag-x-ber-13/ד', 'Gal wins first-to-2 with 0.216 > 0.16308 first-to-3, so the change helps him; simulated below');
  check('13ד gal first to 2', gal2, 0.216); check('13ד gal first to 3', 1 - roy3, 0.16308);
}
{ // 14 wheel: red (3 pts) x/8, blue 1 pt
  const w = (x: number): Out[] => [['R', x / 8], ['U', 1 - x / 8]];
  const pts = (s: string[]) => 3 * cnt(s, 'R') + cnt(s, 'U');
  const x = solve((v) => seq(2, w(v), (s) => pts(s) >= 4), 39 / 64, () => true, ints(0, 8));
  checkLive('14א', 'prob-bag-x-ber-14/א', x);
  checkLive('14ב', 'prob-bag-x-ber-14/ב', seq(4, w(x), (s) => pts(s) >= 10));
  checkLive('14ג', 'prob-bag-x-ber-14/ג', seq(5, w(x), (s) => pts(s) === 11));
  checkLive('14ד', 'prob-bag-x-ber-14/ד', seq(5, w(x), (s) => pts(s.slice(0, 3)) > pts(s.slice(3))));
}
{ // 15 park survey: north p, south 0.5
  const p = solve((x) => seqD([B(x), B(x), B(0.5), B(0.5)], (s) => cnt(s, 'S') === 3), 3 / 8, (x) => x > 0.5);
  checkLive('15א', 'prob-bag-x-ber-15/א', p);
  checkLive('15ב', 'prob-bag-x-ber-15/ב', seq(6, B(p), (s) => cnt(s, 'S') > cnt(s, 'F')));
  checkLive('15ג', 'prob-bag-x-ber-15/ג', seq(6, B(p), (s) => Math.abs(cnt(s, 'S') - cnt(s, 'F')) === 2));
  checkLive('15ד', 'prob-bag-x-ber-15/ד', seq(6, B(p), (s) => cnt(s, 'S') > cnt(s, 'F') && cnt(s.slice(0, 3), 'F') > cnt(s.slice(0, 3), 'S')));
}
{ // 16 restaurant: web 60%, web & no-show 8%, phone & arrives 28% (whole population of 100 orders)
  const orders = [...Array(60 - 8).fill('WA'), ...Array(8).fill('WN'), ...Array(28).fill('PA')];
  while (orders.length < 100) orders.push('PN'); // the remaining orders are phone & no-show
  const x = orders.filter((o) => o === 'PN').length / 100;
  const q = orders.filter((o) => o[1] === 'A').length / 100; // P(arrives), used by ב–ד
  checkLive('16א', 'prob-bag-x-ber-16/א', x);
  checkLive('16ב', 'prob-bag-x-ber-16/ב', seq(6, B(q), (s) => 5 - cnt(s, 'S') >= 2));
  const ok = ints(5, 10).filter((m) => seq(m, B(q), (s) => cnt(s, 'S') > 5) <= 0.5);
  checkLive('16ג', 'prob-bag-x-ber-16/ג', Math.max(...ok));
  check('16ג monotone: 7 and 8 fail', ok.includes(7) || ok.includes(8) ? 0 : 1, 1);
  checkLive('16ד', 'prob-bag-x-ber-16/ד', seqD([...Array(6).fill(B(q)), ...Array(4).fill(B(0.5))], (s) => cnt(s, 'S') === 9));
}
{ // 17 servers: each up 0.8; service A on n servers, P(exactly one of them up) = 0.096
  const p = 0.8;
  const n = solve((m) => seq(m, B(p), (s) => cnt(s, 'S') === 1), 0.096, () => true, ints(1, 14));
  checkLive('17א', 'prob-bag-x-ber-17/א', n);
  const a = seq(n, B(p), (s) => cnt(s, 'S') >= 2), b = seq(5, B(p), (s) => cnt(s, 'S') >= 3), c = seq(2, B(p), (s) => cnt(s, 'S') >= 1);
  checkLive('17ב', 'prob-bag-x-ber-17/ב', a);
  checkLive('17ג', 'prob-bag-x-ber-17/ג', b);
  reviewedByHand('prob-bag-x-ber-17/ד', 'only service C (0.96) reaches 0.95; A 0.896 and B 0.94208 do not; enumerated below');
  check('17ד only C', a < 0.95 && b < 0.95 && c >= 0.95 ? 1 : 0, 1); check('17ד C', c, 0.96);
}
{ // 18 phones: screen .8, battery p; grades A/B/C
  const grades = (p: number): Out[] => {
    const g = (k: number) => seqD([B(0.8), B(p)], (s) => cnt(s, 'S') === k);
    return [['A', g(2)], ['B', g(1)], ['C', g(0)]];
  };
  const p = solve((x) => seqD([B(0.8), B(x)], (s) => cnt(s, 'S') >= 1), 0.95);
  const G = grades(p);
  checkLive('18א', 'prob-bag-x-ber-18/א', [p, G[0][1], G[1][1], G[2][1]]);
  checkLive('18ב', 'prob-bag-x-ber-18/ב', seq(5, G, (s) => cnt(s, 'A') >= 3));
  checkLive('18ג', 'prob-bag-x-ber-18/ג', seq(3, G, (s) => cnt(s, 'A') === 1 && cnt(s, 'B') === 1 && cnt(s, 'C') === 1));
  checkLive('18ד', 'prob-bag-x-ber-18/ד', stopped(G, (s) => s[s.length - 1] === 'C', 6, (s, done) => done && s.length === 5 && cnt(s.slice(0, 4), 'A') >= 3));
}
{ // 19 wheel gives 2 throws (x) or 3 throws; hit 0.6
  const game = (x: number, pred: (hits: number) => boolean) =>
    x * seq(2, B(0.6), (s) => pred(cnt(s, 'S'))) + (1 - x) * seq(3, B(0.6), (s) => pred(cnt(s, 'S')));
  const x = solve((v) => game(v, (h) => h === 0), 0.1216);
  checkLive('19א', 'prob-bag-x-ber-19/א', x);
  checkLive('19ב', 'prob-bag-x-ber-19/ב', game(x, (h) => h === 2));
  checkLive('19ג', 'prob-bag-x-ber-19/ג', game(x, (h) => h >= 2));
  const range = ints(0, 1000).map((k) => game(k / 1000, (h) => h === 0));
  reviewedByHand('prob-bag-x-ber-19/ד', 'P(no hit) over x in [0,1] ranges 0.064…0.16, so 0.18 is impossible; scanned below');
  check('19ד max', Math.max(...range), 0.16); check('19ד min', Math.min(...range), 0.064);
}

coverage('pr-bernoulli');
summary('pr-bernoulli r3');
