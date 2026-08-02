/**
 * verify-teach.ts — inventory gate for "למד את הבוט".
 *
 * WHAT A PASS MEANS: every sub-topic has at least MIN_RUBRIC_POINTS authored
 * checklist items, and the id-narrowing that protects the UI works.
 *
 * WHAT A PASS DOES **NOT** MEAN: that those points are mathematically correct,
 * well-phrased, or that the classmate persona behaves well. This script counts
 * material; it cannot read it. Persona quality is only ever established by
 * running real sessions by hand.
 *
 * Sub-topics below the floor are NAMED, not just counted — that list is the
 * authoring worklist, which is the whole point of printing an inventory rather
 * than a single number.
 *
 *   npx tsx scripts/verify-teach.ts
 */

import { allLessonKeys, getSubTopics } from '../content/lessons';
import { buildRubric, coerceCoveredIds, MIN_RUBRIC_POINTS } from '../lib/teach/rubric';

let errors = 0;
let warnings = 0;

type Row = {
  topic: string;
  subId: string;
  title: string;
  points: number;
  toppedUp: number;
  traps: number;
};

const rows: Row[] = [];

for (const { subject, topic } of allLessonKeys()) {
  for (const sub of getSubTopics(subject, topic)) {
    const rubric = buildRubric(subject, topic, sub.id);
    if (!rubric) {
      console.log(`ERROR  ${topic} / ${sub.id} — buildRubric returned null for a listed sub-topic`);
      errors++;
      continue;
    }
    rows.push({
      topic,
      subId: sub.id,
      title: rubric.title,
      points: rubric.points.length,
      // Points that came from the topic's pitfalls because keyPoints were thin.
      toppedUp: rubric.points.filter((p) => p.kind === 'pitfall').length,
      traps: rubric.traps.length,
    });
  }
}

// ------------------------------------------------------------------
// Inventory, grouped by topic
// ------------------------------------------------------------------
console.log('\n=== מצאי רובריקות (נקודות פר תת-נושא) ===\n');

const byTopic = new Map<string, Row[]>();
for (const r of rows) {
  const list = byTopic.get(r.topic) ?? [];
  list.push(r);
  byTopic.set(r.topic, list);
}

for (const [topic, list] of byTopic) {
  const thin = list.filter((r) => r.points < MIN_RUBRIC_POINTS).length;
  const total = list.reduce((n, r) => n + r.points, 0);
  console.log(
    `${topic.padEnd(22)} ${String(list.length).padStart(2)} תתי-נושאים · ` +
      `${String(total).padStart(3)} נקודות · ממוצע ${(total / list.length).toFixed(1)}` +
      (thin ? `  ⚠️ ${thin} מתחת לרף` : '')
  );
}

// ------------------------------------------------------------------
// The worklist: every sub-topic that can't be taught yet, by name
// ------------------------------------------------------------------
const thin = rows.filter((r) => r.points < MIN_RUBRIC_POINTS);
if (thin.length) {
  console.log(`\n=== רשימת עבודה — ${thin.length} תתי-נושאים מתחת לרף ${MIN_RUBRIC_POINTS} ===`);
  console.log('(אלה לא יופיעו ב-/teach עד שיתווספו להם keyPoints)\n');
  for (const r of thin) {
    console.log(`  ERROR  ${r.topic} / ${r.subId} — "${r.title}" · ${r.points} נקודות בלבד`);
    errors++;
  }
}

const toppedUp = rows.filter((r) => r.toppedUp > 0);
if (toppedUp.length) {
  console.log(`\n=== ${toppedUp.length} תתי-נושאים הושלמו מ-pitfalls (keyPoints דלים) ===`);
  console.log('(עוברים, אבל הרובריקה שלהם פחות ממוקדת — מועמדים לכתיבה)\n');
  for (const r of toppedUp) {
    console.log(`  WARN   ${r.topic} / ${r.subId} — ${r.toppedUp} מתוך ${r.points} מ-pitfalls`);
    warnings++;
  }
}

// ------------------------------------------------------------------
// The narrowing that protects the UI from invented ids
// ------------------------------------------------------------------
console.log('\n=== בדיקת סינון מזהים ===\n');
const sample = rows.length ? buildRubric('math5', rows[0].topic, rows[0].subId) : null;
if (!sample) {
  console.log('ERROR  no rubric available to test id narrowing');
  errors++;
} else {
  const realId = sample.points[0].id;
  const cases: [string, boolean][] = [
    ['drops an invented id', coerceCoveredIds(sample, ['kp-999', 'totally-made-up']).length === 0],
    ['keeps a real id', coerceCoveredIds(sample, [realId]).length === 1],
    ['dedupes repeats', coerceCoveredIds(sample, [realId, realId]).length === 1],
    ['survives a non-array', coerceCoveredIds(sample, 'kp-0' as unknown).length === 0],
    ['survives non-strings', coerceCoveredIds(sample, [null, 7, {}]).length === 0],
  ];
  for (const [name, ok] of cases) {
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
    if (!ok) errors++;
  }
}

// ------------------------------------------------------------------
console.log(
  `\n=== סיכום: ${rows.length} תתי-נושאים · ` +
    `${rows.reduce((n, r) => n + r.points, 0)} נקודות רובריקה · ` +
    `${errors} errors · ${warnings} warnings ===`
);
console.log(
  'תזכורת: הסקריפט סופר חומר. הוא לא קורא אותו — נכונות מתמטית ואיכות הפרסונה נקבעות רק בבדיקה ידנית.\n'
);

process.exit(errors > 0 ? 1 : 0);
