// The full difficulty/variety picture for גיאומטריה, per sub-topic.
// Itay, 2026-09-05: "חשוב לי מאוד הגיוון בשאלות ועליה הדרגתית ברמת הקושי
// בשאלות עד לרמת בגרות שבאמת יהיה עליה וגיוון".
//
// Reports, per sub-topic: rung sizes, and every near-duplicate pair ACROSS the
// whole ladder — including the lesson's worked example and drill, which the
// student meets on רמת לומדים and which no previous probe compared against the
// practice questions at all.

import { math5EuclideanGeometry as G } from '../content/lessons/math5/euclidean-geometry';
import { getBagrutQuestionsForSubTopic } from '../content/lessons';
import { stripFigureFences } from '../lib/geo-figure';

const TOPIC = 'גיאומטריה אוקלידית';

/** Hebrew/number content words only — figures, LaTeX and punctuation stripped. */
function words(s: string): Set<string> {
  const t = stripFigureFences(s, ' ')
    .replace(/\$[^$]*\$/g, ' ')      // math islands carry letters, not meaning
    .replace(/[^֐-׿0-9]+/g, ' ');
  return new Set(t.split(' ').filter((w) => w.length > 2));
}
/**
 * CONTAINMENT, not Jaccard. A worked example that asks two things ("(1) trapezoid
 * … (2) rhombus …") and a practice question that asks only the first are the same
 * question to the student, but Jaccard divides by the union and scores them
 * apart — which is exactly how eg-shp-004 hid from the first version of this
 * probe, while Itay found it in about a minute by reading the screen.
 */
function overlap(a: Set<string>, b: Set<string>): number {
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  let hit = 0;
  for (const w of small) if (big.has(w)) hit++;
  const contained = hit / Math.max(1, small.size);

  // ⚠️ CONTAINMENT IS MEANINGLESS ON A TINY SET. Once the math islands are
  // stripped, "במשולש ABC, DE ∥ BC. נתון AD=3, DB=6, AE=4. מצא EC" leaves three
  // content words — במשולש / נתון / מצא — and every longer geometry question
  // contains all three, so it scored 100% against questions it has nothing to do
  // with. That fired on six pairs at once and would have sent me rewriting
  // content that was already fine. Below the floor, fall back to Jaccard, which
  // divides by the union and cannot be gamed by brevity.
  const MIN_FOR_CONTAINMENT = 6;
  if (small.size >= MIN_FOR_CONTAINMENT) return contained;
  return hit / Math.max(1, new Set([...a, ...b]).size);
}

/**
 * The GIVENS of a question, as a sorted number list.
 *
 * Itay found eg-shp-004 ("בטרפז הבסיסים 8 ו-14, מצא את קטע האמצעים") repeating
 * its own lesson example by reading two screens; both word measures missed it,
 * because the example also asks a second, unrelated part about a rhombus and
 * that dilutes every text metric. What actually gives it away is that the
 * numbers are the SAME numbers — a question re-using 8 and 14 for the same task
 * is the same exercise no matter how the sentence is worded.
 */
function nums(s: string): string[] {
  return (stripFigureFences(s, ' ').match(/(?<![\w.])\d+(?:\.\d+)?/g) ?? []).sort((a, b) => +a - +b);
}
/** every given of the shorter question also appears in the longer one */
function numsContained(a: string[], b: string[]): boolean {
  const [small, big] = a.length <= b.length ? [a, b] : [b, a];
  if (small.length < 2) return false;
  const pool = [...big];
  for (const v of small) {
    const i = pool.indexOf(v);
    if (i < 0) return false;
    pool.splice(i, 1);
  }
  return true;
}

type Item = { rung: string; id: string; text: string; w: Set<string>; n: string[] };

let totalHard = 0, totalDup = 0;
for (const st of G.subTopics ?? []) {
  const items: Item[] = [];
  (st.lesson ?? []).forEach((l, n) => {
    if (l.example) items.push({ rung: 'לומדים', id: `step${n}.example`, text: l.example.problem, w: words(l.example.problem), n: nums(l.example.problem) });
    if (l.drill) items.push({ rung: 'לומדים', id: l.drill.id, text: l.drill.question, w: words(l.drill.question), n: nums(l.drill.question) });
  });
  for (const q of st.questions ?? []) {
    const rung = q.difficulty === 'easy' ? 'חימום' : q.difficulty === 'mid' ? 'ביסוס' : 'אתגר';
    items.push({ rung, id: q.id, text: q.question, w: words(q.question), n: nums(q.question) });
  }
  // CONTEXT + PART, not the part alone. A bagrut part reads "חשב את שטח המעוין"
  // — four words, no numbers, because the givens live in the shared context the
  // student is looking at while they answer it. Comparing the part on its own
  // made the whole בגרות rung invisible to this audit, and that is precisely
  // where Itay found the worst repeat: eg-shp-006 (אתגר) is the same rhombus
  // with the same 12 and 16 as eg-bag-010, asking for the same area and side.
  for (const b of getBagrutQuestionsForSubTopic('math5', TOPIC, st.id))
    for (const [i, p] of (b.parts ?? []).entries()) {
      const text = `${b.context ?? ''} ${p.prompt ?? ''}`.trim();
      items.push({ rung: 'בגרות', id: `${b.id}/${p.label ?? i}`, text, w: words(text), n: nums(text) });
    }

  const n = (r: string) => items.filter((x) => x.rung === r).length;
  const hard = n('אתגר');
  totalHard += hard;
  console.log(`\n### ${st.id} — לומדים ${n('לומדים')} · חימום ${n('חימום')} · ביסוס ${n('ביסוס')} · אתגר ${hard}${hard <= 1 ? ' ⚠️ THIN' : ''} · בגרות ${n('בגרות')}`);

  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) {
      if (items[i].rung === items[j].rung) continue;
      const sim = overlap(items[i].w, items[j].w);
      // Same givens + a real slice of shared wording = the same exercise, even
      // when the sentences differ enough to fool the word measures.
      const sameGivens = numsContained(items[i].n, items[j].n) && sim >= 0.4;
      if (sim >= 0.7 || sameGivens) {
        totalDup++;
        console.log(`  ⚠️ ${(sim * 100).toFixed(0)}%${sameGivens && sim < 0.7 ? ' [same givens ' + items[i].n.join(',') + ' / ' + items[j].n.join(',') + ']' : ''}  ${items[i].rung}/${items[i].id}  ~  ${items[j].rung}/${items[j].id}`);
        console.log(`        «${stripFigureFences(items[i].text, '').replace(/\s+/g, ' ').slice(0, 78)}»`);
        console.log(`        «${stripFigureFences(items[j].text, '').replace(/\s+/g, ' ').slice(0, 78)}»`);
      }
    }
}
console.log(`\n=== ${totalHard} אתגר questions across the topic, ${totalDup} cross-rung near-duplicates ===`);
