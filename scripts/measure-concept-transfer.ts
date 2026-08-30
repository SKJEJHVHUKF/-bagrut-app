/**
 * measure-concept-transfer.ts — is a topic-wide search safe for `concept` ALONE?
 *
 *   npx tsx scripts/measure-concept-transfer.ts
 *
 * FREE. No model, no network.
 *
 * ============================================================
 * THE DECISION THIS EXISTS TO INFORM
 * ============================================================
 * Cross-question reuse is limited to the same SUB-TOPIC GROUP, and the comment
 * in lib/tutor-faq records why:
 *
 *   same sub-topic only   fires 15.5% · unsafe 1.6%   ← shipping
 *   + whole topic         fires 26.8% · unsafe 5.6%
 *
 * 1.7x the reach for 3.5x the wrong answers. That decision stands and is not
 * being second-guessed here.
 *
 * But it measured ALL transferable kinds together — `concept`, `mistake` and
 * `check`. A `mistake` entry is about the misconception a particular exercise
 * produces, and a `check` entry about how to verify a particular result; both
 * have a foot in their own question. A `concept` entry is about the SUBJECT and
 * is written with no unit numbers at all. Those are not the same risk, and
 * averaging them hides whichever is worse.
 *
 * So: measure `concept` on its own, topic-wide, and let the number decide.
 * If it is clean, 1,739 authored concept answers become reachable from /quiz —
 * where today there are no bank entries at all.
 *
 * ============================================================
 * WHAT COUNTS AS RIGHT
 * ============================================================
 * ⚠️ NOT "did it return the entry the phrasing came from". That was the first
 * version and it scored 0.0% on everything, which looked damning and meant
 * nothing: the pool excludes the phrasing's own unit exactly as the shipping
 * transfer does, so the intended entry is not in it by construction. A
 * measurement whose ground truth is unreachable measures its own setup.
 *
 * The question that matters is whether the answer that IS returned is about the
 * same idea. Proxy: content-word overlap between the two answers, as a fraction
 * of the shorter one. Two entries explaining conditional probability share most
 * of their vocabulary; one about conditional probability and one about
 * combinations do not.
 */

import { buildFaqIndex, matchFaq, buildCorpusIdf } from '../lib/tutor-faq';
import { HELD_POSITIONS, type TutorFaq, type TutorFaqBank } from '../content/tutor-faq/types';

const TOPICS = ['probability', 'sequences', 'trigonometry', 'geometry'];

/** Same grouping rule the shipping transfer uses: the unit id up to the last dash. */
/**
 * How much of one answer's vocabulary the other carries, over the SHORTER one.
 *
 * Over the shorter, not the union: a long careful answer and a short one about
 * the same idea should score high, and dividing by the union would punish the
 * pair for one of them being thorough.
 */
function ideaOverlap(a: string, b: string): number {
  const words = (t: string) =>
    new Set(
      t
        .replace(/[^֐-׿a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 3),
    );
  const A = words(a);
  const B = words(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared++;
  return shared / Math.min(A.size, B.size);
}

/** Above this, two answers are treated as explaining the same idea. */
const SAME_IDEA = 0.45;

const groupOf = (unitId: string) => unitId.replace(/#.*$/, '').replace(/-\d+$/, '');

(async () => {
  for (const topic of TOPICS) {
    let bank: TutorFaqBank;
    try {
      bank = (await import(`../content/tutor-faq/math5/${topic}`)).default as TutorFaqBank;
    } catch {
      continue;
    }

    // Every concept entry in the topic, tagged with the unit it was written on.
    const all: Array<{ unit: string; f: TutorFaq }> = [];
    for (const [unit, list] of Object.entries(bank)) {
      for (const f of list) if (f.kind === 'concept') all.push({ unit, f });
    }
    if (all.length < 20) {
      console.log(`\n${topic}: only ${all.length} concept entries — too few to measure.`);
      continue;
    }

    const idf = buildCorpusIdf(all.map(({ f }) => [f.q, ...f.alts].join(' ')));

    let asked = 0;
    let hitRight = 0;
    let hitWrong = 0;
    let missed = 0;
    let wrongSameGroup = 0;
    const examples: string[] = [];

    for (const { unit, f } of all) {
      // The pool a topic-wide concept search would see: every OTHER unit's
      // concept entries. The entry's own unit is excluded exactly as the
      // shipping transfer excludes it.
      const pool = all.filter((x) => x.unit !== unit).map((x) => x.f);
      if (!pool.length) continue;
      const index = buildFaqIndex(pool, { idf });

      for (const i of HELD_POSITIONS) {
        const alt = f.alts[i];
        if (typeof alt !== 'string' || !alt.trim()) continue;
        asked++;
        const hit = matchFaq(index, alt);
        if (!hit) {
          missed++;
          continue;
        }
        // Ground truth: the phrasing was written for `f`. Two entries can be
        // paraphrases of each other, so identical ANSWER text counts as right.
        const overlap = ideaOverlap(hit.faq.a, f.a);
        if (hit.faq.id === f.id || overlap >= SAME_IDEA) {
          hitRight++;
        } else {
          hitWrong++;
          const sameGroup = groupOf(hit.faq.id ?? '') === groupOf(f.id ?? '');
          if (sameGroup) wrongSameGroup++;
          if (examples.length < 4 && !sameGroup) {
            examples.push(`      "${alt}"  (overlap ${overlap.toFixed(2)})\n        wanted: ${f.a.replace(/[ ]+/g, " ").slice(0, 66)}\n        got:    ${hit.faq.a.replace(/[ ]+/g, " ").slice(0, 66)}`);
          }
        }
      }
    }

    const pct = (n: number) => (asked ? `${((n / asked) * 100).toFixed(1)}%` : '—');
    console.log(`\n=== ${topic} · ${all.length} concept entries, ${asked} held-out phrasings ===\n`);
    console.log(`  answered the SAME idea   ${String(hitRight).padStart(5)}  ${pct(hitRight)}`);
    console.log(`  found a DIFFERENT idea   ${String(hitWrong).padStart(5)}  ${pct(hitWrong)}`);
    console.log(`     …of those, same group ${String(wrongSameGroup).padStart(5)}  (already reachable today)`);
    console.log(`  found nothing            ${String(missed).padStart(5)}  ${pct(missed)}`);
    const newReach = hitRight;
    const newRisk = hitWrong - wrongSameGroup;
    console.log(`\n  topic-wide would ADD    reach ${pct(newReach)} · wrong-idea ${pct(newRisk)}`);
    if (examples.length) {
      console.log('\n  what a wrong idea looks like:\n');
      for (const e of examples) console.log(e);
    }
  }

  console.log(
    '\nThe bar: the shipping same-sub-topic rule runs at 1.6% unsafe. A' +
      '\ntopic-wide concept search is worth enabling only if its wrong-idea' +
      '\nrate is in that neighbourhood — not merely better than the 5.6% that' +
      '\nthe all-kinds version scored.\n',
  );
})();
