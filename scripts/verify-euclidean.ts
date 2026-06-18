// Verification of every NUMERIC value authored in
// content/lessons/math5/euclidean-geometry.ts (sub-topics + new bagrut).
// Run: npx tsx scripts/verify-euclidean.ts

const TOL = 1e-9;
let passed = 0;
let failed = 0;

function assert(label: string, got: number, want: number) {
  if (Math.abs(got - want) < TOL) {
    passed++;
  } else {
    failed++;
    console.error(`FAIL: ${label} — got ${got}, want ${want}`);
  }
}

// ============================================================
// eg-congruence — lesson examples & questions
// ============================================================

// lesson step "ז.צ.ז ו-צ.צ.צ" example: congruence (no numeric) — skip.
// question eg-sub-cong-003: ∠ADB = 90 (two adjacent equal angles summing 180).
assert('cong-003 ∠ADB', 180 / 2, 90);

// ============================================================
// eg-similarity — lesson examples & questions
// ============================================================

// lesson "מחילוץ אורך": AB=6, DE=9, BC=8 -> EF
{
  const k = 6 / 9; // 2/3
  const EF = 8 / k;
  assert('sim lesson EF', EF, 12);
}

// lesson "יחס שטחים": k=2/5, S2=50 -> S1
{
  const k = 2 / 5;
  const S1 = k * k * 50;
  assert('sim lesson area S1', S1, 8);
}

// lesson "גובה ליתר": AH=4, HB=9 -> CH=6, CA=sqrt(52)
{
  const CH = Math.sqrt(4 * 9);
  assert('sim height CH', CH, 6);
  const AB = 4 + 9;
  const CA = Math.sqrt(4 * AB);
  assert('sim height CA', CA, Math.sqrt(52));
  assert('sim height AB', AB, 13);
}

// eg-sub-sim-001: k=2/3 -> area ratio 4/9
assert('sim-001 area ratio', (2 / 3) ** 2, 4 / 9);

// eg-sub-sim-002: AB=4,DE=6,BC=10 -> EF=15
{
  const k = 4 / 6;
  assert('sim-002 EF', 10 / k, 15);
}

// eg-sub-sim-003: AH=2,HB=8 -> CH=4
assert('sim-003 CH', Math.sqrt(2 * 8), 4);

// eg-sub-sim-004: S1=32,S2=50 -> k=4/5
assert('sim-004 k', Math.sqrt(32 / 50), 4 / 5);

// ============================================================
// eg-thales — lesson examples & questions
// ============================================================

// lesson "הרעיון": AD=3,DB=6,AE=4 -> EC=8
assert('thales lesson EC', (4 * 6) / 3, 8);

// lesson "המכנים": AD=4,AB=10,AC=15 -> AE=6
assert('thales lesson AE', (4 * 15) / 10, 6);

// lesson "תאלס ההפוך": ratios 2/3 == 2/3
assert('thales inverse r1', 2 / 3, 2 / 3);
assert('thales inverse r2', 4 / 6, 2 / 3);

// lesson "קו אמצעים": BC=16 -> DE=8
assert('thales midline DE', 16 / 2, 8);

// lesson "חוצה זווית": AB=8,AC=6,BC=14 -> BD=8,DC=6
{
  const ratio = 8 / 6; // 4/3
  const t = 14 / (4 + 3); // BD=4t, DC=3t
  assert('thales bisector t', t, 2);
  assert('thales bisector BD', 4 * t, 8);
  assert('thales bisector DC', 3 * t, 6);
  // consistency with ratio
  assert('thales bisector ratio', (4 * t) / (3 * t), ratio);
}

// eg-sub-thales-001: AD=4,DB=8,AE=5 -> EC=10
assert('thales-001 EC', (5 * 8) / 4, 10);

// eg-sub-thales-002: third side 20 -> DE=10
assert('thales-002 DE', 20 / 2, 10);

// eg-sub-thales-003: AB=10,AC=6,BD=5 -> DC=3
{
  const ratio = 10 / 6; // 5/3
  const DC = 5 / ratio;
  assert('thales-003 DC', DC, 3);
}

// eg-sub-thales-004: 3/5 == 6/10 -> parallel
assert('thales-004 r1', 3 / 5, 0.6);
assert('thales-004 r2', 6 / 10, 0.6);

// eg-sub-thales-005: trapezoid AB=12, CD=8 -> AM/MC = 3/2
assert('thales-005 ratio', 12 / 8, 3 / 2);

// ============================================================
// eg-circle — lesson examples & questions
// ============================================================

// lesson "מרכזית/היקפית": central 120 -> inscribed 60
assert('circ lesson inscribed', 120 / 2, 60);

// lesson "קוטר": AC=6,BC=8 -> AB=10
assert('circ lesson diameter', Math.sqrt(6 * 6 + 8 * 8), 10);

// lesson "מרובע חסום": A=95,B=70 -> C=85,D=110
assert('circ lesson C', 180 - 95, 85);
assert('circ lesson D', 180 - 70, 110);

// lesson "משיק": r=5, PT=12 -> OP=13
assert('circ lesson OP', Math.sqrt(5 * 5 + 12 * 12), 13);

// lesson "פרופורציה": PT=6, PA=4 -> PB=9, AB=5
{
  const PB = (6 * 6) / 4;
  assert('circ lesson PB', PB, 9);
  assert('circ lesson AB', PB - 4, 5);
}

// eg-sub-circ-001: central 100 -> inscribed 50
assert('circ-001 inscribed', 100 / 2, 50);

// eg-sub-circ-002: inscribed on diameter -> 90
assert('circ-002 right', 180 / 2, 90);

// eg-sub-circ-003: AE=8,EB=3,CE=6 -> ED=4
assert('circ-003 ED', (8 * 3) / 6, 4);

// eg-sub-circ-004: PT=10,PA=5 -> PB=20, AB=15
{
  const PB = (10 * 10) / 5;
  assert('circ-004 PB', PB, 20);
  assert('circ-004 AB', PB - 5, 15);
}

// eg-sub-circ-005: ∠CAB=30, diameter -> ∠ACB=90, ∠ABC=60, ∠BOC=60
assert('circ-005 ACB', 90, 90);
assert('circ-005 ABC', 180 - 90 - 30, 60);
assert('circ-005 BOC', 2 * 30, 60);

// ============================================================
// bagrut questions — numeric parts
// ============================================================

// eg-bag-006 (parallelogram): ∠ABD=35, ∠ADB=80 -> ∠BAD=65, ∠ABC=115
{
  const BAD = 180 - 35 - 80;
  assert('bag-006 BAD', BAD, 65);
  assert('bag-006 ABC', 180 - BAD, 115);
}

// eg-bag-007 (similarity, right triangle): AB=9, AC=12
{
  const BC = Math.sqrt(9 * 9 + 12 * 12);
  assert('bag-007 BC', BC, 15);
  const area = 0.5 * 9 * 12; // 54
  const AH = (2 * area) / BC; // = 108/15 = 7.2
  assert('bag-007 AH', AH, 7.2);
  // BH = AB^2 / BC
  const BH = (9 * 9) / BC;
  assert('bag-007 BH', BH, 5.4);
  const k = 9 / BC; // 3/5
  assert('bag-007 k', k, 3 / 5);
  assert('bag-007 area ratio', k * k, 9 / 25);
  // cross-check area ratio numerically
  const S_ABH = 0.5 * BH * AH; // 19.44
  assert('bag-007 S_ABH', S_ABH, 19.44);
  assert('bag-007 area ratio numeric', S_ABH / area, 9 / 25);
}

// eg-bag-008 (thales / midline): BC=14, AD=5
{
  // D,E midpoints -> ratios both 1/2
  assert('bag-008 ratio AD/AB', 0.5, 0.5);
  const DE = 14 / 2;
  assert('bag-008 DE', DE, 7);
  // centroid divides median 2:1
  assert('bag-008 BG/GE', 2 / 1, 2);
}

// eg-bag-009 (circle, diameter + tangent): ∠ABC=36
{
  assert('bag-009 ACB', 90, 90);
  const BAC = 180 - 90 - 36;
  assert('bag-009 BAC', BAC, 54);
  const APB = 180 - 90 - 36; // tangent perp to diameter -> ∠PAB=90, ∠ABP=36
  assert('bag-009 APB', APB, 54);
  // tangent-chord ∠PAC = ∠ABC = 36
  assert('bag-009 PAC', 36, 36);
}

// ============================================================
// Sanity: existing main-lesson bagrut numerics referenced in summaries
// (eg-bag-007 area cross-check already done) — verify 3-4-5 and others
// ============================================================
assert('pyth 3-4-5', Math.sqrt(3 * 3 + 4 * 4), 5);

// ------------------------------------------------------------
console.log(`\nVerification complete: ${passed}/${passed + failed} passed.`);
if (failed > 0) {
  process.exit(1);
}

export {};
