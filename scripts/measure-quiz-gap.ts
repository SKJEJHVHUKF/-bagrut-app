/**
 * measure-quiz-gap.ts — what a /quiz question ACTUALLY cannot answer, today.
 *
 *   npx tsx scripts/measure-quiz-gap.ts
 *   npx tsx scripts/measure-quiz-gap.ts --show 30
 *
 * FREE. No model, no network.
 *
 * ============================================================
 * WHY MEASURE BEFORE WRITING
 * ============================================================
 * `check:faq-coverage` says the /quiz banks have 0 entries out of 92 questions,
 * and the obvious conclusion is "write 92 × 7 × 6 entries". That conclusion
 * ignores everything built since: four new intents, a catch-all rule, the
 * follow-up router, the answer library, Topic Cards. A bank entry is only worth
 * writing for a phrasing that STILL falls through all of them.
 *
 * The same reasoning already saved a wasted round twice today — the compiler
 * turned out not to serve intents the grounder knew, and the answer library
 * turned out to be skipping the very turns it existed for. Both were invisible
 * until the real chain was run end to end.
 *
 * So: fire realistic phrasings at every /quiz question through the REAL chain,
 * in the REAL order the browser uses, and report only what nothing catches.
 */

import { conceptBankEntries, getConceptQuestions, CONCEPT_LEVELS } from '../content/concept-quiz';
import { routeMessage, canonicalFor, answerGradedLocally } from '../lib/tutor-router';
import { answerLocally } from '../lib/tutor-local';
import { compileTutorResponse } from '../lib/tutor-compiler';
import { answerFromFaq } from '../lib/tutor-faq';
import { offTopicRedirect } from '../lib/off-topic';

const SHOW = process.argv.includes('--show')
  ? Number(process.argv[process.argv.indexOf('--show') + 1]) || 20
  : 20;

/**
 * What students ask on a quiz screen.
 *
 * ⚠️ NOT invented freehand. Every one of these is either a real message from
 * the live trace, or one of the shapes `measure-intent-coverage` found in the
 * FAQ bank's own authored phrasings — the two corpora that are not my
 * imagination. The census that WAS my imagination is the one that kept missing.
 */
const PROBES: string[] = [
  // the six built-in asks, in the wording students use
  'רמז', 'תן לי רמז', 'מאיפה מתחילים', 'מה הנוסחה', 'למה טעיתי', 'תראה לי את הפתרון',
  // from the live trace
  'לא מובן', 'תעבור איתי על הכל', 'למה הטבלה בנויה ככה', 'תן תרגיל דוגמה',
  'מה הכוונה אינדקס', 'איך אמור לפתור את זה', 'אתה יכול לפתור את זה',
  // the shapes the bank corpus is made of
  'מאיפה המספר הזה', 'למה לא הפוך', 'מה קורה אם משנים את הנתון',
  'איך יודעים שזה נכון', 'מה המלכודת פה', 'מה זה אומר', 'מה מייצג הביטוי הזה',
  'למה המכנה ככה', 'איפה טועים בדרך כלל', 'יש דרך אחרת',
  // continuations
  'עוד קצת', 'לא הבנתי', 'תסביר אחרת', 'ניסיתי ולא יצא', 'אני תקוע',
];

/** Probes that are replies to the tutor, not opening questions. */
const CONTINUATIONS = ['עוד קצת', 'לא הבנתי', 'תסביר אחרת', 'ניסיתי ולא יצא', 'אני תקוע'];

type Row = { qid: string; topic: string; probe: string };

(async () => {
  const questions: Array<{ id: string; topic: string; q: Record<string, unknown> }> = [];
  for (const e of conceptBankEntries()) {
    for (const lvl of CONCEPT_LEVELS) {
      for (const q of getConceptQuestions(e.subject, e.topic, lvl)) {
        questions.push({ id: (q as { id: string }).id, topic: e.topic, q: q as Record<string, unknown> });
      }
    }
  }
  console.log(`\n/quiz questions: ${questions.length}   probes each: ${PROBES.length}`);
  console.log(`turns simulated: ${questions.length * PROBES.length}\n`);

  let localCount = 0;
  const misses: Row[] = [];
  const missByProbe = new Map<string, number>();

  for (const { id, topic, q } of questions) {
    const focus = { topic, question: q, subTopicId: '' } as never;

    for (const probe of PROBES) {
      // The browser's order, layer by layer. First one that answers wins.
      let answered = false;

      // 1. the router: an ack, a graded value, or one of the six asks
      // ⚠️ CONTINUATIONS ARE MEASURED AS CONTINUATIONS.
      //
      // "עוד קצת" and "ניסיתי ולא יצא" only ever occur after the tutor has
      // just said something, and `tutor-followup` is gated on exactly that.
      // Firing them cold measured a situation that cannot happen and reported
      // 574 failures for it — an artefact of the probe, not a gap in the app.
      const isContinuation = CONTINUATIONS.includes(probe);
      const route = routeMessage(probe, focus, {
        lastAsk: isContinuation ? 'help' : null,
        served: isContinuation ? ['hint'] : [],
        lastWasLocal: isContinuation,
      });
      if (route.kind === 'ack') answered = true;
      else if (route.kind === 'answer') answered = answerGradedLocally(route, focus) !== null;
      else if (route.kind === 'ask') answered = answerLocally(canonicalFor(route.ask), focus, []) !== null;

      // 2. the local tutor on the student's own words
      if (!answered) answered = answerLocally(probe, focus, []) !== null;

      // 3. the per-question FAQ bank (empty for these, which is the point)
      if (!answered) answered = (await answerFromFaq(probe, focus)) !== null;

      // 4. the compiler: intents, grounding, Topic Cards
      if (!answered) {
        const c = await compileTutorResponse({ message: probe, activeQuestion: q, topic });
        answered = c.handled;
      }

      // 5. the off-topic redirect, which is also a local answer
      if (!answered) answered = offTopicRedirect(probe, String(q.question ?? '')) !== null;

      if (answered) localCount++;
      else {
        misses.push({ qid: id, topic, probe });
        missByProbe.set(probe, (missByProbe.get(probe) ?? 0) + 1);
      }
    }
  }

  const total = questions.length * PROBES.length;
  console.log('=== what the CURRENT chain already answers on /quiz ===\n');
  console.log(`  answered locally  ${localCount}/${total}  (${((localCount / total) * 100).toFixed(1)}%)`);
  console.log(`  would cost a call ${total - localCount}/${total}\n`);

  console.log('=== which PROBES still fall through, and on how many questions ===\n');
  console.log('  This is the authoring list. A probe answered everywhere needs no entry;');
  console.log('  a probe that fails on every question needs ONE well-placed answer, not 92.\n');
  for (const [p, n] of [...missByProbe.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}/${questions.length}  "${p}"`);
  }

  const byQ = new Map<string, number>();
  for (const m of misses) byQ.set(m.qid, (byQ.get(m.qid) ?? 0) + 1);
  const worst = [...byQ.entries()].sort((a, b) => b[1] - a[1]).slice(0, SHOW);
  console.log(`\n=== the ${worst.length} questions with the most gaps ===\n`);
  for (const [qid, n] of worst) console.log(`  ${String(n).padStart(3)}/${PROBES.length}  ${qid}`);

  const perfect = [...questions].filter((x) => !byQ.has(x.id)).length;
  console.log(`\n  questions with NO gap at all: ${perfect}/${questions.length}`);
  console.log();
})();
