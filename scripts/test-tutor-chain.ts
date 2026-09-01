/**
 * test-tutor-chain.ts — the free chain, and the gate that keeps both surfaces on it.
 *
 *   npx tsx scripts/test-tutor-chain.ts
 *
 * FREE. Content plus pure functions; no model call, no network.
 *
 * ============================================================
 * WHAT WENT WRONG, AND WHY A TEST COULD NOT HAVE CAUGHT IT
 * ============================================================
 * Every free layer was built inside components/tutor/TutorBubble.tsx, in the
 * body of a `send` useCallback. app/chat/page.tsx — the PAGE devoted to asking
 * the tutor things — had none of them. Its `send` validated the message,
 * checked the daily quota, and called `fetch('/api/chat')`. Not one import
 * from tutor-router, tutor-faq, tutor-local, off-topic, tutor-plan-answer,
 * topic-overview or resolve-topic.
 *
 * So the same question was free in the corner of the screen and billed on the
 * page built for it. Nobody noticed for weeks, because the chain could only be
 * run by mounting React — there was nothing to test, so nothing was tested.
 *
 * Both halves of this file exist because of that:
 *
 *   1. THE CHAIN IS RUN DIRECTLY. lib/tutor-chain.ts is a pure async function
 *      now, so the layers can be exercised without a component.
 *   2. THE SYNC GATE. A behavioural test on the chain would still have passed
 *      while /chat ignored it. So this also asserts that NEITHER surface
 *      reaches a layer module on its own — the only route to a free answer is
 *      through the chain, which is what makes "add a layer once, get it on both
 *      screens" true by construction rather than by discipline.
 */

// ---- a localStorage, so planAnswer and tutorFlag do not throw ---------------
// Same shape and same ordering constraint as scripts/test-tracking-sync.ts:
// tsx evaluates in source order, so the fake store has to exist before the
// imports below it.
const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  localStorage: {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    get length() { return store.size; },
    key: (i: number) => [...store.keys()][i] ?? null,
  },
  location: { pathname: '/chat', search: '' },
  dispatchEvent: () => true,
};
(globalThis as unknown as { localStorage: unknown }).localStorage = (
  globalThis as unknown as { window: { localStorage: unknown } }
).window.localStorage;

import { readFileSync } from 'node:fs';
import { runTutorChain, emptyChainState, type ChainState } from '../lib/tutor-chain';

let failed = 0;
const ok = (cond: boolean, name: string) => {
  if (cond) console.log(`  ok  ${name}`);
  else { failed++; console.log(`  x   ${name}`); }
};

/** One turn on a screen with no exercise — /chat's only shape, and the roadmap index's. */
async function turn(message: string, over: Partial<ChainState> = {}, screenTopic = '') {
  return runTutorChain({
    message,
    focus: null,
    screenTopic,
    state: { ...emptyChainState(), ...over },
  });
}

(async () => {
  console.log('\n=== with no exercise on screen, these cost nothing ===\n');
  for (const [msg, layer, over] of [
    // The app's own idle button. Billed on every press before this.
    ['תסביר לי משהו מהחומר', 'choose-topic', {}],
    // A bare topic name — the reply to the tutor's own "על איזה נושא?".
    ['הסתברות', 'topic-overview', {}],
    // ⚠️ THE PLURAL. Matching is substring and "נגזרות" does not contain
    // "נגזרת" — the ו breaks it — so this resolved to no topic at all and was
    // billed every time.
    ['הסבר לי על נגזרות', 'topic-overview', {}],
    // Two of the app's own suggested prompts, which resolved a topic perfectly
    // and then died on the residue test.
    ['תעזור לי להבין אינטגרלים', 'topic-overview', {}],
    // An acknowledgement, but only once the tutor has actually said something.
    ['אוקיי תודה', 'ack', { tutorSpoke: true }],
  ] as Array<[string, string, Partial<ChainState>]>) {
    const r = await turn(msg, over);
    ok(
      r.answered && r.layer === layer,
      `"${msg}" → ${layer} (got ${r.answered ? r.layer : 'MODEL'})`,
    );
  }

  {
    // The banks, through the doors that are legal without a question. The
    // phrasing is READ OUT OF THE BANK rather than invented, so this measures
    // the matcher and not my guess at what was authored.
    const bank = (await import('../content/tutor-faq/math5/probability')).default as Record<
      string,
      Array<{ kind: string; q: string }>
    >;
    const sample = Object.values(bank).flat().find((f) => f.kind === 'concept');
    const t = sample ? await turn(sample.q) : null;
    ok(
      !!t && t.answered && t.layer.startsWith('faq:'),
      `a concept question from the bank is answered (${t?.answered ? t.layer : 'MODEL'}) — "${sample?.q ?? 'none'}"`,
    );
    // Any free layer will do. metaAnswer's exam-tips reaches this one first and
    // answers it well; asserting on WHICH free layer would be asserting on the
    // ordering, which is allowed to change.
    const g = await turn('איך כדאי ללמוד למתמטיקה');
    ok(g.answered, `a study-method question costs nothing (${g.answered ? g.layer : 'MODEL'})`);
  }

  console.log('\n=== and these still reach the model, correctly ===\n');
  for (const msg of [
    // A conversational fragment is not a question. This is the regression a
    // screenshot reported: mid-explanation the student typed "החלק השני" and a
    // bank served an authored answer about a different exercise, stamped
    // "מהחומר המאומת". A confident wrong answer is worse than the call it saved.
    'החלק השני',
    'תמשיך',
    // Nothing authored can invent an exercise and walk a student through it.
    'תפתור איתי בעיה בנגזרות עם שורש',
  ]) {
    const r = await turn(msg, { tutorSpoke: true });
    ok(!r.answered, `"${msg}" → the model${r.answered ? ` (WRONGLY answered by ${r.layer})` : ''}`);
  }

  console.log('\n=== the state it hands back is the state the caller must keep ===\n');
  {
    const r = await turn('הסתברות');
    ok(r.state.convTopic === 'הסתברות', `the conversation's topic is remembered (${r.state.convTopic || 'none'})`);
    // ⚠️ THE FOLLOW-UP THAT USED TO BE BILLED. With the topic carried forward,
    // a bare "מותנית" two turns later still resolves.
    const next = await turn('ומה עם הסתברות מותנית', { ...r.state, tutorSpoke: true });
    ok(next.answered || next.topic === 'הסתברות', 'a follow-up inherits it rather than starting cold');
  }
  {
    // A miss must still report the topic it grounded on, or the model turn is
    // sent uncached and ungrounded — the bug that made seven roadmap turns cost
    // $0.0461 while appearing in every report as "(ריק)".
    const r = await turn('תפתור איתי משהו קשה בהסתברות', { tutorSpoke: true });
    ok(!r.answered && r.topic === 'הסתברות', `a paid turn still carries its topic (${r.topic || 'EMPTY'})`);
  }

  console.log('\n=== the gate: neither surface may grow its own private chain ===\n');
  {
    // ⚠️ THIS IS THE ASSERTION THE WHOLE FILE IS FOR.
    //
    // A behavioural test on the chain passes perfectly while a surface quietly
    // ignores it — that is exactly the state this codebase was in. The property
    // being guarded is structural: THE ONLY ROUTE TO A FREE ANSWER IS THE
    // CHAIN. So it is checked structurally, on the imports.
    //
    // If a layer genuinely belongs on one screen only, it goes in the chain
    // behind a condition (`focus`, `screenTopic`), not in the component.
    const LAYERS = [
      'tutor-router',
      'tutor-local',
      'tutor-faq',
      'tutor-meta-asks',
      'tutor-exam-meta',
      'off-topic',
      'tutor-plan-answer',
      'topic-overview',
      'tutor-compiler',
      'study-tips',
    ];
    for (const file of ['components/tutor/TutorBubble.tsx', 'app/chat/page.tsx']) {
      const src = readFileSync(file, 'utf8');
      // Only real imports — a mention inside a comment is documentation, and
      // this file is full of comments naming these modules on purpose.
      // ⚠️ TYPE-ONLY IMPORTS ARE ALLOWED and must not fail this. `import type
      // { Ask }` carries no behaviour — a type cannot answer a student — and
      // banning it would only push both files into restating types they
      // already share. What is banned is importing a layer's FUNCTION.
      const imported = LAYERS.filter((m) => {
        const lines = src.match(
          new RegExp(`^.*(?:from|import\\()\\s*['"\`]@/lib/${m}['"\`].*$`, 'gm'),
        ) ?? [];
        return lines.some((line) => !/\bimport\s+type\b|\{\s*type\s/.test(line));
      });
      ok(
        imported.length === 0,
        imported.length === 0
          ? `${file} reaches its free layers only through the chain`
          : `${file} imports a layer directly: ${imported.join(', ')} — put it in lib/tutor-chain instead`,
      );
      ok(
        /from '@\/lib\/tutor-chain'/.test(src),
        `${file} calls the chain`,
      );
    }
  }

  console.log(
    failed === 0
      ? '\nOK tutor chain: one chain, both surfaces, and nothing answered that should not be\n'
      : `\nFAILED: ${failed}\n`,
  );
  process.exitCode = failed === 0 ? 0 : 1;
})();
