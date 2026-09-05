// Probe: what do REAL Israeli bagrut probability questions actually look like?
// The owner asked for the new questions to match "שאלות בגרות שלומדים פה בארץ",
// and the repo holds an archive of real papers — so read the primary source
// rather than reasoning from priors. (The 2026-08-05 lesson in this project:
// counting string occurrences answers "does the word appear", not "what is
// tested" — so this prints the actual prompts.)
// Run: npx tsx scripts/_probe-bagrut-prob.ts
import { ALL_PAST_BAGRUYOT, availableTopics } from '../content/past-bagruyot';

console.log('topics in the archive:', availableTopics().join(' · '), '\n');

const isProb = (t: string) => /הסתבר|קומבינטור/.test(t ?? '');
let n = 0;
const contexts = new Map<string, number>();
const asks = new Map<string, number>();
const partCounts: number[] = [];

for (const q of ALL_PAST_BAGRUYOT) {
  if (!isProb(q.topic)) continue;
  n++;
  partCounts.push((q.parts ?? []).length);
  console.log(`${'='.repeat(78)}`);
  console.log(`שאלון ${q.paper} · ${q.season} ${q.year} · שאלה ${q.questionNumber} · ${q.topic}`);
  if (q.context) console.log(`נתון: ${q.context.replace(/\n/g, ' ')}`);
  for (const p of q.parts ?? []) {
    const prompt = String(p.prompt ?? '').replace(/\n/g, ' ');
    console.log(`  (${p.label}) ${prompt}`);
    const ask = /כמה|מספר/.test(prompt) ? 'count'
      : /הוכח|נמק|הסבר|האם/.test(prompt) ? 'justify'
      : /מצא את|חשב|מהי ההסתברות|מה ההסתברות/.test(prompt) ? 'compute'
      : 'other';
    asks.set(ask, (asks.get(ask) ?? 0) + 1);
  }
  console.log('');
  const text = `${q.context ?? ''} ${(q.parts ?? []).map((p) => p.prompt).join(' ')}`;
  for (const [k, re] of [
    ['כד/גולות/כדורים', /כד\b|גול|כדור/], ['מפעל/מכונות/פגום', /מפעל|מכונ|פגום|תקין|מוצר/],
    ['בדיקה רפואית', /בדיקה|חול|מחל|נגיף|חיסון/], ['תלמידים/כיתה', /תלמיד|כיתה|בית ספר|סטודנט/],
    ['קובייה/מטבע', /קובי|מטבע/], ['קלפים', /קלף|חפיסה/],
    ['ספורט', /קלע|שער|משחק|קבוצ|סל/], ['תחבורה', /אוטובוס|רכבת|נסיע|טיסה/],
    ['עובדים/חברה', /עובד|חברה|מפקח/], ['מלאי/חנות', /חנות|מלאי|לקוח|קונ/],
  ] as [string, RegExp][]) if (re.test(text)) contexts.set(k, (contexts.get(k) ?? 0) + 1);
}

console.log(`${'='.repeat(78)}\nSUMMARY: ${n} probability questions in the archive`);
if (n) {
  console.log('parts per question:', partCounts.join(', '), `(avg ${(partCounts.reduce((a, b) => a + b, 0) / n).toFixed(1)})`);
  console.log('contexts:', [...contexts].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '));
  console.log('part asks:', [...asks].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '));
}
