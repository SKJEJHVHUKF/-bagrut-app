/* Probe: candidate detectors for the THINKING moves of a מנה ושורש bagrut
 * section (a function built from f, |f|, parity, counting solutions), read
 * against the real corpus BEFORE any of them enters scripts/_rq-extra-check.ts.
 * Every earlier detector bug in this repo was a common Hebrew or LaTeX token
 * matching prose nobody thought of, so each candidate prints what it matched.
 * Run: npx tsx scripts/_probe-rq-thinking-detectors.ts */
import { ROOT_QUOTIENT_STAGES } from '../content/lessons/math5/functions-root-quotient';
import { buildSubTopicLevels } from '../lib/roadmap-levels';
import { ALL_PAST_BAGRUYOT } from '../content/past-bagruyot';

const CANDIDATES: [string, RegExp][] = [
  ['parity', /(?<!\p{L})ה?(?:אי[- ])?זוגי(?:ת|ות)(?!\p{L})|סימטרי\S*\s+(?:ביחס|סביב)/u],
  ['solution-count', /מספר הפתרונות|כמה פתרונות|פתרון יחיד|בדיוק פתרון|שני פתרונות|אין (?:לה )?פתרונות?|ישר אופקי|כמה נקודות משותפות|מספר הנקודות המשותפות|בדיוק נקוד\S*\s+משותפ/],
  ['absolute', /(?<!\p{L})ה?ערך ה?מוחלט|\|\s*f\(x\)|\\big\|\s*f|\\left\|/u],
  ['built-from-f', /\\dfrac\{[^{}]*\}\{\s*(?:\\big\(|\\left\(|\()?f\(x\)|f\(x\)\s*(?:\\big\)|\\right\)|\))\^|\\sqrt\{\s*f\(x\)|f\(x\)\s*\\cdot\s*[gh]\(x\)|[gh]\(x\)\s*\\cdot\s*f\(x\)|[gh]\s*'\s*\(x\)\s*=\s*f\(x\)/],
  ['derivative-graph (live)', /גרף הנגזרת|f\s*['׳]|הנגזרת השנייה|f''/],
];

type Doc = { id: string; text: string };
const stage: Doc[] = [];
for (const st of ROOT_QUOTIENT_STAGES) {
  for (const lv of buildSubTopicLevels('math5', 'פונקציות', st)) {
    for (const q of lv.questions) stage.push({ id: q.id, text: `${q.question} ${q.solution.steps.join(' ')}` });
    for (const b of lv.bagrut)
      for (const p of b.parts) stage.push({ id: `${b.id}/${p.label}`, text: `${b.context ?? ''} ${p.prompt} ${p.solution.steps.join(' ')}` });
  }
}
const archive: Doc[] = [];
for (const q of ALL_PAST_BAGRUYOT) {
  if (!q.id.includes('571')) continue;
  for (const p of q.parts ?? [])
    archive.push({ id: `${q.id}/${p.label}`, text: `${q.context ?? ''} ${p.prompt ?? ''} ${(p.solution?.steps ?? []).join(' ')}` });
}
if (!stage.length || !archive.length) {
  console.log(`EMPTY CORPUS — stage ${stage.length}, archive ${archive.length}: the probe is broken, not the content`);
  process.exit(1);
}

const snip = (t: string, re: RegExp) => {
  const m = t.match(re);
  if (!m || m.index === undefined) return '';
  return t.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30).replace(/\s+/g, ' ');
};
const onlyQ = (t: string) => t; // the whole text: question AND steps, exactly what mechanismsOf reads

for (const [name, re] of CANDIDATES) {
  const s = stage.filter((d) => re.test(onlyQ(d.text)));
  const a = archive.filter((d) => re.test(onlyQ(d.text)));
  console.log(`\n== ${name}: stage ${s.length}/${stage.length} · archive ${a.length}/${archive.length}`);
  for (const d of s.slice(0, 8)) console.log(`   S ${d.id.padEnd(26)} …${snip(d.text, re)}…`);
  for (const d of a.slice(0, 14)) console.log(`   A ${d.id.padEnd(26)} …${snip(d.text, re)}…`);
}
