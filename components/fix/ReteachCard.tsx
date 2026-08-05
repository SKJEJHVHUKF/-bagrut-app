'use client';

// ReteachCard — what the app says after the SECOND miss in a repair session.
//
// This is the screen that makes the feature a repair rather than a quiz: two
// misses means the explanation attached to the questions is not landing, so the
// session stops asking and teaches.
//
// It is built entirely from the question the student JUST FAILED — never from
// the question that comes next. That is not a style choice: the relief question
// is served immediately after this card, and re-teaching from it would hand over
// its own solution. Every field here is authored content the student has already
// been shown once, re-framed as "here is the idea, in order".
//
// Static, $0. No API call anywhere in the repair loop.

import { motion } from 'framer-motion';
import { Lightbulb, ArrowLeft, BookOpen } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { buttonTap } from '@/lib/animations';
import type { PracticeQuestion } from '@/content/lessons/types';

export function ReteachCard({
  failedQuestion,
  misconceptionInsight,
  keyPoints,
  onContinue,
}: {
  /** The question the student just got wrong. Null right after a reload where
   *  the step no longer resolves — the card then leans on the other fields. */
  failedQuestion: PracticeQuestion | null;
  /** The catalog sentence, when the target is a named misconception. */
  misconceptionInsight: string | null;
  /** The sub-topic's "must remember" bullets. */
  keyPoints: string[];
  onContinue: () => void;
}) {
  // For a named misconception the catalog sentence is the sharper statement of
  // what broke; otherwise the question's own "why it works" is the best we have.
  const idea = misconceptionInsight ?? failedQuestion?.solution.explanation ?? null;
  const firstMove = failedQuestion?.solution.steps[0] ?? null;
  const points = keyPoints.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-3"
    >
      <div className="surface-premium rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-amber-700 uppercase">
          <Lightbulb className="w-3.5 h-3.5" />
          <span>רגע — בוא נעצור ונבין</span>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">
          פספסת פעמיים, וזה סימן שהחסר הוא ברעיון ולא בחישוב. לפני שאתה מנסה שוב — הנה
          הדבר עצמו, בשורות ספורות.
        </p>

        {idea && (
          <div className="bg-sky-500/[0.06] border border-sky-500/25 rounded-2xl px-4 py-3">
            <div className="text-[10px] font-black tracking-widest text-sky-700 uppercase mb-1">
              הרעיון
            </div>
            <div className="text-sm text-slate-800 leading-relaxed chat-md math-content">
              <MathText>{idea}</MathText>
            </div>
          </div>
        )}

        {firstMove && (
          <div className="bg-violet-500/[0.06] border border-violet-500/25 rounded-2xl px-4 py-3">
            <div className="text-[10px] font-black tracking-widest text-violet-700 uppercase mb-1">
              הצעד הראשון בשאלה כזאת
            </div>
            <div className="text-sm text-slate-800 leading-relaxed chat-md math-content">
              <MathText>{firstMove}</MathText>
            </div>
          </div>
        )}

        {points.length > 0 && (
          <div className="bg-slate-900/[0.03] border border-slate-900/10 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-slate-600 uppercase mb-2">
              <BookOpen className="w-3 h-3" />
              <span>לזכור</span>
            </div>
            <ul className="space-y-1.5">
              {points.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-violet-600 font-black flex-shrink-0">•</span>
                  <div className="flex-1 min-w-0 text-sm text-slate-800 leading-relaxed chat-md math-content">
                    <MathText>{p}</MathText>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <motion.button
        {...buttonTap}
        onClick={onContinue}
        className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 px-4 py-3.5 rounded-2xl font-black text-white text-sm transition-colors"
      >
        {/* NOT "give me an easier question": the relief step is the easiest
            question STILL REMAINING, and a student who missed on both of the
            path's easy rungs will be handed a mid one. Verified in the browser —
            the earlier copy promised something the engine cannot always give. */}
        <span>הבנתי — בוא ננסה שוב</span>
        <ArrowLeft className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}
