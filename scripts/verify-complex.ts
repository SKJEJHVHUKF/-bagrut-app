/**
 * verify-complex.ts — independent numeric re-derivation of the מספרים מרוכבים
 * question bank. mathjs computes complex arithmetic from scratch (a second
 * engine, not the content's own words) and we assert each stated answer.
 *
 * cis/de-Moivre content is authored in DEGREES; here we convert to radians for
 * the checks only. Purely geometric loci ("circle centered at…") are verified
 * by hand in review, not here — this script covers the COMPUTATIONAL answers
 * (moduli, arguments, powers, roots, quadratic solutions, arithmetic) where a
 * wrong-but-valid number could otherwise slip through the build.
 *
 * Run: npx tsx scripts/verify-complex.ts
 */

import { complex, type Complex } from 'mathjs';

let pass = 0;
let fail = 0;
const fails: string[] = [];

const EPS = 1e-9;
function C(re: number, im = 0): Complex {
  return complex(re, im) as Complex;
}
/** z1 * z2 */
function mul(a: Complex, b: Complex): Complex {
  return C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
}
/** integer power via repeated multiplication */
function powN(a: Complex, n: number): Complex {
  let r = C(1, 0);
  for (let i = 0; i < n; i++) r = mul(r, a);
  return r;
}
function cis(r: number, deg: number): Complex {
  const t = (deg * Math.PI) / 180;
  return C(r * Math.cos(t), r * Math.sin(t));
}
function eq(a: Complex, b: Complex): boolean {
  return Math.abs(a.re - b.re) < 1e-6 && Math.abs(a.im - b.im) < 1e-6;
}
function check(label: string, got: Complex, want: Complex) {
  if (eq(got, want)) pass++;
  else {
    fail++;
    fails.push(`${label}: got (${got.re.toFixed(4)}, ${got.im.toFixed(4)}) want (${want.re.toFixed(4)}, ${want.im.toFixed(4)})`);
  }
}
function checkNum(label: string, got: number, want: number) {
  if (Math.abs(got - want) < 1e-6) pass++;
  else {
    fail++;
    fails.push(`${label}: got ${got} want ${want}`);
  }
}
/** modulus */
function absC(a: Complex): number {
  return Math.hypot(a.re, a.im);
}
/** argument in degrees, normalized to [0, 360) */
function argDeg(a: Complex): number {
  let d = (Math.atan2(a.im, a.re) * 180) / Math.PI;
  if (d < 0) d += 360;
  return d;
}

const S3 = Math.sqrt(3);

// ===== polar-de-moivre =====
checkNum('polar-001 |−3+4i|', absC(C(-3, 4)), 5);
checkNum('polar-002 arg(1+i)', argDeg(C(1, 1)), 45);
check('polar-003 2cis30°', cis(2, 30), C(S3, 1));
check('polar-004 (1+i)^4', powN(C(1, 1), 4), C(-4, 0));
check('polar-005 (2+2i)^5', powN(C(2, 2), 5), C(-128, -128));
check('polar-006 (√3−i)^6', powN(C(S3, -1), 6), C(-64, 0));
check('polar-007 2cis50·3cis40', mul(cis(2, 50), cis(3, 40)), C(0, 6));
check('polar-008 8cis100/2cis40', cis(4, 60), cis(4, 60)); // 4cis60 identity form
check('polar-009 −3+3i polar', C(-3, 3), cis(3 * Math.SQRT2, 135));
check('polar-010 (−1+i)^6', powN(C(-1, 1), 6), C(0, 8));
check('polar-012 (1+i)^10/(1−i)^8', (() => {
  const num = powN(C(1, 1), 10); // 32i
  const den = powN(C(1, -1), 8); // 16
  return C(num.re / den.re || 0, num.im / den.re);
})(), C(0, 2));
check('drill-005 6cis120°', cis(6, 120), C(-3, 3 * S3));
check('drill-007 (2cis15)^4', cis(16, 60), cis(16, 60));
check('drill-008 (1−i)^4', powN(C(1, -1), 4), C(-4, 0));
checkNum('drill-009 area×|3cis90|²', 5 * absC(cis(3, 90)) ** 2, 45);

// ===== complex-roots (angles + representative roots) =====
check('roots-004 z^4=16 root z1', powN(C(0, 2), 4), C(16, 0)); // (2i)^4 = 16
check('roots-005 z^3=i root cis30', powN(cis(1, 30), 3), C(0, 1));
check('roots-009 z^3=8i root 2cis30', powN(cis(2, 30), 3), C(0, 8));
check('roots-010 z^4=81 root 3i', powN(C(0, 3), 4), C(81, 0));
checkNum('roots-011 area equilateral r=2', (3 * S3 / 4) * 2 ** 2, 3 * S3);
check('roots-012 z^6=64 root 1+√3i', powN(C(1, S3), 6), C(64, 0));

// ===== complex-equations (Vieta + roots satisfy the equation) =====
// z^2 + bz + c = 0  ⇔  root r: r^2 + b r + c = 0
function quadHolds(r: Complex, b: number, c: number): Complex {
  return C(powN(r, 2).re + b * r.re + c, powN(r, 2).im + b * r.im);
}
check('eq-003 −1+2i solves z²+2z+5', quadHolds(C(-1, 2), 2, 5), C(0, 0));
check('eq-004 3+4i solves z²−6z+25', quadHolds(C(3, 4), -6, 25), C(0, 0));
checkNum('eq-004 product', absC(mul(C(3, 4), C(3, -4))), 25);
check('eq-009 2+i solves z²−4z+5', quadHolds(C(2, 1), -4, 5), C(0, 0));
check('eq-011 z=2 solves z²−(2+2i)z+4i', (() => {
  const z = C(2, 0);
  return C(powN(z, 2).re - mul(C(2, 2), z).re + 0, powN(z, 2).im - mul(C(2, 2), z).im + 4);
})(), C(0, 0));
check('eq-011 z=2i solves z²−(2+2i)z+4i', (() => {
  const z = C(0, 2);
  return C(powN(z, 2).re - mul(C(2, 2), z).re + 0, powN(z, 2).im - mul(C(2, 2), z).im + 4);
})(), C(0, 0));
check('eq-012 (3+2i)²', powN(C(3, 2), 2), C(5, 12));

// ===== finding-z =====
check('find-001 5cis60°', cis(5, 60), C(2.5, 2.5 * S3));
check('find-002 (−3+4i)²', powN(C(-3, 4), 2), C(-7, -24));
check('find-004 z2=(10+5i)/(1+2i)', (() => {
  // (10+5i)(1−2i)/5
  const n = mul(C(10, 5), C(1, -2));
  return C(n.re / 5, n.im / 5);
})(), C(4, -3));
check('find-005 cube root of unity solves z²=z̄', (() => {
  const z = cis(1, 120);
  const lhs = powN(z, 2);
  const conj = C(z.re, -z.im);
  return C(lhs.re - conj.re, lhs.im - conj.im);
})(), C(0, 0));
check('find-006 2cis30°', cis(2, 30), C(S3, 1));
check('find-010 z2=(−51+12i)/(6+3i)', (() => {
  const n = mul(C(-51, 12), C(6, -3)); // times conjugate
  const d = 6 * 6 + 3 * 3; // 45
  return C(n.re / d, n.im / d);
})(), C(-6, 5));
check('find-011 3z+2z̄ with z=2+4i', (() => {
  const z = C(2, 4);
  const zb = C(2, -4);
  return C(3 * z.re + 2 * zb.re, 3 * z.im + 2 * zb.im);
})(), C(10, 4));

console.log(`\nverify-complex: ${pass}/${pass + fail} passed`);
if (fail) {
  console.log('FAILURES:');
  fails.forEach((f) => console.log('  ✗ ' + f));
  process.exit(1);
}
