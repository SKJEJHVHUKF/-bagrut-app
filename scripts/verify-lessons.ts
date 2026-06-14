/**
 * verify-lessons.ts — numeric self-check of every worked-example claim in the
 * 4 new guided lessons (roots / equations / loci / finding-z). Accuracy first.
 *   npx tsx scripts/verify-lessons.ts
 */
import { create, all } from 'mathjs';

const math = create(all);
math.import(
  { cis: (deg: number) => math.complex(Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)) },
  { override: true }
);

let pass = 0;
let fail = 0;
function cx(expr: string) {
  return math.complex(math.evaluate(expr) as never);
}
function eq(desc: string, gotExpr: string, wantExpr: string) {
  const g = cx(gotExpr);
  const w = cx(wantExpr);
  const ok = Math.abs(g.re - w.re) < 1e-9 && Math.abs(g.im - w.im) < 1e-9;
  ok ? pass++ : fail++;
  console.log(`  ${ok ? '✓' : '✗ FAIL'}  ${desc}   (${g} vs ${w})`);
}

console.log('— complex-roots —');
eq('z³=8 root z0',  '(2)^3', '8');
eq('z³=8 root z1',  '(-1+sqrt(3)*i)^3', '8');
eq('z³=8 root z2',  '(-1-sqrt(3)*i)^3', '8');
eq('z³=8 sum=0',    '2 + (-1+sqrt(3)*i) + (-1-sqrt(3)*i)', '0');
eq('z⁴=1 i',        'i^4', '1');
eq('z⁴=1 -1',       '(-1)^4', '1');
eq('z³=i k0',       '(sqrt(3)/2 + (1/2)*i)^3', 'i');
eq('z³=i k1',       '(-sqrt(3)/2 + (1/2)*i)^3', 'i');
eq('z³=i k2',       '(-i)^3', 'i');

console.log('— complex-equations —');
eq('z²+2z+5 @ -1+2i', '(-1+2*i)^2 + 2*(-1+2*i) + 5', '0');
eq('z²+2z+5 @ -1-2i', '(-1-2*i)^2 + 2*(-1-2*i) + 5', '0');
eq('z²-4z+13 product','13', '13');
eq('z²=-7-24i root A', '(-3+4*i)^2', '-7-24*i');
eq('z²=-7-24i root B', '(3-4*i)^2', '-7-24*i');
eq('cc: z1*z2=10+5i',  '(1+2*i)*(4-3*i)', '10+5*i');
eq('cc: poly @ z1',    '(1+2*i)^2 + (-5+i)*(1+2*i) + (10+5*i)', '0');
eq('cc: poly @ z2',    '(4-3*i)^2 + (-5+i)*(4-3*i) + (10+5*i)', '0');

console.log('— gauss-loci —');
eq('|z-(2-3i)| center', 'abs((2+0*i) - (2-3*i))', '3'); // dist center→(2,0) sanity = |3i|=3
eq('|z-1|=|z-5| @ x=3',  'abs((3+7*i)-1) - abs((3+7*i)-5)', '0');
eq('|z+i|=|z-1| @ y=-x', 'abs((2-2*i)+i) - abs((2-2*i)-1)', '0'); // point (2,-2) on y=-x
eq('|z|=2∩Im=1 ptA',    'abs(sqrt(3)+i)', '2');
eq('|z|=2∩Im=1 ptB',    'abs(-sqrt(3)+i)', '2');

console.log('— finding-z —');
eq('zz̄+2z @ -1+4i', '(-1+4*i)*conj(-1+4*i) + 2*(-1+4*i)', '15+8*i');
eq('|5/2+5√3/2 i|=5', 'abs(5/2 + (5*sqrt(3)/2)*i)', '5');
eq('5cis60 = 5/2+..', '5*cis(60)', '5/2 + (5*sqrt(3)/2)*i');
eq('z+1/z @ cis(37) real', 'im(cis(37) + 1/cis(37))', '0'); // |z|=1 ⇒ sum real

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
