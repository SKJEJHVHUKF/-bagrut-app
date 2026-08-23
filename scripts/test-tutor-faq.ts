/**
 * test-tutor-faq.ts — does the FAQ matcher recognise "the same idea in other
 * words", and does it refuse a question about a DIFFERENT solution?
 *
 *   npx tsx scripts/test-tutor-faq.ts                 # merged banks
 *   npx tsx scripts/test-tutor-faq.ts <file.json>     # an authoring slice
 *
 * Two numbers, both measured on phrasings the matcher has NEVER indexed:
 *
 *   recall     the last 2 `alts` of every entry are held out of the index and
 *              fired as blind queries at their own unit → must land on their
 *              entry (not merely "some entry")
 *   noise      messages no unit has an entry for are fired at every unit and
 *              must return null. THIS is the number that maps to a production
 *              failure: in production only the CURRENT unit's entries are
 *              searched, so the way a student gets a wrong answer is by asking
 *              something this unit does not cover and being matched anyway.
 *
 *   far hit    held-out queries are also fired at a unit from a DIFFERENT
 *              SUB-TOPIC and must return null — a measure of how specific the
 *              entries are.
 *
 *              ⚠️ Deliberately NOT the adjacent unit. Consecutive drills in one
 *              sub-topic are near-identical by design (`seq-arg-007` and
 *              `seq-arg-008` differ by a sign), so "מאיפה המינוס 3" matching
 *              both is correct behaviour, not a false hit — and each unit
 *              answers it about ITS OWN numbers. Counting those was inflating
 *              the rate to 5.8% and would have pushed someone to weaken real
 *              entries to satisfy a metric measuring a scenario production
 *              cannot reach.
 *
 * Also renders every answer through the voice checks used for templates:
 * no Hebrew inside $…$, no unfilled braces, no leading latin/maths char.
 */

import { readFileSync } from 'fs';
import { buildCorpusIdf, buildFaqIndex, matchFaq, stepReference, tokenGroups, tokens } from '../lib/tutor-faq';
import { classifyAsk } from '../lib/tutor-local';
import type { TutorFaq, TutorFaqBank } from '../content/tutor-faq/types';

/** Alts at these 0-based positions are held out (2 of ≥7). Fixed positions in
 *  the MIDDLE, not "the last two": an author told "the last two are the test"
 *  writes two outliers there and the number stops meaning anything. */
const HELD_POSITIONS = new Set([1, 4]);
const MIN_RECALL = 0.85;
/** Noise is the production-relevant failure: nothing that no unit covers may
 *  ever be answered. Held to near-zero. */
const MAX_NOISE = 0.02;
/** Cross-sub-topic specificity. Looser than noise because a legitimately
 *  general question ("איך בודקים את התשובה") can fit two sub-topics. */
const MAX_FAR = 0.08;

/** `seq-arg-007` → `seq-arg`, `prob-bag-009/ד` → `prob-bag`. Units sharing a
 *  group are variations of one exercise type. */
function group(unit: string): string {
  return unit.replace(/\/.*$/, '').replace(/[-_]?\d+$/, '');
}

/** Kinds whose questions are specific to one unit's numbers/steps. Only these
 *  are fired at a NEIGHBOUR unit to count false hits — "איך בודקים" matching
 *  the neighbour's own check entry is the right answer for a student sitting
 *  on the neighbour, not a false hit. */
const UNIT_SPECIFIC = new Set(['where-from', 'why-not', 'what-if', 'why-step']);

/** Student messages that have NO entry on any unit and must stay null —
 *  the model's job. A matcher that answers these with confidence is worse than
 *  one that pays. */
const NOISE = [
  'מה ההבדל בין תוחלת לממוצע',
  'כמה זמן יש בבגרות לשאלה כזאת',
  'מה הנוסחה לסכום סדרה הנדסית',
  'אפשר להשתמש במחשבון בבגרות',
  'איך כותבים את זה יפה במחברת',
  'מה זה בכלל נגזרת',
  'תסביר לי על וקטורים',
  'מה הציון שלי',
  'יש לי מבחן מחר מה לעשות',
  'למה אני לא מבין כלום',
  'מה ההבדל בין חשבונית להנדסית',
  'איזה נושאים יש בשאלון 571',
];

let checks = 0;
let failures = 0;
const bad = (m: string) => { failures++; if (failures <= 15) console.log(`FAIL  ${m}`); };

async function loadBanks(): Promise<Record<string, TutorFaqBank>> {
  const file = process.argv[2];
  if (file) {
    // An authoring slice: [{ unit, faqs: TutorFaq[] }] or a bank object.
    const raw = JSON.parse(readFileSync(file, 'utf8'));
    if (Array.isArray(raw)) {
      const bank: TutorFaqBank = {};
      for (const r of raw) bank[r.unit] = r.faqs;
      return { [file]: bank };
    }
    return { [file]: raw };
  }
  const seq = (await import('../content/tutor-faq/math5/sequences')).default;
  const prob = (await import('../content/tutor-faq/math5/probability')).default;
  return { 'סדרות': seq, 'הסתברות': prob };
}

function hebrewInMath(text: string): string | null {
  const parts = text.split('$');
  for (let i = 1; i < parts.length; i += 2) if (/[֐-׿]/.test(parts[i])) return parts[i];
  return null;
}

/**
 * `--trace "<student text>" [file]` — why did THIS message land where it did?
 * Prints the query's token groups and, per unit, the top entries with the
 * phrasing that scored and how many groups it matched. The tool that found
 * every matcher bug so far; reading the code found none of them.
 */
async function trace(text: string) {
  const banks = await loadBanks();
  console.log(`query: "${text}"\ngroups: ${JSON.stringify(tokenGroups(text))}`);
  for (const [topic, bank] of Object.entries(banks)) {
    const units = Object.entries(bank).filter(([, f]) => f.length > 0);
    const idf = buildCorpusIdf(units.flatMap(([, fs]) => fs.flatMap((f) => [f.q, ...f.alts])));
    for (const [unit, faqs] of units) {
      const index = buildFaqIndex(faqs, { idf });
      const hit = matchFaq(index, text, { step: stepReference(text, 99) });
      const groups = tokenGroups(text);
      const rows = index.items.map((it) => {
        let best = 0, bestDoc = '', bestM = 0;
        it.docs.forEach((d, i) => {
          const m = groups.filter((g) => g.some((t) => d.has(t))).length;
          const s = m / Math.max(1, groups.length);
          if (s > best) { best = s; bestDoc = [it.faq.q, ...it.faq.alts][i]; bestM = m; }
        });
        return { id: it.faq.id, m: bestM, doc: bestDoc };
      }).filter((r) => r.m > 0).sort((a, b) => b.m - a.m).slice(0, 4);
      if (!rows.length) continue;
      console.log(`\n[${topic} · ${unit}] → ${hit ? `${hit.faq.id} score ${hit.score.toFixed(2)} margin ${hit.margin.toFixed(2)}` : 'null'}`);
      for (const r of rows) console.log(`   matched ${r.m}/${groups.length}  ${r.id}  ← "${r.doc}"`);
    }
  }
}

(async () => {
  const traceAt = process.argv.indexOf('--trace');
  if (traceAt >= 0) {
    const text = process.argv[traceAt + 1];
    process.argv.splice(traceAt, 2);
    await trace(text);
    return;
  }
  const banks = await loadBanks();
  let queries = 0, recalled = 0, entries = 0, collisions = 0;
  let farQueries = 0, farHits = 0, noiseQueries = 0, noiseHits = 0;
  const missed: string[] = [];

  for (const [topic, bank] of Object.entries(banks)) {
    const units = Object.entries(bank).filter(([, f]) => f.length > 0);
    if (units.length === 0) { console.log(`${topic}: empty bank — nothing to measure`); continue; }

    // Topic-wide IDF, as production computes it — minus the held-out alts,
    // which the index must never have seen in any form.
    const topicIdf = buildCorpusIdf(
      units.flatMap(([, fs]) => fs.flatMap((f) => [f.q, ...f.alts.filter((_, i) => !HELD_POSITIONS.has(i))])),
    );

    for (const [unit, faqs] of units) {
      entries += faqs.length;
      for (const f of faqs) {
        checks++;
        if (f.alts.length < 5) bad(`${f.id}: only ${f.alts.length} alts (need ≥5)`);
        const heb = hebrewInMath(f.a);
        if (heb) bad(`${f.id}: Hebrew inside $…$ → "${heb.slice(0, 30)}"`);
        // Slot check OUTSIDE maths only — `\dfrac{1}{3}` is not a hole.
        if (/\{[a-zA-Z0-9]+\}/.test(f.a.replace(/\$[^$]*\$/g, ''))) bad(`${f.id}: unfilled {slot} in answer`);
        const first = f.a.trimStart()[0] ?? '';
        if (first === '$' || /[A-Za-z0-9]/.test(first)) bad(`${f.id}: answer opens on "${first}" → bidi flip`);
        if ((f.a.match(/\$/g) ?? []).length % 2) bad(`${f.id}: odd number of $ in answer`);
        if (f.a.length < 40) bad(`${f.id}: answer too short (${f.a.length})`);
        if (tokens(f.q).length === 0) bad(`${f.id}: canonical question has no tokens`);
      }

      // Collisions: two entries of one unit whose phrasings reduce to the same
      // content words cannot be told apart by any matcher ("איך בודקים מותנה"
      // under CHECK vs "איך יודעים שזה מותנה" under CONCEPT). Reported so the
      // authoring loop rewrites one of them; the brief forbids it.
      const contentOf = (s: string) => tokenGroups(s).map((g) => g[0]).filter((t) => !/^(למה|מה|איך|מאיפה|איפה|כמה|מי)$/.test(t)).sort().join(' ');
      const seenContent = new Map<string, string>();
      for (const f of faqs) {
        for (const p of [f.q, ...f.alts]) {
          const key = contentOf(p);
          if (!key) continue;
          const prev = seenContent.get(key);
          if (prev && prev !== f.id) { collisions++; if (collisions <= 8) console.log(`  ≈ collision: "${p}" (${f.id}) ~ ${prev}`); }
          else seenContent.set(key, f.id);
        }
      }

      // Hold out the alts at HELD_POSITIONS of every entry.
      const held = (_f: TutorFaq, altIdx: number) => HELD_POSITIONS.has(altIdx);
      const index = buildFaqIndex(faqs, { exclude: held, idf: topicIdf });
      const heldAlts = (f: TutorFaq) => f.alts.filter((_, i) => HELD_POSITIONS.has(i));

      for (const f of faqs) {
        for (const alt of heldAlts(f)) {
          queries++;
          const hit = matchFaq(index, alt, { step: stepReference(alt, 99) });
          if (hit?.faq.id === f.id) recalled++;
          else
            missed.push(
              `${f.id} ← "${alt}" → ${hit ? hit.faq.id + ' (' + hit.score.toFixed(2) + ')' : 'null'}` +
                `   groups=${JSON.stringify(tokenGroups(alt).map((g) => g[0]))}`,
            );
        }
      }

      // Far unit: the first unit from a DIFFERENT sub-topic group. Sibling
      // drills are excluded on purpose — see the header.
      const far = units.find(([u]) => group(u) !== group(unit));
      if (far) {
        const farIndex = buildFaqIndex(far[1], { idf: topicIdf });
        for (const f of faqs) {
          if (!UNIT_SPECIFIC.has(f.kind)) continue;
          for (const alt of heldAlts(f)) {
            farQueries++;
            const hit = matchFaq(farIndex, alt);
            if (hit) { farHits++; if (farHits <= 6) console.log(`  ✗ far hit: "${alt}" (${f.id}) → ${hit.faq.id} (${hit.score.toFixed(2)})`); }
          }
        }
      }

      // Noise: nothing here may match. Mirrors production — a message the
      // local tutor's classifier already answers never reaches the bank.
      const fullIndex = buildFaqIndex(faqs, { idf: topicIdf });
      for (const n of NOISE) {
        if (classifyAsk(n)) continue;
        noiseQueries++;
        const hit = matchFaq(fullIndex, n);
        if (hit) { noiseHits++; if (noiseHits <= 6) console.log(`  ✗ noise matched: "${n}" → ${hit.faq.id} (${hit.score.toFixed(2)})`); }
      }
    }
  }

  const recall = queries ? recalled / queries : 0;
  const farRate = farQueries ? farHits / farQueries : 0;
  const noiseRate = noiseQueries ? noiseHits / noiseQueries : 0;
  console.log(
    `\nentries ${entries} · blind queries ${queries} · recall ${(recall * 100).toFixed(1)}%` +
      ` · noise ${(noiseRate * 100).toFixed(1)}% (${noiseHits}/${noiseQueries})` +
      ` · far-unit ${(farRate * 100).toFixed(1)}% (${farHits}/${farQueries}) · collisions ${collisions}`,
  );
  if (missed.length) {
    console.log(`\nmissed (first ${Math.min(12, missed.length)} of ${missed.length}):`);
    for (const m of missed.slice(0, 12)) console.log(`  ${m}`);
  }
  checks += 3;
  if (queries && recall < MIN_RECALL) bad(`recall ${(recall * 100).toFixed(1)}% < ${MIN_RECALL * 100}%`);
  if (noiseQueries && noiseRate > MAX_NOISE) bad(`noise match rate ${(noiseRate * 100).toFixed(1)}% > ${MAX_NOISE * 100}%`);
  if (farQueries && farRate > MAX_FAR) bad(`far-unit hit rate ${(farRate * 100).toFixed(1)}% > ${MAX_FAR * 100}%`);

  console.log(`\n${failures === 0 ? '✅' : '❌'}  ${checks - failures}/${checks} passed`);
  process.exit(failures === 0 ? 0 : 1);
})();
