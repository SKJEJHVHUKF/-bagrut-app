/**
 * verify-lesson-clarity.ts — which lesson blocks are hardest to follow, ranked.
 *   npx tsx scripts/verify-lesson-clarity.ts            top 20
 *   npx tsx scripts/verify-lesson-clarity.ts --top=50
 *   npx tsx scripts/verify-lesson-clarity.ts --topic=vectors
 *
 * WHY RANK INSTEAD OF PASS/FAIL
 * There are 327 `teach` blocks across 42k lines of content. A gate that says
 * "148 blocks fail" is not actionable — it is a wall. This sorts by how hard a
 * block is to read, so the worst ones can be fixed first and the improvement
 * measured. Nothing here blocks a build; the exit code is always 0.
 *
 * THE THREE MEASURES, AND WHY THESE THREE
 * Itay named three problems: walls of text, language too high, and solutions
 * that skip steps. Two of those turned out to be measurable as stated. One did
 * not, and was replaced rather than faked:
 *
 *   1. WALL — the longest paragraph in the block. Exact.
 *   2. SENTENCE — the longest sentence, math spans removed first. Exact.
 *   3. BARE MATH — a solution step that is math with (almost) no words.
 *      "מציבים: $x = 3$" explains itself; "$\Delta = 25 - 24 = 1$" does not.
 *
 * ⚠️ MEASURE 2 REPLACED A REGISTER DETECTOR THAT MEASUREMENT KILLED.
 * The plan was to flag literary Hebrew with plain equivalents (אשר, לפיכך,
 * מחד, מאידך, בטרם …). Counted against the real corpus with word boundaries,
 * that list finds 53 hits in 42,292 lines — and `אשר` scores 0, because all
 * 155 raw matches were `כאשר`, exactly as `מחד` was all `מחדש`. What survives
 * is mostly `כלשהי`, which is correct mathematical Hebrew ("פונקציה כלשהי").
 * There is no formal-register problem in this corpus to detect. Sentence
 * length is what actually makes these blocks feel dense, and unlike a word
 * list it needs no judgement call per hit. (scripts/verify-tutor-notes.ts
 * documents the same discipline: a detector whose hits are mostly noise gets
 * narrowed or dropped, never shipped.)
 */
import { getLesson, allLessonKeys } from '@/content/lessons';

const TOP = Number(process.argv.find((a) => a.startsWith('--top='))?.slice(6)) || 20;
const ONLY = process.argv.find((a) => a.startsWith('--topic='))?.slice(8);

/** A paragraph past this is a wall; a student loses the thread inside it. */
const WALL = 450;
/** A sentence past this needs re-reading, whatever words it uses. */
const SENTENCE = 180;
/**
 * Hebrew letters left in a solution step after the math is stripped out.
 *
 * CALIBRATED AGAINST THE CORPUS, NOT CHOSEN. Over 1,911 solution steps the
 * distribution is: 282 with zero Hebrew, 115 at 1–4, 393 at 5–8, 399 at 9–14,
 * 722 at 15+. The first threshold tried was 15, which flagged 446 solutions —
 * and swept in real explanations: "הפרש ריבועים:" is 11 letters and names the
 * technique, which is exactly the explanation a student needs.
 *
 * So only ZERO scores. A step with no Hebrew at all cannot be explaining
 * anything; a step with even a short label is at least pointing at the method.
 * TERSE is reported as a softer count and never scored — it is a judgement
 * call, and a ranked list stops being trusted the moment it argues.
 */
const BARE = 0;
const TERSE = 8;

type Finding = {
  where: string;
  id: string;
  kind: 'teach' | 'keyPoint' | 'solution';
  score: number;
  wall: number;
  sentence: number;
  bare: number;
  worst: string;
};

const findings: Finding[] = [];
let blocks = 0;
let terseSteps = 0;

/** LaTeX carries `.` and `!`, which would shatter sentence splitting. */
const stripMath = (s: string) => s.replace(/\$[^$]*\$/g, ' ');
const hebrew = (s: string) => (s.match(/[א-ת]/g) ?? []).length;

function longestParagraph(text: string): number {
  return Math.max(0, ...text.split(/\n\s*\n/).map((p) => p.trim().length));
}

function longestSentence(text: string): { len: number; text: string } {
  const sentences = stripMath(text)
    .split(/[.!?]\s|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  let best = { len: 0, text: '' };
  for (const s of sentences) if (s.length > best.len) best = { len: s.length, text: s };
  return best;
}

/** Steps that are pure math: the derivation is shown, the reason is not. */
function bareMathSteps(steps: string[]): { count: number; terse: number; first: string } {
  let count = 0;
  let terse = 0;
  let first = '';
  for (const s of steps) {
    const h = hebrew(stripMath(s));
    if (h === BARE) {
      count++;
      if (!first) first = s;
    } else if (h <= TERSE) {
      terse++;
    }
  }
  return { count, terse, first };
}

for (const { subject, topic } of allLessonKeys()) {
  if (ONLY && !topic.includes(ONLY)) continue;
  const lesson = getLesson(subject, topic);
  if (!lesson) continue;

  for (const st of lesson.subTopics ?? []) {
    const where = `${topic} · ${st.title ?? ''}`;

    (st.lesson ?? []).forEach((step: { title?: string; teach?: string }, i: number) => {
      const teach = step.teach ?? '';
      if (!teach.trim()) return;
      blocks++;
      const wall = longestParagraph(teach);
      const sent = longestSentence(teach);
      // Only the overshoot counts, so a block is ranked by how far past the
      // threshold it is — not by its total length. A long block made of short
      // paragraphs is fine and must not outrank a genuinely dense short one.
      const score = Math.max(0, wall - WALL) + Math.max(0, sent.len - SENTENCE) * 2;
      if (score > 0) {
        findings.push({
          where,
          id: `${st.id}.lesson[${i}] ${step.title ?? ''}`.trim(),
          kind: 'teach',
          score,
          wall,
          sentence: sent.len,
          bare: 0,
          worst: sent.len > SENTENCE ? sent.text : teach.slice(0, 160),
        });
      }
    });

    (st.keyPoints ?? []).forEach((k: string, i: number) => {
      const sent = longestSentence(k);
      if (sent.len > SENTENCE) {
        findings.push({
          where,
          id: `${st.id}.keyPoints[${i}]`,
          kind: 'keyPoint',
          score: (sent.len - SENTENCE) * 2,
          wall: k.length,
          sentence: sent.len,
          bare: 0,
          worst: sent.text,
        });
      }
    });

    for (const q of (st.questions ?? []) as { id?: string; solution?: { steps?: string[] } }[]) {
      const steps = q.solution?.steps ?? [];
      if (!steps.length) continue;
      const { count, terse, first } = bareMathSteps(steps);
      terseSteps += terse;
      // Every step bare is a formula sheet, not a solution — weight by share,
      // so a 2-of-3 question outranks a 2-of-12 one.
      if (count) {
        findings.push({
          where,
          id: `${q.id ?? '(no id)'}.solution`,
          kind: 'solution',
          score: Math.round((count / steps.length) * 300),
          wall: 0,
          sentence: 0,
          bare: count,
          worst: `${count}/${steps.length} צעדים ללא מילה אחת — «${first.slice(0, 90)}»`,
        });
      }
    }
  }
}

findings.sort((a, b) => b.score - a.score);

const teach = findings.filter((f) => f.kind === 'teach');
const keys = findings.filter((f) => f.kind === 'keyPoint');
const sol = findings.filter((f) => f.kind === 'solution');

console.log(`scanned ${blocks} teach blocks\n`);
console.log(`  ${teach.length} dense teach blocks (paragraph > ${WALL} or sentence > ${SENTENCE})`);
console.log(`  ${keys.length} over-long key points`);
console.log(`  ${sol.length} solutions containing a step with no Hebrew at all`);
console.log(`  ${terseSteps} further steps under ${TERSE} Hebrew letters — reported, not scored\n`);
console.log(`worst ${Math.min(TOP, findings.length)} of ${findings.length}, hardest first:\n`);

for (const f of findings.slice(0, TOP)) {
  const detail =
    f.kind === 'solution'
      ? ''
      : `  [paragraph ${f.wall} · sentence ${f.sentence}]`;
  console.log(`${String(f.score).padStart(5)}  ${f.where}`);
  console.log(`       ${f.id}${detail}`);
  console.log(`       «${f.worst.slice(0, 150).replace(/\s+/g, ' ')}…»\n`);
}

export {};
