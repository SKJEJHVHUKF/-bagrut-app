/* Every מנה ושורש question whose expected answer is a SET but which offers one
 * unlabelled box — the student has to guess the separator (owner, 2026-09-10). */
import { ROOT_QUOTIENT_STAGES } from '../content/lessons/math5/functions-root-quotient';

for (const st of ROOT_QUOTIENT_STAGES) {
  for (const q of st.questions ?? []) {
    if (q.kind !== 'open') continue;
    const e = q.expected;
    if (e?.kind === 'set' && !q.answerLabels) {
      console.log(`${st.id}\t${q.id}\t[${e.values.join(' | ')}]\t${q.question.replace(/\n/g, ' ').slice(0, 90)}`);
    }
  }
}
