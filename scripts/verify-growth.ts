/**
 * verify-growth.ts — numeric self-check of every value claimed in the
 * growth-decay sub-topic lessons, drills, and bagrut questions.
 *   npx tsx scripts/verify-growth.ts
 *
 * Each value the author wrote is re-derived here from first principles
 * (independent of the lesson) and compared against the literal printed in
 * the content. A passing tsc/KaTeX render does NOT catch a wrong-but-valid
 * number — only re-computation does. Tolerance 1e-9.
 */
import { create, all } from 'mathjs';
const math = create(all, { number: 'number' });
const evl = (s: string): number => math.evaluate(s) as number;

const ln = Math.log;
const exp = Math.exp;

let pass = 0;
let fail = 0;
const approx = (x: number, y: number) => Math.abs(x - y) < 1e-9;
function num(desc: string, got: number, want: number) {
  const ok = approx(got, want);
  if (ok) pass++;
  else fail++;
  console.log(`  ${ok ? '✓' : '✗ FAIL'}  ${desc}   (${got} vs ${want})`);
}

// ============================================================
// Sub-topic 1: gd-model
// ============================================================
console.log('— gd-model (lesson + drills) —');
// lesson step1: N0=100, k=0.2 (identification, no compute)
// lesson step2: N(0)=1000
num('model: N0=1000e^0', 1000 * exp(0), 1000);
// lesson step2 example: 100e^{0.2*5}=100e
num('model: N(5)=100e^{0.2*5}', 100 * exp(0.2 * 5), 100 * Math.E);
// lesson step2/3: two-point k=ln3/2 from 200->1800 in 4
num('model: e^{4k}=9 -> k=ln9/4', ln(9) / 4, ln(3) / 2);
num('model: k=ln3/2 numeric', ln(3) / 2, 0.5493061443340549);
// step3 example: N(8)=200*e^{8k}=200*3^4
num('model: N(8)=200*e^{8*ln3/2}', 200 * exp(8 * (ln(3) / 2)), 200 * 81);
num('model: N(8)=16200', 200 * 81, 16200);
// step4 example: 8:00->12:00 200->800, k=ln4/4=ln2/2
num('model: e^{4k}=4 -> k=ln4/4', ln(4) / 4, ln(2) / 2);
num('model: k=ln2/2 numeric', ln(2) / 2, 0.34657359027997264);
// drill gd-sub-model-004: N(4)=80e^2
num('model drill004: 80*e^{0.5*4}', 80 * exp(0.5 * 4), 80 * exp(2));
num('model drill004 ~591.1 (1dp)', Math.round(80 * exp(2) * 10) / 10, 591.1);
// drill gd-sub-model-005: N(2)=300, N(6)=2700 -> e^{4k}=9 -> k=ln3/2, N0=100
num('model drill005: 2700/300', 2700 / 300, 9);
num('model drill005: k=ln9/4=ln3/2', ln(9) / 4, ln(3) / 2);
num('model drill005: N0=300/e^{2k}=300/3', 300 / exp(2 * (ln(3) / 2)), 100);

// ============================================================
// Sub-topic 2: gd-time-rate
// ============================================================
console.log('— gd-time-rate (lesson + drills) —');
// lesson step0 example: 500 e^{0.3t}=1000 -> t=ln2/0.3
num('time: t=ln2/0.3', ln(2) / 0.3, 2.310490601866484);
// step1 doubling: after 1yr 1.5N0 -> k=ln1.5, double t=ln2/ln1.5
num('time: k=ln1.5 ~0.405 (3dp)', Math.round(ln(1.5) * 1000) / 1000, 0.405);
num('time: double t=ln2/ln1.5 ~1.71 (2dp)', Math.round((ln(2) / ln(1.5)) * 100) / 100, 1.71);
// step2 half-life=10 -> k=-ln2/10
num('time: k=-ln2/10', -ln(2) / 10, -0.06931471805599453);
// step3 three half-lives -> 1/8
num('time: (1/2)^3', Math.pow(1 / 2, 3), 1 / 8);
// step4: 80% after 10 -> k=ln0.8/10 ; half-life T=-10ln2/ln0.8
num('time: k=ln0.8/10', ln(0.8) / 10, -0.022314355131420976);
num('time: T=-10ln2/ln0.8', (-10 * ln(2)) / ln(0.8), 31.062837195346305);
// drill gd-sub-time-005: 500->2000 in 3 -> k=ln4/3=2ln2/3 ; reach 5000 -> t=ln10/k=3ln10/(2ln2)
num('time drill005: 2000/500', 2000 / 500, 4);
num('time drill005: k=ln4/3=2ln2/3', ln(4) / 3, (2 * ln(2)) / 3);
num('time drill005: k numeric ~0.462', (2 * ln(2)) / 3, 0.4620981203732969);
num('time drill005: t=ln10/k=3ln10/(2ln2)', ln(10) / ((2 * ln(2)) / 3), (3 * ln(10)) / (2 * ln(2)));
num('time drill005: t numeric ~4.98', (3 * ln(10)) / (2 * ln(2)), 4.982892142331043);

// ============================================================
// Sub-topic 3: gd-applications
// ============================================================
console.log('— gd-applications (lesson + drills) —');
// lesson step0 example: 2000 e^{0.05} ~2102.5
num('app: A(1)=2000e^{0.05} ~2102.5 (1dp)', Math.round(2000 * exp(0.05) * 10) / 10, 2102.5);
// step1: 5000->7500 in 6 -> r=ln1.5/6
num('app: e^{6r}=1.5 -> r=ln1.5/6', ln(1.5) / 6, 0.06757751801809762);
// step2: double t=6ln2/ln1.5
num('app: double t=6ln2/ln1.5 ~10.26 (2dp)', Math.round(((6 * ln(2)) / ln(1.5)) * 100) / 100, 10.26);
// step3 cooling: T(t)=20+80e^{kt}, T(10)=60 -> e^{10k}=1/2 -> k=-ln2/10 ; T(20)=40
num('app cooling: 40/80', 40 / 80, 0.5);
num('app cooling: k=-ln2/10', -ln(2) / 10, -0.06931471805599453);
num('app cooling: T(20)=20+80*(1/4)', 20 + 80 * Math.pow(0.5, 2), 40);
// step4 population: 5000->6000 in 3 -> e^{3r}=1.2 ; P(9)=5000*1.2^3=8640
num('app pop: 6000/5000', 6000 / 5000, 1.2);
num('app pop: P(9)=5000*1.2^3', 5000 * Math.pow(1.2, 3), 8640);
// drill gd-sub-app-001: A(25)=1000e^{0.04*25}=1000e
num('app drill001: 1000e^{0.04*25}', 1000 * exp(0.04 * 25), 1000 * Math.E);
// drill gd-sub-app-005 cooling: T=30 -> e^{kt}=1/8 -> kt=-3ln2 -> t=30
num('app drill005: 10/80', 10 / 80, 0.125);
num('app drill005: t=-3ln2/(-ln2/10)', (-3 * ln(2)) / (-ln(2) / 10), 30);

// ============================================================
// Bagrut questions (expected scalars + key step values)
// ============================================================
console.log('— bagrut gd-bag-001..004 (expected values) —');
// gd-bag-001 (existing): 8:00 200, 12:00 800 -> k=ln2/2; N(6)=1600; reach 3200 at t=8 -> 16:00
num('bag001 k=ln4/4=ln2/2', ln(4) / 4, ln(2) / 2);
num('bag001 N(6)=200*e^{6*ln2/2}=200*2^3', 200 * exp(6 * (ln(2) / 2)), 1600);
num('bag001 t: e^{kt}=16 -> t=4ln2/(ln2/2)=8', (4 * ln(2)) / (ln(2) / 2), 8);
num('bag001 expected hour 16 (8+8)', 8 + 8, 16);

// gd-bag-002 (gd-model): 200, N(4)=1800 -> N0=200, k=ln3/2 ; N(8)=16200 ; reach 5400 at t=6
num('bag002a expected log(3)/2', evl('log(3)/2'), ln(3) / 2);
num('bag002a k=ln9/4=ln3/2', ln(9) / 4, ln(3) / 2);
num('bag002b N(8)=200*3^4=16200', 200 * exp(8 * (ln(3) / 2)), 16200);
num('bag002b expected 16200', 16200, 16200);
num('bag002c e^{kt}=27=3^3 -> t=3ln3/(ln3/2)=6', (3 * ln(3)) / (ln(3) / 2), 6);
num('bag002c verify N(6)=200*3^3=5400', 200 * exp(6 * (ln(3) / 2)), 5400);

// gd-bag-003 (gd-time-rate): 80% after 10 -> k=ln0.8/10 ; half-life -10ln2/ln0.8 ; N(20)/N0=64%
num('bag003a expected log(0.8)/10', evl('log(0.8)/10'), ln(0.8) / 10);
num('bag003b expected -10log(2)/log(0.8)', evl('-10*log(2)/log(0.8)'), (-10 * ln(2)) / ln(0.8));
num('bag003b half-life ~31.06', (-10 * ln(2)) / ln(0.8), 31.062837195346305);
num('bag003c N(20)/N0=0.8^2=0.64 -> 64', 100 * Math.pow(0.8, 2), 64);
num('bag003c verify e^{20k}=0.64', exp(20 * (ln(0.8) / 10)), 0.64);

// gd-bag-004 (gd-applications): 5000->7500 in 6 -> r=ln1.5/6 ; double 6ln2/ln1.5 ; A(12)=11250
num('bag004a expected log(1.5)/6', evl('log(1.5)/6'), ln(1.5) / 6);
num('bag004b expected 6log(2)/log(1.5)', evl('6*log(2)/log(1.5)'), (6 * ln(2)) / ln(1.5));
num('bag004b double ~10.26 (2dp)', Math.round(((6 * ln(2)) / ln(1.5)) * 100) / 100, 10.26);
num('bag004c A(12)=5000*1.5^2=11250', 5000 * Math.pow(1.5, 2), 11250);
num('bag004c verify e^{12r}=2.25', exp(12 * (ln(1.5) / 6)), 2.25);

// ============================================================
// ============================================================
// Ghost Replay (content/ghost-replay/math5/growth-decay.ts)
// ============================================================
// The three answers AND every number invented inside a failure branch.

// --- gr-gd-model-005: N(2)=300, N(6)=2700 ---
{
  const k = Math.log(3) / 2;
  const N0 = 100;
  const N = (t: number) => N0 * Math.exp(k * t);
  num('ghost model-005: dividing the equations gives e^{4k} = 9', 2700 / 300, 9);
  num('ghost model-005: k = ln9/4 = ln3/2 ~= 0.5493', Math.round(k * 1e4) / 1e4, 0.5493);
  num('ghost model-005: ln9/4 equals ln3/2', Math.round((Math.log(9) / 4) * 1e12) / 1e12, Math.round(k * 1e12) / 1e12);
  num('ghost model-005: N0 = 100', Math.round(N0), 100);
  num('ghost model-005: N(2) = 300', Math.round(N(2) * 1e6) / 1e6, 300);
  num('ghost model-005: N(6) = 2700', Math.round(N(6) * 1e6) / 1e6, 2700);
  num('ghost model-005: e^{2k} = 3, so the population triples every 2 hours',
    Math.round(Math.exp(2 * k) * 1e12) / 1e12, 3);
  num('ghost model-005 branch: subtracting instead of dividing gives 2400, which is not a ratio',
    2700 - 300, 2400);
  num('ghost model-005 branch: k = ln9/6 ~= 0.3662 uses the wrong time gap',
    Math.round((Math.log(9) / 6) * 1e4) / 1e4, 0.3662);
  num('ghost model-005 branch: ...and that k gives N(2) = 300/e^{...} != 100 for N0',
    Math.round((300 / Math.exp(2 * Math.log(9) / 6)) * 1e2) / 1e2, 144.22);
  num('ghost model-005 branch: taking N0 = 300 ignores that t=2 is not the start',
    Math.round((300 * Math.exp(k * 2)) * 1e2) / 1e2, 900);
  num('ghost model-005 branch: ln(9/4) ~= 0.8109 is NOT ln(9)/4 — a notation slip, not an arithmetic one',
    Math.round(Math.log(9 / 4) * 1e4) / 1e4, 0.8109);
  num('ghost model-005 branch: dividing 300 by e^{4k} = 9 uses the gap where t=2 belongs',
    Math.round((300 / Math.exp(4 * k)) * 1e2) / 1e2, 33.33);

  // Step 4: the midpoint in TIME gives the geometric mean, never the arithmetic one.
  // This is the whole difference between exponential and linear, in one number.
  num('ghost model-005: N(4) = 900', Math.round(N(4) * 1e6) / 1e6, 900);
  num('ghost model-005: 900 is the GEOMETRIC mean of 300 and 2700',
    Math.round(Math.sqrt(300 * 2700) * 1e9) / 1e9, 900);
  num('ghost model-005 branch: the arithmetic mean is 1500, and it is wrong', (300 + 2700) / 2, 1500);
  num('ghost model-005 branch: 1500 would require a linear model, which misses N(2)',
    Math.abs(1500 - N(4)) > 1 ? 1 : 0, 1);
  // Equal time gaps multiply by equal factors — the defining property, checked at 500 random gaps.
  {
    let bad = 0;
    for (let i = 0; i < 500; i++) {
      const t = (i / 500) * 10;
      const gap = 1 + (i % 7) * 0.3;
      const ratio = N(t + gap) / N(t);
      if (Math.abs(ratio - Math.exp(k * gap)) > 1e-9) bad++;
    }
    num('ghost model-005: equal time gaps give equal ratios (500 samples)', bad, 0);
  }
}

// --- gd-sub-time-004: 80% remains after 10 years, find the half-life ---
{
  const k = Math.log(0.8) / 10;
  num('ghost time-004: k = ln(0.8)/10 ~= -0.02231', Math.round(k * 1e5) / 1e5, -0.02231);
  num('ghost time-004: k is negative, as decay requires', k < 0 ? 1 : 0, 1);
  const half = Math.log(0.5) / k;
  num('ghost time-004: half-life = 10*ln(0.5)/ln(0.8) ~= 31.06 years',
    Math.round(half * 1e2) / 1e2, 31.06);
  num('ghost time-004: check — after 31.06 years about half remains',
    Math.round(Math.exp(k * half) * 1e9) / 1e9, 0.5);
  num('ghost time-004: after 10 years exactly 0.8 remains',
    Math.round(Math.exp(k * 10) * 1e9) / 1e9, 0.8);
  num('ghost time-004 branch: 25 years is wrong — 0.8 lost per decade does NOT extrapolate linearly',
    Math.round(Math.exp(k * 25) * 1e4) / 1e4, 0.5724);
  num('ghost time-004 branch: ...at 25 years 57.2% remains, still above half',
    Math.exp(k * 25) > 0.5 ? 1 : 0, 1);
  num('ghost time-004 branch: 20 years leaves 0.64, not 0.5', Math.round(Math.exp(k * 20) * 1e4) / 1e4, 0.64);
  num('ghost time-004 branch: 0.64 is 0.8 squared — two decades, not half',
    Math.round(0.8 ** 2 * 1e9) / 1e9, 0.64);
  num('ghost time-004 branch: the linear guess "0.2 lost per decade" predicts 0.6 after 20 years',
    Math.round((1 - 2 * 0.2) * 1e9) / 1e9, 0.6);
  num('ghost time-004 branch: ...but the true value is 0.64, so linear UNDERSTATES what survives',
    Math.exp(k * 20) > 0.6 ? 1 : 0, 1);

  // Bracketing without a calculator: 0.8^3 is just above half, 0.8^4 just below.
  num('ghost time-004: 0.8^3 = 0.512 > 0.5, so the half-life is past 30 years',
    Math.round(0.8 ** 3 * 1e9) / 1e9, 0.512);
  num('ghost time-004: 0.8^4 = 0.4096 < 0.5, so it is before 40 years',
    Math.round(0.8 ** 4 * 1e9) / 1e9, 0.4096);
  num('ghost time-004: the exact half-life lands inside that bracket',
    half > 30 && half < 40 ? 1 : 0, 1);
  num('ghost time-004: the answer does not depend on N0 — it cancels (checked over 200 values)',
    (() => { let bad = 0; for (let i = 1; i <= 200; i++) { const N0 = i * 13.7; if (Math.abs(N0 * Math.exp(k * half) - N0 / 2) > 1e-6) bad++; } return bad; })(), 0);
}

// --- gd-sub-app-005: Newton cooling, 100 deg in a 20 deg room, 60 after 10 min ---
{
  // T(t) = 20 + 80 e^{kt}
  const k = Math.log(0.5) / 10;
  const T = (t: number) => 20 + 80 * Math.exp(k * t);
  num('ghost app-005: the initial DIFFERENCE is 100-20 = 80', 100 - 20, 80);
  num('ghost app-005: at t=10 the difference is 60-20 = 40, i.e. halved', 60 - 20, 40);
  num('ghost app-005: so e^{10k} = 0.5 and k = ln(0.5)/10 ~= -0.06931',
    Math.round(k * 1e5) / 1e5, -0.06931);
  num('ghost app-005: T(10) = 60', Math.round(T(10) * 1e9) / 1e9, 60);
  num('ghost app-005: T(20) = 40 — the difference halves again', Math.round(T(20) * 1e9) / 1e9, 40);
  num('ghost app-005: reaching 30 needs the difference to be 10, i.e. 1/8 of 80', 80 / 8, 10);
  num('ghost app-005: 1/8 is three halvings, so t = 30 minutes', 3 * 10, 30);
  num('ghost app-005: T(30) = 30 exactly', Math.round(T(30) * 1e9) / 1e9, 30);
  num('ghost app-005 branch: the temperature itself does NOT halve — 100 to 60 is not a halving',
    Math.abs(60 - 50) > 1e-9 ? 1 : 0, 1);
  num('ghost app-005 branch: modelling T = 100 e^{kt} would predict T(10) = 60 only with k = ln0.6/10',
    Math.round((Math.log(0.6) / 10) * 1e5) / 1e5, -0.05108);
  num('ghost app-005 branch: ...and that model reaches 30 at ~23.6 min, and 20 never — it ignores the room',
    Math.round((Math.log(0.3) / (Math.log(0.6) / 10)) * 10) / 10, 23.6);
  num('ghost app-005 branch: the body can never cool below the room, so T -> 20 as t grows',
    Math.round(T(1000) * 1e9) / 1e9, 20);

  // Step 4: 20 deg is an asymptote, not a time. T(t) > 20 for every finite t.
  // Test the DIFFERENCE, not T itself: past ~9 hours the gap drops below the
  // resolution of a double next to 20, so `T(t) > 20` reads false for a
  // floating-point reason and not a mathematical one.
  {
    let bad = 0;
    for (let i = 0; i <= 5000; i++) {
      const t = i * 2; // 0 .. 10000 minutes
      if (!(80 * Math.exp(k * t) > 0)) bad++;
    }
    num('ghost app-005: the gap above the room stays positive at all 5001 sampled times', bad, 0);
  }
  num('ghost app-005 branch: 40 minutes gives 25, not 20', Math.round(T(40) * 1e9) / 1e9, 25);
  num('ghost app-005 branch: 60 minutes gives 21.25, still not 20',
    Math.round(T(60) * 1e4) / 1e4, 21.25);
  num('ghost app-005 branch: every extra 10 minutes only halves what is left above the room',
    Math.round(((T(60) - 20) / (T(50) - 20)) * 1e9) / 1e9, 0.5);
  num('ghost app-005: the cooling is monotone — it approaches 20 from above, never crosses',
    T(100) > 20 && T(100) < T(50) ? 1 : 0, 1);
}

console.log(`\nRESULT: ${pass}/${pass + fail} passed${fail ? `  (${fail} FAILED)` : ''}`);
if (fail) process.exit(1);

export {};
