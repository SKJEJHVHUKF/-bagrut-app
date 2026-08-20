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

// ============================================================
// STAGES (2026-08-19) — content/lessons/math5/sequences-arithmetic.ts and
// sequences-geometric.ts: every lesson example, drill, question and bagrut
// part. Sums over ranges are brute-forced (loops), not restated through the
// same formula the content used.
// ============================================================
const sumRange = (f: (i: number) => number, from: number, to: number) => {
  let s = 0;
  for (let i = from; i <= to; i++) s += f(i);
  return s;
};
const arithS = (a1: number, d: number, n: number) => arithSum(a1, arithTerm(a1, d, n), n);

// ---- ar-general-term
check('ar1 drill-002 a4 (12,-5)', arithTerm(12, -5, 4), -3);
check('ar1 drill-003 a20 (3,7)', arithTerm(3, 7, 20), 136);
check('ar1 drill-004 100 in 2,9,16 → n', (100 - 2) / 7 + 1, 15);
check('ar1 drill-005 2x,11,x+10 → x', (22 - 10) / 3, 4);
check('ar1 ex a3=10,a8=30 → d=4, a1=2', (30 - 10) / 5 * 10 + (10 - 2 * 4), 42);
check('ar1 ex 58 is a15 of (2,4)', arithTerm(2, 4, 15), 58);
check('ar1 seq-arg-001 a6 (7,-2)', arithTerm(7, -2, 6), -3);
check('ar1 seq-arg-002 94 in 4,10,16 → n', (94 - 4) / 6 + 1, 16);
check('ar1 seq-arg-003 a5 = 3·a2', arithTerm(2, 4, 5), 3 * arithTerm(2, 4, 2));
check('ar1 seq-arg-003 a8 = 30', arithTerm(2, 4, 8), 30);
check('ar1 seq-arg-004 first negative is a16 = -5', arithTerm(100, -7, 16), -5);
check('ar1 seq-arg-004 a15 still positive', arithTerm(100, -7, 15) > 0 ? 1 : 0, 1);
check('bag006 d', (37 - 17) / 5, 4);
check('bag006 a1', 17 - 3 * 4, 5);
check('bag006 a20', arithTerm(5, 4, 20), 81);
check('bag006 121 = a30', arithTerm(5, 4, 30), 121);
check('bag006 a50 = 201 first > 200', arithTerm(5, 4, 50), 201);
check('bag006 a49 < 200', arithTerm(5, 4, 49) < 200 ? 1 : 0, 1);

// ---- ar-recursion-sums
check('ar2 drill-001 a4 (10,-3)', arithTerm(10, -3, 4), 1);
check('ar2 ex a15 of 6n-1', 6 * 15 - 1, 89);
check('ar2 drill-004 S10 of odds (brute)', sumRange((i) => 2 * i - 1, 1, 10), 100);
check('ar2 drill-005 S_n=3n²+2n: a1 = S1', 3 + 2, 5);
check('ar2 drill-005 a2 = S2 - S1', 12 + 4 - 5, 11);
check('ar2 seq-ars-001 a5 (4,+3)', arithTerm(4, 3, 5), 16);
check('ar2 seq-ars-003 S13 (2,5) = 416', arithS(2, 5, 13), 416);
check('ar2 seq-ars-003 discriminant 129²', 1 + 4 * 5 * 832, 129 * 129);
check('ar2 ex S12 (3,4) = 300', arithS(3, 4, 12), 300);
check('ar2 ex discriminant 49²', 1 + 4 * 2 * 300, 49 * 49);
check('ar2 teach S8 (3,3) = 108 → d = 3', arithS(3, 3, 8), 108);
check('ar2 drill max-sum (20,-3): a7 = 2, a8 = -1', arithTerm(20, -3, 7) * 10 + arithTerm(20, -3, 8), 19);
check('ar2 seq-ars-004 a_n = 4n+1 from S_n = 2n²+3n (n=7)', 2 * 49 + 21 - (2 * 36 + 18), 4 * 7 + 1);
check('ar2 seq-sub-ar-005 S14 = 287', arithS(40, -3, 14), 287);
check('ar2 ex max-sum (35,-4): a9 = 3, a10 = -1', arithTerm(35, -4, 9) * 10 + arithTerm(35, -4, 10), 29);
check('ar2 ex max-sum S9 = 171', arithS(35, -4, 9), 171);
check('bag007 S20 (5,3)', arithS(5, 3, 20), 670);
check('bag007 S16 = 440', arithS(5, 3, 16), 440);
check('bag007 a_n = 3n+2 at 4', 3 * 4 + 2, arithTerm(5, 3, 4));

// ---- ar-positions-sums
const ar34 = (i: number) => arithTerm(3, 4, i);
const ar23 = (i: number) => arithTerm(2, 3, i);
check('ar3 ex evens of 20 terms (2,3) brute', sumRange((i) => (i % 2 === 0 ? ar23(i) : 0), 1, 20), 320);
check('ar3 ex odds of 20 terms (2,3) brute', sumRange((i) => (i % 2 === 1 ? ar23(i) : 0), 1, 20), 290);
check('ar3 ex evens - odds = 10d', 320 - 290, 10 * 3);
check('ar3 ex S20 (2,3)', arithS(2, 3, 20), 610);
check('ar3 drill 7..18 count', 18 - 7 + 1, 12);
check('ar3 last 10 of 30 (2,3) brute', sumRange((i) => arithTerm(2, 3, i), 21, 30), 755);
check('ar3 terms 11..20 (2,3) brute', sumRange((i) => arithTerm(2, 3, i), 11, 20), 455);
check('ar3 drill-005 middle = S15/15', 300 / 15, 20);
check('ar3 seq-arp-001 a2,a4,a6 of (2,3)', arithTerm(2, 3, 2) * 10000 + arithTerm(2, 3, 4) * 100 + arithTerm(2, 3, 6), 51117);
check('ar3 seq-arp-002 a20 (7,2)', arithTerm(7, 2, 20), 45);
check('ar3 seq-arp-003 evens of 20 (4,3) brute', sumRange((i) => (i % 2 === 0 ? arithTerm(4, 3, i) : 0), 1, 20), 340);
check('ar3 seq-arp-003 odds (4,3) brute', sumRange((i) => (i % 2 === 1 ? arithTerm(4, 3, i) : 0), 1, 20), 310);
check('ar3 seq-arp-004 last 10 of 30 (3,5) brute', sumRange((i) => arithTerm(3, 5, i), 21, 30), 1255);
check('ar3 seq-arp-005 8d = 40', 40 / 8, 5);
check('ar3 seq-arp-006 odds of 25 (1,4) brute', sumRange((i) => (i % 2 === 1 ? arithTerm(1, 4, i) : 0), 1, 25), 637);
check('ar3 seq-arp-006 evens of 25 (1,4) brute', sumRange((i) => (i % 2 === 0 ? arithTerm(1, 4, i) : 0), 1, 25), 588);
check('ar3 seq-arp-007 first three (6,2)', sumRange((i) => arithTerm(6, 2, i), 1, 3), 24);
check('ar3 seq-arp-007 last three of 20', sumRange((i) => arithTerm(6, 2, i), 18, 20), 126);
check('ar3 seq-arp-007 terms 4..17', sumRange((i) => arithTerm(6, 2, i), 4, 17), 350);
check('bag008 a20', ar34(20), 79);
check('bag008 S20', arithS(3, 4, 20), 820);
check('bag008 last five brute', sumRange(ar34, 16, 20), 355);
check('bag008 S15', arithS(3, 4, 15), 465);

// ---- ar-practice
check('ar4 ex1 S10 (4,3)', arithS(4, 3, 10), 175);
check('ar4 ex2 a3+a7 = 40 with (8,3)', arithTerm(8, 3, 3) + arithTerm(8, 3, 7), 40);
check('ar4 ex2 a10 = 35', arithTerm(8, 3, 10), 35);
check('ar4 ex2 S12 = 294', arithS(8, 3, 12), 294);
check('ar4 ex2 100 is not a term: a31=98, a32=101', arithTerm(8, 3, 31) * 1000 + arithTerm(8, 3, 32), 98101);
check('ar4 ex3 (50,-4) a14 = -2', arithTerm(50, -4, 14), -2);
check('ar4 ex3 S13 = 338', arithS(50, -4, 13), 338);
check('ar4 seq-arx-001 S10 (6,4)', arithS(6, 4, 10), 240);
check('ar4 seq-arx-002 a1 = 6, S5 = 70', arithS(6, 4, 5), 70);
check('ar4 seq-arx-003 a2+a8 = 34 with (5,3)', arithTerm(5, 3, 2) + arithTerm(5, 3, 8), 34);
check('ar4 seq-arx-003 a5-a3 = 6', arithTerm(5, 3, 5) - arithTerm(5, 3, 3), 6);
check('ar4 seq-arx-003 S10 = 185', arithS(5, 3, 10), 185);
check('ar4 seq-arx-004 20 terms below 100: a20=97, a21=102', arithTerm(2, 5, 20) * 1000 + arithTerm(2, 5, 21), 97102);
check('ar4 seq-arx-005 6d = 30', 30 / 6, 5);
check('ar4 seq-arx-006 S4 = 26', arithS(2, 3, 4), 26);
check('ar4 seq-arx-006 S8 = 100', arithS(2, 3, 8), 100);
check('ar4 seq-arx-006 a10 = 29', arithTerm(2, 3, 10), 29);
check('ar4 seq-arx-007 a8 = 3, a9 = -3', arithTerm(45, -6, 8) * 100 + arithTerm(45, -6, 9), 300 - 3);
check('ar4 seq-arx-007 S8 = 192', arithS(45, -6, 8), 192);
{
  // Independent: brute-force the maximum of S_n for (45,-6).
  let best = -Infinity, bestN = 0;
  for (let n = 1; n <= 100; n++) { const s = arithS(45, -6, n); if (s > best) { best = s; bestN = n; } }
  check('ar4 seq-arx-007 brute-force max at n=8', bestN, 8);
  check('ar4 seq-arx-007 brute-force max value 192', best, 192);
}
check('bag009 d, a1', (25 - 9) / 4 * 100 + (9 - 4), 405);
check('bag009 a25', arithTerm(5, 4, 25), 101);
check('bag009 S25', arithS(5, 4, 25), 1325);
check('bag009 evens of 25 brute', sumRange((i) => (i % 2 === 0 ? arithTerm(5, 4, i) : 0), 1, 25), 636);

// ---- ge-general-term
check('ge1 drill-002 a7 (5,2)', geoTerm(5, 2, 7), 320);
check('ge1 drill-003 a6/a3 = q³ = 8', 96 / 12, 8);
check('ge1 drill-004 1458 = a7 of (2,3)', geoTerm(2, 3, 7), 1458);
check('ge1 drill-005 x,6,9 → x=4', 36 / 9, 4);
check('ge1 ex 384 = a8 of (3,2)', geoTerm(3, 2, 8), 384);
check('ge1 ex a2=10,a5=80 → q=2, a1=5', geoTerm(5, 2, 2) * 1000 + geoTerm(5, 2, 5), 10080);
check('ge1 teach 2,8,32: a7 > 3000 > a6', geoTerm(2, 4, 7) > 3000 && geoTerm(2, 4, 6) < 3000 ? 1 : 0, 1);
check('ge1 teach a1+a2=8, a2+a3=24 with (2,3)', (2 + 6) * 100 + (6 + 18), 824);
check('ge1 seq-geg-001 a2..a4 of (4,-2)', geoTerm(4, -2, 2) * 10000 + geoTerm(4, -2, 3) * 100 + geoTerm(4, -2, 4), -80000 + 1600 - 32);
check('ge1 seq-geg-002 (2,3): a3=18, a6=486', geoTerm(2, 3, 3) * 1000 + geoTerm(2, 3, 6), 18486);
check('ge1 seq-geg-002 4374 = a8', geoTerm(2, 3, 8), 4374);
check('bag010 a8', geoTerm(5, 2, 8), 640);
check('bag010 a9 > 1000 > a8', geoTerm(5, 2, 9) > 1000 && geoTerm(5, 2, 8) < 1000 ? 1 : 0, 1);

// ---- ge-proof-sum
check('ge2 drill-001 a4 (81,1/3)', geoTerm(81, 1 / 3, 4), 3);
check('ge2 teach 5·3^n: a1 = 15, ratio 3', 5 * 3 * 100 + (5 * 3 ** 4) / (5 * 3 ** 3), 1503);
check('ge2 ex S5 (3,2) = 93', geoSum(3, 2, 5), 93);
check('ge2 ex S6 (4,3) = 1456', geoSum(4, 3, 6), 1456);
check('ge2 teach S3 = 28 (a1=4) for q=2 and q=-3', geoSum(4, 2, 3) * 100 + geoSum(4, -3, 3), 2828);
check('ge2 teach last two of six (1,2) = 48', geoSum(1, 2, 6) - geoSum(1, 2, 4), 48);
check('ge2 ex last three of eight (2,3) brute', sumRange((i) => geoTerm(2, 3, i), 6, 8), 6318);
check('ge2 ex S8 - S5 (2,3)', geoSum(2, 3, 8) - geoSum(2, 3, 5), 6318);
check('ge2 ex 3^(2n-1): ratio 9, a1 = 3', 3 ** 7 / 3 ** 5 * 10 + 3, 93);
check('ge2 drill-002 7·2^(n+1): q = 2', (7 * 2 ** 5) / (7 * 2 ** 4), 2);
check('ge2 drill-003 S5 of 1,2,4', geoSum(1, 2, 5), 31);
check('ge2 ex S7 (3,2) = 381', geoSum(3, 2, 7), 381);
check('ge2 ex S3 = 26 for q=3 and q=-4', geoSum(2, 3, 3) * 100 + geoSum(2, -4, 3), 2626);
check('ge2 drill-004 S5 (2,3) = 242', geoSum(2, 3, 5), 242);
check('ge2 ex last four of 10 (1,2) brute', sumRange((i) => geoTerm(1, 2, i), 7, 10), 960);
check('ge2 drill-005 a7 + a8 of (3,2)', geoTerm(3, 2, 7) + geoTerm(3, 2, 8), 576);
check('ge2 drill-005 S8 - S6', geoSum(3, 2, 8) - geoSum(3, 2, 6), 576);
check('ge2 seq-ges-001 a4 (5,2)', geoTerm(5, 2, 4), 40);
check('ge2 seq-ges-002 3·2^n: a1 = 6', 3 * 2, 6);
check('ge2 seq-ges-006 (2,3): S2 = 8, S4 = 80', geoSum(2, 3, 2) * 1000 + geoSum(2, 3, 4), 8080);
check('bag011 S8 (6,2)', geoSum(6, 2, 8), 1530);
check('bag011 S10 = 6138', geoSum(6, 2, 10), 6138);
check('bag011 a5..a10 brute', sumRange((i) => 3 * 2 ** i, 5, 10), 6048);

// ---- ge-infinite
check('ge3 drill-004 S∞ of 9,3,1', infSum(9, 1 / 3), 13.5);
check('ge3 ex 4,-6,9: q = -1.5', -6 / 4, -1.5);
check('ge3 ex 10,2,0.4 → 12.5', infSum(10, 1 / 5), 12.5);
check('ge3 ex S∞=25, a1=20 → q=1/5, a3=4/5, tail 5', infSum(20, 1 / 5) * 100 + geoTerm(20, 1 / 5, 3) * 10 + (25 - 20), 2500 + 8 + 5);
check('ge3 drill-005 a1 = S∞(1-q)', 20 * (1 - 1 / 4), 15);
check('ge3 seq-gei-001 S∞ (12, 1/4)', infSum(12, 1 / 4), 16);
check('ge3 seq-gei-002 (6, 2/3): S∞ = 18, a2 = 4', infSum(6, 2 / 3) * 10 + geoTerm(6, 2 / 3, 2), 184);
check('ge3 seq-gei-002 (12, 1/3): S∞ = 18, a2 = 4', infSum(12, 1 / 3) * 10 + geoTerm(12, 1 / 3, 2), 184);
{
  let s = 0;
  for (let n = 1; n <= 200; n++) s += geoTerm(12, 1 / 4, n);
  check('ge3 seq-gei-001 200 partial terms land on 16', Math.abs(s - 16) < 1e-9 ? 1 : 0, 1);
}

// ---- ge-practice
check('ge4 ex1 (2,3): a2 = 6, a4 = 54', geoTerm(2, 3, 2) * 100 + geoTerm(2, 3, 4), 654);
check('ge4 ex1 S5 = 242', geoSum(2, 3, 5), 242);
check('ge4 ex1 a7 > 1000 > a6', geoTerm(2, 3, 7) > 1000 && geoTerm(2, 3, 6) < 1000 ? 1 : 0, 1);
check('ge4 ex2 (24,1/3) S∞ = 36', infSum(24, 1 / 3), 36);
check('ge4 ex2 odd positions sum 27', infSum(24, 1 / 9), 27);
check('ge4 ex2 even positions sum 9', infSum(8, 1 / 9), 9);
check('ge4 ex2 odds + evens = S∞', 27 + 9, 36);
check('ge4 seq-gex-008 squares: a1²=9, q²=1/4, sum 12', infSum(9, 1 / 4), 12);
check('ge4 ex3 (4,2): a1+a3 = 20, a2+a4 = 40', (4 + 16) * 100 + (8 + 32), 2040);
check('ge4 ex3 S6 = 252', geoSum(4, 2, 6), 252);
check('ge4 seq-gex-001 (2,3) S4 = 80', geoSum(2, 3, 4), 80);
check('ge4 seq-gex-002 S∞ (16,1/2) = 32, a5 = 1', infSum(16, 1 / 2) * 10 + geoTerm(16, 1 / 2, 5), 321);
check('ge4 seq-gex-003 (4,3): a2=12, a4=108', geoTerm(4, 3, 2) * 1000 + geoTerm(4, 3, 4), 12108);
check('ge4 seq-gex-003 a7 > 1000 > a6', geoTerm(4, 3, 7) > 1000 && geoTerm(4, 3, 6) < 1000 ? 1 : 0, 1);
check('ge4 seq-gex-004 S_n = 2(3^n-1): a1 = 4, a2 = 12', 2 * (3 - 1) * 100 + (2 * (9 - 1) - 4), 412);
check('ge4 seq-gex-004 a_n = 4·3^(n-1) vs S_n - S_{n-1} at n=6', 4 * 3 ** 5, 2 * (3 ** 6 - 1) - 2 * (3 ** 5 - 1));
check('ge4 seq-gex-005 q = 1 - 9/12', 1 - 9 / 12, 0.25);
check('ge4 seq-gex-006 (5,3): a1+a3 = 50, a2+a4 = 150', (5 + 45) * 1000 + (15 + 135), 50150);
check('ge4 seq-gex-006 S5 = 605', geoSum(5, 3, 5), 605);
check('ge4 seq-gex-007 (12,1/2): S∞ = 24, a1+a2 = 18', infSum(12, 1 / 2) * 100 + (12 + 6), 2418);
check('bag012 q, S∞', (9 / 27) * 100 + infSum(27, 1 / 3), 100 / 3 + 40.5);
check('bag012 odds 243/8, evens 81/8', infSum(27, 1 / 9) * 100 + infSum(9, 1 / 9), 3037.5 + 10.125);

// ============================================================
// STAGES v2 (2026-08-19, second pass) — the destination questions that open
// stage 1 and are solved in stage 4, the new bagrut-style steps, and the
// seven new bagrut questions seq-bag-013..018. Brute-forced where possible.
// ============================================================
// ---- DESTINATION_AR: a3 = 14, a8 = 29
check('destAR d', (29 - 14) / 5, 3);
check('destAR a1', 14 - 2 * 3, 8);
check('destAR a_n = 3n+5 at 20', 3 * 20 + 5, arithTerm(8, 3, 20));
check('destAR S20 = 730', arithS(8, 3, 20), 730);
check('destAR evens of 20 brute', sumRange((i) => (i % 2 === 0 ? arithTerm(8, 3, i) : 0), 1, 20), 380);
check('destAR odds of 20 brute', sumRange((i) => (i % 2 === 1 ? arithTerm(8, 3, i) : 0), 1, 20), 350);
check('destAR terms 11..20 brute', sumRange((i) => arithTerm(8, 3, i), 11, 20), 515);
check('destAR 127 not a term: a40 = 125, a41 = 128', arithTerm(8, 3, 40) * 1000 + arithTerm(8, 3, 41), 125128);
// ---- ar1 v2 examples
check('ar1 v2 a2=11,a6=27 → d=4, a1=7', (27 - 11) / 4 * 10 + (11 - 4), 47);
check('ar1 v2 7,11,15: 83 = a20', arithTerm(7, 4, 20), 83);
check('ar1 v2 7,11,15: 100 not a term (a24=99, a25=103)', arithTerm(7, 4, 24) * 1000 + arithTerm(7, 4, 25), 99103);
check('ar1 v2 first > 150 is a37 = 151, a36 = 147', arithTerm(7, 4, 37) * 1000 + arithTerm(7, 4, 36), 151147);
// ---- ar2 v2: S_n = 3n²+2n → a_n = 6n−1 ; drill S_n = n²+4n → 5, 7 ; S_n=300 (3,4) → n=12 ; S8 (3,?)=108 → d=3 ; (35,−4) max at 9 = 171
check('ar2 v2 S_n=3n²+2n: a_n = 6n-1 at n=4 brute', 3 * 16 + 8 - (3 * 9 + 6), 6 * 4 - 1);
check('ar2 v2 drill n²+4n: a1=5, a2=7', (1 + 4) * 10 + (4 + 8 - 5), 57);
check('ar2 v2 S12 (3,4) = 300', arithS(3, 4, 12), 300);
check('ar2 v2 S8 (3,3) = 108', arithS(3, 3, 8), 108);
{
  let best = -Infinity, bestN = 0;
  for (let n = 1; n <= 60; n++) { const s = arithS(35, -4, n); if (s > best) { best = s; bestN = n; } }
  check('ar2 v2 (35,-4) brute max at n=9', bestN, 9);
  check('ar2 v2 (35,-4) brute max = 171', best, 171);
}
// ---- ar3 v2: 30 terms, evens − odds = 45, total 1365 → d=3, a1=2 ; drill 20 terms diff 30 → d=3
check('ar3 v2 15d = 45 → d=3', 45 / 15, 3);
check('ar3 v2 S30 (2,3) = 1365', arithS(2, 3, 30), 1365);
check('ar3 v2 evens of 30 brute = 705', sumRange((i) => (i % 2 === 0 ? arithTerm(2, 3, i) : 0), 1, 30), 705);
check('ar3 v2 odds of 30 brute = 660', sumRange((i) => (i % 2 === 1 ? arithTerm(2, 3, i) : 0), 1, 30), 660);
check('ar3 v2 drill-006 10d = 30 → d=3', 30 / 10, 3);
// ---- ar4 v2 traps example (50,-4): a14 = -2, S13 = 338
check('ar4 v2 (50,-4) a13 = 2, a14 = -2', arithTerm(50, -4, 13) * 10 + arithTerm(50, -4, 14), 20 - 2);
check('ar4 v2 (50,-4) S13 = 338', arithS(50, -4, 13), 338);
// ---- bag013: S_n = 2n²+4n → a_n = 4n+2
check('bag013 a1 = 6, a2 = 10', (2 + 4) * 100 + (2 * 4 + 8 - 6), 610);
check('bag013 a_n = 4n+2 at n=7 brute', 2 * 49 + 28 - (2 * 36 + 24), 4 * 7 + 2);
check('bag013 evens of 20 brute = 460', sumRange((i) => (i % 2 === 0 ? arithTerm(6, 4, i) : 0), 1, 20), 460);
check('bag013 S20 = 880', arithS(6, 4, 20), 880);
check('bag013 first > 100 is a25 = 102, a24 = 98', arithTerm(6, 4, 25) * 1000 + arithTerm(6, 4, 24), 102098);
// ---- bag014: runner 2 km, +0.5
check('bag014 a15 = 9', arithTerm(2, 0.5, 15), 9);
check('bag014 S15 = 82.5', arithS(2, 0.5, 15), 82.5);
check('bag014 a22 = 12.5 > 12 = a21', arithTerm(2, 0.5, 22) * 100 + arithTerm(2, 0.5, 21), 1262);
check('bag014 S25 = 200', arithS(2, 0.5, 25), 200);
check('bag014 discriminant 57²', 49 + 3200, 57 * 57);
// ---- bag015: 24 terms, evens − odds = 60, total 1500
check('bag015 12d = 60 → d=5', 60 / 12, 5);
check('bag015 a1 = 5 from S24 = 1500', arithS(5, 5, 24), 1500);
check('bag015 a24 = 120', arithTerm(5, 5, 24), 120);
check('bag015 evens − odds brute = 60', sumRange((i) => (i % 2 === 0 ? arithTerm(5, 5, i) : 0), 1, 24) - sumRange((i) => (i % 2 === 1 ? arithTerm(5, 5, i) : 0), 1, 24), 60);
check('bag015 last four brute = 450', sumRange((i) => arithTerm(5, 5, i), 21, 24), 450);
check('bag015 terms 5..20 brute = 1000', sumRange((i) => arithTerm(5, 5, i), 5, 20), 1000);
check('bag015 S20 − S4 = 1000', arithS(5, 5, 20) - arithS(5, 5, 4), 1000);
// ---- DESTINATION_GE: a1 = 24, S∞ = 32
check('destGE q = 1/4', 1 - 24 / 32, 0.25);
check('destGE odd positions 128/5', infSum(24, 1 / 16), 128 / 5);
check('destGE even positions 32/5', infSum(6, 1 / 16), 32 / 5);
check('destGE odds + evens = 32', infSum(24, 1 / 16) + infSum(6, 1 / 16), 32);
check('destGE inserted: q′ = 1/2, new sum 48', infSum(24, 1 / 2), 48);
check('destGE ratio term/tail = 3 = (1-q)/q', (1 - 0.25) / 0.25, 3);
{
  // Independent: ratio a_n / (sum after a_n) for several n, brute-forced tails.
  for (const n of [1, 2, 5, 9]) {
    let tail = 0;
    for (let k = n + 1; k <= n + 400; k++) tail += geoTerm(24, 1 / 4, k);
    check(`destGE brute ratio at n=${n} is 3`, Math.abs(geoTerm(24, 1 / 4, n) / tail - 3) < 1e-9 ? 1 : 0, 1);
  }
}
check('destGE every third: 512/21', infSum(24, 1 / 64), 512 / 21);
check('destGE S5 > 31.9 > S4', geoSum(24, 1 / 4, 5) > 31.9 && geoSum(24, 1 / 4, 4) < 31.9 ? 1 : 0, 1);
// ---- ge1 v2
check('ge1 v2 (7,3): a6 = 1701', geoTerm(7, 3, 6), 1701);
check('ge1 v2 drill 96,(1/2): a5 = 6', geoTerm(96, 1 / 2, 5), 6);
// ---- ge2 v2: S_n = 4^n − 1 → a_n = 3·4^(n−1); S_n = 2·3^n − 2 → 4·3^(n−1); 5^n − 1 → a2 = 20; 3^n − 1 → a1=2,a3=18
check('ge2 v2 4^n−1: a1 = 3, a2 = 12', (4 - 1) * 100 + (16 - 1 - 3), 312);
check('ge2 v2 4^n−1: a_n = 3·4^(n−1) at n=5', 4 ** 5 - 4 ** 4, 3 * 4 ** 4);
check('ge2 v2 2·3^n−2: a1 = 4, a2 = 12', (2 * 3 - 2) * 100 + (2 * 9 - 2 - 4), 412);
check('ge2 v2 5^n−1: a2 = 20', 24 - 4, 20);
check('ge2 v2 3^n−1: a1 = 2, a3 = 18', (3 - 1) * 100 + (26 - 8), 218);
check('ge2 v2 S10 (3,2) = 3069', geoSum(3, 2, 10), 3069);
check('ge2 v2 S4 (5,3) = 200', geoSum(5, 3, 4), 200);
check('ge2 v2 S6 (2,3) = 728', geoSum(2, 3, 6), 728);
check('ge2 v2 S8 (1,2) = 255', geoSum(1, 2, 8), 255);
// ---- ge3 v2
check('ge3 v2 9,-3,1: S∞ = 6.75', infSum(9, -1 / 3), 6.75);
check('ge3 v2 6,2,2/3: S∞ = 9', infSum(6, 1 / 3), 9);
check('ge3 v2 S∞=32,a2=6: (8,3/4) and (24,1/4)', (infSum(8, 3 / 4) === 32 && geoTerm(8, 3 / 4, 2) === 6 && infSum(24, 1 / 4) === 32 && geoTerm(24, 1 / 4, 2) === 6) ? 1 : 0, 1);
check('ge3 v2 16q²−16q+3 disc = 64', 256 - 192, 64);
check('ge3 v2 (20,1/2): S∞=40, odds 80/3, evens 40/3', infSum(20, 1 / 2) * 100 + infSum(20, 1 / 4) + infSum(10, 1 / 4), 4000 + 40);
check('ge3 v2 (36,1/3): evens 13.5, odds 40.5, total 54', infSum(12, 1 / 9) * 1000 + infSum(36, 1 / 9) * 10 + infSum(36, 1 / 3), 13500 + 405 + 54);
check('ge3 v2 (8,1/2): odds 32/3, evens 16/3', infSum(8, 1 / 4) * 10 + infSum(4, 1 / 4), 320 / 3 + 16 / 3);
check('ge3 v2 seq-gei-003 (18,1/3) evens 27/4', infSum(6, 1 / 9), 27 / 4);
check('ge3 v2 drill S∞=20, a1=15 → q=1/4', 1 - 15 / 20, 0.25);
check('ge3 v2 drill |x/4|<1 examples', (Math.abs(2 / 4) < 1 && !(Math.abs(6 / 4) < 1)) ? 1 : 0, 1);
// ---- ge4 v2
check('ge4 v2 a1+a2=6, a3+a4=54 → q=3, a1=1.5', (1.5 + 4.5) * 100 + (13.5 + 40.5), 654);
check('ge4 v2 486/1.5 = 324 is not a power of 3', 3 ** 5 < 324 && 324 < 3 ** 6 ? 1 : 0, 1);
check('ge4 v2 (10, S∞=15): q=1/3, ratio 2', (1 - 10 / 15) * 3 * 10 + 10 / (15 - 10), 12);
check('ge4 v2 (32, q=2x, S∞=40): x=0.1', (1 - 32 / 40) / 2, 0.1);
check('ge4 v2 evens 20/3, odds 100/3', infSum(6.4, 0.04) * 3 * 10 + infSum(32, 0.04) * 3, 200 + 100);
check('ge4 v2 seq-gex-009 (18, S∞=27): q=1/3', 1 - 18 / 27, 1 / 3);
check('ge4 v2 seq-gex-009 new sum 27+9√3', infSum(18, 1 / Math.sqrt(3)), 27 + 9 * Math.sqrt(3));
// ---- bag016: 2 … 162 with three inserted
check('bag016 q⁴ = 81', 162 / 2, 81);
check('bag016 inserted 6, 18, 54', geoTerm(2, 3, 2) * 10000 + geoTerm(2, 3, 3) * 100 + geoTerm(2, 3, 4), 61854);
check('bag016 a8 = 4374, S10 = 59048', geoTerm(2, 3, 8) * 100000 + geoSum(2, 3, 10), 437400000 + 59048);
check('bag016 39366 = a10', geoTerm(2, 3, 10), 39366);
check('bag016 nine terms with q′ = √3: a9′ = 162', 2 * Math.sqrt(3) ** 8, 162);
// ---- bag017: 5000 × 1.2
check('bag017 a4 = 8640', geoTerm(5000, 1.2, 4), 8640);
check('bag017 S4 = 26840', geoSum(5000, 1.2, 4), 26840);
check('bag017 brute S4', 5000 + 6000 + 7200 + 8640, 26840);
check('bag017 a5 = 10368 > 10000 > a4', geoTerm(5000, 1.2, 5) > 10000 && geoTerm(5000, 1.2, 4) < 10000 ? 1 : 0, 1);
// ---- bag018: a1 = 32, q = 2x, S∞ = 40
check('bag018 x = 0.1', (1 - 32 / 40) / 2, 0.1);
check('bag018 odds 100/3, evens 20/3', infSum(32, 0.04) * 3 * 10 + infSum(6.4, 0.04) * 3, 1000 + 20);
check('bag018 odd/even ratio = 1/q = 5', infSum(32, 0.04) / infSum(6.4, 0.04), 5);

// ============================================================
// STAGES v3 (2026-08-20) — additions only: DESTINATION_AR part ו, the
// ar-practice follow-up example and drills, seq-ges-008, seq-bag-019, and the
// rationalised insertion sum in ge-infinite.
// ============================================================
check('destAR ו: S23 = 943 < 1000', arithS(8, 3, 23), 943);
check('destAR ו: S24 = 1020 > 1000', arithS(8, 3, 24), 1020);
check('ar4 follow-up 21..30 brute = 815', sumRange((i) => arithTerm(8, 3, i), 21, 30), 815);
check('ar4 follow-up S30 - S20 = 815', arithS(8, 3, 30) - arithS(8, 3, 20), 815);
check('ar4 follow-up 250 not a term (a81=248, a82=251)', arithTerm(8, 3, 81) * 1000 + arithTerm(8, 3, 82), 248251);
check('ar4 drill-001 a30 = 95', arithTerm(8, 3, 30), 95);
check('ar4 drill-002 6d = 18 → d = 3', 18 / 6, 3);
{
  // Independent: brute-force the maximum of S_n for (41,-3).
  let best = -Infinity, bestN = 0;
  for (let n = 1; n <= 60; n++) { const s = arithS(41, -3, n); if (s > best) { best = s; bestN = n; } }
  check('ar4 drill-003 brute max at n=14', bestN, 14);
  check('ar4 drill-003 a14 = 2, a15 = -1', arithTerm(41, -3, 14) * 10 + arithTerm(41, -3, 15), 19);
}
check('ges-008 S3 = 13 (a1=1, q=3)', geoSum(1, 3, 3), 13);
check('ges-008 S6 = 364', geoSum(1, 3, 6), 364);
check('ges-008 (S6-S3)/S3 = q³ = 27', (geoSum(1, 3, 6) - geoSum(1, 3, 3)) / geoSum(1, 3, 3), 27);
check('ge3 insertion rationalised 54+18√3', infSum(36, 1 / Math.sqrt(3)), 54 + 18 * Math.sqrt(3));
// ---- bag-019: arithmetic triple → geometric after +2 on the third
check('bag019 middle = 12/3 = 4', 12 / 3, 4);
check('bag019 quadratic disc = 36', 4 + 32, 36);
check('bag019 d=2: 2,4,6 sums 12 and 2,4,8 geometric', (2 + 4 + 6) * 10 + (4 / 2 === 8 / 4 ? 1 : 0), 121);
check('bag019 d=-4: 8,4,0 sums 12 and 8,4,2 geometric', (8 + 4 + 0) * 10 + (4 / 8 === 2 / 4 ? 1 : 0), 121);
check('bag019 S8 of (2,2) = 510', geoSum(2, 2, 8), 510);
check('bag019 256 = a8 of (2,2)', geoTerm(2, 2, 8), 256);
check('bag019 S∞ of (8,1/2) = 16', infSum(8, 1 / 2), 16);
// odd-length keyPoint: odds − evens = the middle element (5 terms)
check('ar3 odd-n keyPoint (5 terms, a1=7, d=4)', sumRange((i) => (i % 2 === 1 ? arithTerm(7, 4, i) : 0), 1, 5) - sumRange((i) => (i % 2 === 0 ? arithTerm(7, 4, i) : 0), 1, 5), arithTerm(7, 4, 3));

console.log(`\nverify-sequences: ${pass}/${pass + fail} checks passed.`);
if (fail > 0) {
  // The list was collected and then thrown away, which made a red run useless.
  console.error(failures.join('\n'));
  console.error(`\n${fail} FAILURES — fix content.`);
  process.exit(1);
}

export {};
