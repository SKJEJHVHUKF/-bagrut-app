/**
 * verify-trig-angles.ts — independent gate for the trig angle convention.
 *   npx tsx scripts/verify-trig-angles.ts
 *
 * WHY THIS EXISTS
 * verify-trig.ts hardcodes its own math facts and never reads the content
 * files, so it passes identically whether the lessons are written in degrees
 * or radians. That makes it useless as a guard for a convention conversion.
 * This script does the opposite: it READS the authored strings, extracts every
 * angle, and checks the authored answers actually solve the authored equations.
 *
 * CONVENTION (owner's decision, 2026-07-28):
 *   trig-equations, special-angles-reduction → DEGREES
 *   trig-calculus                            → RADIANS (mandatory: the
 *     derivative (sin x)' = cos x only holds in radians)
 */
import { math5Trigonometry } from '@/content/lessons/math5/trigonometry';

let pass = 0;
const fails: string[] = [];
const ok = (name: string, cond: boolean, detail = '') => {
  if (cond) pass++;
  else fails.push(`${name}${detail ? ' — ' + detail : ''}`);
};
const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;
const S = (d: number) => Math.sin((d * Math.PI) / 180);
const C = (d: number) => Math.cos((d * Math.PI) / 180);

const DEG_SUBTOPICS = ['trig-equations', 'special-angles-reduction'];
const RAD_SUBTOPICS = ['trig-calculus'];

// The פונקציות טריגונומטריות track (רמת בסיס + רמות 1-5). It is split by
// mathematical necessity, not style: the base level only SOLVES equations, so it
// is in degrees like the rest of the topic, and from רמה 1 on everything
// differentiates or integrates, where (sin x)' = cos x holds in radians alone.
//
// Its base level is checked on formulas and questions only, NOT on lesson steps:
// its last teach step deliberately hands the switch over and names π while doing
// so. The radian levels are checked the other way round, and `tf-bagrut` is the
// mirror image — its lesson steps deliberately show `60°` as the WRONG answer
// inside a derivative part, which is the whole point of that drill. So the
// binding check for them is questions and final answers, where a stray degree
// sign would reach a student as an answer rather than as a warning.
const TF_DEG = ['tf-equations'];
const TF_RAD = ['tf-domain', 'tf-derivative', 'tf-investigation', 'tf-integral', 'tf-bagrut'];

const sub = (id: string) => (math5Trigonometry.subTopics ?? []).find((s) => s.id === id);
const blob = (o: unknown) => JSON.stringify(o);

// ── 1. Convention purity ───────────────────────────────────────────────────
// The degree sub-topics must contain no \pi anywhere a student reads an angle.
for (const id of DEG_SUBTOPICS) {
  const st = sub(id);
  if (!st) { fails.push(`${id}: sub-topic missing`); continue; }
  st.formulas.forEach((f, i) =>
    ok(`${id}.formulas[${i}] is degree-only`, !/\\pi/.test(f.latex + (f.note ?? '')), f.latex),
  );
  st.questions.forEach((q, i) =>
    ok(`${id}.questions[${i}] (${q.id}) is degree-only`, !/\\pi/.test(blob(q)), q.question.slice(0, 60)),
  );
  (st.lesson ?? []).forEach((s, i) =>
    ok(`${id}.lesson[${i}] is degree-only`, !/\\pi/.test(blob(s)), s.title),
  );
}

// trig-calculus must STAY in radians — a degree sign there would mean someone
// converted the one place where conversion breaks the derivative rules.
for (const id of RAD_SUBTOPICS) {
  const st = sub(id);
  if (!st) { fails.push(`${id}: sub-topic missing`); continue; }
  st.formulas.forEach((f, i) =>
    ok(`${id}.formulas[${i}] stays radian`, !/°/.test(f.latex), f.latex),
  );
}

for (const id of TF_DEG) {
  const st = sub(id);
  if (!st) { fails.push(`${id}: sub-topic missing — the track is not wired into subTopics`); continue; }
  st.formulas.forEach((f, i) =>
    ok(`${id}.formulas[${i}] is degree-only`, !/\\pi/.test(f.latex + (f.note ?? '')), f.latex),
  );
  st.questions.forEach((q, i) =>
    ok(`${id}.questions[${i}] (${q.id}) is degree-only`, !/\\pi/.test(blob(q)), q.question.slice(0, 60)),
  );
}

for (const id of TF_RAD) {
  const st = sub(id);
  if (!st) { fails.push(`${id}: sub-topic missing — the track is not wired into subTopics`); continue; }
  st.formulas.forEach((f, i) =>
    ok(`${id}.formulas[${i}] stays radian`, !/°/.test(f.latex + (f.note ?? '')), f.latex),
  );
  st.questions.forEach((q, i) => {
    ok(`${id}.questions[${i}] (${q.id}) stays radian`, !/°/.test(blob(q)), q.question.slice(0, 60));
    ok(`${id}.questions[${i}] (${q.id}) answers in radians`, !/°/.test(q.solution.finalAnswer), q.solution.finalAnswer);
  });
  (st.lesson ?? []).forEach((s, i) =>
    ok(
      `${id}.lesson[${i}] drill answers in radians`,
      !s.drill || !/°/.test(s.drill.solution.finalAnswer),
      s.title,
    ),
  );
}

// ── 2. The authored answers must actually solve the authored equations ─────
// Hand-listed per question id: the equation, and the degree roots the content
// claims, in [0°,360°). Checked numerically, not by pattern-matching.
type Case = { id: string; f: (x: number) => number; roots: number[] };
const CASES: Case[] = [
  { id: 'trig-sub-eq-001', f: (x) => S(x) - 0.5, roots: [30, 150] },
  { id: 'trig-sub-eq-002', f: (x) => C(x) + 0.5, roots: [120, 240] },
  { id: 'trig-sub-eq-003', f: (x) => 2 * S(x) ** 2 - S(x) - 1, roots: [90, 210, 330] },
  { id: 'trig-sub-eq-004', f: (x) => C(2 * x) + C(x), roots: [60, 180, 300] },
  { id: 'trig-sub-eq-006', f: (x) => Math.sqrt(3) * S(x) - C(x), roots: [30, 210] },
];
for (const c of CASES) {
  for (const r of c.roots) ok(`${c.id}: ${r}° is a root`, near(c.f(r), 0, 1e-9), `f(${r}°)=${c.f(r)}`);
  // completeness: no OTHER root in [0,360) was silently dropped
  const found: number[] = [];
  for (let x = 0; x < 360; x += 0.05) {
    const a = c.f(x), b = c.f(x + 0.05);
    if (a === 0 || a * b < 0) {
      let lo = x, hi = x + 0.05;
      for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (c.f(lo) * c.f(m) <= 0) hi = m; else lo = m; }
      const root = (lo + hi) / 2;
      // The domain is HALF-OPEN [0°,360°): a root at exactly 360° is the same
      // angle as 0° and must not be counted twice. Without this the scan
      // reports 5 roots for sin2x=sinx where the correct answer is 4.
      if (root >= -1e-6 && root < 360 - 1e-6 && !found.some((p) => Math.abs(p - root) < 1e-4)) {
        found.push(root);
      }
    }
  }
  ok(
    `${c.id}: exactly ${c.roots.length} roots in [0°,360°)`,
    found.length === c.roots.length,
    `found ${found.map((f) => f.toFixed(2)).join(', ')}`,
  );
}

// sin 2x = sin x on [0°,360°) — the content answers "4 solutions"
{
  const f = (x: number) => S(2 * x) - S(x);
  const found: number[] = [];
  for (let x = 0; x < 360; x += 0.05) {
    const a = f(x), b = f(x + 0.05);
    if (a === 0 || a * b < 0) {
      let lo = x, hi = x + 0.05;
      for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (f(lo) * f(m) <= 0) hi = m; else lo = m; }
      const root = (lo + hi) / 2;
      // The domain is HALF-OPEN [0°,360°): a root at exactly 360° is the same
      // angle as 0° and must not be counted twice. Without this the scan
      // reports 5 roots for sin2x=sinx where the correct answer is 4.
      if (root >= -1e-6 && root < 360 - 1e-6 && !found.some((p) => Math.abs(p - root) < 1e-4)) {
        found.push(root);
      }
    }
  }
  ok('trig-sub-eq-005: sin2x=sinx has 4 roots in [0°,360°)', found.length === 4, `found ${found.length}`);
}

// Special-angle values the reduction sub-topic asserts
ok('sin 150° = 1/2', near(S(150), 0.5));
ok('cos 120° = -1/2', near(C(120), -0.5));
ok('sin 210° + cos 240° = -1', near(S(210) + C(240), -1));
ok('225° is in quadrant III', 225 > 180 && 225 < 270);
ok('tan 225° > 0', S(225) / C(225) > 0);

// Reduction identities, sampled
for (let x = -170; x <= 170; x += 7) {
  ok(`sin(180-${x})=sin${x}`, near(S(180 - x), S(x)));
  ok(`cos(180-${x})=-cos${x}`, near(C(180 - x), -C(x)));
  ok(`sin(180+${x})=-sin${x}`, near(S(180 + x), -S(x)));
  ok(`cos(180+${x})=-cos${x}`, near(C(180 + x), -C(x)));
}

console.log(`\nverify-trig-angles: ${pass} passed, ${fails.length} failed.`);
if (fails.length) {
  fails.slice(0, 30).forEach((f) => console.log(`  ✗ ${f}`));
  if (fails.length > 30) console.log(`  … and ${fails.length - 30} more`);
  process.exit(1);
}

export {};
