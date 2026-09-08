// What the 571 Euclidean papers ASK FOR, versus what our אתגר rung asks for.
//
// The composite score says our hard rung clears the archive. The owner read the
// questions and said it is not hard. Reading the ten archived Euclidean
// questions shows what the score cannot see: the exam almost never wants a
// number. It wants a RATIO, or a quantity EXPRESSED through a symbol that an
// earlier part introduced (S, R, r, α). Those are the demands to count.
import { getLesson } from '../content/lessons';
import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';
import type { PracticeQuestion, SubTopic } from '../content/lessons/types';

const DEMANDS: [string, RegExp][] = [
  ['express-via-symbol', /הביע|בטא(?:ו)? באמצעות|באמצעות \$?[A-Za-zα-ω]\$?( ו|,|\s*את)/],
  ['ratio-of-areas', /היחס בין שטח|יחס השטחים|יחס בין השטחים/],
  ['ratio-of-lengths', /מצא(?:ו)? את היחס|מהו היחס|היחס \$?\\dfrac/],
  ['prove-then-use', /הוכיחו|הוכח/],
  ['parameter-answer', /נסמן|סמן(?:ו)? ב-?\$/],
];

const ANALYTIC = /שיעורי|משוואת|ציר ה|\\vec|מישור|פרבול|ראשית הצירים|אליפס|היפרבול/;

function tally(texts: string[]) {
  const counts: Record<string, number> = {};
  for (const [name] of DEMANDS) counts[name] = 0;
  for (const t of texts) for (const [name, re] of DEMANDS) if (re.test(t)) counts[name]++;
  return counts;
}

// ── the archive ────────────────────────────────────────────────────────────
const examParts: string[] = [];
for (const q of ALL_PAST_BAGRUYOT) {
  const whole = [q.context ?? '', ...(q.parts ?? []).map((p) => p.prompt ?? '')].join(' ');
  if (!/\\triangle|משולש|מרובע|מעגל|טרפז|מקבילית|מעוין/.test(whole)) continue;
  if (/גרף|נגזרת|אינטגרל|מרוכב|הסתברות/.test(whole) || ANALYTIC.test(whole)) continue;
  for (const p of q.parts ?? []) examParts.push(p.prompt ?? '');
}

// ── our אתגר rung ──────────────────────────────────────────────────────────
const ours: string[] = [];
const lesson = getLesson('math5', 'גיאומטריה אוקלידית');
for (const st of (lesson?.subTopics ?? []) as SubTopic[])
  for (const q of (st.questions ?? []) as PracticeQuestion[])
    if (q.difficulty === 'hard') ours.push(q.question);

const a = tally(examParts);
const b = tally(ours);

console.log(`demand                 archive (${examParts.length} parts)   our אתגר (${ours.length} questions)`);
console.log('-'.repeat(70));
for (const [name] of DEMANDS) {
  const pa = ((a[name] / examParts.length) * 100).toFixed(0);
  const pb = ((b[name] / ours.length) * 100).toFixed(0);
  console.log(`${name.padEnd(22)} ${String(a[name]).padStart(3)}  ${pa.padStart(3)}%        ${String(b[name]).padStart(3)}  ${pb.padStart(3)}%`);
}
