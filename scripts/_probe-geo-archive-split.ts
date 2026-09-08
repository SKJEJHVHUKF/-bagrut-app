// Does the archive contain any EUCLIDEAN geometry, or only analytic/vectors?
//
// verify-geo-ladder's "exam reach" divides each stage's אתגר score by the mean
// hardest part of the archive's geometry questions. If those questions are all
// 582 analytic-geometry and vector questions, the denominator has nothing to do
// with the Euclidean stages and the percentage is confidently meaningless.
import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';

const ANALYTIC = /שיעורי|משוואת|ציר ה|\\vec|מישור|פרבול|ראשית הצירים|אליפס|היפרבול/;
const EUCLID = /חפיפ|חופפ|דומים|דמיון|מיתר|משיק|קטע אמצעים|תאלס|צ\.ז\.צ|היקפית/;

let analytic = 0;
const euclid: string[] = [];
for (const q of ALL_PAST_BAGRUYOT) {
  const whole = [q.context ?? '', ...(q.parts ?? []).map((p) => p.prompt ?? '')].join(' ');
  if (!/\\triangle|משולש|מרובע|מעגל|טרפז|מקבילית|מעוין/.test(whole)) continue;
  if (/גרף|נגזרת|אינטגרל|מרוכב|הסתברות/.test(whole)) continue;
  if (ANALYTIC.test(whole)) analytic++;
  else if (EUCLID.test(whole)) euclid.push(q.id);
  else euclid.push(`${q.id} (no euclid marker either)`);
}
console.log(`analytic / vectors : ${analytic}`);
console.log(`euclidean          : ${euclid.length}`);
for (const e of euclid) console.log('   ' + e);
