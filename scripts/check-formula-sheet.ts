// Gate for content/formula-sheet.ts. The sheet selects formulas by NAME out of
// the lesson content, so a rename in a lesson would silently drop a formula
// from the sheet. This fails on that, and reports topics with no curated list
// (which fall back to showing everything).
// Run: npx tsx scripts/check-formula-sheet.ts

import { allLessonKeys, getLesson } from '@/content/lessons';
import { CORE_FORMULAS, sheetFormulas } from '@/content/formula-sheet';

let failures = 0;
const known = new Set<string>();

for (const { subject, topic } of allLessonKeys().filter((k) => k.subject === 'math5')) {
  known.add(topic);
  const lesson = getLesson(subject, topic);
  const names = CORE_FORMULAS[topic];

  if (!names) {
    const shown = sheetFormulas(lesson, topic).length;
    if (shown > 0) {
      console.warn(`warn  "${topic}": no curated list — showing all ${shown} taught formulas`);
    }
    continue;
  }

  // Every taught formula name for this topic (lesson-level + sub-topics).
  const taught = new Set<string>();
  lesson?.formulas?.forEach((f) => taught.add(f.name));
  lesson?.subTopics?.forEach((st) => st.formulas?.forEach((f) => taught.add(f.name)));

  for (const name of names) {
    if (!taught.has(name)) {
      console.error(`FAIL  "${topic}": no formula named "${name}" — renamed or removed in the lesson`);
      failures++;
    }
  }

  const dupes = names.filter((n, i) => names.indexOf(n) !== i);
  if (dupes.length) {
    console.error(`FAIL  "${topic}": duplicate entries — ${[...new Set(dupes)].join(', ')}`);
    failures++;
  }

  const kept = sheetFormulas(lesson, topic).length;
  console.log(`ok    ${topic}: ${kept}/${taught.size} formulas on the sheet`);
}

// A topic key here that no lesson defines is a typo — its list is dead weight.
for (const topic of Object.keys(CORE_FORMULAS)) {
  if (!known.has(topic)) {
    console.error(`FAIL  "${topic}" is not a math5 lesson topic (typo in CORE_FORMULAS?)`);
    failures++;
  }
}

if (failures) {
  console.error(`\n${failures} failures`);
  process.exit(1);
}
console.log('\nformula sheet OK');
