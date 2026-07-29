/**
 * verify-mcq-distinct.ts — no two MCQ options may be the same value.
 *   npx tsx scripts/verify-mcq-distinct.ts
 *   npx tsx scripts/verify-mcq-distinct.ts --strict   (exit 1 on any hit)
 *
 * WHY
 * Four questions were found where a DISTRACTOR equals the correct answer,
 * written in a different form — so a student who answers correctly is marked
 * wrong. Examples caught by hand before this script existed:
 *   vec-018          correct $2$        distractor $\dfrac{6}{\sqrt{9}}$  = 2
 *   vec-sub-da-001   correct $3$        distractor $\sqrt{9}$             = 3
 *   ln-002           correct $\frac1x$  distractor $\frac{3}{3x}$         ≡ 1/x
 *   ln-006           correct $\ln 4$    distractor $\ln(12/3) = \ln 4$    = ln4
 * The pattern is "unreduced form used as a distractor", which is not a wrong
 * answer at all. It is mechanically detectable, so it should never again be
 * found by reading.
 *
 * HOW
 * Strip the LaTeX to something mathjs can evaluate, then compare options
 * numerically — symbolically where a variable is present, by sampling x.
 * Anything that fails to parse is reported separately as "not checked" rather
 * than silently passing, so the blind spot stays visible.
 */
import { create, all } from 'mathjs';
import { getLesson, allLessonKeys } from '@/content/lessons';
import { CONCEPT_571 } from '@/content/concept-quiz/571';
import { CONCEPT_582 } from '@/content/concept-quiz/582';

const math = create(all, { number: 'number' });
const STRICT = process.argv.includes('--strict');

type Q = { id?: string; kind?: string; question?: string; answers?: string[]; correct?: number };

/** LaTeX → mathjs source. Returns null when the option isn't a bare expression. */
function toExpr(raw: string): string | null {
  let s = String(raw).trim();
  if (/[֐-׿]/.test(s)) return null; // Hebrew prose option — not a value
  s = s.replace(/\$/g, '').trim();
  if (!s) return null;

  // Strip a leading FUNCTION label — "f(x) =", "f'(x) =", "g(t) =". The
  // parenthesised argument is required: a bare "y =" or "x =" is a real
  // equation (an asymptote, an axis), not a label. Stripping those made
  // "$x = 4$" and "$y = 4$" both evaluate to 4 and compare equal, which
  // reported a vertical and a horizontal line as the same answer.
  s = s.replace(/^\s*[a-zA-Z]'{0,2}\([a-zA-Z]\)\s*=\s*/, '');

  // Anything with a relation LEFT is a statement, not a value: "x^2+y^2=5",
  // "m<1", "q>-1". mathjs evaluates those to booleans, and the first version
  // of this script compared the booleans — reporting "x^2+y^2=5 == |x|+|y|=5"
  // and 30-odd other phantom duplicates. A statement can only be compared to
  // another statement symbolically, which is out of scope here, so skip it and
  // let it show up in the not-checkable count.
  if (/[=<>]|\\le\b|\\ge\b|\\ne\b|\\leq|\\geq|\\neq/.test(s)) return null;
  s = s
    .replace(/\\dfrac|\\tfrac|\\frac/g, 'FRAC')
    .replace(/\\left|\\right|\\,|\\;|\\!|\\ /g, '')
    .replace(/\\cdot|\\times/g, '*')
    .replace(/\\pi/g, 'pi')
    .replace(/\\ln/g, 'log')
    .replace(/\\sqrt/g, 'sqrt')
    .replace(/\\infty/g, 'Infinity')
    .replace(/[{}]/g, (m) => (m === '{' ? '(' : ')'));
  // FRAC(a)(b) → ((a)/(b))
  let guard = 0;
  while (s.includes('FRAC') && guard++ < 20) {
    s = s.replace(/FRAC\(([^()]*)\)\(([^()]*)\)/, '(($1)/($2))');
    if (guard > 18) return null;
  }
  if (/[\\A-Za-z]{0,}\\/.test(s)) return null; // leftover LaTeX command
  if (/[°|]/.test(s)) return null;
  return s;
}

function valueOf(expr: string, x: number): number | null {
  try {
    const v = math.evaluate(expr, { x, y: x * 1.37 + 0.11, n: 3, a: 2, b: 5, c: 7, k: 2, m: 4, t: 1.3, q: 0.5, r: 1.7, e: Math.E });
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Equal at several sample points ⇒ the same expression for our purposes. */
function sameValue(a: string, b: string): boolean {
  const pts = [1.7, 2.3, 3.9, 5.1];
  let compared = 0;
  for (const x of pts) {
    const va = valueOf(a, x);
    const vb = valueOf(b, x);
    if (va === null || vb === null) continue;
    compared++;
    const scale = Math.max(1, Math.abs(va), Math.abs(vb));
    if (Math.abs(va - vb) > 1e-9 * scale) return false;
  }
  return compared >= 2;
}

const dupes: string[] = [];
let checked = 0;
let unparsed = 0;

function scan(where: string, q: Q) {
  const answers = q.answers ?? [];
  if (q.kind && q.kind !== 'mcq') return;
  if (answers.length < 2) return;
  const exprs = answers.map(toExpr);
  for (let i = 0; i < answers.length; i++) {
    for (let j = i + 1; j < answers.length; j++) {
      const a = exprs[i];
      const b = exprs[j];
      if (!a || !b) continue;
      checked++;
      if (sameValue(a, b)) {
        const flag = i === q.correct || j === q.correct ? '🔴 ONE OF THESE IS THE CORRECT ANSWER' : '⚠';
        dupes.push(
          `${flag} ${where} ${q.id}: option[${i}] "${answers[i]}" == option[${j}] "${answers[j]}"  (correct=${q.correct})`,
        );
      }
    }
  }
  unparsed += exprs.filter((e) => !e).length;
}

for (const { subject, topic } of allLessonKeys()) {
  const l = getLesson(subject, topic);
  if (!l) continue;
  const pool: Q[] = [
    ...((l.questions ?? []) as Q[]),
    ...((l.subTopics ?? []).flatMap((st) => [
      ...((st.questions ?? []) as Q[]),
      ...(((st.lesson ?? []).map((s) => s.drill).filter(Boolean) as unknown) as Q[]),
    ]) as Q[]),
  ];
  pool.forEach((q) => scan(topic, q));
}
for (const [bank, obj] of [
  ['concept-571', CONCEPT_571],
  ['concept-582', CONCEPT_582],
] as Array<[string, Record<string, Q[]>]>) {
  Object.values(obj).forEach((qs) => qs.forEach((q) => scan(bank, { ...q, kind: 'mcq' })));
}

const critical = dupes.filter((d) => d.startsWith('🔴'));
dupes.sort((a, b) => (a.startsWith('🔴') ? -1 : 1) - (b.startsWith('🔴') ? -1 : 1));
dupes.forEach((d) => console.log(d));

console.log(
  `\n${checked} option pairs compared numerically, ${unparsed} options not machine-checkable (prose/notation).`,
);
console.log(`${dupes.length} duplicate pair(s), of which ${critical.length} involve the correct answer.`);
if (STRICT && critical.length > 0) process.exit(1);

export {};
