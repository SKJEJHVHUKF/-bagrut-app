/**
 * verify-rule-lines.ts — the "**הכלל:**" opening step, enforced.
 *
 * ============================================================
 * WHY THIS EXISTS
 * ============================================================
 * Owner's instruction (2026-08-21): "הייתי רוצה שגם בכל התשובות יראו באיזה
 * נוסחה משתמשים ולמה" — every worked solution must OPEN by naming the rule it
 * uses and why that rule fits this question, not just execute the arithmetic.
 *
 * That line is not decoration: it is `solution.steps[0]`, which is also the
 * help ladder's middle rung ("הצעד הראשון") and the slot the local tutor reads
 * to answer "באיזו נוסחה משתמשים כאן?" (lib/tutor-local.ts). So a malformed
 * rule line breaks three surfaces at once, and every failure mode below has
 * already shipped at least once in this repo:
 *
 *   · Hebrew inside $…$        renders REVERSED (KaTeX has no bidi)
 *   · a lost backslash         `\\dfrac` → `\dfrac` in source → the bare word
 *                              "dfrac" on screen; tsc stays green
 *   · the answer in step 0     kills the ladder's middle rung (leak guard)
 *   · unbalanced $             swallows the rest of the Hebrew sentence
 *
 * Coverage is enforced per topic: a topic listed in REQUIRE_FULL must have the
 * line on EVERY authored solution. Topics not listed are mid-rollout — their
 * rule lines are still validated, they are just not yet required to exist.
 *
 *   npx tsx scripts/verify-rule-lines.ts
 */
import { leaksAnswer } from '../lib/help-ladder';
import { allLessonKeys, getLesson } from '../content/lessons';

const RULE = '**הכלל:**';

/** Topics whose rollout is complete — absence of the line is an error here. */
const REQUIRE_FULL = new Set(['הסתברות', 'סדרות']);

const HEB = /[֐-׿]/;

/** LaTeX commands that must never appear bare inside math — a bare one means a
 *  backslash was eaten by shell quoting or a bad regex patch. */
const MATH_WORDS = [
  'dfrac', 'frac', 'cdot', 'binom', 'sqrt', 'approx', 'cap', 'cup', 'mid',
  'bar', 'ldots', 'text', 'times', 'Rightarrow', 'quad',
];

type Row = { topic: string; where: string; steps: string[]; finalAnswer: string };

function mathSpans(line: string): string[] {
  const spans: string[] = [];
  const s = line.replace(/\\+\$/g, '¤');
  s.replace(/\$\$([^$]*)\$\$/g, (_m, g: string) => (spans.push(g), ' '));
  s.replace(/\$(?!\{)([^$\n]+?)\$/g, (_m, g: string) => (spans.push(g), ' '));
  return spans;
}

const rows: Row[] = [];
for (const { subject, topic } of allLessonKeys()) {
  const L = getLesson(subject, topic);
  if (!L) continue;
  const add = (where: string, steps?: string[], finalAnswer?: string) => {
    if (!Array.isArray(steps) || steps.length === 0) return;
    rows.push({ topic, where, steps, finalAnswer: finalAnswer ?? '' });
  };
  for (const st of L.subTopics ?? []) {
    (st.lesson ?? []).forEach((step, i) => {
      add(`${st.id}/lesson[${i}]/example`, step.example?.steps, step.example?.answer);
      add(`${step.drill?.id ?? `${st.id}/lesson[${i}]/drill`}`, step.drill?.solution?.steps, step.drill?.solution?.finalAnswer);
    });
    for (const q of st.questions ?? []) add(q.id, q.solution?.steps, q.solution?.finalAnswer);
  }
  for (const q of L.questions ?? []) add(q.id, q.solution?.steps, q.solution?.finalAnswer);
  (L.examples ?? []).forEach((e, i) => add(`example[${i}]`, e.steps, e.answer));
  for (const b of L.bagrutQuestions ?? []) {
    for (const p of b.parts ?? []) add(`${b.id}/${p.label}`, p.solution?.steps, p.solution?.final_answer);
  }
}

let errors = 0;
const err = (topic: string, where: string, msg: string, detail?: string) => {
  errors++;
  console.log(`  ✗ [${topic}] ${where} — ${msg}${detail ? `\n      «${detail.slice(0, 110)}»` : ''}`);
};

const coverage = new Map<string, { total: number; withRule: number }>();

for (const r of rows) {
  const c = coverage.get(r.topic) ?? { total: 0, withRule: 0 };
  c.total++;
  const first = (r.steps[0] ?? '').trim();
  const has = first.startsWith(RULE);
  if (has) c.withRule++;
  coverage.set(r.topic, c);

  if (!has) {
    if (REQUIRE_FULL.has(r.topic)) err(r.topic, r.where, 'the solution does not open with a rule line');
    continue;
  }

  const body = first.slice(RULE.length).trim();

  if (body.length < 12) err(r.topic, r.where, 'rule line is too short to name a rule', first);
  if (body.length > 400) err(r.topic, r.where, 'rule line is a paragraph, not one or two sentences', first);

  // Unbalanced math delimiters swallow the rest of the sentence.
  const dollars = (first.replace(/\\\$/g, '').match(/\$/g) ?? []).length;
  if (dollars % 2 !== 0) err(r.topic, r.where, 'odd number of $ — an unclosed math span', first);

  for (const span of mathSpans(first)) {
    if (HEB.test(span)) err(r.topic, r.where, 'Hebrew inside $…$ — renders reversed', span);
    for (const w of MATH_WORDS) {
      // Inside math, the bare word means its backslash was eaten upstream.
      const bare = new RegExp(`(^|[^a-zA-Z\\\\])${w}(?![a-zA-Z])`);
      if (bare.test(span)) err(r.topic, r.where, `bare "${w}" inside math — a lost backslash`, span);
    }
  }

  // The rule line IS the ladder's first-step rung; it must not give the answer.
  if (r.finalAnswer && leaksAnswer(first, r.finalAnswer)) {
    err(r.topic, r.where, 'the rule line contains the final answer — the middle rung dies', first);
  }
}

console.log('\nכיסוי שורת "הכלל" לפי נושא:');
for (const [topic, c] of [...coverage.entries()].sort((a, b) => b[1].total - a[1].total)) {
  const pct = c.total ? Math.round((c.withRule / c.total) * 100) : 0;
  const mark = REQUIRE_FULL.has(topic) ? (c.withRule === c.total ? '✓' : '✗') : ' ';
  console.log(`  ${mark} ${String(c.withRule).padStart(4)}/${String(c.total).padEnd(4)} ${String(pct).padStart(3)}%  ${topic}`);
}

const total = rows.length;
const withRule = rows.filter((r) => (r.steps[0] ?? '').trim().startsWith(RULE)).length;
console.log(`\nנבדקו ${total} פתרונות; ${withRule} עם שורת כלל; ${errors} שגיאות.`);
if (errors > 0) process.exit(1);

export {};
