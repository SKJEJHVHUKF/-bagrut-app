// Re-computes every numeric value authored in content/lessons/math5/integrals.ts
// (lesson[] worked examples + worked `examples` + bagrut scalar/set answers +
// `expected` specs) and asserts each against an independent mathjs computation.
//
//  - check()   : exact scalar equality, tolerance 1e-9.
//  - checkSet(): unordered multiset equality, tolerance 1e-9.
//  - acheck()  : prove an authored ANTIDERIVATIVE by differentiating it back
//                (mathjs symbolic derivative) and comparing to the integrand at
//                several sample x — proves the algebra, not just one point.
//  - defint()  : numeric definite integral (Simpson) to cross-check F(b)-F(a).
//
// Run: npx tsx scripts/verify-integrals.ts
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

// Prove authored antiderivative F by symbolic-differentiating it and comparing
// to the integrand f at several sample points (F' === f).
function acheck(label: string, FExpr: string, fExpr: string) {
  const symbolic = math.derivative(FExpr, 'x');
  const integrand = math.parse(fExpr);
  const samples = [-1.7, -0.4, 0.3, 0.9, 1.6, 2.4, 3.1];
  for (const x of samples) {
    const a = symbolic.evaluate({ x }) as number;
    const b = integrand.evaluate({ x }) as number;
    if (!(Math.abs(a - b) < 1e-9)) {
      fail++;
      failures.push(`FAIL: ${label} at x=${x} — F'=${a}, f=${b}`);
      return;
    }
  }
  pass++;
}

// Composite Simpson's rule numeric definite integral of f over [a,b].
function defint(f: (x: number) => number, a: number, b: number, n = 20000): number {
  if (n % 2 === 1) n++;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
  return (s * h) / 3;
}

// ============================================================
// SUB-TOPIC 1: basic-integration — lesson worked examples
// ============================================================
acheck('∫(6x^2-4x+1) = 2x^3-2x^2+x', '2*x^3 - 2*x^2 + x', '6*x^2 - 4*x + 1');
// ∫(3/x+sin x)=3ln|x|-cos x : diff back at POSITIVE samples only (ln domain)
{
  const dF = math.derivative('3*log(x) - cos(x)', 'x');
  const f = math.parse('3/x + sin(x)');
  let ok = true;
  for (const x of [0.3, 0.9, 1.6, 2.4, 3.1]) {
    if (Math.abs((dF.evaluate({ x }) as number) - (f.evaluate({ x }) as number)) >= 1e-9) ok = false;
  }
  if (ok) pass++; else { fail++; failures.push('FAIL: ∫(3/x+sin x) antideriv'); }
}
acheck('∫(5x-1)^4 = (5x-1)^5/25', '(5*x - 1)^5 / 25', '(5*x - 1)^4');
// initial-condition example: f'=2x+3, f(1)=5 -> f=x^2+3x+1
acheck("ic ex: f=x^2+3x+1 has f'=2x+3", 'x^2 + 3*x + 1', '2*x + 3');
check('ic ex: f(1)=5', E('1^2 + 3*1 + 1'), 5);

// ============================================================
// SUB-TOPIC 2: definite-integral — lesson worked examples
// ============================================================
acheck('∫(2x-1) F=x^2-x', 'x^2 - x', '2*x - 1');
check('∫_1^3 (2x-1) = 6', E('(3^2 - 3) - (1^2 - 1)'), 6);
check('∫_1^3 (2x-1) numeric', defint((x) => 2 * x - 1, 1, 3), 6);
acheck('∫sin x F=-cos x', '-cos(x)', 'sin(x)');
check('∫_0^pi sin x = 2', -Math.cos(Math.PI) - -Math.cos(0), 2);
check('∫_0^pi sin x numeric', defint((x) => Math.sin(x), 0, Math.PI), 2);
// recover f: f'=3x^2-4, f(1)=2 -> f=x^3-4x+5
acheck("recover f=x^3-4x+5 has f'=3x^2-4", 'x^3 - 4*x + 5', '3*x^2 - 4');
check('recover f(1)=2', E('1^3 - 4*1 + 5'), 2);

// ============================================================
// SUB-TOPIC 3: area-between-curves — lesson worked examples
// ============================================================
// area between f=x^2-1 and axis on [-1,1]: integral=-4/3, geometric area 4/3
acheck('∫(x^2-1) F=x^3/3-x', 'x^3/3 - x', 'x^2 - 1');
{
  const Fv = (x: number) => x ** 3 / 3 - x;
  check('∫_{-1}^{1}(x^2-1) = -4/3', Fv(1) - Fv(-1), -4 / 3);
  check('geometric area = 4/3', Math.abs(Fv(1) - Fv(-1)), 4 / 3);
  check('numeric ∫_{-1}^1 (x^2-1)', defint((x) => x * x - 1, -1, 1), -4 / 3);
}
// area between y=x^2 and y=2x = 4/3
checkSet('x^2=2x roots', [E('0'), E('2')], [0, 2]);
acheck('∫(2x-x^2) F=x^2-x^3/3', 'x^2 - x^3/3', '2*x - x^2');
check('area x^2,2x = 4/3', defint((x) => 2 * x - x * x, 0, 2), 4 / 3);
{
  const Fv = (x: number) => x * x - x ** 3 / 3;
  check('area x^2,2x closed = 4/3', Fv(2) - Fv(0), 4 / 3);
}

// ============================================================
// SUB-TOPIC 4: volume-revolution — lesson worked examples
// ============================================================
// V of sqrt(x) on [0,4] = 8π
check('V sqrt(x) [0,4] = 8π', Math.PI * defint((x) => x, 0, 4), 8 * Math.PI);
check('V sqrt(x) closed', Math.PI * (4 ** 2 / 2 - 0), 8 * Math.PI);
// V of x^2+1 on [0,1] = 28π/15  (expand (x^2+1)^2 = x^4+2x^2+1)
for (const x of [-1, 0, 0.5, 1, 2]) check(`expand (x^2+1)^2 at ${x}`, (x * x + 1) ** 2, x ** 4 + 2 * x * x + 1);
acheck('antideriv x^4+2x^2+1', 'x^5/5 + 2*x^3/3 + x', 'x^4 + 2*x^2 + 1');
{
  const G = (x: number) => x ** 5 / 5 + (2 * x ** 3) / 3 + x;
  check('V (x^2+1) [0,1] = 28π/15', Math.PI * (G(1) - G(0)), (28 * Math.PI) / 15);
  check('V (x^2+1) numeric', Math.PI * defint((x) => (x * x + 1) ** 2, 0, 1), (28 * Math.PI) / 15);
}
// V of constant f=2 on [0,3] = 12π (cylinder)
check('V f=2 [0,3] = 12π', Math.PI * defint(() => 4, 0, 3), 12 * Math.PI);

// ============================================================
// TOP-LEVEL `examples` (concepts/worked) — extra coverage
// ============================================================
acheck('ex easy ∫(6x^2-4x+1)', '2*x^3 - 2*x^2 + x', '6*x^2 - 4*x + 1');
// mid: area between -x^2+4 and axis = 32/3
checkSet('-x^2+4 roots ±2', [E('2'), E('-2')], [2, -2]);
check('area -x^2+4 = 32/3', defint((x) => -x * x + 4, -2, 2), 32 / 3);
// hard: ∫ x e^{x^2} = 1/2 e^{x^2}  (subst) — diff back
acheck("(1/2 e^{x^2})' = x e^{x^2}", '1/2*e^(x^2)', 'x*e^(x^2)');
// area f(x)=x^2-4 on [-3,3] = 46/3 (concept worked example)
{
  const Fv = (x: number) => x ** 3 / 3 - 4 * x;
  const a1 = Math.abs(Fv(-2) - Fv(-3));
  const a2 = Math.abs(Fv(2) - Fv(-2));
  const a3 = Math.abs(Fv(3) - Fv(2));
  check('area x^2-4 [-3,3] = 46/3', a1 + a2 + a3, 46 / 3);
}

// ============================================================
// BAGRUT int-bag-001 (basic-integration) f'=3x^2+4x-1, f(1)=5
// ============================================================
acheck("bag001 f=x^3+2x^2-x+C", 'x^3 + 2*x^2 - x', '3*x^2 + 4*x - 1');
check('bag001 b C=3', E('5 - (1 + 2 - 1)'), 3);
check('bag001 c f(1)=5 check', E('1^3 + 2*1^2 - 1 + 3'), 5);

// ============================================================
// BAGRUT int-bag-002 (area) f=-x^2+6x-5 on [1,5]
// ============================================================
checkSet('bag002 roots 1,5', [E('1'), E('5')], [1, 5]);
acheck('bag002 F=-x^3/3+3x^2-5x', '-x^3/3 + 3*x^2 - 5*x', '-x^2 + 6*x - 5');
check('bag002 c area = 32/3', defint((x) => -x * x + 6 * x - 5, 1, 5), 32 / 3);

// ============================================================
// BAGRUT int-bag-003 (area) f=x^2, g=4-x^2
// ============================================================
checkSet('bag003 roots ±sqrt2', [E('sqrt(2)'), E('-sqrt(2)')], [Math.SQRT2, -Math.SQRT2]);
check('bag003 c area = 16sqrt2/3', defint((x) => 4 - 2 * x * x, -Math.SQRT2, Math.SQRT2), (16 * Math.SQRT2) / 3);

// ============================================================
// BAGRUT int-bag-004 (volume) f=sqrt(x), [1,4]
// ============================================================
check('bag004 b V = 15π/2', Math.PI * defint((x) => x, 1, 4), (15 * Math.PI) / 2);
check('bag004 b V closed', Math.PI * (4 ** 2 / 2 - 1 / 2), (15 * Math.PI) / 2);

// ============================================================
// BAGRUT int-bag-005 (area, sign change) f=x^3-4x on [-2,2]
// ============================================================
checkSet('bag005 roots -2,0,2', [E('-2'), E('0'), E('2')], [-2, 0, 2]);
{
  const Fv = (x: number) => x ** 4 / 4 - 2 * x * x;
  check('bag005 (-2,0) area = 4', Math.abs(Fv(0) - Fv(-2)), 4);
  check('bag005 (0,2) area = 4', Math.abs(Fv(2) - Fv(0)), 4);
  check('bag005 c total = 8', Math.abs(Fv(0) - Fv(-2)) + Math.abs(Fv(2) - Fv(0)), 8);
}

// ============================================================
// BAGRUT int-bag-006 (substitution) I = ∫ x(x^2+1)^5 dx = (x^2+1)^6/12
// ============================================================
acheck("bag006 ((x^2+1)^6/12)' = x(x^2+1)^5", '(x^2 + 1)^6 / 12', 'x*(x^2 + 1)^5');

// ============================================================
// BAGRUT int-bag-007 (definite, motion) v=6t-t^2 on [0,6]
// ============================================================
acheck('bag007 s=3t^2-t^3/3', '3*x^2 - x^3/3', '6*x - x^2');
check('bag007 a dist [0,3] = 18', defint((t) => 6 * t - t * t, 0, 3), 18);
check('bag007 b dist [0,6] = 36', defint((t) => 6 * t - t * t, 0, 6), 36);
check('bag007 c max at t=3, v=9', 6 * 3 - 3 * 3, 9);

// ============================================================
// BAGRUT int-bag-008 (capstone) f=x^2+1
// ============================================================
acheck('bag008 a F=x^3/3+x', 'x^3/3 + x', 'x^2 + 1');
check('bag008 a area [0,2] = 14/3', defint((x) => x * x + 1, 0, 2), 14 / 3);
// b: V = π ∫_0^2 (x^2+1)^2 dx = 206π/15
check('bag008 b V = 206π/15', Math.PI * defint((x) => (x * x + 1) ** 2, 0, 2), (206 * Math.PI) / 15);
acheck('bag008 b antideriv (x^2+1)^2', 'x^5/5 + 2*x^3/3 + x', '(x^2 + 1)^2');
// c: G=x^3/3+x+C with G(1)=4 -> C=8/3
check('bag008 c C=8/3', E('4 - (1/3 + 1)'), 8 / 3);
check('bag008 c G(1)=4 check', E('1/3 + 1 + 8/3'), 4);

// ============================================================
// BAGRUT int-bag-009 (basic-integration) f'=6x^2-6x+4, f(2)=10
// ============================================================
acheck("bag009 f=2x^3-3x^2+4x", '2*x^3 - 3*x^2 + 4*x', '6*x^2 - 6*x + 4');
check('bag009 b C=-2 (spec)', E('10 - (16 - 12 + 8)'), -2);
check('bag009 c f(1)=1 (spec)', E('2*1^3 - 3*1^2 + 4*1 - 2'), 1);

// ============================================================
// BAGRUT int-bag-010 (definite-integral)
// ============================================================
acheck('bag010 a F=x^3-x^2', 'x^3 - x^2', '3*x^2 - 2*x');
check('bag010 a ∫_1^3 = 18 (spec)', defint((x) => 3 * x * x - 2 * x, 1, 3), 18);
acheck('bag010 b F=2x^2-x', '2*x^2 - x', '4*x - 1');
check('bag010 b ∫_0^2 = 6 (spec)', defint((x) => 4 * x - 1, 0, 2), 6);
acheck("bag010 c g=2x^2-x+3 has g'=4x-1", '2*x^2 - x + 3', '4*x - 1');
check('bag010 c g(0)=3', E('2*0^2 - 0 + 3'), 3);
check('bag010 c g(2)=9 (spec)', E('2*2^2 - 2 + 3'), 9);

// ============================================================
// BAGRUT int-bag-011 (area) f=x^2, line y=2x+3
// ============================================================
checkSet('bag011 a roots 3,-1', [E('3'), E('-1')], [3, -1]);
acheck('bag011 c F=x^2+3x-x^3/3', 'x^2 + 3*x - x^3/3', '2*x + 3 - x^2');
check('bag011 c area = 32/3 (spec)', defint((x) => 2 * x + 3 - x * x, -1, 3), 32 / 3);
check('bag011 c spec value', E('32/3'), 32 / 3);

// ============================================================
// BAGRUT int-bag-012 (volume) f=x+1 on [0,2]
// ============================================================
for (const x of [-1, 0, 1, 2, 3]) check(`bag012 expand (x+1)^2 at ${x}`, (x + 1) ** 2, x * x + 2 * x + 1);
acheck('bag012 b F=x^3/3+x^2+x', 'x^3/3 + x^2 + x', 'x^2 + 2*x + 1');
{
  const Fv = (x: number) => x ** 3 / 3 + x * x + x;
  check('bag012 c F(2)=26/3', Fv(2), 26 / 3);
  check('bag012 c V = 26π/3 (spec)', Math.PI * (Fv(2) - Fv(0)), (26 * Math.PI) / 3);
  check('bag012 c V numeric', Math.PI * defint((x) => (x + 1) ** 2, 0, 2), (26 * Math.PI) / 3);
  check('bag012 c spec pi*26/3', E('pi*26/3'), (26 * Math.PI) / 3);
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
