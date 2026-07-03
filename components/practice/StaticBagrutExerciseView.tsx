'use client';

import { useEffect, useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { MathText } from './MathText';
import { QuestionPartCard } from './QuestionPartCard';
import { markExerciseDone } from '@/lib/progress';
import { markStep } from '@/lib/study-plan';
import { buttonTap } from '@/lib/animations';
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
      <div className="text-sm text-indigo-700 bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-4 py-3">
        אין כרגע שאלות בגרות מוכנות לנושא זה.
      </div>
    );
  }

  const current = questions[pickedIndex];

  function newQuestion() {
    if (questions.length === 1) {
      // Only one bagrut question — reset state and notify the student.
      setPartsDone(new Set());
      setContextOpen(true);
      toast.info('זו השאלה היחידה בנושא הזה', {
        description: 'אפסנו את התרגיל. עוד שאלות בגרות יתווספו בקרוב — בינתיים נסה את "תרגול מהיר" לעוד תרגילים.',
        duration: 4000,
      });
      return;
    }
    // Pick any other index to guarantee variety on click.
    let next = pickedIndex;
    while (next === pickedIndex) next = pickRandom(questions.length);
    setPickedIndex(next);
    toast.success('שאלה חדשה נטענה!', {
      description: `נשארו עוד ${questions.length - 1} שאלות שונות בנושא`,
      duration: 2000,
    });
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
        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-800 font-bold">
          {subjectLabel}
        </span>
        <span className="text-slate-500">•</span>
        <span className="text-slate-700">{topic}</span>
        {current.topic_tag && (
          <>
            <span className="text-slate-500">•</span>
            <span className="text-slate-600">{current.topic_tag}</span>
          </>
        )}
        <span className="text-slate-500">•</span>
        <span>{difficultyLabel}</span>
      </div>

      {/* Context (collapsible — long ones don't take over the screen) */}
      {current.context && current.context.trim().length > 0 && (
        <div className="bg-slate-900/[0.03] backdrop-blur-md border border-slate-900/10 rounded-2xl overflow-hidden">
          <button
            onClick={() => setContextOpen((o) => !o)}
            className="w-full text-right px-5 py-3 flex items-center gap-3 hover:bg-slate-900/[0.02] transition-colors"
          >
            <div className="text-[10px] font-black tracking-widest text-indigo-700 uppercase flex-1 text-right">
              נתוני השאלה
            </div>
            <div className="flex-shrink-0 text-slate-600">
              {contextOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
          {contextOpen && (
            <div className="px-5 pb-4 chat-md text-sm sm:text-base text-slate-900 leading-relaxed border-t border-slate-900/[0.06] pt-3">
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
            topic={topic}
            onDone={() => onPartDone(i, current.parts.length)}
          />
        ))}
      </div>

      {/* Footer actions */}
      <div className="grid grid-cols-1 gap-2 pt-2">
        <motion.button
          {...buttonTap}
          onClick={newQuestion}
          className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-slate-900 shadow-lg transition-colors text-sm ${
            questions.length > 1
              ? 'bg-gradient-to-l from-indigo-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 shadow-indigo-500/30'
              : 'bg-slate-900/5 hover:bg-slate-900/[0.06] border border-slate-900/15 shadow-white/5'
          }`}
        >
          {questions.length > 1 ? (
            <>
              <Sparkles className="w-4 h-4" />
              <span>שאלה חדשה</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>אפס תרגיל</span>
            </>
          )}
        </motion.button>
        {questions.length > 1 ? (
          <div className="text-[11px] text-slate-500 text-center">
            יש {questions.length} שאלות בגרות זמינות בנושא זה — מתחלפות בכל לחיצה.
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 text-center">
            יש כרגע שאלת בגרות אחת בנושא — לחיצה תאפס את ההתקדמות כדי לפתור מחדש. עוד שאלות בדרך.
          </div>
        )}
      </div>
    </div>
  );
}

function pickRandom(n: number): number {
  return Math.floor(Math.random() * n);
}
