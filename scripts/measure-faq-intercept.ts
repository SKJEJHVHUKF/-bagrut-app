/**
 * measure-faq-intercept.ts — of the authored FAQ phrasings, how many can the
 * student actually get through the REAL chain?
 *
 *   npx tsx scripts/measure-faq-intercept.ts [topic] [--samples=N]
 *
 * FREE: content + pure functions, no model call, no network.
 *
 * WHY THE CHAIN AND NOT THE MATCHER. scripts/test-tutor-faq asks
 * `matchFaq` directly and reports its recall. But a student's message reaches
 * the bank only after the router and the question-object layer have had their
 * turn, and `classifyAsk` matches SUBSTRINGS: "מה הטעות הנפוצה כשמאפסים את
 * המכנה" classifies as the generic why-wrong ask, `answerLocally` serves the
 * exercise's own note, and the authored entry — the right answer — never
 * fires. The bank's own test cannot see that; only running the chain can.
 *
 * Every authored phrasing (q + alts) of every unit is typed at the chain with
 * that unit's question on screen, exactly as the ladder publishes it. The
 * layer that answered is what gets counted:
 *
 *   faq:*       the authored entry fired                       (good)
 *   local:* …   a layer BEFORE the bank answered instead       (INTERCEPTED)
 *   missed      nothing answered, or a layer AFTER the bank did — the bank
 *               was asked and abstained; a precision question, not this one
 *
 * Note that a `local:*` answer can also be a bank abstention now: step 3½
 * offers a content-bearing ask to the bank first, and only if the bank
 * abstains does the template answer. The column therefore over-counts a
 * little in the fixed chain; the before/after delta is still the honest one.
 *
 * Entries with `reveals` are typed with the answer already revealed, since
 * that is the only state in which they are allowed to fire at all.
 */

// A localStorage, so tutor-flags / planAnswer do not throw (same shim as
// scripts/test-tutor-chain.ts — it must precede the imports).
const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    get length() { return store.size; },
    key: (i: number) => [...store.keys()][i] ?? null,
  },
  location: { pathname: '/roadmap', search: '' },
  dispatchEvent: () => true,
};
(globalThis as unknown as { localStorage: unknown }).localStorage = (
  globalThis as unknown as { window: { localStorage: unknown } }
).window.localStorage;

import { getLesson, allLessonKeys } from '../content/lessons';
import { loadFaqBank } from '../content/tutor-faq';
import { partAsQuestion, type TutorFocus } from '../lib/tutor-presence';
import { runTutorChain, emptyChainState } from '../lib/tutor-chain';
import type { PracticeQuestion, SubTopic } from '../content/lessons/types';

const args = process.argv.slice(2);
const ONLY = args.find((a) => !a.startsWith('--'));
const SAMPLES = Number(args.find((a) => a.startsWith('--samples='))?.split('=')[1] ?? 12);

/** Layers that run before the bank in lib/tutor-chain (steps 1–4). */
const PRE_BANK = /^(graded|ack|meta|exam-meta|local:)/;

type Tally = { fired: number; intercepted: number; missed: number };
const byTopic: Record<string, Tally> = {};
const byLayer: Record<string, number> = {};
const samples: string[] = [];
const total: Tally = { fired: 0, intercepted: 0, missed: 0 };

(async () => {
  for (const { subject, topic } of allLessonKeys()) {
    if (subject !== 'math5') continue;
    if (ONLY && topic !== ONLY) continue;
    const bank = await loadFaqBank(subject, topic);
    if (!bank) continue;
    const L = getLesson(subject, topic);
    if (!L) continue;

    // The screens as they publish themselves: ladder questions and bagrut parts.
    const screens: { question: PracticeQuestion; subTopic?: SubTopic }[] = [];
    for (const st of L.subTopics ?? [])
      for (const q of st.questions ?? []) screens.push({ question: q, subTopic: st });
    for (const b of L.bagrutQuestions ?? [])
      for (const p of b.parts ?? []) screens.push({ question: partAsQuestion(p, { questionId: b.id }) });

    const t = (byTopic[topic] ??= { fired: 0, intercepted: 0, missed: 0 });
    for (const { question, subTopic } of screens) {
      const entries = bank[question.id] ?? [];
      if (entries.length === 0) continue;
      for (const f of entries) {
        for (const phrasing of [f.q, ...f.alts]) {
          const focus = {
            where: topic,
            topic,
            subTopicId: subTopic?.id ?? '',
            questionText: question.question,
            question,
            ...(subTopic ? { subTopic } : {}),
            // A `reveals` entry may only fire once the answer is on screen.
            ...(f.reveals ? { correctAnswer: question.solution?.finalAnswer ?? '' } : {}),
          } as unknown as TutorFocus;
          let layer = 'miss';
          try {
            const r = await runTutorChain({ message: phrasing, focus, state: emptyChainState() });
            layer = r.answered ? r.layer : 'miss';
          } catch (e) {
            layer = `throw:${e instanceof Error ? e.message.slice(0, 40) : 'x'}`;
          }
          byLayer[layer] = (byLayer[layer] ?? 0) + 1;
          if (layer.startsWith('faq')) {
            t.fired++; total.fired++;
          } else if (layer === 'miss' || !PRE_BANK.test(layer)) {
            // Either nothing answered, or a layer that runs AFTER the bank did
            // (compiler, topic-overview, off-topic…) — which means the bank was
            // asked and abstained (threshold / margin / foreign screen). That
            // is a bank-precision question, not an interception.
            t.missed++; total.missed++;
          } else {
            t.intercepted++; total.intercepted++;
            if (samples.length < SAMPLES) samples.push(`${layer.padEnd(16)} ${f.id}  "${phrasing}"`);
          }
        }
      }
    }
  }

  const pct = (n: number, d: number) => (d ? `${((100 * n) / d).toFixed(1)}%` : '—');
  console.log('\ntopic                      fired   intercepted   missed');
  for (const [topic, t] of Object.entries(byTopic)) {
    const d = t.fired + t.intercepted + t.missed;
    console.log(`${topic.padEnd(26)} ${String(t.fired).padStart(5)}   ${String(t.intercepted).padStart(5)} (${pct(t.intercepted, d)})   ${String(t.missed).padStart(5)}`);
  }
  const d = total.fired + total.intercepted + total.missed;
  console.log(`\nTOTAL ${d} phrasings: fired ${total.fired} (${pct(total.fired, d)}) · intercepted ${total.intercepted} (${pct(total.intercepted, d)}) · missed ${total.missed} (${pct(total.missed, d)})`);
  console.log('\nby layer:');
  for (const [k, v] of Object.entries(byLayer).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(20)} ${v}`);
  if (samples.length) {
    console.log('\nintercepted samples:');
    for (const s of samples) console.log('  ' + s);
  }
})();
