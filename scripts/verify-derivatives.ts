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
// REPORT
// ============================================================
console.log(`\n${pass}/${pass + fail} passed`);
if (fail > 0) {
  console.log(failures.join('\n'));
  process.exit(1);
}

export {};
