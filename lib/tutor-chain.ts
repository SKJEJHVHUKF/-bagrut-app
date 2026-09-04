/**
 * tutor-chain.ts — every free answer the tutor can give, in one place.
 *
 * ============================================================
 * WHY THIS FILE EXISTS
 * ============================================================
 * There are two tutor surfaces in this app:
 *
 *   components/tutor/TutorBubble.tsx   the bubble, mounted in the root layout
 *   app/chat/page.tsx                  /chat, the full-page tutor
 *
 * Every free layer was built inside the BUBBLE's send handler. /chat had none
 * of them — not one import from tutor-router, tutor-local, tutor-faq,
 * tutor-meta-asks, tutor-exam-meta, off-topic, tutor-plan-answer,
 * topic-overview or resolve-topic. Its `send` was thirty lines of validation
 * and then `fetch('/api/chat')`.
 *
 * So the SAME question was free in the corner of the screen and billed on the
 * page devoted to asking it. Worse on /chat than that: its daily-quota guard
 * runs before anything else, so a student out of messages was refused an
 * answer that would have cost nothing.
 *
 * The fix is not to copy the layers across. Two copies drift — that is what
 * produced this gap in the first place, and it is what would produce the next
 * one. The chain lives here, both surfaces call it, and a layer added here is
 * live on both by construction.
 *
 * ============================================================
 * THE SHAPE, AND WHY IT IS PURE
 * ============================================================
 * `runTutorChain` returns a result; it never renders. Everything that made the
 * original untestable — setMsgs, setSending, refs, the mascot's face — stays
 * with the caller, which applies `state` and either shows `text` or sends the
 * turn to the model using `probe`/`routeKind`/`topic`.
 *
 * That is not tidiness. The chain could previously only be exercised through a
 * React component, so it never was, and the layers kept turning out to be dark
 * on one screen or another. scripts/test-tutor-chain.ts now runs it directly.
 *
 * ============================================================
 * ORDER IS THE DESIGN
 * ============================================================
 * Each layer is here because it beats the one after it, and the comments say
 * which measurement put it there. Do not reorder without re-reading them.
 */

import { routeMessage, answerGradedLocally, canonicalFor, type Ask } from '@/lib/tutor-router';
import { answerLocally, type LocalAnswerKind } from '@/lib/tutor-local';
import { metaAnswer } from '@/lib/tutor-meta-asks';
import { examMetaAnswer } from '@/lib/tutor-exam-meta';
import { offTopicRedirect } from '@/lib/off-topic';
// lib/tutor-plan-answer is imported DYNAMICALLY at step 10, not here. It pulls
// lib/daily-plan-client, and through it content/lessons (all 15 topics),
// content/tracks, content/ghost-replay, content/concept-quiz and lib/cognition
// — 97 content modules, a 4.4 MB chunk. This chain is reached from the tutor
// bubble in the ROOT LAYOUT, so a static import put that chunk in the first
// load of every page, /login included (measured 2026-09-04: 8.86 MB floor on
// all 57 routes). The bubble already defers tutor-context and tutor-greeting
// for exactly this reason; this was the one path left.
import { resolveTopic, isTopicOnly, isVagueAsk } from '@/lib/resolve-topic';
import { canonicalIntent } from '@/lib/tutor-intent';
import { tutorFlag } from '@/lib/tutor-flags';
import type { TutorFocus } from '@/lib/tutor-presence';
import type { Pending } from '@/lib/tutor-pending';

/**
 * The words that make up a generic ask and nothing else — question words,
 * deictics, the ask nouns (רמז / נוסחה / פתרון …) and the verbs around them.
 * A message made only of these is a BARE ask and belongs to the router.
 * Anything else — a maths noun, a number, "בנתונים", "המכנה" — is content.
 */
const ASK_WORDS = new Set([
  'מה', 'מהו', 'מהי', 'למה', 'מדוע', 'איך', 'כיצד', 'איפה', 'מאיפה', 'איזה', 'איזו', 'כמה',
  'זה', 'זאת', 'זו', 'פה', 'כאן', 'עכשיו', 'שלי', 'שלך', 'לי', 'לך', 'את', 'של', 'על', 'עם', 'אם',
  'או', 'לא', 'כן', 'גם', 'רק', 'שוב', 'עוד', 'פעם', 'ואז', 'אז', 'נו', 'טוב', 'אוקיי', 'אוקי', 'בדיוק',
  'בכלל', 'בבקשה', 'אפשר', 'אני', 'אתה', 'יכול', 'יכולה', 'תוכל', 'תוכלי',
  'נכון', 'נכונה', 'שגוי', 'שגויה', 'טעות', 'הטעות', 'טעיתי', 'בסדר', 'עשיתי',
  'תשובה', 'התשובה', 'פתרון', 'הפתרון', 'מלא', 'המלא', 'תפתור', 'תפתרי', 'לפתור',
  'רמז', 'תרמז', 'רמזים', 'תסביר', 'תסבירי', 'הסבר', 'הסבירי', 'תראה', 'תראי', 'תן', 'תני',
  'הבנתי', 'מבין', 'מבינה', 'תקוע', 'תקועה', 'נתקעתי', 'מצליח', 'מצליחה',
  'יותר', 'פשוט', 'בפשטות', 'נוסחה', 'נוסחא', 'נוסחאות', 'הנוסחה',
  'חשוב', 'לזכור', 'לדעת', 'הכי', 'סיכום', 'מתחילים', 'להתחיל', 'הצעד', 'הראשון', 'ניגשים',
  'עובד', 'קשור', 'הולך', 'מסתדר', 'יוצא', 'קורה', 'השאלה', 'מבקשת', 'רוצה', 'מבקשים', 'רוצים',
  'אומר', 'אומרת', 'הכוונה', 'בשאלה', 'דוגמה', 'דוגמא', 'טבלה', 'שלב', 'צעד', 'שורה', 'הבא',
]);

function tokenise(s: string): string[] {
  return s.replace(/[?!.,:;"'׳״\-–—()[\]$\\{}^_]/g, ' ').split(/\s+/).filter(Boolean);
}

/**
 * Does the message point at something SPECIFIC in the exercise on screen,
 * beyond a generic ask?
 *
 * A POSITIVE test, deliberately. The first version was a stop-list alone,
 * and a stop-list is right only for the words it enumerates: "לא הצלחתי",
 * "תעזור לי", "איך פותרים את זה" all read as content because הצלחתי,
 * תעזור and פותרים were not in it — Hebrew has more ways to say "help me"
 * than any list holds, and every future one would have defaulted to the
 * bank. So content now means: a number / latin symbol, or a word that the
 * exercise itself uses (question text, solution steps, sub-topic title) and
 * that is not an ask word. "מה בנתונים מרמז שצריך את משפט קטע האמצעים"
 * shares קטע/אמצעים with the exercise; "לא הצלחתי" shares nothing.
 *
 * Matching is FORWARD containment only, at ≥3 letters: the student's word
 * contains the exercise's word, possibly with a Hebrew prefix glued on
 * (בנתונים ⊃ נתונים). Never the reverse — "יודעים".includes("יודע") would
 * turn the bare "לא יודע" into content on every exercise whose steps say
 * "אנחנו יודעים ש…", which is a large share of them. Found in review.
 */
export function hasContentBeyondAsk(message: string, focus: TutorFocus | null): boolean {
  const q = focus?.question;
  if (!q) return false;
  const own = tokenise(
    `${q.question} ${q.solution?.steps?.join(' ') ?? ''} ${focus?.subTopic?.title ?? ''}`,
  ).filter((t) => t.length >= 3 && !ASK_WORDS.has(t));
  return tokenise(message).some(
    (tok) =>
      /[0-9a-z]/i.test(tok) ||
      (tok.length >= 3 &&
        !ASK_WORDS.has(tok) &&
        own.some((o) => tok.includes(o))),
  );
}

/**
 * What the chain needs to remember BETWEEN turns.
 *
 * All of it lives in refs on the caller. It is passed in and handed back
 * rather than held here because two surfaces run their own conversations, and
 * a module-level store would leak one into the other.
 */
export type ChainState = {
  /** The ask the tutor made last turn, so "ואז?" resolves to something. */
  lastAsk: Ask | null;
  /** Which authored rungs were already served for the current question. */
  servedKinds: LocalAnswerKind[];
  /** What the tutor asked the student to do last turn. */
  pending: Pending | null;
  /**
   * True once the tutor has said ANYTHING this conversation.
   *
   * ⚠️ ONLY EVER BECOMES TRUE. It was once cleared per turn, and one paid turn
   * then locked the free layers for every turn after it.
   */
  tutorSpoke: boolean;
  /** The verdict given last turn, so a challenge to it is answered locally. */
  lastVerdict: 'correct' | 'wrong' | null;
  /** Whether the previous message was a complaint — a second one goes to the model. */
  lastComplaint: boolean;
  /** The topic this CONVERSATION established, when no screen names one. */
  convTopic: string;
  /**
   * The topic whose menu was already shown, so it is never shown twice.
   *
   * ⚠️ WITHOUT THIS THE MENU LOOPS. topicOverview answers a bare topic name
   * with a list of card subjects — "עם החזרה", "הסתברות מותנית". Those
   * subjects resolve to the SAME topic and leave only filler behind, so they
   * are themselves "topic only": the student picks an item off the menu and
   * is handed the identical menu again. MEASURED at 2 of 25 items today, and
   * every one of them a dead loop the student has no way out of except
   * rephrasing.
   */
  overviewFor: string;
};

export const emptyChainState = (): ChainState => ({
  lastAsk: null,
  servedKinds: [],
  pending: null,
  tutorSpoke: false,
  lastVerdict: null,
  lastComplaint: false,
  convTopic: '',
  overviewFor: '',
});

export type ChainInput = {
  message: string;
  /** The question on screen, when there is one. Null on /chat, always. */
  focus: TutorFocus | null;
  /**
   * A topic the SCREEN knows without a focus — /chat's `?topic=` param. Takes
   * the place `focus.topic` holds in the bubble.
   */
  screenTopic?: string;
  state: ChainState;
  /**
   * Called at the point the chain stops being instant and starts awaiting a
   * bank import. The bubble uses it to raise its spinner exactly where it used
   * to, so the synchronous layers still answer without one flashing.
   */
  onSlow?: () => void;
};

export type ChainHit = {
  answered: true;
  text: string;
  /**
   * The topic the chain grounded on, whoever answered. Present on a HIT as
   * well as a miss: a free turn still established a subject, and a caller that
   * traces or greets needs it.
   */
  topic: string;
  /** Which layer spoke. For the trace, and for tests that assert on WHO answered. */
  layer: string;
  /** The mascot's reaction, when a verdict was given. */
  reaction?: 'happy' | 'oops';
  state: ChainState;
};

export type ChainMiss = {
  answered: false;
  /**
   * What to send the model. Normally the student's own words; for a resolved
   * continuation ("ואז?") the canonical phrasing of the ask it refers to.
   */
  probe: string;
  /** How the router classified the message — 'unknown_intent' vs 'no_local_content'. */
  routeKind: string;
  /** The topic the turn is grounded in: the screen's, else the message's, else the conversation's. */
  topic: string;
  /** True when a per-question bank existed and had nothing — the FAQ-authoring worklist. */
  faqMissed: boolean;
  state: ChainState;
};

export type ChainResult = ChainHit | ChainMiss;

/**
 * Run every free layer against one message.
 *
 * Returns as soon as a layer answers. On a miss the caller sends the turn to
 * the model with the fields on ChainMiss.
 */
export async function runTutorChain(input: ChainInput): Promise<ChainResult> {
  const { message: text, focus, screenTopic = '', onSlow } = input;
  const state: ChainState = { ...input.state, servedKinds: [...input.state.servedKinds] };

  // `cardTopic` is resolved further down, once the instant layers have had
  // their turn; before that the only topic known is the screen's.
  let grounded = screenTopic;
  const hit = (answer: string, layer: string, reaction?: 'happy' | 'oops'): ChainHit => ({
    answered: true,
    text: answer,
    topic: grounded,
    layer,
    ...(reaction ? { reaction } : {}),
    state,
  });

  // `probe` is what the local tutor is asked. Normally the student's own words;
  // for a resolved continuation ("ואז?" → the previous ask) it is the canonical
  // phrasing of that ask, because answerLocally classifies the words it is
  // given and "ואז?" classifies as nothing.
  let probe = text;
  let routeKind = 'open';

  // ===== 1. the router decides who answers, before anything is sent =====
  //
  // A typed answer is arithmetic, and arithmetic belongs to mathjs, not to a
  // model that judges it by eye. MEASURED before this: none of nine realistic
  // typed answers were recognised, and every one was graded by the model.
  //
  // ⚠️ NOT GATED ON `focus`. That gate once made every free layer dark on the
  // one screen students open first: `routeMessage` takes `TutorFocus | null`
  // and is written for it, and `ack` needs no question by definition. Seven
  // consecutive turns on /roadmap cost $0.0461 under the old gate, including
  // $0.0034 for "אה הבנתי".
  {
    const route = routeMessage(text, focus, {
      lastAsk: state.lastAsk,
      served: state.servedKinds,
      pending: state.pending,
      tutorSpoke: state.tutorSpoke,
      lastVerdict: state.lastVerdict,
    });
    routeKind = route.kind;
    // Consumed: a verdict is about the turn that produced it, so a challenge
    // has to be the very next message. Two turns later "בטוח?" is about
    // something else.
    state.lastVerdict = null;
    state.pending = null;

    if (route.kind === 'answer' && focus) {
      const graded = answerGradedLocally(route, focus);
      if (graded) {
        // Remembered so a challenge to THIS verdict is answered by the layer
        // that made it, instead of by a model that cannot see it.
        state.lastVerdict = graded.verdict === 'correct' ? 'correct' : 'wrong';
        return hit(graded.text, 'graded', graded.verdict === 'correct' ? 'happy' : 'oops');
      }
      // `unparseable` — the router guessed wrong about this being a value.
      // Fall through: the model is the right place for it after all.
    } else if (route.kind === 'ack') {
      // "תודה" / "אוקיי". Paying a model to say "בכיף" was 4 of every 32 turns
      // in a measured session (scripts/sim-tutor-session.ts).
      return hit(route.text, 'ack');
    } else if (route.kind === 'ask') {
      probe = canonicalFor(route.ask);
      state.lastAsk = route.ask;
    }
  }

  // ===== 2. about the TUTOR, or about studying — not about the exercise =====
  //
  // Early, because none of the layers below can ever catch these: they are not
  // maths questions, so no bank entry and no intent rule would match them
  // however much content is written.
  //
  // ⚠️ A SECOND COMPLAINT IN A ROW IS HANDED TO THE MODEL, deliberately. A
  // student who has told us twice that we answered the wrong thing, and gets
  // the same stock sentence back, has been shown that the tutor is not
  // listening — which is what they said. One paid call is far cheaper.
  const metaAsk = metaAnswer(text, {
    lastWasComplaint: state.lastComplaint,
    hasQuestion: Boolean(focus?.question),
  });
  state.lastComplaint = metaAsk?.kind === 'complaint';
  if (metaAsk) return hit(metaAsk.text, 'meta');

  // ===== 3. "זה יבוא בבגרות?" / "כמה נקודות זה שווה?" =====
  //
  // Exact answers that already exist as data in content/bagrut-curriculum.ts.
  // A model would invent a plausible number; the table has the right one, and
  // it is the same one /roadmap shows the student elsewhere.
  const meta = examMetaAnswer(text, focus?.topic || screenTopic || undefined);
  if (meta) return hit(meta, 'exam-meta');

  // ===== 3½. an authored answer in the student's OWN words beats the template =====
  //
  // `classifyAsk` matches substrings, so "למה זה לא 2:3?" and "מה בנתונים
  // מרמז שצריך את משפט קטע האמצעים" classify as the generic why-wrong / hint
  // asks, and step 4 serves the exercise's stock note — while the bank holds
  // an entry written for exactly that sentence. MEASURED (scripts/
  // measure-faq-intercept.ts, 2026-09-04): 2,811 of 51,109 authored phrasings
  // (5.5%) were swallowed this way; the bank's own test read 100% because it
  // never calls the router.
  //
  // The rule: a BARE ask ("מה הטעות שלי", "רמז", "לא הבנתי") stays with the
  // router — it needs the student's answer state, which no bank entry has.
  // Only a message that carries content beyond the ask phrase is offered to
  // the bank first, and the bank keeps every guard it already had: fenced to
  // this question's sub-topic, FAQ_THRESHOLD + FAQ_MARGIN, the foreign-subject
  // and foreign-number screens, `reveals`. A miss here falls through to step 4
  // exactly as before, and step 5 does not search twice.
  //
  // No onSlow here: the lookup is local and usually instant, and on a miss
  // the chain reaches the existing onSlow below within microseconds. Labelled
  // 'faq:early' so the trace can tell this hit from a step-5 one.
  let faqTriedEarly = false;
  if (routeKind === 'ask' && focus?.question && focus.topic && hasContentBeyondAsk(text, focus)) {
    try {
      const { answerFromFaq } = await import('@/lib/tutor-faq');
      const early = await answerFromFaq(text, focus);
      // Only a lookup that RAN counts as tried: a throw ("no bank for this
      // topic") must leave step 5 to report faqMissed exactly as before.
      faqTriedEarly = true;
      if (early) return hit(early.text, 'faq:early');
    } catch {
      /* no bank for this topic — the template answers, as before */
    }
  }

  // ===== 4. the authored content for THIS question =====
  //
  // Most of what a student asks mid-exercise ("רמז", "למה טעיתי", "מאיפה
  // מתחילים") already has a written, verified answer in the question object.
  // Abstains on anything ambiguous, so the real tutor still handles the novel
  // question — and abstains entirely without a focus, which is why /chat gets
  // almost nothing from this one. It stays in the chain because it is the
  // consumer of the router's `probe` rewrite.
  const local = answerLocally(probe, focus, state.servedKinds);
  if (local) {
    state.servedKinds.push(local.kind);
    return hit(local.text, `local:${local.kind}`);
  }

  // Everything below awaits a lazily-imported bank. The caller raises its
  // spinner here and not before, so the instant layers above stay instant.
  onSlow?.();

  // The screen's topic when it has one; otherwise the topic named in THIS
  // message, else the one this CONVERSATION already established.
  const cardTopic = focus?.topic || screenTopic || resolveTopic(text) || state.convTopic || '';
  if (cardTopic) state.convTopic = cardTopic;
  grounded = cardTopic;

  // Declared BEFORE the closure that reads it. The bubble carries a warning
  // about exactly this shape: a const declared after its first reader is a
  // run-time ReferenceError that TypeScript does not flag inside one function
  // body.
  let faqMissed = false;

  const miss = (): ChainMiss => ({
    answered: false,
    probe,
    routeKind,
    topic: cardTopic,
    faqMissed,
    state,
  });

  // ===== 5. the banks, entered through the door that fits the screen =====
  if (focus?.question && focus.topic) {
    try {
      // Already searched in step 3½ for this exact message — same fence, same
      // thresholds — so a second pass could only return the same null. The
      // layers below still run, exactly as after any other bank miss.
      if (faqTriedEarly) {
        faqMissed = true;
      } else {
        const { answerFromFaq } = await import('@/lib/tutor-faq');
        const faq = await answerFromFaq(text, focus);
        if (faq) return hit(faq.text, 'faq:question');
        faqMissed = true;
      }
    } catch {
      /* no bank for this topic yet — the model handles it, as before */
    }
  } else {
    // ⚠️ A SEPARATE FUNCTION, NOT A LOOSER `answerFromFaq`, AND THAT IS THE
    // WHOLE SAFETY MODEL. Itay: "תבנה כניסות נפרדות כך שתלמיד שואל שאלה
    // הבנקים לא מתערבבים וכך הוא לא יקבל תשובה אחרת".
    //
    // With a question on screen the bank search is fenced to that question's
    // own sub-topic, because an answer about a DIFFERENT exercise is about the
    // wrong numbers — measured, 26.8% reach for 5.6% wrong answers, and
    // rejected on those numbers. That fence stays exactly where it is; this
    // branch cannot even be reached while `focus.question` exists.
    //
    // With NO exercise on screen there is no other exercise to confuse it
    // with, so the search widens to the whole topic — concept, mistake and
    // check entries only, never one whose wording is bound to its own
    // exercise. MEASURED (npm run measure:topicfaq) over 3,657 authored
    // phrasings: 49.6% answered with no model call, 1.0% of hits from another
    // unit. With no topic at all it is EVERY authored bank: over 1,219
    // phrasings, 48.4% answered and ZERO from the wrong topic.
    try {
      const { answerTopicFaq } = await import('@/lib/tutor-faq');
      const bank = await answerTopicFaq(text, cardTopic || null);
      if (bank) return hit(bank.text, 'faq:topic');
    } catch {
      /* no bank for this topic yet */
    }
  }

  // ===== 6. a vague ask with no topic at all =====
  //
  // "תסביר לי משהו מהחומר" — one of the app's OWN idle buttons, billed on
  // every press for a reply that can only be "which topic?". See
  // chooseTopicPrompt.
  if (!focus?.question && !cardTopic && isVagueAsk(text)) {
    const { chooseTopicPrompt } = await import('@/lib/topic-overview');
    return hit(chooseTopicPrompt(), 'choose-topic');
  }

  // ===== 7. a bare topic name =====
  //
  // "הסתברות", typed straight after the tutor asked which topic the student is
  // on. Four of these in one session, every one a model call, because the
  // fifteen authored cards cover the ideas INSIDE probability and none covers
  // probability itself.
  if (!focus?.question && cardTopic && cardTopic !== state.overviewFor && isTopicOnly(text)) {
    try {
      const { topicOverview } = await import('@/lib/topic-overview');
      const overview = await topicOverview(cardTopic);
      if (overview) {
        state.overviewFor = cardTopic;
        return hit(overview, 'topic-overview');
      }
    } catch {
      /* nothing authored for this topic */
    }
  }

  // ===== 8. the bank that belongs to no topic at all =====
  //
  // "איך כדאי ללמוד", "מה יש בנוסחאון", "מה לעשות כשאני נתקע" — asked
  // constantly, answered by nothing. Runs LAST of the banks and only without a
  // question, so it can never speak over an answer written for the exercise on
  // screen.
  if (!focus?.question) {
    try {
      const { answerGeneralFaq } = await import('@/lib/tutor-faq');
      const general = await answerGeneralFaq(text);
      if (general) return hit(general.text, 'faq:general');
    } catch {
      /* the general bank is optional */
    }
  }

  // ===== 9. the response compiler (FLAGGED OFF) =====
  //
  // Placed HERE and not earlier, and the position is a measurement rather than
  // a preference. The authored hint, the authored FAQ entry and the distractor
  // note are all written for THIS question by a person; the compiler assembles
  // from the same content but generically. Whenever the layers above have
  // something, theirs is better, so the compiler only ever sees what they
  // declined.
  if (tutorFlag('compiler') && (focus || cardTopic)) {
    try {
      const { compileTutorResponse } = await import('@/lib/tutor-compiler');
      const compiled = await compileTutorResponse({
        message: text,
        // WARNING: A BARE TOPIC NAME IS A `concept` ASK, and nothing else
        // classifies it. "על הסתברות" — two words, no verb — cost $0.0047
        // while "תסביר את הסתברות", the same request one word longer, was free
        // from an authored card.
        ...(isTopicOnly(text) ? { canonicalIntent: 'concept' as const } : {}),
        activeQuestion: (focus?.question ?? null) as Record<string, unknown> | null,
        selectedAnswer: typeof focus?.chosenIndex === 'number' ? focus.chosenIndex : null,
        topic: cardTopic,
        formulas: focus?.subTopic?.formulas,
        keyPoints: focus?.subTopic?.keyPoints,
        // A lesson screen already has its sub-topic's questions; /quiz
        // publishes `siblings` because it has no sub-topic at all.
        siblings:
          focus?.siblings ??
          focus?.subTopic?.questions?.map((x) => ({ id: x.id, question: x.question, hint: x.hint })),
      });
      if (compiled.handled && compiled.safeToServe && compiled.message.trim()) {
        return hit(compiled.message, 'compiler');
      }
    } catch {
      /* the compiler is additive — a failure here must cost nothing more than
         the model call that was already about to happen */
    }
  }

  // ===== 10. "על מה כדאי לעבוד עכשיו" — from the student's own plan =====
  //
  // The only phrasing that appeared TWICE in the live trace, and it came back
  // `missing_question_context`. The model does not know this student;
  // `buildTodayPlan` has their results, their mistakes and their target, and
  // is what /my-plan renders. Silent whenever a question is on screen: there
  // "מה לעשות עכשיו" means the exercise, and `what_to_do_here` owns it.
  const { planAnswer } = await import('@/lib/tutor-plan-answer');
  const fromPlan = planAnswer(text, Boolean(focus?.question));
  if (fromPlan) return hit(fromPlan, 'plan');

  // ===== 11. "יש לך טיפים?" — the one ask no screen can improve =====
  //
  // AFTER the plan layer, because "על מה כדאי לעבוד" is a better answer than
  // five general tips when there is a plan to name.
  if (canonicalIntent(text, undefined).intent === 'study_tips') {
    const { studyTips } = await import('@/lib/study-tips');
    return hit(studyTips(focus?.topic || screenTopic || undefined), 'tips');
  }

  // ===== 12. the message is not about maths at all =====
  //
  // Placed LAST on purpose. Every layer above has already declined, so nothing
  // that could have been answered is being redirected instead — and a redirect
  // that lands on a real question is the expensive failure here, far worse than
  // paying for one model call.
  const redirect = offTopicRedirect(
    text,
    focus?.question
      ? `${String((focus.question as Record<string, unknown>).question ?? '')} ${focus.topic ?? ''}`
      : undefined,
  );
  if (redirect) return hit(redirect, 'off-topic');

  return miss();
}
