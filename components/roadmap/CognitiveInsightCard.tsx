'use client';

// CognitiveInsightCard — the one thing the diagnostic layer says out loud.
//
// Renders at most: one Hebrew sentence naming what is actually broken, the
// live misconceptions behind it, and — only when no other card on the page
// already offers it — a button to go fix it. Everything comes from
// lib/cognition, which is pure and free (no API call, ever).
//
// TWO RULES THIS COMPONENT EXISTS TO ENFORCE
//
// 1. Silence is a valid render. `buildInsight` returns null when the evidence
//    is too thin, and this card returns null with it. A panel that always has
//    something profound to say about a student who answered four questions is
//    a horoscope, and students can tell.
//
// 2. It must not add a competing call-to-action. /roadmap already owns two
//    buttons — the daily review and "continue where you left off" — and the
//    arbiter in next-step.ts can legitimately pick either of them. When it
//    does, this card shows the REASON and stays out of the way; it only draws
//    a button for the two kinds nothing else on the page offers (repairing a
//    broken prerequisite, or drilling a live misconception).

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Target } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { getCognitiveState, hasCognitionMap, type CognitiveState } from '@/lib/cognition';

/** Kinds that duplicate a card already rendered on /roadmap. */
const HANDLED_ELSEWHERE = new Set(['review-due', 'continue-ladder', 'start']);

export function CognitiveInsightCard({
  subject,
  topics,
  ready,
  tick = 0,
}: {
  subject: string;
  /** Candidate topics, usually the roadmap's. Only mapped ones are considered. */
  topics: string[];
  /** localStorage has been read (the page is past its mount effect). */
  ready: boolean;
  /** Bump to recompute after progress changes. */
  tick?: number;
}) {
  const state: CognitiveState | null = useMemo(() => {
    if (!ready) return null;
    // Whichever mapped topic the student has actually been working in. Today
    // exactly one catalog exists, but picking by evidence means adding the
    // next one needs no change here.
    let best: CognitiveState | null = null;
    for (const topic of topics) {
      if (!hasCognitionMap(subject, topic)) continue;
      const s = getCognitiveState(subject, topic);
      if (s && (!best || s.totalObservations > best.totalObservations)) best = s;
    }
    return best;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, subject, topics.join('|'), tick]);

  if (!state) return null;

  const live = state.misconceptions
    .filter((m) => m.status === 'active' || m.status === 'suspected')
    .slice(0, 3);

  // Nothing worth a card: no sentence and no live misconception.
  if (!state.insight && live.length === 0) return null;

  const showCta = !HANDLED_ELSEWHERE.has(state.nextStep.kind);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-3xl p-5 space-y-3.5 bg-gradient-to-br from-indigo-600/[0.07] to-violet-600/[0.07] border border-indigo-500/25"
    >
      {/* The topic is part of the heading, not decoration: /roadmap lists ten
          topics, and a naked "here is what's broken" over a diagnosis scoped to
          one of them is ambiguous at best. */}
      <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-indigo-700 uppercase">
        <Target className="w-3 h-3 flex-shrink-0" />
        <span>מה באמת נשבר</span>
        <span className="text-slate-400 font-bold normal-case tracking-normal truncate">
          · {state.topic}
        </span>
      </div>

      {/* The sentence. `chat-md` sits on this div, never on a flex parent —
          every .chat-md rule is a descendant combinator, and a flex ancestor
          would turn each formula into its own flex item. */}
      {state.insight && (
        <div className="chat-md math-content text-[15px] leading-relaxed font-medium text-slate-900">
          <MathText>{state.insight}</MathText>
        </div>
      )}

      {live.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            הדפוסים שחוזרים אצלך
          </div>
          {live.map((m) => (
            <div
              key={m.id}
              className="flex items-start gap-2 rounded-xl bg-white/70 border border-slate-900/[0.07] px-3 py-2"
            >
              <span
                className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  m.status === 'active' ? 'bg-rose-500' : 'bg-amber-400'
                }`}
              />
              <div className="chat-md math-content flex-1 min-w-0 text-[13px] text-slate-800 leading-snug">
                <MathText inline>{m.title}</MathText>
              </div>
              <span className="text-[11px] font-bold text-slate-500 flex-shrink-0 tabular-nums">
                {m.hits}/{m.opportunities}
              </span>
            </div>
          ))}
        </div>
      )}

      {showCta && (
        <Link
          href={state.nextStep.href}
          className="group flex items-center gap-3 rounded-2xl px-4 py-3 bg-gradient-to-l from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 transition-colors"
        >
          <div className="flex-1 min-w-0 text-white">
            {/* NOT "הצעד הבא שלך" — the resume card below already carries that
                exact label, and two cards claiming to be the next step read as
                a bug. This one only ever appears for a repair the resume card
                cannot know about, so it is framed as coming FIRST. */}
            <div className="text-[10px] font-black tracking-widest uppercase text-white/70">
              לתקן קודם — לפני שממשיכים
            </div>
            <div className="chat-md math-content text-sm font-black leading-tight mt-0.5">
              <MathText inline>{state.nextStep.title}</MathText>
            </div>
          </div>
          <ArrowLeft className="w-5 h-5 text-white rotate-180 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
        </Link>
      )}

      {/* Auditability: the claim above is worth exactly as much as the evidence
          under it, so the evidence is on screen. */}
      <div className="text-[10px] text-slate-400">
        מבוסס על {state.totalObservations} תשובות שלך בנושא זה.
      </div>
    </motion.div>
  );
}
