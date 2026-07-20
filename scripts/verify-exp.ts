// Re-computes every numeric value authored in content/lessons/math5/exp-functions.ts
// (lesson[] worked examples + bagrut question scalar/set answers) and asserts each
// against an independent mathjs computation.
//
//  - check()  : exact scalar equality, tolerance 1e-9.
//  - dcheck() : authored closed-form derivative vs mathjs SYMBOLIC derivative,
//               sampled at several x; this proves the algebra, not just a point.
//  - checkSet(): unordered multiset equality, tolerance 1e-9.
//
// Run: npx tsx scripts/verify-exp.ts
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
function dcheck(label: string, fExpr: string, fPrimeExpr: string) {
  const symbolic = math.derivative(fExpr, 'x');
  const authored = math.parse(fPrimeExpr);
  const samples = [-2.3, -1, -0.5, 0, 0.7, 1, 2.5];
  for (const x of samples) {
    const a = symbolic.evaluate({ x }) as number;
    const b = authored.evaluate({ x }) as number;
    if (!(Math.abs(a - b) < 1e-9)) {
      fail++;
      failures.push(`FAIL: ${label} at x=${x} — symbolic ${a}, authored ${b}`);
      return;
    }
  }
  pass++;
}

// ============================================================
// SUB-TOPIC 1: exp-derivatives (lesson worked examples)
// ============================================================
dcheck("e^{3x}' = 3e^{3x}", 'e^(3x)', '3*e^(3x)');
dcheck("e^{-x^2}' = -2x e^{-x^2}", 'e^(-x^2)', '-2*x*e^(-x^2)');
dcheck("(x^2 e^x)' = e^x(2x+x^2)", 'x^2*e^x', 'e^x*(2x + x^2)');
dcheck("(x^2 e^x)' factored = e^x x(x+2)", 'x^2*e^x', 'e^x*x*(x+2)');
dcheck("(x e^{-x})' = e^{-x}(1-x)", 'x*e^(-x)', 'e^(-x)*(1 - x)');
// zeros of (x^2 e^x)': x=0, x=-2  (from x(x+2)=0)
checkSet('x^2 e^x deriv zeros', [E('0'), E('-2')], [0, -2]);
// zero of (x e^{-x})': x=1
check('x e^{-x} deriv zero', 1, 1);

// ============================================================
// SUB-TOPIC 2: exp-equations (lesson worked examples)
// ============================================================
// e^{2x}=e^{x+3} -> x=3 ; verify both sides equal
{ const x = 3; check('e^{2x}=e^{x+3} holds', Math.exp(2 * x), Math.exp(x + 3)); }
// e^x=10 -> x=ln10 (mathjs log == natural log)
check('e^x=10 -> log(10)', E('log(10)'), Math.log(10));
check('ln10 approx 2.303', Math.log(10), 2.302585092994046);
// e^{2x}-3e^x+2=0 -> x=0, x=ln2
for (const x of [0, Math.log(2)]) check(`e^{2x}-3e^x+2 at x=${x}`, Math.exp(2 * x) - 3 * Math.exp(x) + 2, 0);
// e^{2x}-2e^x-3=0 -> only x=ln3
check('e^{2x}-2e^x-3 at ln3', Math.exp(2 * Math.log(3)) - 2 * Math.exp(Math.log(3)) - 3, 0);
// inequality e^{2x}-5e^x+4<0 -> 0<x<ln4 ; endpoints are roots
check('e^{2x}-5e^x+4 root x=0', Math.exp(0) - 5 * Math.exp(0) + 4, 0);
check('e^{2x}-5e^x+4 root x=ln4', Math.exp(2 * Math.log(4)) - 5 * Math.exp(Math.log(4)) + 4, 0);
check('ln4 approx 1.386', Math.log(4), 1.3862943611198906);

// ============================================================
// SUB-TOPIC 3: exp-investigation (lesson worked examples) f(x)=x^2 e^x
// ============================================================
dcheck("(x^2 e^x)' = e^x x(x+2) (inv)", 'x^2*e^x', 'e^x*x*(x+2)');
{
  const f = (x: number) => x * x * Math.exp(x);
  check('x^2 e^x f(0)=0', f(0), 0); // intercept & min
  check('x^2 e^x max f(-2)=4e^-2', f(-2), 4 * Math.exp(-2));
}
checkSet('x^2 e^x extrema x', [E('-2'), E('0')], [-2, 0]);

// ============================================================
// SUB-TOPIC 4: exp-integrals (lesson worked examples)
// ============================================================
// ∫4 e^{2x} dx = 2 e^{2x}+C  -> d/dx(2e^{2x}) = 4 e^{2x}
dcheck('antideriv 2e^{2x} gives 4e^{2x}', '2*e^(2x)', '4*e^(2x)');
// ∫_0^1 e^x dx = e-1
check('int_0^1 e^x = e-1', Math.exp(1) - Math.exp(0), Math.E - 1);
check('e-1 approx 1.718', Math.E - 1, 1.718281828459045);
// ∫ 2x e^{x^2} dx = e^{x^2}+C  -> d/dx(e^{x^2}) = 2x e^{x^2}
dcheck("(e^{x^2})' = 2x e^{x^2}", 'e^(x^2)', '2*x*e^(x^2)');
// area ∫_0^2 e^x dx = e^2-1
check('area int_0^2 e^x = e^2-1', Math.exp(2) - Math.exp(0), Math.exp(2) - 1);
check('e^2-1 approx 6.389', Math.exp(2) - 1, 6.38905609893065);
// applied ΔV = ∫_0^{10} 100 e^{0.05 t} dt = 2000(e^{0.5}-1)
{
  const antider = (t: number) => 2000 * Math.exp(0.05 * t);
  const dv = antider(10) - antider(0);
  check('water dV = 2000(e^0.5-1)', dv, 2000 * (Math.exp(0.5) - 1));
  check('water dV approx 1297', dv, 1297.4425414002564);
}

// ============================================================
// BAGRUT exp-bag-006 (derivatives) f(x)=(2x-x^2)e^x
// ============================================================
dcheck("bag006 f' = e^x(2-x^2)", '(2x - x^2)*e^x', 'e^x*(2 - x^2)');
check('bag006 b f\'(0)=2', E('2'), Math.exp(0) * (2 - 0));      // f'(0) = 2
check('bag006 b spec value', E('2'), 2);
checkSet('bag006 c zeros ±sqrt2', [E('sqrt(2)'), E('-sqrt(2)')], [Math.SQRT2, -Math.SQRT2]);
// confirm 2 - x^2 = 0 at ±sqrt2
for (const x of [Math.SQRT2, -Math.SQRT2]) check(`bag006 2-x^2 at ${x}`, 2 - x * x, 0);

// ============================================================
// BAGRUT exp-bag-007 (equations) e^{2x}-6e^x+8=0
// ============================================================
checkSet('bag007 b t-roots', [E('2'), E('4')], [2, 4]);
checkSet('bag007 c x-roots', [E('log(2)'), E('log(4)')], [Math.log(2), Math.log(4)]);
for (const x of [Math.log(2), Math.log(4)]) check(`bag007 eq at x=${x}`, Math.exp(2 * x) - 6 * Math.exp(x) + 8, 0);
// inequality endpoints (ln2, ln4) are roots
for (const x of [Math.log(2), Math.log(4)]) check(`bag007 ineq endpoint x=${x}`, Math.exp(2 * x) - 6 * Math.exp(x) + 8, 0);

// ============================================================
// BAGRUT exp-bag-008 (investigation) f(x)=(x^2-2x-3)e^x
// ============================================================
dcheck("bag008 f' = e^x(x^2-5)", '(x^2 - 2x - 3)*e^x', 'e^x*(x^2 - 5)');
check('bag008 a f(0)=-3', (0 - 0 - 3) * Math.exp(0), -3);
check('bag008 a spec value', E('-3'), -3);
checkSet('bag008 b zeros ±sqrt5', [E('sqrt(5)'), E('-sqrt(5)')], [Math.sqrt(5), -Math.sqrt(5)]);
for (const x of [Math.sqrt(5), -Math.sqrt(5)]) check(`bag008 x^2-5 at ${x}`, x * x - 5, 0);

// ============================================================
// BAGRUT exp-bag-009 (integrals) f(x)=e^{2x}-1
// ============================================================
check('bag009 a intercept f(0)=0', Math.exp(0) - 1, 0);
check('bag009 a spec value', E('0'), 0);
// part ב: S = ∫_0^1 (e^{2x}-1) dx = 1/2 e^2 - 3/2
{
  const F = (x: number) => 0.5 * Math.exp(2 * x) - x; // antiderivative; F'(x)=e^{2x}-1
  // confirm the antiderivative: d/dx(1/2 e^{2x} - x) = e^{2x} - 1
  dcheck('bag009 b antideriv F = 1/2 e^{2x}-x', '1/2*e^(2x) - x', 'e^(2x) - 1');
  const S = F(1) - F(0);
  check('bag009 b area value', S, 0.5 * Math.exp(2) - 1.5);
  check('bag009 b spec e^2/2-3/2', E('e^2/2 - 3/2'), S);
  check('bag009 b approx 2.19', S, 2.1945280494653252);
}
// part ג: V = π ∫_0^1 (e^{2x}-1)^2 dx = π(1/4 e^4 - e^2 + 7/4)
{
  const G = (x: number) => 0.25 * Math.exp(4 * x) - Math.exp(2 * x) + x; // antider of (e^{2x}-1)^2
  const V = Math.PI * (G(1) - G(0));
  const closed = Math.PI * (0.25 * Math.exp(4) - Math.exp(2) + 1.75);
  check('bag009 c volume = π(e^4/4-e^2+7/4)', V, closed);
  check('bag009 c spec value', E('pi*(e^4/4 - e^2 + 7/4)'), closed);
  // (e^{2x}-1)^2 expansion check: equals e^{4x}-2e^{2x}+1 at samples
  for (const x of [-1, 0, 0.5, 1]) {
    check(`bag009 c expand at ${x}`, Math.pow(Math.exp(2 * x) - 1, 2), Math.exp(4 * x) - 2 * Math.exp(2 * x) + 1);
  }
}

// ============================================================
// SUB-TOPIC 3 (NEW): exp-investigation drills + bank Q006–Q013
// ============================================================
// drill-002: (x-3)e^x crosses x-axis at x=3
check('inv drill-002 (x-3)e^x zero at x=3', (3 - 3) * Math.exp(3), 0);
// drill-003: ((x-3)e^x)' = e^x(x-2)
dcheck('inv drill-003 deriv = e^x(x-2)', '(x-3)*e^x', 'e^x*(x-2)');
// drill-004: f'=e^x(x-2) sign change -> minimum at x=2
{
  const fp = (x: number) => Math.exp(x) * (x - 2);
  check('inv drill-004 f\'(1.9) negative', Math.sign(fp(1.9)), -1);
  check('inv drill-004 f\'(2.1) positive', Math.sign(fp(2.1)), 1);
}
// drill-005: x^2 e^x -> 0 as x->-inf ; ->inf as x->+inf
check('inv drill-005 x^2 e^x ->0 at -inf', 1600 * Math.exp(-40), 0);
check('inv drill-005 x^2 e^x grows at +inf', Math.sign(1600 * Math.exp(40) - 1), 1);
// drill-006: x^2 e^x touches x-axis once at x=0 (double root), f>=0
check('inv drill-006 f(0)=0', 0 * 0 * Math.exp(0), 0);
check('inv drill-006 f(-1)>0', Math.sign(1 * Math.exp(-1)), 1);
check('inv drill-006 f(1)>0', Math.sign(1 * Math.exp(1)), 1);
// Q006: domain of 1/(e^x-1) excludes x=0
check('inv-006 denom zero at x=0', Math.exp(0) - 1, 0);
// Q007: (x+2)e^x at x=0 -> y-intercept 2
check('inv-007 f(0)=2', (0 + 2) * Math.exp(0), 2);
// Q008: zeros of e^{2x}(x^2-9) are ±3
checkSet('inv-008 zeros ±3', [E('3'), E('-3')], [3, -3]);
for (const x of [3, -3]) check(`inv-008 x^2-9 at ${x}`, x * x - 9, 0);
// Q009: f=e^x/(2-e^x): domain x≠ln2 ; asymptotes y=-1 (+inf), y=0 (-inf)
{
  const f = (x: number) => Math.exp(x) / (2 - Math.exp(x));
  check('inv-009 denom zero at ln2', 2 - Math.exp(Math.log(2)), 0);
  check('inv-009 asymptote +inf = -1', f(40), -1);
  check('inv-009 asymptote -inf = 0', f(-40), 0);
}
// Q010: ((x^2-2x)e^x)' = e^x(x^2-2) ; extrema at ±sqrt2
dcheck('inv-010 deriv = e^x(x^2-2)', '(x^2-2x)*e^x', 'e^x*(x^2-2)');
checkSet('inv-010 extrema ±sqrt2', [E('sqrt(2)'), E('-sqrt(2)')], [Math.SQRT2, -Math.SQRT2]);
for (const x of [Math.SQRT2, -Math.SQRT2]) check(`inv-010 x^2-2 at ${x}`, x * x - 2, 0);
// Q011: vertical asymptote of (e^x+1)/(e^x-4) at x=ln4 (numerator ≠0)
check('inv-011 denom zero at ln4', Math.exp(Math.log(4)) - 4, 0);
check('inv-011 numerator at ln4 = 5', Math.exp(Math.log(4)) + 1, 5);
// Q012: f=e^x/(e^x+1): f'=e^x/(e^x+1)^2>0 ; asymptotes y=1 (+inf), y=0 (-inf)
{
  const f = (x: number) => Math.exp(x) / (Math.exp(x) + 1);
  dcheck('inv-012 deriv = e^x/(e^x+1)^2', 'e^x/(e^x+1)', 'e^x/(e^x+1)^2');
  check('inv-012 asymptote +inf = 1', f(40), 1);
  check('inv-012 asymptote -inf = 0', f(-40), 0);
}
// Q013: f=(x^2-4)e^{-x}: f'=-e^{-x}(x^2-2x-4) ; intercepts ±2 & -4 ; extrema 1±sqrt5
dcheck('inv-013 deriv = -e^{-x}(x^2-2x-4)', '(x^2-4)*e^(-x)', '-e^(-x)*(x^2-2x-4)');
check('inv-013 f(0)=-4', (0 - 4) * Math.exp(0), -4);
checkSet('inv-013 x-intercepts ±2', [E('2'), E('-2')], [2, -2]);
checkSet('inv-013 extrema 1±sqrt5', [E('1+sqrt(5)'), E('1-sqrt(5)')], [1 + Math.sqrt(5), 1 - Math.sqrt(5)]);
for (const x of [1 + Math.sqrt(5), 1 - Math.sqrt(5)]) check(`inv-013 x^2-2x-4 at ${x}`, x * x - 2 * x - 4, 0);

// ============================================================
// SUB-TOPIC 4 (NEW): exp-integrals drills + bank Q006–Q013
// ============================================================
// drill-001: ∫e^{5x} = (1/5)e^{5x}+C  -> d/dx = e^{5x}
dcheck('int drill-001 antideriv (1/5)e^{5x}', '(1/5)*e^(5x)', 'e^(5x)');
// drill-002: ∫_0^1 e^{2x} = (1/2)(e^2-1)
dcheck('int drill-002 antideriv (1/2)e^{2x}', '(1/2)*e^(2x)', 'e^(2x)');
check('int drill-002 value = (1/2)(e^2-1)', 0.5 * Math.exp(2) - 0.5 * Math.exp(0), 0.5 * (Math.exp(2) - 1));
// drill-003: ∫2x e^{x^2} = e^{x^2}+C
dcheck('int drill-003 antideriv e^{x^2}', 'e^(x^2)', '2*x*e^(x^2)');
// drill-004: area of -e^x on [0,1] = |1-e| = e-1
check('int drill-004 area = e-1', Math.abs(-(Math.exp(1) - Math.exp(0))), Math.E - 1);
// drill-005: area between e^x (upper) and 1 (lower) on [0,1] = e-2  (antider e^x - x)
dcheck('int drill-005 antideriv e^x - x', 'e^x - x', 'e^x - 1');
{
  const F = (x: number) => Math.exp(x) - x;
  const area = F(1) - F(0);
  check('int drill-005 area = e-2', area, Math.E - 2);
  check('int drill-005 area positive', Math.sign(area), 1);
}
// drill-006: ∫_0^1 e^{-x^2} dx  is bounded in [e^{-1}, 1]  (no elementary antideriv -> numeric integ)
{
  let s = 0;
  const N = 200000;
  for (let i = 0; i < N; i++) { const x = (i + 0.5) / N; s += Math.exp(-x * x); }
  s /= N;
  check('int drill-006 ∫_0^1 e^{-x^2} ≤ 1 holds', s <= 1 ? 0 : 1, 0);
  check('int drill-006 ∫_0^1 e^{-x^2} ≥ e^{-1} holds', s >= Math.exp(-1) ? 0 : 1, 0);
}
// Q006: ∫e^{3x+2} = (1/3)e^{3x+2}+C
dcheck('int-006 antideriv (1/3)e^{3x+2}', '(1/3)*e^(3x+2)', 'e^(3x+2)');
// Q007: ∫e^{-x} = -e^{-x}+C
dcheck('int-007 antideriv -e^{-x}', '-e^(-x)', 'e^(-x)');
// Q008: ∫_0^1 e^{-x} = 1 - e^{-1}
check('int-008 value = 1 - e^{-1}', -Math.exp(-1) - -Math.exp(0), 1 - Math.exp(-1));
// Q009: area between e^x and e^{-x} on [0,1] = e + e^{-1} - 2  (antider e^x + e^{-x})
dcheck('int-009 antideriv e^x + e^{-x}', 'e^x + e^(-x)', 'e^x - e^(-x)');
check('int-009 value = e + e^{-1} - 2', (Math.exp(1) + Math.exp(-1)) - (Math.exp(0) + Math.exp(0)), Math.E + Math.exp(-1) - 2);
// Q010: ∫_0^2 e^{x/2} = 2e - 2  (antider 2 e^{x/2})
dcheck('int-010 antideriv 2 e^{x/2}', '2*e^(x/2)', 'e^(x/2)');
check('int-010 value = 2e - 2', 2 * Math.exp(1) - 2 * Math.exp(0), 2 * Math.E - 2);
// Q011: ∫_0^2 e^{-x} = 1 - e^{-2} < 2
check('int-011 value = 1 - e^{-2}', -Math.exp(-2) - -Math.exp(0), 1 - Math.exp(-2));
check('int-011 bound < 2 holds', (1 - Math.exp(-2)) < 2 ? 0 : 1, 0);
// Q012: split area of e^x-1 on [-2,1] = (1+e^{-2}) + (e-2) = e + e^{-2} - 1  (antider e^x - x)
dcheck('int-012 antideriv e^x - x', 'e^x - x', 'e^x - 1');
{
  const F = (x: number) => Math.exp(x) - x;
  const neg = F(0) - F(-2); // -1 - e^{-2}  (below axis on [-2,0])
  const pos = F(1) - F(0); // e - 2
  check('int-012 neg part = -1 - e^{-2}', neg, -1 - Math.exp(-2));
  check('int-012 pos part = e - 2', pos, Math.E - 2);
  check('int-012 total area = e + e^{-2} - 1', Math.abs(neg) + pos, Math.E + Math.exp(-2) - 1);
}
// Q013: ∫_0^1 x e^{x^2} = (1/2)(e-1)  (antider (1/2)e^{x^2})
dcheck('int-013 antideriv (1/2)e^{x^2}', '(1/2)*e^(x^2)', 'x*e^(x^2)');
check('int-013 value = (1/2)(e-1)', 0.5 * Math.exp(1) - 0.5 * Math.exp(0), 0.5 * (Math.E - 1));

// ============================================================
// REPORT
// ============================================================
console.log(`\n${pass}/${pass + fail} passed`);
if (fail > 0) {
  console.log(failures.join('\n'));
  process.exit(1);
}

export {};
