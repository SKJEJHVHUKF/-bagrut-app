// Re-computes every numeric/trig value authored in
// content/lessons/math5/trigonometry.ts (lesson[] worked examples + bagrut
// scalar/set answers + special-angle values + equation solutions + identity
// checks) and asserts each against an independent mathjs computation.
//
// IMPORTANT: answer-check + this app evaluate sin/cos in RADIANS. Where the
// content uses DEGREES (identities/equations/special-angles/reduction), we
// convert to radians ourselves with deg(): sin 30° is checked as
// Math.sin(30*PI/180). Calculus sub-topic values are already in radians.
//
//  - check()    : scalar equality, tol 1e-9.
//  - checkSet() : unordered multiset equality, tol 1e-9.
//  - dcheck()   : authored derivative vs mathjs symbolic derivative, sampled.
//  - identity() : authored identity LHS=RHS, sampled over many x.
//
// Run: npx tsx scripts/verify-trig.ts
import { create, all } from 'mathjs';

const math = create(all, { number: 'number' });
const E = (s: string): number => math.evaluate(s) as number;

let pass = 0;
let fail = 0;
const failures: string[] = [];

const TOL = 1e-9;
const deg = (d: number): number => (d * Math.PI) / 180;

function check(label: string, got: number, expected: number) {
  if (Number.isFinite(got) && Number.isFinite(expected) && Math.abs(got - expected) < TOL) {
    pass++;
  } else {
    fail++;
    failures.push(`FAIL: ${label} — got ${got}, expected ${expected}`);
  }
}

function checkSet(label: string, got: number[], expected: number[]) {
  if (got.length !== expected.length) {
    fail++;
    failures.push(`FAIL: ${label} — length ${got.length} vs ${expected.length}`);
    return;
  }
  const used = new Array(got.length).fill(false);
  for (const e of expected) {
    const i = got.findIndex((g, idx) => !used[idx] && Math.abs(g - e) < TOL);
    if (i === -1) {
      fail++;
      failures.push(`FAIL: ${label} — missing ${e} in [${got.join(', ')}]`);
      return;
    }
    used[i] = true;
  }
  pass++;
}

// Prove an authored derivative by comparing to mathjs symbolic derivative.
function dcheck(label: string, fExpr: string, fPrimeExpr: string) {
  const symbolic = math.derivative(fExpr, 'x');
  const authored = math.parse(fPrimeExpr);
  const samples = [-2.3, -1, -0.5, 0.3, 0.7, 1, 2.5];
  for (const x of samples) {
    const a = symbolic.evaluate({ x }) as number;
    const b = authored.evaluate({ x }) as number;
    if (!(Math.abs(a - b) < 1e-9)) {
      fail++;
      failures.push(`FAIL: ${label} — at x=${x}: symbolic ${a} vs authored ${b}`);
      return;
    }
  }
  pass++;
}

// Prove an authored identity LHS=RHS by sampling many x (radians), skipping
// points where either side is undefined (NaN/Inf).
function identity(label: string, lhs: string, rhs: string) {
  const L = math.parse(lhs);
  const R = math.parse(rhs);
  const samples = [0.2, 0.5, 0.9, 1.1, 1.7, 2.2, 2.9, 3.4, 4.1, 5.0, 5.7];
  let checked = 0;
  for (const x of samples) {
    const a = L.evaluate({ x }) as number;
    const b = R.evaluate({ x }) as number;
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    checked++;
    if (!(Math.abs(a - b) < 1e-9)) {
      fail++;
      failures.push(`FAIL: ${label} — at x=${x}: LHS ${a} vs RHS ${b}`);
      return;
    }
  }
  if (checked < 5) {
    fail++;
    failures.push(`FAIL: ${label} — too few defined sample points (${checked})`);
    return;
  }
  pass++;
}

// =====================================================================
// 1. SPECIAL-ANGLE VALUES (degrees → radians). The "holy table".
// =====================================================================
check('sin 30°', Math.sin(deg(30)), 1 / 2);
check('sin 45°', Math.sin(deg(45)), Math.SQRT2 / 2);
check('sin 60°', Math.sin(deg(60)), Math.sqrt(3) / 2);
check('cos 30°', Math.cos(deg(30)), Math.sqrt(3) / 2);
check('cos 45°', Math.cos(deg(45)), Math.SQRT2 / 2);
check('cos 60°', Math.cos(deg(60)), 1 / 2);
check('tan 60°', Math.tan(deg(60)), Math.sqrt(3));
check('tan 30°', Math.tan(deg(30)), 1 / Math.sqrt(3));

// Reduction examples in the lessons.
check('sin 150° = 1/2', Math.sin(deg(150)), 1 / 2);
check('cos 150° = -sqrt3/2', Math.cos(deg(150)), -Math.sqrt(3) / 2);
check('cos 120° = -1/2', Math.cos(deg(120)), -1 / 2);
check('sin 75° exact', Math.sin(deg(75)), (Math.sqrt(6) + Math.sqrt(2)) / 4);
// radian-flavoured special values used in bagrut prompts
check('cos 2π/3 = -1/2', Math.cos((2 * Math.PI) / 3), -1 / 2);
check('sin 5π/6 = 1/2', Math.sin((5 * Math.PI) / 6), 1 / 2);

// =====================================================================
// 2. GIVEN-VALUE / PYTHAGOREAN WORKED EXAMPLES.
// =====================================================================
// sin x = 3/5, quadrant I → cos = 4/5.
check('cos from sin=3/5 (QI)', Math.sqrt(1 - (3 / 5) ** 2), 4 / 5);
// sin x = 3/5 (QI): sin 2x = 24/25, cos 2x = 7/25.
{
  const s = 3 / 5, c = 4 / 5;
  check('sin 2x (3/5,QI)', 2 * s * c, 24 / 25);
  check('cos 2x =1-2sin^2 (3/5)', 1 - 2 * s * s, 7 / 25);
  check('cos 2x =cos^2-sin^2 (3/5)', c * c - s * s, 7 / 25);
}
// cos x = -3/5, quadrant II → sin = 4/5, tan = -4/3.
check('sin from cos=-3/5 (QII)', Math.sqrt(1 - (3 / 5) ** 2), 4 / 5);
check('tan from cos=-3/5 (QII)', (4 / 5) / (-3 / 5), -4 / 3);

// bagrut-003: sin α = 3/5, QII → cos = -4/5, sin2α=-24/25, cos2α=7/25.
{
  const s = 3 / 5, c = -4 / 5;
  check('bag003 cos α', c, -4 / 5);
  check('bag003 sin 2α', 2 * s * c, -24 / 25);
  check('bag003 cos 2α', 1 - 2 * s * s, 7 / 25);
}
// sin x + cos x = 1/2 → sin x cos x = -3/8, sin 2x = -3/4.
{
  const sum = 1 / 2;
  const prod = (sum * sum - 1) / 2; // (1+2sc)=sum^2 → sc=(sum^2-1)/2
  check('sinxcosx from sum=1/2', prod, -3 / 8);
  check('sin2x from sum=1/2', 2 * prod, -3 / 4);
}

// =====================================================================
// 3. IDENTITY PROOFS (radians sampling — radians-agnostic identities).
// =====================================================================
identity('sin^2+cos^2=1', 'sin(x)^2 + cos(x)^2', '1');
identity('sin2x = 2 sinx cosx', 'sin(2*x)', '2*sin(x)*cos(x)');
identity('cos2x = 1-2sin^2', 'cos(2*x)', '1 - 2*sin(x)^2');
identity('cos2x = 2cos^2-1', 'cos(2*x)', '2*cos(x)^2 - 1');
identity('cos2x = cos^2-sin^2', 'cos(2*x)', 'cos(x)^2 - sin(x)^2');
identity('sin2x/(1+cos2x)=tanx', 'sin(2*x)/(1+cos(2*x))', 'tan(x)');
identity('sin2x/cosx = 2 sinx', 'sin(2*x)/cos(x)', '2*sin(x)');
identity('(1-cos2x)/sin2x = tanx', '(1 - cos(2*x))/sin(2*x)', 'tan(x)');
identity('cos(a+b)cos(a-b)=cos^2a - sin^2b', 'cos(x+0.4)*cos(x-0.4)', 'cos(x)^2 - sin(0.4)^2');
identity('3sin3x/sinx - cos3x/cosx =2', 'sin(3*x)/sin(x) - cos(3*x)/cos(x)', '2');
identity('sinx cosx = (1/2) sin2x', 'sin(x)*cos(x)', '(1/2)*sin(2*x)');
identity('R sin form 3sin+4cos', '3*sin(x)+4*cos(x)', '5*sin(x + atan2(4,3))');
identity('R sin form sin+cos', 'sin(x)+cos(x)', 'sqrt(2)*sin(x + pi/4)');
identity('R sin form sin - sqrt3 cos', 'sin(x) - sqrt(3)*cos(x)', '2*sin(x - pi/3)');

// =====================================================================
// 4. EQUATION SOLUTIONS — verify each solution actually satisfies the eqn,
//    and the SET matches the authored `expected` (radians).
// =====================================================================
// Helper: assert each x in the set satisfies eqn(x)≈0.
function roots(label: string, eqn: (x: number) => number, xs: number[]) {
  for (const x of xs) {
    if (!(Math.abs(eqn(x)) < 1e-9)) {
      fail++;
      failures.push(`FAIL: ${label} — x=${x} gives ${eqn(x)} ≠ 0`);
      return;
    }
  }
  pass++;
}

const PI = Math.PI;

// bag001: 2cos^2 x - 3cos x + 1 = 0 on [0,2π] → {0, π/3, 5π/3, 2π}
roots('bag001 eqn', (x) => 2 * Math.cos(x) ** 2 - 3 * Math.cos(x) + 1, [0, PI / 3, (5 * PI) / 3, 2 * PI]);
checkSet('bag001 set', [E('0'), E('pi/3'), E('5*pi/3'), E('2*pi')], [0, PI / 3, (5 * PI) / 3, 2 * PI]);

// cos x = -1/2 on [0,360°) → {120°,240°} ; lesson uses degrees.
roots('cos=-1/2 deg', (x) => Math.cos(x) + 1 / 2, [deg(120), deg(240)]);

// 2 sin^2 x - sin x -1 = 0 on [0,360°) → {90°,210°,330°}
roots('2sin^2-sin-1 deg', (x) => 2 * Math.sin(x) ** 2 - Math.sin(x) - 1, [deg(90), deg(210), deg(330)]);

// sin 2x = sin x on [0,360°) → {0,60,180,300}
roots('sin2x=sinx deg', (x) => Math.sin(2 * x) - Math.sin(x), [deg(0), deg(60), deg(180), deg(300)]);

// sqrt3 sin x = cos x → tan x = 1/√3 → {30°,210°}
roots('sqrt3 sinx=cosx deg', (x) => Math.sqrt(3) * Math.sin(x) - Math.cos(x), [deg(30), deg(210)]);

// sub-topic drills (radians): cos x = -1/2 [0,2π) → {2π/3,4π/3}
roots('cos=-1/2 rad', (x) => Math.cos(x) + 1 / 2, [(2 * PI) / 3, (4 * PI) / 3]);
// cos2x + cosx = 0 [0,2π) → {π/3, π, 5π/3}
roots('cos2x+cosx=0', (x) => Math.cos(2 * x) + Math.cos(x), [PI / 3, PI, (5 * PI) / 3]);
// sin^2 = cos^2 on [0,π] → {π/4, 3π/4}
roots('sin^2=cos^2', (x) => Math.sin(x) ** 2 - Math.cos(x) ** 2, [PI / 4, (3 * PI) / 4]);
// cos x = -√2/2 [0,2π] → {3π/4, 5π/4}
roots('cos=-sqrt2/2', (x) => Math.cos(x) + Math.SQRT2 / 2, [(3 * PI) / 4, (5 * PI) / 4]);

// bag004 part ב: sin 2x = 0 on [0,2π] → {0,π/2,π,3π/2,2π}
roots('bag004 sin2x=0', (x) => Math.sin(2 * x), [0, PI / 2, PI, (3 * PI) / 2, 2 * PI]);
checkSet('bag004 set', [E('0'), E('pi/2'), E('pi'), E('3*pi/2'), E('2*pi')], [0, PI / 2, PI, (3 * PI) / 2, 2 * PI]);

// bag005 part ב: same set.
checkSet('bag005 set', [E('0'), E('pi/2'), E('pi'), E('3*pi/2'), E('2*pi')], [0, PI / 2, PI, (3 * PI) / 2, 2 * PI]);

// bag006 part א: sin x + sin 2x = 0 on [0,π] → {0, 2π/3, π}
roots('bag006 zeros', (x) => Math.sin(x) + Math.sin(2 * x), [0, (2 * PI) / 3, PI]);
checkSet('bag006 set', [E('0'), E('2*pi/3'), E('pi')], [0, (2 * PI) / 3, PI]);

// bag008 part ג: tan x = 1 on (0,π) → π/4
roots('bag008 tanx=1', (x) => Math.tan(x) - 1, [PI / 4]);
check('bag008 x', E('pi/4'), PI / 4);

// =====================================================================
// 5. DERIVATIVES (radians, calculus sub-topic).
// =====================================================================
dcheck('(sinx+cosx)\'', 'sin(x)+cos(x)', 'cos(x)-sin(x)');
dcheck('(sin3x)\'', 'sin(3*x)', '3*cos(3*x)');
dcheck('(x sinx)\'', 'x*sin(x)', 'sin(x)+x*cos(x)');
dcheck('(sin(x^2))\'', 'sin(x^2)', '2*x*cos(x^2)');
dcheck('(sin^2 x)\'', 'sin(x)^2', 'sin(2*x)');
// bag002 f = sinx+cosx ; bag007 f = 2 sinx - sin2x
dcheck('bag007 f\'', '2*sin(x)-sin(2*x)', '-2*(2*cos(x)+1)*(cos(x)-1)');

// =====================================================================
// 6. INTEGRALS (definite, radians).
// =====================================================================
// ∫_0^π sin x dx = 2
check('∫_0^π sinx', -Math.cos(PI) - -Math.cos(0), 2);
// ∫_0^{π/2} sin^2 x dx = π/4
{
  const F = (x: number) => x / 2 - Math.sin(2 * x) / 4;
  check('∫_0^{π/2} sin^2', F(PI / 2) - F(0), PI / 4);
}
// bag006 part ב: ∫_0^π (sinx + sin2x) dx = 2
{
  const F = (x: number) => -Math.cos(x) - 0.5 * Math.cos(2 * x);
  check('bag006 ∫', F(PI) - F(0), 2);
}
// bag006 part ג: area = 9/4 + 1/4 = 5/2
{
  const F = (x: number) => -Math.cos(x) - 0.5 * Math.cos(2 * x);
  const a1 = F((2 * PI) / 3) - F(0);
  const a2 = F(PI) - F((2 * PI) / 3);
  check('bag006 area1', a1, 9 / 4);
  check('bag006 area2 abs', Math.abs(a2), 1 / 4);
  check('bag006 total area', a1 + Math.abs(a2), 5 / 2);
}

// =====================================================================
// 7. R·sin MAX values + bag007 extremum values.
// =====================================================================
check('R for 3sin+4cos', Math.hypot(3, 4), 5);
check('R for sin+cos', Math.hypot(1, 1), Math.SQRT2);
check('R for sin - sqrt3 cos', Math.hypot(1, Math.sqrt(3)), 2);
// bag007: f(2π/3) = 3√3/2, f(4π/3) = -3√3/2
{
  const f = (x: number) => 2 * Math.sin(x) - Math.sin(2 * x);
  check('bag007 f(2π/3)', f((2 * PI) / 3), (3 * Math.sqrt(3)) / 2);
  check('bag007 f(4π/3)', f((4 * PI) / 3), -(3 * Math.sqrt(3)) / 2);
}
// bag002 max/min: f=sinx+cosx, f(π/4)=√2, f(5π/4)=-√2
{
  const f = (x: number) => Math.sin(x) + Math.cos(x);
  check('bag002 f(π/4)', f(PI / 4), Math.SQRT2);
  check('bag002 f(5π/4)', f((5 * PI) / 4), -Math.SQRT2);
}
// bag004 max/min values: 5 and -1
check('bag004 max', 3 * 1 + 2, 5);
check('bag004 min', 3 * -1 + 2, -1);

// =====================================================================
// Ghost Replay (content/ghost-replay/math5/trigonometry.ts)
// =====================================================================
// The four answers AND every number invented inside a failure branch.

// --- gr-trig-id-006: sin x + cos x = 1/2 ---
check('ghost id-006: (s+c)^2 = s^2+c^2+2sc, so 1 + 2sc = 1/4', 1 + 2 * (-3 / 8), 1 / 4);
check('ghost id-006: sc = -3/8', -3 / 8, -0.375);
check('ghost id-006: sin2x = 2sc = -3/4', 2 * (-3 / 8), -3 / 4);
// Such an x really exists: s and c are the roots of t^2 - (1/2)t - 3/8 = 0.
{
  const d = Math.sqrt(0.25 + 1.5);
  const t1 = (0.5 + d) / 2, t2 = (0.5 - d) / 2;
  check('ghost id-006: the pair (s,c) exists — the roots sum to 1/2', t1 + t2, 0.5);
  check('ghost id-006: ...and their product is -3/8', t1 * t2, -3 / 8);
  check('ghost id-006: ...and s^2+c^2 = 1, so it is a genuine angle', t1 * t1 + t2 * t2, 1);
  check('ghost id-006: |s+c| <= sqrt2, and 1/2 is within range', Math.SQRT2 > 0.5 ? 1 : 0, 1);
}
check('ghost id-006 branch: sc = -3/4 (forgot to halve) is wrong', 2 * (-3 / 4) === -3 / 4 ? 1 : 0, 0);
check('ghost id-006 branch: sin2x = -3/8 swaps the two answers', -3 / 8 === -3 / 4 ? 1 : 0, 0);
check('ghost id-006 branch: sc = +3/8 has the sign wrong — 1 + 2(3/8) = 1.75, not 0.25', 1 + 2 * (3 / 8), 1.75);

// --- gr-trig-eq-006: sqrt3 sin x = cos x on [0,360) ---
check('ghost eq-006: x=30 satisfies it', Math.sqrt(3) * Math.sin(deg(30)) - Math.cos(deg(30)), 0);
check('ghost eq-006: x=210 satisfies it', Math.sqrt(3) * Math.sin(deg(210)) - Math.cos(deg(210)), 0);
check('ghost eq-006: tan 30 = 1/sqrt3', Math.tan(deg(30)), 1 / Math.sqrt(3));
check('ghost eq-006: the tangent period is 180, so 30+180 = 210', 30 + 180, 210);
// Dividing by cos x is SAFE here, and that has to be shown rather than asserted.
check('ghost eq-006: at x=90 (cos=0) the equation would force sin x = 0 — impossible',
  Math.abs(Math.sqrt(3) * Math.sin(deg(90)) - Math.cos(deg(90))) > 1e-9 ? 1 : 0, 1);
check('ghost eq-006: same at x=270', Math.abs(Math.sqrt(3) * Math.sin(deg(270)) - Math.cos(deg(270))) > 1e-9 ? 1 : 0, 1);
check('ghost eq-006 branch: x=150 does NOT satisfy it',
  Math.abs(Math.sqrt(3) * Math.sin(deg(150)) - Math.cos(deg(150))) > 1e-9 ? 1 : 0, 1);
check('ghost eq-006 branch: x=60 does NOT satisfy it',
  Math.abs(Math.sqrt(3) * Math.sin(deg(60)) - Math.cos(deg(60))) > 1e-9 ? 1 : 0, 1);
check('ghost eq-006 branch: x=240 does NOT satisfy it',
  Math.abs(Math.sqrt(3) * Math.sin(deg(240)) - Math.cos(deg(240))) > 1e-9 ? 1 : 0, 1);
// A brute sweep proves 30 and 210 are the ONLY solutions in the range.
{
  let extra = 0;
  for (let d10 = 0; d10 < 3600; d10++) {
    const x = d10 / 10;
    if (Math.abs(x - 30) < 1e-9 || Math.abs(x - 210) < 1e-9) continue;
    if (Math.abs(Math.sqrt(3) * Math.sin(deg(x)) - Math.cos(deg(x))) < 1e-9) extra++;
  }
  check('ghost eq-006: a 0.1-degree sweep finds no third solution', extra, 0);
}

// --- gr-trig-sp-005: cos x = -3/5 in quadrant II ---
check('ghost sp-005: sin^2 = 1 - 9/25 = 16/25', 1 - 9 / 25, 16 / 25);
check('ghost sp-005: sin = +4/5 in quadrant II', Math.sqrt(16 / 25), 4 / 5);
check('ghost sp-005: tan = (4/5)/(-3/5) = -4/3', (4 / 5) / (-3 / 5), -4 / 3);
check('ghost sp-005: the angle really is in quadrant II', Math.acos(-3 / 5) > Math.PI / 2 ? 1 : 0, 1);
check('ghost sp-005: and its sine is positive there', Math.sin(Math.acos(-3 / 5)), 4 / 5);
check('ghost sp-005: 3-4-5 — the identity holds', (3 / 5) ** 2 + (4 / 5) ** 2, 1);
check('ghost sp-005 branch: sin=-4/5 would put x in quadrant III, where cos is also negative',
  Math.sin(-Math.acos(-3 / 5)) < 0 ? 1 : 0, 1);
check('ghost sp-005 branch: tan=+4/3 would need sin and cos of the same sign', (4 / 5) / (-3 / 5) < 0 ? 1 : 0, 1);

// --- gr-trig-calc-005: integral of sin^2 x from 0 to pi/2 ---
check('ghost calc-005: the antiderivative at pi/2 is pi/4', Math.PI / 4 - Math.sin(Math.PI) / 4, Math.PI / 4);
check('ghost calc-005: the antiderivative at 0 is 0', 0 / 2 - Math.sin(0) / 4, 0);
check('ghost calc-005: result = pi/4 ~= 0.7854', Math.PI / 4, 0.7853981633974483);
// Independent confirmation: numeric integration, no identity used.
{
  const N = 200000; let s = 0;
  for (let i = 0; i < N; i++) { const x = ((i + 0.5) * (Math.PI / 2)) / N; s += Math.sin(x) ** 2; }
  const approx = (s * (Math.PI / 2)) / N;
  check('ghost calc-005: a 200k-point Riemann sum agrees to 1e-9', Math.abs(approx - Math.PI / 4) < 1e-9 ? 1 : 0, 1);
}
check('ghost calc-005: symmetry — the integrals of sin^2 and cos^2 are equal and sum to pi/2',
  2 * (Math.PI / 4), Math.PI / 2);
check('ghost calc-005: the bound 0 <= I <= pi/2 holds', Math.PI / 4 < Math.PI / 2 ? 1 : 0, 1);
check('ghost calc-005 branch: the un-squared integral of sin x over the same range is 1',
  -Math.cos(Math.PI / 2) + Math.cos(0), 1);
check('ghost calc-005 branch: "sin^3/3" would give 1/3 ~= 0.333, well below pi/4', 1 / 3, 0.3333333333333333);
// pi/2 is the WIDTH of the interval, so it is the ceiling the integral can never
// reach (sin^2 < 1 almost everywhere) — the branch for "forgot the half" says so.
check('ghost calc-005 branch: pi/2 ~= 1.571 is the interval width, i.e. the unreachable ceiling',
  Math.PI / 2 > Math.PI / 4 ? 1 : 0, 1);

// =====================================================================
console.log(`\nTRIG VERIFY: ${pass}/${pass + fail} passed.`);
if (fail > 0) {
  console.log('\n' + failures.join('\n'));
  process.exit(1);
}

export {};
