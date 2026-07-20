/**
 * verify-analytic.ts — numeric self-check of every worked-example claim in the
 * guided analytic-geometry lessons (ישר, מעגל) + the tagged bagrut questions.
 *   npx tsx scripts/verify-analytic.ts
 *
 * Independent 2D coordinate-geometry arithmetic. A passing build/KaTeX render
 * does NOT catch a wrong-but-valid number — only re-computation does.
 */
import { evaluate } from 'mathjs';

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
// mathjs re-derivation: check a point (x,y) satisfies a locus equation "lhs = rhs".
function onCurve(desc: string, eq: string, x: number, y: number) {
  const [lhs, rhs] = eq.split('=');
  num(desc, evaluate(lhs, { x, y }) as number, evaluate(rhs, { x, y }) as number);
}
// mathjs re-derivation: check a point FAILS an equation (to prove a distractor wrong).
function offCurve(desc: string, eq: string, x: number, y: number) {
  const [lhs, rhs] = eq.split('=');
  const ok = !approx(evaluate(lhs, { x, y }) as number, evaluate(rhs, { x, y }) as number);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? '✓' : '✗ FAIL'}  ${desc} (correctly off-curve)`);
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

console.log('— ag-parabola (y²=2px convention) —');
num('(2,4) on y²=8x', 4 ** 2, 8 * 2);
num('y²=12x: focus x=p/2', 12 / 4, 3); // 2p=12 → p=6 → p/2=3
num('y²=12x: directrix -p/2', -12 / 4, -3);
num('x²=-12y: directrix +p/2', 12 / 4, 3);
num('y² thru (2,4): coeff 2p=8', 4 ** 2 / 2, 8); // 16 = 2p·2
num('y²=4x: |PF|=5 → x_P=4', 5 - 4 / 4, 4);
num('y²=4x: y_P²=16', 4 * 4, 16);
num('(3,6) on y²=12x', 6 ** 2, 12 * 3);
num('tangent y=x+3 double root', (-6) ** 2 - 4 * 1 * 9, 0); // (x+3)²=12x → x²-6x+9=0

console.log('— ag-ellipse —');
num('(5,0) on x²/25+y²/9', 5 ** 2 / 25 + 0 / 9, 1);
num('c²=a²-b² =16', 25 - 9, 16);
num('foci x=c=4', Math.sqrt(16), 4);
num('(2,3) on x²/8+y²/18', 2 ** 2 / 8 + 3 ** 2 / 18, 1);
num('sum dist =6√2', 2 * Math.sqrt(18), 6 * Math.sqrt(2));
num('e=c/a =1/2', Math.sqrt(16 - 12) / 4, 0.5);
num('build a²=8: (2,1) on x²/8+y²/2', 2 ** 2 / 8 + 1 ** 2 / 2, 1);
num('build e=√3/2', Math.sqrt(8 - 2) / Math.sqrt(8), Math.sqrt(3) / 2);

console.log('— ag-loci —');
num('dist 5 from O → 25', 5 ** 2, 25);
num('perp-bisector midpoint (3,3) on 2x+y=9', 2 * 3 + 3, 9);
num('perp-bisector |PA|=|PB| @(3,3)', dist([3, 3], [1, 2]), dist([3, 3], [5, 4]));
num('apollonius pt(-1/3,0): |PA|=2|PB|', dist([-1 / 3, 0], [1, 0]), 2 * dist([-1 / 3, 0], [-1, 0]));
num('apollonius pt(-3,0): |PA|=2|PB|', dist([-3, 0], [1, 0]), 2 * dist([-3, 0], [-1, 0]));
num('apollonius pt(-1/3,0) on circle', (-1 / 3 + 5 / 3) ** 2 + 0, (4 / 3) ** 2);
num('apollonius pt(-3,0) on circle', (-3 + 5 / 3) ** 2 + 0, (4 / 3) ** 2);

console.log('— ag-bag-003 parabola (y²=2px) —');
num('A(2,4) on y²=8x', 4 ** 2, 8 * 2);
num('2p from A = 8', 4 ** 2 / 2, 8);
num('focus x = p/2 = 2', 8 / 4, 2);
num('|AF| = x_A + p/2 = 4', 2 + 8 / 4, 4);
num('|AF| direct', dist([2, 4], [2, 0]), 4);

console.log('— ag-bag-004 ellipse —');
num('b = √(25-9) = 4', Math.sqrt(25 - 9), 4);
num('sum = 2a = 10', 2 * 5, 10);
num('e = c/a = 3/5', 3 / 5, 0.6);

console.log('— ag-bag-005 loci |PB|=2|PA| —');
num('P(2,0): |PB|=2|PA|', dist([2, 0], [4, 0]), 2 * dist([2, 0], [1, 0]));
num('P(2,0) on x²+y²=4', 2 ** 2 + 0 ** 2, 4);
num('P(0,2): |PB|=2|PA|', dist([0, 2], [4, 0]), 2 * dist([0, 2], [1, 0]));
num('P(0,2) on x²+y²=4', 0 ** 2 + 2 ** 2, 4);
num('radius = 2', Math.sqrt(4), 2);
num('A(1,0) dist from O = 1 (<2 → inside)', dist([1, 0], [0, 0]), 1);

console.log('— ag-loci deepened: lesson drills (mathjs re-derivation) —');
// drill-001: dist 3 from origin → x²+y²=9
num('drill001 r²=9', 3 ** 2, 9);
onCurve('drill001 (0,3) on x²+y²=9', 'x^2 + y^2 = 9', 0, 3);
// drill-002: dist 5 from (3,-1) → (x-3)²+(y+1)²=25
num('drill002 (3,4) at dist 5 from (3,-1)', dist([3, 4], [3, -1]), 5);
onCurve('drill002 (3,4) on (x-3)²+(y+1)²=25', '(x-3)^2 + (y+1)^2 = 25', 3, 4);
// drill-003: equidistant (0,0),(4,2) → 2x+y=5
num('drill003 equidist @(1,3)', dist([1, 3], [0, 0]), dist([1, 3], [4, 2]));
onCurve('drill003 (1,3) on 2x+y=5', '2*x + y = 5', 1, 3);
onCurve('drill003 midpoint (2,1) on 2x+y=5', '2*x + y = 5', 2, 1);
offCurve('drill003 distractor x-2y=0 fails @(1,3)', 'x - 2*y = 0', 1, 3);
// drill-004: |PA|=2|PB| A(0,0),B(6,0) → (x-8)²+y²=16, center (8,0)
num('drill004 (4,0) |PA|=2|PB|', dist([4, 0], [0, 0]), 2 * dist([4, 0], [6, 0]));
num('drill004 (12,0) |PA|=2|PB|', dist([12, 0], [0, 0]), 2 * dist([12, 0], [6, 0]));
num('drill004 (8,4) |PA|=2|PB|', dist([8, 4], [0, 0]), 2 * dist([8, 4], [6, 0]));
onCurve('drill004 (8,4) on (x-8)²+y²=16', '(x-8)^2 + y^2 = 16', 8, 4);
// drill-005: sumSq from (3,0),(-3,0)=26 → x²+y²=4
num('drill005 sumSq @(2,0)=26', dist([2, 0], [3, 0]) ** 2 + dist([2, 0], [-3, 0]) ** 2, 26);
num('drill005 sumSq @(0,2)=26', dist([0, 2], [3, 0]) ** 2 + dist([0, 2], [-3, 0]) ** 2, 26);
onCurve('drill005 (2,0) on x²+y²=4', 'x^2 + y^2 = 4', 2, 0);
onCurve('drill005 (0,2) on x²+y²=4', 'x^2 + y^2 = 4', 0, 2);
// drill-006: 2√(16-y²)=2√(x²+y²) → x²+2y²=16
num('drill006 2√(16-y²)=2√(x²+y²) @(√14,1)', 2 * Math.sqrt(16 - 1), 2 * Math.sqrt(14 + 1));
onCurve('drill006 (√14,1) on x²+2y²=16', 'x^2 + 2*y^2 = 16', Math.sqrt(14), 1);
offCurve('drill006 distractor x²+y²=16 fails @(√14,1)', 'x^2 + y^2 = 16', Math.sqrt(14), 1);
// drill-007: midpoints of chords of x²+y²=36 thru (6,0) → (x-3)²+y²=9
num('drill007 OM·AM=0 @(3,3)', 3 * (3 - 6) + 3 * 3, 0);
onCurve('drill007 (3,3) on (x-3)²+y²=9', '(x-3)^2 + y^2 = 9', 3, 3);

console.log('— ag-loci deepened: question bank 006–013 (mathjs re-derivation) —');
// q006: dist 5 from (2,3) → (x-2)²+(y-3)²=25
num('q006 (2,8) dist 5 from (2,3)', dist([2, 8], [2, 3]), 5);
onCurve('q006 (2,8) on (x-2)²+(y-3)²=25', '(x-2)^2 + (y-3)^2 = 25', 2, 8);
// q007: equidistant (1,1),(5,1) → x=3
num('q007 8x=24 → x=3', 24 / 8, 3);
num('q007 equidist @(3,7)', dist([3, 7], [1, 1]), dist([3, 7], [5, 1]));
onCurve('q007 (3,7) on x=3', 'x = 3', 3, 7);
// q008: equidistant two points = line; instance A(0,0),B(4,0) → x=2 (a line, not a circle)
num('q008 equidist @(2,3)', dist([2, 3], [0, 0]), dist([2, 3], [4, 0]));
num('q008 equidist @(2,-5)', dist([2, -5], [0, 0]), dist([2, -5], [4, 0]));
onCurve('q008 (2,3) on x=2', 'x = 2', 2, 3);
onCurve('q008 (2,-5) on x=2', 'x = 2', 2, -5); // two points, same x ⇒ vertical line
// q009: |PA|=3|PB| A(0,0),B(8,0) → (x-9)²+y²=9
num('q009 (6,0) |PA|=3|PB|', dist([6, 0], [0, 0]), 3 * dist([6, 0], [8, 0]));
num('q009 (12,0) |PA|=3|PB|', dist([12, 0], [0, 0]), 3 * dist([12, 0], [8, 0]));
num('q009 (9,3) |PA|=3|PB|', dist([9, 3], [0, 0]), 3 * dist([9, 3], [8, 0]));
onCurve('q009 (9,3) on (x-9)²+y²=9', '(x-9)^2 + y^2 = 9', 9, 3);
// q010: sumSq from (0,3),(0,-3)=50 → x²+y²=16
num('q010 sumSq @(4,0)=50', dist([4, 0], [0, 3]) ** 2 + dist([4, 0], [0, -3]) ** 2, 50);
num('q010 sumSq @(0,4)=50', dist([0, 4], [0, 3]) ** 2 + dist([0, 4], [0, -3]) ** 2, 50);
onCurve('q010 (4,0) on x²+y²=16', 'x^2 + y^2 = 16', 4, 0);
onCurve('q010 (0,4) on x²+y²=16', 'x^2 + y^2 = 16', 0, 4);
// q011: dist from F(0,2) = dist from line y=-2 → parabola x²=8y
num('q011 (4,2) |PF|=dist to y=-2', dist([4, 2], [0, 2]), Math.abs(2 - -2));
onCurve('q011 (4,2) on x²=8y', 'x^2 = 8*y', 4, 2);
onCurve('q011 (-4,2) on x²=8y', 'x^2 = 8*y', -4, 2);
num('q011 convention 2p=8 → focus (0,p/2)=(0,2)', 8 / 4, 2);
// q012: bagrut chord AB=2PO in x²+y²=8 → ellipse x²/8+y²/4=1
num('q012 chord=2PO @y=1 (x²=6)', 2 * Math.sqrt(8 - 1), 2 * Math.sqrt(6 + 1));
onCurve('q012 (√6,1) on x²/8+y²/4=1', 'x^2/8 + y^2/4 = 1', Math.sqrt(6), 1);
onCurve('q012 (√6,1) on x²+2y²=8', 'x^2 + 2*y^2 = 8', Math.sqrt(6), 1);
// q013: sum of distances from (±3,0) = 10 → ellipse x²/25+y²/16=1
num('q013 sumDist @(5,0)=10', dist([5, 0], [-3, 0]) + dist([5, 0], [3, 0]), 10);
num('q013 sumDist @(0,4)=10', dist([0, 4], [-3, 0]) + dist([0, 4], [3, 0]), 10);
num('q013 b²=a²-c²=16', 5 ** 2 - 3 ** 2, 16);
onCurve('q013 (0,4) on x²/25+y²/16=1', 'x^2/25 + y^2/16 = 1', 0, 4);
onCurve('q013 (5,0) on 16x²+25y²=400', '16*x^2 + 25*y^2 = 400', 5, 0);

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);

export {};
