'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Timer,
  Play,
  Flag,
  CheckCircle,
  MinusCircle,
  Trophy,
  RotateCcw,
  Medal,
} from 'lucide-react';
import type { FinalSimulation } from '@/content/advanced-courses/types';
import { MathText } from '@/components/practice/MathText';
import { DiagramRenderer } from '@/components/practice/DiagramRenderer';
import { buttonTap } from '@/lib/animations';
import { celebrateCompletion } from '@/lib/confetti';

type Phase = 'brief' | 'running' | 'review';

/**
 * ExamSimulation — the final gate (§7): one full question in exam mode.
 * Countdown timer, NO hints, answers written like in the real exam, and
 * the solutions + rubric revealed only when the student finishes (or time
 * runs out). Self-judged pass marks the topic as mastered.
 */
export function ExamSimulation({
  simulation,
  passed,
  onPassed,
}: {
  simulation: FinalSimulation;
  passed: boolean;
  onPassed: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('brief');
  const [secondsLeft, setSecondsLeft] = useState(simulation.timeLimitMinutes * 60);
  const [timedOut, setTimedOut] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const q = simulation.question;
  const totalSeconds = simulation.timeLimitMinutes * 60;

  // Countdown loop — only while running.
  useEffect(() => {
    if (phase !== 'running') return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // Time's up — reveal solutions.
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimedOut(true);
          setPhase('review');
          toast.error('הזמן נגמר — הפתרונות נחשפים', { duration: 3000 });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  function start() {
    setSecondsLeft(totalSeconds);
    setTimedOut(false);
    setAnswers({});
    setPhase('running');
  }

  function finish() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('review');
  }

  function restart() {
    setPhase('brief');
    setSecondsLeft(totalSeconds);
    setTimedOut(false);
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const lowTime = secondsLeft <= totalSeconds * 0.2;

  // ===== Phase: brief =====
  if (phase === 'brief') {
    return (
      <div className="space-y-3">
        {passed && (
          <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl px-4 py-3 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-700 flex-shrink-0" />
            <div className="text-sm text-emerald-900">
              <span className="font-bold">עברת את הסימולציה — הנושא הושלם ברמת בגרות. </span>
              אפשר לחזור עליה מתי שרוצים.
            </div>
          </div>
        )}
        <div className="surface-premium rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <Timer className="w-5 h-5 text-indigo-700" />
            <div className="text-sm font-black text-slate-900">מצב בחינה</div>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed chat-md">
            <MathText inline>{simulation.brief}</MathText>
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 surface-premium rounded-full px-2.5 py-1">
              <Timer className="w-3.5 h-3.5" />
              {simulation.timeLimitMinutes} דקות
            </span>
            <span className="inline-flex items-center gap-1 surface-premium rounded-full px-2.5 py-1">
              <Medal className="w-3.5 h-3.5 text-amber-700" />
              {q.totalPoints} נקודות
            </span>
            <span className="inline-flex items-center gap-1 surface-premium rounded-full px-2.5 py-1">
              בלי רמזים
            </span>
          </div>
          <motion.button
            {...buttonTap}
            onClick={start}
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 px-5 py-3 rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/30 transition-colors"
          >
            <Play className="w-5 h-5" />
            <span>{passed ? 'התחל שוב' : 'התחל סימולציה'}</span>
          </motion.button>
        </div>
      </div>
    );
  }

  // ===== Phases: running / review =====
  return (
    <div className="space-y-3">
      {/* Timer bar */}
      <div
        className={`sticky top-16 z-20 backdrop-blur-md border rounded-2xl px-4 py-2.5 flex items-center gap-3 ${
          phase === 'review'
            ? 'bg-[#FDFDFB]/90 border-slate-900/10'
            : lowTime
              ? 'bg-indigo-50/90 border-indigo-500/50'
              : 'bg-[#FDFDFB]/90 border-slate-900/[0.12]'
        }`}
      >
        <Timer className={`w-4 h-4 ${lowTime && phase === 'running' ? 'text-indigo-700' : 'text-slate-700'}`} />
        <span
          className={`font-mono text-lg font-black tabular-nums ${
            phase === 'review' ? 'text-slate-600' : lowTime ? 'text-indigo-800' : 'text-slate-900'
          }`}
          dir="ltr"
        >
          {mm}:{ss}
        </span>
        <div className="flex-1 h-1.5 bg-slate-900/5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${lowTime ? 'bg-indigo-500' : 'bg-indigo-500'}`}
            style={{ width: `${(secondsLeft / totalSeconds) * 100}%` }}
          />
        </div>
        {phase === 'running' && (
          <motion.button
            {...buttonTap}
            onClick={finish}
            className="inline-flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 px-3 py-1.5 rounded-lg font-bold text-emerald-800 text-xs transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>סיימתי</span>
          </motion.button>
        )}
      </div>

      {timedOut && phase === 'review' && (
        <div className="bg-indigo-500/10 border border-indigo-500/40 rounded-xl px-4 py-2.5 text-sm text-indigo-800 font-bold">
          הזמן נגמר. בבחינה אמיתית זה הרגע לעבור לשאלה הבאה — עכשיו השווה למחוון.
        </div>
      )}

      {/* Question */}
      <div className="bg-slate-900/[0.03] border border-slate-900/10 rounded-xl px-4 py-3 chat-md text-sm text-slate-900 leading-relaxed">
        <MathText>{q.context}</MathText>
      </div>
      {q.diagrams && q.diagrams.length > 0 && <DiagramRenderer diagrams={q.diagrams} />}

      {/* Parts */}
      <div className="space-y-2.5">
        {q.parts.map((part) => (
          <div key={part.label} className="surface-premium rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-500 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-indigo-500/30">
                {part.label}
              </div>
              <div className="flex-1 chat-md text-sm sm:text-base text-slate-900 leading-relaxed pt-0.5">
                <MathText>{part.prompt}</MathText>
              </div>
              <span className="flex-shrink-0 text-[11px] font-black text-amber-800 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg">
                {part.points} נק׳
              </span>
            </div>

            <textarea
              value={answers[part.label] ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [part.label]: e.target.value }))}
              placeholder="התשובה שלך (או פתור על דף)…"
              rows={2}
              dir="auto"
              disabled={phase === 'review'}
              className="w-full bg-slate-900/[0.04] border border-slate-900/10 focus:border-indigo-500/60 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition-colors resize-y disabled:opacity-60"
            />

            {/* Solutions — review phase only */}
            <AnimatePresence initial={false}>
              {phase === 'review' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  style={{ overflow: 'hidden' }}
                  className="space-y-2.5"
                >
                  <div className="bg-gradient-to-br from-indigo-600/10 to-indigo-600/10 border border-indigo-500/30 rounded-xl p-3.5">
                    <div className="text-[10px] font-black tracking-widest text-indigo-700 mb-2 uppercase">
                      פתרון סעיף {part.label}
                    </div>
                    <ol className="space-y-2">
                      {part.solution.steps.map((step, i) => (
                        <li key={i} className="flex gap-2.5">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/25 border border-indigo-400/40 flex items-center justify-center text-[11px] font-black text-indigo-800">
                            {i + 1}
                          </div>
                          <div className="flex-1 chat-md text-sm text-slate-800 pt-0.5">
                            <MathText>{step}</MathText>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-2.5 bg-emerald-500/10 border border-emerald-500/40 rounded-lg px-3 py-2">
                      <div className="text-[10px] font-black tracking-widest text-emerald-700 mb-1 uppercase flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3" />
                        <span>תשובה סופית</span>
                      </div>
                      <div className="text-sm font-bold text-emerald-900 chat-md">
                        <MathText inline>{part.solution.finalAnswer}</MathText>
                      </div>
                    </div>
                  </div>
                  <div className="bg-indigo-500/5 border border-indigo-500/25 rounded-xl px-3 py-2.5">
                    <div className="text-[10px] font-black tracking-widest text-indigo-700 uppercase flex items-center gap-1.5 mb-1.5">
                      <MinusCircle className="w-3 h-3" />
                      <span>מחוון ({part.points} נק׳)</span>
                    </div>
                    <ul className="space-y-1">
                      {part.deductions.map((d, i) => (
                        <li key={i} className="flex gap-2 text-xs text-indigo-900 leading-relaxed">
                          <span className="text-indigo-700 flex-shrink-0 mt-0.5">−</span>
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
          </div>
        ))}
      </div>

      {/* Self-judgment — review phase */}
      {phase === 'review' && (
        <div className="surface-premium rounded-2xl p-4 space-y-3 text-center">
          <div className="text-sm font-black text-slate-900">
            עבור על המחוון וגרד את עצמך בכנות: צברת לפחות {Math.ceil(q.totalPoints * 0.8)} מתוך{' '}
            {q.totalPoints} נקודות?
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <motion.button
              {...buttonTap}
              onClick={() => {
                celebrateCompletion();
                toast.success('הנושא הושלם ברמת בגרות! 🎓', { duration: 3000 });
                onPassed();
                setPhase('brief');
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-l from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-3 rounded-2xl font-bold text-white shadow-lg shadow-emerald-500/30 transition-colors"
            >
              <Trophy className="w-4 h-4" />
              <span>עברתי — סמן את הנושא כהושלם</span>
            </motion.button>
            <motion.button
              {...buttonTap}
              onClick={restart}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900/[0.03] hover:bg-slate-900/5 border border-slate-900/10 px-4 py-3 rounded-2xl font-bold text-slate-900 text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>עוד לא — אנסה שוב אחר כך</span>
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
