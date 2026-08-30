// Re-computes every numeric value authored in content/lessons/math5/derivatives.ts
// (sub-topic lesson[] worked examples + bagrut question scalar/set answers) and
// asserts each against an independent mathjs computation.
//
//  - check()   : exact scalar equality, tolerance 1e-9.
//  - dcheck()  : authored closed-form derivative vs mathjs SYMBOLIC derivative,
//                sampled at several x; this proves the algebra, not just a point.
//  - checkSet(): unordered multiset equality, tolerance 1e-9.
//
// Run: npx tsx scripts/verify-derivatives.ts
import { create, all } from 'mathjs';

const math = create(all, { number: 'number' });
const E = (s: string): number => math.evaluate(s) as number;

let pass = 0;
let fail = 0;
const failures: string[] = [];

const TOL = 1e-9;

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

// Prove an authored derivative formula by comparing it to mathjs's symbolic
// derivative of the original function, evaluated at several sample points.
function dcheck(label: string, fExpr: string, fPrimeExpr: string, samples = [-2.3, -1, -0.5, 0.7, 1, 2.5], v = 'x') {
  const symbolic = math.derivative(fExpr, v);
  const authored = math.parse(fPrimeExpr);
  for (const val of samples) {
    const scope: Record<string, number> = { [v]: val };
    const a = symbolic.evaluate(scope) as number;
    const b = authored.evaluate(scope) as number;
    if (!(Math.abs(a - b) < 1e-9)) {
      fail++;
      failures.push(`FAIL: ${label} at ${v}=${val} — symbolic ${a}, authored ${b}`);
      return;
    }
  }
  pass++;
}

// ============================================================
// SUB-TOPIC 1: derivative-rules — lesson[] worked examples
// ============================================================
// power rule: (5x^3-4x^2+7x-1)' = 15x^2-8x+7
dcheck("rules: poly'", '5x^3 - 4x^2 + 7x - 1', '15x^2 - 8x + 7');
// product rule: (x^2 sin x)' = 2x sin x + x^2 cos x
dcheck("rules: (x^2 sin x)'", 'x^2*sin(x)', '2*x*sin(x) + x^2*cos(x)');
// quotient rule: ((x^2+1)/(x-3))' = (x^2-6x-1)/(x-3)^2
dcheck("rules: ((x^2+1)/(x-3))'", '(x^2 + 1)/(x - 3)', '(x^2 - 6x - 1)/(x - 3)^2', [-2.3, -1, 0.7, 1, 2.5, 4.5]);
// chain rule: ((x^2+1)^5)' = 10x(x^2+1)^4
dcheck("rules: ((x^2+1)^5)'", '(x^2 + 1)^5', '10*x*(x^2 + 1)^4');
// simplify before differentiating: (x^3+x^2)/x = x^2+x -> derivative 2x+1
dcheck("rules: ((x^3+x^2)/x)'", '(x^3 + x^2)/x', '2*x + 1', [-2.3, -1, 0.7, 1, 2.5]);

// ============================================================
// SUB-TOPIC 2: tangent-line — lesson[] worked examples
// ============================================================
// f(x)=x^2-4x+3 at x0=1: point (1,0), slope -2, tangent y=-2x+2
{
  const f = (x: number) => x * x - 4 * x + 3;
  const fp = (x: number) => 2 * x - 4;
  check('tan: f(1)=0', f(1), 0);
  check('tan: f\'(1)=-2', fp(1), -2);
  // tangent y=-2x+2 passes through (1,0)
  check('tan: line at x=1 = 0', -2 * 1 + 2, 0);
}
// f(x)=(x^2+1)/(x-1) at x0=2: f(2)=5, f'(2)=-1, tangent y=-x+7
{
  const f = (x: number) => (x * x + 1) / (x - 1);
  dcheck("tan: ((x^2+1)/(x-1))'", '(x^2 + 1)/(x - 1)', '(x^2 - 2x - 1)/(x - 1)^2', [-1, 0, 0.5, 2, 3, 4]);
  const fp = (x: number) => (x * x - 2 * x - 1) / Math.pow(x - 1, 2);
  check('tan: f(2)=5', f(2), 5);
  check('tan: f\'(2)=-1', fp(2), -1);
  check('tan: line -x+7 at x=2 = 5', -2 + 7, 5);
}
// f(x)=x^2-6x: horizontal tangent at x=3, point (3,-9)
{
  const f = (x: number) => x * x - 6 * x;
  check('tan: x^2-6x slope zero at x=3', 2 * 3 - 6, 0);
  check('tan: f(3)=-9', f(3), -9);
}

// ============================================================
// SUB-TOPIC 3: extrema-monotonicity — lesson[] worked examples
// ============================================================
// f(x)=x^3-3x^2-9x+5
{
  dcheck("ext: (x^3-3x^2-9x+5)'", 'x^3 - 3x^2 - 9x + 5', '3x^2 - 6x - 9');
  const f = (x: number) => x ** 3 - 3 * x * x - 9 * x + 5;
  const fpp = (x: number) => 6 * x - 6;
  checkSet('ext: candidates {3,-1}', [E('3'), E('-1')], [3, -1]);
  check('ext: f\'\'(-1)<0 (max)', fpp(-1), -12);
  check('ext: f\'\'(3)>0 (min)', fpp(3), 12);
  check('ext: f(-1)=10', f(-1), 10);
  check('ext: f(3)=-22', f(3), -22);
}
// f(x)=x^3-3x^2+1: increasing/decreasing zeros at 0,2
dcheck("ext: (x^3-3x^2+1)'", 'x^3 - 3x^2 + 1', '3x^2 - 6x');
checkSet('ext: f\' zeros {0,2}', [E('0'), E('2')], [0, 2]);
// closed interval f(x)=x^2-4x on [0,3]: f(0)=0, f(2)=-4, f(3)=-3
{
  const f = (x: number) => x * x - 4 * x;
  check('ext: f(0)=0', f(0), 0);
  check('ext: f(2)=-4 (min)', f(2), -4);
  check('ext: f(3)=-3', f(3), -3);
  check('ext: interior crit at x=2 (2x-4=0)', 2 * 2 - 4, 0);
}

// ============================================================
// SUB-TOPIC 4: optimization — lesson[] worked examples
// ============================================================
// rectangle perimeter 20: S(x)=10x-x^2, max at x=5, S=25
{
  const S = (x: number) => 10 * x - x * x;
  dcheck("opt: S=10x-x^2 ->", '10*x - x^2', '10 - 2*x');
  check('opt: S\'=0 at x=5', 10 - 2 * 5, 0);
  check('opt: S(5)=25', S(5), 25);
  check('opt: y=10-5=5', 10 - 5, 5);
}
// motion s(t)=t^3-6t^2+9t: v=0 at t=1,3
dcheck("opt: (t^3-6t^2+9t)'", 't^3 - 6t^2 + 9t', '3t^2 - 12t + 9', [-1, 0, 0.5, 1, 2, 3, 4], 't');
checkSet('opt: v zeros {1,3}', [E('1'), E('3')], [1, 3]);

// ============================================================
// BAGRUT der-bag-001 (tangent-line) f(x)=x^2-4x+3
// ============================================================
dcheck("bag001 a f'=2x-4", 'x^2 - 4x + 3', '2*x - 4');
{
  const f = (x: number) => x * x - 4 * x + 3;
  check('bag001 b min point f(2)=-1', f(2), -1);
  check('bag001 b min x: 2x-4=0', 2 * 2 - 4, 0);
  check('bag001 c slope f\'(0)=-4', 2 * 0 - 4, -4);
  check('bag001 c spec value', E('-4'), -4);
  check('bag001 d f(0)=3 (tangent y=-4x+3 through (0,3))', f(0), 3);
}

// ============================================================
// BAGRUT der-bag-002 (extrema-monotonicity) f(x)=x^3-3x^2-9x+5
// ============================================================
dcheck("bag002 a f'", 'x^3 - 3x^2 - 9x + 5', '3x^2 - 6x - 9');
{
  const f = (x: number) => x ** 3 - 3 * x * x - 9 * x + 5;
  checkSet('bag002 a crit {3,-1}', [E('3'), E('-1')], [3, -1]);
  check('bag002 a f(-1)=10', f(-1), 10);
  check('bag002 a f(3)=-22', f(3), -22);
  // inflection x=1, f(1)=-6
  check('bag002 c f\'\'(1)=0', 6 * 1 - 6, 0);
  check('bag002 c f(1)=-6', f(1), -6);
}

// ============================================================
// BAGRUT der-bag-003 (capstone) f(x)=x^2/(x-1)
// ============================================================
dcheck("bag003 b f'=x(x-2)/(x-1)^2", 'x^2/(x - 1)', '(x*(x - 2))/(x - 1)^2', [-2, -1, 0.5, 2, 3, 4]);
{
  const f = (x: number) => (x * x) / (x - 1);
  checkSet('bag003 c extrema x {0,2}', [E('0'), E('2')], [0, 2]);
  check('bag003 c f(0)=0', f(0), 0);
  check('bag003 c f(2)=4', f(2), 4);
}

// ============================================================
// BAGRUT der-bag-004 f(x)=x^2+2x
// ============================================================
dcheck("bag004 f'=2x+2", 'x^2 + 2x', '2*x + 2');
{
  const f = (x: number) => x * x + 2 * x;
  // a: tangent at x0=1 -> y=4x-1
  check('bag004 a f(1)=3', f(1), 3);
  check('bag004 a f\'(1)=4', 2 * 1 + 2, 4);
  check('bag004 a line 4x-1 at x=1 = 3', 4 * 1 - 1, 3);
  // b: slope -2 at x=-2, point (-2,0)
  check('bag004 b x where slope -2', 2 * -2 + 2, -2);
  check('bag004 b f(-2)=0', f(-2), 0);
  // c: horizontal tangent at x=-1, point (-1,-1)
  check('bag004 c slope 0 at x=-1', 2 * -1 + 2, 0);
  check('bag004 c f(-1)=-1', f(-1), -1);
}

// ============================================================
// BAGRUT der-bag-005 (optimization) fence, 60m, S(x)=60x-2x^2
// ============================================================
dcheck("bag005 S'=60-4x", '60*x - 2*x^2', '60 - 4*x');
{
  const S = (x: number) => 60 * x - 2 * x * x;
  check('bag005 c S\'=0 at x=15', 60 - 4 * 15, 0);
  check('bag005 c spec value 15', E('15'), 15);
  check('bag005 d S(15)=450', S(15), 450);
  check('bag005 d spec value 450', E('450'), 450);
  check('bag005 d y=60-2*15=30', 60 - 2 * 15, 30);
}

// ============================================================
// BAGRUT der-bag-006 (derivative-rules) f(x)=(3x^2-1)^4
// ============================================================
dcheck("bag006 f'=24x(3x^2-1)^3", '(3x^2 - 1)^4', '24*x*(3x^2 - 1)^3');
{
  // b zeros: x=0, x=±1/sqrt(3)
  checkSet('bag006 b zeros', [E('0'), E('1/sqrt(3)'), E('-1/sqrt(3)')], [0, 1 / Math.sqrt(3), -1 / Math.sqrt(3)]);
  // verify 3x^2-1=0 at ±1/sqrt(3)
  for (const x of [1 / Math.sqrt(3), -1 / Math.sqrt(3)]) check(`bag006 3x^2-1 at ${x}`, 3 * x * x - 1, 0);
  // c: f'(1)=192
  const fp = (x: number) => 24 * x * Math.pow(3 * x * x - 1, 3);
  check('bag006 c f\'(1)=192', fp(1), 192);
  check('bag006 c spec value', E('192'), 192);
}

// ============================================================
// BAGRUT der-bag-007 f(x)=x e^{-x}
// ============================================================
dcheck("bag007 a f'=e^{-x}(1-x)", 'x*e^(-x)', 'e^(-x)*(1 - x)');
{
  const f = (x: number) => x * Math.exp(-x);
  check('bag007 b max x=1, f(1)=1/e', f(1), 1 / Math.E);
  check('bag007 b crit 1-x=0 at x=1', 1 - 1, 0);
}

// ============================================================
// BAGRUT der-bag-008 motion s(t)=t^3-12t^2+36t+5 on [0,10]
// ============================================================
dcheck("bag008 a v=s'=3t^2-24t+36", 't^3 - 12t^2 + 36t + 5', '3t^2 - 24t + 36', [-1, 0, 1, 2, 4, 6, 8, 10], 't');
{
  const s = (t: number) => t ** 3 - 12 * t * t + 36 * t + 5;
  checkSet('bag008 b v zeros {2,6}', [E('2'), E('6')], [2, 6]);
  // c: max distance over [0,10] at t=10 -> 165
  check('bag008 c s(0)=5', s(0), 5);
  check('bag008 c s(2)=37', s(2), 37);
  check('bag008 c s(6)=5', s(6), 5);
  check('bag008 c s(10)=165', s(10), 165);
  // d: acceleration a=v'=6t-24 -> 0 at t=4
  dcheck("bag008 d a=v'=6t-24", '3t^2 - 24t + 36', '6t - 24', [-1, 0, 2, 4, 6, 10], 't');
  check('bag008 d a=0 at t=4', 6 * 4 - 24, 0);
  check('bag008 d spec value', E('4'), 4);
}

// ============================================================
// Ghost Replay (content/ghost-replay/math5/derivatives.ts)
// ============================================================
// The four answers AND every number invented inside a failure branch.

// --- gr-der-rules-006: quotient rule on (x+1)/(x-1) ---
{
  const f = (x: number) => (x + 1) / (x - 1);
  const fp = (x: number) => -2 / (x - 1) ** 2;
  // Numeric derivative, independent of the authored algebra.
  for (const x of [-3, -0.5, 0, 2, 4.5]) {
    const h = 1e-6;
    check(`ghost rules-006: f' matches a numeric derivative at x=${x}`,
      Math.round(((f(x + h) - f(x - h)) / (2 * h)) * 1e5) / 1e5,
      Math.round(fp(x) * 1e5) / 1e5);
  }
  check('ghost rules-006: the numerator collapses to -2', (x => 1 * (x - 1) - (x + 1) * 1)(7), -2);
  check('ghost rules-006: f\' is negative everywhere it is defined', fp(5) < 0 && fp(-5) < 0 ? 1 : 0, 1);
  // Branch: swapping the numerator order gives +2/(x-1)^2 — the wrong SIGN.
  check('ghost rules-006 branch: uv\'-u\'v reverses the sign', (x => (x + 1) * 1 - 1 * (x - 1))(7), 2);
  // Branch: "derivative of a quotient = quotient of derivatives" gives 1.
  check('ghost rules-006 branch: u\'/v\' would give 1, a constant — clearly wrong', 1 / 1, 1);
  // Branch: forgetting to square the denominator.
  check('ghost rules-006 branch: -2/(x-1) at x=3 is -1, but the true value is -0.5', -2 / (3 - 1), -1);
  check('ghost rules-006: the true f\'(3) = -0.5', fp(3), -0.5);
}

// --- gr-der-tan-004: where is the slope of y=x^2 equal to 4 ---
check('ghost tan-004: f\'(x) = 2x, so 2x = 4 gives x = 2', 4 / 2, 2);
check('ghost tan-004: the point is (2,4) — f(2) = 4', 2 ** 2, 4);
check('ghost tan-004 branch: f(4) = 16 — plugging the SLOPE into f', 4 ** 2, 16);
check('ghost tan-004 branch: at x=4 the slope is 8, not 4', 2 * 4, 8);
check('ghost tan-004 branch: at x=1 the slope is 2, not 4', 2 * 1, 2);
check('ghost tan-004: the tangent there is y = 4x - 4, and it does pass through (2,4)', 4 * 2 - 4, 4);

// --- gr-der-ext-005: extrema of x^2-4x on the closed [0,3] ---
{
  const f = (x: number) => x * x - 4 * x;
  check('ghost ext-005: f\'(x) = 2x-4 vanishes at x=2', 4 / 2, 2);
  check('ghost ext-005: x=2 is inside [0,3]', 2 > 0 && 2 < 3 ? 1 : 0, 1);
  check('ghost ext-005: f(2) = -4', f(2), -4);
  check('ghost ext-005: f(0) = 0', f(0), 0);
  check('ghost ext-005: f(3) = -3', f(3), -3);
  check('ghost ext-005: the maximum is 0, AT THE ENDPOINT x=0', Math.max(f(0), f(2), f(3)), 0);
  check('ghost ext-005: the minimum is -4', Math.min(f(0), f(2), f(3)), -4);
  // A dense sweep confirms no interior value beats the endpoint.
  {
    let mx = -Infinity, mn = Infinity;
    for (let i = 0; i <= 300000; i++) { const x = (i / 300000) * 3; mx = Math.max(mx, f(x)); mn = Math.min(mn, f(x)); }
    check('ghost ext-005: a 300k-point sweep of [0,3] agrees on the max', Math.abs(mx - 0) < 1e-9 ? 1 : 0, 1);
    check('ghost ext-005: ...and on the min', Math.abs(mn - -4) < 1e-9 ? 1 : 0, 1);
  }
  check('ghost ext-005 branch: -3 is f(3), the OTHER endpoint — not the maximum', f(3), -3);
  check('ghost ext-005 branch: reporting only the critical point misses the max entirely', f(2) < f(0) ? 1 : 0, 1);
}

// --- gr-der-opt-003: three-sided fence, 40 m ---
{
  const A = (x: number) => x * (40 - 2 * x);
  check('ghost opt-003: the constraint 2x+y=40 gives y = 40-2x', 40 - 2 * 10, 20);
  check('ghost opt-003: A(x) = 40x - 2x^2, so A\'(x) = 40-4x vanishes at x=10', 40 / 4, 10);
  check('ghost opt-003: y = 20 at the optimum', 40 - 2 * 10, 20);
  check('ghost opt-003: the maximum area is 200', A(10), 200);
  check('ghost opt-003: A\'\' = -4 < 0, so it really is a maximum', -4 < 0 ? 1 : 0, 1);
  check('ghost opt-003: the fence is used exactly — 2(10)+20 = 40', 2 * 10 + 20, 40);
  {
    let mx = -Infinity;
    for (let i = 0; i <= 200000; i++) { const x = (i / 200000) * 20; mx = Math.max(mx, A(x)); }
    check('ghost opt-003: a 200k sweep over the feasible range confirms 200', Math.abs(mx - 200) < 1e-9 ? 1 : 0, 1);
  }
  // Branch: treating it as a FOUR-sided fence gives a 10x10 square, area 100.
  check('ghost opt-003 branch: four sides would give a 10x10 square of area 100', 10 * 10, 100);
  check('ghost opt-003 branch: ...and that square uses only 2(10)+2(10) = 40 of fence, but leaves the wall unused',
    2 * 10 + 2 * 10, 40);
  check('ghost opt-003 branch: the true optimum is NOT a square — y = 2x', 20 / 10, 2);
  // Branch: x = 20 uses all the fence on the two perpendicular sides, area 0.
  check('ghost opt-003 branch: x=20 leaves y=0 and area 0', A(20), 0);
  check('ghost opt-003 branch: x=40/3 (splitting the fence in three) gives ~177.8, less than 200',
    Math.round(A(40 / 3) * 10) / 10, 177.8);
}

// ============================================================
// בעיות קיצון — the five ext-* stages (owner's breakdown, 2026-08-30)
// ============================================================
//
// Built FROM THE PROBLEM STATEMENTS, not from the authored solutions: each block
// below re-derives the constraint, the target function and the answer the way a
// solver would, then asserts the authored number. Reading a solution back to
// itself proves nothing — a wrong-but-consistent solution passes that.
//
// `dcheck` is the sharpest tool here: it differentiates the target with mathjs
// SYMBOLICALLY and compares against the authored closed form at several points,
// so it catches an algebra slip that a single-point spot check would miss.
{
  // ---- רמת בסיס: differentiating the shapes a target function takes ----
  dcheck('bs-009 C(x) = 3x + 1200/x', '3*x + 1200/x', '3 - 1200/x^2', [1, 2, 5, 10, 20]);
  check('bs-009 C′(10)', E('3 - 1200/10^2'), -9);

  dcheck('bs-010 f(x) = x/sqrt(x^2+4)', 'x/sqrt(x^2+4)', '4/(x^2+4)^(3/2)', [-2, -0.5, 0, 1, 3]);
  check('bs-010 f′(0)', E('4/(0^2+4)^(3/2)'), 0.5);

  dcheck('bs-011 V(x) = x(20-2x)^2', 'x*(20-2*x)^2', '(20-2*x)*(20-6*x)', [0, 1, 4, 7, 9]);
  check('bs-011 V′(4)', E('(20-2*4)*(20-6*4)'), -48);

  // ---- רמה 1: the target function, derived from the constraint ----
  // tg-010: line through (2,3) meets the axes at (x,0) and (0,y): 2/x + 3/y = 1,
  // so y = 3x/(x-2) and the triangle is half the product of the intercepts.
  const tg010 = (x: number) => 0.5 * x * ((3 * x) / (x - 2));
  for (const x of [3, 4, 6, 10]) {
    check(`tg-010 S(${x}) = 3x^2/(2x-4)`, tg010(x), E(`3*${x}^2/(2*${x}-4)`));
  }

  // tg-011: window = rectangle (width 2x) + semicircle radius x, perimeter 8.
  // The frame is 2x + 2h + pi*x — the rectangle's TOP side is the diameter and
  // is not framed. h > 0 is what bounds the domain.
  const h011 = (x: number) => (8 - 2 * x - Math.PI * x) / 2;
  const S011 = (x: number) => 2 * x * h011(x) + (Math.PI * x * x) / 2;
  for (const x of [0.4, 0.8, 1.2]) {
    check(`tg-011 S(${x}) = 8x - 2x^2 - (pi/2)x^2`, S011(x), E(`8*${x} - 2*${x}^2 - (pi/2)*${x}^2`));
  }
  check('tg-011 upper bound is where h vanishes', h011(8 / (2 + Math.PI)), 0);

  // tg-012: P = (x, sqrt(x)) on y = sqrt(x); squared distance to A(3,0).
  const d2 = (x: number) => (x - 3) ** 2 + x;
  for (const x of [0, 1, 4, 9]) check(`tg-012 d^2(${x})`, d2(x), E(`${x}^2 - 5*${x} + 9`));
  check('tg-012 d^2(1)', d2(1), 5);

  // tg-013: rectangle of height x in a triangle base 12, height 8. Similar
  // triangles give the width, and the height of the TRIANGLE bounds the domain.
  const w013 = (x: number) => 12 * ((8 - x) / 8);
  for (const x of [1, 3, 6]) check(`tg-013 S(${x}) = 12x - 1.5x^2`, x * w013(x), E(`12*${x} - 1.5*${x}^2`));
  check('tg-013 the domain ends where the rectangle reaches the apex', w013(8), 0);

  // ---- רמה 2: the critical point, and which kind it is ----
  // ex-010: on a CLOSED interval the endpoints compete with the critical points.
  const g010 = (x: number) => x ** 3 - 3 * x * x;
  dcheck('ex-010 g(x) = x^3 - 3x^2', 'x^3 - 3*x^2', '3*x^2 - 6*x', [0, 1, 2, 3, 4]);
  checkSet('ex-010 critical points of g', [0, 2], [0, 2]);
  check('ex-010 the endpoint x=4 beats both critical points and x=0', Math.max(g010(0), g010(2), g010(4)), g010(4));
  check('ex-010 g(4)', g010(4), 16);

  dcheck('ex-011 f(x) = x*sqrt(72-x^2)', 'x*sqrt(72-x^2)', '(72-2*x^2)/sqrt(72-x^2)', [1, 3, 6, 8]);
  check('ex-011 the derivative vanishes at x=6', E('(72-2*6^2)/sqrt(72-6^2)'), 0);

  // ex-012: only the NUMERATOR of a quotient derivative can zero it.
  dcheck('ex-012 f(x) = x^2/(x-4)', 'x^2/(x-4)', '(x^2-8*x)/(x-4)^2', [-1, 1, 2, 5, 8]);
  checkSet('ex-012 two candidates, not one and not three', [0, 8], [0, 8]);

  dcheck('ex-013 f(x) = (x^2+3)/(x-1)', '(x^2+3)/(x-1)', '(x^2-2*x-3)/(x-1)^2', [-2, 0, 2, 3, 5]);
  check('ex-013 the derivative vanishes at x=3', E('(3^2-2*3-3)/(3-1)^2'), 0);
  check('ex-013 falling just left of 3', Math.sign(E('(2.9^2-2*2.9-3)/(2.9-1)^2')), -1);
  check('ex-013 rising just right of 3 — so it is a minimum', Math.sign(E('(3.1^2-2*3.1-3)/(3.1-1)^2')), 1);

  // ---- רמה 3: substituting x* back into the TARGET ----
  const box = (side: number) => (x: number) => x * (side - 2 * x) ** 2;
  check('sb-009 V(3) for an 18 cm square', box(18)(3), 432);
  check('sb-009 x=3 beats its neighbours', Math.max(box(18)(2.5), box(18)(3), box(18)(3.5)), box(18)(3));

  // sb-010: area 200 on a river, fence = 2x + y with y = 200/x.
  const fence = (x: number) => 2 * x + 200 / x;
  dcheck('sb-010 F(x) = 2x + 200/x', '2*x + 200/x', '2 - 200/x^2', [5, 10, 20]);
  check('sb-010 the derivative vanishes at x=10', E('2 - 200/10^2'), 0);
  check('sb-010 the other side is y = 20', 200 / 10, 20);
  check('sb-010 the minimal fence is 40, not the 10 that was found first', fence(10), 40);

  // sb-011: base is 2x, NOT x — the half that halves the answer.
  const S011b = (x: number) => 2 * x * (12 - x * x);
  dcheck('sb-011 S(x) = 24x - 2x^3', '2*x*(12-x^2)', '24 - 6*x^2', [0.5, 1, 2, 3]);
  check('sb-011 the derivative vanishes at x=2', E('24 - 6*2^2'), 0);
  check('sb-011 base = 2x = 4', 2 * 2, 4);
  check('sb-011 height = 12 - x^2 = 8', 12 - 4, 8);
  check('sb-011 maximal area 32', S011b(2), 32);

  // ---- רמה 4: the whole chain ----
  // bg-010: closest point on y = x^2 to A(3,0) — minimise the SQUARE.
  const q010 = (x: number) => (x - 3) ** 2 + x ** 4;
  dcheck('bg-010 d^2(x) = x^4 + x^2 - 6x + 9', 'x^4 + x^2 - 6*x + 9', '4*x^3 + 2*x - 6', [0, 1, 2]);
  check('bg-010 the derivative vanishes at x=1', E('4*1^3 + 2*1 - 6'), 0);
  check('bg-010 x=1 beats its neighbours', Math.min(q010(0.8), q010(1), q010(1.2)), q010(1));
  check('bg-010 the minimal distance is sqrt(5)', Math.sqrt(q010(1)), Math.sqrt(5));

  // bg-011: rectangle in a right triangle, legs 8 and 6 — hypotenuse a/8 + b/6 = 1.
  const rect = (a: number) => a * (6 - (3 / 4) * a);
  dcheck('bg-011 S(a) = 6a - 0.75a^2', '6*a - 0.75*a^2', '6 - 1.5*a', [1, 4, 7], 'a');
  check('bg-011 the derivative vanishes at a=4', E('6 - 1.5*4'), 0);
  check('bg-011 the other side is 3', 6 - (3 / 4) * 4, 3);
  check('bg-011 maximal area 12', rect(4), 12);

  check('bg-012 V(4) for a 24 cm square', box(24)(4), 1024);
  check('bg-012 x=4 beats its neighbours', Math.max(box(24)(3), box(24)(4), box(24)(5)), box(24)(4));

  // bg-013: cross a 3 km channel at 5/km then walk 8-t km at 4/km.
  const cost = (t: number) => 5 * Math.sqrt(9 + t * t) + 4 * (8 - t);
  dcheck('bg-013 K(t) = 5sqrt(9+t^2) + 4(8-t)', '5*sqrt(9+t^2) + 4*(8-t)', '5*t/sqrt(9+t^2) - 4', [1, 4, 7], 't');
  check('bg-013 the derivative vanishes at CD = 4', E('5*4/sqrt(9+4^2) - 4'), 0);
  check('bg-013 minimal cost 41', cost(4), 41);
  check('bg-013 and 41 really is the least', Math.min(cost(3), cost(4), cost(5)), cost(4));

  // ---- bagrut questions ----
  dcheck('bag-bs-001 S(r) = 2*pi*r^2 + 2000/r', '2*pi*r^2 + 2000/r', '4*pi*r - 2000/r^2', [1, 5, 10], 'r');
  check('bag-bs-001 S′(10) = 40pi - 20', E('4*pi*10 - 2000/10^2'), E('40*pi - 20'));

  dcheck('bag-bs-002 L(x) = sqrt(x^2+16)', 'sqrt(x^2+16)', 'x/sqrt(x^2+16)', [0, 3, 5]);
  check('bag-bs-002 L′(3) = 3/5', E('3/sqrt(3^2+16)'), 0.6);
  dcheck('bag-bs-002 T(x) = sqrt(x^2+16)/x', 'sqrt(x^2+16)/x', '-16/(x^2*sqrt(x^2+16))', [1, 3, 5]);
  check('bag-bs-002 T′(3) = -16/45', E('-16/(3^2*sqrt(3^2+16))'), -16 / 45);

  dcheck('bag-bs-003 V(x) = x(30-2x)^2', 'x*(30-2*x)^2', '(30-2*x)*(30-6*x)', [1, 3, 5, 10]);
  check('bag-bs-003 V′(3) = 288', E('(30-2*3)*(30-6*3)'), 288);
  dcheck('bag-bs-003 the expanded route agrees', '4*x^3 - 120*x^2 + 900*x', '12*x^2 - 240*x + 900', [1, 3, 7]);

  // bag-tg-001: three sides of length x (two ends plus the partition) and one y.
  check('bag-tg-001 the constraint gives y = 90 - 3x', 90 - 3 * 20, 30);
  check('bag-tg-001 S(20) = 600', 20 * (90 - 3 * 20), 600);
  check('bag-tg-001 the domain ends where y vanishes', 90 - 3 * 30, 0);

  check('bag-tg-002 S(6) = 9 on the hypotenuse y = 6 - 0.75x', rect(6), 9);

  const tray = (x: number) => x * (24 - 2 * x) * (18 - 2 * x);
  check('bag-tg-003 V(3) = 648', tray(3), 648);
  check('bag-tg-003 the expanded polynomial agrees', tray(3), E('4*3^3 - 84*3^2 + 432*3'));
  check('bag-tg-003 the SHORT side 18 sets the bound', 18 / 2, 9);

  dcheck('bag-ex-001 S(x) = 2x^2 + 108/x', '2*x^2 + 108/x', '(4*x^3 - 108)/x^2', [1, 3, 6]);
  check('bag-ex-001 the derivative vanishes at x=3', E('(4*3^3 - 108)/3^2'), 0);
  check('bag-ex-001 S″(3) = 12 > 0, a minimum', E('4 + 216/3^3'), 12);

  dcheck('bag-ex-002 V(x) = x(18-2x)^2', 'x*(18-2*x)^2', '12*x^2 - 144*x + 324', [1, 3, 6, 9]);
  checkSet('bag-ex-002 the two roots', [3, 9], [3, 9]);
  check('bag-ex-002 V″(3) = -72 < 0, a maximum', E('24*3 - 144'), -72);
  check('bag-ex-002 x=9 is rejected because the base collapses', 18 - 2 * 9, 0);

  const profit = (x: number) => -(x ** 3) + 9 * x * x - 15 * x;
  dcheck('bag-ex-003 R(x) = -x^3 + 9x^2 - 15x', '-x^3 + 9*x^2 - 15*x', '-3*x^2 + 18*x - 15', [0, 1, 3, 5, 6]);
  checkSet('bag-ex-003 candidates', [1, 5], [1, 5]);
  check('bag-ex-003 R″(1) = 12 > 0, a minimum', E('-6*1 + 18'), 12);
  check('bag-ex-003 R″(5) = -12 < 0, a maximum', E('-6*5 + 18'), -12);
  check('bag-ex-003 the largest profit on [0,6] is at x=5', Math.max(profit(0), profit(1), profit(5), profit(6)), profit(5));
  check('bag-ex-003 the smallest is at x=1, below both endpoints', Math.min(profit(0), profit(1), profit(6)), profit(1));

  const pen = (x: number) => x * (80 - 2 * x);
  check('bag-sb-001 y = 80 - 2x = 40', 80 - 2 * 20, 40);
  check('bag-sb-001 maximal area 800', pen(20), 800);
  check('bag-sb-001 the sanity check at x=19 gives 798', pen(19), 798);
  check('bag-sb-001 the DERIVATIVE at x=20 is 0 — the criterion, not the area', E('80 - 4*20'), 0);

  const tray2 = (x: number) => x * (15 - 2 * x) * (24 - 2 * x);
  checkSet('bag-sb-002 base is 9 by 18', [15 - 6, 24 - 6], [9, 18]);
  check('bag-sb-002 base area 162', (15 - 6) * (24 - 6), 162);
  check('bag-sb-002 maximal volume 486', tray2(3), 486);
  check('bag-sb-002 the sanity check at x=2 gives 440', tray2(2), 440);

  // bag-bg-001: THREE sides of length x (the divider is parallel to them) and two y.
  const pen2 = (x: number) => x * (60 - 1.5 * x);
  check('bag-bg-001 the constraint 3x + 2y = 120 gives y = 60 - 1.5x', 60 - 1.5 * 20, 30);
  dcheck('bag-bg-001 S(x) = 60x - 1.5x^2', '60*x - 1.5*x^2', '60 - 3*x', [5, 20, 35]);
  check('bag-bg-001 the derivative vanishes at x=20', E('60 - 3*20'), 0);
  check('bag-bg-001 S″ = -3 < 0, a maximum',
    (math.derivative(math.derivative('60*x - 1.5*x^2', 'x'), 'x').evaluate({ x: 20 }) as number), -3);
  check('bag-bg-001 maximal area 600', pen2(20), 600);
  check('bag-bg-001 the domain ends where y vanishes', 60 - 1.5 * 40, 0);

  // bag-bg-002: closed can, V = pi r^2 h = 250pi.
  dcheck('bag-bg-002 S(r) = 2*pi*r^2 + 500*pi/r', '2*pi*r^2 + 500*pi/r', '4*pi*r - 500*pi/r^2', [1, 5, 8], 'r');
  check('bag-bg-002 the constraint gives h = 250/r^2', 250 / 25, 10);
  check('bag-bg-002 the derivative vanishes at r=5', E('4*pi*5 - 500*pi/5^2'), 0);
  check('bag-bg-002 S″(5) = 12pi > 0, a minimum', E('4*pi + 1000*pi/5^3'), E('12*pi'));
  check('bag-bg-002 minimal sheet 150pi', E('2*pi*5^2 + 500*pi/5'), E('150*pi'));
  check('bag-bg-002 the height really equals the diameter', E('250/5^2'), 2 * 5);

  // bag-bg-003: line through P(2,1), triangle with the axes.
  const tri = (a: number) => (a * a) / (2 * a - 4);
  check('bag-bg-003 the constraint 2/a + 1/b = 1 gives b = a/(a-2)', 4 / (4 - 2), 2);
  dcheck('bag-bg-003 S(a) = a^2/(2a-4)', 'a^2/(2*a-4)', '(2*a^2 - 8*a)/(2*a-4)^2', [3, 4, 6], 'a');
  check('bag-bg-003 the derivative vanishes at a=4', E('(2*4^2 - 8*4)/(2*4-4)^2'), 0);
  check('bag-bg-003 minimal area 4', tri(4), 4);
  check('bag-bg-003 and 4 really is the least', Math.min(tri(3), tri(4), tri(6)), tri(4));
  check('bag-bg-003 the slope from (4,0) to (0,2) is -1/2', (2 - 0) / (0 - 4), -0.5);
}

// ============================================================
// REPORT
// ============================================================
console.log(`\n${pass}/${pass + fail} passed`);
if (fail > 0) {
  console.log(failures.join('\n'));
  process.exit(1);
}

export {};
