'use client';

// MicroDrill — the "micro-loop" inline exercise inside a learn-level step:
// idea → worked example → NOW YOU TRY. One short question answered on the
// spot, with instant feedback + the full solution. Formative only — it is
// NOT scored into the ladder stars and not logged as a measurement.

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, CheckCircle, XCircle, KeyRound } from 'lucide-react';
import { MathText } from '@/components/practice/MathText';
import { celebrateCorrect } from '@/lib/confetti';
import type { PracticeQuestion } from '@/content/lessons/types';

const LETTERS = ['א', 'ב', 'ג', 'ד'];

export function MicroDrill({ drill }: { drill: PracticeQuestion }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const answered = selected !== null || revealed;

  function pick(i: number) {
    if (answered) return;
    setSelected(i);
    if (i === drill.correct) celebrateCorrect();
  }

  const correct = selected !== null && selected === drill.correct;

  return (
    <div className="mt-3 rounded-2xl border border-violet-500/30 bg-violet-500/[0.05] p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg bg-violet-500/20 border border-violet-400/40 flex items-center justify-center flex-shrink-0">
          <Pencil className="w-3.5 h-3.5 text-violet-700" />
        </div>
        <span className="text-[10px] font-black tracking-widest text-violet-700 uppercase">
          עכשיו אתה — תרגיל קצר
        </span>
      </div>

      <div className="chat-md text-sm text-slate-900 leading-relaxed mb-2">
        <MathText>{drill.question}</MathText>
      </div>

      {/* MCQ micro-drill */}
      {drill.kind === 'mcq' && drill.answers && (
        <div className="space-y-1.5">
          {drill.answers.map((ans, i) => {
            const isCorrect = i === drill.correct;
            let cls = 'bg-white/70 hover:bg-white border-slate-900/10 text-slate-900';
            if (answered && isCorrect) cls = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-900';
            else if (answered && i === selected) cls = 'bg-rose-500/15 border-rose-500/50 text-rose-800';
            else if (answered) cls = 'bg-white/40 border-slate-900/[0.06] text-slate-500';
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={answered}
                className={`w-full text-right px-3 py-2 rounded-xl border transition-colors chat-md text-sm ${cls}`}
              >
                <span className="font-bold opacity-60 ml-2">{LETTERS[i]}.</span>
                <MathText inline>{ans}</MathText>
              </button>
            );
          })}
        </div>
      )}

      {/* Open micro-drill — solve on paper, reveal to compare */}
      {drill.kind === 'open' && !revealed && (
        <button
          onClick={() => setRevealed(true)}
          className="w-full inline-flex items-center justify-center gap-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/40 px-3 py-2 rounded-xl font-bold text-violet-800 text-sm transition-colors"
        >
          <KeyRound className="w-4 h-4" />
          <span>פתרתי — הצג פתרון להשוואה</span>
        </button>
      )}

      {/* Feedback + solution */}
      <AnimatePresence initial={false}>
        {answered && (
          <motion.div
            key="sol"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            {selected !== null && (
              <div
                className={`mt-2 flex items-center gap-1.5 text-sm font-bold ${
                  correct ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {correct ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>{correct ? 'בדיוק! ממשיכים לרעיון הבא.' : 'לא נורא — ראה איך פותרים:'}</span>
              </div>
            )}
            <div className="mt-2 bg-white/80 border border-slate-900/[0.08] rounded-xl p-3 space-y-1.5">
              {drill.solution.steps.map((s, i) => (
                <div key={i} className="flex gap-2 text-sm text-slate-800 chat-md">
                  <span className="font-black text-violet-600 flex-shrink-0">{i + 1}.</span>
                  <MathText>{s}</MathText>
                </div>
              ))}
              <div className="pt-1 text-sm font-bold text-emerald-800 chat-md">
                <MathText inline>{drill.solution.finalAnswer}</MathText>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
