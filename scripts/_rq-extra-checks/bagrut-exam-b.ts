// Numeric re-derivation of the בגרות rung of רמה 8, set B (fn-bag-rq-013 … 015).
// Bound to the LIVE content: every question is fetched from ROOT_QUOTIENT_BAGRUT by id,
// its text must contain the function this file differentiates, each machine-graded
// `expected` is compared with the value computed here, and every ```signtable cell is
// re-derived by evaluating the row's expression at a point of its column.
//
//   npx tsx scripts/_rq-extra-checks/bagrut-exam-b.ts
import { check, dcheck, checkSet, icheck, summary, E } from './_lib';
import { ROOT_QUOTIENT_BAGRUT } from '../../content/lessons/math5/functions-root-quotient';
import type { BagrutQuestionPart, StaticBagrutQuestion } from '../../content/lessons/types';

const sq = Math.sqrt;
const yes = (label: string, cond: boolean) => check(label, cond ? 1 : 0, 1);

// ---------------------------------------------------------------- binding helpers
function question(id: string): StaticBagrutQuestion {
  const q = ROOT_QUOTIENT_BAGRUT.find((b) => b.id === id);
  yes(`${id} is in ROOT_QUOTIENT_BAGRUT`, !!q);
  if (!q) throw new Error(`${id} missing — nothing else can be checked`);
  yes(`${id} sits on rq-bagrut-mixed`, q.subTopicId === 'rq-bagrut-mixed');
  return q;
}
function part(q: StaticBagrutQuestion, label: string): BagrutQuestionPart {
  const p = q.parts.find((x) => x.label === label);
  yes(`${q.id}/${label} exists`, !!p);
  if (!p) throw new Error(`${q.id}/${label} missing`);
  return p;
}
const all = (p: BagrutQuestionPart) => [p.prompt, ...p.hints, ...p.solution.steps, p.solution.final_answer].join('\n');
const says = (where: string, hay: string, literal: string) => yes(`${where} states ${literal}`, hay.includes(literal));
function expectValue(where: string, p: BagrutQuestionPart, want: number) {
  const e = p.expected as { kind: string; value?: string } | undefined;
  yes(`${where} expected is a value`, e?.kind === 'value');
  check(`${where} expected = ${want}`, E(e?.value ?? 'NaN'), want);
}
function expectSet(where: string, p: BagrutQuestionPart, want: number[]) {
  const e = p.expected as { kind: string; values?: string[] } | undefined;
  yes(`${where} expected is an ordered set`, e?.kind === 'set');
  const got = (e?.values ?? []).map((v) => E(v));
  check(`${where} expected has ${want.length} values`, got.length, want.length);
  want.forEach((w, i) => check(`${where} expected[${i}] = ${w}`, got[i], w));
  check(`${where} one label per value`, p.answerLabels?.length ?? 0, want.length);
}

/** Every ```signtable of a part, parsed. */
const tables = (p: BagrutQuestionPart) =>
  [...p.solution.steps.join('\n').matchAll(/```signtable\s*\n([\s\S]*?)```/g)].map(
    (m) => JSON.parse(m[1]) as { cols: unknown[]; rows: { label: string; cells: string[]; result?: boolean }[] },
  );
const sign = (v: number) => (Math.abs(v) < 1e-12 ? '0' : v > 0 ? '+' : '-');
/** Compare one table row with an expression evaluated at a sample x per column.
 *  `fn` returns null where the row is undefined ('out'); empty cells are skipped;
 *  max/min cells must sit on a zero. */
function row(where: string, tbl: ReturnType<typeof tables>[number] | undefined, label: string, xs: number[], fn: (x: number) => number | null) {
  const r = tbl?.rows.find((x) => x.label === label);
  yes(`${where} has a row ${label}`, !!r);
  if (!r) return;
  check(`${where} row ${label} has one cell per sample`, r.cells.length, xs.length);
  r.cells.forEach((cell, i) => {
    if (cell === '') return;
    const v = fn(xs[i]);
    const want = v === null ? 'out' : sign(v);
    const got = cell === 'max' || cell === 'min' ? '0' : cell;
    yes(`${where} ${label} at column ${i + 1} (x = ${xs[i].toFixed(3)}) is ${want}`, got === want);
  });
}
/** Real zero count of `fn - k` on a grid, counting touches as local minima of |fn - k|. */
function countSolutions(fn: (x: number) => number, k: number, pieces: [number, number][], n = 200000) {
  let count = 0;
  for (const [lo, hi] of pieces) {
    const xs = Array.from({ length: n + 1 }, (_, i) => lo + ((hi - lo) * i) / n);
    const d = xs.map((x) => fn(x) - k);
    for (let i = 0; i < n; i++) {
      if (!Number.isFinite(d[i]) || !Number.isFinite(d[i + 1])) continue;
      if (d[i] === 0) count++;
      else if (d[i] * d[i + 1] < 0) count++;
    }
    if (d[n] === 0) count++;
    for (let i = 1; i < n; i++) {
      const a = Math.abs(d[i - 1]), b = Math.abs(d[i]), c = Math.abs(d[i + 1]);
      if (b < a && b <= c && b < 1e-6 && d[i - 1] * d[i + 1] > 0 && d[i] !== 0) count++;
    }
  }
  return count;
}
/** House limits: question text ≤ 1200 chars, solution ≤ 3500, 3 hints, ≤ 15 steps, plain labels. */
function shape(q: StaticBagrutQuestion) {
  for (const p of q.parts) {
    const w = `${q.id}/${p.label}`;
    yes(`${w} question text ≤ 1200 chars`, (q.context + p.prompt).length <= 1200);
    const sol = p.solution.steps.join('\n\n').length + p.solution.final_answer.length;
    yes(`${w} solution ≤ 3500 chars (${sol})`, sol <= 3500);
    check(`${w} has exactly 3 hints`, p.hints.length, 3);
    yes(`${w} has 5–15 steps (${p.solution.steps.length})`, p.solution.steps.length >= 5 && p.solution.steps.length <= 15);
    yes(`${w} opens with the rule line`, p.solution.steps[0].startsWith('**הכלל:**'));
    const fi = p.solution.steps.findIndex((s) => s.startsWith('**הנוסחה:**'));
    const si = p.solution.steps.findIndex((s) => s.startsWith('**ההצבה:**'));
    yes(`${w} formula line before substitution`, fi >= 0 && (si < 0 || fi < si));
    for (const l of p.answerLabels ?? []) yes(`${w} label "${l}" plain and short`, !/[$\\]/.test(l) && l.length <= 28);
  }
}

// ================================================================= 013
{
  const q = question('fn-bag-rq-013');
  shape(q);
  says('013 context', q.context, '$f(x) = \\sqrt{\\dfrac{x^2 - a}{x^2 - 4}}$');
  const qa = (a: number) => (x: number) => (x * x - a) / (x * x - 4);
  const fa = (a: number) => (x: number) => {
    const v = qa(a)(x);
    return Math.abs(x * x - 4) < 1e-15 || v < 0 ? NaN : sq(v);
  };

  // א — domain from the sign table of the inner quotient, for several a > 4
  const A = part(q, 'א');
  for (const a of [5, 9, 36]) {
    const r = sq(a);
    const inDomain = (x: number) => x <= -r || (-2 < x && x < 2) || x >= r;
    let bad = 0;
    for (let i = 0; i <= 40000; i++) {
      const x = -12 + (24 * i) / 40000;
      if (Math.abs(Math.abs(x) - 2) < 1e-9) continue;
      if (inDomain(x) !== qa(a)(x) >= -1e-12) bad++;
    }
    check(`013/א a = ${a}: radicand ≥ 0 exactly on the stated domain (grid)`, bad, 0);
    check(`013/א a = ${a}: radicand is 0 at ±√a`, qa(a)(r), 0);
    const [t] = tables(A);
    const xs = [-r - 1, -r, (-r - 2) / 2, -2, 0, 2, (2 + r) / 2, r, r + 1];
    row(`013/א a = ${a}`, t, '$x^2 - a$', xs, (x) => x * x - a);
    row(`013/א a = ${a}`, t, '$x^2 - 4$', xs, (x) => x * x - 4);
    row(`013/א a = ${a}`, t, '$\\dfrac{x^2 - a}{x^2 - 4}$', xs, (x) => (Math.abs(x * x - 4) < 1e-12 ? null : qa(a)(x)));
  }
  says('013/א', A.solution.final_answer, '$x \\le -\\sqrt{a}$ או $-2 < x < 2$ או $x \\ge \\sqrt{a}$');

  // ב — asymptotes x = ±2 (from inside the middle interval), y = 1, and the axis points
  const B = part(q, 'ב');
  for (const a of [9, 36]) {
    yes(`013/ב a = ${a}: f → ∞ as x → 2 from inside`, fa(a)(2 - 1e-7) > 1e3);
    yes(`013/ב a = ${a}: f → ∞ as x → -2 from inside`, fa(a)(-2 + 1e-7) > 1e3);
    yes(`013/ב a = ${a}: numerator 4 - a < 0 at x = ±2`, 4 - a < 0);
    check(`013/ב a = ${a}: f → 1 as x → ∞`, fa(a)(1e7), 1, 1e-9);
    check(`013/ב a = ${a}: f → 1 as x → -∞`, fa(a)(-1e7), 1, 1e-9);
    check(`013/ב a = ${a}: f(±√a) = 0`, fa(a)(sq(a)) + fa(a)(-sq(a)), 0);
    check(`013/ב a = ${a}: f(0) = √a/2`, fa(a)(0), sq(a) / 2);
  }
  says('013/ב', B.solution.final_answer, '$y = 1$');
  says('013/ב', B.solution.final_answer, '\\left(0,\\; \\dfrac{\\sqrt{a}}{2}\\right)');

  // ג — the chain rule through a quotient, simplified; the table; the minimum
  const C = part(q, 'ג');
  for (const a of [9, 36]) {
    const F = `sqrt((x^2 - ${a})/(x^2 - 4))`;
    const S = [-9, -7.5, -1.7, -0.6, 0.4, 1.3, 7, 11].filter((x) => qa(a)(x) > 0);
    dcheck(`013/ג a = ${a}: q' raw quotient rule`, `(x^2 - ${a})/(x^2 - 4)`, `(2*x*(x^2 - 4) - (x^2 - ${a})*2*x)/(x^2 - 4)^2`, S);
    dcheck(`013/ג a = ${a}: q' = 2x(a-4)/(x^2-4)^2`, `(x^2 - ${a})/(x^2 - 4)`, `2*x*(${a} - 4)/(x^2 - 4)^2`, S);
    dcheck(`013/ג a = ${a}: f' before cancelling 2`, F, `2*x*(${a} - 4)/(x^2 - 4)^2 * 1/(2*sqrt((x^2 - ${a})/(x^2 - 4)))`, S);
    dcheck(`013/ג a = ${a}: f' = x(a-4)/((x^2-4)^2 sqrt(q))`, F, `x*(${a} - 4)/((x^2 - 4)^2*sqrt((x^2 - ${a})/(x^2 - 4)))`, S);
    const r = sq(a);
    const fp = (x: number) => (qa(a)(x) <= 0 || Math.abs(x * x - 4) < 1e-12 ? null : (x * (a - 4)) / ((x * x - 4) ** 2 * sq(qa(a)(x))));
    const [t] = tables(C);
    const xs = [-r - 1, -r, -(r + 2) / 2, -1, 0, 1, (r + 2) / 2, r, r + 1];
    row(`013/ג a = ${a}`, t, '$x$', xs, (x) => x);
    row(`013/ג a = ${a}`, t, "$f'(x)$", xs, fp);
    yes(`013/ג a = ${a}: the endpoint ±√a has no derivative (radicand 0 in the denominator)`, fp(r) === null && fp(-r) === null);
    // the closed endpoints are minima: f = 0 there and f > 0 at every nearby point of the domain
    check(`013/ג a = ${a}: f(√a) = f(-√a) = 0`, fa(a)(r) + fa(a)(-r), 0);
    yes(`013/ג a = ${a}: endpoint minima — f > 0 just inside the domain`, [1e-6, 0.01, 0.3].every((h) => fa(a)(r + h) > 0 && fa(a)(-r - h) > 0));
    const [tt] = tables(C);
    const notes = (tt?.cols ?? []).map((c) => (c as { note?: string }).note ?? '');
    yes(`013/ג a = ${a}: the table marks both endpoints as minima`, notes[1] === 'קצה התחום, מינימום' && notes[7] === 'קצה התחום, מינימום');
  }
  says('013/ג', C.solution.final_answer, '\\left(0,\\; \\dfrac{\\sqrt{a}}{2}\\right)');
  says('013/ג', C.solution.final_answer, 'מינימום בקצה התחום בנקודות $(-\\sqrt{a},\\; 0)$ וגם $(\\sqrt{a},\\; 0)$');

  // ד — y = 3 meets the graph once exactly when √a/2 = 3
  const D = part(q, 'ד');
  expectValue('013/ד', D, 36);
  check('013/ד √a/2 = 3 ⇒ a = 36', (2 * 3) ** 2, 36);
  const pieces = (a: number): [number, number][] => [[-60, -sq(a)], [-2 + 1e-9, 2 - 1e-9], [sq(a), 60]];
  check('013/ד a = 36: f(x) = 3 has one solution', countSolutions(fa(36), 3, pieces(36)), 1);
  check('013/ד a = 25: f(x) = 3 has two solutions (min 2.5 below 3)', countSolutions(fa(25), 3, pieces(25)), 2);
  check('013/ד a = 49: f(x) = 3 has none (min 3.5 above 3)', countSolutions(fa(49), 3, pieces(49)), 0);
  yes('013/ד outer branches stay in [0, 1) for a = 36', [6, 6.5, 9, 30, 1000].every((x) => fa(36)(x) >= 0 && fa(36)(x) < 1 && fa(36)(-x) < 1));
  says('013/ד', all(D), '$a = 36$');

  // ה — the sketch for a = 36
  const E5 = part(q, 'ה');
  const f = fa(36);
  check('013/ה f(0) = 3', f(0), 3);
  check('013/ה f(6) = 0', f(6), 0);
  check('013/ה f(-6) = 0', f(-6), 0);
  yes('013/ה even', [0.5, 1.5, 6.5, 12].every((x) => Math.abs(f(x) - f(-x)) < 1e-12));
  yes('013/ה undefined between 2 and 6', [2.5, 4, 5.9].every((x) => Number.isNaN(f(x)) && Number.isNaN(f(-x))));
  yes('013/ה right branch rises toward 1', f(6.5) < f(9) && f(9) < f(30) && f(30) < 1);
  yes('013/ה middle branch: down to 3, then up', f(-1.5) > f(-0.5) && f(-0.5) > f(0) && f(0) < f(0.5) && f(0.5) < f(1.5));
  says('013/ה', all(E5), '$x \\le -6$ או $-2 < x < 2$ או $x \\ge 6$');
  yes('013/ה has its figure', (E5.solution.diagrams ?? []).length === 1);

  // ו — h(x) = f(x − c) has no point on the y-axis exactly when −c is outside the domain
  const W = part(q, 'ו');
  const inAnswer = (c: number) => (2 <= c && c < 6) || (-6 < c && c <= -2);
  const hDefinedAt0 = (c: number) => Number.isFinite(f(-c));
  let wrong = 0;
  for (let i = -400; i <= 400; i++) {
    const c = i / 40; // includes ±2 and ±6 exactly
    if (inAnswer(c) === hDefinedAt0(c)) wrong++;
  }
  check('013/ו answer = the c with h(0) undefined (c from -10 to 10, step 1/40)', wrong, 0);
  check('013/ו c = 6: h(0) = f(-6) = 0 (graph through the origin)', f(-6), 0);
  check('013/ו c = -6: h(0) = f(6) = 0', f(6), 0);
  yes('013/ו c = 2: x = 0 is a vertical asymptote of h', f(0.0000001 - 2) > 1e3 && Number.isNaN(f(-2)));
  yes('013/ו c = -2: x = 0 is a vertical asymptote of h', f(2 - 0.0000001) > 1e3 && Number.isNaN(f(2)));
  const h4 = (x: number) => f(x - 4);
  yes('013/ו c = 4: domain x ≤ -2, 2 < x < 6, x ≥ 10', [-9, -2, 2.1, 5.9, 10, 14].every((x) => Number.isFinite(h4(x))) && [-1.9, 0, 2, 6, 8, 9.9].every((x) => Number.isNaN(h4(x))));
  says('013/ו', W.solution.final_answer, '$2 \\le c < 6$ או $-6 < c \\le -2$');
}

// ================================================================= 014
{
  const q = question('fn-bag-rq-014');
  shape(q);
  says('014 context', q.context, '$f(x) = \\dfrac{x^2}{(x + 1)(x - a)}$');
  const fa = (a: number) => (x: number) => (x * x) / ((x + 1) * (x - a));
  const fpa = (a: number) => (x: number) => (x * ((1 - a) * x - 2 * a)) / ((x + 1) ** 2 * (x - a) ** 2);
  const x0 = (a: number) => (2 * a) / (1 - a);

  // א — asymptotes x = −1, x = a, y = 1
  const A = part(q, 'א');
  for (const a of [2, 3, 5]) {
    yes(`014/א a = ${a}: |f| blows up at -1 and at a`, Math.abs(fa(a)(-1 + 1e-7)) > 1e5 && Math.abs(fa(a)(a + 1e-7)) > 1e5);
    check(`014/א a = ${a}: numerator at -1 is 1`, (-1) ** 2, 1);
    check(`014/א a = ${a}: f → 1`, fa(a)(1e8), 1, 1e-7);
    check(`014/א a = ${a}: (x+1)(x-a) = x^2 + (1-a)x - a at x = 2.7`, (2.7 + 1) * (2.7 - a), 2.7 ** 2 + (1 - a) * 2.7 - a, 1e-12);
  }
  says('014/א', A.solution.final_answer, '$x = -1$, $x = a$ וגם $y = 1$');

  // ב — f' by the quotient rule, zeros 0 and 2a/(1−a)
  const B = part(q, 'ב');
  for (const a of [3, 5]) {
    const F = `x^2/((x + 1)*(x - ${a}))`;
    const S = [-6, -2.2, -0.4, 0.7, a + 1.3, a + 4];
    dcheck(`014/ב a = ${a}: raw quotient rule`, F, `(2*x*(x^2 + (1 - ${a})*x - ${a}) - x^2*(2*x + 1 - ${a}))/((x + 1)*(x - ${a}))^2`, S);
    dcheck(`014/ב a = ${a}: f' = x((1-a)x - 2a)/((x+1)^2(x-a)^2)`, F, `x*((1 - ${a})*x - 2*${a})/((x + 1)^2*(x - ${a})^2)`, S);
    check(`014/ב a = ${a}: numerator after collecting at x = 1.9`, 2 * 1.9 * (1.9 ** 2 + (1 - a) * 1.9 - a) - 1.9 ** 2 * (2 * 1.9 + 1 - a), (1 - a) * 1.9 ** 2 - 2 * a * 1.9, 1e-9);
    check(`014/ב a = ${a}: f'(2a/(1-a)) = 0`, fpa(a)(x0(a)), 0, 1e-12);
    check(`014/ב a = ${a}: x0 + 1 = (1+a)/(1-a)`, x0(a) + 1, (1 + a) / (1 - a), 1e-12);
  }
  says('014/ב', B.solution.final_answer, '$x = \\dfrac{2a}{1 - a}$');

  // ג — x0 < −1, the table, min at x0 with value 4a/(a+1)^2, max (0, 0)
  const C = part(q, 'ג');
  for (const a of [1.5, 2, 3, 7]) yes(`014/ג a = ${a}: x0 < -1`, x0(a) < -1);
  for (const a of [3, 5]) {
    const X = x0(a);
    const [t] = tables(C);
    const xs = [X - 1, X, (X - 1) / 2, -1, -0.5, 0, a / 2, a, a + 1];
    row(`014/ג a = ${a}`, t, '$x$', xs, (x) => x);
    row(`014/ג a = ${a}`, t, '$(1 - a)x - 2a$', xs, (x) => (1 - a) * x - 2 * a);
    row(`014/ג a = ${a}`, t, "$f'(x)$", xs, (x) => (x === -1 || x === a ? null : fpa(a)(x)));
    check(`014/ג a = ${a}: f(x0) = 4a/(a+1)^2`, fa(a)(X), (4 * a) / (a + 1) ** 2, 1e-12);
    check(`014/ג a = ${a}: x0 - a = a(1+a)/(1-a)`, X - a, (a * (1 + a)) / (1 - a), 1e-12);
    check(`014/ג a = ${a}: (x0+1)(x0-a) = a(1+a)^2/(1-a)^2`, (X + 1) * (X - a), (a * (1 + a) ** 2) / (1 - a) ** 2, 1e-12);
    check(`014/ג a = ${a}: f(0) = 0`, fa(a)(0), 0);
  }
  says('014/ג', C.solution.final_answer, '\\dfrac{4a}{(a + 1)^2}');

  // ד — g = 1/f^2: domain, x = 0 asymptote, missing points, y = 1
  const D = part(q, 'ד');
  says('014/ד', D.prompt, '$g(x) = \\dfrac{1}{\\big(f(x)\\big)^2}$');
  for (const a of [3, 5]) {
    const g = (x: number) => 1 / fa(a)(x) ** 2;
    yes(`014/ד a = ${a}: g → ∞ at 0 from both sides`, g(1e-5) > 1e8 && g(-1e-5) > 1e8);
    yes(`014/ד a = ${a}: g → 0 near -1 and a (missing points, not asymptotes)`, g(-1 + 1e-6) < 1e-6 && g(a - 1e-6) < 1e-6);
    check(`014/ד a = ${a}: g → 1`, g(1e8), 1, 1e-6);
  }
  says('014/ד', D.solution.final_answer, '$x = 0$ וגם $y = 1$');

  // ה — g' = −2f'/f^3, the three-row table, max at x0 with value (a+1)^4/(16a^2)
  const E5 = part(q, 'ה');
  for (const a of [3, 5]) {
    const F = `x^2/((x + 1)*(x - ${a}))`;
    const S = [-6, -2.2, -0.4, 0.7, a + 1.3, a + 4];
    dcheck(`014/ה a = ${a}: g' = -2f'/f^3`, `1/(${F})^2`, `-2*(x*((1 - ${a})*x - 2*${a})/((x + 1)^2*(x - ${a})^2))/(${F})^3`, S);
    const X = x0(a);
    const [t] = tables(E5);
    const xs = [X - 1, X, (X - 1) / 2, -1, -0.5, 0, a / 2, a, a + 1];
    row(`014/ה a = ${a}`, t, '$f(x)$', xs, (x) => fa(a)(x));
    row(`014/ה a = ${a}`, t, "$f'(x)$", xs, (x) => fpa(a)(x));
    row(`014/ה a = ${a}`, t, "$g'(x)$", xs, (x) => (x === -1 || x === a || x === 0 ? null : (-2 * fpa(a)(x)) / fa(a)(x) ** 3));
    check(`014/ה a = ${a}: g(x0) = (a+1)^4/(16a^2)`, 1 / fa(a)(X) ** 2, (a + 1) ** 4 / (16 * a * a), 1e-9);
  }
  says('014/ה', E5.solution.final_answer, '\\dfrac{(a + 1)^4}{16a^2}');

  // ו — the horizontal tangent y = 16/9 is the maximum: 3a^2 − 10a + 3 = 0, a = 3 (1/3 rejected)
  const W = part(q, 'ו');
  expectValue('014/ו', W, 3);
  const disc = 100 - 36;
  checkSet('014/ו roots of 3a^2 - 10a + 3', [(10 - sq(disc)) / 6, (10 + sq(disc)) / 6], [1 / 3, 3]);
  for (const a of [3, 1 / 3]) check(`014/ו a = ${a} satisfies (a+1)^4/(16a^2) = 16/9`, (a + 1) ** 4 / (16 * a * a), 16 / 9, 1e-12);
  yes('014/ו a = 1/3 violates a > 1', !(1 / 3 > 1));
  const g3 = (x: number) => 1 / fa(3)(x) ** 2;
  check('014/ו x0 = -3 for a = 3', x0(3), -3);
  check('014/ו g(-3) = 16/9', g3(-3), 16 / 9, 1e-12);
  check("014/ו g'(-3) = 0 (horizontal tangent)", (g3(-3 + 1e-6) - g3(-3 - 1e-6)) / 2e-6, 0, 1e-5);
  // g' vanishes nowhere else on the domain: sign changes of g' on a grid only at -3
  let changes = 0;
  const gp = (x: number) => (-2 * fpa(3)(x)) / fa(3)(x) ** 3;
  for (const [lo, hi] of [[-50, -1.001], [-0.999, -0.001], [0.001, 2.999], [3.001, 50]] as [number, number][]) {
    let prev = gp(lo);
    for (let i = 1; i <= 100000; i++) {
      const v = gp(lo + ((hi - lo) * i) / 100000);
      if (prev * v < 0) changes++;
      prev = v;
    }
  }
  check("014/ו g' changes sign only once (at x = -3)", changes, 1);

  // ז — the joint sketch for a = 3
  const Z = part(q, 'ז');
  const f3 = fa(3);
  check('014/ז f(-3) = 3/4', f3(-3), 0.75);
  yes('014/ז f approaches 1 from below on the left, from above on the right', f3(-100) < 1 && f3(100) > 1);
  yes('014/ז g approaches 1 from above on the left, from below on the right', g3(-100) > 1 && g3(100) < 1);
  yes('014/ז sides of x = -1 and x = 3', f3(-1.001) > 1e2 && f3(-0.999) < -1e2 && f3(2.999) < -1e2 && f3(3.001) > 1e2);
  yes('014/ז middle branch of f below the axis except at 0', [-0.9, -0.3, 0.5, 2.5].every((x) => f3(x) < 0));
  yes('014/ז both figures attached', (Z.solution.diagrams ?? []).length === 2);
  says('014/ז', Z.solution.final_answer, '\\left(-3,\\; \\dfrac{16}{9}\\right)');
}

// ================================================================= 015
{
  const q = question('fn-bag-rq-015');
  shape(q);
  says('015 context', q.context, '$f(x) = \\sqrt{a - x}$');
  says('015 context', q.context, '$g(x) = \\dfrac{4}{\\sqrt{x}}$');
  const fa = (a: number) => (x: number) => (x > a ? NaN : sq(a - x));
  const g = (x: number) => (x <= 0 ? NaN : 4 / sq(x));

  // א
  const A = part(q, 'א');
  yes('015/א g → ∞ at 0+', g(1e-10) > 1e5);
  yes('015/א g undefined at 0 and below', Number.isNaN(g(0)) && Number.isNaN(g(-1)));
  check('015/א g → 0', g(1e12), 0, 1e-5);
  says('015/א', A.solution.final_answer, '$x = 0$ וגם $y = 0$');

  // ב — two meetings whose x-coordinates are in ratio 16: roots t and 16t of x^2 − ax + 16 = 0
  const B = part(q, 'ב');
  says('015/ב', B.prompt, 'גדול פי $16$');
  for (const x of [0.3, 2, 9.5]) {
    for (const a of [10, 17, 25]) check(`015/ב x(a - x) = 16 ⇔ x^2 - ax + 16 = 0 (a = ${a}, x = ${x})`, x * (a - x) - 16, -(x * x - a * x + 16), 1e-12);
  }
  yes('015/ב both sides of √(x(17 - x)) = 4 are positive on 0 < x < 17, so squaring is reversible', [0.01, 1, 8.5, 16, 16.99].every((x) => sq(x * (17 - x)) > 0));
  check('015/ב product of the roots: t·16t = 16 ⇒ t^2 = 1', 16 / 16, 1);
  check('015/ב the positive root t = 1', sq(1), 1);
  check('015/ב sum of the roots: a = 1 + 16', 1 + 16, 17);
  checkSet('015/ב roots of x^2 - 17x + 16', [(17 - sq(289 - 64)) / 2, (17 + sq(289 - 64)) / 2], [1, 16]);
  yes('015/ב ratio 16 forces a = 17: a = 10 and a = 25 give other ratios', ((10 + sq(36)) / (10 - sq(36))) === 4 && ((25 + sq(561)) / (25 - sq(561))) !== 16);
  expectValue('015/ב', B, 17);
  says('015/ב', all(B), '$x^2 - ax + 16 = 0$');

  // ג — the roots from ב, checked in the ORIGINAL equation, and their y-coordinates
  const C = part(q, 'ג');
  const f = fa(17);
  says('015/ג', C.prompt, 'הציבו $a = 17$ בסעיפים ג עד ה');
  check('015/ג (x - 1)(x - 16) = x^2 - 17x + 16 at x = 3.3', (3.3 - 1) * (3.3 - 16), 3.3 ** 2 - 17 * 3.3 + 16, 1e-12);
  check('015/ג x(17 - x) = 16 at x = 1', 1 * 16, 16);
  check('015/ג x(17 - x) = 16 at x = 16', 16 * 1, 16);
  check('015/ג f(1) = g(1) = 4', f(1) + g(1), 8);
  check('015/ג f(16) = g(16) = 1', f(16) + g(16), 2);
  check('015/ג exactly two meetings on 0 < x ≤ 17', countSolutions((x) => f(x) - g(x), 0, [[1e-6, 17]]), 2);
  expectSet('015/ג', C, [1, 4, 16, 1]);

  // ד — which graph is above on each interval
  const D = part(q, 'ד');
  check('015/ד g(1/4) = 8', g(0.25), 8);
  yes('015/ד f ≤ √17 < 5 on the domain', f(0) === sq(17) && sq(17) < 5);
  yes('015/ד f(9) = √8 > 2 > g(9) = 4/3', Math.abs(f(9) - sq(8)) < 1e-12 && sq(8) > 2 && Math.abs(g(9) - 4 / 3) < 1e-12);
  yes('015/ד g above f on (0, 1)', [0.01, 0.3, 0.9].every((x) => g(x) > f(x)));
  yes('015/ד f above g on (1, 16)', [1.1, 5, 12, 15.9].every((x) => f(x) > g(x)));
  yes('015/ד g above f on (16, 17]', [16.1, 16.7, 17].every((x) => g(x) > f(x)));
  {
    const [t] = tables(D);
    const xs = [0.25, 1, 9, 16, 17];
    row('015/ד', t, '$f(x) - g(x)$', xs, (x) => f(x) - g(x));
    const upper = t?.rows.find((r) => r.result)?.cells ?? [];
    const want = xs.map((x) => (Math.abs(f(x) - g(x)) < 1e-12 ? '' : f(x) > g(x) ? '$f$' : '$g$'));
    yes('015/ד the result row names the upper graph in every interval', upper.join('|') === want.join('|'));
  }
  says('015/ד', D.solution.final_answer, '$1 < x < 16$ הגרף של $f$ עליון');

  // ה — area 18
  const E5 = part(q, 'ה');
  icheck('015/ה ∫_1^16 (f - g) dx = 18', 'sqrt(17 - x) - 4/sqrt(x)', 1, 16, 18);
  dcheck("015/ה F' = f - g", '-(2/3)*(17 - x)^(3/2) - 8*sqrt(x)', 'sqrt(17 - x) - 4/sqrt(x)', [1.5, 4, 9, 15]);
  const F = (x: number) => -(2 / 3) * (17 - x) ** 1.5 - 8 * sq(x);
  check('015/ה F(16) = -2/3 - 32', F(16), -2 / 3 - 32, 1e-12);
  check('015/ה F(1) = -128/3 - 8', F(1), -128 / 3 - 8, 1e-12);
  check('015/ה 126/3 - 24 = 18', 126 / 3 - 24, 18, 1e-12);
  expectValue('015/ה', E5, 18);

  // ו — tangency: a = 8 at (4, 2); x = -4 rejected
  const W = part(q, 'ו');
  dcheck("015/ו f' = -1/(2√(8 - x))", 'sqrt(8 - x)', '-1/(2*sqrt(8 - x))', [0.5, 2, 4, 7]);
  dcheck("015/ו g' = -2/(x√x)", '4/sqrt(x)', '-2/(x*sqrt(x))', [0.5, 2, 4, 7]);
  const f8 = fa(8);
  check('015/ו f(4) = g(4) = 2', f8(4) + g(4), 4);
  check("015/ו f'(4) = g'(4) = -1/4", -1 / (2 * sq(8 - 4)) - 2 / (4 * sq(4)), -0.5, 1e-12);
  checkSet('015/ו x^2 = 16', [-4, 4], [4, -4]);
  yes('015/ו x = -4 is outside the domain of g', Number.isNaN(g(-4)));
  check('015/ו a = 8: one common point (a touch)', countSolutions((x) => f8(x) - g(x), 0, [[1e-6, 8]]), 1);
  check('015/ו a = 7.9: no common point', countSolutions((x) => fa(7.9)(x) - g(x), 0, [[1e-6, 7.9]]), 0);
  check('015/ו a = 8.1: two common points', countSolutions((x) => fa(8.1)(x) - g(x), 0, [[1e-6, 8.1]]), 2);
  expectSet('015/ו', W, [8, 4, 2]);
}

summary('bagrut-exam-b');
