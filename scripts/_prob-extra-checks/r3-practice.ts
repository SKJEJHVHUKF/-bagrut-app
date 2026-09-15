/**
 * r3-practice.ts — adversarial re-derivation of the pr-practice round-3 items:
 * practice pr-x-prc-301…332 and bagrut prob-bag-x-prc-02…18.
 *
 * Method: every multi-trial answer is brute-forced by WEIGHTED ENUMERATION of
 * the whole outcome space (wEnum), never by the Bernoulli formula; tables are
 * rebuilt as populations and counted; stopping processes are enumerated as
 * sequences; unknowns are found by scanning a grid until the stated condition
 * holds. Published values are read live (checkLive) — nothing is typed in.
 *
 *   npx tsx scripts/_prob-extra-checks/r3-practice.ts
 *   PLANT=pr-x-prc-305 npx tsx scripts/_prob-extra-checks/r3-practice.ts → fails on that ref only
 */
import { check, drawNoReplacement, summary } from './_lib';
import { checkLive, reviewedByHand, coverage } from './_live';

type W<T> = [T, number][];
/** weighted brute force: one weighted space per stage, independent stages */
function wEnum<T>(spaces: W<T>[], pred: (o: T[]) => boolean): number {
  let s = 0;
  const walk = (i: number, acc: T[], w: number) => {
    if (i === spaces.length) { if (pred(acc)) s += w; return; }
    for (const [v, p] of spaces[i]) walk(i + 1, [...acc, v], w * p);
  };
  walk(0, [], 1);
  return s;
}
const rep = <T>(n: number, sp: W<T>): W<T>[] => Array.from({ length: n }, () => sp);
const bern = (p: number): W<number> => [[1, p], [0, 1 - p]];
const cnt1 = (o: number[]) => o.reduce((a, b) => a + b, 0);
const near = (a: number, b: number, t = 1e-9) => Math.abs(a - b) < t;
/** first grid value lo..hi (step) satisfying pred */
function scan(lo: number, hi: number, step: number, pred: (x: number) => boolean): number {
  for (let i = Math.round(lo / step); i <= Math.round(hi / step); i++) { const x = i * step; if (pred(x)) return x; }
  return NaN;
}
const cond = <T>(sp: W<T>[], a: (o: T[]) => boolean, b: (o: T[]) => boolean) => wEnum(sp, (o) => a(o) && b(o)) / wEnum(sp, b);

// ============================ practice · easy ============================
{ // 301 — 250 members, 150 adults; 90 borrowed digital, 35 of them adults; P(child & not borrowed)
  const m = [...Array(35).fill('AD'), ...Array(150 - 35).fill('AN'), ...Array(90 - 35).fill('CD'), ...Array(100 - 55).fill('CN')];
  checkLive('301', 'pr-x-prc-301', m.filter((x) => x === 'CN').length / m.length);
  check('301 w .45', m.filter((x) => x === 'CN').length / m.filter((x) => x[0] === 'C').length, 0.45);
  check('301 w .22', m.filter((x) => x === 'CD').length / m.length, 0.22);
}
{ // 302 — two dependent lights; exactly one red
  const out: W<string> = [['GG', 0.6 * 0.8], ['GR', 0.6 * 0.2], ['RG', 0.4 * 0.3], ['RR', 0.4 * 0.7]];
  checkLive('302', 'pr-x-prc-302', wEnum([out], ([o]) => o === 'GR' || o === 'RG'));
  check('302 d .12', 0.6 * 0.2, 0.12);
  check('302 d .48 indep', wEnum(rep(2, bern(0.6)), (o) => cnt1(o) === 1), 0.48);
  check('302 d .28', wEnum([out], ([o]) => o === 'RR'), 0.28);
}
{ // 303 — 5 seedlings p=.8, exactly 3
  checkLive('303', 'pr-x-prc-303', wEnum(rep(5, bern(0.8)), (o) => cnt1(o) === 3));
  check('303 w one order', 0.8 ** 3 * 0.2 ** 2, 0.02048);
  check('303 w swapped', wEnum(rep(5, bern(0.2)), (o) => cnt1(o) === 3), 0.0512);
}
{ // 304 — evening row 84/36; P(discount | evening)
  checkLive('304', 'pr-x-prc-304', 36 / (84 + 36));
  check('304 d .18', 36 / 200, 0.18); check('304 d 9/17', 36 / (32 + 36), 9 / 17); check('304 d .6', 120 / 200, 0.6);
}
{ // 305 — channels .5/.3/.2, unresolved
  const sp: W<string> = [['T+', 0.5 * 0.8], ['T-', 0.5 * 0.2], ['C+', 0.3 * 0.7], ['C-', 0.3 * 0.3], ['E+', (1 - 0.8) * 0.5], ['E-', 0.2 * 0.5]];
  checkLive('305', 'pr-x-prc-305', wEnum([sp], ([o]) => o.endsWith('-')));
  check('305 w .71', wEnum([sp], ([o]) => o.endsWith('+')), 0.71);
  check('305 w mean', (0.2 + 0.3 + 0.5) / 3, 1 / 3);
}
{ // 306 — 10000 residents: garden 55%, parking 50%, both 35%
  const pop = [...Array(3500).fill('GP'), ...Array(2000).fill('G'), ...Array(1500).fill('P'), ...Array(3000).fill('-')];
  checkLive('306', 'pr-x-prc-306', pop.filter((x) => x === '-').length / pop.length);
  check('306 d .7', 1 - 0.3, 0.7); check('306 d .225', 0.45 * 0.5, 0.225); check('306 d .65', 1 - 0.35, 0.65);
}
{ // 307 — 4 songs p=.3, none liked
  checkLive('307', 'pr-x-prc-307', wEnum(rep(4, bern(0.3)), (o) => cnt1(o) === 0));
  check('307 d .7599', wEnum(rep(4, bern(0.3)), (o) => cnt1(o) >= 1), 0.7599);
  check('307 d .0081', wEnum(rep(4, bern(0.3)), (o) => cnt1(o) === 4), 0.0081);
  check('307 d .4116', wEnum(rep(4, bern(0.3)), (o) => cnt1(o) === 1), 0.4116);
}
{ // 308 — 1000 visitors: 400 tour, 140 of them catalogue; 60 of 600 others
  checkLive('308', 'pr-x-prc-308', 140 / 1000);
  check('308 w .35', 140 / 400, 0.35); check('308 w .2', (140 + 60) / 1000, 0.2);
}
{ // 309 — x + .25 + 2x + .15 = 1
  const x = scan(0, 1, 0.01, (v) => near(v + 0.25 + 2 * v + 0.15, 1));
  checkLive('309', 'pr-x-prc-309', [x, 2 * x + 0.15]);
  const xw = scan(0, 1, 0.01, (v) => near(2 * v + 0.4, 1));
  check('309 w .3', xw, 0.3); check('309 w .45', xw + 0.15, 0.45); check('309 w .4', 2 * x, 0.4);
}
{ // 310 — 4 patients p=.9, at least 3
  checkLive('310', 'pr-x-prc-310', wEnum(rep(4, bern(0.9)), (o) => cnt1(o) >= 3));
  check('310 w .2916', wEnum(rep(4, bern(0.9)), (o) => cnt1(o) === 3), 0.2916);
  check('310 w .6561', wEnum(rep(4, bern(0.9)), (o) => cnt1(o) === 4), 0.6561);
}
{ // 311 — seated 60%, dessert 40%, delivery&dessert 12%; seated no dessert
  const pop = [...Array(12).fill('DD'), ...Array(40 - 12).fill('SD'), ...Array(60 - 28).fill('SN'), ...Array(40 - 12).fill('DN')];
  checkLive('311', 'pr-x-prc-311', pop.filter((x) => x === 'SN').length / pop.length);
  check('311 d .28', 0.28, pop.filter((x) => x === 'SD').length / 100);
  check('311 d .36', 0.6 * 0.6, 0.36); check('311 d .48', 0.6 - 0.12, 0.48);
}
{ // 312 — 30 kids, 18 tournaments, 12 of them blitz; 3 of the 12 others
  checkLive('312', 'pr-x-prc-312', 12 / (12 + 3));
  check('312 w .4', 12 / 30, 0.4); check('312 w 2/3', 12 / 18, 2 / 3);
}
{ // 313 — 10 tickets, 3 winning, buy 2
  const urn = [...Array(3).fill('W'), ...Array(7).fill('L')];
  checkLive('313', 'pr-x-prc-313', drawNoReplacement(urn, 2, (s) => s.filter((x) => x === 'W').length === 1));
  check('313 w 7/30', drawNoReplacement(urn, 2, (s) => s[0] === 'W' && s[1] === 'L'), 7 / 30);
  check('313 w .42 repl', wEnum(rep(2, bern(0.3)), (o) => cnt1(o) === 1), 0.42);
}
{ // 314 — basement row .4 with other .24
  const cell = 0.4 - 0.24;
  checkLive('314', 'pr-x-prc-314', cell / 0.4);
  check('314 w .16', cell, 0.16); check('314 w .64', cell / 0.25, 0.64);
}
// ============================ practice · mid ============================
{ // 315 — app 65%, cold&app 30%, cold&cash 10%; 4 customers exactly 2 cold
  const hotCash = 1 - 0.65 - 0.1; const pCold = 0.3 + 0.1;
  checkLive('315', 'pr-x-prc-315', [hotCash, wEnum(rep(4, bern(pCold)), (o) => cnt1(o) === 2)]);
  check('315 w p=.3', wEnum(rep(4, bern(0.3)), (o) => cnt1(o) === 2), 0.2646);
  check('315 w one order', 0.4 ** 2 * 0.6 ** 2, 0.0576);
}
{ // 316 — independence MCQ (verbal)
  const failA = 0.4 * 0.15, fail = failA + 0.1;
  check('316 product .096', fail * 0.6, 0.096); check('316 rate in B 1/6', 0.1 / 0.6, 1 / 6);
  check('316 not independent', near(0.1, fail * 0.6) ? 1 : 0, 0);
  reviewedByHand('pr-x-prc-316', 'correct option: dependent since cell .1 != .16*.6=.096; each distractor note names a real misreading');
}
{ // 317 — spam 20%, flagged .9 / .05
  const sp: W<string> = [['S+', 0.2 * 0.9], ['S-', 0.02], ['R+', 0.8 * 0.05], ['R-', 0.8 * 0.95]];
  checkLive('317', 'pr-x-prc-317', cond([sp], ([o]) => o[0] === 'S', ([o]) => o[1] === '+'));
  check('317 d .18', wEnum([sp], ([o]) => o === 'S+'), 0.18); check('317 d .22', wEnum([sp], ([o]) => o[1] === '+'), 0.22);
}
{ // 318 — ride: inspector .6 checks .5; 3 rides exactly 2
  const one = 0.6 * 0.5;
  checkLive('318', 'pr-x-prc-318', [one, wEnum(rep(3, bern(one)), (o) => cnt1(o) === 2)]);
  check('318 w .375', wEnum(rep(3, bern(0.5)), (o) => cnt1(o) === 2), 0.375);
  check('318 w one order', one ** 2 * (1 - one), 0.063);
}
{ // 319 — kids 80/200 season pass; 4 kids at least 3
  const p = 80 / 200;
  checkLive('319', 'pr-x-prc-319', [p, wEnum(rep(4, bern(p)), (o) => cnt1(o) >= 3)]);
  check('319 w p=.2', wEnum(rep(4, bern(80 / 400)), (o) => cnt1(o) >= 3), 0.0272);
  check('319 w exactly 3', wEnum(rep(4, bern(p)), (o) => cnt1(o) === 3), 0.1536);
}
{ // 320 — 120 cars, 50 family, 36 electric, P(fam or elec)=.55
  const x = scan(0, 36, 1, (v) => near((50 + 36 - v) / 120, 0.55));
  checkLive('320', 'pr-x-prc-320', [x, (120 - 50 - 36 + x) / 120]);
  check('320 w 66', 0.55 * 120, 66); check('320 w .55', 1 - 0.45, 0.55);
}
{ // 321 — 3 mornings p=.6; P(all 3 | at least 2)
  const sp = rep(3, bern(0.6));
  checkLive('321', 'pr-x-prc-321', cond(sp, (o) => cnt1(o) === 3, (o) => cnt1(o) >= 2));
  check('321 w .216', wEnum(sp, (o) => cnt1(o) === 3), 0.216);
  check('321 w .5', wEnum(sp, (o) => cnt1(o) === 3) / wEnum(sp, (o) => cnt1(o) === 2), 0.5);
}
{ // 322 — kids 40%, morning x among kids, .7 among adults, morning total .6
  const x = scan(0, 1, 0.01, (v) => near(0.4 * v + 0.6 * 0.7, 0.6));
  const kidEve = (x: number) => (0.4 * (1 - x)) / (0.4 * (1 - x) + 0.6 * 0.3);
  checkLive('322', 'pr-x-prc-322', [x, kidEve(x)]);
  check('322 w .22', 0.4 * (1 - x), 0.22); check('322 w 8/17', kidEve(0.6), 8 / 17);
}
{ // 323 — A: lot1 .7 then lot2 .5; B: 3 spots .5 at least one
  const A = wEnum([[[1, 0.7], [0, 0.3]], [[1, 0.5], [0, 0.5]]], ([a, b]) => a === 1 || b === 1);
  const B = wEnum(rep(3, bern(0.5)), (o) => cnt1(o) >= 1);
  checkLive('323', 'pr-x-prc-323', [A, B]);
  check('323 w .35', 0.7 * 0.5, 0.35); check('323 w .375', wEnum(rep(3, bern(0.5)), (o) => cnt1(o) === 1), 0.375);
}
// ============================ practice · hard ============================
{ // 324 — private 40%; building rate 1.5p; total recycle .52
  const p = scan(0, 0.66, 0.01, (v) => near(0.4 * v + 0.6 * 1.5 * v, 0.52));
  const privNot = 0.4 * (1 - p), not = 1 - 0.52;
  checkLive('324', 'pr-x-prc-324', [p, privNot / not]);
  check('324 dependent', near(0.4 * p, 0.4 * 0.52) ? 1 : 0, 0);
  check('324 w .24', privNot, 0.24); check('324 w .4', 0.4, 0.4);
}
{ // 325 — 200: 80 morning, 26 excel; P(morning or excel)=.57; 4 people at least 2
  const y = scan(0, 120, 1, (v) => near((80 + v) / 200, 0.57));
  const p = (26 + y) / 200;
  checkLive('325', 'pr-x-prc-325', [y, wEnum(rep(4, bern(p)), (o) => cnt1(o) >= 2)]);
  check('325 w exactly 2', wEnum(rep(4, bern(p)), (o) => cnt1(o) === 2), 0.2646);
  check('325 w at most 1', wEnum(rep(4, bern(p)), (o) => cnt1(o) <= 1), 0.6517);
}
{ // 326 — mid p, final .9/.5, total .78; reverse; feasibility of .95
  const pf = (p: number) => p * 0.9 + (1 - p) * 0.5;
  const p = scan(0, 1, 0.01, (v) => near(pf(v), 0.78));
  checkLive('326', 'pr-x-prc-326', [p, (p * 0.1) / (p * 0.1 + (1 - p) * 0.5)]);
  let mx = 0; for (let i = 0; i <= 1000; i++) mx = Math.max(mx, pf(i / 1000));
  check('326 max < .95', mx < 0.95 ? 1 : 0, 1);
  check('326 w .07', p * 0.1, 0.07);
}
{ // 327 — call: answer .5, agree .6; 4 calls exactly 2; P(no answer | no consent)
  const call: W<string> = [['A+', 0.5 * 0.6], ['A-', 0.5 * 0.4], ['N', 0.5]];
  const pc = wEnum([call], ([o]) => o === 'A+');
  checkLive('327', 'pr-x-prc-327', [pc, wEnum(rep(4, call), (o) => o.filter((x) => x === 'A+').length === 2), cond([call], ([o]) => o === 'N', ([o]) => o !== 'A+')]);
  check('327 w one order', pc ** 2 * (1 - pc) ** 2, 0.0441);
}
{ // 328 — 12 singers: 6 soprano, 7 veteran (3 alto)
  const choir = [...Array(4).fill('SV'), ...Array(2).fill('SN'), ...Array(3).fill('AV'), ...Array(3).fill('AN')];
  const union = choir.filter((c) => c[0] === 'S' || c[1] === 'N').length / 12;
  const bothV = drawNoReplacement(choir, 2, (s) => s.every((c) => c[1] === 'V'));
  const bothSV = drawNoReplacement(choir, 2, (s) => s.every((c) => c === 'SV'));
  checkLive('328', 'pr-x-prc-328', [union, bothSV / bothV]);
  check('328 w 11/12', (6 + 5) / 12, 11 / 12); check('328 w 1/11', bothSV, 1 / 11);
}
{ // 329 — 1-(1-p)^3=.271; supplier A 40%, A&fail 6%; P(A or fail)
  const p = scan(0, 1, 0.001, (v) => near(wEnum(rep(3, bern(v)), (o) => cnt1(o) >= 1), 0.271, 1e-9));
  const fails = Math.round(p * 10000);
  const pop = [...Array(600).fill('AF'), ...Array(4000 - 600).fill('AO'), ...Array(fails - 600).fill('BF'), ...Array(10000 - 4000 - (fails - 600)).fill('BO')];
  checkLive('329', 'pr-x-prc-329', [p, pop.filter((x) => x[0] === 'A' || x[1] === 'F').length / pop.length]);
  check('329 w .5', 0.4 + p, 0.5); check('329 w .38', 0.34 + 0.04, 0.38);
}
{ // 330 — best of 3; P(ends after 2)=.52, p>.5; P(Ron wins); feasibility .4
  const e2 = (p: number) => wEnum(rep(2, bern(p)), (o) => o[0] === o[1]);
  const p = scan(0.51, 1, 0.01, (v) => near(e2(v), 0.52));
  const ronWins = (p: number) => wEnum(rep(3, bern(p)), (o) => o[0] + o[1] === 2 || (o[0] + o[1] === 1 && o[2] === 1));
  checkLive('330', 'pr-x-prc-330', [p, ronWins(p)]);
  let mn = 1; for (let i = 0; i <= 1000; i++) mn = Math.min(mn, e2(i / 1000));
  check('330 min ≥ .5 so .4 impossible', mn >= 0.5 - 1e-12 ? 1 : 0, 1);
  check('330 w .36', p * p, 0.36); check('330 w p=.4', ronWins(0.4), 0.352);
}
{ // 331 — 200 animals, dogs=1.5 cats; 90 pups; P(dog or pup)=.8; k adult cats join
  const c = scan(0, 200, 1, (v) => near(v + 1.5 * v, 200)); const d = 200 - c;
  const dp = d + 90 - 0.8 * 200;
  const k = scan(0, 1000, 1, (v) => near(dp / (200 + v), (d / (200 + v)) * (90 / (200 + v))));
  checkLive('331', 'pr-x-prc-331', [(90 - dp) / 90, k]);
  check('331 w .2', (90 - dp) / 200, 0.2); check('331 w 216', 200 + k, 216);
}
{ // 332 — bag 70%, seat 50%, union .85; exactly one; feasibility of neither .35
  const x = scan(0, 0.5, 0.01, (v) => near(0.7 + 0.5 - v, 0.85));
  checkLive('332', 'pr-x-prc-332', [x, 0.85 - x]);
  let mxNeither = 0; for (let i = 20; i <= 50; i++) mxNeither = Math.max(mxNeither, 1 - (0.7 + 0.5 - i / 100));
  check('332 max neither .3 < .35', mxNeither < 0.35 ? 1 : 0, 1);
  check('332 w .65', 1 - x, 0.65);
}
{ // 333 — cinema, whole population of 100 viewers: teens 40, teens&popcorn 25, adults&no-popcorn 45; two independent picks, exactly one buys
  const viewers: [string, boolean][] = [
    ...Array.from({ length: 25 }, (): [string, boolean] => ['teen', true]),
    ...Array.from({ length: 40 - 25 }, (): [string, boolean] => ['teen', false]),
    ...Array.from({ length: 45 }, (): [string, boolean] => ['adult', false]),
  ];
  while (viewers.length < 100) viewers.push(['adult', true]); // the rest are adults who buy
  const person: W<number> = viewers.map(([, buys]) => [buys ? 1 : 0, 1 / 100]);
  checkLive('333', 'pr-x-prc-333', wEnum(rep(2, person), (o) => cnt1(o) === 1));
  const buy = viewers.filter(([, b]) => b).length / 100;
  check('333 w one path', buy * (1 - buy), 0.24);
  check('333 w cell as p', wEnum(rep(2, bern(0.25)), (o) => cnt1(o) === 1), 0.375);
  check('333 w both', wEnum(rep(2, person), (o) => cnt1(o) === 2), 0.16);
}

// ============================ bagrut ============================
{ // 02 — ring .6 / .2, P(sabachi | ring)=.75
  const x = scan(0, 1, 0.01, (v) => near((0.6 * v) / (0.6 * v + 0.2 * (1 - v)), 0.75));
  checkLive('02א', 'prob-bag-x-prc-02/א', x);
  const ring = 0.6 * x + 0.2 * (1 - x);
  checkLive('02ב', 'prob-bag-x-prc-02/ב', ((1 - x) * 0.8) / (1 - ring));
  checkLive('02ג', 'prob-bag-x-prc-02/ג', wEnum(rep(3, bern(ring)), (o) => o[0] === o[1] && o[2] !== o[0]));
  checkLive('02ד', 'prob-bag-x-prc-02/ד', cond(rep(4, bern(ring)), (o) => cnt1(o) === 2, (o) => cnt1(o) >= 2));
}
{ // 03 — driving test up to 3 tries; fail-all .09
  const p = scan(0, 1, 0.01, (v) => near((1 - v) * 0.5 * 0.6, 0.09));
  checkLive('03א', 'prob-bag-x-prc-03/א', p);
  const st: W<[number, boolean]> = [[[1, true], p], [[2, true], (1 - p) * 0.5], [[3, true], (1 - p) * 0.5 * 0.4], [[3, false], (1 - p) * 0.5 * 0.6]];
  checkLive('03ב', 'prob-bag-x-prc-03/ב', cond([st], ([s]) => s[0] === 1, ([s]) => s[1]));
  checkLive('03ג', 'prob-bag-x-prc-03/ג', wEnum([st, st], ([a, b]) => a[0] + b[0] === 4));
  checkLive('03ד', 'prob-bag-x-prc-03/ד', cond([st, st], ([a, b]) => a[1] && b[1], ([a, b]) => a[0] + b[0] === 4));
  const p3 = wEnum([st], ([s]) => s[0] === 3);
  const n = scan(1, 50, 1, (k) => wEnum(rep(k, [[1, p3], [0, 1 - p3]] as W<number>), (o) => cnt1(o) >= 1) > 0.5);
  checkLive('03ה', 'prob-bag-x-prc-03/ה', n);
}
{ // 04 — clothes 60% return .1, shoes p; P(clothes or returned)=.74
  const p = scan(0, 1, 0.01, (v) => near(0.6 + 0.4 * v, 0.74));
  checkLive('04א', 'prob-bag-x-prc-04/א', p);
  const sh = 0.4 * p, cl = 0.06;
  checkLive('04ב', 'prob-bag-x-prc-04/ב', sh / (sh + cl));
  checkLive('04ג', 'prob-bag-x-prc-04/ג', wEnum(rep(3, bern(sh / (sh + cl))), (o) => cnt1(o) >= 2));
  const fee: W<number> = [[20, sh], [10, cl], [0, 1 - sh - cl]];
  checkLive('04ד', 'prob-bag-x-prc-04/ד', wEnum([fee, fee], (o) => cnt1(o) === 20));
}
{ // 05 — archer: P(2 of 3)=2·P(3 of 3)
  const p = scan(0.01, 1, 0.01, (v) => near(wEnum(rep(3, bern(v)), (o) => cnt1(o) === 2), 2 * wEnum(rep(3, bern(v)), (o) => cnt1(o) === 3)));
  checkLive('05א', 'prob-bag-x-prc-05/א', p);
  const arrow: W<number> = [[10, p], [3, (1 - p) * 0.75], [0, (1 - p) * 0.25]];
  checkLive('05ב', 'prob-bag-x-prc-05/ב', wEnum(rep(3, arrow), (o) => cnt1(o) === 23));
  checkLive('05ג', 'prob-bag-x-prc-05/ג', cond(rep(3, arrow), (o) => cnt1(o) === 23, (o) => cnt1(o) >= 20));
  checkLive('05ד', 'prob-bag-x-prc-05/ד', wEnum(rep(4, bern(p)), (o) => o[0] + o[1] + o[2] === 1 && o[3] === 1));
}
{ // 06 — hotel channels .6/.25/.15, cancel .4/p/.2, total .3
  const p = scan(0, 1, 0.01, (v) => near(0.6 * 0.4 + 0.25 * v + 0.15 * 0.2, 0.3));
  checkLive('06א', 'prob-bag-x-prc-06/א', p);
  checkLive('06ב', 'prob-bag-x-prc-06/ב', (0.6 * 0.6) / (0.6 * 0.6 + 0.25 * (1 - p) + 0.15 * 0.8));
  checkLive('06ג', 'prob-bag-x-prc-06/ג', wEnum(rep(4, bern(0.7)), (o) => cnt1(o) <= 3));
  const bk: W<string> = [['site', 0.24], ['other', 0.3 - 0.24], ['come', 0.7]];
  checkLive('06ד', 'prob-bag-x-prc-06/ד', cond(rep(4, bk), (o) => o.filter((x) => x === 'site').length === 2, (o) => o.filter((x) => x !== 'come').length === 2));
  let best = NaN; for (let n = 3; n <= 10; n++) if (wEnum(rep(n, bern(0.7)), (o) => cnt1(o) >= 4) < 0.3) best = n;
  checkLive('06ה', 'prob-bag-x-prc-06/ה', best);
}
{ // 07 — 16 pralines, x nut; P(at least one nut in 2, no repl)=.7
  const urn = (x: number) => [...Array(x).fill('N'), ...Array(16 - x).fill('C')];
  const x = scan(0, 16, 1, (v) => near(drawNoReplacement(urn(v), 2, (s) => s.includes('N')), 0.7));
  checkLive('07א', 'prob-bag-x-prc-07/א', x);
  const u = urn(x);
  checkLive('07ב', 'prob-bag-x-prc-07/ב', drawNoReplacement(u, 2, (s) => s.every((c) => c === 'N')) / 0.7);
  const cc = drawNoReplacement(u, 2, (s) => s.every((c) => c === 'C'));
  checkLive('07ג', 'prob-bag-x-prc-07/ג', wEnum(rep(5, bern(cc)), (o) => cnt1(o) === 2));
  checkLive('07ד', 'prob-bag-x-prc-07/ד', drawNoReplacement(u, 3, (s) => s[0] === 'C' && s[1] === 'C' && s[2] === 'N'));
  const withRepl = wEnum(rep(2, u.map((c) => [c, 1 / 16] as [string, number])), (o) => o.includes('N'));
  checkLive('07ה', 'prob-bag-x-prc-07/ה', [drawNoReplacement(u, 2, (s) => s.includes('N')), withRepl]);
}
{ // 08 — morning 25%, app 50%, morning rate = 2·evening rate r
  const r = scan(0, 1, 0.01, (v) => near(0.25 * 2 * v + 0.75 * v, 0.5));
  checkLive('08א', 'prob-bag-x-prc-08/א', r);
  const mU = 0.25 * 2 * r, eU = 0.75 * r;
  checkLive('08ב', 'prob-bag-x-prc-08/ב', (0.25 - mU) / (1 - 0.5));
  checkLive('08ג', 'prob-bag-x-prc-08/ג', wEnum(rep(4, bern(mU / 0.5)), (o) => cnt1(o) >= 1));
  check('08ד max women users .38 < .4', 0.6 * eU + mU < 0.4 ? 1 : 0, 1);
  reviewedByHand('prob-bag-x-prc-08/ד', 'women users = .6·.3 from evening + at most the .2 morning cell = .38 < .4, so impossible');
}
{ // 09 — manual .25 (.5) / scan .75 (.1); none flagged over n = .32768
  const flag = 0.25 * 0.5 + 0.75 * 0.1;
  const n = scan(1, 30, 1, (k) => near(wEnum(rep(k, bern(flag)), (o) => cnt1(o) === 0), 0.32768, 1e-9));
  checkLive('09א', 'prob-bag-x-prc-09/א', n);
  checkLive('09ב', 'prob-bag-x-prc-09/ב', (0.25 * 0.5) / (1 - flag));
  const cost = (o: number[]) => 500 * cnt1(o) + 100 * (n - cnt1(o));
  checkLive('09ג', 'prob-bag-x-prc-09/ג', wEnum(rep(n, bern(0.25)), (o) => cost(o) >= 1200));
  checkLive('09ד', 'prob-bag-x-prc-09/ד', cond(rep(n, bern(0.25)), (o) => cnt1(o) === 2, (o) => cost(o) >= 1200));
}
{ // 10 — ill 20%, sens .9, false-positive q; P(healthy | positive)=.4
  const q = scan(0, 1, 0.01, (v) => near((0.8 * v) / (0.18 + 0.8 * v), 0.4));
  checkLive('10א', 'prob-bag-x-prc-10/א', q);
  const pt = (ill: boolean): W<number> => (ill ? bern(0.9) : bern(q));
  const person: W<boolean> = [[true, 0.2], [false, 0.8]];
  const two = (pred: (ill: boolean, a: number, b: number) => boolean) => person.reduce((s, [ill, w]) => s + w * wEnum([pt(ill), pt(ill)], ([a, b]) => pred(ill, a, b)), 0);
  checkLive('10ב', 'prob-bag-x-prc-10/ב', two((ill, a) => ill && a === 0) / two((_, a) => a === 0));
  checkLive('10ג', 'prob-bag-x-prc-10/ג', two((ill, a, b) => ill && a + b === 2) / two((_, a, b) => a + b === 2));
  const A = two((ill, a) => (ill ? a === 1 : a === 0)), B = two((ill, a, b) => (ill ? a + b === 2 : a + b < 2));
  checkLive('10ד', 'prob-bag-x-prc-10/ד', [A, B]);
  const illPos = two((ill, a) => ill && a === 1) / two((_, a) => a === 1);
  checkLive('10ה', 'prob-bag-x-prc-10/ה', wEnum(rep(4, bern(illPos)), (o) => cnt1(o) >= 3));
}
{ // 11 — ulpan: evening = online; pass .9/.7/.5; total .75
  const a = scan(0, 1, 0.01, (v) => near(0.9 * v + 0.7 * (1 - v) / 2 + 0.5 * (1 - v) / 2, 0.75));
  checkLive('11א', 'prob-bag-x-prc-11/א', a);
  const failM = a * 0.1, failE = ((1 - a) / 2) * 0.3, failO = ((1 - a) / 2) * 0.5, F = failM + failE + failO;
  checkLive('11ב', 'prob-bag-x-prc-11/ב', [failM / F, failE / F, failO / F]);
  const fl: W<string> = [['M', failM / F], ['E', failE / F], ['O', failO / F]];
  checkLive('11ג', 'prob-bag-x-prc-11/ג', wEnum(rep(3, fl), (o) => new Set(o).size === 3));
  const s = scan(0, 2, 0.01, (v) => near(a * 0.9 + ((1 - a) / 2) * 0.7 + ((1 - a) / 2) * v, 0.85));
  check('11ד s ≤ 1', s <= 1 ? 1 : 0, 1);
  checkLive('11ד', 'prob-bag-x-prc-11/ד', s);
  checkLive('11ה', 'prob-bag-x-prc-11/ה', wEnum(rep(4, fl), (o) => new Set(o).size === 3)); // stop ≤ 4 ⇔ first 4 calls cover all 3
}
{ // 12 — tour 25%, independent, union .55; souvenirs .5 / .2
  const a = scan(0, 1, 0.01, (v) => near(v + 0.25 - v * 0.25, 0.55));
  checkLive('12א', 'prob-bag-x-prc-12/א', a);
  const vis: W<[boolean, boolean, boolean]> = [];
  for (const t of [true, false]) for (const g of [true, false]) for (const b of [true, false]) {
    const pt = t ? a : 1 - a, pg = g ? 0.25 : 0.75, pb = t ? 0.5 : 0.2;
    vis.push([[t, g, b], pt * pg * (b ? pb : 1 - pb)]);
  }
  const C = (f: (v: [boolean, boolean, boolean]) => boolean, g: (v: [boolean, boolean, boolean]) => boolean) => cond([vis], ([v]) => f(v), ([v]) => g(v));
  checkLive('12ב', 'prob-bag-x-prc-12/ב', C((v) => v[0] && v[1], (v) => v[2]));
  check('12ג indep among buyers', C((v) => v[0] && v[1], (v) => v[2]), C((v) => v[0], (v) => v[2]) * C((v) => v[1], (v) => v[2]));
  reviewedByHand('prob-bag-x-prc-12/ג', 'among buyers P(tourist)=5/8, P(tour)=1/4, joint 5/32 = product, so still independent');
  checkLive('12ד', 'prob-bag-x-prc-12/ד', C((v) => v[0] || v[1], (v) => !v[2]));
  checkLive('12ה', 'prob-bag-x-prc-12/ה', wEnum(rep(3, bern(C((v) => v[0], (v) => v[2]))), (o) => cnt1(o) === 1));
}
{ // 13 — radio quiz, up to 4 callers, P(ends at call 2)=.24, p>.5
  const p = scan(0.51, 1, 0.01, (v) => near((1 - v) * v, 0.24));
  checkLive('13א', 'prob-bag-x-prc-13/א', p);
  const sh: W<[number, boolean]> = [];
  for (const o of [[1], [0, 1], [0, 0, 1], [0, 0, 0, 1], [0, 0, 0, 0]]) sh.push([[o.length, o[o.length - 1] === 1], o.reduce((w, x) => w * (x ? p : 1 - p), 1)]);
  checkLive('13ב', 'prob-bag-x-prc-13/ב', cond([sh], ([s]) => !s[1], ([s]) => s[0] === 4));
  checkLive('13ג', 'prob-bag-x-prc-13/ג', wEnum(rep(3, sh), (o) => o.reduce((t, s) => t + s[0], 0) === 4));
  checkLive('13ד', 'prob-bag-x-prc-13/ד', cond(rep(3, sh), (o) => o.every((s) => s[1]), (o) => o.reduce((t, s) => t + s[0], 0) === 6));
}
{ // 14 — two pumps, exactly one works .32, p>.5; emergency .75
  const p = scan(0.51, 1, 0.01, (v) => near(wEnum(rep(2, bern(v)), (o) => cnt1(o) === 1), 0.32));
  checkLive('14א', 'prob-bag-x-prc-14/א', p);
  const sp = [bern(p), bern(p), bern(0.75)];
  const water = (o: number[]) => o[0] + o[1] >= 1 || o[2] === 1;
  checkLive('14ב', 'prob-bag-x-prc-14/ב', wEnum(sp, water));
  checkLive('14ג', 'prob-bag-x-prc-14/ג', cond(sp, (o) => o[0] + o[1] === 0, water));
  checkLive('14ד', 'prob-bag-x-prc-14/ד', [wEnum(sp, water), wEnum(rep(3, bern(p)), (o) => cnt1(o) >= 1)]);
}
{ // 15 — phones: P(at least one of 3 not fixed)=.657; screen .75 among fixed, .25 among not
  const p = scan(0, 1, 0.01, (v) => near(wEnum(rep(3, bern(v)), (o) => cnt1(o) < 3), 0.657));
  checkLive('15א', 'prob-bag-x-prc-15/א', p);
  const cell: W<string> = [['SF', p * 0.75], ['SN', (1 - p) * 0.25], ['BF', p * 0.25], ['BN', (1 - p) * 0.75]];
  checkLive('15ב', 'prob-bag-x-prc-15/ב', cond([cell], ([c]) => c[1] === 'F', ([c]) => c[0] === 'S'));
  const oneFixed = (o: string[]) => o.filter((c) => c[1] === 'F').length === 1;
  const oneScreen = (o: string[]) => o.filter((c) => c[0] === 'S').length === 1;
  checkLive('15ג', 'prob-bag-x-prc-15/ג', wEnum([cell, cell], (o) => oneFixed(o) && oneScreen(o)));
  checkLive('15ד', 'prob-bag-x-prc-15/ד', cond([cell, cell], oneScreen, oneFixed));
}
{ // 16 — 40 flats, 15 balcony; x=y (half of parking has balcony); P(balcony or parking)=.625
  let xy: number[] = [NaN, NaN];
  for (let x = 0; x <= 15; x++) for (let y = 0; y <= 25; y++) if (x === y && near((15 + y) / 40, 0.625)) xy = [x, y];
  checkLive('16א', 'prob-bag-x-prc-16/א', xy);
  const [x, y] = xy;
  const flats = [...Array(x).fill('BP'), ...Array(15 - x).fill('B-'), ...Array(y).fill('-P'), ...Array(25 - y).fill('--')];
  const noPark = flats.filter((f) => f[1] === '-');
  checkLive('16ב', 'prob-bag-x-prc-16/ב', noPark.filter((f) => f[0] === 'B').length / noPark.length);
  checkLive('16ג', 'prob-bag-x-prc-16/ג', drawNoReplacement(flats.filter((f) => f[1] === 'P'), 2, (s) => s.filter((f) => f[0] === 'B').length === 1));
  const bothP = drawNoReplacement(flats, 2, (s) => s.every((f) => f[1] === 'P'));
  checkLive('16ד', 'prob-bag-x-prc-16/ד', drawNoReplacement(flats, 2, (s) => s.every((f) => f[1] === 'P') && s.some((f) => f[0] === 'B')) / bothP);
  checkLive('16ה', 'prob-bag-x-prc-16/ה', wEnum(rep(3, flats.map((f) => [f, 1 / 40] as [string, number])), (o) => o.includes('BP')));
}
{ // 17 — hives: valley .1, mountain .6; P(mountain | infected) = P(infected | mountain)
  const m = scan(0.01, 1, 0.01, (v) => near((0.6 * v) / (0.6 * v + 0.1 * (1 - v)), 0.6));
  checkLive('17א', 'prob-bag-x-prc-17/א', m);
  checkLive('17ב', 'prob-bag-x-prc-17/ב', ((1 - m) * 0.9) / ((1 - m) * 0.9 + m * 0.4));
  checkLive('17ג', 'prob-bag-x-prc-17/ג', wEnum(rep(4, bern(0.1)), (o) => cnt1(o) >= 2));
  const sp = [bern(0.6), bern(0.1), bern(0.1), bern(0.1)];
  checkLive('17ד', 'prob-bag-x-prc-17/ד', wEnum(sp, (o) => cnt1(o) === 1));
  checkLive('17ה', 'prob-bag-x-prc-17/ה', cond(sp, (o) => o[0] === 1, (o) => cnt1(o) === 1));
}
{ // 18 — machine A: up to 3 tries p; B: .91 once; P(A within 2) = .91
  const p = scan(0, 1, 0.01, (v) => near(wEnum(rep(2, bern(v)), (o) => cnt1(o) >= 1), 0.91));
  checkLive('18א', 'prob-bag-x-prc-18/א', p);
  const seqA = rep(3, bern(p));
  const firstOk = (o: number[]) => o.indexOf(1); // -1 = gave up
  checkLive('18ב', 'prob-bag-x-prc-18/ב', cond(seqA, (o) => firstOk(o) > 0, (o) => firstOk(o) >= 0));
  const failA = wEnum(seqA, (o) => firstOk(o) === -1);
  checkLive('18ג', 'prob-bag-x-prc-18/ג', (0.7 * failA) / (0.7 * failA + 0.3 * 0.09));
  const newM = wEnum(rep(2, bern(0.8)), (o) => cnt1(o) >= 1);
  checkLive('18ד', 'prob-bag-x-prc-18/ד', [newM, 0.7 * (1 - failA) + 0.3 * newM]);
}

const cov = coverage('pr-practice');
console.log(`coverage pr-practice: ${cov.refs - cov.missing}/${cov.refs} round-3 items checked, ${cov.unbound} unbound`);
summary('pr-practice r3');
