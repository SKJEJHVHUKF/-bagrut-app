// Scratch: validate every ```geo fence reachable from the 5 geometry stages,
// so a figure can be checked without running the whole content gate.
import { getSubTopic, getLesson } from '../content/lessons';
import { checkGeoFences } from '../lib/geo-figure';

const IDS = ['eg-similarity', 'eg-thales', 'eg-circle', 'eg-method', 'eg-mixed'];

let fences = 0;
let bad = 0;

function scan(where: string, text: unknown) {
  if (typeof text !== 'string' || !text.includes('```geo')) return;
  fences += (text.match(/```geo/g) ?? []).length;
  const errs = checkGeoFences(text);
  for (const e of errs) {
    bad++;
    console.log(`✗ ${where}: ${e}`);
  }
}

function walk(where: string, node: unknown) {
  if (typeof node === 'string') return scan(where, node);
  if (Array.isArray(node)) return node.forEach((v, i) => walk(`${where}[${i}]`, v));
  if (node && typeof node === 'object')
    for (const [k, v] of Object.entries(node)) walk(`${where}.${k}`, v);
}

for (const id of IDS) {
  const st = getSubTopic('math5', 'גיאומטריה אוקלידית', id);
  if (!st) {
    console.log(`MISSING ${id}`);
    continue;
  }
  walk(id, st);
}

// Bagrut questions live on the TOPIC, not on the sub-topic, so the loop above
// never reaches their context figures.
walk('bagrut', (getLesson('math5', 'גיאומטריה אוקלידית') as { bagrutQuestions?: unknown })?.bagrutQuestions);
console.log(`\n${fences} geo fences · ${bad} problems`);
process.exit(bad ? 1 : 0);
