/* Throwaway: every archived bagrut question whose function is a quotient or a root,
 * with its context and part prompts, so new רמה 8 questions are modelled on the exam. */
import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';

const isRQ = (s: string) =>
  /\\d?frac\s*\{[^}]*\}\s*\{[^}]*x[^}]*\}/.test(s) || /\\sqrt\s*(\[[^\]]*\])?\s*\{[^}]*x/.test(s) || /\\sqrt\s*x/.test(s);
const full = process.argv.includes('--full');
let n = 0;
for (const q of ALL_PAST_BAGRUYOT) {
  const whole = [q.context ?? '', ...(q.parts ?? []).map((p) => p.prompt ?? '')].join(' ');
  if (!isRQ(whole)) continue;
  n++;
  console.log(`\n# ${q.id}  (${(q.parts ?? []).length} parts)`);
  console.log(`  ${(q.context ?? '').replace(/\s+/g, ' ').slice(0, full ? 2000 : 260)}`);
  for (const p of q.parts ?? []) console.log(`  ${p.label}) ${(p.prompt ?? '').replace(/\s+/g, ' ').slice(0, full ? 2000 : 200)}`);
}
console.log(`\n${n} quotient/root questions of ${ALL_PAST_BAGRUYOT.length} archived`);
