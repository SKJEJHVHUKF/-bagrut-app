/**
 * report-gradable.ts — how many questions can the app grade WITHOUT the model?
 *
 *   npm run report:gradable
 *
 * FREE. Reads content, calls nothing.
 *
 * ============================================================
 * WHY THIS IS THE SAME LEVER FOR COST AND FOR HEBREW
 * ============================================================
 * A question with a machine-gradable `expected` answers "15" and "יצא לי 6"
 * from `lib/answer-check` — deterministic, instant, $0, and in AUTHORED Hebrew.
 * A question without one sends the same message to the model, which costs money
 * AND writes the Hebrew itself.
 *
 * The second half is the part that was missed for a long time. claude-haiku-4-5
 * fabricates Hebrew verb forms under generation — "והקבלן לך 2.3", "בטעות
 * הנתת", "בוגדר לרדיאנים", "בואנו נבנה זאת". Every turn served from authored
 * content is a turn where that cannot happen, so `expected` coverage is not
 * only a cost number: it is how much of the tutor's Hebrew a human wrote.
 */

import { getLesson, allLessonKeys } from '../content/lessons';

type Q = { id?: string; question?: string; expected?: { kind?: string } };

const rows: Array<{ topic: string; total: number; gradable: number; manual: number; none: number }> = [];

for (const { subject, topic } of allLessonKeys()) {
  const lesson = getLesson(subject, topic);
  const found: Q[] = [];
  const walk = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(walk);
    if (!n || typeof n !== 'object') return;
    const o = n as Record<string, unknown>;
    if (typeof o.id === 'string' && typeof o.question === 'string') found.push(o as Q);
    for (const v of Object.values(o)) walk(v);
  };
  walk(lesson);
  if (!found.length) continue;

  let gradable = 0;
  let manual = 0;
  let none = 0;
  for (const q of found) {
    const k = q.expected?.kind;
    if (!k) none++;
    else if (k === 'manual') manual++;
    else gradable++;
  }
  rows.push({ topic, total: found.length, gradable, manual, none });
}

rows.sort((a, b) => a.gradable / a.total - b.gradable / b.total);

console.log('\ntopic                  questions  gradable   manual   NO expected');
for (const r of rows) {
  const pct = ((r.gradable / r.total) * 100).toFixed(0) + '%';
  console.log(
    String(r.topic).padEnd(22),
    String(r.total).padStart(9),
    `${String(r.gradable).padStart(5)} ${pct.padStart(5)}`,
    String(r.manual).padStart(8),
    String(r.none).padStart(12),
  );
}

const t = rows.reduce(
  (a, r) => ({ total: a.total + r.total, gradable: a.gradable + r.gradable, manual: a.manual + r.manual, none: a.none + r.none }),
  { total: 0, gradable: 0, manual: 0, none: 0 },
);
console.log(
  `\n${t.gradable} of ${t.total} questions (${((t.gradable / t.total) * 100).toFixed(0)}%) can be graded with no model call.`,
);
console.log(`${t.manual} are deliberately 'manual' (proofs, loci, "find all n") — correctly not gradable.`);
console.log(`${t.none} have NO expected field at all. Those are the authoring worklist:`);
console.log(`a numeric answer with no 'expected' pays the model to read a number.\n`);
