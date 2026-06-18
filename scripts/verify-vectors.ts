/**
 * verify-vectors.ts — numeric self-check of every worked-example claim in the
 * 5 guided vectors sub-topic lessons + the fixed drills. Accuracy first.
 *   npx tsx scripts/verify-vectors.ts
 *
 * Uses independent, dependency-free 3D vector arithmetic so it can't inherit a
 * bug from the lesson authoring. A passing build/KaTeX render does NOT catch a
 * wrong-but-valid number — only re-computation does (see lessons_learned).
 */
type V = [number, number, number];
const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (k: number, a: V): V => [k * a[0], k * a[1], k * a[2]];
const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V, b: V): V => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a: V): number => Math.sqrt(dot(a, a));

let pass = 0;
let fail = 0;
const approx = (x: number, y: number) => Math.abs(x - y) < 1e-9;
function num(desc: string, got: number, want: number) {
  const ok = approx(got, want);
  ok ? pass++ : fail++;
  console.log(`  ${ok ? '✓' : '✗ FAIL'}  ${desc}   (${got} vs ${want})`);
}
function vec(desc: string, got: V, want: V) {
  const ok = got.every((g, i) => approx(g, want[i]));
  ok ? pass++ : fail++;
  console.log(`  ${ok ? '✓' : '✗ FAIL'}  ${desc}   ([${got}] vs [${want}])`);
}

console.log('— vec-basics —');
vec('OA', sub([2, 5, -1], [0, 0, 0]), [2, 5, -1]);
vec('AB=B-A', sub([4, 0, 5], [1, 2, 3]), [3, -2, 2]);
vec('BA=-AB', scale(-1, sub([4, 0, 5], [1, 2, 3])), [-3, 2, -2]);
num('|(2,-1,2)|', norm([2, -1, 2]), 3);
vec('2u-w', sub(scale(2, [1, 0, -2]), [3, -1, 1]), [-1, 1, -5]);
vec('midpoint', scale(0.5, add([0, 1, -2], [4, -1, 2])), [2, 0, 0]);
vec('box C=B+AD', add([3, 0, 0], [0, 2, 0]), [3, 2, 0]);
vec("box C'=C+AA'", add([3, 2, 0], [0, 0, 5]), [3, 2, 5]);

console.log('— vec-basic-005 (fixed drill) —');
vec('AB', sub([4, -2, 14], [1, 2, 2]), [3, -4, 12]);
vec('midpoint', scale(0.5, add([1, 2, 2], [4, -2, 14])), [2.5, 0, 8]);
vec('C=A+(1/4)AB', add([1, 2, 2], scale(0.25, [3, -4, 12])), [1.75, 1, 5]);
num('|AB|', norm([3, -4, 12]), 13);

console.log('— vec-dot-product —');
num('(1,2,3)·(4,-1,0)', dot([1, 2, 3], [4, -1, 0]), 2);
num('(2,-1,3)·(1,4,-2)', dot([2, -1, 3], [1, 4, -2]), -8);
num('perp test =0', dot([1, 2, -1], [2, 0, 2]), 0);
num('angle cos=1/2', dot([1, 0, 1], [0, 1, 1]) / (norm([1, 0, 1]) * norm([0, 1, 1])), 0.5);
num('k: 3k-3=0 @k=1', dot([1, 2, -1], [1, 1, 3]), 0); // k=1 substituted
num('right angle @A', dot(sub([2, 1, 2], [0, 0, 0]), sub([-1, 2, 0], [0, 0, 0])), 0);

console.log('— vec-dot-005 (fixed drill) —');
num('@A not 0', dot(sub([1, 1, 1], [3, 3, 2]), sub([3, 0, -1], [3, 3, 2])), 9);
num('@B =0 (right)', dot(sub([3, 3, 2], [1, 1, 1]), sub([3, 0, -1], [1, 1, 1])), 0);
num('|BA|=3', norm(sub([3, 3, 2], [1, 1, 1])), 3);
num('|BC|=3', norm(sub([3, 0, -1], [1, 1, 1])), 3);

console.log('— vec-cross-product —');
vec('i×j', cross([1, 0, 0], [0, 1, 0]), [0, 0, 1]);
vec('(1,2,1)×(2,0,-1)', cross([1, 2, 1], [2, 0, -1]), [-2, 3, -4]);
num('perp to a', dot([1, 2, 1], [-2, 3, -4]), 0);
num('perp to b', dot([2, 0, -1], [-2, 3, -4]), 0);
num('parallelogram area', norm(cross([1, 0, 0], [0, 2, 0])), 2);
vec('AB×AC', cross(sub([0, 1, 0], [1, 0, 0]), sub([0, 0, 1], [1, 0, 0])), [1, 1, 1]);
num('triangle S=√3/2', 0.5 * norm(cross([-1, 1, 0], [-1, 0, 1])), Math.sqrt(3) / 2);
vec('collinear ×=0', cross([1, 2, 3], [-1, -2, -3]), [0, 0, 0]);

console.log('— vec-line-plane (system method) —');
// normal of plane through A(1,0,1),B(2,1,0),C(0,1,2): n=(1,0,1)
num('n·AB=0', dot([1, 0, 1], sub([2, 1, 0], [1, 0, 1])), 0);
num('n·AC=0', dot([1, 0, 1], sub([0, 1, 2], [1, 0, 1])), 0);
num('plane x+z=2 @A', 1 + 1, 2);
num('plane x+z=2 @B', 2 + 0, 2);
num('plane x+z=2 @C', 0 + 2, 2);
// intersection of X=(1,0,2)+t(2,-1,3) with x+y+z=5
{
  const t = 0.5;
  const p = add([1, 0, 2], scale(t, [2, -1, 3]));
  num('intersection t=1/2', 3 + 4 * t, 5);
  vec('intersection point', p, [2, -0.5, 3.5]);
  num('point on plane', p[0] + p[1] + p[2], 5);
}

console.log('— vec-lp-003 (fixed drill, system) —');
// A(1,1,0),B(2,0,1),C(0,2,2): n=(1,1,0)
num('n·AB=0', dot([1, 1, 0], sub([2, 0, 1], [1, 1, 0])), 0);
num('n·AC=0', dot([1, 1, 0], sub([0, 2, 2], [1, 1, 0])), 0);
num('plane x+y=2 @A', 1 + 1, 2);
num('plane x+y=2 @B', 2 + 0, 2);
num('plane x+y=2 @C', 0 + 2, 2);

console.log('— vec-distances-angles —');
// d(P(2,1,-1), 2x-y+2z=4)
num('|n|=3', norm([2, -1, 2]), 3);
num('point-plane d=1', Math.abs(2 * 2 - 1 * 1 + 2 * -1 - 4) / norm([2, -1, 2]), 1);
// angle between planes x+y=3, y+z=1 → 60°
num('plane angle cos=1/2', Math.abs(dot([1, 1, 0], [0, 1, 1])) / (norm([1, 1, 0]) * norm([0, 1, 1])), 0.5);
// angle line (1,0,0) to plane x+y=4 → sin=1/√2 (45°)
num('line-plane sin=1/√2', Math.abs(dot([1, 0, 0], [1, 1, 0])) / (norm([1, 0, 0]) * norm([1, 1, 0])), 1 / Math.sqrt(2));
// distance P(2,3,1) to line Q=0 dir (1,1,1) → √2
num('point-line d=√2', norm(cross([2, 3, 1], [1, 1, 1])) / norm([1, 1, 1]), Math.sqrt(2));

console.log('— capstone vec-bag-001 —');
// A(2,0,0),B(0,3,0),C(0,0,6): n=AB×AC=(18,12,6); plane 3x+2y+z=6
vec('AB×AC', cross(sub([0, 3, 0], [2, 0, 0]), sub([0, 0, 6], [2, 0, 0])), [18, 12, 6]);
num('d(O,plane)=6/√14', Math.abs(-6) / norm([3, 2, 1]), 6 / Math.sqrt(14));
num('area=3√14', 0.5 * norm([18, 12, 6]), 3 * Math.sqrt(14));

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail > 0) process.exit(1);
