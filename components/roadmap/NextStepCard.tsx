'use client';

/**
 * NextStepCard — ONE answer to "what should I do now?".
 *
 * lib/cognition/next-step.ts opens by naming the problem this solves: the app
 * had three answers to that question — where you stopped (roadmap-resume),
 * what is due (review), where you are weak (weakest sub-topic) — and rendered
 * each as its own card, "which pushes the arbitration onto a 17-year-old at
 * 11pm". The arbiter that scores all three on one scale has existed and been
 * unit-tested since; it just never reached a screen. This is that screen.
 *
 * It renders only when the engine has something real to say. `kind: 'start'`
 * is the engine's own word for "not enough evidence", and on that the caller
 * keeps the plain resume + review cards — the student must never see LESS than
 * before because the diagnosis was thin. Same conservative bias as
 * MIN_CONFIDENCE in the tracer: "we have not measured you" must never be
 * rendered as "you are weak".
 *
 * Zero API cost — a pure function over localStorage.
 */

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Compass } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import type { CognitiveState } from '@/lib/cognition';

/** Hebrew eyebrow per step kind — says WHY this is the recommendation, in the
 *  two words a student reads before deciding whether to trust it. */
const EYEBROW: Record<string, string> = {
  'prereq-repair': 'לתקן קודם — לפני שממשיכים',
  'misconception-drill': 'יש כאן משהו שחוזר על עצמו',
  'review-due': 'הגיע הזמן לחזור על זה',
  'continue-ladder': 'הצעד הבא שלך',
  consolidate: 'לחזק את מה שכבר עובד',
  start: 'הצעד הבא שלך',
};

export function NextStepCard({ state }: { state: CognitiveState }) {
  const { nextStep, alternates, insight } = state;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-2"
    >
      {/* violet-600 and cyan-700, matching the resume card this replaces:
          the labels here are white at 10-14px, and white on violet-500 is
          4.23:1 — under the 4.5:1 AA floor for small text. 600 gives 6.3:1. */}
      <Link
        href={nextStep.href}
        className="group flex items-center gap-3 rounded-3xl p-4 bg-gradient-to-l from-cyan-700 to-violet-600 shadow-lg shadow-violet-500/30 hover:from-cyan-700 hover:to-violet-500 transition-colors"
      >
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
          <Compass className="w-6 h-6 text-white" />
        </div>
        {/* chat-md on an INNER div, never on the flex container — every
            .chat-md rule is a descendant combinator, and putting it on the
            row turns each word and formula into its own flex item. */}
        <div className="flex-1 min-w-0 text-white">
          <div className="text-[10px] font-black tracking-widest uppercase text-white/70">
            {EYEBROW[nextStep.kind] ?? 'הצעד הבא שלך'}
          </div>
          <div className="chat-md text-sm font-black leading-tight mt-0.5">
            <MathText inline>{nextStep.title}</MathText>
          </div>
          <div className="chat-md text-[11px] text-white/80 mt-0.5">
            <MathText inline>{nextStep.reason}</MathText>
          </div>
        </div>
        <ArrowLeft className="w-5 h-5 text-white rotate-180 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
      </Link>

      {/* The runners-up, as chips rather than rival cards. The whole point of
          the arbiter is that there is one recommendation; these exist so a
          student who knows better is not trapped by it. */}
      {alternates.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {alternates.map((alt) => (
            <Link
              key={`${alt.kind}:${alt.href}`}
              href={alt.href}
              className="inline-flex items-center max-w-full rounded-full px-3 py-1.5 bg-slate-900/[0.04] border border-slate-900/10 hover:bg-slate-900/[0.07] transition-colors"
            >
              <span className="chat-md text-[11px] font-bold text-slate-700 truncate">
                <MathText inline>{alt.title}</MathText>
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* One sentence, and only when the engine judged the evidence strong
          enough to claim it (`insight` is null otherwise). */}
      {insight && (
        <div className="chat-md text-[11px] text-slate-500 px-1 leading-snug">
          <MathText inline>{insight}</MathText>
        </div>
      )}
    </motion.div>
  );
}
