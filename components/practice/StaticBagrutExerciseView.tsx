'use client';

import { useEffect, useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { MathText } from './MathText';
import { QuestionPartCard } from './QuestionPartCard';
import { markExerciseDone } from '@/lib/progress';
import { markStep } from '@/lib/study-plan';
import type { StaticBagrutQuestion } from '@/content/lessons/types';

type Props = {
  subject: string;
  topic: string;
  subjectLabel: string;
  /** Pre-fetched static bagrut questions for this topic. */
  questions: StaticBagrutQuestion[];
};

/**
 * StaticBagrutExerciseView — renders a random multi-part bagrut question
 * from the static bank. Reuses the existing `QuestionPartCard` (same
 * component the API-driven `BagrutQuestionView` uses), so every sub-part
 * gets the input box + 3 hints + step-by-step solution it already had.
 *
 * Zero API calls. Re-shuffles to a new question when "שאלה חדשה" clicked.
 */
export function StaticBagrutExerciseView({
  subject,
  topic,
  subjectLabel,
  questions,
}: Props) {
  const [pickedIndex, setPickedIndex] = useState<number>(() => pickRandom(questions.length));
  const [contextOpen, setContextOpen] = useState(true);
  const [partsDone, setPartsDone] = useState<Set<number>>(new Set());

  // Reset done-tracking each time we move to a new question.
  useEffect(() => {
    setPartsDone(new Set());
    setContextOpen(true);
  }, [pickedIndex]);

  if (questions.length === 0) {
    return (
      <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">
        אין כרגע שאלות בגרות מוכנות לנושא זה.
      </div>
    );
  }

  const current = questions[pickedIndex];

  function newQuestion() {
    if (questions.length === 1) {
      // Only one question — re-render the same one to reset its state.
      setPartsDone(new Set());
      setContextOpen(true);
      return;
    }
    // Pick any other index to guarantee variety on click.
    let next = pickedIndex;
    while (next === pickedIndex) next = pickRandom(questions.length);
    setPickedIndex(next);
  }

  function onPartDone(i: number, total: number) {
    setPartsDone((prev) => {
      const updated = new Set(prev);
      updated.add(i);
      if (updated.size === total) {
        markExerciseDone(subject, topic);
        markStep(subject, topic, 'practice');
      }
      return updated;
    });
  }

  const difficultyLabel =
    current.difficulty === 'easy' ? '🟢 קל' :
    current.difficulty === 'mid' ? '🟡 בינוני' :
    '🔴 מאתגר';

  return (
    <div className="space-y-4">
      {/* Meta strip */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-200 font-bold">
          {subjectLabel}
        </span>
        <span className="text-slate-500">•</span>
        <span className="text-slate-300">{topic}</span>
        {current.topic_tag && (
          <>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{current.topic_tag}</span>
          </>
        )}
        <span className="text-slate-500">•</span>
        <span>{difficultyLabel}</span>
      </div>

      {/* Context (collapsible — long ones don't take over the screen) */}
      {current.context && current.context.trim().length > 0 && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
          <button
            onClick={() => setContextOpen((o) => !o)}
            className="w-full text-right px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
          >
            <div className="text-[10px] font-black tracking-widest text-purple-300 uppercase flex-1 text-right">
              נתוני השאלה
            </div>
            <div className="flex-shrink-0 text-slate-400">
              {contextOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
          {contextOpen && (
            <div className="px-5 pb-4 chat-md text-sm sm:text-base text-white leading-relaxed border-t border-white/5 pt-3">
              <MathText>{current.context}</MathText>
            </div>
          )}
        </div>
      )}

      {/* Parts — reusing QuestionPartCard handles input + hints + solution */}
      <div className="space-y-3">
        {current.parts.map((p, i) => (
          <QuestionPartCard
            // Reset card state when switching questions by including index in key.
            key={`${current.id}-${i}`}
            part={p}
            context={current.context}
            onDone={() => onPartDone(i, current.parts.length)}
          />
        ))}
      </div>

      {/* Footer actions */}
      <div className="grid grid-cols-1 gap-2 pt-2">
        <button
          onClick={newQuestion}
          className="inline-flex items-center justify-center gap-2 bg-gradient-to-l from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-4 py-3 rounded-2xl font-bold text-white shadow-lg shadow-purple-500/30 transition-all text-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>שאלה חדשה</span>
        </button>
        {questions.length > 1 && (
          <div className="text-[11px] text-slate-500 text-center">
            יש {questions.length} שאלות בגרות זמינות בנושא זה — מתחלפות בכל לחיצה.
          </div>
        )}
      </div>
    </div>
  );
}

function pickRandom(n: number): number {
  return Math.floor(Math.random() * n);
}
