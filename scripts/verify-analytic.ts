/**
 * verify-analytic.ts — numeric self-check of every worked-example claim in the
 * guided analytic-geometry lessons (ישר, מעגל) + the tagged bagrut questions.
 *   npx tsx scripts/verify-analytic.ts
 *
 * Independent 2D coordinate-geometry arithmetic. A passing build/KaTeX render
 * does NOT catch a wrong-but-valid number — only re-computation does.
 */
type P = [number, number];
const slope = (p: P, q: P): number => (q[1] - p[1]) / (q[0] - p[0]);
const dist = (p: P, q: P): number => Math.hypot(q[0] - p[0], q[1] - p[1]);
// distance from point (x0,y0) to line a x + b y + c = 0
const distLine = (p: P, a: number, b: number, c: number): number =>
  Math.abs(a * p[0] + b * p[1] + c) / Math.hypot(a, b);

let pass = 0;
let fail = 0;
const approx = (x: number, y: number) => Math.abs(x - y) < 1e-9;
function num(desc: string, got: number, want: number) {
  const ok = approx(got, want);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? '✓' : '✗ FAIL'}  ${desc}   (${got} vs ${want})`);
}

console.log('— ag-line —');
num('(2,5) on y=2x+1', 2 * 2 + 1, 5);
num('slope (1,3)-(4,9)', slope([1, 3], [4, 9]), 2);
num('point-slope y=3x-7 @x=2', 3 * 2 - 7, -1);
num('two-pts slope (1,2)-(3,8)', slope([1, 2], [3, 8]), 3);
num('two-pts y=3x-1 @x=3', 3 * 3 - 1, 8);
num('perp slope of 2', -1 / 2, -0.5);
num('perp y=-x/2+3 @x=4', -4 / 2 + 3, 1);
num('perp product =-1', 2 * (-1 / 2), -1);
num('dist P(3,4)→4x+3y-12=0', distLine([3, 4], 4, 3, -12), 2.4);
num('intersect x: 2x+1=-x+7', (7 - 1) / (2 + 1), 2);
num('intersect y on L1', 2 * 2 + 1, 5);
num('intersect y on L2', -2 + 7, 5);

console.log('— ag-circle —');
num('(5,2) on (x-2)²+(y+2)²=25', (5 - 2) ** 2 + (2 + 2) ** 2, 25);
num('canonical r²=25 → r', Math.sqrt(25), 5);
// complete square: x²+y²-4x+6y-3=0 ⇔ (x-2)²+(y+3)²=16
num('completed form pt (6,-3)', (6 - 2) ** 2 + (-3 + 3) ** 2, 16);
num('orig eq @ (6,-3)=0', 6 ** 2 + (-3) ** 2 - 4 * 6 + 6 * (-3) - 3, 0);
num('complete-sq r=4', Math.sqrt(16), 4);
num('circle center(1,2) thru (4,6): r', dist([1, 2], [4, 6]), 5);
// line y=x-1 ∩ x²+y²=5 → (2,1),(-1,-2)
num('intersect (2,1) on circle', 2 ** 2 + 1 ** 2, 5);
num('intersect (2,1) on line', 2 - 1, 1);
num('intersect (-1,-2) on circle', (-1) ** 2 + (-2) ** 2, 5);
num('intersect (-1,-2) on line', -1 - 1, -2);
// tangent at (4,6) to (x-1)²+(y-2)²=25 → 3x+4y=36
num('(4,6) on circle', (4 - 1) ** 2 + (6 - 2) ** 2, 25);
num('radius slope @(4,6)', slope([1, 2], [4, 6]), 4 / 3);
num('tangent slope -3/4', -1 / (4 / 3), -3 / 4);
num('tangent 3x+4y=36 @(4,6)', 3 * 4 + 4 * 6, 36);
num('tangent dist=center→line=r', distLine([1, 2], 3, 4, -36), 5);
// y=x+k tangent to x²+y²=8 → |k|/√2 = √8
num('tangency |k|=4 (k=4)', distLine([0, 0], 1, -1, 4), Math.sqrt(8));
num('tangency |k|=4 (k=-4)', distLine([0, 0], 1, -1, -4), Math.sqrt(8));

console.log('— ag-bag-001 (line) —');
num('A(7,1) power =50 (>25 outside)', 7 ** 2 + 1 ** 2, 50);
num('slope AB (7,1)-(-3,4)', slope([7, 1], [-3, 4]), -3 / 10);
num('line 3x+10y=31 @A', 3 * 7 + 10 * 1, 31);
num('line 3x+10y=31 @B', 3 * -3 + 10 * 4, 31);
num('dist O→line =31/√109', distLine([0, 0], 3, 10, -31), 31 / Math.sqrt(109));

console.log('— ag-bag-002 (circle) —');
num('P(5,1) on M', (5 - 2) ** 2 + (1 - 1) ** 2, 9);
num('radius OP slope =0', slope([2, 1], [5, 1]), 0);
num('|OQ| Q(6,5) =√32', dist([2, 1], [6, 5]), Math.sqrt(32));
num('√32 = 4√2', Math.sqrt(32), 4 * Math.sqrt(2));

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);

export {};
