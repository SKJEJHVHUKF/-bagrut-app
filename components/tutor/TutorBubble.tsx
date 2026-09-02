'use client';

/**
 * TutorBubble — the tutor that stays beside the student instead of living on a
 * page they have to go to.
 *
 * Mounted ONCE in the root layout, so it is present on every screen (see
 * HIDDEN_PREFIXES for the handful of exceptions). Two things make it more than
 * /chat in a corner:
 *
 *   1. IT SEES THE SCREEN. lib/tutor-presence lets the page publish the
 *      question currently displayed; the bubble ships that as this turn's
 *      context. "אני תקוע" is a complete sentence here — the student never
 *      re-types the question.
 *   2. IT SPEAKS FIRST WHEN IT MATTERS. A wrong answer lights a dot on the
 *      bubble. That nudge is template-built from state the page already
 *      published: $0, instant, and incapable of inventing a mistake.
 *
 * Deliberately EPHEMERAL in the UI: no conversation list, no history sidebar,
 * no titles. Those belong to /chat, which stays exactly as it was. This is the
 * quick "wait, why?" that happens without leaving the exercise — the server
 * still persists the transcript, so nothing is lost.
 *
 * ponytail: the SSE read loop is a compact copy of the one in app/chat/page.tsx
 * rather than a shared helper. Extracting it would mean refactoring a working
 * 800-line page for a 25-line saving. Pull it into lib/sse.ts the next time
 * either side needs to change.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { X, Send, Loader2, Sparkles, ArrowLeft, ShieldCheck } from 'lucide-react';
import TutorMascot, { type MascotExpression } from './TutorMascot';
import TodayPlanCard from './TodayPlanCard';
import { getUnitLevel, getPaper } from '@/lib/study-plan';
import { isStaffPath } from '@/lib/nav';
import {
  getTutorFocus,
  subscribeTutorFocus,
  renderFocusContext,
  focusPrompts,
  type TutorFocus,
} from '@/lib/tutor-presence';
import { type LocalAnswerKind } from '@/lib/tutor-local';
import { runTutorChain } from '@/lib/tutor-chain';
import type { Ask } from '@/lib/tutor-router';
import { tutorFlag, adoptFlagsFromUrl } from '@/lib/tutor-flags';
import { AI_DAILY_LIMIT } from '@/lib/access';
import { expectationOf, nextStepAfter, type Pending } from '@/lib/tutor-pending';
import { canonicalIntent, groundingFor } from '@/lib/tutor-intent';
import { decideFallbackReason } from '@/lib/tutor-telemetry';
// lib/tutor-context and lib/tutor-greeting are imported DYNAMICALLY at their
// two call sites below, not here. Both pull the whole content corpus behind
// them — tutor-context via lib/cognition, tutor-greeting via
// lib/daily-plan-client — and this bubble is mounted by the ROOT LAYOUT, so a
// static import put the entire lesson bank in the first-load JS of every page,
// including /login, for a drawer most sessions never open.
//
// Deferring here rather than making those libs async on purpose: the call
// sites are already an async send handler and a click handler, so nothing else
// changes — no signatures, no other pages, no test rewrites.
import type { TutorGreeting } from '@/lib/tutor-greeting';
import type { ResolvedSuggestion } from '@/lib/agents/tools';

const MAX_LEN = 500;

/**
 * Where the bubble must NOT appear.
 *
 * Mounted in the root layout with its OWN gate rather than inside AppChrome,
 * even though AppChrome is also global. AppChrome returns null without a signed-in
 * profile, so hanging the bubble off it would make the whole feature invisible
 * to anyone who is not logged in — including during development, where it means
 * the UI can never be looked at in a browser at all. `/teach` was deliberately
 * left out of the protected prefixes for exactly this reason.
 *
 * So the bubble renders for anonymous visitors too; /api/chat answers 401 and
 * the drawer says "צריך להתחבר כדי לשאול". Nothing leaks — the server is the
 * gate, not the button.
 *
 * `/chat` and `/scan` are excluded because each already owns a better tutor for
 * its own screen: /chat IS the full tutor, and /scan's QuestionTutor is grounded
 * in the question AND the solution actually displayed — cheaper and more precise
 * there than this bubble's topic grounding could be. Two tutors on one screen is
 * not twice the help.
 */
const HIDDEN_PREFIXES = ['/login', '/signup', '/auth', '/onboarding', '/chat', '/scan'];

type Msg = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  action?: ResolvedSuggestion;
  /** Set when the reply came from authored content instead of the API. Shown
   *  to the student as "מהחומר המאומת" — which is a stronger claim than an AI
   *  answer, not a weaker one: a human wrote and checked it. */
  local?: boolean;
};

/** Fallbacks for screens that publish no focus — still better than a blank box. */
const IDLE_PROMPTS = ['על מה כדאי לי לעבוד עכשיו?', 'תסביר לי משהו מהחומר'];

export default function TutorBubble() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<TutorFocus | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // How many AI turns are left today, as the SERVER counts them. null until a
  // turn has actually reached the model — showing "10 מתוך 10" to a student
  // who has only ever used the free local help would advertise a limit they
  // have not touched.
  const [aiLeft, setAiLeft] = useState<number | null>(null);
  // Kept for the life of the visit so the whole side-conversation lands in ONE
  // server conversation. Sending null every turn would mint a new conversation
  // per message and flood the student's history list.
  const convIdRef = useRef<string | null>(null);
  // The nudge is dismissed per question, not globally — otherwise the first
  // dismissal silences the tutor for the rest of the session.
  const [nudgeDismissed, setNudgeDismissed] = useState<string | null>(null);
  /**
   * A verdict is a MOMENT, not a state: the mascot celebrates or leans in for
   * a couple of seconds and then goes back to being present. Held in state and
   * not in the `lastVerdictRef` beside it, because that ref exists precisely
   * so a verdict does NOT re-render — and a face that reacts has to.
   *
   * The nonce is load-bearing: two correct answers in a row produce the same
   * kind, and without it React bails on the identical value, the effect never
   * re-runs, and the second celebration silently does not happen.
   */
  const [reaction, setReaction] = useState<{ kind: 'happy' | 'oops'; n: number } | null>(null);
  const reactionN = useRef(0);
  const react = useCallback((kind: 'happy' | 'oops') => {
    reactionN.current += 1;
    setReaction({ kind, n: reactionN.current });
  }, []);
  useEffect(() => {
    if (!reaction) return;
    const t = setTimeout(() => setReaction(null), 2600);
    return () => clearTimeout(t);
  }, [reaction]);
  const endRef = useRef<HTMLDivElement>(null);
  // Which rungs of authored help were already served for the CURRENT question,
  // so a second "אני תקוע" walks down the ladder instead of repeating itself.
  // Keyed by question text so moving to the next question resets it.
  const servedRef = useRef<{ key: string; kinds: LocalAnswerKind[] }>({ key: '', kinds: [] });
  /** The ask the previous turn resolved to. Without it "ואז?" and "המשך" carry
   *  no meaning and every one of them was a billed call. Cleared with the
   *  served rungs when the question changes, since a continuation refers to
   *  this conversation and not the previous question's. */
  const lastAskRef = useRef<Ask | null>(null);
  // Bumped whenever the conversation is reset; an API stream that started under
  // an older generation must not write into the fresh chat (see below).
  const genRef = useRef(0);
  // The last QUESTION the drawer talked about — id, or text when there is no id.
  const lastQKeyRef = useRef('');
  /**
   * Today's plan, in the tutor's voice.
   *
   * Computed when the drawer is OPENED, not on mount. Building it reads
   * localStorage and walks every sub-topic of the roadmap — real work, and
   * pointless on a page load where the student never touches the bubble. It is
   * also fresher this way: open it after finishing a rung and the plan already
   * reflects that, which an on-mount read would not.
   *
   * Only rendered on a screen with no question of its own. Mid-exercise the
   * question in front of the student outranks the day's agenda, and a teacher
   * who interrupts your work to read out the schedule is not being helpful.
   */
  const [greeting, setGreeting] = useState<TutorGreeting | null>(null);

  const hidden =
    // isStaffPath: the tutor mascot is for students, not for staff consoles.
    isStaffPath(pathname ?? '/') ||
    HIDDEN_PREFIXES.some((p) => pathname === p || pathname?.startsWith(p + '/'));

  // `?flags=compiler` in the address bar, once, and it sticks for this browser.
  // Read before anything else so the very first message of the visit already
  // sees the flag. See lib/tutor-flags for why this exists at all.
  useEffect(() => {
    adoptFlagsFromUrl();
  }, []);

  // ===== the denominator =====
  //
  // A turn answered by the router, the ladder, the FAQ bank or a card never
  // leaves the browser, so tutor_trace only ever saw the expensive half. That
  // answers "why did we pay" and cannot answer "how often" — and without the
  // second, "most questions are answered locally" is a feeling.
  //
  // ⚠️ Hooked to `local: true` on the MESSAGE rather than to the six places
  // that return one. Every local layer already sets that flag to render the
  // message differently, so this catches all six today and whatever is added
  // next without anyone remembering to instrument it. The alternative was six
  // near-identical insertions, which is six chances to miss one.
  //
  // Fire and forget, 204, ignored: a diagnostic must never be something the
  // student can feel. `reportedRef` is what stops a re-render from counting
  // the same answer twice.
  const reportedRef = useRef<Set<string>>(new Set());
  /**
   * What the tutor's own last message asked the student for.
   *
   * ⚠️ Set from the SAME effect that reports a local turn, and for the same
   * reason: every local layer marks its message `local: true`, so hooking the
   * flag catches all eight places one is produced — and the next one added,
   * without anyone remembering. Read and cleared at the top of `send`.
   */
  const pendingRef = useRef<Pending | null>(null);
  /**
   * Has the tutor said anything yet in this conversation? The follow-up
   * router's gate.
   *
   * ⚠️ ANY assistant message, local OR from the model. It used to be
   * "did the tutor answer LOCALLY", which locked every follow-up out of the
   * free layers as soon as one turn reached the model — see TurnState.tutorSpoke
   * in lib/tutor-router for the session where that turned one paid turn into
   * three.
   *
   * Set from its own effect rather than inside the local-answer effect below,
   * because that one returns early on `!last.local` — which is exactly the case
   * this flag has to cover.
   */
  const tutorSpokeRef = useRef(false);
  /**
   * What the last GRADE said, or null when the last turn was not a grade.
   *
   * ⚠️ The tutor contradicted itself in two messages without it: "10" was
   * graded correct from authored content, "בטוח?" went to the model, and the
   * model said "לא, טעות" because nothing told it the answer had already been
   * verified. See TurnState.lastVerdict in lib/tutor-router.
   */
  const lastVerdictRef = useRef<'correct' | 'wrong' | null>(null);
  /**
   * The visible conversation, for `send` to read.
   *
   * ⚠️ A REF AND NOT `msgs`. `send` is a useCallback that does not list `msgs`
   * in its dependencies, so reading the state inside it returns whatever it was
   * when the callback was last built — the same stale-closure bug that once
   * made every turn report its screen as "login".
   */
  /**
   * The topic this CONVERSATION is about, once anything has established one.
   *
   * WARNING: WITHOUT IT EVERY FOLLOW-UP IS TOPIC-LESS. The student names the
   * topic once — "על הסתברות" — and every message after it is "ולמה זה ככה",
   * "תן דוגמה", "לא הבנתי". None of those contains a topic, so `resolveTopic`
   * returns null on all of them, the grounding falls back to the generic
   * curriculum map, and the topic bank cannot be searched. The conversation
   * forgets what it is about between one message and the next.
   *
   * Set from the screen when it publishes one and from the message when it
   * names one. Never guessed: it only ever holds a topic somebody actually
   * stated, which is the whole difference between this and the cognitive
   * fallback that had to be removed (see lib/tutor-context resolveCognitive).
   *
   * Cleared with the conversation, not with the question — a student who moves
   * between exercises inside one topic is still in that topic.
   */
  const convTopicRef = useRef('');
  /** The topic whose menu was already shown — see ChainState.overviewFor. */
  const overviewForRef = useRef('');
  const msgsRef = useRef<Msg[]>([]);
  useEffect(() => {
    msgsRef.current = msgs;
    if (msgs.some((m) => m.role === 'assistant')) tutorSpokeRef.current = true;
  }, [msgs]);
  /** Was the PREVIOUS turn a complaint we answered with the stock sentence? */
  const lastComplaintRef = useRef(false);
  useEffect(() => {
    const last = msgs[msgs.length - 1];
    if (!last || last.role !== 'assistant' || !last.local) return;
    if (reportedRef.current.has(last.id)) return;
    reportedRef.current.add(last.id);

    const asked = [...msgs].reverse().find((m) => m.role === 'user');
    const focus = getTutorFocus();

    // ---- what did this reply ask the student for? ----
    //
    // The tutor is Socratic by design: almost every template ends by asking
    // something back. Recording it here is what stops the NEXT turn from being
    // graded against the wrong thing — see lib/tutor-pending.
    const pq = (focus?.question ?? null) as Record<string, unknown> | null;
    const pSteps = Array.isArray((pq?.solution as Record<string, unknown>)?.steps)
      ? (((pq!.solution as Record<string, unknown>).steps as unknown[]).filter(
          (x): x is string => typeof x === 'string',
        ))
      : [];
    pendingRef.current = expectationOf(last.text, nextStepAfter(last.text, pSteps));

    if (!asked) return;
    const q = (focus?.question ?? null) as Record<string, unknown> | null;
    const own = q ? `${String(q.question ?? '')} ${focus?.topic ?? ''}` : (focus?.topic ?? '');
    const intent = canonicalIntent(asked.text, own || undefined);

    void fetch('/api/tutor-trace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        trace: {
          screen: (typeof window === 'undefined' ? '' : window.location.pathname).split('/')[1] ?? '',
          topic: focus?.topic ?? '',
          subtopic: focus?.subTopicId ?? '',
          questionId: String(q?.id ?? ''),
          normalizedUserMessage: intent.canonical,
          intent: intent.intent ?? '',
          confidence: intent.confidence,
          // ⚠️ Which layer answered is NOT recorded yet. The flag says "some
          // local layer did", which is exactly the denominator and no more.
          // Naming the layer means carrying it on the message, and that is a
          // change at all six sites — worth doing once the denominator has
          // shown it is worth doing.
          localRouterMatched: true,
          // ⚠️ IT WAS MISSING HERE, AND THAT MADE THE WHOLE COLUMN UNREADABLE.
          //
          // The paid beacon records the flag and this one did not, so every
          // local turn stored `false` regardless. Cross-tabulated: 136 local
          // turns, 136 of them "compiler off" — a perfect correlation that
          // was an artefact of this line, not a fact about the rollout. The
          // question "is the compiler actually on for students" could not be
          // answered from the one column built to answer it.
          compilerFlagOn: tutorFlag('compiler'),
          fallbackReason: 'no_fallback',
        },
      }),
    }).catch(() => {});
  }, [msgs]);

  // Track what the page is showing.
  useEffect(() => {
    const sync = () => setFocus(getTutorFocus());
    sync();
    return subscribeTutorFocus(sync);
  }, []);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs, open]);

  // ===== a NEW question resets the conversation =====
  // The chat about the previous question must not carry into the next one: the
  // drawer opens clean, with the one-tap options showing again. Reset happens
  // only when the focus moves to a DIFFERENT question — republishing the same
  // question (e.g. after a wrong answer adds chosenIndex) keeps the thread, and
  // leaving to a question-less screen keeps it too (nothing new to talk about
  // yet). The server conversation id is deliberately kept: the transcript stays
  // one conversation per visit; only the visible thread starts fresh.
  useEffect(() => {
    const k = focus?.question?.id ?? focus?.questionText ?? '';
    if (k && lastQKeyRef.current && k !== lastQKeyRef.current) {
      genRef.current++;
      setMsgs([]);
      setError(null);
      // The visible thread starts fresh, so what the previous thread had
      // established about its subject goes with it. Keeping it would ground a
      // brand-new conversation in the last one's topic — quietly, and exactly
      // the failure `resolveCognitive` was just stripped for.
      convTopicRef.current = '';
      overviewForRef.current = '';
    }
    if (k) lastQKeyRef.current = k;
  }, [focus]);

  const nudgeKey = focus?.wrongAnswer ? `${focus.where}::${focus.wrongAnswer}` : null;
  const showNudge = !!nudgeKey && nudgeKey !== nudgeDismissed && !open;

  const prompts = useMemo(() => {
    const p = focusPrompts(focus);
    return p.length ? p : IDLE_PROMPTS;
  }, [focus]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || sending) return;
      if (text.length > MAX_LEN) {
        setError(`הודעה ארוכה מדי (מקסימום ${MAX_LEN} תווים)`);
        return;
      }

      setError(null);
      setInput('');
      // The generation this send belongs to. If the student moves to the next
      // question mid-stream, the reset bumps genRef and everything below stops
      // touching the (new) chat.
      // What the tutor asked LAST turn, read before this turn overwrites it.
      const pendingNow = pendingRef.current;
      // ⚠️ NOT cleared here. `pending` is about the LAST reply and is consumed
      // once; "the tutor has spoken" is about the whole conversation and only
      // ever becomes true. Clearing it here is what made one paid turn lock the
      // free layers for every turn after it.
      const tutorSpoke = tutorSpokeRef.current;
      // Read and CLEARED: a verdict is about the turn that produced it, so the
      // challenge has to be the very next message. Two turns later "בטוח?" is
      // about something else.
      const lastVerdictNow = lastVerdictRef.current;
      lastVerdictRef.current = null;
      pendingRef.current = null;

      const gen = genRef.current;
      const userId = `u-${Date.now()}`;
      setMsgs((m) => [...m, { id: userId, role: 'user', text }]);

      // ===== try the authored content FIRST — no API call, no quota =====
      // Most of what a student asks mid-exercise ("רמז", "למה טעיתי",
      // "מאיפה מתחילים", "תראה לי") already has a written, verified answer in
      // the question object. Paying an API call to paraphrase it costs money on
      // every turn and can only make it worse. answerLocally abstains on
      // anything ambiguous, so the real tutor still handles the novel question.
      const focusNow = getTutorFocus();
      const qKey = focusNow?.question?.id ?? focusNow?.questionText ?? '';
      if (servedRef.current.key !== qKey) {
        servedRef.current = { key: qKey, kinds: [] };
        // A new question means "ואז?" no longer refers to anything.
        lastAskRef.current = null;
      }
      // ===== every free layer, in one call =====
      //
      // ⚠️ THE CHAIN LIVES IN lib/tutor-chain.ts NOW, AND THAT IS THE POINT.
      // It used to be ~430 lines inline here, which meant /chat — the page
      // devoted to asking the tutor things — had none of it: not one import
      // from tutor-router, tutor-faq, tutor-local, off-topic or the rest. The
      // same question was free in this bubble and billed on that page.
      //
      // Copying the layers over would have started the next drift. Both
      // surfaces call this instead, so a layer added there is live on both by
      // construction, and scripts/test-tutor-chain.ts can finally exercise it
      // without mounting React.
      //
      // Everything that made it un-extractable stays here: setMsgs, the
      // spinner, the mascot's face, and the refs. The chain is handed their
      // values and hands back what changed.
      const chain = await runTutorChain({
        message: text,
        focus: focusNow,
        state: {
          lastAsk: lastAskRef.current,
          servedKinds: servedRef.current.kinds,
          pending: pendingNow,
          tutorSpoke,
          lastVerdict: lastVerdictNow,
          lastComplaint: lastComplaintRef.current,
          convTopic: convTopicRef.current,
          overviewFor: overviewForRef.current,
        },
        // The spinner rises where it always did — after the instant layers and
        // before the first awaited bank import — so an answered "אוקיי" still
        // appears without one flashing.
        onSlow: () => setSending(true),
      });

      lastAskRef.current = chain.state.lastAsk;
      servedRef.current.kinds = chain.state.servedKinds;
      lastVerdictRef.current = chain.state.lastVerdict;
      lastComplaintRef.current = chain.state.lastComplaint;
      convTopicRef.current = chain.state.convTopic;
      overviewForRef.current = chain.state.overviewFor;

      if (chain.answered) {
        // The face reacts to the same verdict the text does.
        if (chain.reaction) react(chain.reaction);
        setMsgs((m) => [
          ...m,
          { id: `a-${Date.now()}`, role: 'assistant', text: chain.text, local: true },
        ]);
        setSending(false);
        return;
      }

      const { routeKind, faqMissed } = chain;
      setSending(true);

      // Focus FIRST, student snapshot second. The server truncates `context`
      // from the end at 4000 chars (MAX_CONTEXT_LEN), and the snapshot alone
      // can reach 1800 — focus-last would silently drop the question the
      // student is asking about. The focus now carries the authored solution
      // (≤1200 chars) for the model's guidance, which is why the cap grew from
      // 2000: at 2000 the solution would have evicted the snapshot.
      const f = getTutorFocus();
      let context = renderFocusContext(f);
      try {
        const { buildStudentSnapshot } = await import('@/lib/tutor-context');
        // The topic the request is actually grounded in — the screen's when it
        // has one, otherwise the one named in the message. Passing '' here would
        // drop the cognitive block on a turn that DID resolve a topic and is
        // properly grounded in it. See resolveCognitive for why '' must never
        // mean "pick the student's most-practised topic".
        const snap = buildStudentSnapshot('math5', chain.topic);
        context = [context, snap].filter(Boolean).join('\n\n').slice(0, 4000);
      } catch {
        /* snapshot is best-effort — never block the question */
      }

      let unitLevel: 3 | 4 | 5 | undefined;
      let formNumber: string | undefined;
      try {
        unitLevel = getUnitLevel();
        formNumber = getPaper() ?? undefined;
      } catch {
        /* server defaults to 5 units / 572 */
      }

      // ===== the trace: why this turn is reaching the model =====
      //
      // Built HERE because this is the last line of the chain: everything
      // above declined, and only this scope knows which of them was even
      // reached. `intent` is classified with the question's own words so the
      // label matches what the router actually saw.
      const traceQ = (focusNow?.question ?? null) as Record<string, unknown> | null;
      const traceOwn = traceQ
        ? `${String(traceQ.question ?? '')} ${focusNow?.topic ?? ''}`
        : (focusNow?.topic ?? '');
      const traceIntent = canonicalIntent(text, traceOwn || undefined);
      const trace = {
        // ⚠️ NOT the `pathname` from usePathname — `send` is a useCallback with
        // `[sending]` as its only dependency, so every value it closes over is
        // frozen at the render where `sending` last changed. The first real
        // trace row proved it: screen read "login", because the component had
        // mounted on the login redirect and `send` never saw the navigation.
        //
        // Everything else in here is already read live (`getTutorFocus()`, the
        // refs), which is why the answer itself was about the right question
        // and only the label was wrong. This reads live too.
        screen: (typeof window === 'undefined' ? '' : window.location.pathname).split('/')[1] ?? '',
        // ⚠️ THE SAME TOPIC THE REQUEST WAS GROUNDED IN, resolved from the
        // message when the screen had none. The first version recorded only
        // `focusNow?.topic`, so a turn that DID resolve a topic and DID read
        // the right grounding still appeared in every report as "(ריק)" — the
        // fix looked like it had not deployed.
        // The topic the chain itself resolved and grounded on — not a
        // second hand-rolled copy of the same expression that can drift
        // from it.
        topic: chain.topic,
        subtopic: focusNow?.subTopicId ?? '',
        questionId: String(traceQ?.id ?? ''),
        normalizedUserMessage: traceIntent.canonical,
        intent: traceIntent.intent ?? '',
        // `matched` here means the layer produced SOMETHING, not that it
        // answered — an answered turn returned long before this line. The
        // router can match an ask whose rung the ladder then failed to fill,
        // and that distinction is what separates "we did not understand" from
        // "we understood and had nothing".
        localRouterMatched: routeKind !== 'open',
        localLadderMatched: false,
        faqMatched: false,
        crossQuestionReuseMatched: false,
        mathEngineUsed: false,
        compilerFlagOn: tutorFlag('compiler'),
        fallbackReason: decideFallbackReason({
          hasQuestion: Boolean(traceQ),
          intent: traceIntent.intent ?? '',
          confidence: traceIntent.confidence,
          groundingMissing: Boolean(traceIntent.intent) && groundingFor(traceIntent.intent!, focusNow, text) === null,
          faqSearched: faqMissed,
          faqMatched: false,
          transferCandidateRejected: false,
          multiPart: false,
          proofOrOpen: false,
          askedForPersonalExplanation: false,
          solverAttemptedAndFailed: false,
        }),
        confidence: traceIntent.confidence,
      };

      const assistantId = `a-${Date.now()}`;
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            // ⚠️ THE SCREEN FIRST, THE SENTENCE ONLY WHEN THE SCREEN IS SILENT.
            //
            // On the roadmap index nothing publishes a topic, so seven turns
            // about probability were grounded in the generic curriculum map,
            // could not reach a Topic Card, and landed in their own cold cache
            // entry instead of sharing the one the app's probability traffic
            // already warms. `resolveTopic` reads the topic out of the message
            // and returns null unless it is certain — see lib/resolve-topic.
            topic: chain.topic,
            conversationId: convIdRef.current,
            // A question was on screen, the local tutor AND its FAQ bank both
            // abstained — the server logs it as `[faq-miss]`, and that log is
            // the next authoring list. The model's answer is still billed.
            ...(faqMissed && f?.question ? { faqMiss: f.question.id } : {}),
            // ⚠️ WHY the model is being asked, recorded at the only place that
            // knows. `/api/chat` counts model calls perfectly and cannot see a
            // reason: the router, the ladder, the FAQ bank and the compiler
            // all ran HERE and all declined. Without this the server can say
            // "1,000 calls" and never "1,000 calls, 400 of them because no
            // rule recognised the phrasing" — and the second sentence is the
            // only one anyone can act on.
            //
            // Carries no user id, no conversation and no sentence the student
            // wrote; `normalizedUserMessage` is folded, capped and stripped of
            // anything shaped like contact detail. The server validates every
            // field against the enums before storing any of it.
            trace,
            // ⚠️ THE TURNS THE SERVER HAS NEVER SEEN.
            //
            // `chat_messages` stores only what reached /api/chat, and about
            // three quarters of this tutor's replies are local — so the model
            // has been reasoning with most of the conversation missing. It told
            // a student "נכון! 10 היא התשובה", was asked "בטוח?", and answered
            // "לא, טעות", because the first message was never stored.
            //
            // The server REPLACES its own history window with this one rather
            // than appending, and caps each turn, so the prompt does not grow.
            recent: msgsRef.current.slice(-4).map((m) => ({
              role: m.role,
              content: m.text.slice(0, 500),
            })),
            ...(context ? { context } : {}),
            ...(unitLevel ? { unitLevel } : {}),
            ...(formNumber ? { formNumber } : {}),
          }),
        });

        if (!res.ok) {
          let msg = '';
          try {
            msg = (await res.json())?.error ?? '';
          } catch {
            msg = '';
          }
          throw new Error(msg || (res.status === 401 ? 'צריך להתחבר כדי לשאול' : 'שגיאה זמנית'));
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('אין תשובה מהשרת');
        const decoder = new TextDecoder();
        let buf = '';
        let acc = '';
        let created = false;

        const apply = (ev: string, raw: string) => {
          if (genRef.current !== gen) return; // the chat was reset — stale stream
          let d: {
            text?: string;
            reply?: string;
            error?: string;
            conversationId?: string | null;
            remaining?: number;
          } & Partial<ResolvedSuggestion>;
          try {
            d = JSON.parse(raw);
          } catch {
            return;
          }
          if (ev === 'meta') {
            if (d.conversationId) convIdRef.current = d.conversationId;
            if (typeof d.remaining === 'number') setAiLeft(d.remaining);
          } else if (ev === 'delta') {
            acc += d.text ?? '';
            if (!created) {
              created = true;
              setMsgs((m) => [...m, { id: assistantId, role: 'assistant', text: acc }]);
            } else {
              setMsgs((m) => m.map((x) => (x.id === assistantId ? { ...x, text: acc } : x)));
            }
          } else if (ev === 'action' && d.href && d.label) {
            const action = d as ResolvedSuggestion;
            setMsgs((m) => m.map((x) => (x.id === assistantId ? { ...x, action } : x)));
          } else if (ev === 'error') {
            setError(d.error || 'שגיאה. נסה שוב.');
          } else if (ev === 'done' && typeof d.reply === 'string' && d.reply.trim()) {
            acc = d.reply;
            setMsgs((m) => m.map((x) => (x.id === assistantId ? { ...x, text: acc } : x)));
          }
        };

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const chunks = buf.split('\n\n');
          buf = chunks.pop() ?? '';
          for (const chunk of chunks) {
            let ev = 'message';
            let data = '';
            for (const line of chunk.split('\n')) {
              if (line.startsWith('event:')) ev = line.slice(6).trim();
              else if (line.startsWith('data:')) data += line.slice(5).trim();
            }
            if (data) apply(ev, data);
          }
        }
      } catch (e) {
        if (genRef.current === gen) setError(e instanceof Error ? e.message : 'שגיאה. נסה שוב.');
      } finally {
        setSending(false);
      }
    },
    // `react` is a useCallback with an empty dep list, so it is stable and this
    // does not widen when send() re-creates. Listed anyway — an omitted stable
    // dep is a trap for whoever gives it dependencies later.
    [sending, react],
  );

  function openWithNudge() {
    if (nudgeKey) setNudgeDismissed(nudgeKey);
    // Clear a stale error here rather than in an effect on `pathname`: the
    // error is per-send, so the only moment it can mislead is the next time
    // the drawer is opened — and an event handler is the right place for it.
    setError(null);
    // Rebuilt on every open so the plan reflects work finished since the last
    // one. Cheap enough to redo: pure arithmetic over the local event log, no
    // network and no model.
    // Opens immediately; the greeting fills in a beat later. The drawer has a
    // null-greeting state already, so there is nothing to wait for.
    void import('@/lib/tutor-greeting')
      .then(({ buildTutorGreeting }) => setGreeting(buildTutorGreeting('math5', '')))
      .catch(() => {});
    setOpen(true);
  }

  // After the hooks, never before — bailing early would change the hook order
  // between routes and crash on navigation.
  if (hidden) return null;

  /**
   * The mascot's face IS the status indicator — it thinks while the request is
   * in flight and talks while the answer streams in, which is one spinner the
   * student does not have to decode. The assistant message only exists once
   * the first chunk lands (see the SSE loop), so its presence is the honest
   * boundary between "waiting" and "answering".
   *
   * Order matters. A fresh verdict outranks everything, then the live request,
   * then the standing state of the screen. `focus.wrongAnswer` is filled ONLY
   * after a wrong answer (lib/tutor-presence), so it is a real signal and not
   * a guess — the face stays concerned for as long as the student is still
   * sitting on the question they missed, which is exactly the window where
   * "someone noticed" is worth something.
   */
  const mascotMood: MascotExpression = reaction
    ? reaction.kind
    : sending
      ? msgs[msgs.length - 1]?.role === 'assistant'
        ? 'talking'
        : 'thinking'
      : focus?.wrongAnswer
        ? 'oops'
        : focus?.questionText
          ? 'curious'
          : 'idle';

  return (
    <>
      {/* ===== the bubble ===== */}
      {/* bottom-left, and lifted above the mobile BottomNav (z-55, bottom-0) so
          it never sits on top of the navigation. The profile avatar owns
          top-left; these two never meet. */}
      <button
        onClick={openWithNudge}
        aria-label="המורה הפרטי"
        // Deep ink, NOT violet. The mascot wears a violet headset; a violet pod
        // behind it stacks the same hue twice and the silhouette dissolves —
        // caught in the raster, it read as one purple blob with a face. Ink is
        // also the brand's own "dark object that glows" move.
        className="fixed left-4 bottom-20 md:bottom-6 z-[58] w-14 h-14 rounded-full bg-gradient-to-br from-[#3B3480] via-[#241E7A] to-[#12102E] shadow-xl shadow-violet-900/40 ring-2 ring-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        {/* The mascot is deliberately LARGER than its pod and breaks out of
            it — antenna over the top rim, ear pods past the sides. Something
            that fits neatly inside the circle is an icon again, and an icon
            is exactly what this stopped being. The pod stays because the
            56px circle is the tap target and the ring is what separates a
            pearl-white character from a pale page. */}
        <TutorMascot
          variant="bust"
          // The launcher is where a reaction actually earns its keep: the panel
          // is shut, so this closed bubble in the corner is the only thing that
          // can notice the student just got it wrong.
          expression={showNudge ? 'oops' : 'idle'}
          className="absolute w-16 h-16 pointer-events-none"
        />
        {/* Bottom corner, not top: the antenna bulb owns the top-right and an
            amber dot on top of a glowing cyan one reads as a rendering bug. */}
        {showNudge && (
          <>
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-400 ring-2 ring-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-amber-400 animate-ping opacity-75" />
          </>
        )}
      </button>

      {/* A single line of why, so the dot is never a mystery. Shown only while
          the student is still on the question they got wrong. */}
      <AnimatePresence>
        {showNudge && (
          <motion.button
            // 🔴 The key is load-bearing, not cosmetic. Without it
            // AnimatePresence cannot track this child across the flip and the
            // exiting node is STRANDED IN THE DOM at opacity 0 — an invisible
            // `fixed` button parked over the page, swallowing every click that
            // lands on it. Verified in the browser: it never unmounted.
            // SubTopicLadder documents the same trap for a different reason.
            key="tutor-nudge"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            onClick={openWithNudge}
            className="fixed left-20 bottom-[5.5rem] md:bottom-8 z-[58] max-w-[220px] text-right bg-white border border-violet-500/30 shadow-lg shadow-violet-500/10 rounded-2xl rounded-bl-md px-3 py-2 text-xs text-slate-700"
          >
            ראיתי מה קרה כאן. רוצה שנבין את זה יחד?
          </motion.button>
        )}
      </AnimatePresence>

      {/* ===== the drawer ===== */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              // Transparent on purpose. A tinted/blurred scrim is the standard
              // modal move, but here the thing behind the drawer is THE QUESTION
              // the tutor is talking about — washing it out means the student
              // reads "בחרת ½(u+v)" with no way to look at the options. The
              // drawer's own border and shadow already separate it. Click-outside
              // still closes.
              className="fixed inset-0 z-[72]"
            />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 400, damping: 34 }}
              className="fixed z-[73] left-3 right-3 bottom-3 md:right-auto md:left-5 md:bottom-5 md:w-[400px] h-[70vh] md:h-[600px] max-h-[calc(100vh-2rem)] bg-[var(--background)] border border-slate-900/10 rounded-3xl shadow-2xl shadow-slate-900/25 flex flex-col overflow-hidden"
            >
              {/* header */}
              <div className="flex items-center gap-2.5 justify-between px-4 py-3 border-b border-slate-900/[0.08] flex-shrink-0">
                {/* Same character as the launcher, so opening the panel feels
                    like the thing you tapped came with you. */}
                <span className="relative flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[#3B3480] via-[#241E7A] to-[#12102E] ring-1 ring-white/80 shadow-md shadow-violet-900/30 flex items-center justify-center">
                  {/* compact: at 40px the mic boom stops being a detail and
                      becomes a smudge on the cheek. */}
                  <TutorMascot variant="bust" expression={mascotMood} compact className="absolute w-10 h-10" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-slate-900">המורה הפרטי שלך</div>
                  {/* Proof it can see the screen. Without this line the student
                      has no reason to believe it and re-types the question. */}
                  {focus?.where && (
                    <div className="text-[11px] text-slate-500 truncate">רואה: {focus.where}</div>
                  )}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="סגור"
                  className="w-8 h-8 rounded-lg hover:bg-slate-900/5 flex items-center justify-center text-slate-500 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {msgs.length === 0 && !focus?.questionText && greeting?.today && (
                  <TodayPlanCard today={greeting.today} onNavigate={() => setOpen(false)} />
                )}

                {msgs.length === 0 && (
                  <div className="pt-2">
                    {/* The one spot with room for the whole character. The
                        panel is RTL, so the first flex child lands on the
                        right and the line reads as coming out of its mouth. */}
                    <div className="flex items-start gap-2.5 mb-3">
                      <span className="relative flex-shrink-0 w-[4.5rem] h-[4.5rem] -mt-1">
                        {/* A pearl-white mascot dissolves into a near-white
                            panel; this pool of violet is its ground. */}
                        <span
                          className="absolute inset-x-2 bottom-2 h-8 rounded-full bg-violet-500/15 blur-md"
                          aria-hidden
                        />
                        <TutorMascot variant="full" expression={mascotMood} className="relative w-full h-full" />
                      </span>
                      <p className="flex-1 text-sm text-slate-700 leading-relaxed bg-slate-900/[0.035] border border-slate-900/[0.07] rounded-2xl rounded-tr-md px-3.5 py-2.5">
                        {focus?.wrongAnswer
                          ? 'בוא נבין מה קרה בשאלה הזאת — בלי שאתן לך את התשובה.'
                          : focus?.questionText
                            ? 'אני רואה את השאלה שלפניך. במה נתחיל?'
                            : 'שאל אותי כל דבר. אני זוכר על מה עבדת.'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {prompts.map((p) => (
                        <button
                          key={p}
                          onClick={() => send(p)}
                          className="w-full text-right bg-slate-900/[0.03] hover:bg-violet-500/10 border border-slate-900/10 hover:border-violet-500/40 rounded-xl px-3 py-2.5 text-sm text-slate-800 transition-all flex items-center gap-2"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-violet-600 flex-shrink-0" />
                          <span className="flex-1">{p}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {msgs.map((m) =>
                  m.role === 'user' ? (
                    <div key={m.id} className="flex justify-start">
                      <div
                        className="max-w-[85%] bg-violet-600 text-white px-3.5 py-2 rounded-2xl rounded-tl-md text-sm"
                        style={{ unicodeBidi: 'plaintext', textAlign: 'start', whiteSpace: 'pre-wrap' }}
                      >
                        {m.text}
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[90%]">
                        <div
                          className="chat-md bg-slate-900/[0.03] border border-slate-900/10 text-slate-800 px-3.5 py-2 rounded-2xl rounded-tr-md text-sm"
                          style={{ unicodeBidi: 'plaintext', textAlign: 'start' }}
                        >
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {m.text}
                          </ReactMarkdown>
                        </div>
                        {m.local && (
                          <div className="mt-1 text-[10px] text-slate-500 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>מהחומר המאומת — נכתב ונבדק, לא נוצר עכשיו</span>
                          </div>
                        )}
                        {m.action && (
                          <Link
                            href={m.action.href}
                            onClick={() => setOpen(false)}
                            className="group mt-2 flex items-center gap-2 bg-violet-500/[0.07] hover:bg-violet-500/[0.12] border border-violet-500/25 rounded-xl px-3 py-2 transition-all"
                          >
                            <span className="flex-1 min-w-0">
                              <span className="block text-xs font-bold text-slate-800">
                                {m.action.label}
                              </span>
                              <span className="block text-[11px] text-slate-600 leading-snug">
                                {m.action.reason}
                              </span>
                            </span>
                            <ArrowLeft className="w-3.5 h-3.5 text-violet-700 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ),
                )}

                {sending && msgs[msgs.length - 1]?.role !== 'assistant' && (
                  <div className="flex justify-end">
                    <div className="bg-slate-900/[0.03] border border-slate-900/10 px-3.5 py-2 rounded-2xl rounded-tr-md inline-flex items-center gap-2 text-sm text-slate-600">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-600" />
                      חושב…
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-xs text-red-600 bg-red-500/5 border border-red-500/20 rounded-xl px-3 py-2">
                    {error}
                  </div>
                )}

                {/*
                  ⚠️ THE INPUT IS NEVER DISABLED BY THIS, AND THAT IS THE WHOLE
                  DESIGN. Running out of AI turns is not running out of tutor:
                  hints, the next step, formulas, answer checking, "why was I
                  wrong", the written solution, Topic Cards and the FAQ bank all
                  keep working and cost nothing. Greying out the box would take
                  the free help away along with the paid kind, which is both
                  wrong and the fastest way to make a student close the app.
                */}
                {aiLeft !== null && aiLeft > 0 && (
                  <div className="text-[11px] text-slate-400 text-center">
                    נותרו לך {aiLeft} מתוך {AI_DAILY_LIMIT} שאלות AI היום
                  </div>
                )}
                {aiLeft === 0 && (
                  <div className="text-xs text-amber-700 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2 leading-relaxed">
                    נגמרו השאלות החופשיות למורה AI להיום.
                    <br />
                    עדיין אפשר להשתמש ברמזים, פתרונות, נוסחאות ובדיקת תשובות ללא הגבלה.
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* composer */}
              <div className="p-3 border-t border-slate-900/[0.08] flex-shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void send(input);
                  }}
                  className="flex items-end gap-2"
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value.slice(0, MAX_LEN))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void send(input);
                      }
                    }}
                    rows={1}
                    placeholder="שאל אותי…"
                    className="flex-1 resize-none bg-slate-900/[0.03] border border-slate-900/10 focus:border-violet-500/50 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none max-h-28"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    aria-label="שלח"
                    className="w-10 h-10 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white flex items-center justify-center flex-shrink-0 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
