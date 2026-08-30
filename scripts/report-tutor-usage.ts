/**
 * report-tutor-usage.ts — of the asks students actually type, which reach the
 * model, and WHY.
 *
 *   npx tsx scripts/report-tutor-usage.ts
 *   npx tsx scripts/report-tutor-usage.ts --reason no_local_content
 *
 * FREE, read-only, and — this is the point — available NOW.
 *
 * ============================================================
 * WHY OFFLINE AND NOT FROM TRAFFIC
 * ============================================================
 * The live trace records what real students hit. There are none yet: Itay is
 * the only person using the app, so a table would fill at the speed of manual
 * testing and the first report would be weeks away.
 *
 * This runs the SAME decision chain the browser runs — routeMessage →
 * answerLocally → answerFromFaq — over every phrasing in
 * scripts/tutor-phrasings.ts against every question in the banks, and reports
 * the identical breakdown. It is a census rather than a sample: not what
 * students happened to ask this week, but what the app would do for every
 * phrasing on every screen it has.
 *
 * ⚠️ It does NOT call a model and cannot. Where the chain gives up, the report
 * counts a would-be model call and names the reason; it never makes one.
 */

const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: () => {}, removeItem: () => {} },
};
(globalThis as unknown as { localStorage: unknown }).localStorage = (
  globalThis as unknown as { window: { localStorage: unknown } }
).window.localStorage;

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { answerLocally } from '../lib/tutor-local';
import { routeMessage, canonicalFor } from '../lib/tutor-router';
import { examMetaAnswer } from '../lib/tutor-exam-meta';
import { answerFromFaq } from '../lib/tutor-faq';
import { canonicalIntent, groundingFor } from '../lib/tutor-intent';
import { decideFallbackReason, type FallbackReason } from '../lib/tutor-telemetry';
import { getLesson, allLessonKeys } from '../content/lessons';
import { conceptBankEntries, getConceptQuestions, CONCEPT_LEVELS } from '../content/concept-quiz';
import { PHRASINGS } from './tutor-phrasings';
import { analysisFor, assessMathEngine, type MathFit } from './math-engine-fit';
import type { TutorFocus } from '../lib/tutor-presence';

const ONLY_REASON = process.argv.includes('--reason')
  ? process.argv[process.argv.indexOf('--reason') + 1]
  : '';

type Row = {
  screen: string;
  topic: string;
  intent: string;
  local: boolean;
  reason: FallbackReason | '';
  canonical: string;
  layer: string;
  /** The corpus says this phrasing NAMES A SUBJECT and belongs to the model.
   *  A paid call here is the right outcome. */
  shouldPay: boolean;
  /** Filled only for turns that would reach the model — the question being
   *  asked is whether the ENGINE could have taken them instead. */
  fit?: MathFit;
  /** The raw phrasing and the question it was asked against, so the AFTER
   *  pass can re-run the compiler on exactly the same turn. */
  phrase: string;
  sample?: { question: Record<string, unknown>; subTopic?: unknown; chosenIndex?: number };
  existingFallbackReason?: FallbackReason;
  proposedFallbackReason?: FallbackReason | 'answered_by_math_engine';
};

type Target = { screen: string; topic: string; question: Record<string, unknown>; subTopic?: unknown };

async function targets(): Promise<Target[]> {
  const out: Target[] = [];
  for (const { subject, topic } of allLessonKeys()) {
    if (subject !== 'math5') continue;
    const L = getLesson(subject, topic);
    if (!L) continue;
    for (const st of L.subTopics ?? []) {
      for (const q of st.questions ?? []) {
        out.push({ screen: 'lesson', topic, question: q as Record<string, unknown>, subTopic: st });
      }
    }
    for (const e of conceptBankEntries()) {
      if (e.subject !== subject || e.topic !== topic) continue;
      for (const lvl of CONCEPT_LEVELS) {
        for (const q of getConceptQuestions(subject, topic, lvl)) {
          out.push({
            screen: 'quiz',
            topic,
            question: { ...(q as object), topic, kind: 'mcq' } as Record<string, unknown>,
          });
        }
      }
    }
  }
  return out;
}

/** A wrong pick, so the run exercises the states a struggling student is in. */
function wrongIndex(q: Record<string, unknown>): number | undefined {
  const answers = q.answers as string[] | undefined;
  if (!answers) return undefined;
  const correct = q.correct as number;
  for (let i = 0; i < answers.length; i++) if (i !== correct) return i;
  return 0;
}

(async () => {
  const all = await targets();
  // One question per (screen, topic) is not a census; every question is. But
  // the full cross product is 574 × 74 phrasings × several banks — sampled
  // deterministically (every Nth) so the run stays under a minute and the
  // sample cannot drift between runs.
  const STRIDE = Number(process.env.REPORT_STRIDE ?? 7);
  const sample = all.filter((_, i) => i % STRIDE === 0);
  console.log(
    `\ncensus: ${sample.length} of ${all.length} questions (every ${STRIDE}th) × ${PHRASINGS.length} phrasings ` +
      `= ${sample.length * PHRASINGS.length} turns\n`,
  );

  const rows: Row[] = [];
  for (const t of sample) {
    const idx = wrongIndex(t.question);
    const focus = {
      where: t.screen,
      topic: t.topic,
      questionText: t.question.question as string,
      question: t.question,
      subTopic: t.subTopic,
      ...(idx !== undefined
        ? { wrongAnswer: (t.question.answers as string[])[idx], chosenIndex: idx }
        : {}),
    } as unknown as TutorFocus;

    for (const p of PHRASINGS) {
      const { intent, confidence, canonical } = canonicalIntent(p.text);
      let layer = '';
      let local = false;

      // ---- the real chain, in the browser's order ----
      const route = routeMessage(p.text, focus, {});
      let probe = p.text;
      if (route.kind === 'ack') { local = true; layer = 'router:ack'; }
      else if (route.kind === 'answer') { local = true; layer = 'router:answer'; }
      else if (route.kind === 'ask') probe = canonicalFor(route.ask);

      if (!local && examMetaAnswer(p.text, t.topic)) { local = true; layer = 'exam-meta'; }
      if (!local && answerLocally(probe, focus, [])?.text?.trim()) { local = true; layer = 'ladder'; }
      if (!local) {
        const faq = await answerFromFaq(p.text, focus).catch(() => null);
        if (faq) { local = true; layer = faq.source === 'transfer' ? 'reuse' : 'faq'; }
      }

      const reason: FallbackReason | '' = local
        ? ''
        : decideFallbackReason({
            hasQuestion: true,
            intent: intent ?? '',
            confidence,
            groundingMissing: Boolean(intent) && groundingFor(intent!, focus) === null,
            faqSearched: true,
            faqMatched: false,
            transferCandidateRejected: false,
            multiPart: false,
            proofOrOpen: false,
            askedForPersonalExplanation: false,
            solverAttemptedAndFailed: false,
          });

      // Only the turns that would PAY are worth assessing — the engine is
      // being considered as an alternative to the model, not to the ladder.
      let fit: MathFit | undefined;
      let proposed: FallbackReason | 'answered_by_math_engine' | undefined;
      if (!local) {
        const analysis = await analysisFor(
          String(t.question.id ?? t.question.question),
          String(t.question.question ?? ''),
        );
        fit = assessMathEngine(analysis, intent, false);
        proposed = fit.mathEngineCanAnswerIntent ? 'answered_by_math_engine' : (reason as FallbackReason);
      }

      rows.push({
        screen: t.screen, topic: t.topic, intent: intent ?? '(none)', local, reason,
        canonical, layer, shouldPay: p.mustStayWithModel === true,
        phrase: p.text,
        ...(local ? {} : { sample: { question: t.question, subTopic: t.subTopic, ...(idx !== undefined ? { chosenIndex: idx } : {}) } }),
        ...(fit ? { fit, existingFallbackReason: reason as FallbackReason, proposedFallbackReason: proposed } : {}),
      });
    }
  }

  // ---- 1. by screen × topic ----
  const pct = (n: number, d: number) => (d ? `${((n / d) * 100).toFixed(1)}%` : '—');
  console.log('=== by screen and topic ===\n');
  console.log('  ' + 'screen'.padEnd(10) + 'topic'.padEnd(14) + 'turns'.padEnd(9) + 'local'.padEnd(10) + 'would call the model');
  console.log('  ' + '-'.repeat(74));
  const byScreen = new Map<string, Row[]>();
  for (const r of rows) {
    const k = `${r.screen}|${r.topic}`;
    if (!byScreen.has(k)) byScreen.set(k, []);
    byScreen.get(k)!.push(r);
  }
  for (const [k, rs] of [...byScreen.entries()].sort()) {
    const [screen, topic] = k.split('|');
    const loc = rs.filter((r) => r.local).length;
    console.log(
      '  ' + screen.padEnd(10) + topic.padEnd(14) +
      String(rs.length).padEnd(9) + pct(loc, rs.length).padEnd(10) + pct(rs.length - loc, rs.length),
    );
  }
  const localAll = rows.filter((r) => r.local).length;
  console.log('  ' + '-'.repeat(74));
  console.log('  ' + 'TOTAL'.padEnd(24) + String(rows.length).padEnd(9) + pct(localAll, rows.length).padEnd(10) + pct(rows.length - localAll, rows.length));

  // ---- 2. by intent ----
  console.log('\n=== by intent ===\n');
  console.log('  ' + 'intent'.padEnd(26) + 'turns'.padEnd(9) + 'local'.padEnd(10) + 'answered by');
  console.log('  ' + '-'.repeat(74));
  const byIntent = new Map<string, Row[]>();
  for (const r of rows) {
    if (!byIntent.has(r.intent)) byIntent.set(r.intent, []);
    byIntent.get(r.intent)!.push(r);
  }
  for (const [intent, rs] of [...byIntent.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const loc = rs.filter((r) => r.local);
    const layers = new Map<string, number>();
    for (const r of loc) layers.set(r.layer, (layers.get(r.layer) ?? 0) + 1);
    const top = [...layers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2)
      .map(([l, n]) => `${l} ${pct(n, rs.length)}`).join(', ');
    console.log('  ' + intent.padEnd(26) + String(rs.length).padEnd(9) + pct(loc.length, rs.length).padEnd(10) + top);
  }

  // ---- 3. why the rest would pay ----
  console.log('\n=== fallback reasons (the turns that would call the model) ===\n');
  const paid = rows.filter((r) => !r.local);
  const byReason = new Map<string, Row[]>();
  for (const r of paid) {
    if (!byReason.has(r.reason)) byReason.set(r.reason, []);
    byReason.get(r.reason)!.push(r);
  }
  for (const [reason, rs] of [...byReason.entries()].sort((a, b) => b[1].length - a[1].length)) {
    if (ONLY_REASON && reason !== ONLY_REASON) continue;
    console.log(`  ${reason.padEnd(36)} ${String(rs.length).padStart(6)}  ${pct(rs.length, paid.length)} of paid turns`);
    const phrases = new Map<string, number>();
    for (const r of rs) phrases.set(r.canonical, (phrases.get(r.canonical) ?? 0) + 1);
    const top = [...phrases.entries()].sort((a, b) => b[1] - a[1]).slice(0, ONLY_REASON ? 20 : 5);
    for (const [ph, n] of top) console.log(`      ${String(n).padStart(5)} × "${ph}"`);
  }

  // ---- 4. the number that actually matters ----
  //
  // Not every paid call is waste. The corpus marks the phrasings that NAME A
  // SUBJECT of their own — "איך מחשבים סטיית תקן", "איך עובד חוק בייס" — and
  // those belong to the model. Reporting one total would make the goal look
  // like "drive this to zero", which would be an instruction to start
  // answering questions nobody asked.
  const correctlyPaid = paid.filter((r) => r.shouldPay).length;
  const addressable = paid.length - correctlyPaid;
  const wronglyLocal = rows.filter((r) => r.local && r.shouldPay).length;
  console.log('\n=== the headline, split honestly ===\n');
  console.log(`  turns measured                       ${rows.length}`);
  console.log(`  answered locally                     ${localAll}  (${pct(localAll, rows.length)})`);
  console.log(`  reach the model                      ${paid.length}  (${pct(paid.length, rows.length)})`);
  console.log(`    correctly — names its own subject  ${correctlyPaid}  (${pct(correctlyPaid, paid.length)} of paid)`);
  console.log(`    ADDRESSABLE                        ${addressable}  (${pct(addressable, rows.length)} of all turns)`);
  console.log(`\n  unsafe — answered locally when it should have gone to the model:`);
  console.log(`                                       ${wronglyLocal}  (${pct(wronglyLocal, rows.length)})`);
  if (wronglyLocal) {
    // Named, not just counted. This is the rate that must not rise when the
    // router is widened, and a number with no examples cannot be argued with
    // or acted on.
    const byPhrase = new Map<string, { n: number; layer: string }>();
    for (const r of rows.filter((x) => x.local && x.shouldPay)) {
      const cur = byPhrase.get(r.canonical) ?? { n: 0, layer: r.layer };
      byPhrase.set(r.canonical, { n: cur.n + 1, layer: r.layer });
    }
    for (const [ph, { n, layer }] of [...byPhrase.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 8)) {
      console.log(`      ${String(n).padStart(5)} × "${ph}"  → answered by ${layer}`);
    }
  }
  // ============================================================
  // 5. could the MATHS ENGINE have taken any of these?
  // ============================================================
  const assessed = paid.filter((r) => r.fit);
  if (assessed.length) {
    const fits = assessed.filter((r) => r.fit!.mathEngineCanAnswerIntent);
    console.log('\n=== could the maths engine have answered instead? ===\n');
    console.log(`  paid turns assessed                  ${assessed.length}`);
    console.log(`  the engine could answer SAFELY       ${fits.length}  (${pct(fits.length, assessed.length)} of paid)`);
    console.log(`    = of ALL turns                     ${pct(fits.length, rows.length)}`);

    // ---- 5a. by the action the intent asks for ----
    console.log('\n  by action the student is asking for:');
    const byAction = new Map<string, { n: number; ok: number }>();
    for (const r of assessed) {
      const k = r.fit!.mathEngineActionCandidate;
      const cur = byAction.get(k) ?? { n: 0, ok: 0 };
      byAction.set(k, { n: cur.n + 1, ok: cur.ok + (r.fit!.mathEngineCanAnswerIntent ? 1 : 0) });
    }
    for (const [a, { n, ok: good }] of [...byAction.entries()].sort((x, y) => y[1].n - x[1].n)) {
      console.log(`    ${a.padEnd(16)} ${String(n).padStart(6)} turns · engine safe for ${String(good).padStart(5)} (${pct(good, n)})`);
    }

    // ---- 5b. computed but NOT usable — the number the naive measure misses ----
    const computedNotUsed = assessed.filter(
      (r) => r.fit!.mathEngineSucceeded && !r.fit!.mathEngineCanAnswerIntent,
    );
    console.log(
      `\n  the engine COMPUTED an answer but it must not be used: ${computedNotUsed.length}` +
        `  (${pct(computedNotUsed.length, assessed.length)} of paid)`,
    );
    const byNotSafe = new Map<string, Row[]>();
    for (const r of assessed) {
      const k = r.fit!.reasonNotSafeToUseMathEngine || '(safe)';
      if (!byNotSafe.has(k)) byNotSafe.set(k, []);
      byNotSafe.get(k)!.push(r);
    }
    for (const [k, rs] of [...byNotSafe.entries()].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`    ${k.padEnd(26)} ${String(rs.length).padStart(6)}  (${pct(rs.length, assessed.length)})`);
      for (const r of rs.slice(0, 5)) console.log(`        "${r.canonical}"  · ${r.intent} · ${r.topic}`);
    }

    // ---- 5c. where the saving is ----
    console.log('\n  by topic — where the engine would save the most:');
    const byTopic = new Map<string, { n: number; ok: number }>();
    for (const r of assessed) {
      const cur = byTopic.get(r.topic) ?? { n: 0, ok: 0 };
      byTopic.set(r.topic, { n: cur.n + 1, ok: cur.ok + (r.fit!.mathEngineCanAnswerIntent ? 1 : 0) });
    }
    for (const [t, { n, ok: good }] of [...byTopic.entries()].sort((a, b) => b[1].ok - a[1].ok).slice(0, 8)) {
      console.log(`    ${t.padEnd(22)} ${String(good).padStart(5)} of ${String(n).padStart(5)} paid turns  (${pct(good, n)})`);
    }

    // ---- 5d. where it would sit in the chain ----
    console.log('\n  where the engine belongs, per intent:');
    console.log('    (BEFORE the ladder only where the ladder has nothing; the authored');
    console.log('     hint beats a derived step every time it exists)');
    const byIntentFit = new Map<string, { n: number; ok: number }>();
    for (const r of assessed) {
      const cur = byIntentFit.get(r.intent) ?? { n: 0, ok: 0 };
      byIntentFit.set(r.intent, { n: cur.n + 1, ok: cur.ok + (r.fit!.mathEngineCanAnswerIntent ? 1 : 0) });
    }
    for (const [i, { n, ok: good }] of [...byIntentFit.entries()].sort((a, b) => b[1].ok - a[1].ok)) {
      const place = good === 0 ? 'never — leave it with the model' : 'AFTER the ladder, before the model';
      console.log(`    ${i.padEnd(20)} ${String(good).padStart(5)}/${String(n).padEnd(6)} ${place}`);
    }

    // ---- 5e. five examples of each success ----
    console.log('\n  five examples the engine could take:');
    for (const r of fits.slice(0, 5)) {
      console.log(`    "${r.canonical}" · ${r.intent} · ${r.topic} · ${r.fit!.mathEngineActionCandidate}` +
        ` · steps=${r.fit!.mathEngineHasUsableSteps} · conf=${r.fit!.mathEngineConfidence}`);
    }
    if (!fits.length) console.log('    (none)');
  }

  // ============================================================
  // 6. AFTER: what the response compiler would take
  // ============================================================
  //
  // The same paid turns, run through the compiler that is NOT yet wired to any
  // screen. This is the before/after in one table: the layers above are today,
  // this is what the new layer adds on top of them.
  {
    const { compileTutorResponse } = await import('../lib/tutor-compiler');
    const byType = new Map<string, number>();
    const bySource = new Map<string, number>();
    let taken = 0;
    let unsafeAfter = 0;
    for (const r of paid) {
      const t = r.sample;
      if (!t) continue;
      const res = await compileTutorResponse({
        canonicalIntent: r.intent === '(none)' ? null : (r.intent as never),
        message: r.phrase,
        activeQuestion: t.question,
        selectedAnswer: t.chosenIndex ?? null,
        topic: r.topic,
        formulas: (t.subTopic as { formulas?: never[] } | undefined)?.formulas,
        keyPoints: (t.subTopic as { keyPoints?: string[] } | undefined)?.keyPoints,
      });
      if (!res.handled) continue;
      taken++;
      byType.set(res.responseType, (byType.get(res.responseType) ?? 0) + 1);
      for (const s of res.groundedSources) bySource.set(s, (bySource.get(s) ?? 0) + 1);
      // A turn the corpus says belongs to the model, answered locally, is the
      // one number that must not rise.
      if (r.shouldPay) unsafeAfter++;
    }

    console.log('\n=== AFTER: what the response compiler adds (not yet wired) ===\n');
    console.log(`  paid turns today                     ${paid.length}`);
    console.log(`  the compiler would answer            ${taken}  (${pct(taken, paid.length)} of paid)`);
    console.log(`  still the model's                    ${paid.length - taken}`);
    console.log(`\n  local rate:  ${pct(localAll, rows.length)}  →  ${pct(localAll + taken, rows.length)}`);
    console.log(`  model rate:  ${pct(paid.length, rows.length)}  →  ${pct(paid.length - taken, rows.length)}`);
    console.log(`\n  unsafe (answered locally when it should not be): ${wronglyLocal} → ${wronglyLocal + unsafeAfter}`);

    console.log('\n  by response type:');
    for (const [k, n] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${k.padEnd(20)} ${String(n).padStart(6)}  (${pct(n, taken)})`);
    }
    console.log('\n  grounded in:');
    for (const [k, n] of [...bySource.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${k.padEnd(20)} ${String(n).padStart(6)}`);
    }
  }

  console.log(
    `\n  ${paid.length} of ${rows.length} turns would reach the model (${pct(paid.length, rows.length)}); ` +
      `${addressable} of those are addressable.`,
  );
  console.log(`  Run with --reason <name> for the twenty most common phrasings behind one reason.\n`);
})();
