'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Loader2,
  Lightbulb,
  KeyRound,
  CheckCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  BookMarked,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { MathText } from './MathText';
import { AITutorActions, type SimilarQuestionResult } from './AITutorActions';
import { markExerciseDone } from '@/lib/progress';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { sparkle, celebrateCompletion } from '@/lib/confetti';
import { fadeUp, staggerContainer, scaleIn, buttonTap } from '@/lib/animations';

type Exercise = {
  problem: string;
  concept: string;
  hints: string[];
  solution: { steps: string[] };
  final_answer: string;
  remember: string;
};

type Difficulty = 'easier' | 'normal' | 'harder';

export function QuickExerciseView({
  subject,
  topic,
  subjectLabel,
}: {
  subject: string;
  topic: string;
  subjectLabel: string;
}) {
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const [stepsShown, setStepsShown] = useState(-1);
  const [conceptOpen, setConceptOpen] = useState(false);
  const [doneMarked, setDoneMarked] = useState(false);

  async function load(d: Difficulty = difficulty) {
    setLoading(true);
    setError(null);
    setExercise(null);
    setHintsShown(0);
    setStepsShown(-1);
    setConceptOpen(false);
    setDifficulty(d);
    setDoneMarked(false);
    try {
      const res = await fetchWithTimeout('/api/practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, topic, difficulty: d }),
      });
      if (!res.ok) {
        let msg = '';
        try {
          const j = await res.json();
          msg = j?.error ?? '';
        } catch {
          msg = await res.text().catch(() => '');
        }
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as Exercise;
      setExercise(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load('normal');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inline replacement when the "Similar Question" tutor button returns
  // a fresh problem. We map the tutor response shape to the local
  // Exercise type and reset all reveal state so it feels like a new
  // exercise, but without re-fetching from /api/practice.
  function applySimilarQuestion(q: SimilarQuestionResult) {
    setExercise({
      problem: q.question,
      concept: '',
      hints: q.hint ? [q.hint] : [],
      solution: { steps: q.solution.steps },
      final_answer: q.solution.final_answer,
      remember: '',
    });
    setHintsShown(0);
    setStepsShown(-1);
    setConceptOpen(false);
    setDoneMarked(false);
  }

  if (loading) {
    return (
      <div className="space-y-3 py-10 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
        <div className="text-sm text-slate-400">מכין תרגיל…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-4 py-3">
          {error}
        </div>
        <button
          onClick={() => load(difficulty)}
          className="w-full inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-3 rounded-xl font-bold text-white text-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>נסה שוב</span>
        </button>
      </div>
    );
  }

  if (!exercise) return null;

  const onLastStep = stepsShown === exercise.solution.steps.length - 1;
  if (onLastStep && !doneMarked) {
    markExerciseDone(subject, topic);
    setDoneMarked(true);
    celebrateCompletion();
    toast.success('סיימת את התרגיל! 🎉', {
      description: 'כל הכבוד — עברת על כל הצעדים',
      duration: 3000,
    });
  }

  function revealHint() {
    setHintsShown((n) => {
      const next = Math.min(n + 1, exercise!.hints.length);
      sparkle();
      toast.info(`רמז ${next} מתוך ${exercise!.hints.length}`, {
        description: 'נסה לפתור עם הרמז לפני שתחשוף את הפתרון',
        duration: 2500,
      });
      return next;
    });
  }

  function revealSolution() {
    setStepsShown(0);
    toast.success('פתרון נחשף — צעד-אחר-צעד', { duration: 2000 });
  }

  function loadDifficulty(d: Difficulty) {
    const label = d === 'easier' ? '🟢 קל יותר' : d === 'harder' ? '🔴 מאתגר יותר' : '🟡 בינוני';
    toast.loading(`טוען תרגיל ${label}…`, { id: 'load-ex', duration: 1500 });
    load(d);
  }

  return (
    <div className="space-y-4">
      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 font-bold">
          {subjectLabel}
        </span>
        <span className="text-slate-500">•</span>
        <span className="text-slate-300">{topic}</span>
        <span className="text-slate-500">•</span>
        <span>
          {difficulty === 'easier' ? '🟢 קל' : difficulty === 'normal' ? '🟡 בינוני' : '🔴 מאתגר'}
        </span>
      </div>

      {/* Problem */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 chat-md"
      >
        <div className="text-xs font-black tracking-widest text-indigo-300 mb-3 uppercase flex items-center gap-2">
          <Target className="w-3.5 h-3.5" />
          <span>השאלה</span>
        </div>
        <div className="text-base sm:text-lg font-medium leading-relaxed text-white">
          <MathText>{exercise.problem}</MathText>
        </div>
      </motion.div>

      {/* Concept */}
      <details
        open={conceptOpen}
        onToggle={(e) => setConceptOpen((e.target as HTMLDetailsElement).open)}
        className="surface-premium rounded-2xl overflow-hidden"
      >
        <summary className="cursor-pointer px-4 py-3 flex items-center gap-2 text-sm text-slate-300 hover:bg-white/5 list-none">
          <BookMarked className="w-4 h-4 text-indigo-300" />
          <span className="flex-1 font-bold">איזה כלל זה בודק?</span>
          {conceptOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </summary>
        <div className="px-4 pb-4 chat-md text-sm text-slate-200">
          <MathText>{exercise.concept}</MathText>
        </div>
      </details>

      {/* Hints */}
      <AnimatePresence initial={false}>
        {hintsShown > 0 && (
          <motion.div
            key="hints-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {exercise.hints.slice(0, hintsShown).map((h, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="bg-amber-500/5 border border-amber-500/30 rounded-2xl px-4 py-3 chat-md"
              >
                <div className="text-[11px] font-black tracking-widest text-amber-300 mb-1.5 uppercase flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
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

      {hintsShown < exercise.hints.length && stepsShown < 0 && (
        <motion.button
          {...buttonTap}
          onClick={revealHint}
          className="w-full inline-flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 px-5 py-3 rounded-2xl font-bold text-amber-100 transition-colors"
        >
          <Lightbulb className="w-5 h-5" />
          <span>
            💡 {hintsShown === 0 ? 'תן לי רמז' : `רמז נוסף (${hintsShown + 1}/${exercise.hints.length})`}
          </span>
        </motion.button>
      )}

      {/* AI tutor: "step-by-step help" appears after all hints exhausted
          but before showing the full solution. Asks Claude to unpack the
          last hint without revealing the answer. */}
      {hintsShown === exercise.hints.length && stepsShown < 0 && exercise.hints.length > 0 && (
        <AITutorActions
          question={exercise.problem}
          hints={exercise.hints}
          show={{ hintHelp: true }}
        />
      )}

      {/* Solution */}
      <AnimatePresence initial={false}>
        {stepsShown >= 0 && (
          <motion.div
            key="solution"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
            className="bg-gradient-to-br from-indigo-600/10 to-indigo-600/10 border border-indigo-500/30 rounded-2xl p-5"
          >
            <div className="text-xs font-black tracking-widest text-indigo-300 mb-3 uppercase flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5" />
              <span>פתרון</span>
            </div>
            <ol className="space-y-3">
              {exercise.solution.steps.slice(0, stepsShown + 1).map((step, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="flex gap-3"
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/30 border border-indigo-400/50 flex items-center justify-center text-xs font-black text-indigo-100">
                    {i + 1}
                  </div>
                  <div className="flex-1 chat-md text-sm text-slate-100 pt-0.5">
                    <MathText>{step}</MathText>
                  </div>
                </motion.li>
              ))}
            </ol>

            {!onLastStep ? (
              <motion.button
                {...buttonTap}
                onClick={() => setStepsShown((n) => n + 1)}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 px-4 py-2.5 rounded-xl font-bold text-indigo-100 text-sm transition-colors"
              >
                <span>הצעד הבא ({stepsShown + 2}/{exercise.solution.steps.length})</span>
                <ArrowLeft className="w-4 h-4" />
              </motion.button>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
                  className="mt-4 bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-4 py-3"
                >
                  <div className="text-[11px] font-black tracking-widest text-emerald-300 mb-1.5 uppercase flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>תשובה סופית</span>
                  </div>
                  <div className="text-sm sm:text-base font-bold text-emerald-50 chat-md">
                    <MathText inline>{exercise.final_answer}</MathText>
                  </div>
                </motion.div>
              {exercise.remember && (
                <div className="mt-3 bg-amber-500/8 border border-amber-500/30 rounded-xl px-4 py-3">
                  <div className="text-[11px] font-black tracking-widest text-amber-300 mb-1.5 uppercase">
                    💡 לזכור
                  </div>
                  <div className="text-sm text-amber-50/95 chat-md">
                    <MathText>{exercise.remember}</MathText>
                  </div>
                </div>
              )}

              {/* AI tutor: "explain simpler" + "similar question" after
                  the full solution is on screen. The first asks Claude
                  for a plain-Hebrew gloss; the second generates a new
                  exercise that REPLACES the current one inline. */}
              <AITutorActions
                question={exercise.problem}
                solution={exercise.solution.steps.join('\n') + '\n' + exercise.final_answer}
                topic={topic}
                difficulty={difficulty === 'easier' ? 'easy' : difficulty === 'harder' ? 'hard' : 'mid'}
                show={{ explainSimpler: true, similarQuestion: true }}
                onSimilarQuestion={applySimilarQuestion}
              />
            </>
          )}
          </motion.div>
        )}
      </AnimatePresence>

      {stepsShown < 0 && (
        <motion.button
          {...buttonTap}
          onClick={revealSolution}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 px-5 py-3 rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/30 transition-colors"
        >
          <KeyRound className="w-5 h-5" />
          <span>🔑 הראה לי את הפתרון</span>
        </motion.button>
      )}

      {onLastStep && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2"
        >
          <motion.button
            {...buttonTap}
            onClick={() => loadDifficulty(difficulty)}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-l from-indigo-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 px-4 py-3 rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/30 transition-colors text-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>תרגיל חדש</span>
          </motion.button>
          <motion.button
            {...buttonTap}
            onClick={() => loadDifficulty('easier')}
            className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 px-4 py-3 rounded-2xl font-bold text-emerald-200 text-sm transition-colors"
          >
            <span>🟢 קל יותר</span>
          </motion.button>
          <motion.button
            {...buttonTap}
            onClick={() => loadDifficulty('harder')}
            className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/40 px-4 py-3 rounded-2xl font-bold text-indigo-200 text-sm transition-colors"
          >
            <span>🔴 מאתגר יותר</span>
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
