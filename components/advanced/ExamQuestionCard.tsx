'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Lightbulb,
  KeyRound,
  CheckCircle,
  Clock,
  Medal,
  MinusCircle,
  LifeBuoy,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import type { ExamQuestion, ExamPart } from '@/content/advanced-courses/types';
import { MathText } from '@/components/practice/MathText';
import { DiagramRenderer } from '@/components/practice/DiagramRenderer';
import { buttonTap } from '@/lib/animations';
import { sparkle } from '@/lib/confetti';

/**
 * ExamQuestionCard — a full bagrut-level practice question (§5): shared
 * context, target time + total points header, pattern chips, and per-part
 * cards with gradual hints, hidden solution, and the scoring rubric
 * (points + deduction lines) revealed with the solution.
 */
export function ExamQuestionCard({ q, index }: { q: ExamQuestion; index: number }) {
  return (
    <div className="bg-white/[0.03] border border-fuchsia-500/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-l from-fuchsia-600/15 to-purple-600/10 border-b border-white/10 px-4 py-3 space-y-1.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <FileText className="w-4 h-4 text-fuchsia-200 flex-shrink-0" />
          <span className="text-[11px] font-black tracking-widest text-fuchsia-200 uppercase flex-1">
            שאלה {index + 1}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/10 border border-white/15 text-slate-100 px-2 py-0.5 rounded-full">
            <Medal className="w-3 h-3 text-amber-300" />
            {q.totalPoints} נק׳
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/10 border border-white/15 text-slate-100 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-sky-300" />
            יעד: {q.targetMinutes} דק׳
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {q.patternIds.map((pid) => (
            <a
              key={pid}
              href={`#pattern-${pid}`}
              className="text-[10px] font-bold bg-fuchsia-500/15 border border-fuchsia-500/30 text-fuchsia-200/90 px-2 py-0.5 rounded-full hover:bg-fuchsia-500/25 transition-colors"
            >
              🗺️ תבנית
            </a>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {q.context && (
          <div className="bg-slate-950/40 border border-white/10 rounded-xl px-4 py-3 chat-md text-sm text-white leading-relaxed">
            <MathText>{q.context}</MathText>
          </div>
        )}

        {q.diagrams && q.diagrams.length > 0 && <DiagramRenderer diagrams={q.diagrams} />}

        <div className="space-y-2.5">
          {q.parts.map((part) => (
            <ExamPartCard key={part.label} part={part} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ExamPartCard({ part }: { part: ExamPart }) {
  const [hintsShown, setHintsShown] = useState(0);
  const [solutionShown, setSolutionShown] = useState(false);
  const [answer, setAnswer] = useState('');

  const struggling = hintsShown > 0 || solutionShown;

  function revealHint() {
    setHintsShown((n) => {
      const next = Math.min(n + 1, part.hints.length);
      sparkle();
      toast.info(`סעיף ${part.label} · רמז ${next}/${part.hints.length}`, { duration: 2000 });
      return next;
    });
  }

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-3.5 space-y-3">
      {/* Label + prompt + points */}
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-500 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-fuchsia-500/30">
          {part.label}
        </div>
        <div className="flex-1 chat-md text-sm sm:text-base text-white leading-relaxed pt-0.5">
          <MathText>{part.prompt}</MathText>
        </div>
        <span className="flex-shrink-0 text-[11px] font-black text-amber-200 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg">
          {part.points} נק׳
        </span>
      </div>

      {part.diagrams && part.diagrams.length > 0 && <DiagramRenderer diagrams={part.diagrams} />}

      {/* Scratch box */}
      {!solutionShown && (
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="התשובה שלך…"
          rows={2}
          dir="auto"
          className="w-full bg-slate-950/50 border border-white/10 focus:border-fuchsia-500/60 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition-colors resize-y"
        />
      )}

      {/* Hints one-by-one */}
      <AnimatePresence initial={false}>
        {hintsShown > 0 && (
          <motion.div key="hints" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
            {part.hints.slice(0, hintsShown).map((h, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="bg-amber-500/5 border border-amber-500/30 rounded-lg px-3 py-2 chat-md"
              >
                <div className="text-[10px] font-black tracking-widest text-amber-300 mb-1 uppercase flex items-center gap-1.5">
                  <Lightbulb className="w-3 h-3" />
                  <span>רמז {i + 1}</span>
                </div>
                <div className="text-sm text-amber-50/95">
                  <MathText>{h}</MathText>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        {hintsShown < part.hints.length && !solutionShown && (
          <motion.button
            {...buttonTap}
            onClick={revealHint}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 px-4 py-2 rounded-lg font-bold text-amber-100 text-sm transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            <span>{hintsShown === 0 ? 'רמז' : `רמז נוסף (${hintsShown + 1}/${part.hints.length})`}</span>
          </motion.button>
        )}
        {!solutionShown && (
          <motion.button
            {...buttonTap}
            onClick={() => setSolutionShown(true)}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-l from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 px-4 py-2 rounded-lg font-bold text-white text-sm shadow-lg shadow-fuchsia-500/30 transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            <span>הצג פתרון ומחוון</span>
          </motion.button>
        )}
      </div>

      {/* Solution + rubric */}
      <AnimatePresence initial={false}>
        {solutionShown && (
          <motion.div
            key="solution"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
            className="space-y-2.5"
          >
            <div className="bg-gradient-to-br from-fuchsia-600/10 to-purple-600/10 border border-fuchsia-500/30 rounded-xl p-3.5">
              <div className="text-[10px] font-black tracking-widest text-fuchsia-300 mb-2 uppercase flex items-center gap-1.5">
                <KeyRound className="w-3 h-3" />
                <span>פתרון סעיף {part.label}</span>
              </div>
              <ol className="space-y-2.5">
                {part.solution.steps.map((step, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 + i * 0.06, ease: 'easeOut' }}
                    className="flex gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-fuchsia-500/25 border border-fuchsia-400/40 flex items-center justify-center text-[11px] font-black text-fuchsia-100">
                      {i + 1}
                    </div>
                    <div className="flex-1 chat-md text-sm text-slate-100 pt-0.5">
                      <MathText>{step}</MathText>
                    </div>
                  </motion.li>
                ))}
              </ol>
              <div className="mt-3 bg-emerald-500/10 border border-emerald-500/40 rounded-lg px-3 py-2.5">
                <div className="text-[10px] font-black tracking-widest text-emerald-300 mb-1 uppercase flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3" />
                  <span>תשובה סופית</span>
                </div>
                <div className="text-sm font-bold text-emerald-50 chat-md">
                  <MathText inline>{part.solution.finalAnswer}</MathText>
                </div>
              </div>
            </div>

            {/* Rubric — on what points are lost */}
            <div className="bg-rose-500/5 border border-rose-500/25 rounded-xl px-3 py-2.5">
              <div className="text-[10px] font-black tracking-widest text-rose-300 uppercase flex items-center gap-1.5 mb-1.5">
                <MinusCircle className="w-3 h-3" />
                <span>מחוון — על מה מורידים נקודות ({part.points} נק׳ לסעיף)</span>
              </div>
              <ul className="space-y-1">
                {part.deductions.map((d, i) => (
                  <li key={i} className="flex gap-2 text-xs text-rose-50/90 leading-relaxed">
                    <span className="text-rose-300 flex-shrink-0 mt-0.5">−</span>
                    <div className="chat-md flex-1">
                      <MathText inline>{d}</MathText>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stuck? → pattern/technique */}
      {struggling && part.reviewRef && (
        <a
          href={
            part.reviewRef.patternId
              ? `#pattern-${part.reviewRef.patternId}`
              : `#technique-${part.reviewRef.techniqueId}`
          }
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-300/90 hover:text-sky-200 transition-colors"
        >
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>נתקעת? חזור ל: {part.reviewRef.label}</span>
          <ArrowLeft className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
