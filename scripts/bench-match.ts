// ============================================================
// scripts/bench-match.ts — calibrate + prove the library matcher.
// ============================================================
//
//   npx tsx scripts/bench-match.ts
//
// Two things must both hold, and they pull against each other:
//   RECALL    a noisy scan of a stored question finds THAT question
//   PRECISION a question that is NOT in the library finds nothing
//
// Precision is the one that matters. A miss costs one API call; a wrong
// match shows a student a fully-worked solution to a different question
// under a "verified" badge. So the report below prints the wrong-match count
// first, and any non-zero value is a failure regardless of recall.

import { buildMatchIndex, findMatch, MATCH_THRESHOLD, MATCH_MARGIN } from '../lib/mathscan/match';
import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';
import { allLessonKeys, getLesson } from '../content/lessons';
import { normalizeQuestionText } from '../lib/question-match';

type Entry = { id: string; topic: string; text: string };

function corpus(): Entry[] {
  const out: Entry[] = [];
  for (const q of ALL_PAST_BAGRUYOT) {
    out.push({
      id: q.id,
      topic: q.topic,
      text: [q.context, ...q.parts.map((p) => p.prompt)].filter(Boolean).join(' '),
    });
  }
  for (const { subject, topic } of allLessonKeys()) {
    if (subject !== 'math5') continue;
    const lesson = getLesson(subject, topic);
    if (!lesson) continue;
    for (const q of lesson.questions ?? []) out.push({ id: q.id, topic, text: q.question });
    for (const sub of lesson.subTopics ?? []) {
      for (const q of sub.questions ?? []) out.push({ id: q.id, topic, text: q.question });
    }
    for (const q of lesson.bagrutQuestions ?? []) {
      out.push({
        id: q.id,
        topic,
        text: [q.context, ...q.parts.map((p) => p.prompt)].filter(Boolean).join(' '),
      });
    }
  }
  return out;
}

/** The OCR errors MEASURED on a real printed bagrut question. */
function ocrNoise(s: string, seed: number, dropRate: number): string {
  let out = s
    .replace(/\sqrt/g, 'N')
    .replace(/\^2/g, '°')
    .replace(/_1/g, '1')
    .replace(/_2/g, '2')
    .replace(/\bar\{([^}]*)\}/g, '$1"')
    .replace(/\cdot/g, '.')
    .replace(/\frac/g, 'frac')
    .replace(/\$/g, '');
  let n = seed || 1;
  out = [...out]
    .filter(() => {
      n = (n * 1103515245 + 12345) & 0x7fffffff;
      return n % 100 >= dropRate;
    })
    .join('');
  return out;
}

const all = corpus();
const index = buildMatchIndex(all);
console.log(`corpus: ${all.length} questions indexed\n`);

for (const dropRate of [0, 4, 10]) {
  let hit = 0;
  let miss = 0;
  let wrong = 0;
  const sample = all.filter((_, i) => i % 3 === 0); // every third, ~285 queries
  for (const entry of sample) {
    const noisy = ocrNoise(entry.text, entry.text.length, dropRate);
    const found = findMatch(index, noisy, { topicHint: entry.topic });
    if (!found) miss++;
    else if (found.entry.id === entry.id) hit++;
    else {
      wrong++;
      if (wrong <= 3) console.log(`  WRONG: ${entry.id} → ${found.entry.id} (score ${found.score.toFixed(3)})`);
    }
  }
  const pct = (n: number) => ((n / sample.length) * 100).toFixed(1);
  const searchable = sample.filter((e) => normalizeQuestionText(e.text).length >= 40).length;
  const pctSearchable = ((hit / Math.max(1, searchable)) * 100).toFixed(1);
  console.log(
    `drop=${dropRate}%  n=${sample.length}  hit=${pct(hit)}%  miss=${pct(miss)}%  WRONG=${wrong}` +
      `   | of the ${searchable} long enough to search with: ${pctSearchable}%`
  );
}

// ---- precision: questions that are NOT in the library must find nothing ----
const strangers = [
  // SHORT queries — the class that produced a REAL false positive:
  // "פתור את המשוואה sin(x) = 0.5" matched a complex-numbers question and
  // returned z = ±4i under a verified badge. Boilerplate dominates a short
  // trigram set, so these must be refused outright.
  'פתור את המשוואה sin(x) = 0.5',
  'פתור את המשוואה x + 1 = 3',
  'מצא את הנגזרת',
  'חשב את השטח',
  'פתור את המשוואה cos(x) = 0.3 בתחום הנתון',
  'פתור את המשוואה tan(x) = 1',

  'פתור את המשוואה הדיפרנציאלית y\'\' + 3y\' + 2y = 0 עם תנאי התחלה',
  'חשב את הנגזרת החלקית של הפונקציה f(x,y) = x^2*y + sin(xy) לפי y',
  'מצא את הדטרמיננטה של המטריצה בסדר 4 על 4 בשיטת הפיתוח לפי שורה',
  'כמה דרכים יש לסדר 8 ספרים שונים על מדף כך ששני ספרים מסוימים יהיו צמודים',
  'הוכח באינדוקציה שסכום הסדרה שווה n בריבוע עבור כל n טבעי גדול מאחת',
];
let falsePositives = 0;
for (const stranger of strangers) {
  const found = findMatch(index, stranger);
  if (found) {
    falsePositives++;
    console.log(`  FALSE POSITIVE: "${stranger.slice(0, 40)}…" → ${found.entry.id} (${found.score.toFixed(3)})`);
  }
}
console.log(`\nout-of-library queries: ${strangers.length}, false positives: ${falsePositives}`);
console.log(`thresholds in use: score >= ${MATCH_THRESHOLD}, margin >= ${MATCH_MARGIN}`);
