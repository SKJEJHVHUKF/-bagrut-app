// What does a REAL geometry bagrut question look like?
//
// The ladder gate scores difficulty from solution steps + theorem count, and by
// that model our אתגר rung already clears the archive. The owner looked at the
// questions and disagreed. So print the archive itself and read what it actually
// demands — the model is a proxy, the papers are the thing.
import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';

// 28 of the 33 questions this used to match are 582 ANALYTIC geometry and
// vectors — they mention "מעגל" and "משולש" but they are solved with equations
// of lines, not with congruence theorems. Averaging them into the "exam bar"
// made the Euclidean stages look like they cleared an exam they were never
// being compared to.
const ANALYTIC = /שיעורי|משוואת|ציר ה|\\vec|מישור|פרבול|ראשית הצירים|אליפס|היפרבול/;
const isGeo = (s: string) =>
  /\\triangle|משולש|מרובע|מעגל|טרפז|מקבילית|מעוין/.test(s) &&
  !/גרף|נגזרת|אינטגרל|מרוכב|הסתברות/.test(s) &&
  !ANALYTIC.test(s);

let n = 0;
for (const q of ALL_PAST_BAGRUYOT) {
  const whole = [q.context ?? '', ...(q.parts ?? []).map((p) => p.prompt ?? '')].join(' ');
  if (!isGeo(whole)) continue;
  n++;
  console.log(`\n${'='.repeat(72)}\n${q.id}  `);
  console.log('CONTEXT: ' + String(q.context ?? '').replace(/```geo[\s\S]*?```/g, '[GEO]').trim());
  for (const p of q.parts ?? []) {
    console.log(`  ${p.label}. ${String(p.prompt).replace(/```geo[\s\S]*?```/g, '[GEO]').trim()}`);
  }
}
console.log(`\n${n} geometry questions in the archive`);
