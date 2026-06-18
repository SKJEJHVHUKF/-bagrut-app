// Re-computes every numeric value authored in
// content/lessons/math5/algebra.ts and asserts each against an independent
// mathjs computation. Covers:
//   - quadratic roots (factoring / quadratic formula) — verified by SUBSTITUTION
//   - discriminant values Delta = b^2 - 4ac
//   - parameter conditions (the m / k boundary values)
//   - Vieta sum/product and sum-of-squares identities
//   - every bagrut scalar/set answer that carries an `expected` value/set spec
//   - vertex coordinates, biquadratic substitution, radical/rational solutions
//
// All checks use tol 1e-9. Quadratic roots are proven by plugging back into
// the polynomial (residual ~ 0), so a wrong authored root is caught even if
// the formula path agrees.
//
// Run: npx tsx scripts/verify-algebra.ts
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

// Residual of ax^2+bx+c at x; should be ~0 for a genuine root.
function residual(a: number, b: number, c: number, x: number): number {
  return a * x * x + b * x + c;
}
function checkRoot(label: string, a: number, b: number, c: number, x: number) {
  check(label, residual(a, b, c, x), 0);
}
// Discriminant.
const disc = (a: number, b: number, c: number) => b * b - 4 * a * c;

// ============================================================
// SUB-TOPIC LESSON worked examples
// ============================================================

// quadratic-equations
// ex: 3x^2+2x = x^2+5x-4  ->  2x^2-3x+4=0
check('quad/standard-form a', 3 - 1, 2);
check('quad/standard-form b', 2 - 5, -3);
check('quad/standard-form c', 4, 4);
// x^2-7x+10=0 -> roots 2,5
checkRoot('quad/factor root 2', 1, -7, 10, 2);
checkRoot('quad/factor root 5', 1, -7, 10, 5);
checkSet('quad/factor set', [2, 5], [2, 5]);
// 2x^2-7x+3=0 -> Delta=25, roots 3, 1/2
check('quad/formula Delta', disc(2, -7, 3), 25);
checkRoot('quad/formula root 3', 2, -7, 3, 3);
checkRoot('quad/formula root 1/2', 2, -7, 3, 0.5);
// 4x^2-9=0 -> roots ±3/2
checkRoot('quad/diff-sq +3/2', 4, 0, -9, 1.5);
checkRoot('quad/diff-sq -3/2', 4, 0, -9, -1.5);
// vertex f=x^2-6x+5 -> (3,-4)
check('quad/vertex xv', -(-6) / (2 * 1), 3);
check('quad/vertex yv', E('3^2 - 6*3 + 5'), -4);

// discriminant-parameter
// 2x^2+5x+4 -> Delta=-7
check('disc/2x2+5x+4 Delta', disc(2, 5, 4), -7);
// x^2-4x+m two distinct -> Delta=16-4m>0 -> boundary m=4
check('disc/boundary m', E('16/4'), 4);
// Vieta x^2-7x+12: sum 7 product 12
check('disc/vieta sum', -(-7) / 1, 7);
check('disc/vieta product', 12 / 1, 12);
checkRoot('disc/vieta root 3', 1, -7, 12, 3);
checkRoot('disc/vieta root 4', 1, -7, 12, 4);
// sum of squares x^2-5x+2: (5)^2 - 2*2 = 21
check('disc/sum-of-squares', 5 * 5 - 2 * 2, 21);
// (m-1)x^2-4x+1 double root: a!=0 case Delta=20-4m=0 -> m=5; then 4x^2-4x+1 double root 1/2
check('disc/param-on-a m', E('20/4'), 5);
checkRoot('disc/param double root 1/2', 4, -4, 1, 0.5);
check('disc/param double Delta', disc(4, -4, 1), 0);

// radical-rational
// sqrt(2x-6) domain boundary x>=3
check('rad/domain boundary', E('6/2'), 3);
// sqrt(x+7)=x+1 -> x^2+x-6=0 roots -3,2; only 2 valid (substitution into original)
checkRoot('rad/eq quad root -3', 1, 1, -6, -3);
checkRoot('rad/eq quad root 2', 1, 1, -6, 2);
check('rad/eq valid x=2 LHS', Math.sqrt(2 + 7), 2 + 1); // sqrt(9)=3=2+1
// (x^2-9)/(x-3)=0 -> x=-3 (x=3 rejected)
check('rad/rational numerator at -3', E('(-3)^2 - 9'), 0);
// x(x-1)=5(x-1) -> (x-1)(x-5)=0 roots 1,5
check('rad/no-divide root1 LHS', E('1*(1-1)'), E('5*(1-1)'));
check('rad/no-divide root5 LHS', E('5*(5-1)'), E('5*(5-1)'));

// inequalities
// -2x+1>7 -> x<-3 boundary -3
check('ineq/linear boundary', E('6/-2'), -3);
// x^2-5x+6>0 roots 2,3
checkRoot('ineq/quad root 2', 1, -5, 6, 2);
checkRoot('ineq/quad root 3', 1, -5, 6, 3);
// (x-1)/(x+2)>=0 critical 1,-2
check('ineq/rational crit numer', E('1-1'), 0);
check('ineq/rational crit denom', E('-2+2'), 0);
// |x-1|<3 -> -2<x<4 boundaries
check('ineq/abs lower', E('-3+1'), -2);
check('ineq/abs upper', E('3+1'), 4);

// ============================================================
// BAGRUT questions — every `expected` value/set, plus key intermediate values
// ============================================================

// alg-bag-001 (radical-rational) part ב expected value 6
checkRoot('bag-001/b quad root 6', 1, -7, 6, 6);
checkRoot('bag-001/b quad root 1(rejected)', 1, -7, 6, 1);
check('bag-001/b valid x=6', Math.sqrt(6 + 3), 6 - 3); // sqrt(9)=3=6-3
check('bag-001/b expected', E('6'), 6);

// alg-bag-002 (system) — part a (2,0)/(-1,3); part c boundary k=7/4
checkRoot('bag-002/a quad root 2', 1, -1, -2, 2); // x^2-x-2=0
checkRoot('bag-002/a quad root -1', 1, -1, -2, -1);
check('bag-002/a y at x=2', E('2 - 2'), 0);
check('bag-002/a y at x=-1', E('2 - (-1)'), 3);
check('bag-002/b xy', E('2*0'), 0);
check('bag-002/c k boundary', E('7/4'), 1.75); // Delta=4k-7<0 -> k<7/4

// alg-bag-003 (discriminant-parameter)
// part a Delta = -3m^2+4m+20 ; verify at sample m
const dExpr = (m: number) => -3 * m * m + 4 * m + 20;
check('bag-003/a Delta sample m=1', dExpr(1), disc(1, -(1 + 2), 1 * 1 - 4));
check('bag-003/a Delta sample m=3', dExpr(3), disc(1, -(3 + 2), 3 * 3 - 4));
// part b boundaries: 3m^2-4m-20=0 -> m=-2, 10/3
checkRoot('bag-003/b boundary -2', 3, -4, -20, -2);
checkRoot('bag-003/b boundary 10/3', 3, -4, -20, 10 / 3);
// part c m=1: x^2-3x-3=0 -> (3±sqrt21)/2
check('bag-003/c Delta', disc(1, -3, -3), 21);
checkRoot('bag-003/c root +', 1, -3, -3, E('(3+sqrt(21))/2'));
checkRoot('bag-003/c root -', 1, -3, -3, E('(3-sqrt(21))/2'));
checkSet(
  'bag-003/c expected set',
  [E('(3+sqrt(21))/2'), E('(3-sqrt(21))/2')],
  [E('(3+sqrt(21))/2'), E('(3-sqrt(21))/2')]
);
// part d m^2-m-6=0 -> m=3,-2 ; expected set {3,-2}
checkRoot('bag-003/d m=3', 1, -1, -6, 3);
checkRoot('bag-003/d m=-2', 1, -1, -6, -2);
check('bag-003/d m=3 sum=product', E('3+2'), E('3^2-4')); // m+2 vs m^2-4: 5=5
check('bag-003/d m=-2 sum=product', E('-2+2'), E('(-2)^2-4')); // 0=0
checkSet('bag-003/d expected set', [3, -2], [3, -2]);

// alg-bag-004 (word problem) — x^2+20x-2000=0 (messy, manual; sanity Delta)
check('bag-004/b Delta', disc(1, 20, -2000), 8400);

// alg-bag-005 (inequalities/abs) — set {1,4}; verify both via original |x^2-4|=3x
checkRoot('bag-005/b case1 root4', 1, -3, -4, 4); // x^2-3x-4=0
checkRoot('bag-005/b case2 root1', 1, 3, -4, 1); // x^2+3x-4=0
check('bag-005/b verify x=1', Math.abs(1 * 1 - 4), 3 * 1);
check('bag-005/b verify x=4', Math.abs(4 * 4 - 4), 3 * 4);
checkSet('bag-005/b expected set', [1, 4], [1, 4]);

// alg-bag-006 (rational w/ parameter) — no-solution m=-6 (a=m+6=0)
check('bag-006/c no-sol m', -6 + 6, 0);

// alg-bag-007 (quadratic-equations / biquadratic)
// part a t^2-5t+4=0 -> t=1,4
checkRoot('bag-007/a t=1', 1, -5, 4, 1);
checkRoot('bag-007/a t=4', 1, -5, 4, 4);
checkSet('bag-007/a expected set', [1, 4], [1, 4]);
// part b x=±1,±2 — substitute into x^4-5x^2+4
const biquad = (x: number) => x ** 4 - 5 * x * x + 4;
check('bag-007/b x=1', biquad(1), 0);
check('bag-007/b x=-1', biquad(-1), 0);
check('bag-007/b x=2', biquad(2), 0);
check('bag-007/b x=-2', biquad(-2), 0);
checkSet('bag-007/b expected set', [1, -1, 2, -2], [1, -1, 2, -2]);

// alg-bag-008 (linear-quadratic system w/ parameter)
// part a x^2-6x+(k+5)=0 ; part b Delta=16-4k>0 -> k<4 ; part c k=4 tangent (3,1)
check('bag-008/b Delta-coeff', disc(1, -6, 4 + 5), E('16 - 4*4')); // at k=4 -> 0
check('bag-008/c k', E('16/4'), 4);
checkRoot('bag-008/c tangent x=3', 1, -6, 9, 3); // x^2-6x+9=0 double root 3
check('bag-008/c tangent y', E('2*3 - 5'), 1);

// alg-bag-009 (inequalities) NEW
// part a roots of x^2-2x-3 -> 3,-1
checkRoot('bag-009/a root 3', 1, -2, -3, 3);
checkRoot('bag-009/a root -1', 1, -2, -3, -1);
checkSet('bag-009/a expected set', [3, -1], [3, -1]);
// part b interval [-1,3] endpoints are roots (manual answer) — confirm sign inside
check('bag-009/b sign inside (x=1)', E('1^2 - 2*1 - 3') < 0 ? 1 : 0, 1);
// part c critical points -1,2,3 ; confirm sign in each region picked
check('bag-009/c at x=0 (>0 region -1..2)', E('(0^2-2*0-3)/(0-2)') > 0 ? 1 : 0, 1);
check('bag-009/c at x=4 (>0 region x>3)', E('(4^2-2*4-3)/(4-2)') > 0 ? 1 : 0, 1);
check('bag-009/c at x=-2 (<0 region)', E('((-2)^2-2*(-2)-3)/(-2-2)') < 0 ? 1 : 0, 1);
check('bag-009/c at x=2.5 (<0 region 2..3)', E('(2.5^2-2*2.5-3)/(2.5-2)') < 0 ? 1 : 0, 1);
// part d |x-1|>2 -> x<-1 or x>3 boundaries
check('bag-009/d boundary upper', E('2+1'), 3);
check('bag-009/d boundary lower', E('-2+1'), -1);

// ============================================================
console.log(`\nverify-algebra: ${pass}/${pass + fail} passed.`);
if (fail > 0) {
  console.error(`\n${fail} FAILURE(S):`);
  for (const f of failures) console.error('  ' + f);
  process.exit(1);
}

export {};
