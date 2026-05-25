'use client';

import { useEffect, useState } from 'react';
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
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-400" />
        <div className="text-sm text-slate-400">מכין תרגיל…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">
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
  }

  return (
    <div className="space-y-4">
      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-200 font-bold">
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
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 chat-md">
        <div className="text-xs font-black tracking-widest text-purple-300 mb-3 uppercase flex items-center gap-2">
          <Target className="w-3.5 h-3.5" />
          <span>השאלה</span>
        </div>
        <div className="text-base sm:text-lg font-medium leading-relaxed text-white">
          <MathText>{exercise.problem}</MathText>
        </div>
      </div>

      {/* Concept */}
      <details
        open={conceptOpen}
        onToggle={(e) => setConceptOpen((e.target as HTMLDetailsElement).open)}
        className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden"
      >
        <summary className="cursor-pointer px-4 py-3 flex items-center gap-2 text-sm text-slate-300 hover:bg-white/5 list-none">
          <BookMarked className="w-4 h-4 text-purple-300" />
          <span className="flex-1 font-bold">איזה כלל זה בודק?</span>
          {conceptOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </summary>
        <div className="px-4 pb-4 chat-md text-sm text-slate-200">
          <MathText>{exercise.concept}</MathText>
        </div>
      </details>

      {/* Hints */}
      {hintsShown > 0 && (
        <div className="space-y-2">
          {exercise.hints.slice(0, hintsShown).map((h, i) => (
            <div
              key={i}
              className="bg-amber-500/5 border border-amber-500/30 rounded-2xl px-4 py-3 chat-md"
            >
              <div className="text-[11px] font-black tracking-widest text-amber-300 mb-1.5 uppercase flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>רמז {i + 1}</span>
              </div>
              <div className="text-sm text-amber-50/95">
                <MathText>{h}</MathText>
              </div>
            </div>
          ))}
        </div>
      )}

      {hintsShown < exercise.hints.length && stepsShown < 0 && (
        <button
          onClick={() => setHintsShown((n) => Math.min(n + 1, exercise.hints.length))}
          className="w-full inline-flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 px-5 py-3 rounded-2xl font-bold text-amber-100 transition-all"
        >
          <Lightbulb className="w-5 h-5" />
          <span>
            💡 {hintsShown === 0 ? 'תן לי רמז' : `רמז נוסף (${hintsShown + 1}/${exercise.hints.length})`}
          </span>
        </button>
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
      {stepsShown >= 0 && (
        <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/30 rounded-2xl p-5">
          <div className="text-xs font-black tracking-widest text-purple-300 mb-3 uppercase flex items-center gap-2">
            <KeyRound className="w-3.5 h-3.5" />
            <span>פתרון</span>
          </div>
          <ol className="space-y-3">
            {exercise.solution.steps.slice(0, stepsShown + 1).map((step, i) => (
              <li key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-500/30 border border-purple-400/50 flex items-center justify-center text-xs font-black text-purple-100">
                  {i + 1}
                </div>
                <div className="flex-1 chat-md text-sm text-slate-100 pt-0.5">
                  <MathText>{step}</MathText>
                </div>
              </li>
            ))}
          </ol>

          {!onLastStep ? (
            <button
              onClick={() => setStepsShown((n) => n + 1)}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 px-4 py-2.5 rounded-xl font-bold text-purple-100 text-sm transition-all"
            >
              <span>הצעד הבא ({stepsShown + 2}/{exercise.solution.steps.length})</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <>
              <div className="mt-4 bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-4 py-3">
                <div className="text-[11px] font-black tracking-widest text-emerald-300 mb-1.5 uppercase flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>תשובה סופית</span>
                </div>
                <div className="text-sm sm:text-base font-bold text-emerald-50 chat-md">
                  <MathText inline>{exercise.final_answer}</MathText>
                </div>
              </div>
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
        </div>
      )}

      {stepsShown < 0 && (
        <button
          onClick={() => setStepsShown(0)}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-5 py-3 rounded-2xl font-bold text-white shadow-lg shadow-purple-500/30 transition-all"
        >
          <KeyRound className="w-5 h-5" />
          <span>🔑 הראה לי את הפתרון</span>
        </button>
      )}

      {onLastStep && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
          <button
            onClick={() => load(difficulty)}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-4 py-3 rounded-2xl font-bold text-white shadow-lg shadow-purple-500/30 transition-all text-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>תרגיל חדש</span>
          </button>
          <button
            onClick={() => load('easier')}
            className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 px-4 py-3 rounded-2xl font-bold text-emerald-200 text-sm transition-all"
          >
            <span>🟢 קל יותר</span>
          </button>
          <button
            onClick={() => load('harder')}
            className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-rose-500/40 px-4 py-3 rounded-2xl font-bold text-rose-200 text-sm transition-all"
          >
            <span>🔴 מאתגר יותר</span>
          </button>
        </div>
      )}
    </div>
  );
}
