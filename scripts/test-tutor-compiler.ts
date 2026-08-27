/**
 * test-tutor-compiler.ts — the response compiler, the topic cards and the
 * error coach.
 *
 *   npx tsx scripts/test-tutor-compiler.ts
 *
 * FREE. Pure functions and authored content; no network, no model.
 *
 * THE THREE PROPERTIES THAT MATTER MORE THAN COVERAGE:
 *   1. every served answer is GROUNDED — `groundedSources` is never empty
 *   2. a Topic Card is never served for a question about the EXERCISE
 *   3. nothing served as a hint or a next step contains the final answer
 *
 * A regression in coverage costs a model call. A regression in any of those
 * three costs the student's trust, which is why they are asserted first.
 */

import { compileTutorResponse } from '../lib/tutor-compiler';
import { matchTopicCard, renderTopicCard, cardCanAnswer, loadTopicCards } from '../lib/topic-cards';
import { coachMistake, DETECTED_KINDS, mistakeKindOf } from '../lib/error-coach';
import { CANONICAL_INTENTS, type CanonicalIntent } from '../lib/tutor-intent';
import PROBABILITY_CARDS from '../content/topic-cards/math5/probability';
import { getTopicMapping } from '../content/bagrut-curriculum';

let checks = 0;
let failures = 0;
const ok = (cond: boolean, msg: string) => {
  checks++;
  if (!cond) {
    failures++;
    console.log(`FAIL  ${msg}`);
  }
};

const TOPIC = 'הסתברות';

/** A question with everything, so a test can remove one field at a time. */
const fullQuestion = {
  id: 'prob-demo',
  hint: 'התחילו מהגדרת המאורע המשלים.',
  distractorNotes: ['', 'זו ההסתברות שהמאורע כן יתרחש.'],
  solution: {
    steps: [
      '**הכלל:** כשמופיע "לפחות אחד", עוברים למאורע המשלים ומחסרים מ-1.',
      'נסמן את המאורע ונחשב את ההסתברות שאף אחד לא קרה.',
      'נחסר את התוצאה מ-1.',
    ],
    finalAnswer: '0.875',
    explanation: 'המשלים קל יותר לחישוב כי הוא מסלול יחיד.',
  },
};

(async () => {
  // ============================================================
  console.log('\n-- the cards themselves --');
  // ============================================================
  {
    ok(PROBABILITY_CARDS.length >= 15, `at least fifteen cards (${PROBABILITY_CARDS.length})`);
    const ids = new Set<string>();
    for (const c of PROBABILITY_CARDS) {
      ok(!ids.has(c.id), `id is unique: ${c.id}`);
      ids.add(c.id);
      ok(Boolean(getTopicMapping(c.topic)), `${c.id}: topic "${c.topic}" is a curriculum key`);
      ok(c.aliases.length >= 3, `${c.id}: at least three phrasings (${c.aliases.length})`);
      for (const field of ['shortExplanation', 'formulaOrRule', 'microExample', 'commonMistake', 'followUpQuestion'] as const) {
        ok(Boolean(c[field]?.trim()), `${c.id}: ${field} is written`);
      }
      // A card that ends on a full stop ends the conversation.
      ok(c.followUpQuestion.trim().endsWith('?'), `${c.id}: hands the turn back with a question`);
      // Hebrew inside $…$ renders reversed — KaTeX has no bidi.
      const rendered = renderTopicCard(c);
      const parts = rendered.split('$');
      for (let i = 1; i < parts.length; i += 2) {
        ok(!/[֐-׿]/.test(parts[i]), `${c.id}: no Hebrew inside a maths island ("${parts[i].slice(0, 30)}")`);
      }
      // A paragraph opening on maths flips the whole line to LTR.
      for (const para of rendered.split('\n\n')) {
        const first = para.trimStart()[0] ?? '';
        ok(first !== '$' && !/[A-Za-z0-9]/.test(first), `${c.id}: no paragraph opens on "${first}"`);
      }
    }
  }

  // ============================================================
  console.log('\n-- every alias finds its own card, and only its own --');
  // ============================================================
  {
    let hits = 0;
    let misroutes = 0;
    for (const card of PROBABILITY_CARDS) {
      for (const alias of card.aliases) {
        const m = await matchTopicCard(alias, TOPIC, 'how_it_works');
        if (!m) continue;
        hits++;
        if (m.card.id !== card.id) {
          misroutes++;
          ok(false, `"${alias}" belongs to ${card.id} but matched ${m.card.id}`);
        }
      }
    }
    const total = PROBABILITY_CARDS.reduce((n, c) => n + c.aliases.length, 0);
    ok(misroutes === 0, `no alias lands on another card (${misroutes})`);
    ok(hits / total >= 0.7, `most aliases match their card (${hits}/${total})`);
    console.log(`   ${hits}/${total} aliases matched, ${misroutes} misrouted`);
  }

  // ============================================================
  console.log('\n-- a card is never served for a question about the EXERCISE --');
  // ============================================================
  {
    // The whole safety model of this feature in four assertions.
    for (const intent of ['next_step', 'why_this_step', 'what_to_do_here', 'why_wrong'] as CanonicalIntent[]) {
      ok(!cardCanAnswer(intent), `${intent}: a general card may not answer it`);
      const m = await matchTopicCard('מה זה בלי החזרה', TOPIC, intent);
      ok(m === null, `${intent}: the matcher refuses even on a perfect phrasing`);
    }
    // …and it IS allowed for the ones that are about the topic.
    for (const intent of ['how_it_works', 'explain', 'didnt_understand', 'give_table'] as CanonicalIntent[]) {
      ok(cardCanAnswer(intent), `${intent}: a card may answer it`);
    }
    // Nothing outside the topic has cards, and asking must not invent any.
    ok((await matchTopicCard('מה זה בלי החזרה', 'סדרות', 'how_it_works')) === null, 'no cards for a topic that has none');

    // ⚠️ THE SAFETY PROPERTY OF THE `concept` INTENT.
    //
    // `concept` is the one rule allowed to match a message that names its own
    // subject, and that is safe only because a card is the only thing that may
    // serve it. A concept question in a topic with no cards must reach the
    // model unchanged — otherwise the inversion becomes a licence to answer
    // any general question from whatever happens to be nearby.
    // ⚠️ THESE TWO MUST NOT HAVE CARDS, AND THAT IS THE FIXTURE'S JOB.
    //
    // This list used to include "מה ההבדל בין סדרה חשבונית להנדסית", which was
    // a fine example until ten סדרות cards were written and one of them
    // answered exactly that. The assertion went red for the right reason: the
    // premise had expired, not the behaviour. Pick concepts from topics that
    // still have no card bank at all, and check `content/topic-cards/math5/`
    // before adding one here.
    for (const q of ['מה זה בכלל נגזרת', 'מה זה אינטגרל מסוים']) {
      const r = await compileTutorResponse({
        message: q,
        activeQuestion: fullQuestion,
        topic: 'סדרות',
      });
      ok(!r.handled, `a concept question with no card stays with the model: "${q}"`);
      ok(r.requiresLLM, `…and says so: "${q}"`);
    }
    // …while the same shape in a topic that HAS cards is answered.
    const covered = await compileTutorResponse({
      message: 'מה זה בלי החזרה',
      activeQuestion: fullQuestion,
      topic: TOPIC,
    });
    ok(covered.handled, 'a concept question WITH a card is answered locally');
    ok(covered.responseType === 'topic_card', `…as a topic card (${covered.responseType})`);
    ok(covered.groundedSources.includes('topic_card'), '…and says the card is the source');
    ok((await loadTopicCards('טריגונומטריה')).length === 0, 'an unauthored topic loads empty, not undefined');

    // ⚠️ A CONCEPT QUESTION NEEDS NO ACTIVE QUESTION.
    //
    // Reported from a real session on /roadmap/<lesson>: the tutor still
    // called the model there. `SubTopicLadder` publishes a focus with `where`
    // and NO question object, and the compiler demanded one before it would
    // even look at the cards — blocking exactly the screen where a card is
    // most useful, a student reading a lesson and asking what something means.
    //
    // The census could not catch this: it samples QUESTIONS, and this screen
    // has none.
    for (const q of ['מה זה בלי החזרה', 'מה ההבדל בין וגם לאו', 'איך קוראים עץ הסתברות']) {
      const r = await compileTutorResponse({ message: q, activeQuestion: null, topic: TOPIC });
      ok(r.handled, `answered with no question on screen: "${q}"`);
      ok(r.responseType === 'topic_card', `…as a card (${r.responseType})`);
    }
    // …and the exercise intents still require one, on that same screen.
    for (const intent of ['next_step', 'why_this_step', 'what_to_do_here'] as CanonicalIntent[]) {
      const r = await compileTutorResponse({ canonicalIntent: intent, activeQuestion: null, topic: TOPIC });
      ok(!r.handled, `${intent}: still needs a question`);
      ok(r.fallbackReason === 'missing_question_context', `${intent}: and says which (${r.fallbackReason})`);
    }
  }

  // ============================================================
  console.log('\n-- the compiler grounds every answer it serves --');
  // ============================================================
  {
    for (const intent of CANONICAL_INTENTS) {
      const r = await compileTutorResponse({
        canonicalIntent: intent,
        message: 'מה זה בלי החזרה',
        activeQuestion: fullQuestion,
        topic: TOPIC,
      });
      if (r.handled) {
        ok(r.groundedSources.length > 0, `${intent}: a served answer names its sources`);
        ok(r.message.trim().length > 0, `${intent}: a served answer has text`);
        ok(r.safeToServe, `${intent}: served implies safe`);
        ok(!r.requiresLLM, `${intent}: served implies no model needed`);
        ok(r.fallbackReason === null, `${intent}: served implies no fallback reason`);
      } else {
        ok(r.requiresLLM, `${intent}: unhandled implies the model is asked`);
        ok(r.fallbackReason !== null, `${intent}: unhandled names a reason`);
        ok(r.message === '', `${intent}: unhandled serves no text`);
      }
    }
  }

  // ============================================================
  console.log('\n-- no grounding, no answer --');
  // ============================================================
  {
    // The question is on screen but carries nothing. Every intent must abstain
    // rather than reach for something general.
    const bare = { id: 'bare' };
    for (const intent of ['next_step', 'why_this_step', 'what_to_do_here', 'which_formula'] as CanonicalIntent[]) {
      const r = await compileTutorResponse({ canonicalIntent: intent, activeQuestion: bare, topic: TOPIC });
      ok(!r.handled, `${intent}: an empty question is not answered`);
      ok(r.fallbackReason === 'no_local_content', `${intent}: and says why (${r.fallbackReason})`);
    }
    // No question at all.
    const none = await compileTutorResponse({ canonicalIntent: 'next_step', activeQuestion: null });
    ok(none.fallbackReason === 'missing_question_context', `no question → ${none.fallbackReason}`);
  }

  // ============================================================
  console.log('\n-- a next step is a MOVE, never the answer --');
  // ============================================================
  {
    // A solution whose first move already contains the final answer must not
    // be handed over as a hint. Same predicate the content gate uses.
    const leaky = {
      hint: 'תחשוב על המשלים.',
      solution: { steps: ['**הכלל:** חוק המשלים.', 'התשובה היא 0.875 ישירות.'], finalAnswer: '0.875' },
    };
    const r = await compileTutorResponse({ canonicalIntent: 'next_step', activeQuestion: leaky, topic: TOPIC });
    ok(r.responseType !== 'next_step' || !r.message.includes('0.875'), 'the final answer never arrives as a next step');
    if (r.handled) ok(r.groundedSources.includes('hint'), 'it falls back to the authored hint instead');
  }

  // ============================================================
  console.log('\n-- why_this_step needs the authored rule line --');
  // ============================================================
  {
    const withRule = await compileTutorResponse({ canonicalIntent: 'why_this_step', activeQuestion: fullQuestion, topic: TOPIC });
    ok(withRule.handled, 'a solution with a **הכלל:** line answers "why"');
    ok(withRule.groundedSources.includes('solution.rule'), 'and says the rule line is the source');

    const noRule = {
      solution: { steps: ['נחשב את המשלים.', 'נחסר מ-1.'], finalAnswer: '0.875' },
    };
    const without = await compileTutorResponse({ canonicalIntent: 'why_this_step', activeQuestion: noRule, topic: TOPIC });
    ok(!without.handled, 'without a rule line it abstains rather than improvising a reason');
  }

  // ============================================================
  console.log('\n-- the error coach never accuses on a guess --');
  // ============================================================
  {
    for (const kind of ['domain_error', 'substitution_error', 'wrong_formula', 'arithmetic_error', 'unknown_error'] as const) {
      const c = coachMistake(null, kind);
      ok(!c.detected, `${kind}: reported as NOT detected`);
      ok(!/טעית|לא הבנת|שגית/.test(c.message), `${kind}: the wording does not accuse`);
      ok(c.message.length > 0, `${kind}: still says something useful`);
    }
    for (const kind of DETECTED_KINDS) {
      const c = coachMistake(null, kind);
      ok(c.detected && c.message.length > 20, `${kind}: has an authored line`);
    }
    ok(mistakeKindOf({ kind: 'sign-flip' }) === 'sign_error', 'a checker diagnosis maps through');
    ok(mistakeKindOf(null) === 'unknown_error', 'no diagnosis is unknown, not invented');

    // A wrong answer with a written distractor note prefers the note.
    const withNote = await compileTutorResponse({
      canonicalIntent: 'why_wrong',
      activeQuestion: fullQuestion,
      selectedAnswer: 1,
      checkAnswerResult: { isCorrect: false },
      topic: TOPIC,
    });
    ok(withNote.handled && withNote.groundedSources.includes('distractorNotes'), 'the authored note wins');

    // A wrong answer with no note and no diagnosis must NOT be answered.
    const noNote = await compileTutorResponse({
      canonicalIntent: 'why_wrong',
      activeQuestion: { id: 'x' },
      checkAnswerResult: { isCorrect: false },
      topic: TOPIC,
    });
    ok(!noNote.handled, 'an unidentified mistake goes to the model rather than getting a neutral shrug');
  }

  // ============================================================
  // ============================================================
  console.log('\n-- the flag, and that OFF is the default --');
  // ============================================================
  {
    const store = new Map<string, string>();
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
      },
    };
    const { tutorFlag, activeTutorFlags } = await import('../lib/tutor-flags');

    ok(!tutorFlag('compiler'), 'with nothing set and no env var, the compiler is OFF');

    // ⚠️ THE ENV DEFAULT IS THE ONLY SWITCH THAT REACHES A STUDENT.
    //
    // The localStorage key is per browser, so the layer was off for everyone
    // while `measure-quiz-gap` — which calls the compiler directly — reported
    // 86%. Right about the code, wrong about the product.
    process.env.NEXT_PUBLIC_TUTOR_COMPILER = 'on';
    ok(tutorFlag('compiler'), 'the env var turns it on for everyone');
    store.set('mathup-flags', 'off');
    ok(!tutorFlag('compiler'), 'and ONE browser can still turn it back off, without a deploy');
    store.delete('mathup-flags');
    process.env.NEXT_PUBLIC_TUTOR_COMPILER = 'anything-else';
    ok(!tutorFlag('compiler'), 'any value other than "on" fails closed');
    delete process.env.NEXT_PUBLIC_TUTOR_COMPILER;
    ok(!tutorFlag('compiler'), 'and removing it returns to off');
    ok(activeTutorFlags().length === 0, 'and nothing reports as active');

    store.set('mathup-flags', 'compiler');
    ok(tutorFlag('compiler'), 'it turns on when the key says so');
    ok(activeTutorFlags().join() === 'compiler', 'and only the flag that is named');

    // 'compiler' is the only flag today. A second name in the list must be
    // carried, not choke the parse — the next rollout switch arrives that way.
    store.set('mathup-flags', 'compiler, future');
    ok(tutorFlag('compiler'), 'a comma list still turns the compiler on');
    ok(activeTutorFlags().join() === 'compiler,future', 'and an unknown name is kept, not dropped');

    // A flag must fail CLOSED. Every one of these is a real browser state.
    for (const junk of ['', '   ', ',,,', '{"compiler":true}']) {
      store.set('mathup-flags', junk);
      ok(!tutorFlag('compiler'), `malformed value stays off: ${JSON.stringify(junk)}`);
    }
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: {
        getItem: () => {
          throw new Error('storage disabled');
        },
      },
    };
    ok(!tutorFlag('compiler'), 'a throwing localStorage stays off, not on');

    // ---- ?flags= in the URL ----------------------------------------
    // The console route did not work in practice: Chrome and Edge block the
    // first paste into DevTools, so the setItem never ran and the feature
    // looked dead from outside. A rollout switch that needs a
    // browser-specific workaround to reach is not a switch.
    const jar = new Map<string, string>();
    const withUrl = (href: string) => {
      (globalThis as unknown as { window: unknown }).window = {
        location: { href },
        localStorage: {
          getItem: (k: string) => jar.get(k) ?? null,
          setItem: (k: string, v: string) => jar.set(k, v),
          removeItem: (k: string) => jar.delete(k),
        },
      };
    };
    const flags = await import('../lib/tutor-flags');

    withUrl('https://x.test/roadmap?flags=compiler');
    flags.adoptFlagsFromUrl();
    ok(flags.tutorFlag('compiler'), '?flags=compiler turns it on');

    withUrl('https://x.test/roadmap?flags=off');
    flags.adoptFlagsFromUrl();
    ok(!flags.tutorFlag('compiler'), '?flags=off turns it off again');

    jar.set('mathup-flags', 'compiler');
    withUrl('https://x.test/roadmap');
    flags.adoptFlagsFromUrl();
    ok(flags.tutorFlag('compiler'), 'a URL with no flags param leaves the setting alone');

    withUrl('not a url at all');
    flags.adoptFlagsFromUrl();
    ok(true, 'a malformed URL does not throw');
  }

  // ============================================================
  console.log('\n-- the wiring really is behind the flag --');
  // ============================================================
  {
    const fs = await import('fs');
    const { resolve } = await import('path');
    const src = fs.readFileSync(resolve(process.cwd(), 'components/tutor/TutorBubble.tsx'), 'utf8');
    ok(src.includes('tutor-compiler'), 'the bubble reaches the compiler');
    // The only call site must sit inside a flag check. Asserted on the source
    // because the alternative is rendering a React tree, and a regression here
    // would silently change what every student sees.
    const at = src.indexOf('compileTutorResponse');
    const before = src.slice(Math.max(0, at - 400), at);
    ok(/tutorFlag\('compiler'\)/.test(before), 'and only inside `tutorFlag(\'compiler\')`');
    ok(
      src.indexOf('compileTutorResponse') > src.indexOf('answerFromFaq'),
      'and after the FAQ — authored beats assembled, which is what the measurement said',
    );
  }

  console.log('\n-- the cost contract --');
  // ============================================================
  {
    const fs = await import('fs');
    const { resolve } = await import('path');
    const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
    for (const file of ['lib/tutor-compiler.ts', 'lib/topic-cards.ts', 'lib/error-coach.ts']) {
      const src = strip(fs.readFileSync(resolve(process.cwd(), file), 'utf8'));
      ok(!/anthropic|messages\.create|@anthropic-ai|fetch\(/i.test(src), `${file} contains no path to a model`);
    }
  }

  console.log(`\n${failures === 0 ? 'PASS' : 'FAILED'}  ${checks - failures}/${checks} passed`);
  process.exit(failures === 0 ? 0 : 1);
})();
