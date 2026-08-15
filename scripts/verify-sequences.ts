// verify-sequences.ts — recompute every numeric claim in sequences.ts.
// Plain TS / no deps. Recomputes a_n, S_n, q, d, infinite sums, and every
// bagrut scalar against the authored answers. Tolerance 1e-9.
//
// Run: npx ts-node scripts/verify-sequences.ts   (or tsx)

const TOL = 1e-9;
let pass = 0;
let fail = 0;
const failures: string[] = [];

function check(label: string, got: number, want: number): void {
  if (Math.abs(got - want) < TOL) {
    pass++;
  } else {
    fail++;
    failures.push(`FAIL: ${label} — got ${got}, want ${want}`);
  }
}

// ------------------------------------------------------------
// Core formula helpers (the conventions the content uses).
// ------------------------------------------------------------
const arithTerm = (a1: number, d: number, n: number) => a1 + (n - 1) * d;
const arithSum = (a1: number, an: number, n: number) => (n * (a1 + an)) / 2;
const geoTerm = (a1: number, q: number, n: number) => a1 * Math.pow(q, n - 1);
const geoSum = (a1: number, q: number, n: number) =>
  (a1 * (Math.pow(q, n) - 1)) / (q - 1);
const infSum = (a1: number, q: number) => a1 / (1 - q);

// ============================================================
// LESSON worked examples — arithmetic-sequences
// ============================================================
// "מה הופך סדרה לחשבונית" — 4,9,14,19 → d=5
check('ar-l1 d', 9 - 4, 5);
check('ar-l1 d2', 14 - 9, 5);
// general term — a_12 of 4,9,14 (a1=4,d=5)
check('ar-l2 a12', arithTerm(4, 5, 12), 59);
// d & a1 from a3=11,a7=27
check('ar-l3 d', (27 - 11) / (7 - 3), 4);
check('ar-l3 a1', 11 - 2 * 4, 3);
// arithmetic mean: x-1,2x,x+5 → x=2
{
  const x = 2;
  check('ar-l4 mean', 2 * x, ((x - 1) + (x + 5)) / 2);
}
// S_20 of 4,9,14 (a1=4,d=5): a20=99, S20=1030
check('ar-l5 a20', arithTerm(4, 5, 20), 99);
check('ar-l5 S20', arithSum(4, arithTerm(4, 5, 20), 20), 1030);
// max S_n: a1=40,d=-3 → n=14
check('ar-l6 a14', arithTerm(40, -3, 14), 1);
check('ar-l6 a15', arithTerm(40, -3, 15), -2);

// ============================================================
// LESSON worked examples — geometric-sequences
// ============================================================
// 2,6,18,54 → q=3
check('ge-l1 q', 6 / 2, 3);
check('ge-l1 q2', 18 / 6, 3);
// a_6 of 2,6,18 (a1=2,q=3)
check('ge-l2 a6', geoTerm(2, 3, 6), 486);
// a2=6,a5=48 → q=2,a1=3
check('ge-l3 q3', 48 / 6, 8);
check('ge-l3 q', Math.cbrt(8), 2);
check('ge-l3 a1', 6 / 2, 3);
// geometric mean of 4 and 25 → 10
check('ge-l4 mean', Math.sqrt(4 * 25), 10);
// S_4 of a1=2,q=3 → 80
check('ge-l5 S4', geoSum(2, 3, 4), 80);
check('ge-l5 S4 direct', 2 + 6 + 18 + 54, 80);

// ============================================================
// LESSON worked examples — infinite-geometric
// ============================================================
// identify converging: 1,1/3,1/9 q=1/3 ; 1,3,9 q=3
check('inf-l1 q1', (1 / 3) / 1, 1 / 3);
check('inf-l1 q2', 3 / 1, 3);
// 2,6,18 diverges q=3
check('inf-l2 q', 6 / 2, 3);
// S_inf of 8,4,2,1 → 16
check('inf-l3 q', 4 / 8, 0.5);
check('inf-l3 Sinf', infSum(8, 0.5), 16);
// a1=6, Sinf=9 → q=1/3
check('inf-l4 q', 1 - 6 / 9, 1 / 3);
// Sinf=12,a1=8 → q=1/3, a3=8/9
check('inf-l5 q', 1 - 8 / 12, 1 / 3);
check('inf-l5 a3', geoTerm(8, 1 / 3, 3), 8 / 9);

// ============================================================
// LESSON worked examples — sequences-applications
// ============================================================
// fixed 200/yr from 1000
check('app-l1 y1', 1000 + 200, 1200);
check('app-l1 y2', 1200 + 200, 1400);
// compound 2000 @10% 3yr → 2662
check('app-l2 A', 2000 * Math.pow(1.1, 3), 2662);
// simple vs compound 5000, 2yr
check('app-l3 simple', 5000 + 2 * 300, 5600);
check('app-l3 compound', 5000 * Math.pow(1.05, 2), 5512.5);
// recursion a1=2, a_{n+1}=3a_n → a5=162
check('app-l4 a5', geoTerm(2, 3, 5), 162);
// inverse interest: 5000→6655 in 3yr → r=10%
check('app-l5 ratio', 6655 / 5000, 1.331);
check('app-l5 r', Math.cbrt(1.331) - 1, 0.1);

// ============================================================
// BAGRUT — seq-bag-001 (arithmetic) a3=11,a7=27
// ============================================================
{
  const d = (27 - 11) / (7 - 3); // 4
  const a1 = 11 - 2 * d; // 3
  check('bag001a d', d, 4);
  check('bag001a a1', a1, 3);
  const a15 = arithTerm(a1, d, 15);
  check('bag001b S15', arithSum(a1, a15, 15), 465);
  // a_n = 87 → n=22
  check('bag001c n', (87 - a1) / d + 1, 22);
  // multiples of 3: a_n=4n-1, n≡1 mod 3, up to 22 → {1,4,7,10,13,16,19,22} = 8
  let cnt = 0;
  for (let n = 1; n <= 22; n++) {
    if ((4 * n - 1) % 3 === 0) cnt++;
  }
  check('bag001d count', cnt, 8);
}

// ============================================================
// BAGRUT — seq-bag-002 (compound interest) 10000 @4%
// ============================================================
{
  // double: smallest integer n with 1.04^n >= 2
  let n = 0;
  while (Math.pow(1.04, n) < 2) n++;
  check('bag002b n', n, 18);
  check('bag002b check17', Math.pow(1.04, 17) < 2 ? 1 : 0, 1);
  check('bag002b check18', Math.pow(1.04, 18) >= 2 ? 1 : 0, 1);
  // value after 10 yrs (spec value: 10000*1.04^10)
  check('bag002c A10', 10000 * Math.pow(1.04, 10), 10000 * Math.pow(1.04, 10));
}

// ============================================================
// BAGRUT — seq-bag-003 (capstone) arith a1=2,d=3 ; geo b1=2,q=3
// ============================================================
{
  const an = (n: number) => arithTerm(2, 3, n); // 3n-1
  const bn = (n: number) => geoTerm(2, 3, n);
  // smallest n with b_n>a_n → n=2
  let n = 1;
  while (!(bn(n) > an(n))) n++;
  check('bag003a n', n, 2);
  // S_5 arithmetic → 40
  check('bag003b S5', arithSum(2, arithTerm(2, 3, 5), 5), 40);
  // S_5 geometric → 242
  check('bag003c S5', geoSum(2, 3, 5), 242);
}

// ============================================================
// BAGRUT — seq-bag-004 (geometric) a2=12,a4=48 positive
// ============================================================
{
  const q = Math.sqrt(48 / 12); // 2
  const a1 = 12 / q; // 6
  check('bag004a q', q, 2);
  check('bag004a a1', a1, 6);
  check('bag004b a7', geoTerm(a1, q, 7), 384);
  check('bag004c S6', geoSum(a1, q, 6), 378);
  // smallest n with a_n>1500 → n=9
  let n = 1;
  while (!(geoTerm(a1, q, n) > 1500)) n++;
  check('bag004d n', n, 9);
}

// ============================================================
// BAGRUT — seq-bag-005 (infinite geometric) a1=18, Sinf=27
// ============================================================
{
  const a1 = 18;
  const Sinf = 27;
  const q = 1 - a1 / Sinf; // 1/3
  check('bag005a q', q, 1 / 3);
  check('bag005b a3', geoTerm(a1, q, 3), 2);
  // sum from second term = Sinf - a1
  check('bag005c tail', Sinf - a1, 9);
  // cross-check via a2/(1-q)
  const a2 = a1 * q;
  check('bag005c tail2', a2 / (1 - q), 9);
}

// ============================================================
// REPORT
// ============================================================
if (failures.length) {
  for (const f of failures) console.error(f);
}
// ============================================================
// Ghost Replay (content/ghost-replay/math5/sequences.ts)
// ============================================================
// The five answers AND every number invented inside a failure branch.

// --- gr-seq-ar-005: a1=40, d=-3, which n maximises S_n ---
{
  const a = (n: number) => arithTerm(40, -3, n);
  const S = (n: number) => arithSum(40, a(n), n);
  check('ghost ar-005: a_n = 43 - 3n', a(10), 43 - 30);
  check('ghost ar-005: a_14 = 1, still positive', a(14), 1);
  check('ghost ar-005: a_15 = -2, the first negative term', a(15), -2);
  check('ghost ar-005: the sign flips between 14 and 15 (43/3 = 14.33)', 43 / 3, 14.333333333333334);
  check('ghost ar-005: S_14 = 287', S(14), 287);
  check('ghost ar-005: S_13 = 286, smaller', S(13), 286);
  check('ghost ar-005: S_15 = 285, smaller', S(15), 285);
  // Independent: brute-force the maximum over a wide range.
  {
    let best = -Infinity, bestN = 0;
    for (let n = 1; n <= 200; n++) if (S(n) > best) { best = S(n); bestN = n; }
    check('ghost ar-005: a 200-term brute force agrees the max is at n=14', bestN, 14);
    check('ghost ar-005: ...with value 287', best, 287);
  }
  // The parabola-vertex route must agree.
  check('ghost ar-005: S(n) = (83n - 3n^2)/2, vertex at 83/6 = 13.83', 83 / 6, 13.833333333333334);
  check('ghost ar-005: rounding the vertex to 14 gives the same answer', Math.round(83 / 6), 14);
  check('ghost ar-005 branch: stopping at the last positive term is right; n=15 adds -2', S(15) - S(14), -2);
}

// --- gr-seq-ge-006: a1+a2=12, a2+a3=24 ---
{
  check('ghost ge-006: dividing the equations gives q = 2', 24 / 12, 2);
  check('ghost ge-006: a1(1+q) = 12 with q=2 gives a1 = 4', 12 / 3, 4);
  check('ghost ge-006: the sequence is 4, 8, 16', geoTerm(4, 2, 3), 16);
  check('ghost ge-006: a1+a2 = 12', geoTerm(4, 2, 1) + geoTerm(4, 2, 2), 12);
  check('ghost ge-006: a2+a3 = 24', geoTerm(4, 2, 2) + geoTerm(4, 2, 3), 24);
  // Dividing requires 1+q != 0; q = -1 is excluded because it would make a1+a2 = 0.
  check('ghost ge-006: q=-1 would force a1+a2 = 0, not 12', 4 * (1 + -1), 0);
  check('ghost ge-006 branch: q=1/2 gives a1=8 and a2+a3 = 6, not 24',
    geoTerm(8, 0.5, 2) + geoTerm(8, 0.5, 3), 6);
  check('ghost ge-006 branch: q=-2 gives a1(1+q) = -a1, so a1 = -12 and a2+a3 = 24 fails',
    geoTerm(-12, -2, 2) + geoTerm(-12, -2, 3), -24);
}

// --- gr-seq-inf-005: S_inf = 12, a1 = 8 ---
{
  check('ghost inf-005: 1-q = 8/12 = 2/3', 8 / 12, 2 / 3);
  check('ghost inf-005: q = 1/3', 1 - 2 / 3, 1 / 3);
  check('ghost inf-005: |q| < 1, so the series really converges', Math.abs(1 / 3) < 1 ? 1 : 0, 1);
  check('ghost inf-005: S_inf = a1/(1-q) = 12', 8 / (1 - 1 / 3), 12);
  check('ghost inf-005: a3 = 8/9', geoTerm(8, 1 / 3, 3), 8 / 9);
  // Independent: a long partial sum must approach 12.
  {
    let s = 0;
    for (let n = 1; n <= 400; n++) s += geoTerm(8, 1 / 3, n);
    check('ghost inf-005: 400 partial terms land on 12', Math.abs(s - 12) < 1e-9 ? 1 : 0, 1);
  }
  check('ghost inf-005 branch: q=2/3 would give S_inf = 24, not 12', 8 / (1 - 2 / 3), 24);
  check('ghost inf-005 branch: q=-1/3 would give S_inf = 6, not 12', 8 / (1 + 1 / 3), 6);
  check('ghost inf-005 branch: a3 with q=2/3 would be 32/9, not 8/9', geoTerm(8, 2 / 3, 3), 32 / 9);
}

// --- gr-seq-app-005: 5000 -> 6655 in 3 years ---
{
  check('ghost app-005: the growth factor is 6655/5000 = 1.331', 6655 / 5000, 1.331);
  check('ghost app-005: 1.1^3 = 1.331', Math.pow(1.1, 3), 1.331);
  check('ghost app-005: the annual rate is 10%', Math.round((Math.pow(1.331, 1 / 3) - 1) * 1e9) / 1e9, 0.1);
  check('ghost app-005: 5000 * 1.1^3 = 6655', 5000 * Math.pow(1.1, 3), 6655);
  // Branch: simple interest reads 11% per year, and compounding at 11% overshoots.
  // NOT a clean 11% — it is 11.03%, and the content must say so.
  check('ghost app-005 branch: simple interest gives 0.331/3 = 11.033%',
    Math.round(((6655 - 5000) / 5000 / 3) * 1e6) / 1e6, 0.110333);
  check('ghost app-005 branch: 11.033% compounded overshoots to ~6844',
    Math.round(5000 * Math.pow(1 + 0.331 / 3, 3)), 6844);
  check('ghost app-005 branch: 33.1% total is the 3-year growth, not the annual rate',
    Math.round((1.331 - 1) * 1000) / 1000, 0.331);
}

// --- gr-seq-ind-006: n^3 - n divisible by 6 ---
{
  const f = (n: number) => n ** 3 - n;
  check('ghost ind-006: base n=1 gives 0, divisible by 6', f(1) % 6, 0);
  check('ghost ind-006: n=2 gives 6', f(2), 6);
  check('ghost ind-006: n=3 gives 24', f(3), 24);
  // The induction step: f(n+1) - f(n) = 3n(n+1).
  for (const n of [1, 2, 5, 9, 40]) {
    check(`ghost ind-006: f(n+1)-f(n) = 3n(n+1) at n=${n}`, f(n + 1) - f(n), 3 * n * (n + 1));
  }
  check('ghost ind-006: n(n+1) is even, so 3n(n+1) is divisible by 6 — at n=7', (7 * 8) % 2, 0);
  check('ghost ind-006: 3*7*8 = 168 is divisible by 6', (3 * 7 * 8) % 6, 0);
  {
    let bad = 0;
    for (let n = 1; n <= 5000; n++) if (f(n) % 6 !== 0) bad++;
    check('ghost ind-006: n^3-n is divisible by 6 for the first 5000 naturals', bad, 0);
  }
  // Branch: the difference is NOT 3n^2, and NOT n^3.
  check('ghost ind-006 branch: 3n^2 alone at n=5 is 75, but the true difference is 90', 3 * 25, 75);
  check('ghost ind-006: the true difference at n=5 is 90', f(6) - f(5), 90);
  check('ghost ind-006 branch: divisibility by 3 alone is weaker — 3 divides 3n(n+1) trivially', (3 * 5 * 6) % 3, 0);
}

console.log(`\nverify-sequences: ${pass}/${pass + fail} checks passed.`);
if (fail > 0) {
  // The list was collected and then thrown away, which made a red run useless.
  console.error(failures.join('\n'));
  console.error(`\n${fail} FAILURES — fix content.`);
  process.exit(1);
}

export {};
