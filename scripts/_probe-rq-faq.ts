// Throwaway: which מנה ושורש units already have tutor-FAQ entries, and how many.
// Run: npx tsx scripts/_probe-rq-faq.ts
import { getSubTopic } from '../content/lessons';
import bank from '../content/tutor-faq/math5/functions';

const TOPIC = 'פונקציות';
const STAGES = [
  'rq-domain', 'rq-intersections', 'rq-asymptotes', 'rq-derivative',
  'rq-sketch', 'rq-transformations', 'rq-integral', 'rq-bagrut-mixed',
];

const keys = Object.keys(bank as Record<string, unknown>);
console.log(`bank units: ${keys.length}, total entries: ${Object.values(bank as Record<string, unknown[]>).reduce((a, v) => a + v.length, 0)}`);
console.log(`sample unit keys: ${keys.slice(0, 6).join(' | ')}`);

let banked = 0, unbanked = 0;
const missing: string[] = [];
for (const id of STAGES) {
  const st = getSubTopic('math5', TOPIC, id);
  if (!st) continue;
  const ids = (st.questions ?? []).map((q) => q.id);
  const have = ids.filter((q) => keys.some((k) => k === q || k.endsWith(`/${q}`) || k.includes(q)));
  banked += have.length;
  unbanked += ids.length - have.length;
  const miss = ids.filter((q) => !have.includes(q));
  if (miss.length) missing.push(`${id}: ${miss.join(', ')}`);
  console.log(`${id.padEnd(20)} ${have.length}/${ids.length} banked`);
}
console.log(`\nbanked ${banked}, unbanked ${unbanked}`);
if (missing.length) console.log('missing:\n  ' + missing.join('\n  '));
