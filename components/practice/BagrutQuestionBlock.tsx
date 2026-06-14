'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MathText } from './MathText';
import { QuestionPartCard } from './QuestionPartCard';
import type { StaticBagrutQuestion } from '@/content/lessons/types';

/**
 * BagrutQuestionBlock — renders ONE static bagrut question: a collapsible
 * "given" context plus its sub-parts via QuestionPartCard (which carries the
 * deterministic answer-checker + the grounded AI tutor). This is the
 * bagrut-level top of a sub-topic module's escalating practice — the same
 * multi-part experience the topic-level bagrut bank uses, scoped to one
 * sub-topic.
 */
export function BagrutQuestionBlock({
  question,
  topic,
  onPartDone,
}: {
  question: StaticBagrutQuestion;
  topic: string;
  onPartDone?: (index: number, total: number) => void;
}) {
  const [contextOpen, setContextOpen] = useState(true);
  const hasContext = !!question.context && question.context.trim().length > 0;

  return (
    <div className="space-y-3">
      {hasContext && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
          <button
            onClick={() => setContextOpen((o) => !o)}
            className="w-full text-right px-5 py-3 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
          >
            <div className="text-[10px] font-black tracking-widest text-indigo-300 uppercase flex-1 text-right">
              נתוני השאלה
            </div>
            <div className="flex-shrink-0 text-slate-400">
              {contextOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>
          {contextOpen && (
            <div className="px-5 pb-4 chat-md text-sm sm:text-base text-white leading-relaxed border-t border-white/5 pt-3">
              <MathText>{question.context}</MathText>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        {question.parts.map((p, i) => (
          <QuestionPartCard
            key={`${question.id}-${i}`}
            part={p}
            context={question.context}
            topic={topic}
            onDone={() => onPartDone?.(i, question.parts.length)}
          />
        ))}
      </div>
    </div>
  );
}
