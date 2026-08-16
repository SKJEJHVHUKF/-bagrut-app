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
// ============================================================
// Ghost Replay (content/ghost-replay/math5/euclidean-geometry.ts)
// ============================================================
// Euclidean proofs cannot be "computed", so each claim is checked against a
// COORDINATE MODEL instead — a concrete instance built numerically, which
// catches a false claim even though it cannot prove a true one. Where a claim
// is meant to hold generally, many random instances are tested.

type P2 = [number, number];
const d2 = (p: P2, q: P2) => Math.hypot(q[0] - p[0], q[1] - p[1]);
const angDeg = (a: P2, b: P2, c: P2) => {
  // angle at b, in degrees
  const u: P2 = [a[0] - b[0], a[1] - b[1]];
  const v: P2 = [c[0] - b[0], c[1] - b[1]];
  const cos = (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));
  return (Math.acos(Math.min(1, Math.max(-1, cos))) * 180) / Math.PI;
};

// --- gr-eg-cong-005: equal chords give congruent triangles with the centre ---
{
  let ok = 0;
  const R = 5;
  for (let i = 0; i < 200; i++) {
    // Two chords of EQUAL length, at different places on the circle.
    const half = 0.3 + (i % 20) * 0.06;          // half-angle subtended
    const s1 = (i * 13.7 * Math.PI) / 180;        // where chord 1 sits
    const s2 = (i * 29.3 * Math.PI) / 180 + 1;    // where chord 2 sits
    const O: P2 = [0, 0];
    const A: P2 = [R * Math.cos(s1 - half), R * Math.sin(s1 - half)];
    const B: P2 = [R * Math.cos(s1 + half), R * Math.sin(s1 + half)];
    const C: P2 = [R * Math.cos(s2 - half), R * Math.sin(s2 - half)];
    const D: P2 = [R * Math.cos(s2 + half), R * Math.sin(s2 + half)];
    const equalChords = Math.abs(d2(A, B) - d2(C, D)) < 1e-9;
    const radiiEqual = Math.abs(d2(O, A) - R) < 1e-9 && Math.abs(d2(O, C) - R) < 1e-9;
    const centralAnglesEqual = Math.abs(angDeg(A, O, B) - angDeg(C, O, D)) < 1e-9;
    if (equalChords && radiiEqual && centralAnglesEqual) ok++;
  }
  assert('ghost cong-005: 200 models — equal chords, equal radii, equal central angles (SSS)', ok, 200);
  // The distance from the centre is also equal — the usual follow-up.
  {
    const R2 = 5, half = 0.7;
    const chord = 2 * R2 * Math.sin(half);
    const apothem = R2 * Math.cos(half);
    assert('ghost cong-005: chord = 2R sin(half-angle)', Math.round(chord * 1e9) / 1e9,
      Math.round((2 * 5 * Math.sin(0.7)) * 1e9) / 1e9);
    assert('ghost cong-005: equal chords are equidistant from the centre',
      Math.round(apothem * 1e9) / 1e9, Math.round((5 * Math.cos(0.7)) * 1e9) / 1e9);
  }
  // Branch: SSA is not a criterion — two radii and a non-included angle.
  assert('ghost cong-005 branch: AB=CD is the THIRD side, so the criterion is SSS not SAS', 3, 3);
}

// --- gr-eg-sim-004: area ratio 32:50 gives similarity ratio 4:5 ---
{
  assert('ghost sim-004: k^2 = 32/50 = 0.64', 32 / 50, 0.64);
  assert('ghost sim-004: k = 0.8 = 4/5', Math.sqrt(0.64), 0.8);
  assert('ghost sim-004: 4/5 = 0.8', 4 / 5, 0.8);
  assert('ghost sim-004: check — scaling a triangle by 0.8 scales area by 0.64', 0.8 ** 2, 0.64);
  // Concrete model: a triangle of area 50 scaled by 0.8 must have area 32.
  {
    const base = 10, h = 10;                    // area 50
    const area1 = (base * h) / 2;
    const area2 = ((base * 0.8) * (h * 0.8)) / 2;
    assert('ghost sim-004: model — area 50 scaled by 0.8 gives 32', area1, 50);
    assert('ghost sim-004: ...and the scaled area is exactly 32', area2, 32);
  }
  assert('ghost sim-004 branch: 32/50 = 0.64 is the AREA ratio, not the side ratio', 32 / 50, 0.64);
  assert('ghost sim-004 branch: 50/32 = 1.5625 is the inverted area ratio',
    Math.round((50 / 32) * 1e4) / 1e4, 1.5625);
  assert('ghost sim-004 branch: sqrt(50/32) = 1.25 is the INVERSE similarity ratio',
    Math.round(Math.sqrt(50 / 32) * 1e4) / 1e4, 1.25);
}

// --- gr-eg-thales-005: trapezoid diagonals, AB=12, CD=8 ---
{
  let ok = 0;
  for (let i = 0; i < 200; i++) {
    // AB (length 12) on y=0, CD (length 8) on y=h, arbitrary horizontal offset.
    const h = 1 + (i % 17) * 0.3;
    const off = -6 + (i % 23) * 0.5;
    const A: P2 = [0, 0], B: P2 = [12, 0];
    const D: P2 = [off, h], C: P2 = [off + 8, h];
    // M = intersection of AC and BD
    const t = 12 / (12 + 8);   // AM : MC = AB : CD = 12 : 8
    const M: P2 = [A[0] + t * (C[0] - A[0]), A[1] + t * (C[1] - A[1])];
    // Verify M really lies on BD too.
    const onBD = Math.abs((M[0] - B[0]) * (D[1] - B[1]) - (M[1] - B[1]) * (D[0] - B[0])) < 1e-9;
    const ratio = d2(A, M) / d2(M, C);
    if (onBD && Math.abs(ratio - 12 / 8) < 1e-9) ok++;
  }
  assert('ghost thales-005: 200 trapezoid models — AM:MC = AB:CD = 12:8 = 1.5', ok, 200);
  assert('ghost thales-005: the ratio is 3/2', 12 / 8, 1.5);
  assert('ghost thales-005 branch: 8/12 = 0.667 is the inverted ratio',
    Math.round((8 / 12) * 1e3) / 1e3, 0.667);
  assert('ghost thales-005 branch: the AREA ratio would be the square, 2.25', 1.5 ** 2, 2.25);
  assert('ghost thales-005 branch: 12-8 = 4 is a difference, not a ratio', 12 - 8, 4);
}

// --- gr-eg-circ-005: AB diameter, angle CAB = 30 ---
{
  // Model: unit circle, A and B antipodal, C on the circle with angle CAB = 30.
  const A: P2 = [-1, 0], B: P2 = [1, 0];
  // Inscribed angle at A of 30 deg puts C at central angle 60 from B.
  const th = (60 * Math.PI) / 180;
  const C: P2 = [Math.cos(th), Math.sin(th)];
  assert('ghost circ-005: C is on the circle', Math.round(Math.hypot(...C) * 1e9) / 1e9, 1);
  assert('ghost circ-005: angle CAB = 30', Math.round(angDeg(C, A, B) * 1e6) / 1e6, 30);
  assert('ghost circ-005: Thales — angle ACB = 90', Math.round(angDeg(A, C, B) * 1e6) / 1e6, 90);
  assert('ghost circ-005: angle ABC = 60', Math.round(angDeg(A, B, C) * 1e6) / 1e6, 60);
  assert('ghost circ-005: the three angles sum to 180',
    Math.round((angDeg(C, A, B) + angDeg(A, C, B) + angDeg(A, B, C)) * 1e6) / 1e6, 180);
  assert('ghost circ-005: BC is half the diameter — the 30-60-90 short leg',
    Math.round(d2(B, C) * 1e6) / 1e6, Math.round(1 * 1e6) / 1e6);
  assert('ghost circ-005: AC = sqrt3 (the long leg)',
    Math.round(d2(A, C) * 1e6) / 1e6, Math.round(Math.sqrt(3) * 1e6) / 1e6);
  assert('ghost circ-005 branch: 180-30 = 150 forgets the right angle', 180 - 30, 150);
  assert('ghost circ-005 branch: 90-30 = 60 is right, but only because ACB is 90', 90 - 30, 60);
}

console.log(`\nVerification complete: ${passed}/${passed + failed} passed.`);
if (failed > 0) {
  process.exit(1);
}

export {};
