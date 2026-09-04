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

  console.log('\n=== the menu is shown once, never in a loop ===\n');
  {
    // ⚠️ THE STUDENT COULD NOT GET OUT. topicOverview answers "הסתברות" with a
    // list of card subjects — "עם החזרה", "הסתברות מותנית". Those resolve to
    // the SAME topic and leave only filler behind, so each one is itself a
    // bare topic name: pick an item off the menu, get the identical menu back.
    // Measured at 2 of 25 items, with no way out but rephrasing.
    const first = await turn('הסתברות');
    ok(first.answered && first.layer === 'topic-overview', 'the menu is offered once');

    const items = (first.answered ? first.text : '')
      .split('\n')
      .filter((l) => l.startsWith('· '))
      .map((l) => l.slice(2).trim());
    ok(items.length > 0, `the menu has items (${items.length})`);

    let looped = 0;
    for (const item of items) {
      const back = await turn(item, { ...first.state, tutorSpoke: true });
      if (back.answered && back.layer === 'topic-overview') looped++;
    }
    ok(looped === 0, looped === 0 ? 'and picking any item never returns it again' : `${looped} of ${items.length} items loop back to the menu`);

    // ⚠️ AND THE ITEMS MUST ACTUALLY ANSWER. Not looping is only half of it: a
    // menu whose items all fall through to the model is a free reply that buys
    // a paid one. This was 0 of 25 across both topics before the compiler
    // rollout and before `label()` stopped trimming "מה זה"; it is 20 of 25
    // now. The floor is deliberately below that — the point is to catch a
    // collapse, not to freeze today's number.
    let free = 0;
    for (const item of items) {
      const back = await turn(item, { ...first.state, tutorSpoke: true });
      if (back.answered) free++;
    }
    ok(
      free >= Math.ceil(items.length * 0.6),
      `and most items lead to a free answer (${free}/${items.length})`,
    );

    // A DIFFERENT topic must still get its own menu — the guard is per topic,
    // not a global "menus are done now".
    const other = await turn('סדרות', { ...first.state, tutorSpoke: true });
    ok(other.answered && other.layer === 'topic-overview', 'a different topic still gets its own menu');
  }

  console.log('\n=== and /chat keeps its controls at BOTH breakpoints ===\n');
  {
    // ⚠️ WHY THIS IS ASSERTED ON THE SOURCE. /chat is behind auth — it 307s to
    // /login — so it cannot be rendered in a test without credentials, and the
    // regression this guards was invisible in exactly that way: the whole
    // button cluster sat inside `<nav className="md:hidden">`, so from 768px up
    // the only trigger for the conversations drawer did not exist. The drawer,
    // the query, the table and its RLS were all healthy. Nothing could open it.
    const src = readFileSync('app/chat/page.tsx', 'utf8');
    const uses = (src.match(/<ChatActions\b/g) ?? []).length;
    ok(uses === 2, `the controls render at both breakpoints (${uses} call sites)`);
    ok(
      /className="md:hidden[^"]*"/.test(src) && /className="hidden md:flex[^"]*"/.test(src),
      'one mobile-only bar and one desktop-only row',
    );
    // The three that were dead on desktop, and the one that was missing entirely.
    for (const [needle, what] of [
      ['onHistory', 'history'],
      ['onNew', 'new conversation'],
      ['onMemory', 'what the tutor remembers'],
      ['href="/roadmap"', 'the way back to the learning track'],
    ] as const) {
      ok(src.includes(needle), `${what} is reachable`);
    }
  }

  console.log('\n=== an authored answer in the student\'s own words beats the template ===\n');
  {
    // ⚠️ classifyAsk matches SUBSTRINGS. "מה בנתונים מרמז שצריך את משפט קטע
    // האמצעים" classified as the generic hint ask and step 4 served the
    // exercise's stock hint, while the bank held an entry written for that
    // exact sentence. MEASURED (scripts/measure-faq-intercept.ts): 2,811 of
    // 51,109 authored phrasings were swallowed this way; step 3½ offers a
    // content-bearing ask to the bank first. A BARE ask must still go to the
    // router — it needs the student's answer state that no bank entry has.
    const { getLesson } = await import('../content/lessons');
    const { hasContentBeyondAsk } = await import('../lib/tutor-chain');
    const L = getLesson('math5', 'גיאומטריה אוקלידית');
    let q: unknown = null;
    let st: unknown = null;
    for (const s of L?.subTopics ?? [])
      for (const x of s.questions ?? []) if (x.id === 'eg-sub-thales-002') { q = x; st = s; }
    ok(Boolean(q), 'the fixture question exists (eg-sub-thales-002)');
    const focus = {
      where: 'תרגול', topic: 'גיאומטריה אוקלידית', subTopicId: (st as { id: string })?.id ?? '',
      questionText: (q as { question: string })?.question ?? '', question: q, subTopic: st,
      chosenIndex: 1, wrongAnswer: 'x',
    } as never;
    for (const [msg, layer] of [
      ['מה בנתונים מרמז שצריך את משפט קטע האמצעים', 'faq:early'], // names the exercise → the bank
      ['מה הטעות שלי', 'local:why-wrong'],                     // bare → the router
      ['רמז', 'local:hint'],
      ['למה התשובה שלי לא נכונה', 'local:why-wrong'],
      ['לא הבנתי', 'local:hint'],
      ['מה הנוסחה', 'local:formulas'],
    ] as Array<[string, string]>) {
      const r = await runTutorChain({ message: msg, focus, state: emptyChainState() });
      const got = r.answered ? r.layer : 'miss';
      ok(got === layer, `"${msg}" → ${got}${got === layer ? '' : ` (expected ${layer})`}`);
    }
    // ⚠️ A stop-list alone is wrong for every phrasing it did not enumerate —
    // "לא הצלחתי" / "תעזור לי" / "איך פותרים את זה" read as content under
    // the first version. Content must come from the exercise on screen.
    const bare = [
      'מה הטעות שלי', 'רמז בבקשה', 'מה עושים עכשיו', 'איך פותרים את זה', 'למה זה ככה',
      'לא הצלחתי', 'תעזור לי', 'לא יודע', 'תסביר שוב', 'אפשר עוד רמז', 'אני לא מבין',
    ];
    const leaked = bare.filter((m) => hasContentBeyondAsk(m, focus));
    ok(leaked.length === 0, leaked.length === 0 ? 'no bare ask reads as content' : `bare asks read as content: ${leaked.join(' · ')}`);
    ok(
      hasContentBeyondAsk('למה זה לא 2:3', focus) && hasContentBeyondAsk('מה בנתונים מרמז על משפט קטע האמצעים', focus),
      'a number, or a word the exercise uses, is content',
    );
    ok(!hasContentBeyondAsk('למה מותר להפעיל פיתגורס כאן', null), 'no exercise on screen → never content');
  }

  console.log(
    failed === 0
      ? '\nOK tutor chain: one chain, both surfaces, and nothing answered that should not be\n'
      : `\nFAILED: ${failed}\n`,
  );
  process.exitCode = failed === 0 ? 0 : 1;
})();
