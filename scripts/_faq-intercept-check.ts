/**
 * _faq-intercept-check.ts — phrasings the ROUTER eats before the bank is asked.
 *
 *   npx tsx scripts/_faq-intercept-check.ts <faq-slice.json | bank.json> [...]
 *
 * WHY. `lib/tutor-local.classifyAsk` runs before `lib/tutor-faq.matchFaq` and
 * matches by substring, so a bank phrasing like "מה הטעות בשורש" is classified
 * as the generic why-wrong ask and its entry never fires — while
 * test-tutor-faq reports 100% recall, because it never calls the router.
 * Found by a verifier on 2026-09-04: 47 dead phrasings in one 107-entry slice.
 * Same for `stepReference` ("שלב", "צעד", "שורה" + a word) → step routing.
 *
 * Reads either authoring shape ([{unit, faqs}]) or runtime shape
 * (Record<unit, TutorFaq[]>). Exit 1 on any hit.
 */
import { readFileSync } from 'node:fs';
import { classifyAsk } from '../lib/tutor-local';
import { stepReference } from '../lib/tutor-faq';

let hits = 0;
let total = 0;
for (const file of process.argv.slice(2)) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const units: Array<{ unit: string; faqs: Array<{ id: string; q: string; alts: string[] }> }> = Array.isArray(data)
    ? data
    : Object.entries(data).map(([unit, faqs]) => ({ unit, faqs: faqs as never }));
  let fileHits = 0;
  for (const u of units) {
    for (const f of u.faqs) {
      for (const [i, p] of [f.q, ...f.alts].entries()) {
        total++;
        const ask = classifyAsk(p);
        const step = stepReference(p, 10);
        if (ask || step !== null) {
          hits++;
          fileHits++;
          console.log(`  ${f.id} ${i === 0 ? 'q' : `alts[${i - 1}]`} → ${ask ? `ask:${ask}` : `step:${step}`}   "${p}"`);
        }
      }
    }
  }
  console.log(`${file}: ${fileHits} intercepted phrasing(s)`);
}
console.log(`\n${hits}/${total} phrasings intercepted by the router${hits ? ' — these entries can never fire' : ''}`);
process.exit(hits ? 1 : 0);
